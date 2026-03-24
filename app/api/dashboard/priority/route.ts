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
        console.log(`[Dashboard/Priority] Success: Found resident for user ${user.id} on tenant ${resident.tenant_id}`)

        const priorityItems: any[] = []
        const now = new Date()
        const nowIso = now.toISOString()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

        // ---------------------------------------------------------
        // 1. Announcements (Score: 100) - Only Unread Published
        // ---------------------------------------------------------
        const { data: announcements } = await supabase
            .from("announcements")
            .select("id, title, description, published_at, priority")
            .eq("tenant_id", resident.tenant_id)
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(10) // Fetch more since we'll filter some out

        // Get read announcements for this user
        let readAnnouncementIds: Set<string> = new Set()
        if (announcements && announcements.length > 0) {
            const { data: readAnnouncements } = await supabase
                .from("announcement_reads")
                .select("announcement_id")
                .eq("user_id", user.id)
                .in("announcement_id", announcements.map(a => a.id))

            readAnnouncementIds = new Set(readAnnouncements?.map(r => r.announcement_id) || [])
        }

        // Only include unread announcements
        announcements?.filter(a => !readAnnouncementIds.has(a.id)).slice(0, 5).forEach(announcement => {
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

        // ---------------------------------------------------------
        // 2. Events (Score: 70) - Upcoming in next 7 days, RSVP'd (Yes/Maybe), or Saved
        // ---------------------------------------------------------

        // Step A: Get Interacted Event IDs (RSVP or Saved)
        const { data: userRsvps } = await supabase
            .from("event_rsvps")
            .select("event_id, rsvp_status")
            .eq("user_id", user.id)
            .in("rsvp_status", ["yes", "maybe"])

        const { data: userSaved } = await supabase
            .from("saved_events")
            .select("event_id")
            .eq("user_id", user.id)

        const interactedEventIds = new Set<string>()
        const rsvpMap = new Map<string, string>()
        const savedSet = new Set<string>()

        userRsvps?.forEach(r => {
            interactedEventIds.add(r.event_id)
            rsvpMap.set(r.event_id, r.rsvp_status)
        })

        userSaved?.forEach(s => {
            interactedEventIds.add(s.event_id)
            savedSet.add(s.event_id)
        })

        // Step B: Fetch Details for these events IF they are upcoming
        if (interactedEventIds.size > 0) {
            console.log('[Priority Feed] Fetching interacted events between:', nowIso, 'and', nextWeek)
            const { data: events, error: eventsError } = await supabase
                .from("events")
                .select(`
                    id, 
                    title, 
                    description, 
                    start_date, 
                    end_date,
                    parent_event_id,
                    recurrence_rule
                `)
                .in("id", Array.from(interactedEventIds)) // Only fetching what we care about
                .or(`end_date.is.null,end_date.gte.${nowIso}`) // Not ended yet (includes ongoing with null end_date)
                .lte("start_date", nextWeek) // Within next 7 days
                .order("start_date", { ascending: true })
                .limit(10)

            if (eventsError) {
                console.error('[Priority Feed] Events query error:', eventsError)
            }

            console.log('[Priority Feed] Found', events?.length || 0, 'relevant interacted events')

            events?.forEach(event => {
                const isOngoing = new Date(event.start_date) <= now && new Date(event.end_date) >= now
                const rsvpStatus = rsvpMap.get(event.id) || null
                const isSaved = savedSet.has(event.id)

                console.log(`[Priority Feed] Event "${event.title}": rsvpStatus=${rsvpStatus}, isSaved=${isSaved}, isOngoing=${isOngoing}`)

                let score = SCORES.upcoming_event
                if (isOngoing) score += 5
                if (rsvpStatus === 'yes') score += 40 // High priority for going

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
        } else {
            console.log('[Priority Feed] No interacted events found.')
        }

        // ---------------------------------------------------------
        // 3. Check-ins (Score: 90) - Active or Starting Soon (1h)
        // ---------------------------------------------------------
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
        const { data: checkIns } = await supabase
            .from("check_ins")
            .select(`
                id,
                title,
                start_time,
                duration_minutes,
                location_id,
                locations ( name ),
                creator:users!created_by(
                    id,
                    first_name,
                    last_name,
                    profile_picture_url
                )
            `)
            .eq("tenant_id", resident.tenant_id)
            .eq("status", "active")
            .order("start_time", { ascending: false })
            .limit(5)

        checkIns?.forEach(checkIn => {
            const startTime = new Date(checkIn.start_time)
            const endTime = new Date(startTime.getTime() + checkIn.duration_minutes * 60000)

            // Only include if still active or starts within 1 hour
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
                    rsvp_status: null // Check-ins can have RSVP in the future
                })
            }
        })

        // ---------------------------------------------------------
        // 4. Exchange Transactions (Score: 95-110)
        // ---------------------------------------------------------

        // A. Requests (Lender View)
        const { data: requests } = await supabase
            .from("exchange_transactions")
            .select(`
                id, created_at,
                listing:exchange_listings!inner(title),
                borrower:users!exchange_transactions_borrower_id_fkey(first_name, last_name, profile_picture_url)
            `)
            .eq("lender_id", user.id)
            .eq("status", "requested")

        requests?.forEach(req => {
            // @ts-ignore
            const borrowerName = req.borrower ? `${req.borrower.first_name} ${req.borrower.last_name}` : "Neighbor"
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
                creator_avatar: req.borrower?.profile_picture_url,
                transaction_id: req.id
            })
        })

        // B. Confirmed (Pickup) (Borrower & Lender View)
        const { data: confirmed } = await supabase
            .from("exchange_transactions")
            .select(`
                id, created_at, status, lender_id, borrower_id,
                listing:exchange_listings!inner(title),
                lender:users!exchange_transactions_lender_id_fkey(first_name, last_name, profile_picture_url),
                borrower:users!exchange_transactions_borrower_id_fkey(first_name, last_name, profile_picture_url)
            `)
            .eq("lender_id", user.id)
            .eq("status", "confirmed")

        confirmed?.forEach(tx => {
            // @ts-ignore
            const listingTitle = tx.listing?.title || "Item"
            const isLender = tx.lender_id === user.id

            // Handle potential array response from Supabase for joined relations
            // @ts-ignore
            const lenderData = Array.isArray(tx.lender) ? tx.lender[0] : tx.lender
            // @ts-ignore
            const borrowerData = Array.isArray(tx.borrower) ? tx.borrower[0] : tx.borrower

            const otherParty = isLender ? borrowerData : lenderData
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
                // @ts-ignore
                creator_avatar: otherParty?.profile_picture_url,
                transaction_id: tx.id
            })
        })

        // C. Return Due (Lender View) - Items lent out that are due back in 2 days
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
        const { data: lenderDueTransactions } = await supabase
            .from("exchange_transactions")
            .select(`
                id,
                expected_return_date,
                listing:exchange_listings!inner(title),
                borrower:users!exchange_transactions_borrower_id_fkey(first_name, last_name, profile_picture_url)
            `)
            .eq("lender_id", user.id)
            .eq("status", "picked_up")
            .lte("expected_return_date", twoDaysFromNow)

        lenderDueTransactions?.forEach(tx => {
            const dueDate = new Date(tx.expected_return_date)
            const isOverdue = dueDate < now
            // @ts-ignore
            const borrowerName = tx.borrower ? `${tx.borrower.first_name} ${tx.borrower.last_name}` : "Borrower"
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
                // @ts-ignore
                creator_avatar: tx.borrower?.profile_picture_url,
                transaction_id: tx.id,
                is_overdue: isOverdue
            })
        })

        // D. Items Borrowed (Borrower View) - Items user borrowed that are due back in 2 days
        console.log('[Priority Feed] Checking borrower transactions due within 2 days for user:', user.id)
        console.log('[Priority Feed] Two days from now cutoff:', twoDaysFromNow)
        const { data: borrowerDueTransactions, error: borrowerError } = await supabase
            .from("exchange_transactions")
            .select(`
                id,
                expected_return_date,
                status,
                listing:exchange_listings!inner(title),
                lender:users!exchange_transactions_lender_id_fkey(first_name, last_name, profile_picture_url)
            `)
            .eq("borrower_id", user.id)
            .eq("status", "picked_up")
            .lte("expected_return_date", twoDaysFromNow)

        if (borrowerError) {
            console.error('[Priority Feed] Borrower transactions query error:', borrowerError)
        }
        console.log('[Priority Feed] Found', borrowerDueTransactions?.length || 0, 'borrowed items due soon')
        if (borrowerDueTransactions && borrowerDueTransactions.length > 0) {
            console.log('[Priority Feed] Borrowed items:', borrowerDueTransactions.map(tx => ({
                id: tx.id,
                // @ts-ignore
                listing: tx.listing?.title,
                status: tx.status,
                due: tx.expected_return_date
            })))
        }

        borrowerDueTransactions?.forEach(tx => {
            const dueDate = new Date(tx.expected_return_date)
            const isOverdue = dueDate < now
            // @ts-ignore
            const lenderName = tx.lender ? `${tx.lender.first_name} ${tx.lender.last_name}` : "Lender"
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
                score: isOverdue ? 110 : 105, // Overdue gets higher priority
                // @ts-ignore
                creator_avatar: tx.lender?.profile_picture_url,
                transaction_id: tx.id,
                is_overdue: isOverdue
            })
        })

        // ---------------------------------------------------------
        // Sort with Time-Sensitive Logic
        // ---------------------------------------------------------
        priorityItems.sort((a, b) => {
            // 1. Check-ins always first (most time-sensitive)
            if (a.type === 'check_in' && b.type !== 'check_in') return -1
            if (b.type === 'check_in' && a.type !== 'check_in') return 1

            // 2. Exchange transactions by urgency
            const exchangeTypes = ['exchange_request', 'exchange_confirmed', 'exchange_return_due']
            const aIsExchange = exchangeTypes.includes(a.type)
            const bIsExchange = exchangeTypes.includes(b.type)

            if (aIsExchange && !bIsExchange) return -1
            if (bIsExchange && !aIsExchange) return 1
            if (aIsExchange && bIsExchange) {
                // Sort overdue first, then by due date
                if (a.is_overdue && !b.is_overdue) return -1
                if (!a.is_overdue && b.is_overdue) return 1
                // Then by timestamp (sooner dates first)
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            }

            // 3. Events by date (sooner first)
            if (a.type === 'event' && b.type !== 'event') return -1
            if (b.type === 'event' && a.type !== 'event') return 1
            if (a.type === 'event' && b.type === 'event') {
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            }

            // 4. Announcements last, by created date (newest first)
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        // Return flat list of up to 6 items (no hero concept)
        const items = priorityItems.slice(0, 6)

        return NextResponse.json({ items })
    } catch (error) {
        console.error("Error fetching priority feed:", error)
        return NextResponse.json(
            { error: "Failed to fetch priority feed" },
            { status: 500 }
        )
    }
}
