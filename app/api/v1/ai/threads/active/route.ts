import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { getAgentBaseUrl, RIO_AGENT_KEY } from "@/lib/ai/config";

/**
 * GET /api/v1/ai/threads/active
 * Proxy endpoint to fetch the last active thread for a user from the Rio Agent.
 */
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get("tenantId");

        if (!tenantId) {
            return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
        }

        // Proxy to Rio Agent on Railway/Local
        const agentBaseUrl = getAgentBaseUrl();
        const response = await fetch(
            `${agentBaseUrl}/threads/active?userId=${user.id}&tenantId=${tenantId}`,
            {
                headers: {
                    "x-agent-key": RIO_AGENT_KEY || "",
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[BFF] Active thread proxy error:", errorText);
            return NextResponse.json({ threadId: null }); // Fail gracefully
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[BFF] Active thread lookup exception:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
