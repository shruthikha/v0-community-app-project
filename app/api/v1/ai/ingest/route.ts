import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorResponse, successResponse } from '@/lib/api/response'

/**
 * POST /api/v1/ai/ingest
 * 
 * BFF route to trigger document ingestion for the Río AI Agent.
 * 
 * Flow:
 * 1. Authenticate user via Supabase Server Client.
 * 2. Verify 'tenant_admin' or 'super_admin' role and tenant_id.
 * 3. Validate that the document exists and belongs to the user's tenant.
 * 4. Forward the trigger to the Railway Mastra endpoint.
 */
export async function POST(req: NextRequest) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for trigger

    try {
        // 1. Authenticate
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        // 2. Validate Body
        const body = await req.json().catch(() => ({}))
        const documentId = body.documentId || body.document_id

        if (!documentId) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'documentId is required', code: 'BAD_REQUEST' } },
                { status: 400 }
            )
        }

        // 3. Verify Role and Tenant Context
        // We check 'users' table for the most up-to-date role/tenant info
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'User profile not found', code: 'NOT_FOUND' } },
                { status: 404 }
            )
        }

        const isTenantAdmin = userData.role === 'tenant_admin'
        const isSuperAdmin = userData.role === 'super_admin'

        if (!isTenantAdmin && !isSuperAdmin) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Forbidden: Tenant Admin role required', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        const tenantId = userData.tenant_id

        if (!tenantId && !isSuperAdmin) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Tenant context missing', code: 'BAD_REQUEST' } },
                { status: 400 }
            )
        }

        // 4. Validate Document Ownership
        // Ensure the document exists and belongs to the same tenant
        const { data: document, error: docError } = await supabase
            .from('rio_documents')
            .select('id, tenant_id')
            .eq('id', documentId)
            .single()

        if (docError || !document) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Document not found', code: 'NOT_FOUND' } },
                { status: 404 }
            )
        }

        // Cross-tenant check
        if (!isSuperAdmin && document.tenant_id !== tenantId) {
            clearTimeout(timeoutId)
            console.warn(`[API/v1/ai/ingest] 403 Forbidden: Tenant mismatch for document ${documentId}. User Tenant: ${tenantId}, Doc Tenant: ${document.tenant_id}`)
            return NextResponse.json(
                { success: false, error: { message: 'Access denied: document belongs to different tenant', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        // 5. Forward to Railway
        const railwayUrl = process.env.RIO_RAILWAY_URL || 'http://localhost:3001'
        const agentKey = process.env.RIO_AGENT_KEY

        const response = await fetch(`${railwayUrl}/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-agent-key': agentKey || '', // Required for security
                'x-tenant-id': document.tenant_id,
                'x-user-id': user.id
            },
            body: JSON.stringify({
                documentId: document.id,
                tenantId: document.tenant_id
            }),
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}))
            console.error('[API/v1/ai/ingest] Railway error:', errorBody)
            throw new Error(`Railway agent returned ${response.status}: ${errorBody.error || 'Unknown error'}`)
        }

        return NextResponse.json(
            { success: true, data: { status: 'queued' } },
            { status: 202 }
        )

    } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('[API/v1/ai/ingest] Request to Railway timed out after 15s')
            return NextResponse.json(
                { success: false, error: { message: 'Gateway Timeout connecting to AI agent', code: 'GATEWAY_TIMEOUT' } },
                { status: 504 }
            )
        }

        console.error('[API/v1/ai/ingest] Error:', error)
        if (error instanceof Error) {
            // Using existing errorResponse utility if available, or manual fallback
            return NextResponse.json(
                { success: false, error: { message: error.message, code: 'INTERNAL_ERROR' } },
                { status: 500 }
            )
        }
        return NextResponse.json(
            { success: false, error: { message: 'An unexpected error occurred triggering ingestion', code: 'INTERNAL_ERROR' } },
            { status: 500 }
        )
    }
}
