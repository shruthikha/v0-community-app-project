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

    console.log(`[LLAMA] Initializing LlamaParse for file: ${fileName} (Size: ${buffer.length} bytes)`);

    try {
        const client = new LlamaParse({
            apiKey: llamaKey,
        });

        // Convert Buffer to Blob for the LlamaParse client
        const blob = new Blob([buffer]);

        console.log(`[LLAMA] Calling parseFile for ${fileName}...`);

        const startTime = Date.now();
        const result = await client.parseFile(blob);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`[LLAMA] parseFile completed in ${duration}s`);

        if (!result) {
            console.error('[LLAMA] Result is null or undefined');
            throw new Error('LlamaParse returned no result');
        }

        if (typeof result.markdown !== 'string') {
            console.error('[LLAMA] Result.markdown is missing or not a string', typeof result.markdown);
            throw new Error('LlamaParse returned invalid markdown format');
        }

        console.log(`[LLAMA] Successfully extracted ${result.markdown.length} characters of markdown`);
        return result.markdown;
    } catch (error) {
        console.error('[LLAMA] Parsing error:', error);
        throw error;
    }
}
