import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { search_documents } from '../agents/rio-agent.js';
import pg from 'pg';

const { Pool } = pg;

// Mock the embedding generation to be deterministic and avoid API calls
vi.mock('../lib/embeddings.js', () => ({
    generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1))
}));

// Pilot Tenant IDs
const ALEGRIA_ID = '9dfddd33-5a7c-4e5f-a1b8-fe05343b3934';
const ECOVILLA_ID = '0cfc777f-5798-470d-a2ad-c8573eceba7e';

describe('RAG Tool: search_documents (#193)', () => {
    let pool: pg.Pool;

    beforeAll(async () => {
        const connectionString = process.env.RIO_DATABASE_URL;
        if (!connectionString) throw new Error('RIO_DATABASE_URL not set');

        pool = new Pool({
            connectionString,
            ssl: connectionString.includes('localhost')
                ? false
                : process.env.NODE_ENV === 'production'
                    ? { ca: process.env.RIO_DATABASE_CA_CERT, rejectUnauthorized: true }
                    : { rejectUnauthorized: false }
        });

        // Ensure we have some test data (this assumes the pilot seed has run, 
        // but we'll add a specific test document and chunk just in case)
        const mockEmbedding = new Array(1536).fill(0.1);

        // 1. Seed a test document
        const docResult = await pool.query(
            `INSERT INTO public.rio_documents (tenant_id, name, status, metadata) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [ALEGRIA_ID, 'Alegria Test Doc', 'ready', JSON.stringify({ is_test: true })]
        );

        const documentId = docResult.rows[0]?.id;

        // 2. Seed a test chunk associated with that document
        if (documentId) {
            await pool.query(
                `INSERT INTO public.rio_document_chunks (tenant_id, document_id, content, embedding, metadata) 
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING`,
                [ALEGRIA_ID, documentId, 'Test content for Alegria', `[${mockEmbedding.join(',')}]`, JSON.stringify({ is_test: true })]
            );
        }
    });

    afterAll(async () => {
        if (pool) {
            // Clean up test-specific data from both tables
            // Order is important because of foreign key constraint
            await pool.query(
                `DELETE FROM public.rio_document_chunks WHERE (metadata->>'is_test')::boolean IS TRUE`
            );
            await pool.query(
                `DELETE FROM public.rio_documents WHERE (metadata->>'is_test')::boolean IS TRUE`
            );
            await pool.end();
        }
    });

    it('should return results when ragEnabled is true and tenantId matches', async () => {
        const input = { query: 'test query' };
        const context = {
            memory: {
                metadata: {
                    tenantId: ALEGRIA_ID,
                    ragEnabled: true
                }
            }
        };

        const result: any = await search_documents.execute!(input, context as any);

        expect(result.results).toBeDefined();
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results[0].content).toContain('Alegria');
    });

    it('should return info message and empty results when ragEnabled is false', async () => {
        const input = { query: 'test query' };
        const context = {
            memory: {
                metadata: {
                    tenantId: ALEGRIA_ID,
                    ragEnabled: false
                }
            }
        };

        const result: any = await search_documents.execute!(input, context as any);

        expect(result.results).toEqual([]);
        expect(result.info).toContain('disabled');
    });

    it('should NOT return Alegria results when querying as Ecovilla', async () => {
        const input = { query: 'test query' };
        // Query as Ecovilla
        const context = {
            memory: {
                metadata: {
                    tenantId: ECOVILLA_ID,
                    ragEnabled: true
                }
            }
        };

        const result: any = await search_documents.execute!(input, context as any);

        // Even if the query embedding is similar to Alegria's data, it should be filtered by tenant_id
        const alegriaResults = result.results.filter((r: any) => r.content.includes('Alegria'));
        expect(alegriaResults.length).toBe(0);
    });

    it('should fail gracefully if tenantId is missing', async () => {
        const input = { query: 'test query' };
        const context = {
            memory: {
                metadata: {
                    ragEnabled: true
                }
            }
        };

        const result: any = await search_documents.execute!(input, context as any);

        expect(result.error).toContain('missing');
    });
});
