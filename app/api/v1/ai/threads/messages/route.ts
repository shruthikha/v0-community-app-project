import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

import { getAgentBaseUrl, RIO_AGENT_KEY } from "@/lib/ai/config";

/**
 * GET /api/v1/ai/threads/messages
 * Proxy endpoint to fetch hydrated message history for a specific thread.
 */
export async function GET(req: NextRequest) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get("threadId");

        // Use session tenant as fallback, but allow explicit override for cross-tenant admins
        const sessionTenantId = user.app_metadata?.tenant_id;
        const requestedTenantId = searchParams.get("tenantId") || sessionTenantId;

        if (!threadId || !requestedTenantId) {
            return NextResponse.json({ error: "Missing threadId or tenantId" }, { status: 400 });
        }

        // Verify tenant authorization (Defense-in-Depth)
        const { data: userData } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single();
        const isSuperAdmin = userData?.role === 'super_admin';
        const actualTenantId = userData?.tenant_id || sessionTenantId;

        if (requestedTenantId !== actualTenantId && !isSuperAdmin) {
            console.error(`[BFF/threads/messages] SECURITY: User ${user.id} attempted to access tenant ${requestedTenantId}`);
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Forward to Railway
        const agentBaseUrl = getAgentBaseUrl();
        const response = await fetch(`${agentBaseUrl}/threads/messages?threadId=${encodeURIComponent(threadId)}`, {
            headers: {
                "x-agent-key": RIO_AGENT_KEY || "",
                "x-tenant-id": requestedTenantId,
                "x-user-id": user.id,
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[BFF/threads/messages] Agent proxy error:", errorText);
            return NextResponse.json({ error: "Failed to fetch messages", detail: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn("[BFF/threads/messages] Request timed out after 10s");
            return NextResponse.json({ error: "Request timed out" }, { status: 504 });
        }
        console.error("[BFF/threads/messages] Exception:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        clearTimeout(timeoutId);
    }
}
