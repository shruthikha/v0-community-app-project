import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/v1/ai/ingest-status?documentId=...
 * 
 * Returns the current ingestion status of a document for the Río AI Agent.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const documentId = searchParams.get('documentId')

        if (!documentId) {
            return NextResponse.json(
                { success: false, error: { message: 'documentId is required', code: 'BAD_REQUEST' } },
                { status: 400 }
            )
        }

        // UUID validation to prevent database errors on malformed input
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(documentId)) {
            return NextResponse.json(
                { success: false, error: { message: 'documentId is malformed', code: 'BAD_REQUEST' } },
                { status: 400 }
            )
        }

        // 1. Authenticate
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        // 2. Verify Role and Tenant Context
        const { data: userData } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!userData || (userData.role !== 'tenant_admin' && userData.role !== 'super_admin')) {
            return NextResponse.json(
                { success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        // 3. Fetch Status from rio_documents
        // We query by source_document_id to find the bridge record
        const { data: rioDoc, error: rioError } = await supabase
            .from('rio_documents')
            .select('status, tenant_id, error_message')
            .eq('source_document_id', documentId)
            .maybeSingle()

        if (rioError) {
            console.error('[API/v1/ai/ingest-status] DB Error:', rioError)
            return NextResponse.json(
                { success: false, error: { message: 'Database error', code: 'DATABASE_ERROR' } },
                { status: 500 }
            )
        }

        if (!rioDoc) {
            return NextResponse.json(
                { success: true, data: { status: 'not_indexed', hasError: false } }
            )
        }

        // 4. Cross-tenant check
        if (userData.role !== 'super_admin' && rioDoc.tenant_id !== userData.tenant_id) {
            return NextResponse.json(
                { success: false, error: { message: 'Forbidden: Cross-tenant access', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                status: rioDoc.status,
                hasError: !!rioDoc.error_message,
                errorMessage: rioDoc.error_message
            }
        })

    } catch (error) {
        console.error('[API/v1/ai/ingest-status] Unexpected Error:', error)
        return NextResponse.json(
            { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
            { status: 500 }
        )
    }
}
