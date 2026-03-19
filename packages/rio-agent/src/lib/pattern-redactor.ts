import type { SpanOutputProcessor, AnySpan } from '@mastra/core/observability';

/**
 * PatternRedactor
 * 
 * A custom SpanOutputProcessor for Mastra that redacts PII using regex patterns
 * within unstructured text across all span fields (input, output, attributes, metadata).
 */
export class PatternRedactor implements SpanOutputProcessor {
    name = 'pattern-redactor';

    private patterns = [
        // Email regex
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        // Phone number regex (common formats)
        /(?<!\w)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\w)/g,
    ];

    /**
     * Process a span by scanning its fields for sensitive patterns.
     * 
     * @param span - The input span to redact (mutated in-place)
     * @returns The same span instance with sensitive values redacted.
     */
    process(span: AnySpan): AnySpan {
        if (span.attributes) {
            span.attributes = this.deepRedact(span.attributes) as any;
        }
        if (span.metadata) {
            span.metadata = this.deepRedact(span.metadata);
        }
        if (span.input) {
            span.input = this.deepRedact(span.input);
        }
        if (span.output) {
            span.output = this.deepRedact(span.output);
        }

        return span;
    }

    /**
     * Recursively traverses an object/array and applies regex redaction to all strings.
     */
    private deepRedact(obj: any, seen = new WeakSet()): any {
        // Handle primitives
        if (obj === null || typeof obj !== 'object') {
            if (typeof obj === 'string') {
                let redacted = obj;
                for (const pattern of this.patterns) {
                    redacted = redacted.replace(pattern, '[REDACTED]');
                }
                return redacted;
            }
            return obj;
        }

        // Handle circular references
        if (seen.has(obj)) {
            return '[Circular]';
        }
        seen.add(obj);

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map((item) => this.deepRedact(item, seen));
        }

        // Handle objects
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            newObj[key] = this.deepRedact(value, seen);
        }
        return newObj;
    }

    async shutdown(): Promise<void> {
        // No-op
    }
}
