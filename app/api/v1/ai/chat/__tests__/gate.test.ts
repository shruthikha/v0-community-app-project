import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { createServerClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
    createServerClient: vi.fn()
}))

describe('AI Chat BFF Gate (#199)', () => {
    let mockSupabase: any

    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubGlobal('fetch', vi.fn())
        mockSupabase = {
            auth: {
                getUser: vi.fn()
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn()
        }
            ; (createServerClient as any).mockResolvedValue(mockSupabase)
    })

    it('should return 401 if unauthorized', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
        const req = new NextRequest('http://localhost/api/v1/ai/chat', { method: 'POST' })
        const res = await POST(req)
        expect(res.status).toBe(401)
    })

    it('should return 403 if Río is disabled for the tenant', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123', app_metadata: { tenant_id: 'tenant-123' } } },
            error: null
        })

        // Mock tenant data with rio disabled
        mockSupabase.single.mockResolvedValue({
            data: { features: { rio: { enabled: false } } },
            error: null
        })

        const req = new NextRequest('http://localhost/api/v1/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ tenantId: 'tenant-123' })
        })

        const res = await POST(req)
        expect(res.status).toBe(403)
        const body = await res.json()
        expect(body.error.code).toBe('FORBIDDEN')
    })

    it('should allow request (200 OK) if Río is enabled even if RAG is disabled', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123', app_metadata: { tenant_id: 'tenant-123' } } },
            error: null
        })

        mockSupabase.single.mockResolvedValue({
            data: { features: { rio: { enabled: true, rag: false } } },
            error: null
        })

        // Mock fetch to Railway
        const mockResponse = {
            ok: true,
            status: 200,
            body: new ReadableStream({ start(c) { c.close() } })
        }
            ; (global.fetch as any).mockResolvedValue(mockResponse)

        const req = new NextRequest('http://localhost/api/v1/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ tenantId: 'tenant-123', messages: [] })
        })

        const res = await POST(req)
        expect(res.status).toBe(200)
    })

    it('should allow request if both Río and RAG are enabled', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123', app_metadata: { tenant_id: 'tenant-123' } } },
            error: null
        })

        // Mock tenant data with both enabled
        mockSupabase.single.mockResolvedValue({
            data: { features: { rio: { enabled: true, rag: true } } },
            error: null
        })

        // Mock the subsequent fetch to Railway to avoid error
        const mockResponse = {
            ok: true,
            status: 200,
            body: new ReadableStream({
                start(controller) {
                    controller.close()
                }
            })
        }
            ; (global.fetch as any).mockResolvedValue(mockResponse)

        const req = new NextRequest('http://localhost/api/v1/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ tenantId: 'tenant-123', messages: [] })
        })

        const res = await POST(req)
        // It should proceed past the gate successfully
        expect(res.status).toBe(200)
    })

    it('should block if tenant id mismatches user session', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123', app_metadata: { tenant_id: 'tenant-123' } } },
            error: null
        })

        // This won't be reached due to tenant mismatch check, but mock anyway for clarity
        mockSupabase.single.mockResolvedValue({
            data: { features: { rio: { enabled: true } } },
            error: null
        })

        const req = new NextRequest('http://localhost/api/v1/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ tenantId: 'ATTACKER-TENANT' })
        })

        const res = await POST(req)
        expect(res.status).toBe(403)
        const body = await res.json()
        expect(body.error.message).toContain('Mismatched tenant context')
    })
})
