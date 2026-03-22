import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    // We don't throw immediately to allow local dev without these unless ingestion is triggered
    console.warn('[SUPABASE] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Storage operations will fail.');
}

/**
 * Singleton-ish admin client for the background service.
 * Always uses the service_role key to bypass RLS.
 */
export const supabaseAdmin = createClient(
    supabaseUrl || '',
    supabaseServiceRoleKey || '',
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

export interface RioDocument {
    id: string;
    tenant_id: string;
    file_path: string;
    source_document_id?: string;
    status: 'ready' | 'pending' | 'processing' | 'processed' | 'error';
    error_message?: string | null;
    embedding_model?: string;
    updated_at?: string;
}

/**
 * Fetches document metadata from the public.rio_documents table.
 */
export async function getDocMetadata(documentId: string): Promise<RioDocument | null> {
    const { data, error } = await supabaseAdmin
        .from('rio_documents')
        .select('*')
        .eq('id', documentId)
        .single();

    if (error || !data) {
        console.error(`[SUPABASE] Error fetching document ${documentId}:`, error);
        return null;
    }

    return data as RioDocument;
}

/**
 * PR Feedback (r2943265507): Atomic "Claim" of a document to prevent race conditions.
 * Only transitions to 'processing' if currently 'ready' or 'pending'.
 */
export async function claimDocument(documentId: string): Promise<RioDocument | null> {
    const { data, error } = await supabaseAdmin
        .from('rio_documents')
        .update({ status: 'processing', updated_at: new Date().toISOString() }) // Force update timestamp
        .eq('id', documentId)
        .in('status', ['ready', 'pending', 'error']) // Allow re-trying error state
        .select()
        .single();

    if (error || !data) {
        return null;
    }

    return data as RioDocument;
}

/**
 * Updates the document status and optional error message.
 */
export async function updateDocStatus(
    documentId: string,
    status: RioDocument['status'],
    errorMessage?: string,
    embeddingModel?: string
) {
    const update: Partial<RioDocument> = {
        status,
        updated_at: new Date().toISOString()
    };

    // PR Feedback (r2943230489): Always clear error message if moving to processing/processed
    if (status === 'processing' || status === 'processed') {
        update.error_message = null as any;
    }

    if (errorMessage !== undefined) {
        update.error_message = errorMessage;
    }

    if (embeddingModel !== undefined) {
        update.embedding_model = embeddingModel;
    }

    const { error } = await supabaseAdmin
        .from('rio_documents')
        .update(update)
        .eq('id', documentId);

    if (error) {
        console.error(`[SUPABASE] Failed to update status for ${documentId}:`, error);
    }
}

/**
 * Downloads a file from the 'rio-documents' bucket as a Buffer.
 */
export async function downloadDocument(path: string): Promise<Buffer | null> {
    // If path is a full URL, extract the relative storage path
    let storagePath = path;
    if (path.includes('/storage/v1/object/public/documents/')) {
        storagePath = path.split('/storage/v1/object/public/documents/')[1];
    } else if (path.startsWith('http')) {
        // Handle generic URLs if they contain the bucket name
        const bucketMatch = path.match(/\/documents\/(.+)$/);
        if (bucketMatch) {
            storagePath = bucketMatch[1];
        }
    }

    const { data, error } = await supabaseAdmin.storage
        .from('documents')
        .download(storagePath);

    if (error || !data) {
        console.error(`[SUPABASE] Error downloading file from ${path}:`, error);
        return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
}
/**
 * Issue #190: Atomic Upsert of chunks using Postgres RPC.
 * This ensures old chunks are deleted and new ones inserted in a single transaction.
 */
export async function saveChunks(documentId: string, tenantId: string, chunks: any[]) {
    // Replaced getSupabaseClient(true) with existing supabaseAdmin
    const supabase = supabaseAdmin;

    const { error } = await supabase.rpc('upsert_document_chunks', {
        p_document_id: documentId,
        p_tenant_id: tenantId,
        p_chunks: chunks
    });

    if (error) {
        console.error(`[SUPABASE] Failed to upsert chunks for document ${documentId}:`, error);
        throw new Error(`Failed to save document chunks: ${error.message}`);
    }

    console.log(`[SUPABASE] Successfully saved ${chunks.length} chunks via RPC for ${documentId}`);
}
