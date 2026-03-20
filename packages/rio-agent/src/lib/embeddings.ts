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
 * google/gemini-embedding-001 via OpenRouter.
 */
export const embeddingModel: EmbeddingModel = openrouter.embedding('google/gemini-embedding-001');

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

    // Process in batches of 50 for granular error handling and Gemini limits
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
