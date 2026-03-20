import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { downloadDocument, getDocMetadata, updateDocStatus, saveChunks } from "../lib/supabase.js";
import { parseToMarkdown } from "../lib/llama.js";
import { StructureAwareChunker } from "../lib/chunker.js";
import { generateEmbeddings } from "../lib/embeddings.js";

/**
 * Issue #187 & #188: Combined Ingestion Workflow
 * 
 * Flow:
 * 1. Fetch metadata & check status.
 * 2. Update status to 'processing'.
 * 3. Download the blob from Supabase Storage.
 * 4. Parse the blob into high-quality Markdown via LlamaParse.
 */

/**
 * Step 1: Fetch metadata and download the document asset.
 */
const fetchAssetStep = createStep({
    id: "fetch-asset",
    inputSchema: z.object({
        documentId: z.string().uuid(),
    }),
    outputSchema: z.object({
        buffer: z.any(),
        fileName: z.string(),
        tenantId: z.string(),
        documentId: z.string()
    }),
    execute: async ({ inputData }: { inputData: any }) => {
        const { documentId } = inputData;
        console.log(`[WORKFLOW:INGEST] Starting fetch-asset for ${documentId}`);

        // 1. Get metadata
        const doc = await getDocMetadata(documentId);
        if (!doc) {
            throw new Error(`Document ${documentId} not found in database`);
        }

        // 2. Lock for processing
        await updateDocStatus(documentId, 'processing');
        console.log(`[WORKFLOW:INGEST] Status set to 'processing' for ${documentId}`);

        // 3. Download from Storage
        const buffer = await downloadDocument(doc.file_path);
        if (!buffer) {
            const errorMsg = `Failed to download document from storage at ${doc.file_path}`;
            await updateDocStatus(documentId, 'error', errorMsg);
            throw new Error(errorMsg);
        }

        // Extract directory-safe filename for LlamaParse
        const fileName = doc.file_path.split('/').pop() || 'document.pdf';

        return {
            buffer,
            fileName,
            tenantId: doc.tenant_id,
            documentId: doc.id
        };
    },
});

/**
 * Step 2: Convert the blob into structured Markdown.
 */
const parseContentStep = createStep({
    id: "parse-content",
    inputSchema: z.object({
        buffer: z.any(),
        fileName: z.string(),
        documentId: z.string().uuid(),
        tenantId: z.string()
    }),
    outputSchema: z.object({
        markdown: z.string(),
        documentId: z.string(),
        tenantId: z.string()
    }),
    execute: async ({ inputData }: { inputData: any }) => {
        const { buffer, fileName, documentId, tenantId } = inputData;
        console.log(`[WORKFLOW:INGEST] Starting parse-content for ${fileName}`);

        try {
            const markdown = await parseToMarkdown(buffer as Buffer, fileName);

            console.log(`[WORKFLOW:INGEST] Successfully parsed ${fileName} (${markdown.length} chars)`);

            return {
                markdown,
                documentId,
                tenantId
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown parsing error';
            await updateDocStatus(documentId, 'error', `Parsing failed: ${errorMsg}`);
            throw error;
        }
    },
});

/**
 * Step 3: Split document into semantic chunks.
 */
const chunkContentStep = createStep({
    id: "chunk-content",
    inputSchema: z.object({
        markdown: z.string(),
        documentId: z.string().uuid(),
        tenantId: z.string()
    }),
    outputSchema: z.object({
        chunks: z.array(z.any()),
        documentId: z.string(),
        tenantId: z.string()
    }),
    execute: async ({ inputData }: { inputData: any }) => {
        const { markdown, documentId, tenantId } = inputData;
        console.log(`[WORKFLOW:INGEST] Starting chunk-content for document ${documentId}`);

        try {
            const chunker = new StructureAwareChunker();
            const chunks = chunker.chunk(markdown, documentId, tenantId);

            console.log(`[WORKFLOW:INGEST] Created ${chunks.length} chunks for document ${documentId}`);

            return {
                chunks,
                documentId,
                tenantId
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown chunking error';
            await updateDocStatus(documentId, 'error', `Chunking failed: ${errorMsg}`);
            throw error;
        }
    },
});

/**
 * Step 4: Generate vectors for chunks (#189).
 */
const embedChunksStep = createStep({
    id: "embed-chunks",
    inputSchema: z.object({
        chunks: z.array(z.any()),
        documentId: z.string().uuid(),
        tenantId: z.string()
    }),
    outputSchema: z.object({
        chunksWithEmbeddings: z.array(z.any()),
        documentId: z.string(),
        tenantId: z.string()
    }),
    execute: async ({ inputData }: { inputData: any }) => {
        const { chunks, documentId, tenantId } = inputData;
        console.log(`[WORKFLOW:INGEST] Starting embed-chunks for ${chunks.length} chunks`);

        try {
            // Extract text for embedding
            const texts = chunks.map((c: any) => c.text);
            const embeddings = await generateEmbeddings(texts);

            // Merge embeddings back into chunks
            const chunksWithEmbeddings = chunks.map((c: any, i: number) => ({
                ...c,
                embedding: embeddings[i]
            }));

            console.log(`[WORKFLOW:INGEST] Successfully generated embeddings for ${chunks.length} chunks`);

            return {
                chunksWithEmbeddings,
                documentId,
                tenantId
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown embedding error';
            await updateDocStatus(documentId, 'error', `Embedding failed: ${errorMsg}`);
            throw error;
        }
    },
});

/**
 * Step 5: Persist chunks with embeddings using atomic RPC (#190).
 */
const persistChunksStep = createStep({
    id: "persist-chunks",
    inputSchema: z.object({
        chunksWithEmbeddings: z.array(z.any()),
        documentId: z.string().uuid(),
        tenantId: z.string()
    }),
    outputSchema: z.object({
        documentId: z.string(),
        chunkCount: z.number()
    }),
    execute: async ({ inputData }: { inputData: any }) => {
        const { chunksWithEmbeddings, documentId, tenantId } = inputData;
        console.log(`[WORKFLOW:INGEST] Persisting ${chunksWithEmbeddings.length} chunks for ${documentId}`);

        try {
            // Mapping chunks to match the RPC p_chunks JSONB[] schema
            const rpcChunks = chunksWithEmbeddings.map((c: any) => ({
                content: c.text,
                metadata: c.metadata,
                embedding: c.embedding
            }));

            await saveChunks(documentId, tenantId, rpcChunks);

            // Mark document as processed (#191)
            await updateDocStatus(documentId, 'processed');

            return {
                documentId,
                chunkCount: chunksWithEmbeddings.length
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown persistence error';
            await updateDocStatus(documentId, 'error', `Persistence failed: ${errorMsg}`);
            throw error;
        }
    },
});

/**
 * Combined Ingestion Workflow
 */
export const ingestionWorkflow = createWorkflow({
    id: "ingest",
    inputSchema: z.object({
        documentId: z.string().uuid(),
    }),
    outputSchema: z.object({
        chunkCount: z.number(),
        documentId: z.string()
    }),
})
    .then(fetchAssetStep)
    .then(parseContentStep)
    .then(chunkContentStep)
    .then(embedChunksStep)
    .then(persistChunksStep)
    .commit();
