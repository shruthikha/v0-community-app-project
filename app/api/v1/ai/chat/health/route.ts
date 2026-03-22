import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/v1/ai/chat/health
 * 
 * Proxies the health check to the Railway agent service.
 */
export async function GET(req: NextRequest) {
    try {
        const railwayUrl = process.env.RIO_RAILWAY_URL || 'http://localhost:3001'

        const response = await fetch(`${railwayUrl}/health`, {
            method: 'GET',
            cache: 'no-store',
        })

        if (!response.ok) {
            return NextResponse.json({ status: 'offline' }, { status: 503 })
        }

        return NextResponse.json({ status: 'ready' })
    } catch (error) {
        return NextResponse.json({ status: 'offline' }, { status: 503 })
    }
}
