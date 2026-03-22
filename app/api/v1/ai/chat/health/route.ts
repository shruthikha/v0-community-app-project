import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/v1/ai/chat/health
 * 
 * Proxies the health check to the Railway agent service.
 */
export async function GET(req: NextRequest) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout for health check

    try {
        const railwayUrl = process.env.RIO_RAILWAY_URL || process.env.RIO_AGENT_URL || 'http://localhost:3001'

        const response = await fetch(`${railwayUrl}/api/health`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            return NextResponse.json({ status: 'offline' }, { status: 503 })
        }

        return NextResponse.json({ status: 'ready' })
    } catch (error) {
        clearTimeout(timeoutId)

        return NextResponse.json({ status: 'offline' }, { status: 503 })
    }
}
