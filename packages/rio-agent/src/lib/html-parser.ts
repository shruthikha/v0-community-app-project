import TurndownService from 'turndown';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});

/**
 * Converts HTML content (e.g. from TipTap) to clean Markdown for indexing.
 * This ensures the LLM sees the semantic structure of the official pages.
 */
export function parseHtmlToMarkdown(html: string): string {
    if (!html) return '';

    try {
        // Trim whitespace; advanced noise stripping (regex) can be added here if needed
        let cleanHtml = html.trim();

        const markdown = turndownService.turndown(cleanHtml);
        return markdown;
    } catch (error) {
        console.error('[HTML-PARSER] Error converting HTML to Markdown:', error);
        // Fallback: strip HTML tags to avoid embedding noise
        return html.replace(/<[^>]*>?/gm, '').trim();
    }
}
