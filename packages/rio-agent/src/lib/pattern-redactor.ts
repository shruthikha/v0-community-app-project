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
     * @param span - The input span to redact
     * @returns A new span with sensitive values replaced by [REDACTED]
     */
    process(span: AnySpan): AnySpan {
        // We create a shallow copy first. Deep copy is handled by recursive redaction of fields.
        const redactedSpan = { ...span };

        if (redactedSpan.attributes) {
            redactedSpan.attributes = this.deepRedact(redactedSpan.attributes) as any;
        }
        if (redactedSpan.metadata) {
            redactedSpan.metadata = this.deepRedact(redactedSpan.metadata);
        }
        if (redactedSpan.input) {
            redactedSpan.input = this.deepRedact(redactedSpan.input);
        }
        if (redactedSpan.output) {
            redactedSpan.output = this.deepRedact(redactedSpan.output);
        }

        return redactedSpan;
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
