import { describe, it, expect } from 'vitest';
import { sha256 } from './sha256';

describe('sha256', () => {
    it('should generate consistent 64-character hex hashes', () => {
        const input = 'test-id-123';
        const hash = sha256(input);

        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);

        // Consistency check
        expect(sha256(input)).toBe(hash);
    });

    it('should generate different hashes for different inputs', () => {
        expect(sha256('id1')).not.toBe(sha256('id2'));
    });

    it('should return empty string for null/empty input', () => {
        expect(sha256('')).toBe('');
        expect(sha256(null as any)).toBe('');
    });
});
