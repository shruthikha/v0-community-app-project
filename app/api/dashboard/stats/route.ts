import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Available stats definition - 12 Specific Stats
const AVAILABLE_STATS = [
    // Community Stats (Tenant Scope)
    { id: "neighborhoods_count", label: "# Neighborhoods", scope: "Community" },
    { id: "neighbors_count", label: "# Neighbors", scope: "Community" },
    { id: "upcoming_events_count", label: "# Upcoming Events", scope: "Community" },
    { id: "current_announcements_count", label: "# Current Announcements", scope: "Community" },
    { id: "active_checkins_count", label: "# Active Check-ins", scope: "Community" },
    { id: "active_requests_count", label: "# Active Requests", scope: "Community" },
    { id: "available_listings_count", label: "# Available Listings", scope: "Community" },

    // Personal Stats (User Scope)
    { id: "my_rsvps_count", label: "# My RSVPs", scope: "Personal" },
    { id: "my_saved_events_count", label: "# My Saved Events", scope: "Personal" },
    { id: "my_active_listings_count", label: "# My Active Listings", scope: "Personal" },
    { id: "my_active_transactions_count", label: "# My Active Transactions", scope: "Personal" },
    { id: "my_active_requests_count", label: "# My Active Requests", scope: "Personal" },
]

const DEFAULT_STATS = [
    "neighbors_count",
    "upcoming_events_count",
    "active_checkins_count",
    "available_listings_count"
]

async function calculateStat(supabase: any, statId: string, userId: string, tenantId: string) {
    const now = new Date().toISOString()
    // Get start of today for date comparisons to include events happening today
    const today = new Date().toISOString().split('T')[0]

    switch (statId) {
        // 1. # Neighborhoods
        case "neighborhoods_count":
            const { count: neighborhoods } = await supabase
                .from("neighborhoods")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
            return { value: neighborhoods || 0 }

        // Neighbors: Count residents in the tenant
        // Note: public.users table does not have deleted_at/banned_until columns
        case "neighbors_count":
            const { count: neighbors } = await supabase
                .from("users")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("role", "resident")
            return { value: neighbors || 0 }

        // 3. # Upcoming Events (end_time >= now)
        case "upcoming_events_count":
            const { count: events } = await supabase
                .from("events")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("status", "published")
                .is("cancelled_at", null)
                // Filter events that end in the future (or today)
                .gte("end_date", today)
            return { value: events || 0 }

        // 4. # Current Announcements (published)
        case "current_announcements_count":
            const { count: announcements } = await supabase
                .from("announcements")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("status", "published")
            return { value: announcements || 0 }

        // Active Check-ins: Must be status='active' AND (ended_at is null OR ended_at > now) AND (start_time + duration > now)
        case "active_checkins_count":
            // We need to filter by duration for check-ins that haven't been manually ended
            // Since we can't easily do date arithmetic with columns in the JS client without raw SQL or RPC,
            // we'll fetch active check-ins and filter in memory for now (assuming volume is low per tenant)
            // or use a raw query if needed. For now, let's try a more robust query.

            // Actually, we can use the `gt` filter on a calculated column if we had one, but we don't.
            // Let's fetch the potential active check-ins and filter in JS. 
            // This is safer than trying to construct complex raw SQL filters via the JS client if not supported directly.

            const { data: potentialActive } = await supabase
                .from("check_ins")
                .select("start_time, duration_minutes, ended_at")
                .eq("tenant_id", tenantId)
                .eq("status", "active")
                .is("ended_at", null)

            const activeCount = (potentialActive || []).filter((ci: any) => {
                const start = new Date(ci.start_time).getTime()
                const durationMs = ci.duration_minutes * 60 * 1000
                const end = start + durationMs
                return end > new Date().getTime()
            }).length

            return { value: activeCount }

        // 6. # Active Requests (Community - pending/in_progress)
        case "active_requests_count":
            const { count: requests } = await supabase
                .from("resident_requests")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .in("status", ["pending", "in_progress"])
            return { value: requests || 0 }

        // Available Listings: Must be status='published'
        case "available_listings_count":
            const { count: listings } = await supabase
                .from("exchange_listings")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("status", "published")
            return { value: listings || 0 }

        // 8. # My RSVPs (going/maybe)
        case "my_rsvps_count":
            // We should probably only count RSVPs for future events, but for now let's stick to the basic count
            // or better, join with events to ensure event is not cancelled/past?
            // Keeping simple for now as per original intent, but could be refined.
            const { count: rsvps } = await supabase
                .from("event_rsvps")
                .select("event_id", { count: "exact", head: true })
                .eq("user_id", userId)
                .in("rsvp_status", ["going", "maybe"])
            return { value: rsvps || 0 }

        // 9. # My Saved Events
        case "my_saved_events_count":
            // Join with events to ensure we only count active, upcoming events
            const { count: saved } = await supabase
                .from("saved_events")
                .select("event_id, events!inner(id)", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("events.status", "published")
                .is("events.cancelled_at", null)
                .gte("events.end_date", today)
            return { value: saved || 0 }

        // 10. # My Active Listings (available)
        case "my_active_listings_count":
            const { count: myListings } = await supabase
                .from("exchange_listings")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("created_by", userId)
                .eq("status", "available")
            return { value: myListings || 0 }

        // 11. # My Active Transactions (active statuses)
        case "my_active_transactions_count":
            const { count: myTx } = await supabase
                .from("exchange_transactions")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .or(`borrower_id.eq.${userId},lender_id.eq.${userId}`)
                .in("status", ["requested", "approved", "scheduled", "picked_up", "confirmed"])
            return { value: myTx || 0 }

        // 12. # My Active Requests (pending/in_progress)
        case "my_active_requests_count":
            const { count: myRequests } = await supabase
                .from("resident_requests")
                .select("id", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("created_by", userId)
                .in("status", ["pending", "in_progress"])
            return { value: myRequests || 0 }

        default:
            return { value: "-" }
    }
}

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Get user config and tenant_id
        const { data: userData } = await supabase
            .from("users")
            .select("dashboard_stats_config, tenant_id")
            .eq("id", user.id)
            .single()

        if (!userData) {
            console.error(`[Dashboard/Stats] 404: User record not found in public.users for ID: ${user.id}`)
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        console.log(`[Dashboard/Stats] Success: Loaded config for user ${user.id} on tenant ${userData.tenant_id}`)

        // Parse config
        let config = userData.dashboard_stats_config
        let statsList = DEFAULT_STATS

        // Handle legacy config structure or new structure
        if (config && typeof config === 'object' && !Array.isArray(config)) {
            statsList = config.stats || DEFAULT_STATS
        } else if (Array.isArray(config)) {
            statsList = config
        }

        // Filter out any stats that might be in config but no longer available
        statsList = statsList.filter((id: string) => AVAILABLE_STATS.some(s => s.id === id))

        // If list is empty (e.g. all previous stats were deprecated), reset to default
        if (statsList.length === 0) {
            statsList = DEFAULT_STATS
        }

        // Calculate stats
        const calculatedStats = await Promise.all(statsList.map(async (statId: string) => {
            const def = AVAILABLE_STATS.find(s => s.id === statId)
            if (!def) return null

            const data = await calculateStat(supabase, statId, user.id, userData.tenant_id)
            return {
                ...def,
                ...data
            }
        }))

        return NextResponse.json({
            stats: calculatedStats.filter(Boolean),
            config: statsList,
            available: AVAILABLE_STATS,
            scope: "tenant" // Fixed scope as requested stats are explicit
        })

    } catch (error) {
        console.error("Error fetching stats:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { stats } = await req.json()

        if (!Array.isArray(stats) || stats.length > 13) {
            return NextResponse.json({ error: "Invalid stats configuration" }, { status: 400 })
        }

        // Store as object to maintain compatibility if we add other config later
        const config = {
            stats,
            scope: "tenant"
        }

        const { error } = await supabase
            .from("users")
            .update({ dashboard_stats_config: config })
            .eq("id", user.id)

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error updating stats config:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
