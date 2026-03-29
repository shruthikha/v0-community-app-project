import { Memory } from "@mastra/memory";

import { pool } from "./db.js";

export class ThreadStore {
    constructor(private memory: Memory) { }

    /**
     * M9: RLS Session Initialization
     * Ensures that the database connection has the correct tenant and user context.
     */
    /**
     * M9: RLS Session Initialization
     * CAUTION: Due to connection pooling, this must be called immediately before
     * any database operation on the same client.
     */
    private async initRls(tenantId: string, userId?: string) {
        if (!tenantId) return;
        try {
            // We use the pool to set session variables. 
            // NOTE: In a pooled environment, this is only reliable if the subsequent 
            // operation is guaranteed to use the same connection or if we use a dedicated client.
            await pool.query(`
                SET LOCAL app.current_tenant = ${JSON.stringify(tenantId)};
                ${userId ? `SET LOCAL app.current_user = ${JSON.stringify(userId)};` : ""}
            `);
        } catch (err) {
            console.error("[RIO-THREADSTORE] RLS init failed:", err);
            throw new Error(`Failed to initialize security context for tenant ${tenantId}`);
        }
    }

    /**
     * Enforces that all thread IDs include the tenantId as a prefix.
     */
    public generateTenantThreadId(tenantId: string, baseThreadId: string): string {
        const prefix = `${tenantId}:`;
        if (baseThreadId.startsWith(prefix)) {
            return baseThreadId;
        }
        return `${prefix}${baseThreadId}`;
    }

    /**
     * Creates a thread and strictly enforces the tenant ID in its metadata.
     */
    async createThread({
        threadId,
        resourceId,
        tenantId,
        userId,
    }: {
        threadId: string;
        resourceId: string;
        tenantId: string;
        userId?: string;
    }) {
        if (!tenantId) throw new Error("tenantId is required to create a thread.");

        const namespacedThreadId = this.generateTenantThreadId(tenantId, threadId);
        await this.initRls(tenantId, userId);

        return this.memory.createThread({
            threadId: namespacedThreadId,
            resourceId,
            metadata: { tenantId, userId, accessMode: "tenant_isolated" },
        });
    }

    /**
     * Retrieves a thread by ID, enforcing that the requested tenantId matches the stored metadata.
     * Optionally verifies ownership via userId.
     */
    async getThreadById(tenantId: string, threadId: string, userId?: string) {
        if (!tenantId) throw new Error("tenantId is required to fetch a thread.");

        const namespacedThreadId = this.generateTenantThreadId(tenantId, threadId);
        await this.initRls(tenantId, userId);
        const thread = await this.memory.getThreadById({ threadId: namespacedThreadId });

        if (!thread) return null;

        // Backend-First Auth: Defense in Depth
        const storedTenantId = thread?.metadata?.tenantId;
        if (storedTenantId && storedTenantId !== tenantId) {
            throw new Error(`403 Forbidden: Thread isolated to tenant ${storedTenantId}. Request from tenant ${tenantId} denied.`);
        }

        // Ownership Verification (Sprint 12 Hardening)
        const storedUserId = thread?.metadata?.userId;
        if (userId && storedUserId && storedUserId !== userId) {
            console.error(`[ThreadStore] Ownership mismatch: Thread ${threadId} requested by ${userId} but owned by ${storedUserId}`);
            return null;
        }

        return thread;
    }

    /**
     * Updates thread metadata while preserving tenant isolation.
     */
    async updateThread(tenantId: string, threadId: string, updates: Parameters<Memory["updateThread"]>[0]) {
        const thread = await this.getThreadById(tenantId, threadId);
        if (!thread) throw new Error(`Thread not found or forbidden: ${threadId}`);

        const newMetadata = {
            ...thread.metadata,
            ...updates.metadata,
            tenantId, // Ensure tenantId cannot be overwritten by updates
            accessMode: "tenant_isolated"
        };

        return this.memory.updateThread({
            ...updates,
            id: thread.id,
            metadata: newMetadata
        });
    }

    /**
      * Gets messages for a thread, enforcing tenant isolation.
      */
    async getMessages(tenantId: string, threadId: string, userId?: string) {
        // First verify ownership
        const thread = await this.getThreadById(tenantId, threadId, userId);
        if (!thread) return [];

        const namespacedThreadId = this.generateTenantThreadId(tenantId, threadId);
        await this.initRls(tenantId, userId);
        const result = await this.memory.recall({ threadId: namespacedThreadId });

        // Ensure chronological order
        return [...result.messages].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
        });
    }

    async saveMessages(tenantId: string, threadId: string, messages: any[], userId?: string) {
        // Verify ownership before saving
        const thread = await this.getThreadById(tenantId, threadId, userId);
        if (!thread) throw new Error("Forbidden: Thread ownership mismatch");

        const namespacedThreadId = this.generateTenantThreadId(tenantId, threadId);
        await this.initRls(tenantId, userId);
        const messagesWithMetadata = messages.map(m => ({
            id: m.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            ...m,
            threadId: namespacedThreadId,
            resourceId: thread.resourceId
        }));
        return this.memory.saveMessages({ messages: messagesWithMetadata });
    }
}
