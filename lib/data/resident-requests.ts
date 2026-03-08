import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { cache } from "react"
import type {
    Comment,
    RequestType,
    RequestStatus,
    RequestPriority,
    ResidentRequest,
    ResidentRequestWithRelations
} from "@/types/requests"
export interface GetResidentRequestsOptions {
    // Filter options
    creatorId?: string
    originalSubmitterId?: string
    status?: string
    excludeStatus?: string
    types?: string[]
    isPublic?: boolean

    // Enrichment options
    enrichWithCreator?: boolean
    enrichWithOriginalSubmitter?: boolean
    enrichWithLocation?: boolean
    enrichWithResolvedBy?: boolean
    enrichWithTaggedEntities?: boolean
    enrichWithComments?: boolean
}

export const getResidentRequests = cache(async (
    tenantId: string,
    options: GetResidentRequestsOptions = {}
): Promise<ResidentRequestWithRelations[]> => {
    const {
        creatorId,
        originalSubmitterId,
        status,
        excludeStatus,
        types,
        isPublic,
        enrichWithCreator = false,
        enrichWithOriginalSubmitter = false,
        enrichWithLocation = false,
        enrichWithResolvedBy = false,
        enrichWithTaggedEntities = false,
        enrichWithComments = false,
    } = options

    const supabase = await createServerClient()

    let selectQuery = `
    id,
    tenant_id,
    created_by,
    original_submitter_id,
    title,
    request_type,
    description,
    priority,
    status,
    location_type,
    location_id,
    custom_location_name,
    custom_location_lat,
    custom_location_lng,
    is_anonymous,
    is_public,
    images,
    tagged_resident_ids,
    tagged_pet_ids,
    admin_reply,
    admin_internal_notes,
    rejection_reason,
    resolved_at,
    resolved_by,
    first_reply_at,
    created_at,
    updated_at
  `

    if (enrichWithCreator) {
        selectQuery += `,
      creator:users!created_by(id, first_name, last_name, profile_picture_url)
    `
    }

    if (enrichWithOriginalSubmitter) {
        selectQuery += `,
      original_submitter:users!original_submitter_id(id, first_name, last_name, profile_picture_url)
    `
    }

    if (enrichWithLocation) {
        selectQuery += `,
      location:location_id(id, name, type, coordinates, boundary_coordinates, path_coordinates)
    `
    }

    if (enrichWithResolvedBy) {
        selectQuery += `,
      resolved_by_user:users!resolved_by(id, first_name, last_name)
    `
    }

    let query = supabase
        .from("resident_requests")
        .select(selectQuery)
        .eq("tenant_id", tenantId)

    if (creatorId) {
        query = query.eq("created_by", creatorId)
    }

    if (originalSubmitterId) {
        query = query.eq("original_submitter_id", originalSubmitterId)
    }

    if (status) {
        query = query.eq("status", status)
    }

    if (excludeStatus) {
        query = query.neq("status", excludeStatus)
    }

    if (types && types.length > 0) {
        query = query.in("request_type", types)
    }

    if (isPublic !== undefined) {
        query = query.eq("is_public", isPublic)
    }

    const { data: requests, error } = await query.order("created_at", { ascending: false })

    if (error) {
        console.error("[get-resident-requests] Error fetching requests:", error)
        return []
    }

    if (!requests || requests.length === 0) {
        return []
    }

    const typedRequests = requests as any[]

    // Handle tagged entities enrichment if requested
    let taggedResidentsMap = new Map<string, any[]>()
    let taggedPetsMap = new Map<string, any[]>()
    let commentsMap = new Map<string, any[]>()

    const enrichmentPromises: any[] = []

    if (enrichWithTaggedEntities) {
        const allTaggedResidentIds = [...new Set(requests.flatMap((r: any) => r.tagged_resident_ids || []))]
        const allTaggedPetIds = [...new Set(requests.flatMap((r: any) => r.tagged_pet_ids || []))]

        if (allTaggedResidentIds.length > 0) {
            enrichmentPromises.push(
                supabase
                    .from("users")
                    .select("id, first_name, last_name, profile_picture_url")
                    .in("id", allTaggedResidentIds)
                    .eq("tenant_id", tenantId)
            )
        } else {
            enrichmentPromises.push(Promise.resolve({ data: [] }))
        }

        if (allTaggedPetIds.length > 0) {
            enrichmentPromises.push(
                supabase
                    .from("pets")
                    .select(`
          id,
          name,
          species,
          breed,
          profile_picture_url,
          family_unit:family_unit_id(id, name, primary_contact:primary_contact_id(id, first_name, last_name, profile_picture_url))
        `)
                    .in("id", allTaggedPetIds)
            )
        } else {
            enrichmentPromises.push(Promise.resolve({ data: [] }))
        }
    } else {
        enrichmentPromises.push(Promise.resolve({ data: [] }), Promise.resolve({ data: [] })) // Push placeholders
    }

    const adminClient = createAdminClient()
    // Handle comments enrichment if requested
    if (enrichWithComments) {
        enrichmentPromises.push(
            adminClient
                .from("comments")
                .select(`
                *,
                author:users!author_id(id, first_name, last_name, profile_picture_url, role, is_tenant_admin)
            `)
                .in("resident_request_id", typedRequests.map((r: any) => r.id))
                .order("created_at", { ascending: true })
        )
    } else {
        enrichmentPromises.push(Promise.resolve({ data: [] })) // Push placeholder
    }

    const results = await Promise.all(enrichmentPromises)

    let resultIndex = 0

    if (enrichWithTaggedEntities) {
        const taggedResidents = (results[resultIndex++].data || []) as { id: string; first_name: string; last_name: string; profile_picture_url: string | null }[]
        const residentMap = new Map(taggedResidents.map(r => [r.id, r]))
        requests.forEach((r: any) => {
            if (r.tagged_resident_ids && r.tagged_resident_ids.length > 0) {
                const tagged = r.tagged_resident_ids.map((id: string) => residentMap.get(id)).filter(Boolean)
                taggedResidentsMap.set(r.id, tagged)
            }
        })

        const taggedPets = (results[resultIndex++].data || []) as { id: string; name: string; species: string; breed: string; profile_picture_url: string | null; family_unit?: { id: string; name: string; primary_contact?: { id: string; first_name: string; last_name: string; profile_picture_url: string | null } | null } | null }[]
        const petMap = new Map(taggedPets.map(p => [p.id, p]))
        requests.forEach((r: any) => {
            if (r.tagged_pet_ids && r.tagged_pet_ids.length > 0) {
                const tagged = r.tagged_pet_ids.map((id: string) => petMap.get(id)).filter(Boolean)
                taggedPetsMap.set(r.id, tagged)
            }
        })
    } else {
        resultIndex += 2 // Skip placeholders
    }

    if (enrichWithComments) {
        const comments = (results[resultIndex++].data || []) as Comment[]
        comments.forEach((comment: Comment) => {
            const existing = commentsMap.get(comment.resident_request_id!) || []
            commentsMap.set(comment.resident_request_id!, [...existing, comment])
        })
    }

    return typedRequests.map((request: any) => {
        const base: ResidentRequestWithRelations = {
            ...request,
            photo_url: request.images?.[0] || null,
            tagged_residents: taggedResidentsMap.get(request.id) || [],
            tagged_pets: taggedPetsMap.get(request.id) || [],
            comments: commentsMap.get(request.id) || [],
        }
        return base
    })
})

export async function getResidentRequestById(
    requestId: string,
    options: GetResidentRequestsOptions = {}
): Promise<ResidentRequestWithRelations | null> {
    const supabase = await createServerClient()

    const { data: request } = await supabase
        .from("resident_requests")
        .select("tenant_id")
        .eq("id", requestId)
        .single()

    if (!request) {
        return null
    }

    const requests = await getResidentRequests(request.tenant_id, {
        ...options,
        // Ensure we find the specific request regardless of other filters
        status: undefined,
        excludeStatus: undefined,
        types: undefined,
    })

    return requests.find(r => r.id === requestId) || null
}
