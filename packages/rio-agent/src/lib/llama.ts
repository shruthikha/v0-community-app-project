import { LlamaParse } from 'llama-parse';

const llamaKey = process.env.LLAMA_CLOUD_API_KEY;

if (!llamaKey) {
    console.warn('[LLAMA] Missing LLAMA_CLOUD_API_KEY. Document parsing will fail.');
}

/**
 * Converts a document buffer to Markdown using LlamaParse.
 * Optimized for standard high-quality extraction without premium token costs.
 */
export async function parseToMarkdown(buffer: Buffer, fileName: string): Promise<string> {
    if (!llamaKey) {
        throw new Error('LLAMA_CLOUD_API_KEY is not configured');
    }

    try {
        const client = new LlamaParse({
            apiKey: llamaKey,
        });

        // Convert Buffer to Blob for the LlamaParse client (expects File | Blob)
        const blob = new Blob([buffer]);
        const result = await client.parseFile(blob);

        if (!result || !result.markdown) {
            throw new Error('LlamaParse returned no markdown content');
        }

        return result.markdown;
    } catch (error) {
        console.error('[LLAMA] Parsing error:', error);
        throw error;
    }
}
