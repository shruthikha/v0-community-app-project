import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ThreadStore } from "../lib/thread-store";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { randomUUID } from "crypto";

const connectionString = process.env.RIO_DATABASE_URL;

if (!connectionString) {
    throw new Error("RIO_DATABASE_URL is required for tests.");
}

describe("S0.4: Multi-Tenant Thread Isolation", () => {
    let memory: Memory;
    let store: ThreadStore;

    beforeAll(() => {
        memory = new Memory({
            storage: new PostgresStore({
                id: "rio-test-store",
                connectionString,
            }),
        });
        store = new ThreadStore(memory);
    });

    afterAll(async () => {
        // Cleanup not strictly necessary for this test as we generate random UUIDs for threads,
        // but typically we'd purge test data.
    });

    it("prevents Thread B from accessing Thread A context", async () => {
        const tenantA = `tenant-A-${randomUUID()}`;
        const tenantB = `tenant-B-${randomUUID()}`;

        const threadA_Id = `thread-A-${randomUUID()}`;
        const threadB_Id = `thread-B-${randomUUID()}`;

        // 1. Create Thread A under Tenant A
        const createdThreadA = await store.createThread({
            threadId: threadA_Id,
            resourceId: "test-resource",
            tenantId: tenantA,
            userId: "userA",
        });

        // Save messages directly to Mastra memory using the namespaced ID
        const namespacedThreadA = store.generateTenantThreadId(tenantA, threadA_Id);
        await memory.saveMessages({
            messages: [
                { id: "msg1", threadId: namespacedThreadA, resourceId: "test-resource", role: "user", content: "Message 1 for Tenant A" } as any,
                { id: "msg2", threadId: namespacedThreadA, resourceId: "test-resource", role: "user", content: "Message 2 for Tenant A" } as any,
                { id: "msg3", threadId: namespacedThreadA, resourceId: "test-resource", role: "user", content: "Message 3 for Tenant A" } as any,
            ]
        });

        // 2. Create Thread B under Tenant B
        const createdThreadB = await store.createThread({
            threadId: threadB_Id,
            resourceId: "test-resource",
            tenantId: tenantB,
            userId: "userB",
        });

        const namespacedThreadB = store.generateTenantThreadId(tenantB, threadB_Id);
        await memory.saveMessages({
            messages: [
                { id: "msg4", threadId: namespacedThreadB, resourceId: "test-resource", role: "user", content: "Message 1 for Tenant B" } as any,
                { id: "msg5", threadId: namespacedThreadB, resourceId: "test-resource", role: "user", content: "Message 2 for Tenant B" } as any,
                { id: "msg6", threadId: namespacedThreadB, resourceId: "test-resource", role: "user", content: "Message 3 for Tenant B" } as any,
            ]
        });

        // 3. Resume Thread A — assert Tenant B messages never appear
        const resumedThreadA = await store.getThreadById(tenantA, threadA_Id);
        expect(resumedThreadA).not.toBeNull();
        expect(resumedThreadA?.metadata?.tenantId).toBe(tenantA);

        const threadAMessages = await store.getMessages(tenantA, threadA_Id);
        expect(threadAMessages.length).toBe(3);
        const textA = JSON.stringify(threadAMessages);
        expect(textA).toContain("Tenant A");
        expect(textA).not.toContain("Tenant B");

        // 4. Resume Thread B — assert Tenant A messages never appear
        const resumedThreadB = await store.getThreadById(tenantB, threadB_Id);
        expect(resumedThreadB).not.toBeNull();
        expect(resumedThreadB?.metadata?.tenantId).toBe(tenantB);

        const threadBMessages = await store.getMessages(tenantB, threadB_Id);
        expect(threadBMessages.length).toBe(3);
        const textB = JSON.stringify(threadBMessages);
        expect(textB).toContain("Tenant B");
        expect(textB).not.toContain("Tenant A");

        // 5. Assert isolation: Tenant B attempts to read Thread A
        const unauthorizedAccess = await store.getThreadById(tenantB, threadA_Id);
        expect(unauthorizedAccess).toBeNull();
    }, 30000);
});
