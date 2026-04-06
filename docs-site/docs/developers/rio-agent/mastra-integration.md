# Mastra v1.x Integration

Río AI is powered by the **Mastra v1.x** framework, which provides the orchestration layer for agents, tools, workflows, and memory.

## 1. Agents

The core of the assistant is the `rioAgent`, defined as a Mastra `Agent` instance.

### Configuration
- **Model**: `google/gemini-2.5-flash` (via OpenRouter).
- **Core Instructions**: Defines the "Neighbor" persona, citation rules, and memory sovereignty principles.
- **Processors**: Uses a `TokenLimiter` input processor to manage context window efficiency.

```typescript
export const rioAgent = new Agent({
    id: "rio-agent",
    name: "RioAgent",
    instructions: "...",
    model: RIO_MODEL_ID,
    memory,
    tools: { search_documents },
});
```

## 2. Tools (RAG)

Tools extend the agent's capabilities. Río's primary tool is `search_documents`.

### `search_documents`
- **Purpose**: Performs semantic search across community documents.
- **Isolation**: Strictly enforces `tenant_id` filtering using metadata resolved from the `RequestContext`.
- **Implementation**: 
  1. Generates an embedding for the user query using `text-embedding-3-small`.
  2. Executes a vector similarity search (`<=>`) in PostgreSQL via `PgVector`.
  3. Returns ranked chunks with source document metadata.

## 3. Workflows

Workflows manage complex, multi-step asynchronous processes.

### `ingest` Workflow
Located in `src/workflows/ingest.ts`, this workflow handles the RAG preparation pipeline:
1.  **Trigger**: Initiated via `/api/v1/ai/ingest`.
2.  **Step: Parse**: Uses **LlamaParse** to convert PDFs/Docs into structured Markdown chunks.
3.  **Step: Embed**: Vectorizes chunks and stores them in `rio_document_chunks`.
4.  **Status Sync**: Updates the `rio_documents` table in Supabase so the Admin Dashboard reflects progress.

## 4. Memory Strategy

Río utilizes Mastra's memory system but enhances it with a persistent SQL fallback layer.

- **Storage**: Sessions are stored in the database via Mastra's `Storage` provider.
- **Working Memory**: Distills long-term facts about a resident. 
  - **SQL Fallback**: If the Mastra working memory is transient or thread-specific, Río synchronizes it with the `public.mastra_resources` table to ensure "facts" persist across threads and restarts.
- **Thread Store**: A custom `ThreadStore` manages thread creation, ownership verification, and RLS (Row Level Security) initialization for pooled connections.

## 5. Infrastructure Architecture

The agent runs as a standalone Node.js service (deployed on Railway) using **Hono** for high-performance API routing.

- **Endpoint Registry**: Uses `registerApiRoute` for Mastra-native routing.
- **BFF Interaction**: The Vercel BFF communicates with this service via a private endpoint secured by `RIO_AGENT_KEY`.
- **Database**: Connects to the primary Supabase instance for vector search and configuration retrieval.
