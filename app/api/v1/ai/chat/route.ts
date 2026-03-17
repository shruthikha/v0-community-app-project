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
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
        // 1. Authenticate and extract tenant
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            )
        }

        const body = await req.json().catch(() => ({}))
        const tenantId = body.tenantId || user.app_metadata?.tenant_id

        if (!tenantId) {
            clearTimeout(timeoutId)
            return NextResponse.json(
                { success: false, error: { message: 'Tenant ID required', code: 'BAD_REQUEST' } },
                { status: 400 }
            )
        }

        const messages = body.messages || []
        const threadId = body.threadId
        const resourceId = body.resourceId || tenantId

        // 2. Forward to Railway
        const railwayUrl = process.env.RIO_RAILWAY_URL || 'http://localhost:3001'

        const response = await fetch(`${railwayUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': tenantId,
                'x-user-id': user.id
            },
            body: JSON.stringify({
                messages,
                threadId,
                resourceId
            }),
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok || !response.body) {
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
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('[API/v1/ai/chat] Request to Railway timed out after 30s')
            return NextResponse.json(
                { success: false, error: { message: 'Gateway Timeout connecting to AI agent', code: 'GATEWAY_TIMEOUT' } },
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
