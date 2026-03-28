import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Priority Scores from PRD
const SCORES = {
    announcement: 100,
    check_in: 90,
    due_listing: 85,
    listing_pickup: 80,
    upcoming_event: 70,
    saved_event: 60,
    new_listing: 40 // Fallback for general new listings if we want to show them
}

export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get resident data
        const { data: resident, error: residentError } = await supabase
            .from("users")
            .select("id, tenant_id")
            .eq("id", user.id)
            .eq("role", "resident")
            .single()

        if (residentError || !resident) {
            console.error(`[Dashboard/Priority] 404: Resident not found for user ${user.id}. Role checked: resident. DB Error:`, residentError)
            return NextResponse.json({ error: "Resident not found" }, { status: 404 })
        }

        const now = new Date()
        const nowIso = now.toISOString()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        const nowPlus1h = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
        const nowPlus2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()

        // ---------------------------------------------------------
        // Parallel Initial Fetches
        // ---------------------------------------------------------
        const [
            announcementsRes,
            announcementReadsRes,
            userRsvpsRes,
            userSavedRes,
            checkInsRes,
            requestsRes,
            confirmedRes,
            lenderDueRes,
            borrowerDueRes
        ] = await Promise.all([
            // 1. Announcements (Increased limit to ensure unread aren't masked)
            supabase
                .from("announcements")
                .select("id, title, description, published_at, priority")
                .eq("tenant_id", resident.tenant_id)
                .eq("status", "published")
                .order("published_at", { ascending: false })
                .limit(50),

            // 2. Announcement Reads
            supabase
                .from("announcement_reads")
                .select("announcement_id")
                .eq("user_id", user.id),

            // 3. Event RSVPs
            supabase
                .from("event_rsvps")
                .select("event_id, rsvp_status")
                .eq("user_id", user.id)
                .in("rsvp_status", ["yes", "maybe"]),

            // 4. Saved Events
            supabase
                .from("saved_events")
                .select("event_id")
                .eq("user_id", user.id),

            // 5. Check-ins
            supabase
                .from("check_ins")
                .select(`
                    id, title, start_time, duration_minutes, location_id,
                    locations ( name ),
                    creator:users!created_by(id, first_name, last_name, profile_picture_url)
                `)
                .eq("tenant_id", resident.tenant_id)
                .eq("status", "active")
                .order("start_time", { ascending: false })
                .limit(5),

            // 6. Exchange Requests (Lender)
            supabase
                .from("exchange_transactions")
                .select(`
                    id, created_at,
                    listing:exchange_listings!inner(title),
                    borrower:users!exchange_transactions_borrower_id_fkey(first_name, last_name, profile_picture_url)
                `)
                .eq("lender_id", user.id)
                .eq("status", "requested"),

            // 7. Exchange Confirmed (Pickup)
            supabase
                .from("exchange_transactions")
                .select(`
                    id, created_at, status, lender_id, borrower_id,
                    listing:exchange_listings!inner(title),
                    lender:users!exchange_transactions_lender_id_fkey(first_name, last_name, profile_picture_url),
                    borrower:users!exchange_transactions_borrower_id_fkey(first_name, last_name, profile_picture_url)
                `)
                .eq("lender_id", user.id)
                .eq("status", "confirmed"),

            // 8. Items Lent Out Due Soon
            supabase
                .from("exchange_transactions")
                .select(`
                    id, expected_return_date,
                    listing:exchange_listings!inner(title),
                    borrower:users!exchange_transactions_borrower_id_fkey(first_name, last_name, profile_picture_url)
                `)
                .eq("lender_id", user.id)
                .eq("status", "picked_up")
                .lte("expected_return_date", nowPlus2d),

            // 9. Items Borrowed Due Soon
            supabase
                .from("exchange_transactions")
                .select(`
                    id, expected_return_date, status,
                    listing:exchange_listings!inner(title),
                    lender:users!exchange_transactions_lender_id_fkey(first_name, last_name, profile_picture_url)
                `)
                .eq("borrower_id", user.id)
                .eq("status", "picked_up")
                .lte("expected_return_date", nowPlus2d)
        ])

        // Reliability: Validate all batch responses
        const batchErrors = [
            announcementsRes.error, announcementReadsRes.error, userRsvpsRes.error,
            userSavedRes.error, checkInsRes.error, requestsRes.error,
            confirmedRes.error, lenderDueRes.error, borrowerDueRes.error
        ].filter(Boolean)

        if (batchErrors.length > 0) {
            console.error("[Dashboard/Priority] Batch fetch errors:", batchErrors)
            // We could return partial results, but for priority feed, a complete failure is safer to log
            return NextResponse.json({ error: "Failed to load priority data" }, { status: 500 })
        }

        const priorityItems: any[] = []

        // Process Announcements
        const readAnnouncementIds = new Set(announcementReadsRes.data?.map(r => r.announcement_id) || [])
        announcementsRes.data?.filter(a => !readAnnouncementIds.has(a.id)).slice(0, 5).forEach(announcement => {
            priorityItems.push({
                type: "announcement",
                id: announcement.id,
                title: announcement.title,
                description: announcement.description?.substring(0, 100) + "...",
                urgency: announcement.priority === 'urgent' ? 'high' : 'medium',
                timestamp: announcement.published_at,
                priority: SCORES.announcement,
                score: SCORES.announcement + (announcement.priority === 'urgent' ? 5 : 0)
            })
        })

        // Process Event IDs for enrichment
        const interactedEventIds = new Set<string>()
        const rsvpMap = new Map<string, string>()
        const savedSet = new Set<string>()

        userRsvpsRes.data?.forEach(r => {
            interactedEventIds.add(r.event_id)
            rsvpMap.set(r.event_id, r.rsvp_status)
        })
        userSavedRes.data?.forEach(s => {
            interactedEventIds.add(s.event_id)
            savedSet.add(s.event_id)
        })

        // Enrichment Query for Events
        if (interactedEventIds.size > 0) {
            const { data: events, error: eventsError } = await supabase
                .from("events")
                .select(`
                    id, title, description, start_date, end_date,
                    parent_event_id, recurrence_rule
                `)
                .in("id", Array.from(interactedEventIds))
                .or(`end_date.is.null,end_date.gte.${nowIso}`)
                .lte("start_date", nextWeek)
                .order("start_date", { ascending: true })
                .limit(10)

            if (eventsError) {
                console.error("[Dashboard/Priority] Error fetching event details:", eventsError)
                return NextResponse.json({ error: "Failed to load priority data" }, { status: 500 })
            }

            events?.forEach(event => {
                const isOngoing = new Date(event.start_date) <= now && (event.end_date ? new Date(event.end_date) >= now : true)
                const rsvpStatus = rsvpMap.get(event.id) || null
                const isSaved = savedSet.has(event.id)
                let score = SCORES.upcoming_event
                if (isOngoing) score += 5
                if (rsvpStatus === 'yes') score += 40

                priorityItems.push({
                    type: "event",
                    id: event.id,
                    title: event.title,
                    description: isOngoing ? "Happening now!" : event.description?.substring(0, 100) + "...",
                    urgency: isOngoing ? "high" : "medium",
                    timestamp: event.start_date,
                    priority: score,
                    score: score,
                    is_ongoing: isOngoing,
                    rsvp_status: rsvpStatus === 'yes' ? 'going' : rsvpStatus === 'no' ? 'not_going' : rsvpStatus,
                    is_saved: isSaved,
                    is_series: !!event.parent_event_id || !!event.recurrence_rule,
                    parent_event_id: event.parent_event_id,
                    start_date: event.start_date
                })
            })
        }

        // Process Check-ins
        checkInsRes.data?.forEach(checkIn => {
            const startTime = new Date(checkIn.start_time)
            const endTime = new Date(startTime.getTime() + checkIn.duration_minutes * 60000)
            if (endTime > now && startTime <= new Date(now.getTime() + 60 * 60 * 1000)) {
                // @ts-ignore
                const locationName = checkIn.locations?.name || "Unknown Location"
                // @ts-ignore
                const creatorName = checkIn.creator?.first_name || "Neighbor"
                // @ts-ignore
                const creatorAvatar = checkIn.creator?.profile_picture_url

                priorityItems.push({
                    type: "check_in",
                    id: checkIn.id,
                    title: `${creatorName} is at ${locationName}`,
                    description: `Join them until ${endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
                    urgency: "medium",
                    timestamp: checkIn.start_time,
                    priority: SCORES.check_in,
                    score: SCORES.check_in,
                    location: locationName,
                    creator_avatar: creatorAvatar,
                    end_time: endTime.toISOString(),
                    rsvp_status: null
                })
            }
        })

        // Process Exchange
        const combineExchange = [...(requestsRes.data || []), ...(confirmedRes.data || []), ...(lenderDueRes.data || []), ...(borrowerDueRes.data || [])]

        // (Individual processing left for simplicity in mapping logic)
        requestsRes.data?.forEach(req => {
            // @ts-ignore
            const borrower = Array.isArray(req.borrower) ? req.borrower[0] : req.borrower
            const borrowerName = borrower ? `${borrower.first_name} ${borrower.last_name}` : "Neighbor"
            // @ts-ignore
            const listingTitle = req.listing?.title || "Item"

            priorityItems.push({
                type: "exchange_request",
                id: req.id,
                title: `Request: ${listingTitle}`,
                description: `${borrowerName} wants to borrow this.`,
                urgency: "high",
                timestamp: req.created_at,
                priority: 110,
                score: 110,
                // @ts-ignore
                creator_avatar: borrower?.profile_picture_url,
                transaction_id: req.id
            })
        })

        confirmedRes.data?.forEach(tx => {
            // @ts-ignore
            const listingTitle = tx.listing?.title || "Item"
            const isLender = tx.lender_id === user.id
            // @ts-ignore
            const otherParty: any = isLender
                ? (Array.isArray(tx.borrower) ? tx.borrower[0] : tx.borrower)
                : (Array.isArray(tx.lender) ? tx.lender[0] : tx.lender)

            const otherName = otherParty ? `${otherParty.first_name} ${otherParty.last_name}` : "Neighbor"

            priorityItems.push({
                type: "exchange_confirmed",
                id: tx.id,
                title: `Ready for Pickup: ${listingTitle}`,
                description: `${otherName} is ready to pick this up`,
                urgency: "medium",
                timestamp: tx.created_at,
                priority: 80,
                score: 80,
                creator_avatar: otherParty?.profile_picture_url,
                transaction_id: tx.id
            })
        })

        lenderDueRes.data?.forEach(tx => {
            const dueDate = new Date(tx.expected_return_date)
            const isOverdue = dueDate < now
            // @ts-ignore
            const borrower = Array.isArray(tx.borrower) ? tx.borrower[0] : tx.borrower
            const borrowerName = borrower ? `${borrower.first_name} ${borrower.last_name}` : "Borrower"
            // @ts-ignore
            const listingTitle = tx.listing?.title || "Item"

            priorityItems.push({
                type: "exchange_return_due",
                id: tx.id,
                title: isOverdue ? `Overdue: ${listingTitle}` : `Return Due: ${listingTitle}`,
                description: `${borrowerName} should return this by ${dueDate.toLocaleDateString()}`,
                urgency: isOverdue ? "high" : "medium",
                timestamp: tx.expected_return_date,
                priority: 105,
                score: 105,
                creator_avatar: borrower?.profile_picture_url,
                transaction_id: tx.id,
                is_overdue: isOverdue
            })
        })

        borrowerDueRes.data?.forEach(tx => {
            const dueDate = new Date(tx.expected_return_date)
            const isOverdue = dueDate < now
            // @ts-ignore
            const lender = Array.isArray(tx.lender) ? tx.lender[0] : tx.lender
            const lenderName = lender ? `${lender.first_name} ${lender.last_name}` : "Lender"
            // @ts-ignore
            const listingTitle = tx.listing?.title || "Item"

            priorityItems.push({
                type: "exchange_return_due",
                id: tx.id,
                title: isOverdue ? `Overdue Return: ${listingTitle}` : `Return Soon: ${listingTitle}`,
                description: `Return to ${lenderName} by ${dueDate.toLocaleDateString()}`,
                urgency: isOverdue ? "high" : "medium",
                timestamp: tx.expected_return_date,
                priority: 105,
                score: isOverdue ? 110 : 105,
                creator_avatar: lender?.profile_picture_url,
                transaction_id: tx.id,
                is_overdue: isOverdue
            })
        })

        // Sort
        priorityItems.sort((a, b) => {
            if (a.type === 'check_in' && b.type !== 'check_in') return -1
            if (b.type === 'check_in' && a.type !== 'check_in') return 1
            const ex = ['exchange_request', 'exchange_confirmed', 'exchange_return_due']
            if (ex.includes(a.type) && !ex.includes(b.type)) return -1
            if (ex.includes(b.type) && !ex.includes(a.type)) return 1
            if (a.type === 'event' && b.type !== 'event') return -1
            if (b.type === 'event' && a.type !== 'event') return 1

            // Tier 2: Sort by score
            if (b.score !== a.score) return b.score - a.score

            // Tier 3: Sort by timestamp (newer first)
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        return NextResponse.json({ items: priorityItems.slice(0, 6) })
    } catch (error) {
        console.error("Error fetching priority feed:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
