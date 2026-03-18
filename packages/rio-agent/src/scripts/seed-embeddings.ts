/**
 * Seed script for Mastra PgVector.
 *
 * PgVector manages its own table schema:
 *   - vector_id (text, unique)
 *   - embedding (vector)
 *   - metadata (jsonb)
 *
 * We store tenant_id, content, and source inside `metadata`.
 * Tenant isolation is enforced at query time via metadata filter.
 */
import { randomUUID } from 'crypto';
import { mastra } from '../index.js';
import { generateEmbeddings, generateEmbedding } from '../lib/embeddings.js';
import { MDocument } from '@mastra/rag';

const TENANT_A = '00000000-0000-0000-0000-000000000001';
const TENANT_B = '00000000-0000-0000-0000-000000000002';
const INDEX_NAME = 'rio_embeddings';
const DIMENSION = 1536;

const documents = [
    {
        title: 'Reglas de la Comunidad - Nido Residencial',
        content: `# Reglas de la Comunidad

Bienvenido a Nido Residencial. Para garantizar la convivencia armoniosa de todos los
residentes, se establecen las siguientes reglas:

## Ruido
No se permiten ruidos molestos después de las 10pm ni antes de las 8am.
Queda prohibido realizar fiestas o reuniones con música a alto volumen sin previa autorización.

## Mascotas
Se permiten mascotas (perros y gatos) con registro previo en administración.
Los propietarios son responsables de las áreas comunes y deben recoger los desechos de sus mascotas.

## Áreas Comunes
El uso de áreas comunes es exclusivo para residentes y sus invitados registrados.
`,
    },
    {
        title: 'Uso de Amenidades',
        content: `# Uso de Amenidades

## Piscina
La piscina está disponible de 7am a 10pm todos los días.
El uso de la alberca requiere traje de baño apropiado y ducha previa.
No se permite el consumo de alimentos ni bebidas alcohólicas en el área de la piscina.

## Gimnasio
El gimnasio está abierto las 24 horas para residentes registrados.
Favor de limpiar el equipo después de usarlo.

## Salón de Eventos
El salón de eventos debe reservarse con mínimo 48 horas de anticipación.
El aforo máximo es de 50 personas.
`,
    },
];

async function seed() {
    console.log('--- Starting Seeding Process ---');

    const vectorStore = mastra.getVector(INDEX_NAME);
    if (!vectorStore) {
        throw new Error(`Vector store '${INDEX_NAME}' not found in Mastra instance`);
    }

    // Create or ensure the index exists
    console.log(`Ensuring index '${INDEX_NAME}' exists with dim=${DIMENSION}...`);
    await vectorStore.createIndex({
        indexName: INDEX_NAME,
        dimension: DIMENSION,
        metric: 'cosine',
        indexConfig: { type: 'hnsw', hnsw: { m: 16, efConstruction: 64 } },
    });

    for (const doc of documents) {
        console.log(`Processing: ${doc.title}`);

        const mdoc = MDocument.fromMarkdown(doc.content);
        const chunks = await mdoc.chunk({ strategy: 'recursive' });
        console.log(`Generated ${chunks.length} chunks.`);

        const texts = chunks.map(c => c.text);
        const embeddings = await generateEmbeddings(texts);

        const ids = chunks.map(() => randomUUID());
        const metadata = chunks.map(chunk => ({
            tenant_id: TENANT_A,
            content: chunk.text,
            source: doc.title,
        }));

        await vectorStore.upsert({
            indexName: INDEX_NAME,
            vectors: embeddings,
            metadata,
            ids,
        });

        console.log(`Stored ${chunks.length} records for ${doc.title}`);
    }

    // Isolation test: seed one record for Tenant B
    console.log('Seeding isolation test chunk for Tenant B...');
    const bContent = 'Esta es una regla secreta para el inquilino B.';
    const bEmbedding = await generateEmbedding(bContent);
    await vectorStore.upsert({
        indexName: INDEX_NAME,
        vectors: [bEmbedding],
        metadata: [{ tenant_id: TENANT_B, content: bContent, source: 'Isolated' }],
        ids: [randomUUID()],
    });

    console.log('--- Seeding Completed Successfully ---');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
