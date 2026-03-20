import { describe, it, expect, vi } from 'vitest';
import { generateEmbeddings } from '../lib/embeddings.js';

// Mock the AI SDK embedMany function
vi.mock('ai', async () => {
    const actual = await vi.importActual('ai');
    return {
        ...actual,
        embedMany: vi.fn(async ({ values }) => {
            return {
                embeddings: values.map(() => new Array(2048).fill(0.123)), // Simulate large embedding
            };
        }),
    };
});

describe('Embeddings Library', () => {
    it('should process embeddings in batches of 50', async () => {
        const texts = new Array(120).fill('test text');
        const embeddings = await generateEmbeddings(texts);

        expect(embeddings.length).toBe(120);
        // Each embedding should be truncated to 1536
        expect(embeddings[0].length).toBe(1536);
        expect(embeddings[0][0]).toBe(0.123);
    });

    it('should handle small batches correctly', async () => {
        const texts = ['one', 'two'];
        const embeddings = await generateEmbeddings(texts);
        expect(embeddings.length).toBe(2);
        expect(embeddings[0].length).toBe(1536);
    });
});
