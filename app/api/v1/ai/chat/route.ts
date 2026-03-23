import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorResponse } from '@/lib/api/response'

/**
 * POST /api/v1/ai/chat
 * 
 * BFF route for Río AI Chat. Proxies the SSE stream from Mastra (running on Railway)
 * back to the client using Vercel AI SDK compatible `0:"message"` text formatting.
 * 
 * Flow:
 * 1. Authenticate user via Supabase Server Client.
 * 2. Extract tenant ID.
 * 3. Forward the request to the Railway Mastra endpoint.
 * 4. Transform the Mastra SSE stream format -> Vercel AI SDK stream format.
 */
export async function POST(req: NextRequest) {
    const controller = new AbortController()
    const totalTimeoutId = setTimeout(() => controller.abort(), 30000) // 30s Total Tier

    try {
        // 1. Authenticate and extract tenant
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            clearTimeout(totalTimeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        const body = await req.json().catch(() => ({}))

        // 1.1 Integrity Check: Do not trust body.tenantId if it differs from user session metadata
        const sessionTenantId = user.app_metadata?.tenant_id
        const requestedTenantId = body.tenantId || sessionTenantId

        if (!requestedTenantId) {
            clearTimeout(totalTimeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Tenant context required', code: 'BAD_REQUEST' } },
                { status: 400 }
            )
        }

        // SECURITY: If requestedTenantId is provided and differs from session, verify impersonation isn't happening
        // (Unless they are a super_admin, which we could check here, but standard residents must match)
        if (requestedTenantId !== sessionTenantId) {
            clearTimeout(totalTimeoutId)
            console.error(`[API/v1/ai/chat] SECURITY: User ${user.id} (Tenant ${sessionTenantId}) attempted to access Tenant ${requestedTenantId}`)
            return NextResponse.json(
                { success: false, error: { message: 'Mismatched tenant context', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        // 1.2 Check Feature Flags (Granular Gating #195)
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('features')
            .eq('id', requestedTenantId)
            .single()

        const rioConfig = tenant?.features?.rio

        // Strict Check: Bio AI must be enabled
        if (tenantError || !rioConfig?.enabled) {
            clearTimeout(totalTimeoutId)
            console.warn(`[API/v1/ai/chat] Access denied for tenant ${requestedTenantId}: Rio disabled`)
            return NextResponse.json(
                { success: false, error: { message: 'Río AI is not enabled for this community', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        // RAG flag (Determines if the agent can use document search tools)
        const isRagEnabled = !!rioConfig?.rag

        const messages = body.messages || []
        const threadId = body.threadId
        const resourceId = body.resourceId || requestedTenantId
        const idempotencyKey = body.idempotencyKey || `chat-${user.id}-${Date.now()}`

        // 2. Forward to Railway with Tiered Timeout and Retry
        const railwayUrl = process.env.RIO_RAILWAY_URL || process.env.RIO_AGENT_URL || 'http://localhost:3001'

        let response: Response | null = null
        let attempts = 0
        const MAX_ATTEMPTS = 2

        while (attempts < MAX_ATTEMPTS) {
            attempts++
            const connectionController = new AbortController()
            const connectionTimeout = setTimeout(() => connectionController.abort(), 15000) // 15s Tier 1

            try {
                // Manual signal linking for reliable timeout behavior across all Node.js versions
                const linkedController = new AbortController()
                const abortHandler = (reason: any) => linkedController.abort(reason)
                controller.signal.addEventListener('abort', abortHandler, { once: true })
                connectionController.signal.addEventListener('abort', abortHandler, { once: true })
                const linkedSignal = linkedController.signal

                response = await fetch(`${railwayUrl}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-tenant-id': requestedTenantId,
                        'x-user-id': user.id,
                        'x-rag-enabled': String(isRagEnabled),
                        'x-idempotency-key': idempotencyKey
                    },
                    body: JSON.stringify({
                        messages,
                        threadId,
                        resourceId
                    }),
                    signal: linkedSignal
                })
                clearTimeout(connectionTimeout)
                if (response.ok) break

                // If not OK but not a timeout, we might not want to retry depending on status
                if (response.status >= 500 && attempts < MAX_ATTEMPTS) {
                    console.warn(`[API/v1/ai/chat] Attempt ${attempts} failed with ${response.status}, retrying...`)
                    // Wait for the next attempt only if we have time left
                    await new Promise(resolve => setTimeout(resolve, 500))
                    continue
                }
                break
            } catch (err) {
                clearTimeout(connectionTimeout)
                if (err instanceof Error && err.name === 'AbortError') {
                    // If the TOTAL timeout fired, don't retry
                    if (controller.signal.aborted) {
                        console.error(`[API/v1/ai/chat] Total 30s timeout reached, aborting retries.`)
                        break
                    }
                    if (attempts < MAX_ATTEMPTS) {
                        console.warn(`[API/v1/ai/chat] Attempt ${attempts} connection timed out (15s), retrying...`)
                        continue
                    }
                }
                throw err
            }
        }

        clearTimeout(totalTimeoutId)

        if (!response || !response.ok || !response.body) {
            // Enhanced error reporting for the "Busy" state
            if (response?.status === 504 || response?.status === 503 || !response) {
                return NextResponse.json(
                    { success: false, error: { message: 'Busy', code: 'GATEWAY_TIMEOUT' } },
                    { status: 504 }
                )
            }
            throw new Error(`Railway agent returned ${response.status}`)
        }

        // 3. Transform Stream for Vercel AI SDK
        let buffer = ''
        let hasStarted = false
        const msgId = 'msg-' + Date.now().toString()

        const transformStream = new TransformStream({
            transform(chunk, controller) {
                const text = new TextDecoder().decode(chunk)
                buffer += text

                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.trim() === '') continue
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6)
                        if (dataStr === '[DONE]') {
                            controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`))
                            continue
                        }

                        try {
                            const data = JSON.parse(dataStr)
                            if (data.token) {
                                if (!hasStarted) {
                                    hasStarted = true
                                    const startData = { type: 'text-start', id: msgId }
                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(startData)}\n\n`))
                                }

                                const chunkData = {
                                    type: 'text-delta',
                                    id: msgId,
                                    delta: data.token
                                }
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                            }
                        } catch (e) {
                            console.error('Failed to parse Mastra chunk', dataStr)
                        }
                    }
                }
            },
            flush(controller) {
                if (buffer.trim() !== '') {
                    if (buffer.startsWith('data: ')) {
                        const dataStr = buffer.slice(6)
                        if (dataStr !== '[DONE]') {
                            try {
                                const data = JSON.parse(dataStr)
                                if (data.token) {
                                    if (!hasStarted) {
                                        hasStarted = true
                                        const startData = { type: 'text-start', id: msgId }
                                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(startData)}\n\n`))
                                    }
                                    const chunkData = {
                                        type: 'text-delta',
                                        id: msgId,
                                        delta: data.token
                                    }
                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                    }
                }
            }
        })

        const stream = response.body.pipeThrough(transformStream)

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        clearTimeout(totalTimeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('[API/v1/ai/chat] Request to Railway timed out after 30s')
            return NextResponse.json(
                { success: false, error: { message: 'Busy', code: 'GATEWAY_TIMEOUT' } },
                { status: 504 }
            )
        }

        console.error('[API/v1/ai/chat] Error:', error)
        if (error instanceof Error) {
            return errorResponse(error)
        }
        return errorResponse(new Error('An unexpected error occurred streaming the response'))
    }
}
