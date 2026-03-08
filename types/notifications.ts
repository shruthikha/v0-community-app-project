// Notification types enum
export type NotificationType =
  | "request_status_changed"
  | "request_admin_reply"
  | "exchange_request"
  | "exchange_confirmed"
  | "exchange_rejected"
  | "exchange_picked_up"
  | "exchange_returned"
  | "exchange_return_initiated"
  | "exchange_completed"
  | "exchange_flagged"
  | "exchange_request_created"
  | "exchange_request_accepted"
  | "exchange_request_rejected"
  | "exchange_request_cancelled"
  | "exchange_pickup_confirmed"
  | "exchange_return_confirmed"
  | "exchange_listing_flagged"
  | "exchange_listing_archived"
  | "exchange_listing_unflagged"
  | "announcement"
  | 'exchange_extension_request'
  | 'exchange_extension_approved'
  | 'exchange_extension_rejected'
  | 'exchange_cancelled'
  | 'exchange_request_cancelled'
  | 'exchange_flag_resolved'
  | 'exchange_reminder' // 2 days before return date
  | 'exchange_overdue' // When return date has passed
  | 'exchange_listing_archived'
  | 'exchange_listing_unflagged'
  // Event-related (future)
  | 'event_invite'
  | 'event_published'
  | 'event_rsvp'
  | 'event_cancelled'
  | 'event_updated'
  // Check-in-related (future)
  | 'checkin_invite'
  | 'checkin_joined'
  // Request-related
  | 'request_status_changed'
  | 'request_admin_reply'
  | 'request_resident_reply'
  | 'announcement_published'
  | 'announcement_updated'
  | 'document_published'
  | 'document_updated'
  // Mentions (future)
  | 'mention'
  | 'system_alert'

// Base notification interface
export interface Notification {
  id: string
  tenant_id: string
  recipient_id: string

  // Content
  type: NotificationType
  title: string
  message: string | null

  // Status
  is_read: boolean
  is_archived: boolean
  action_required: boolean
  action_taken: boolean
  action_response: 'confirmed' | 'rejected' | 'approved' | 'declined' | 'accepted' | null

  // Timestamps
  created_at: string
  read_at: string | null

  // Polymorphic relationships
  exchange_transaction_id: string | null
  exchange_listing_id: string | null
  event_id: string | null
  check_in_id: string | null
  resident_request_id: string | null // Added for request notifications
  announcement_id: string | null
  document_id: string | null

  // Context
  actor_id: string | null
  action_url: string | null
  metadata: Record<string, any> | null
}

// Notification with actor details
export interface NotificationWithActor extends Notification {
  actor?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  } | null
}

// Notification with exchange listing details
export interface NotificationWithExchangeListing extends NotificationWithActor {
  exchange_listing?: {
    id: string
    title: string
    hero_photo: string | null
    category: {
      id: string
      name: string
    } | null
  } | null
}

// Notification with exchange transaction details
export interface NotificationWithExchangeTransaction extends NotificationWithExchangeListing {
  exchange_transaction?: {
    id: string
    quantity: number
    status: string
    proposed_pickup_date: string | null
    proposed_return_date: string | null
    expected_return_date: string | null
    actual_return_date: string | null
    return_condition: string | null
    return_notes: string | null
    borrower_message?: string | null
    lender_message?: string | null
    lender_id?: string
    borrower_id?: string
  } | null
  document?: {
    id: string
    title: string
    category: string
    document_type: string
  } | null
}

// Full notification with all possible relations
export type NotificationFull = NotificationWithExchangeTransaction

// Notification filters
export interface NotificationFilters {
  type?: NotificationType | NotificationType[]
  is_read?: boolean
  is_archived?: boolean
  action_required?: boolean
  action_taken?: boolean
}

// Notification create data
export interface CreateNotificationData {
  tenant_id: string
  recipient_id: string
  type: NotificationType
  title: string
  message?: string | null
  action_required?: boolean
  exchange_transaction_id?: string | null
  exchange_listing_id?: string | null
  event_id?: string | null
  check_in_id?: string | null
  resident_request_id?: string | null // Added for request notifications
  announcement_id?: string | null
  document_id?: string | null
  actor_id?: string | null
  action_url?: string | null
  metadata?: Record<string, any> | null
}
