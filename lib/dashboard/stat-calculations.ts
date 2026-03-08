import { createClient } from "@/lib/supabase/server"

export async function calculateStatValue(
    statId: string,
    userId: string,
    tenantId: string
): Promise<number> {
    const supabase = await createClient()

    switch (statId) {
        case "active_neighbors": {
            // Get user's neighborhood
            const { data: user } = await supabase
                .from("users")
                .select("lot_id, lots!inner(neighborhood_id)")
                .eq("id", userId)
                .single()

            if (!(user?.lots as any)?.neighborhood_id) return 0

            // Count active check-ins in neighborhood
            const { count } = await supabase
                .from("check_ins")
                .select("*, user_id!inner(lot_id, lots!inner(neighborhood_id))", { count: "exact", head: true })
                .eq("status", "active")
                .eq("user_id.lots.neighborhood_id", (user!.lots as any).neighborhood_id)

            return count || 0
        }

        case "total_neighbors": {
            // Get user's neighborhood
            const { data: user } = await supabase
                .from("users")
                .select("lot_id, lots!inner(neighborhood_id)")
                .eq("id", userId)
                .single()

            if ((user?.lots as any)?.neighborhood_id) {
                // Count in neighborhood
                const { count } = await supabase
                    .from("users")
                    .select("id, lot_id, lots!inner(neighborhood_id)", { count: "exact", head: true })
                    .eq("role", "resident")
                    .eq("lots.neighborhood_id", (user!.lots as any).neighborhood_id)

                return count || 0
            } else {
                // Count in community
                const { count } = await supabase
                    .from("users")
                    .select("*", { count: "exact", head: true })
                    .eq("tenant_id", tenantId)
                    .eq("role", "resident")

                return count || 0
            }
        }

        case "upcoming_events": {
            const sevenDaysFromNow = new Date()
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

            const { count } = await supabase
                .from("events")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .gte("start_date", new Date().toISOString())
                .lte("start_date", sevenDaysFromNow.toISOString())

            return count || 0
        }

        case "new_announcements": {
            const { count } = await supabase
                .from("announcements")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .is("read_by", "cs.{}")  // Not read by user

            return count || 0
        }

        case "active_requests": {
            // Get user's neighborhood
            const { data: user } = await supabase
                .from("users")
                .select("lot_id, lots!inner(neighborhood_id)")
                .eq("id", userId)
                .single()

            if (!(user?.lots as any)?.neighborhood_id) return 0

            const { count } = await supabase
                .from("resident_requests")
                .select("*, user_id!inner(lot_id, lots!inner(neighborhood_id))", { count: "exact", head: true })
                .in("status", ["pending", "in_progress"])
                .eq("user_id.lots.neighborhood_id", (user!.lots as any).neighborhood_id)

            return count || 0
        }

        case "available_listings": {
            // Get user's neighborhood
            const { data: user } = await supabase
                .from("users")
                .select("lot_id, lots!inner(neighborhood_id)")
                .eq("id", userId)
                .single()

            if (!(user?.lots as any)?.neighborhood_id) return 0

            const { count } = await supabase
                .from("exchange_listings")
                .select("*, user_id!inner(lot_id, lots!inner(neighborhood_id))", { count: "exact", head: true })
                .eq("status", "available")
                .eq("user_id.lots.neighborhood_id", (user!.lots as any).neighborhood_id)

            return count || 0
        }

        case "current_checkins": {
            const { count } = await supabase
                .from("check_ins")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId)
                .eq("status", "active")

            return count || 0
        }

        case "due_pickups": {
            const { count } = await supabase
                .from("exchange_listings")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("pickup_ready", true)

            return count || 0
        }

        case "your_events": {
            const { count } = await supabase
                .from("event_rsvps")
                .select("*, event_id!inner(*)", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "going")
                .gte("event_id.start_date", new Date().toISOString())

            return count || 0
        }

        case "saved_events": {
            const { count } = await supabase
                .from("saved_events")
                .select("*, event_id!inner(*)", { count: "exact", head: true })
                .eq("user_id", userId)
                .gte("event_id.start_date", new Date().toISOString())

            return count || 0
        }

        case "your_listings": {
            const { count } = await supabase
                .from("exchange_listings")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "available")

            return count || 0
        }

        case "response_rate": {
            // Get total requests user has responded to
            const { count: totalResponses } = await supabase
                .from("request_responses")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)

            // Get total requests in user's scope
            const { count: totalRequests } = await supabase
                .from("resident_requests")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId)

            if (!totalRequests) return 0
            return Math.round(((totalResponses || 0) / totalRequests) * 100)
        }

        case "connections": {
            const { count } = await supabase
                .from("connections")
                .select("*", { count: "exact", head: true })
                .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
                .eq("status", "accepted")

            return count || 0
        }

        default:
            return 0
    }
}
