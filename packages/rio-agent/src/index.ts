import { Memory } from "@mastra/memory";
import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";
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

/**
 * Masks a UUID or similar identifier for safe logging.
 * Example: "12345678-..." -> "1234...5678"
 */
export function maskId(id: string | null | undefined): string {
    if (!id) return "null";
    if (id.length < 8) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
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

const storage = new PostgresStore({
    id: "rio-storage",
    pool,
});

const memory = new Memory({ storage });


const ChatBodySchema = z.object({
    messages: z.array(z.any()).min(1),
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
                        const userId = c.req.query("userId");
                        const tenantId = c.req.query("tenantId");

                        if (!userId || !tenantId) return c.json({ error: "Missing userId or tenantId" }, 400);

                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) {
                            console.warn(`[RIO-AGENT] 401 Unauthorized on /threads/active`);
                            return c.json({ error: "Unauthorized" }, 401);
                        }

                        const result = await pool.query(
                            `SELECT id FROM mastra_threads 
                             WHERE metadata->>'user_id' = $1 
                             AND metadata->>'tenant_id' = $2
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

                        // Metadata Sync & Thread Ownership Verification
                        let thread;
                        try {
                            thread = await threadStore.getThreadById(tenantId as string, effectiveThreadId);
                            if (thread) {
                                const existingTenantId = thread.metadata?.tenantId;
                                const existingUserId = thread.metadata?.userId;
                                if (existingTenantId && existingTenantId !== tenantId) {
                                    console.error(`[RIO-AGENT] 403 Forbidden: Tenant mismatch. Stored: ${maskId(existingTenantId)}, Incoming: ${maskId(tenantId)}`);
                                    return c.json({ error: "Access denied: thread tenant mismatch" }, 403);
                                }
                                if (existingUserId && existingUserId !== userId) {
                                    console.warn(`[RIO-AGENT] User ID changed/mismatch on thread. Stored: ${maskId(existingUserId)}, Incoming: ${maskId(userId)}`);
                                }
                            } else {
                                console.log(`[RIO-AGENT] Thread ${maskId(effectiveThreadId)} not found, creating new one for tenant ${maskId(tenantId)}`);
                                await threadStore.createThread({ threadId: effectiveThreadId, resourceId: resourceId || "rio-chat", tenantId: tenantId as string, userId: userId as string });
                            }
                        } catch (e: any) {
                            console.error("[RIO-AGENT] Thread verification failed (Database error?):", e);
                            return c.json({ error: `Unable to verify thread ownership: ${e.message}` }, 500);
                        }

                        const ragEnabledHeader = c.req.header("x-rag-enabled");
                        const isRagEnabled = ragEnabledHeader === "true";

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

                        const requestContext = new RequestContext();
                        requestContext.set("tenantId", tenantId as string);
                        requestContext.set("ragEnabled", isRagEnabled);
                        requestContext.set("userId", userId as string);

                        const result = await rioAgent.stream(messages, {
                            system: systemPrompt,
                            requestContext,
                            memory: {
                                threadId: threadStore.generateTenantThreadId(tenantId as string, effectiveThreadId),
                                resourceId: "rio-chat",
                            } as any,
                            abortSignal: c.req.raw.signal,
                        });

                        return streamSSE(c, async (stream) => {
                            let completed = false;
                            const fullStream = (result as any).fullStream || (result as any).stream;
                            if (!fullStream) {
                                console.error("[RIO-AGENT] FATAL: result.fullStream is missing!", Object.keys(result));
                                await stream.writeSSE({ data: JSON.stringify({ error: "Stream initialization failed" }) });
                                return;
                            }
                            const reader = fullStream.getReader();
                            try {
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) {
                                        completed = true;
                                        break;
                                    }
                                    if (value) {
                                        if (value.type === "text-delta") {
                                            await stream.writeSSE({ data: JSON.stringify({ token: value.payload.text }) });
                                        } else if (value.type === "tool-call") {
                                            // Handle tool call
                                        } else if (value.type === "tool-result" && value.payload.toolName === "search_documents") {
                                            const toolResult = value.payload.result as any;
                                            if (toolResult?.results) {
                                                await stream.writeSSE({
                                                    data: JSON.stringify({
                                                        citations: toolResult.results.map((r: any) => ({
                                                            documentName: r.documentName,
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
                            } finally {
                                if (completed) {
                                    await stream.writeSSE({ data: "[DONE]" });
                                }
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
                            workflow.createRun().then(run => run.start({ inputData: { documentId } }));
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

const threadStore = new ThreadStore(app.getMemory("main"));
export const mastra = app;
export default app;
