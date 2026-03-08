import type { NotificationType, CreateNotificationData } from "@/types/notifications"

/**
 * Utility functions for generating notification content
 */

export function generateNotificationTitle(
  type: NotificationType,
  context: {
    actorName?: string
    listingTitle?: string
    eventTitle?: string
  },
): string {
  const { actorName, listingTitle, eventTitle } = context

  switch (type) {
    // Exchange notifications
    case "exchange_request":
      return `New borrow request${listingTitle ? ` for ${listingTitle}` : ""}`
    case "exchange_confirmed":
      return `Your request${listingTitle ? ` for ${listingTitle}` : ""} was approved`
    case "exchange_rejected":
      return `Your request${listingTitle ? ` for ${listingTitle}` : ""} was declined`
    case "exchange_picked_up":
      return `Pickup confirmed${listingTitle ? ` for ${listingTitle}` : ""}`
    case "exchange_returned":
      return `Item returned${listingTitle ? ` - ${listingTitle}` : ""}`
    case "exchange_return_initiated":
      return `${actorName || "Someone"} has returned${listingTitle ? ` ${listingTitle}` : " an item"}`
    case "exchange_completed":
      return `Transaction completed${listingTitle ? ` - ${listingTitle}` : ""}`
    case "exchange_extension_request":
      return `${actorName || "Someone"} requests extension${listingTitle ? ` for ${listingTitle}` : ""}`
    case "exchange_extension_approved":
      return `Extension approved${listingTitle ? ` for ${listingTitle}` : ""}`
    case "exchange_extension_rejected":
      return `Extension declined${listingTitle ? ` for ${listingTitle}` : ""}`
    case "exchange_cancelled":
      return `Request cancelled${listingTitle ? ` - ${listingTitle}` : ""}`
    case "exchange_request_cancelled":
      return `Listing${listingTitle ? ` "${listingTitle}"` : ""} was cancelled`
    case "exchange_flagged":
      return `${listingTitle || "A listing"} was flagged as inappropriate`
    case "exchange_flag_resolved":
      return `Your flag${listingTitle ? ` on ${listingTitle}` : ""} was reviewed`

    // Reminder and overdue notifications
    case "exchange_reminder":
      return `Return reminder${listingTitle ? ` - ${listingTitle}` : ""}`
    case "exchange_overdue":
      return `Item overdue${listingTitle ? ` - ${listingTitle}` : ""}`

    // Event notifications (future)
    case "event_invite":
      return `You're invited${eventTitle ? ` to ${eventTitle}` : " to an event"}`
    case "event_rsvp":
      return `New RSVP${eventTitle ? ` for ${eventTitle}` : ""}`
    case "event_cancelled":
      return `Event${eventTitle ? ` "${eventTitle}"` : ""} was cancelled`
    case "event_updated":
      return `Event${eventTitle ? ` "${eventTitle}"` : ""} was updated`

    // Check-in notifications (future)
    case "checkin_invite":
      return `${actorName || "Someone"} invited you to join a check-in`
    case "checkin_joined":
      return `${actorName || "Someone"} joined your check-in`

    // Announcements (future)
    case "announcement":
    case "announcement_published":
      return "Community Announcement"
    case "announcement_updated":
      return "Announcement Updated"

    // Documents
    case "document_published":
      return "New Official Document"
    case "document_updated":
      return "Document Updated"

    // Requests
    case "request_resident_reply":
    case "request_admin_reply":
      return "New message on request"
    case "request_status_changed":
      return "Request updated"

    // Mentions (future)
    case "mention":
      return `${actorName || "Someone"} mentioned you`

    default:
      return "New notification"
  }
}

export function generateNotificationMessage(
  type: NotificationType,
  context: {
    quantity?: number
    pickupDate?: string
    returnDate?: string
    message?: string
    reason?: string
    condition?: string
  },
): string | null {
  const { quantity, pickupDate, returnDate, message, reason, condition } = context

  switch (type) {
    case "exchange_request":
      let msg = ""
      if (quantity) msg += `Quantity: ${quantity}. `
      if (pickupDate) msg += `Pickup: ${new Date(pickupDate).toLocaleDateString()}. `
      if (returnDate) msg += `Return: ${new Date(returnDate).toLocaleDateString()}. `
      if (message) msg += message
      return msg || null

    case "exchange_confirmed":
      return "You can now coordinate pickup with the lender."

    case "exchange_rejected":
      return "The lender is unable to fulfill this request at this time."

    case "exchange_returned":
      let returnMsg = "The lender has documented the return. "
      if (condition) returnMsg += `Condition: ${condition}. `
      return returnMsg

    case "exchange_cancelled":
    case "exchange_request_cancelled":
      return reason || null

    case "exchange_extension_request":
      let extMsg = ""
      if (returnDate) extMsg += `New return date: ${new Date(returnDate).toLocaleDateString()}. `
      if (message) extMsg += message
      return extMsg || null

    case "exchange_return_initiated":
      return context.message || "Please review and confirm the return."

    case "exchange_completed":
      return "Thank you for using the community exchange!"

    // Reminder and overdue notifications
    case "exchange_reminder":
      if (returnDate) {
        return `Please remember to return this item by ${new Date(returnDate).toLocaleDateString()}.`
      }
      return "Please remember to return this item soon."

    case "exchange_overdue":
      if (returnDate) {
        return `This item was due on ${new Date(returnDate).toLocaleDateString()}. Please coordinate with the lender to return it as soon as possible.`
      }
      return "This item is now overdue. Please coordinate with the lender to return it as soon as possible."

    case "document_published":
    case "document_updated":
      return context.message || null

    case "request_resident_reply":
    case "request_admin_reply":
      if (!context.message) return null
      return context.message.length > 50
        ? `${context.message.substring(0, 50)}...`
        : context.message

    default:
      return message || null
  }
}

export function generateActionUrl(
  type: NotificationType,
  tenantSlug: string,
  context: {
    listingId?: string
    transactionId?: string
    eventId?: string
    checkInId?: string
  },
): string {
  const { listingId, transactionId, eventId, checkInId } = context

  if (type === "document_published" || type === "document_updated") {
    return `/t/${tenantSlug}/dashboard/official`
  }

  // Most notifications should link to the notifications page where actions can be taken
  return `/t/${tenantSlug}/dashboard/notifications`

  // Alternative: Deep link to specific resources
  // if (listingId) return `/t/${tenantSlug}/dashboard/exchange?listing=${listingId}`
  // if (eventId) return `/t/${tenantSlug}/dashboard/events/${eventId}`
  // etc.
}
