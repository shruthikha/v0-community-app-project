import { Mastra } from "@mastra/core";
import { PostgresStore, PgVector } from "@mastra/pg";
import { registerApiRoute } from "@mastra/core/server";
import { streamSSE } from "hono/streaming";
import { createHash } from "crypto";
import { z } from "zod";
import { rioAgent, memory, RIO_MODEL_ID } from "./agents/rio-agent.js";
import { ThreadStore } from "./lib/thread-store.js";
import { PosthogExporter } from "@mastra/posthog";
import { Observability, SensitiveDataFilter } from "@mastra/observability";

import { PatternRedactor } from "./lib/pattern-redactor.js";
import { sha256 } from "./lib/sha256.js";

import { ingestionWorkflow } from "./workflows/ingest.js";
import { claimDocument, updateDocStatus, supabaseAdmin } from "./lib/supabase.js";

const threadStore = new ThreadStore(memory);

/**
 * RioAgent Service — native Mastra implementation.
 *
 * This file replaces the previous Fastify implementation.
 * The Mastra CLI ('mastra start' / 'mastra dev') looks for an exported 'mastra' instance.
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const connectionString = requireEnv("RIO_DATABASE_URL");
const rioAgentKey = requireEnv("RIO_AGENT_KEY");

/**
 * Helper to mask sensitive identifiers in logs unless DEBUG_LOGGING is enabled.
 */
function maskId(id: any): string {
    if (!id || typeof id !== "string") return "none";
    if (process.env.DEBUG_LOGGING === "true") return id;
    // Using a simple hash prefix for traceable logs without exposing raw PII
    return createHash("sha256").update(id).digest("hex").slice(0, 10);
}/**
 * Request body schema for the /chat endpoint.
 */
const ChatBodySchema = z.object({
    messages: z.array(z.any()).min(1),
    threadId: z.string().min(1).optional(),
    resourceId: z.string().min(1).optional(),
});



export const mastra = new Mastra({
    storage: new PostgresStore({
        id: "rio-storage",
        connectionString,
    }),
    vectors: {
        "rio-vector": new PgVector({
            id: "rio-vector",
            connectionString,
            tableName: "rio_document_chunks",
            schemaName: "public",
        } as any),
        "rio_embeddings": new PgVector({
            id: "rio_embeddings",
            connectionString,
        } as any),
    },
    agents: {
        "rio-agent": rioAgent,
    },
    workflows: {
        ingest: ingestionWorkflow,
    },
    observability: new Observability({
        configs: {
            posthog: {
                serviceName: "rio-agent",
                exporters: [
                    new PosthogExporter({
                        apiKey: process.env.POSTHOG_API_KEY,
                        host: process.env.POSTHOG_HOST,
                    }),
                ],
                spanOutputProcessors: [
                    new PatternRedactor(),
                    new SensitiveDataFilter({
                        sensitiveFields: [
                            "email",
                            "phoneNumber",
                            "dateOfBirth",
                            "name",
                            "address",
                        ],
                    }),
                ],
            },
        },
    }),
    server: {
        port: (() => {
            const port = Number(process.env.PORT) || 3001;
            if (port < 1 || port > 65535) throw new Error(`Invalid PORT: ${port}`);
            return port;
        })(),
        host: "0.0.0.0",
        studioBase: "/", // Mount the Playground/Studio UI at the root
        build: {
            swaggerUI: true, // Enable interactive OpenAPI docs at /swagger-ui
            openAPIDocs: true, // Required for Swagger UI to function
        },
        apiRoutes: [
            /**
             * AC1: Health check endpoint for Railway.
             * Note: registerApiRoute prefixes must NOT start with '/api' (reserved).
             */
            registerApiRoute("/health", {
                method: "GET",
                requiresAuth: false,
                handler: async (c) => {
                    return c.json({ status: "ok" });
                },
            }),

            /**
             * AC2: Mock SSE streaming endpoint.
             * Note: registerApiRoute prefixes must NOT start with '/api' (reserved).
             * Exposed as POST /api/chat.
             */
            registerApiRoute("/chat", {
                method: "POST",
                requiresAuth: false,
                handler: async (c) => {
                    const parsed = ChatBodySchema.safeParse(await c.req.json().catch(() => ({})));

                    if (!parsed.success) {
                        return c.json({ error: "Invalid request body", details: parsed.error.format() }, 400);
                    }

                    const { messages, threadId, resourceId } = parsed.data;

                    const tenantId = c.req.header("x-tenant-id");
                    const userId = c.req.header("x-user-id");
                    const effectiveThreadId = (threadId || resourceId) as string;

                    // PR Feedback (r2943050030): Mask identifiers in logs
                    console.log(`[RIO-AGENT] CHAT: tenantId=${maskId(tenantId)}, userId=${maskId(userId)}, threadId=${maskId(threadId)}, resourceId=${maskId(resourceId)}, effectiveThreadId=${maskId(effectiveThreadId)}`);

                    if (!effectiveThreadId) {
                        return c.json({ error: "threadId or resourceId is required for memory isolation" }, 400);
                    }

                    // Sync thread metadata to ensure RLS columns are populated via DB trigger
                    let thread;
                    try {
                        thread = await threadStore.getThreadById(tenantId as string, effectiveThreadId);
                        console.log(`[RIO-AGENT] Existing thread found: ${!!thread} (maskedId=${maskId(effectiveThreadId)})`);

                        if (thread) {
                            // PR Feedback: Reject mismatched thread ownership (tenant-level and resident-level isolation)
                            const existingTenantId = thread.metadata?.tenantId;
                            const existingUserId = thread.metadata?.userId;

                            if (existingTenantId && existingTenantId !== tenantId) {
                                console.warn(`[RIO-AGENT] 403 Forbidden: Tenant mismatch for thread ${maskId(effectiveThreadId)}. Request: ${maskId(tenantId)}, Stored: ${maskId(existingTenantId)}`);
                                return c.json({ error: "Access denied: thread belongs to different tenant" }, 403);
                            }

                            if (existingUserId && existingUserId !== userId) {
                                console.warn(`[RIO-AGENT] 403 Forbidden: User mismatch for thread ${maskId(effectiveThreadId)}. Request: ${maskId(userId)}, Stored: ${maskId(existingUserId)}`);
                                return c.json({ error: "Access denied: thread belongs to different user" }, 403);
                            }

                            // Missing metadata (should be rare with new ThreadStore, but handle legacy)
                            if (!existingTenantId || !existingUserId) {
                                console.log(`[RIO-AGENT] Backfilling thread metadata for: ${maskId(effectiveThreadId)}`);
                                await threadStore.updateThread(tenantId as string, effectiveThreadId, {
                                    id: effectiveThreadId,
                                    title: thread.title || "New Thread",
                                    metadata: { ...thread.metadata, tenantId, userId },
                                });
                            }
                        } else {
                            console.log(`[RIO-AGENT] Creating new thread: ${maskId(effectiveThreadId)}`);
                            await threadStore.createThread({
                                threadId: effectiveThreadId,
                                resourceId: resourceId || "rio-chat",
                                tenantId: tenantId as string,
                                userId: userId as string,
                            });
                        }
                    } catch (e) {
                        // PR Feedback (r2943290497): Fail-closed on metadata sync error
                        console.error("[RIO-AGENT] Metadata sync failed:", e);
                        return c.json({ error: "Unable to verify thread ownership" }, 500);
                    }

                    const hashedUserId = maskId(userId);
                    const hashedTenantId = maskId(tenantId);

                    const ragEnabledHeader = c.req.header("x-rag-enabled");
                    const isRagEnabled = ragEnabledHeader !== "false";

                    // 3-Tier Prompt Composition (#193)
                    let systemPrompt = rioAgent.instructions;
                    try {
                        const { data: config } = await supabaseAdmin
                            .from("rio_configurations")
                            .select("persona, community_policies, emergency_contacts")
                            .eq("tenant_id", tenantId)
                            .single();

                        if (config) {
                            systemPrompt = `
${rioAgent.instructions}

## Community Specific Context
You are currently assisting a resident of this specific community. Use the following context to tailor your answers:

### Your Persona in this community
${config.persona || "Helpful Neighbor"}

### Community Policies & Rules
${config.community_policies || "Follow general community guidelines."}

### Emergency Contacts
${config.emergency_contacts || "Contact local emergency services for immediate help."}

---
Always prioritize community policies and emergency steps if the situation warrants it.
`;
                        }
                    } catch (e) {
                        console.warn(`[RIO-AGENT] Failed to fetch community context for ${maskId(tenantId)}, falling back to defaults.`);
                    }

                    // Inject system prompt as the first message
                    const messagesWithPrompt = [
                        { role: "system", content: systemPrompt },
                        ...messages
                    ];

                    // Mastra v1.x .stream() returns a MastraModelOutput object
                    console.log(`[RIO-AGENT] Starting stream for thread: ${maskId(effectiveThreadId)} (RAG: ${isRagEnabled})`);
                    const result = await rioAgent.stream(messagesWithPrompt, {
                        memory: {
                            thread: threadStore.generateTenantThreadId(tenantId as string, effectiveThreadId),
                            resource: "rio-chat",
                            metadata: {
                                ...(thread?.metadata || {}),
                                tenantId: tenantId,
                                userId: userId,
                                ragEnabled: isRagEnabled,
                                tenant_id_hash: sha256(tenantId as string),
                                user_id_hash: sha256(userId as string),
                                model: RIO_MODEL_ID,
                                sprint: "11",
                            },
                        } as any,
                        // PR Feedback (r2943050035): propagating abort signal
                        abortSignal: c.req.raw.signal,
                    });

                    return streamSSE(c, async (stream) => {
                        let closed = false;
                        let completed = false;
                        c.req.raw.signal.addEventListener("abort", () => {
                            closed = true;
                        });

                        try {
                            // Use the textStream which is a ReadableStream<string>
                            const reader = result.textStream.getReader();

                            while (true) {
                                if (closed) break;
                                const { done, value } = await reader.read();
                                if (done) {
                                    completed = true;
                                    break;
                                }

                                if (value) {
                                    await stream.writeSSE({ data: JSON.stringify({ token: value }) });
                                }
                            }
                        } catch (err) {
                            console.error("Streaming error:", err);
                        } finally {
                            // PR Feedback (r2943290503): Only emit [DONE] on clean EOF
                            if (!closed && completed) {
                                await stream.writeSSE({ data: "[DONE]" });
                            }
                        }
                    });
                },
            }),
            /**
             * Manual verification route to check environment variables.
             * Returns masked values to confirm they are set correctly on Railway.
             */
            registerApiRoute("/config-check", {
                method: "GET",
                requiresAuth: false,
                handler: async (c) => {
                    if (process.env.NODE_ENV === "production") {
                        return c.json({ error: "Not Found" }, 404);
                    }
                    const present = (val?: string) => (val ? "SET" : "MISSING");
                    return c.json({
                        RIO_DATABASE_URL: present(process.env.RIO_DATABASE_URL),
                        OPENROUTER_API_KEY: present(process.env.OPENROUTER_API_KEY),
                        SUPABASE_URL: present(process.env.SUPABASE_URL),
                        NODE_ENV: process.env.NODE_ENV || "not set",
                        PORT: process.env.PORT || "not set",
                    });
                },
            }),
            /**
             * Issue #192: Ingestion Trigger Endpoint
             * Receives the trigger from the Vercel BFF and kicks off the workflow.
             */
            registerApiRoute("/ingest", {
                method: "POST",
                requiresAuth: false,
                handler: async (c) => {
                    try {
                        // Check for shared secret auth
                        const authHeader = c.req.header("x-agent-key");
                        if (authHeader !== rioAgentKey) {
                            console.warn(`[RIO-AGENT] 401 Unauthorized: Invalid or missing x-agent-key`);
                            return c.json({ error: "Unauthorized" }, 401);
                        }

                        const body = await c.req.json().catch(() => ({}));
                        const { documentId, tenantId } = body;

                        if (!documentId || !tenantId) {
                            return c.json({ error: "documentId and tenantId are required" }, 400);
                        }

                        // PRE-FLIGHT CHECK: Ensure agent has credentials to talk back to Supabase
                        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
                            const error = "Agent misconfigured: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.";
                            console.error(`[RIO-AGENT] ${error}`);
                            return c.json({ status: "error", error }, 500);
                        }



                        const workflow = mastra.getWorkflow("ingest");
                        workflow.createRun()
                            .then(run => run.start({ inputData: { documentId } }))
                            .then(result => {
                                if (result.status === 'failed') {
                                    console.error(`[RIO-AGENT] Ingestion workflow failed for ${documentId}:`, result.error);
                                    updateDocStatus(documentId, 'error', `Workflow failed: ${result.error?.message || 'Unknown error'}`);
                                } else {
                                    console.log(`[RIO-AGENT] Ingestion workflow completed for ${documentId}`);
                                    updateDocStatus(documentId, 'processed');
                                }
                            })
                            .catch(async (err: any) => {
                                console.error(`[RIO-AGENT] Ingestion workflow engine error for ${documentId}:`, err);
                                await updateDocStatus(documentId, 'error', `Engine error: ${err.message}`);
                            });

                        return c.json({ status: "queued", message: "Ingestion workflow started" }, 202);
                    } catch (error: any) {
                        console.error("[RIO-AGENT] Ingestion request error:", error);
                        return c.json({ status: "error", error: error.message }, 500);
                    }
                },
            }),
        ],
    },
});

console.log("RioAgent initialized via native Mastra server");
