export interface Chunk {
    text: string;
    metadata: {
        documentId: string;
        tenantId: string;
        breadcrumbs: string[];
        sectionTitle?: string;
        isTable?: boolean;
    };
}

/**
 * Custom chunker that preserves Markdown structure (Headers and Tables).
 * Pre-pends hierarchical context to each chunk to improve RAG retrieval.
 */
export class StructureAwareChunker {
    private maxChars: number = 2000;
    private overlap: number = 200;

    constructor(options?: { maxChars?: number; overlap?: number }) {
        if (options?.maxChars) this.maxChars = options.maxChars;
        if (options?.overlap) this.overlap = options.overlap;
    }

    /**
     * Chunks a markdown string based on H1/H2 boundaries and tables.
     */
    chunk(markdown: string, documentId: string, tenantId: string): Chunk[] {
        const lines = markdown.split("\n");
        const chunks: Chunk[] = [];
        let currentH1 = "";
        let currentH2 = "";
        let currentSectionLines: string[] = [];
        let inTable = false;
        let tableLines: string[] = [];

        const flushSection = (sectionLines: string[], h1: string, h2: string) => {
            const content = sectionLines.join("\n").trim();
            if (!content) return;
            const breadcrumbs = [h1, h2].filter(Boolean);
            const prefix = breadcrumbs.length > 0 ? `${breadcrumbs.join(" > ")}: ` : "";

            if (content.length + prefix.length <= this.maxChars) {
                chunks.push({
                    text: `${prefix}${content}`,
                    metadata: { documentId, tenantId, breadcrumbs, sectionTitle: h2 || h1 }
                });
            } else {
                this.recursiveSplit(content, prefix, breadcrumbs, documentId, tenantId, chunks);
            }
        };

        const flushTable = (tLines: string[], h1: string, h2: string) => {
            if (tLines.length < 3) return;
            const headerRow = tLines[0];
            const breadcrumbs = [h1, h2].filter(Boolean);
            const prefix = breadcrumbs.length > 0 ? `${breadcrumbs.join(" > ")} | ` : "";

            for (let i = 2; i < tLines.length; i++) {
                const row = tLines[i].trim();
                if (!row) continue;
                chunks.push({
                    text: `${prefix}${headerRow}\n${row}`,
                    metadata: { documentId, tenantId, breadcrumbs, isTable: true, sectionTitle: h2 || h1 }
                });
            }
        };

        for (const line of lines) {
            const h1Match = line.match(/^#\s+(.+)$/);
            const h2Match = line.match(/^##\s+(.+)$/);
            const isTableMarker = line.trim().startsWith("|");

            if (h1Match || h2Match) {
                if (inTable) {
                    flushTable(tableLines, currentH1, currentH2);
                    inTable = false;
                    tableLines = [];
                } else {
                    flushSection(currentSectionLines, currentH1, currentH2);
                    currentSectionLines = [];
                }

                if (h1Match) {
                    currentH1 = h1Match[1].trim();
                    currentH2 = "";
                } else if (h2Match) {
                    currentH2 = h2Match[1].trim();
                }
                continue;
            }

            if (isTableMarker) {
                if (!inTable) {
                    flushSection(currentSectionLines, currentH1, currentH2);
                    currentSectionLines = [];
                    inTable = true;
                }
                tableLines.push(line);
            } else {
                if (inTable) {
                    flushTable(tableLines, currentH1, currentH2);
                    inTable = false;
                    tableLines = [];
                }
                currentSectionLines.push(line);
            }
        }

        if (inTable) {
            flushTable(tableLines, currentH1, currentH2);
        } else {
            flushSection(currentSectionLines, currentH1, currentH2);
        }

        return chunks;
    }

    /**
     * Fallback for large sections that exceed maxChars.
     */
    private recursiveSplit(text: string, prefix: string, breadcrumbs: string[], documentId: string, tenantId: string, chunks: Chunk[]): void {
        let start = 0;
        const effectiveLimit = this.maxChars - prefix.length;

        // Safety: If prefix itself is too long, we must truncate the prefix or skip
        if (effectiveLimit <= 100) {
            console.warn(`[CHUNKER] Prefix too long (${prefix.length}), using truncated prefix for document ${documentId}`);
            return this.recursiveSplit(text, prefix.substring(0, 50) + "... ", breadcrumbs, documentId, tenantId, chunks);
        }

        let localCount = 0;

        while (start < text.length) {
            let end = Math.min(start + effectiveLimit, text.length);

            // Try to find a good breaking point (newline) in the last 30% of the window
            if (end < text.length) {
                const searchStart = Math.floor(start + effectiveLimit * 0.7);
                const searchWindow = text.substring(searchStart, end);
                const lastNewline = searchWindow.lastIndexOf("\n");
                if (lastNewline !== -1) {
                    end = searchStart + lastNewline;
                }
            }

            const chunkText = text.substring(start, end).trim();
            if (chunkText) {
                chunks.push({
                    text: `${prefix}${chunkText}`,
                    metadata: { documentId, tenantId, breadcrumbs }
                });
                localCount++;
            }

            // Move the start forward, accounting for overlap
            const nextStart = end - this.overlap;

            // Safety: if we didn't advance at all, force advance
            if (nextStart <= start) {
                start = end;
            } else {
                start = nextStart;
            }

            if (start >= text.length) break;
        }
        console.log(`[CHUNKER] Recursive split generated ${localCount} chunks for section`);
    }
}
