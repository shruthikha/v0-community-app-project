import { createOpenAI } from '@ai-sdk/openai';
import { embed, embedMany, EmbeddingModel } from 'ai';

/**
 * Configure OpenRouter as the provider for embeddings.
 */
const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

/**
 * OpenAI text-embedding-3-small via OpenRouter (1536 dimensions).
 * 
 * NOTE: This model replaced 'gemini-embedding-001' to align with our 1536d vector schema.
 * All existing documents must be re-indexed to ensure semantic compatibility.
 */
export const EMBEDDING_MODEL_NAME = 'openai/text-embedding-3-small';
export const embeddingModel: EmbeddingModel = openrouter.embedding(EMBEDDING_MODEL_NAME);

export async function generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: embeddingModel,
        value: text,
    });
    // Truncate to 1536 as per our database schema
    return embedding.slice(0, 1536);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const BATCH_SIZE = 50;
    const allEmbeddings: number[][] = [];

    // Process in batches of 50 for granular error handling and API rate limits
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        console.log(`[EMBEDDINGS] Processing batch ${i / BATCH_SIZE + 1} (${batch.length} texts)`);

        const { embeddings } = await embedMany({
            model: embeddingModel,
            values: batch,
        });

        // Truncate each embedding to 1536
        allEmbeddings.push(...embeddings.map(e => e.slice(0, 1536)));
    }

    return allEmbeddings;
}
