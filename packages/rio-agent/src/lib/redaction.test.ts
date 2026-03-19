import { describe, it, expect } from 'vitest';
import { PatternRedactor } from './pattern-redactor';

describe('PatternRedactor', () => {
    const redactor = new PatternRedactor();

    const createSpan = (content: any) => ({
        name: 'test-span',
        input: content,
        output: content,
        attributes: { msg: content },
        metadata: { info: content },
    } as any);

    describe('Email Redaction', () => {
        it('should redact simple emails', () => {
            const span = createSpan('Contact me at test@example.com for info.');
            const redacted = redactor.process(span);
            expect(redacted.input).toBe('Contact me at [REDACTED] for info.');
        });

        it('should redact emails with subdomains', () => {
            const span = createSpan('test.user@sub.example.co.uk');
            const redacted = redactor.process(span);
            expect(redacted.input).toBe('[REDACTED]');
        });
    });

    describe('Phone Redaction', () => {
        it('should redact standard US numbers', () => {
            const span = createSpan('555-123-4567');
            const redacted = redactor.process(span);
            expect(redacted.input).toBe('[REDACTED]');
        });

        it('should redact numbers with dots', () => {
            const span = createSpan('555.123.4567');
            const redacted = redactor.process(span);
            expect(redacted.input).toBe('[REDACTED]');
        });

        it('should redact numbers with spaces', () => {
            const span = createSpan('555 123 4567');
            const redacted = redactor.process(span);
            expect(redacted.input).toBe('[REDACTED]');
        });

        it('should redact numbers with country code', () => {
            const span = createSpan('+1 555 123 4567');
            const redacted = redactor.process(span);
            expect(redacted.input).toBe('[REDACTED]');
        });

        it('should redact parenthesized numbers (BUG fix validation)', () => {
            const span = createSpan('(555) 123-4567');
            const redacted = redactor.process(span);
            // This is expected to FAIL with the current implementation using \b
            expect(redacted.input).toBe('[REDACTED]');
        });
    });
});
