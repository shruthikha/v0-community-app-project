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

    let timeoutHandle: any;

    try {
        const client = new LlamaParse({
            apiKey: llamaKey,
        });

        // Convert Buffer to Blob for the LlamaParse client
        const blob = new Blob([buffer]);

        console.log(`[LLAMA] Calling parseFile for ${fileName}...`);

        const startTime = Date.now();

        // Safety: Add a 3-minute timeout to prevent LlamaParse from hanging the entire ingestion (Issue #263)
        const TIMEOUT_MS = 3 * 60 * 1000;
        const parsePromise = client.parseFile(blob);

        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error(`LlamaParse timed out after 3 minutes for ${fileName}`)), TIMEOUT_MS);
        });

        const result = await Promise.race([parsePromise, timeoutPromise]);

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
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}
