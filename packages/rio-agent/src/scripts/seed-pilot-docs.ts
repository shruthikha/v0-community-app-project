import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const TENANT_ID = '0cfc777f-5798-470d-a2ad-c8573eceba7e'; // Ecovilla San Mateo
const ASSETS_DIR = path.resolve(process.cwd(), 'assets/pilot-docs');
const BUCKET_NAME = 'rio-documents';

async function seed() {
    const files = fs.readdirSync(ASSETS_DIR).filter(f => !f.startsWith('.'));

    console.log(`[SEED] Found ${files.length} files in ${ASSETS_DIR}`);

    for (const file of files) {
        const filePath = path.join(ASSETS_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = `${TENANT_ID}/${file}`;

        console.log(`[SEED] Uploading ${file} to storage...`);

        // 1. Upload to storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
                upsert: true,
                contentType: file.endsWith('.pdf') ? 'application/pdf' : 'text/markdown'
            });

        if (uploadError) {
            console.error(`[SEED] Failed to upload ${file}:`, uploadError.message);
            continue;
        }

        console.log(`[SEED] Registering ${file} in database...`);

        // 2. Find or Register in DB
        const { data: existingDoc } = await supabase
            .from('rio_documents')
            .select('id')
            .eq('file_path', storagePath)
            .single();

        let doc;
        if (existingDoc) {
            console.log(`[SEED] Document already exists, updating...`);
            const { data: updatedDoc, error: updateError } = await supabase
                .from('rio_documents')
                .update({
                    name: file,
                    status: 'pending',
                    metadata: {}
                })
                .eq('id', existingDoc.id)
                .select()
                .single();

            if (updateError) {
                console.error(`[SEED] Failed to update ${file}:`, updateError.message);
                continue;
            }
            doc = updatedDoc;
        } else {
            const { data: insertedDoc, error: insertError } = await supabase
                .from('rio_documents')
                .insert({
                    tenant_id: TENANT_ID,
                    file_path: storagePath,
                    name: file,
                    status: 'pending',
                    metadata: {}
                })
                .select()
                .single();

            if (insertError) {
                console.error(`[SEED] Failed to register ${file} in DB:`, insertError.message);
                continue;
            }
            doc = insertedDoc;
        }

        console.log(`[SEED] Document registered with ID: ${doc.id}`);

        // 3. Trigger ingestion workflow
        console.log(`[SEED] Triggering ingestion for ${doc.id}...`);
        try {
            const { ingestionWorkflow } = await import('../workflows/ingest.js');
            const run = await ingestionWorkflow.createRun();
            const result = await run.start({
                inputData: { documentId: doc.id }
            });

            if (result.status === 'success') {
                console.log(`[SEED] SUCCESS: Ingestion completed for ${file}`);
                console.log(`[SEED] Created ${result.result.chunkCount} chunks.`);
            } else {
                console.error(`[SEED] FAILED: Ingestion failed for ${file}:`, (result as any).error);
            }
        } catch (e) {
            console.error(`[SEED] Trigger failed:`, e);
        }
    }

    console.log('[SEED] Finished seeding pilot documents.');
}

seed().catch(console.error);
