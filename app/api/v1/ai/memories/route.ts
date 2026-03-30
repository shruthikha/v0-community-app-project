import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

// M12: Centralized Tenant Resolution helper for AI routes
async function resolveUserTenantId(supabase: any, user: any) {
    let tenantId = user.app_metadata?.tenant_id
    if (!tenantId) {
        // Fallback for residents: look up in public.users table
        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        tenantId = userData?.tenant_id
    }
    return tenantId
}

/**
 * GET /api/v1/ai/memories
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = await resolveUserTenantId(supabase, user)
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
        }

        const railwayUrl = process.env.RIO_RAILWAY_URL || process.env.RIO_AGENT_URL || 'http://localhost:3001'

        // M12: Security Hardening - Abort signal for all external calls
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${railwayUrl}/memories`, {
            headers: {
                'x-tenant-id': tenantId,
                'x-user-id': user.id,
                'x-agent-key': process.env.RIO_AGENT_KEY || ''
            },
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            // M12: Fail-closed logic - genericize external errors to prevent information leakage
            console.error(`[API/v1/ai/memories] Agent GET failed: ${response.status}`)
            return NextResponse.json({ error: 'Memory service unavailable' }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Memory service timeout' }, { status: 504 })
        }
        console.error('[API/v1/ai/memories] GET error:', error)
        return NextResponse.json({ error: 'Internal memory error' }, { status: 500 })
    }
}

/**
 * DELETE /api/v1/ai/memories
 */
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = await resolveUserTenantId(supabase, user)
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
        }

        const all = req.nextUrl.searchParams.get('all')
        const index = req.nextUrl.searchParams.get('index')

        const railwayUrl = process.env.RIO_RAILWAY_URL || process.env.RIO_AGENT_URL || 'http://localhost:3001'

        let url = `${railwayUrl}/memories`
        if (all === 'true') {
            url += '?all=true'
        } else if (index !== null) {
            const indexInt = parseInt(index, 10)
            if (isNaN(indexInt) || indexInt < 0) {
                return NextResponse.json({ error: 'Invalid memory index' }, { status: 400 })
            }
            url += `?index=${indexInt}`
        } else {
            return NextResponse.json({ error: 'Missing delete parameters' }, { status: 400 })
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'x-tenant-id': tenantId,
                'x-user-id': user.id,
                'x-agent-key': process.env.RIO_AGENT_KEY || ''
            },
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`[API/v1/ai/memories] Agent DELETE failed: ${response.status}`)
            return NextResponse.json({ error: 'Memory deletion failed' }, { status: response.status })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Memory service timeout' }, { status: 504 })
        }
        console.error('[API/v1/ai/memories] DELETE error:', error)
        return NextResponse.json({ error: 'Internal memory error' }, { status: 500 })
    }
}

/**
 * PUT /api/v1/ai/memories
 */
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const tenantId = await resolveUserTenantId(supabase, user)
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
        }

        const body = await req.json()

        // Robust Zod validation
        const updateSchema = z.object({
            index: z.number().min(0),
            content: z.string().min(1).max(2000) // Lowered max for safety
        })

        const validation = updateSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid memory update data' }, { status: 400 })
        }

        const railwayUrl = process.env.RIO_RAILWAY_URL || process.env.RIO_AGENT_URL || 'http://localhost:3001'

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${railwayUrl}/memories`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': tenantId,
                'x-user-id': user.id,
                'x-agent-key': process.env.RIO_AGENT_KEY || ''
            },
            body: JSON.stringify(validation.data),
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`[API/v1/ai/memories] Agent PUT failed: ${response.status}`)
            return NextResponse.json({ error: 'Memory update failed' }, { status: response.status })
        }

        return NextResponse.json(await response.json())
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return NextResponse.json({ error: 'Memory service timeout' }, { status: 504 })
        }
        console.error('[API/v1/ai/memories] PUT error:', error)
        return NextResponse.json({ error: 'Internal memory error' }, { status: 500 })
    }
}
