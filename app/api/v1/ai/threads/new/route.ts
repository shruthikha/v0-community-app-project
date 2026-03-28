import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const RIO_AGENT_URL = process.env.RIO_AGENT_URL || "http://localhost:3001";
const RIO_AGENT_KEY = process.env.RIO_AGENT_KEY;

/**
 * POST /api/v1/ai/threads/new
 * Proxy endpoint to create a new server-side thread in the Rio Agent.
 */
export async function POST(req: NextRequest) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));

        // Use session tenant as fallback
        const sessionTenantId = user.app_metadata?.tenant_id;
        const requestedTenantId = body.tenantId || sessionTenantId;

        if (!requestedTenantId) {
            return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
        }

        // Verify tenant authorization
        const { data: userData } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single();
        const isSuperAdmin = userData?.role === 'super_admin';
        const actualTenantId = userData?.tenant_id || sessionTenantId;

        if (requestedTenantId !== actualTenantId && !isSuperAdmin) {
            console.error(`[BFF/threads/new] SECURITY: User ${user.id} attempted to access tenant ${requestedTenantId}`);
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Forward to Railway
        const response = await fetch(`${RIO_AGENT_URL}/threads/new`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-agent-key": RIO_AGENT_KEY || "",
                "x-tenant-id": requestedTenantId,
                "x-user-id": user.id,
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[BFF/threads/new] Agent proxy error:", errorText);
            return NextResponse.json({ error: "Failed to create thread", detail: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn("[BFF/threads/new] Request timed out after 10s");
            return NextResponse.json({ error: "Request timed out" }, { status: 504 });
        }
        console.error("[BFF/threads/new] Exception:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        clearTimeout(timeoutId);
    }
}
