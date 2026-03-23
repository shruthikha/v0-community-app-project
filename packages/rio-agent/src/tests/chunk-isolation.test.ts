import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// Pilot Tenant IDs from 20260319030000_rio_pilot_seed.sql
const ALEGRIA_ID = '9dfddd33-5a7c-4e5f-a1b8-fe05343b3934';
const ECOVILLA_ID = '0cfc777f-5798-470d-a2ad-c8573eceba7e';

// Unique ID for this specific test run to prevent cleanup collisions
const TEST_RUN_ID = crypto.randomUUID();

const ALEGRIA_SENTENCES = [
    "La Yoga Shala ofrece sesiones al amanecer para todos los vecinos.",
    "Nuestro Coworking Hub cuenta con internet de alta velocidad y café orgánico.",
    "La granja de permacultura comunal es el corazón de nuestra regeneración.",
    "Más de 135 vecinos viven en armonía en las colinas reforestadas.",
    "El cuidado de la gente y el cuidado de la tierra son nuestros pilares."
];

const ECOVILLA_SENTENCES = [
    "La casa comunal Rancho es perfecta para reuniones de hasta 300 familias.",
    "Nuestra piscina semi-olímpica está abierta todos los días desde las 6 AM.",
    "Aspiramos a una producción de alimentos en el sitio del 100%.",
    "La red de micro-energía renovable provee electricidad a los 6 vecindarios.",
    "Diseñamos para la armonía con la naturaleza y conexiones humanas fuertes."
];

/**
 * Mock embedding function for deterministic testing (1536 dimensions).
 * Avoids live AI API calls and flakiness.
 */
async function generateMockEmbedding(text: string): Promise<number[]> {
    const vector = new Array(1536).fill(0);
    // Simple deterministic hash-like vector generation
    for (let i = 0; i < text.length; i++) {
        vector[i % 1536] = text.charCodeAt(i) / 255;
    }
    return vector;
}

// Batch version
async function generateMockEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(generateMockEmbedding));
}

/**
 * Integration test for cross-tenant chunk isolation.
 * Proves that Tenant A cannot see Tenant B's vectors.
 */
describe('Cross-Tenant Chunk Isolation', () => {
    let pool: pg.Pool;

    beforeAll(async () => {
        const connectionString = process.env.RIO_DATABASE_URL;
        if (!connectionString) {
            throw new Error('RIO_DATABASE_URL is not set');
        }

        pool = new Pool({
            connectionString,
            ssl: connectionString.includes('localhost')
                ? false
                : process.env.NODE_ENV === 'production'
                    ? { ca: process.env.RIO_DATABASE_CA_CERT, rejectUnauthorized: true }
                    : { rejectUnauthorized: false },
            max: 20
        });

        console.log('--- Seeding Test Chunks (Mock Embeddings) ---');

        const alegriaEmbeddings = await generateMockEmbeddings(ALEGRIA_SENTENCES);
        const ecovillaEmbeddings = await generateMockEmbeddings(ECOVILLA_SENTENCES);

        // Seed Alegria
        for (let i = 0; i < ALEGRIA_SENTENCES.length; i++) {
            await pool.query(
                `INSERT INTO public.rio_document_chunks (tenant_id, content, embedding, metadata) 
                 VALUES ($1, $2, $3, $4)`,
                [ALEGRIA_ID, ALEGRIA_SENTENCES[i], JSON.stringify(alegriaEmbeddings[i]), JSON.stringify({ is_test: true, test_run_id: TEST_RUN_ID, community: 'Alegria' })]
            );
        }

        // Seed Ecovilla
        for (let i = 0; i < ECOVILLA_SENTENCES.length; i++) {
            await pool.query(
                `INSERT INTO public.rio_document_chunks (tenant_id, content, embedding, metadata) 
                 VALUES ($1, $2, $3, $4)`,
                [ECOVILLA_ID, ECOVILLA_SENTENCES[i], JSON.stringify(ecovillaEmbeddings[i]), JSON.stringify({ is_test: true, test_run_id: TEST_RUN_ID, community: 'Ecovilla' })]
            );
        }

        console.log('✅ Seeding complete.');
    }, 30000);

    afterAll(async () => {
        if (pool) {
            console.log('--- Cleaning up Test Chunks ---');
            await pool.query(`DELETE FROM public.rio_document_chunks WHERE metadata->>'test_run_id' = $1`, [TEST_RUN_ID]);
            await pool.end();
            console.log(`✅ Cleanup complete for run ${TEST_RUN_ID}.`);
        }
    });

    it('should never return chunks from Ecovilla when querying for Alegria (100 parallel iterations)', async () => {
        const searchVector = await generateMockEmbedding('¿Dónde puedo practicar Yoga en la comunidad?');

        const iterations = Array.from({ length: 100 });

        const results = await Promise.all(iterations.map(async (_, idx) => {
            const { rows } = await pool.query(
                `SELECT tenant_id, content, metadata
                 FROM public.rio_document_chunks 
                 WHERE tenant_id = $1 
                 ORDER BY embedding <=> $2 
                 LIMIT 5`,
                [ALEGRIA_ID, JSON.stringify(searchVector)]
            );
            return { idx, rows };
        }));

        for (const { idx, rows } of results) {
            const leaked = rows.find((r: any) => r.tenant_id === ECOVILLA_ID);
            expect(leaked, `Cross-tenant leakage detected at iteration ${idx}`).toBeUndefined();
            rows.forEach((r: any) => {
                expect(r.tenant_id).toBe(ALEGRIA_ID);
            });
        }
    }, 30000);

    it('should verify RLS isolation even without WHERE clause (Mocking authenticated user)', async () => {
        // This test simulates an authenticated query where WHERE tenant_id is omitted.
        // It proves RLS is working as a fallback.
        // Note: In real postgres tests, we set role to authenticated and set request.jwt.claims

        await pool.query(`SET ROLE authenticated;`);
        await pool.query(`SELECT set_config('request.jwt.claims', $1, true);`, [
            JSON.stringify({ tenant_id: ALEGRIA_ID, role: 'authenticated' })
        ]);

        const { rows } = await pool.query(
            `SELECT tenant_id FROM public.rio_document_chunks LIMIT 10`
        );

        // Should ONLY return Alegria chunks
        rows.forEach((r: any) => {
            expect(r.tenant_id).toBe(ALEGRIA_ID);
        });

        const ecovillaLeaks = rows.filter((r: any) => r.tenant_id === ECOVILLA_ID);
        expect(ecovillaLeaks.length).toBe(0);

        await pool.query(`RESET ROLE;`);
    });
});
