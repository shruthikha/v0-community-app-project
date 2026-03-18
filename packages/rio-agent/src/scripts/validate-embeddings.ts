/**
 * Validation script for Mastra PgVector embeddings.
 *
 * Verifies:
 * 1. Semantic retrieval accuracy (>= 80% of test cases pass)
 * 2. Tenant isolation (Tenant A cannot see Tenant B data)
 * 3. Tenant B can see its own data
 */
import { mastra } from '../index.js';
import { generateEmbedding } from '../lib/embeddings.js';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';
const INDEX_NAME = 'rio_embeddings';

const testCases = [
    {
        name: 'Direct Match: Comunidad',
        query: '¿Cuáles son las reglas de la comunidad?',
        expectedContent: 'Reglas de la Comunidad',
    },
    {
        name: 'Semantic Match: Ruidos',
        query: '¿Se pueden hacer fiestas ruidosas por la noche?',
        expectedContent: 'ruidos molestos',
    },
    {
        name: 'Semantic Match: Mascotas',
        query: '¿Puedo tener un perro en el apartamento?',
        expectedContent: 'mascotas',
    },
    {
        name: 'Direct Match: Amenidades',
        query: '¿Cómo se usan las amenidades del edificio?',
        expectedContent: 'Amenidades',
    },
    {
        name: 'Semantic Match: Piscina',
        query: '¿A qué hora cierra la alberca?',
        expectedContent: 'piscina',
    },
];

async function validate() {
    console.log('--- Starting Embedding Validation ---');

    const vectorStore = mastra.getVector(INDEX_NAME);
    if (!vectorStore) {
        throw new Error(`Vector store '${INDEX_NAME}' not found`);
    }

    let successCount = 0;

    // --- Semantic accuracy tests ---
    for (const test of testCases) {
        console.log(`\nTesting: ${test.name}`);
        const start = Date.now();
        const queryVector = await generateEmbedding(test.query);

        const results = await vectorStore.query({
            indexName: INDEX_NAME,
            queryVector,
            topK: 3,
            filter: { tenant_id: TENANT_A } as any,
        });

        const latency = Date.now() - start;
        // content is stored in metadata
        const topResult = results[0];
        const content: string = (topResult?.metadata?.content ?? '') as string;

        if (content.toLowerCase().includes(test.expectedContent.toLowerCase())) {
            console.log(`✅ Pass (${latency}ms, score=${topResult?.score?.toFixed(4)})`);
            successCount++;
        } else {
            console.log(`❌ Fail (${latency}ms)`);
            console.log(`   Expected to contain: "${test.expectedContent}"`);
            console.log(`   Got: "${content.substring(0, 120)}..."`);
        }
    }

    // --- Tenant isolation test ---
    console.log('\n--- Testing Tenant Isolation ---');
    const secretQuery = await generateEmbedding('regla secreta para inquilino B');

    // Tenant A should NOT see Tenant B's data
    const aResults = await vectorStore.query({
        indexName: INDEX_NAME,
        queryVector: secretQuery,
        topK: 10,
        filter: { tenant_id: TENANT_A } as any,
    });
    const leaked = aResults.find(r => ((r.metadata?.content ?? '') as string).includes('inquilino B'));
    if (leaked) {
        console.log('❌ CRITICAL: Tenant A can see Tenant B data! Isolation failed.');
    } else {
        console.log('✅ Isolation OK: Tenant A sees no Tenant B data.');
    }

    // Tenant B should see its own data
    const bResults = await vectorStore.query({
        indexName: INDEX_NAME,
        queryVector: secretQuery,
        topK: 10,
        filter: { tenant_id: TENANT_B } as any,
    });
    const foundB = bResults.find(r => ((r.metadata?.content ?? '') as string).includes('inquilino B'));
    if (foundB) {
        console.log('✅ Tenant B can see its own isolated data.');
    } else {
        console.log('⚠️  Tenant B could not find its own data (may be a seeding issue).');
    }

    // --- Summary ---
    const total = testCases.length;
    const accuracy = successCount / total;
    console.log(`\n==========================`);
    console.log(`Accuracy: ${successCount}/${total} (${(accuracy * 100).toFixed(0)}%)`);
    console.log(`==========================`);

    if (accuracy < 0.8) {
        console.error('❌ FAIL: Accuracy below 80% threshold.');
        process.exit(1);
    } else {
        console.log('✅ PASS: Accuracy meets threshold.');
        process.exit(0);
    }
}

validate().catch(err => {
    console.error('Validation crashed:', err);
    process.exit(1);
});
