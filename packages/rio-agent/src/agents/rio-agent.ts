import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import pg from "pg";
import { generateEmbedding } from "../lib/embeddings.js";

const { Pool } = pg;

export const RIO_MODEL_ID = "google/gemini-2.5-flash";
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const connectionString = process.env.RIO_DATABASE_URL;

if (!openRouterApiKey && process.env.NODE_ENV === "production") {
    throw new Error(
        "OPENROUTER_API_KEY is not set. Please add the OpenRouter API key to your environment variables.",
    );
}

if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("RIO_DATABASE_URL is not set.");
    } else {
        console.warn("RIO_DATABASE_URL is not set. Database operations will fail.");
    }
}

import { pool } from "../lib/db.js";
import { memory, TokenLimiter } from "../lib/memory.js";

/**
 * RAG Tool: search_documents
 * Performs semantic search over community documents with strict tenant isolation.
 */
export const search_documents = createTool({
    id: "search_documents",
    description: "Search through the community's internal documents, bylaws, and guides to find relevant information.",
    inputSchema: z.object({
        query: z.string().describe("The search query for the semantic search"),
    }),
    execute: async (input: { query: string }, context: any) => {
        // Robust Metadata Retrieval (#193 remediation)
        const rawTenantId =
            context.requestContext?.get?.("tenantId") ||
            (context as any)?.memory?.metadata?.tenantId ||
            (context as any)?.tenantId;

        const rawRagEnabled =
            context.requestContext?.get?.("ragEnabled") ||
            (context as any)?.memory?.metadata?.ragEnabled ||
            (context as any)?.ragEnabled;

        const tenantId = typeof rawTenantId === "string" ? rawTenantId.trim() : undefined;
        const ragEnabled = rawRagEnabled === true || rawRagEnabled === "true";

        if (process.env.DEBUG_LOGGING === "true" || process.env.NODE_ENV === "development") {
            console.log(`[TOOL:SEARCH] Resolve for tenantId: "${tenantId}", ragEnabled: ${ragEnabled}`);
            console.log(`[TOOL:SEARCH] Begin search for query: "${input.query}"`);
        }

        if (!tenantId) {
            console.error(`[TOOL:SEARCH] Failed: Tenant ID missing in context`);
            return { error: "Tenant context missing. Unable to perform search." };
        }

        if (!ragEnabled) {
            return {
                info: "RAG search is currently disabled for this community. Please answer based on your general knowledge or ask the user to contact an admin.",
                results: [],
            };
        }

        try {
            // 1. Generate embedding for the search query
            const queryEmbedding = await generateEmbedding(input.query);

            // 2. Perform vector similarity search with strict tenant filtering
            const { rows } = await pool.query(
                `SELECT c.content, c.metadata, d.name as document_name, d.source_document_id, d.id as internal_id
                 FROM public.rio_document_chunks c
                 JOIN public.rio_documents d ON c.document_id = d.id
                 WHERE c.tenant_id = $1 
                 ORDER BY c.embedding <=> $2::vector
                 LIMIT 10`,
                [tenantId, `[${queryEmbedding.join(",")}]`],
            );

            return {
                results: rows.map((r: any) => ({
                    content: r.content,
                    metadata: r.metadata,
                    documentName: r.document_name || "Community Document",
                    documentId: r.source_document_id || r.internal_id,
                })),
            };
        } catch (error: any) {
            console.error("[TOOL:SEARCH] Error during query execution:", error);
            return { error: "Failed to search documents due to an internal error." };
        }
    },
});

export const rioAgent = new Agent({
    id: "rio-agent",
    name: "RioAgent",
    instructions:
        "You are the community assistant for this platform — a friendly, helpful presence available to all residents across every community we support.\n\n" +
        "## Who you are\n\n" +
        "You're like a warm, knowledgeable neighbor who's really good at helping people find their way around. You're approachable, calm, and clear — not corporate, not overly formal, and never pushy. Think 70% warm and welcoming, 30% practical guide. Your name is Río.\n\n" +
        "## What you do\n\n" +
        "You help residents navigate their community platform — answering questions, guiding them through features, and making them feel at home. You don't manage the community or make decisions on behalf of admins. You assist residents.\n\n" +
        "## Citations & Knowledge\n\n" +
        "Whenever you use information from a document (internal knowledge base), you MUST provide an inline citation using number markers like [1], [2] at the end of the relevant sentence. This helps residents know where the information came from. Each search result you receive will be numbered. Use these numbers for your citations.\n\n" +
        "## How you speak\n\n" +
        "- Use \"you/your\" language — talk to the resident, not about them\n" +
        "- Use contractions naturally (you're, can't, didn't, it's)\n" +
        "- Prefer \"neighbors\" over \"users\" or \"residents\"\n" +
        "- Prefer \"residents\" over \"accounts\"\n" +
        "- Keep it casual but clear\n\n" +
        "## Memory & Resident State\n\n" +
        "You have access to a \"Working Memory\" which represents the distilled, consolidated facts about the resident.\n" +
        "- **Sovereignty**: The Working Memory is the absolute source of truth for current resident facts, interests, and preferences.\n" +
        "- **Conflict Resolution**: If a fact or interest is mentioned in the conversation history but is ABSENT from the Working Memory, you must assume it has been deleted, updated, or is no longer relevant.\n" +
        "- **Dynamic Accuracy**: Never claim to remember something (like an interest or a personal detail) that is not explicitly present in current Working Memory, even if it was discussed in the past.",
    model: RIO_MODEL_ID,
    memory,
    inputProcessors: [new TokenLimiter()],
    tools: {
        search_documents,
    },
});

console.log("RioAgent initialized");
