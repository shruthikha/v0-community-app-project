import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorResponse } from '@/lib/api/response'
import { getAgentBaseUrl, RIO_AGENT_KEY } from "@/lib/ai/config";

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

        // Fetch user role and true tenant_id to allow super admins and handle stale JWTs
        const { data: userData } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single()
        const isSuperAdmin = userData?.role === 'super_admin'
        const actualTenantId = userData?.tenant_id || sessionTenantId

        // SECURITY: If requestedTenantId is provided and differs from session, verify impersonation isn't happening
        if (requestedTenantId !== actualTenantId && !isSuperAdmin) {
            clearTimeout(totalTimeoutId)
            console.error(`[API/v1/ai/chat] SECURITY: User ${user.id} (JWT: ${sessionTenantId}, DB: ${userData?.tenant_id}) attempted to access Tenant ${requestedTenantId}`)
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
        const tenantRagEnabled = rioConfig?.rag === true
        const isRagEnabled = tenantRagEnabled && (body.isRagEnabled !== false);

        // Strict Check: Rio AI must be enabled
        if (tenantError || !rioConfig?.enabled) {
            clearTimeout(totalTimeoutId)
            console.warn(`[API/v1/ai/chat] Access denied for tenant ${requestedTenantId}: Rio disabled`)
            return NextResponse.json(
                { success: false, error: { message: 'Río AI is not enabled for this community', code: 'FORBIDDEN' } },
                { status: 403 }
            )
        }

        // 1.3 Fetch Resident Profile for Tier 3 Context (Sprint 12 M4)
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select(`
                id, first_name, last_name, about, current_country,
                preferred_language, languages,
                user_interests (interests (name)),
                user_skills (skills (name))
            `)
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.warn(`[API/v1/ai/chat] Profile enrichment failed for user ${user.id}:`, profileError)
        }

        let residentContext = ''
        if (profile) {
            const interests = (profile.user_interests as any[] || [])
                .map((ui: any) => ui.interests?.name)
                .filter(Boolean)
            const skills = (profile.user_skills as any[] || [])
                .map((us: any) => us.skills?.name)
                .filter(Boolean)

            const languagesSpoken = Array.isArray(profile.languages) ? profile.languages.join(', ') : '';

            residentContext = `Resident Name: ${profile.first_name || ''} ${profile.last_name || ''}
Bio: ${profile.about || 'N/A'}
Current Country: ${profile.current_country || 'N/A'}
Preferred Language: ${profile.preferred_language || 'English'}
Languages Spoken: ${languagesSpoken || 'N/A'}
Interests: ${interests.length > 0 ? interests.join(', ') : 'None listed'}
Skills: ${skills.length > 0 ? skills.join(', ') : 'None listed'}`
        }

        const messages = body.messages || []
        const threadId = body.threadId
        const resourceId = user.id // Force userId for memory isolation (Sprint 12 M1-M7)
        const idempotencyKey = body.idempotencyKey || `chat-${user.id}-${Date.now()}`

        // 2. Forward to Railway with Tiered Timeout and Retry
        const railwayUrl = getAgentBaseUrl();

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

                response = await fetch(`${railwayUrl}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-tenant-id': requestedTenantId,
                        'x-user-id': user.id,
                        'x-rag-enabled': String(isRagEnabled),
                        'x-resident-context': Buffer.from(residentContext).toString('base64'),
                        'x-agent-key': RIO_AGENT_KEY,
                        'x-idempotency-key': idempotencyKey
                    },
                    body: JSON.stringify({
                        messages,
                        threadId: threadId || undefined,
                        resourceId: resourceId || undefined
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
            // Log the response body if the fetch to the agent fails and it's not a busy state
            if (response && !response.ok) {
                const errorText = await response.text()
                console.error(`[API/v1/ai/chat] Railway agent returned ${response.status}: ${errorText}`)
                return NextResponse.json(
                    { success: false, error: { message: `Río AI service encountered an error`, detail: errorText, code: 'INTERNAL_ERROR' } },
                    { status: 500 }
                )
            }
            // Fallback for other non-ok responses or missing body
            throw new Error(`Railway agent returned ${response?.status || 'no response'}`)
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

                                const chunkData: any = {
                                    type: 'text-delta',
                                    id: msgId,
                                    delta: data.token
                                }
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                            }

                            if (data.citations) {
                                // Forward citations as data annotations (#197)
                                const annotationsData = {
                                    type: 'data-citations',
                                    data: data.citations
                                }
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(annotationsData)}\n\n`))
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
                                    const chunkData: any = {
                                        type: 'text-delta',
                                        id: msgId,
                                        delta: data.token
                                    }
                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`))
                                }

                                if (data.citations) {
                                    const annotationsData = {
                                        type: 'data-citations',
                                        data: data.citations
                                    }
                                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(annotationsData)}\n\n`))
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
