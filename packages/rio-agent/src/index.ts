import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { rioAgent } from "./agents/rio-agent";
import { ThreadStore } from "./lib/thread-store";
import { pool } from "./lib/db";
import { RequestContext } from "@mastra/core/request-context";
import { supabaseAdmin } from "./lib/supabase";
import { createHash } from 'node:crypto';
import { ingestionWorkflow } from "./workflows/ingest";
import { memory, storage, vectorStore } from "./lib/memory.js";
import { parseWorkingMemory, removeFactByIndex, formatWorkingMemory, updateFactAtIndex } from "./lib/memory-utils";
import { redactHistoricalFact } from "./lib/forget-utils";
import { maskId } from "./lib/id-utils";
import { Memory } from "@mastra/memory";

/**
 * M12: Centralized helper to retrieve working memory with SQL fallback.
 * Ensures memories are not "stranded" if a thread context is missing.
 */
async function getResidentWorkingMemory(userId: string, memory: Memory, threadId?: string): Promise<string | null> {
    let workingMemory: string | null = null;

    try {
        // Try Mastra first
        if (threadId) {
            workingMemory = await memory.getWorkingMemory({ threadId, resourceId: userId });
        } else {
            // resourceId-only retrieval (Mastra v1.x fallback)
            workingMemory = await (memory as any).getWorkingMemory({ resourceId: userId });
        }
        if (workingMemory) {
            console.log(`[RIO-AGENT] Working memory found via Mastra (thread: ${maskId(threadId) || 'resource-only'})`);
        }
    } catch (err) {
        console.warn(`[RIO-AGENT] Mastra getWorkingMemory failed: ${(err as any).message}. Attempting SQL fallback...`);
    }

    // SQL Fallback: Essential for memories created/scoped without an active thread
    if (!workingMemory) {
        const dbResult = await pool.query(
            `SELECT "workingMemory" FROM public.mastra_resources WHERE id = $1`,
            [userId]
        );
        workingMemory = dbResult.rows[0]?.workingMemory || null;
        if (workingMemory) console.log("[RIO-AGENT] Working memory retrieved via direct SQL fallback");
    }

    return workingMemory;
}

/**
 * M12: Centralized helper to save working memory with SQL fallback.
 * Updates Mastra (if threadId is present) and/or public.mastra_resources directly.
 */
async function saveResidentWorkingMemory(userId: string, workingMemory: string, memory: Memory, threadId?: string) {
    if (threadId) {
        await memory.updateWorkingMemory({
            threadId,
            resourceId: userId,
            workingMemory
        });
        console.log(`[RIO-AGENT] Working memory updated via Mastra (thread: ${maskId(threadId)})`);
    } else {
        // Direct SQL Update: Ensures state persistence when no active thread exists.
        // We sync updatedAt/updatedAtZ to maintain schema compatibility.
        await pool.query(
            `UPDATE public.mastra_resources 
             SET "workingMemory" = $1, "updatedAt" = NOW(), "updatedAtZ" = NOW() 
             WHERE id = $2`,
            [workingMemory, userId]
        );
        console.log(`[RIO-AGENT] Working memory updated via direct SQL (resource-scoped)`);
    }
}


/**
 * Generates a SHA-256 hash of a string.
 */
export function sha256(data: string): string {
    if (!data) return '';
    return createHash('sha256').update(data).digest('hex');
}

// Load env vars
function requireEnv(name: string): string {
    const val = process.env[name];
    if (!val) throw new Error(`Missing environment variable: ${name}`);
    return val;
}

const rioAgentKey = requireEnv("RIO_AGENT_KEY");
const RIO_MODEL_ID = process.env.RIO_MODEL_ID || "google/gemini-2.5-flash";

// Memory and Storage are now imported from ./lib/memory.ts


const ChatBodySchema = z.object({
    messages: z.array(z.any()).nullish(), // Optional for hydration/creation calls
    threadId: z.string().nullish(),
    resourceId: z.string().nullish(),
});

function updateDocStatus(id: string, status: string, error?: string) {
    return supabaseAdmin
        .from("rio_documents")
        .update({ status, error_message: error, updated_at: new Date().toISOString() })
        .eq("id", id);
}

export const app = new Mastra({
    agents: { rioAgent },
    workflows: { ingest: ingestionWorkflow },
    storage,
    vectors: { main: vectorStore },
    memory: { main: memory },
    server: {
        port: Number(process.env.PORT) || 3001,
        host: "0.0.0.0",
        apiRoutes: [
            registerApiRoute("/health", {
                method: "GET",
                requiresAuth: false,
                handler: async (c) => c.json({ status: "ok" }),
            }),
            registerApiRoute("/threads/active", {
                method: "GET",
                requiresAuth: true,
                handler: async (c) => {
                    try {
                        const userId = c.req.query("userId") || c.req.header("x-user-id");
                        const tenantId = c.req.query("tenantId") || c.req.header("x-tenant-id");

                        if (!userId || !tenantId) return c.json({ error: "Missing userId or tenantId" }, 400);

                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) {
                            console.warn(`[RIO-AGENT] 401 Unauthorized on /threads/active`);
                            return c.json({ error: "Unauthorized" }, 401);
                        }

                        // Initialize RLS context for the pooled connection
                        await threadStore.initRls(tenantId, userId);

                        const result = await pool.query(
                            `SELECT id FROM mastra_threads 
                             WHERE metadata->>'userId' = $1 
                             AND metadata->>'tenantId' = $2
                             ORDER BY updated_at DESC LIMIT 1`,
                            [userId, tenantId]
                        );

                        return c.json({ threadId: result.rows[0]?.id || null });
                    } catch (error) {
                        console.error("[RIO-AGENT] Active thread lookup error:", error);
                        return c.json({ error: "Internal Server Error" }, 500);
                    }
                },
            }),
            registerApiRoute("/threads/new", {
                method: "POST",
                requiresAuth: true,
                handler: async (c) => {
                    try {
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) return c.json({ error: "Unauthorized" }, 401);

                        const tenantId = c.req.header("x-tenant-id");
                        const userId = c.req.header("x-user-id");

                        if (!tenantId || !userId) return c.json({ error: "Missing tenantId or userId in headers" }, 400);

                        const threadId = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

                        await threadStore.createThread({
                            threadId,
                            resourceId: userId, // M1: userId is the resourceId
                            tenantId,
                            userId,
                        });

                        console.log(`[RIO-AGENT] Server-driven thread created: ${maskId(threadId)} for user ${maskId(userId)}`);
                        return c.json({ threadId });
                    } catch (error: any) {
                        console.error("[RIO-AGENT] Thread creation error:", error);
                        return c.json({ error: error.message }, 500);
                    }
                },
            }),
            registerApiRoute("/threads/messages", {
                method: "GET",
                requiresAuth: true,
                handler: async (c) => {
                    try {
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) return c.json({ error: "Unauthorized" }, 401);

                        const tenantId = c.req.header("x-tenant-id");
                        const userId = c.req.header("x-user-id");
                        const threadId = c.req.query("threadId");

                        if (!tenantId || !threadId || !userId) return c.json({ error: "Missing tenantId, threadId, or userId" }, 400);

                        const messages = await threadStore.getMessages(tenantId, threadId, userId);

                        // Limit to last 10 as per user request
                        const limitedMessages = messages.slice(-10);

                        return c.json({ messages: limitedMessages });
                    } catch (error: any) {
                        console.error("[RIO-AGENT] Message hydration error:", error);
                        return c.json({ error: error.message }, 500);
                    }
                },
            }),
            registerApiRoute("/memories", {
                method: "GET",
                requiresAuth: true,
                handler: async (c) => {
                    try {
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) return c.json({ error: "Unauthorized" }, 401);

                        const userId = c.req.header("x-user-id");
                        const tenantId = c.req.header("x-tenant-id");
                        if (!userId || !tenantId) return c.json({ error: "Missing x-user-id or x-tenant-id in headers" }, 400);

                        // Initialize RLS context for the pooled connection
                        await threadStore.initRls(tenantId, userId);

                        // M7/M12: Retrieve memories using the hardened helper with fallback
                        const threads = await memory.listThreads({
                            filter: { resourceId: userId },
                            perPage: 1,
                        });
                        const threadId = threads.threads[0]?.id;

                        const workingMemory = await getResidentWorkingMemory(userId, memory, threadId);
                        const facts = parseWorkingMemory(workingMemory);
                        console.log(`[RIO-AGENT] Returning ${facts.length} facts to UI for user ${maskId(userId)}`);

                        return c.json({ facts, threadId: threadId || null });
                    } catch (error: any) {
                        console.error("[RIO-AGENT] Memory fetch error:", error);
                        return c.json({ error: error.message }, 500);
                    }
                },
            }),
            registerApiRoute("/memories", {
                method: "PUT",
                requiresAuth: true,
                handler: async (c) => {
                    try {
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) return c.json({ error: "Unauthorized" }, 401);

                        const userId = c.req.header("x-user-id");
                        const tenantId = c.req.header("x-tenant-id");
                        if (!userId || !tenantId) return c.json({ error: "Missing x-user-id or x-tenant-id in headers" }, 400);

                        const { index, content } = await c.req.json();
                        if (index === undefined || content === undefined) {
                            return c.json({ error: "Missing index or content" }, 400);
                        }

                        // Initialize RLS context for the pooled connection
                        await threadStore.initRls(tenantId, userId);

                        const threads = await memory.listThreads({
                            filter: { resourceId: userId },
                            perPage: 1,
                        });
                        const threadId = threads.threads[0]?.id;

                        const workingMemory = await getResidentWorkingMemory(userId, memory, threadId);
                        const facts = parseWorkingMemory(workingMemory);
                        console.log(`[RIO-AGENT] Updating memory for user ${maskId(userId)}. Current facts: ${facts.length}`);

                        if (index >= 0 && index < facts.length) {
                            const updatedFacts = updateFactAtIndex(facts, index, content);
                            console.log(`[RIO-AGENT] Memory update successful for user ${maskId(userId)}. Resulting facts: ${updatedFacts.length}`);

                            await saveResidentWorkingMemory(userId, formatWorkingMemory(updatedFacts), memory, threadId);

                            return c.json({ status: "updated", index });
                        }

                        return c.json({ error: "Invalid index" }, 400);
                    } catch (error: any) {
                        console.error("[RIO-AGENT] Memory update error:", error);
                        return c.json({ error: error.message }, 500);
                    }
                },
            }),
            registerApiRoute("/memories", {
                method: "DELETE",
                requiresAuth: true,
                handler: async (c) => {
                    try {
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) return c.json({ error: "Unauthorized" }, 401);

                        const userId = c.req.header("x-user-id");
                        const tenantId = c.req.header("x-tenant-id");
                        if (!userId || !tenantId) return c.json({ error: "Missing x-user-id or x-tenant-id in headers" }, 400);

                        // Initialize RLS context for the pooled connection
                        await threadStore.initRls(tenantId, userId);

                        const all = c.req.query("all") === "true";
                        const indexString = c.req.query("index");

                        const threads = await memory.listThreads({
                            filter: { resourceId: userId },
                            perPage: 1,
                        });
                        const threadId = threads.threads[0]?.id;

                        if (all) {
                            console.log(`[RIO-AGENT] Wiping all memories for user ${maskId(userId)} (thread: ${maskId(threadId) || 'none'})`);
                            await saveResidentWorkingMemory(userId, "", memory, threadId);
                            return c.json({ status: "cleared" });
                        }

                        if (indexString !== undefined) {
                            const workingMemory = await getResidentWorkingMemory(userId, memory, threadId);
                            const facts = parseWorkingMemory(workingMemory);
                            const index = parseInt(indexString, 10);

                            if (!isNaN(index) && index >= 0 && index < facts.length) {
                                const factToDelete = facts[index];
                                const updatedFacts = removeFactByIndex(facts, index);
                                console.log(`[RIO-AGENT] Deleting memory index ${index} for user ${maskId(userId)}. Current facts: ${facts.length}`);

                                await saveResidentWorkingMemory(userId, formatWorkingMemory(updatedFacts), memory, threadId);

                                // M12: Durable historical pruning (Wait for completion)
                                try {
                                    console.log(`[RIO-AGENT] Pruning historical records for user ${maskId(userId)}...`);
                                    await redactHistoricalFact(factToDelete, userId, tenantId);
                                    console.log(`[RIO-AGENT] Historical pruning successful`);
                                } catch (err) {
                                    console.error(`[RIO-AGENT] Historical pruning failed for user ${maskId(userId)}:`, err);
                                }

                                return c.json({ status: "deleted", index });
                            }
                            return c.json({ error: "Invalid index" }, 400);
                        }

                        return c.json({ error: "Missing delete parameters" }, 400);
                    } catch (error: any) {
                        console.error("[RIO-AGENT] Memory deletion error:", error);
                        return c.json({ error: error.message }, 500);
                    }
                },
            }),
            registerApiRoute("/chat", {
                method: "POST",
                requiresAuth: true,
                handler: async (c) => {
                    console.log("[RIO-AGENT] START /chat request processing");
                    try {
                        // Auth Check
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) {
                            console.warn(`[RIO-AGENT] 401 Unauthorized: Invalid or missing x-agent-key on /chat request`);
                            return c.json({ error: "Unauthorized" }, 401);
                        }

                        console.log("[RIO-AGENT] Auth verified");

                        const rawBody = await c.req.json().catch(() => ({}));
                        const parsed = ChatBodySchema.safeParse(rawBody);
                        if (!parsed.success) {
                            console.warn("[RIO-AGENT] 400 Bad Request: Invalid schema", parsed.error.format());
                            return c.json({ error: "Invalid request body", details: parsed.error.format() }, 400);
                        }

                        const { messages, threadId, resourceId } = parsed.data;
                        const tenantId = c.req.header("x-tenant-id");
                        const userId = c.req.header("x-user-id");
                        const effectiveThreadId = (threadId || resourceId) as string;

                        if (!effectiveThreadId) {
                            console.warn("[RIO-AGENT] 400 Bad Request: Missing threadId or resourceId");
                            return c.json({ error: "threadId or resourceId is required" }, 400);
                        }

                        // Metadata Sync & Thread Ownership Verification (Unified in ThreadStore)
                        let thread;
                        try {
                            thread = await threadStore.getThreadById(tenantId as string, effectiveThreadId, userId as string);

                            if (!thread) {
                                // If threadId was provided but not found/owned, or if resourceId was provided but no thread exists, it's a security violation
                                // We no longer auto-create threads here to avoid "one-thread-per-user" legacy behavior.
                                // Users should call /threads/new explicitly.
                                console.error(`[RIO-AGENT] 403 Forbidden: Ownership mismatch or thread not found for ${maskId(effectiveThreadId)}`);
                                return c.json({ error: "Forbidden: You do not own this thread or it does not exist. Please create a thread first via /threads/new." }, 403);
                            }
                        } catch (e: any) {
                            console.error("[RIO-AGENT] Thread verification failed:", e);
                            return c.json({ error: e.message }, e.message.includes("Forbidden") ? 403 : 500);
                        }

                        const ragEnabledHeader = c.req.header("x-rag-enabled");
                        const isRagEnabled = ragEnabledHeader === "true";

                        // M4: Resident Context Injection (Tier 3)
                        const residentContextRaw = c.req.header("x-resident-context");
                        const residentContext = residentContextRaw ? Buffer.from(residentContextRaw, 'base64').toString('utf-8') : '';

                        // 3-Tier Prompt Composition
                        let systemPrompt = (rioAgent as any).instructions;
                        try {
                            const { data: config, error: configError } = await supabaseAdmin
                                .from("rio_configurations")
                                .select("prompt_persona, community_policies, emergency_contacts, sign_off_message")
                                .eq("tenant_id", tenantId)
                                .single();

                            if (configError) {
                                // No config found
                            } else if (config) {
                                systemPrompt = `
${(rioAgent as any).instructions}

## Community Specific Context
You are currently assisting a resident of this specific community. 

### Persona
${config.prompt_persona || "Helpful Neighbor"}

### Policies
${config.community_policies || "General guidelines apply."}

### Emergency
${config.emergency_contacts || "Contact local services."}

${config.sign_off_message ? `### Sign-off\nAlways end with: "${config.sign_off_message}"` : ""}
`;
                            }
                        } catch (e: any) {
                            console.warn(`[RIO-AGENT] Using fallback system prompt for ${maskId(tenantId)}: ${e.message}`);
                        }

                        // M4: Final Tier 3 Injection
                        if (residentContext) {
                            systemPrompt += `\n\n## Resident Context\n${residentContext}\n`;
                        }

                        const requestContext = new RequestContext();
                        requestContext.set("tenantId", tenantId as string);
                        requestContext.set("ragEnabled", isRagEnabled);
                        requestContext.set("userId", userId as string);

                        // 4. Invoke Agent Stream with correct Mastra v1.x options
                        const coreMessages = (messages || []).map((m: any) => ({
                            role: m.role,
                            content: m.content || "", // Mastra prefers a string if parts is missing
                            ...(m.parts ? { parts: m.parts } : {}),
                        }));

                        const result = await rioAgent.stream(coreMessages, {
                            system: systemPrompt,
                            requestContext,
                            memory: {
                                thread: threadStore.generateTenantThreadId(tenantId as string, effectiveThreadId),
                                resource: userId as string, // Sprint 12 M1-M7: userId as resource for multi-tenant isolation
                            },
                            abortSignal: c.req.raw.signal,
                        });

                        return streamSSE(c, async (stream) => {
                            let completed = false;
                            const fullStream = (result as any).fullStream || (result as any).stream;

                            if (!fullStream) {
                                console.error("[RIO-AGENT] FATAL: result.fullStream is missing! Output keys:", Object.keys(result));
                                await stream.writeSSE({ data: JSON.stringify({ error: "Stream initialization failed" }) });
                                return;
                            }

                            console.log("[RIO-AGENT] Stream started");
                            const reader = fullStream.getReader();
                            try {
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) {
                                        console.log("[RIO-AGENT] Stream done");
                                        completed = true;
                                        break;
                                    }
                                    if (value) {
                                        // console.log(`[RIO-AGENT] Chunk: ${value.type}`);
                                        if (value.type === "text-delta") {
                                            await stream.writeSSE({ data: JSON.stringify({ token: value.payload.text }) });
                                        } else if (value.type === "tool-call") {
                                            console.log(`[RIO-AGENT] Tool Call: ${value.payload.toolName}`);
                                        } else if (value.type === "tool-result" && value.payload.toolName === "search_documents") {
                                            const toolResult = value.payload.result as any;
                                            if (toolResult?.results) {
                                                await stream.writeSSE({
                                                    data: JSON.stringify({
                                                        citations: toolResult.results.map((r: any) => ({
                                                            documentName: r.documentName,
                                                            documentId: r.documentId,
                                                            excerpt: r.content?.slice(0, 200) + "..."
                                                        }))
                                                    })
                                                });
                                            }
                                        }
                                    }
                                }
                            } catch (streamErr: any) {
                                console.error("[RIO-AGENT] SSE Stream chunk error:", streamErr);
                                await stream.writeSSE({ data: JSON.stringify({ error: streamErr.message }) });
                            } finally {
                                if (completed) {
                                    await stream.writeSSE({ data: "[DONE]" });
                                }
                                reader.releaseLock();
                            }
                        });
                    } catch (error: any) {
                        console.error("[RIO-AGENT] UNCAUGHT HANDLER ERROR:", error);
                        return c.json({ error: error.message || "Internal error", stack: process.env.NODE_ENV === "development" ? error.stack : undefined }, 500);
                    }
                },
            }),
            registerApiRoute("/ingest", {
                method: "POST",
                requiresAuth: true,
                handler: async (c) => {
                    try {
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) return c.json({ error: "Unauthorized" }, 401);

                        const body = await c.req.json().catch(() => ({}));
                        const { documentId, tenantId } = body;
                        if (!documentId || !tenantId) return c.json({ error: "Missing documentId or tenantId" }, 400);

                        const workflow = app.getWorkflow("ingest");
                        if (workflow) {
                            const run = await workflow.createRun();
                            // Await the run to ensure it starts correctly and we can catch early failures
                            await run.start({
                                inputData: { documentId },
                            });
                        }

                        return c.json({ status: "queued" }, 202);
                    } catch (error: any) {
                        return c.json({ error: error.message }, 500);
                    }
                },
            }),
        ],
    },
});

export const threadStore = new ThreadStore(memory);
export { pool, memory };
export const mastra = app;
export default app;
