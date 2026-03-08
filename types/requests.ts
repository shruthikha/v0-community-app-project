export interface Comment {
  id: string
  tenant_id: string
  author_id: string
  content: string
  parent_id: string | null
  resident_request_id: string | null
  created_at: string
  updated_at: string
  author?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
    role?: string
    is_tenant_admin?: boolean
  }
}

export type RequestType = 'maintenance' | 'question' | 'complaint' | 'safety' | 'account_access' | 'other'
export type RequestStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected'
export type RequestPriority = 'normal' | 'urgent' | 'emergency'

export interface ResidentRequest {
  id: string
  tenant_id: string
  created_by: string | null // null if anonymous
  original_submitter_id: string | null

  // Core fields
  title: string
  request_type: RequestType
  description: string
  status: RequestStatus
  priority: RequestPriority

  // Location
  location_type: 'community' | 'custom' | null
  location_id: string | null
  custom_location_name: string | null
  custom_location_lat: number | null
  custom_location_lng: number | null

  // Metadata
  is_anonymous: boolean
  is_public: boolean
  images: string[]
  tagged_resident_ids: string[]
  tagged_pet_ids: string[]

  // Admin interaction
  admin_reply: string | null
  admin_internal_notes: string | null
  rejection_reason: string | null
  resolved_by: string | null

  // Timestamps
  created_at: string
  updated_at: string
  resolved_at: string | null
  first_reply_at: string | null
}

export interface ResidentRequestWithRelations extends ResidentRequest {
  creator?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url?: string | null
    lot_id: string | null
    lots?: {
      lot_number: string
    } | null
  } | null
  location?: {
    id: string
    name: string
    type: string
    coordinates?: { lat: number; lng: number } | null
    boundary_coordinates?: number[][] | null
    path_coordinates?: number[][] | null
  } | null
  resolved_by_user?: {
    first_name: string
    last_name: string
  } | null
  photo_url?: string | null
  tagged_residents?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url?: string | null
  }[]
  tagged_pets?: {
    id: string
    name: string
    species: string
    breed?: string | null
    profile_picture_url?: string | null
    family_unit?: {
      id: string
      name: string
      primary_contact?: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url?: string | null
      } | null
    } | null
  }[]
  original_submitter?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url?: string | null
  } | null
  comments?: Comment[]
}

export interface CreateRequestData {
  title: string
  request_type: RequestType
  description: string
  priority: RequestPriority
  location_type?: 'community' | 'custom' | null
  location_id?: string | null
  custom_location_name?: string | null
  custom_location_lat?: number | null
  custom_location_lng?: number | null
  is_anonymous?: boolean
  is_public?: boolean
  images?: string[]
  tagged_resident_ids?: string[]
  tagged_pet_ids?: string[]
}
