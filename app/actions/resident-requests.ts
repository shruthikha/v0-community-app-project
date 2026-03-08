"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"
import type { CreateRequestData, RequestStatus } from "@/types/requests"

export async function createResidentRequest(
  tenantId: string,
  tenantSlug: string,
  data: CreateRequestData
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("resident_requests")
      .insert({
        tenant_id: tenantId,
        created_by: data.is_anonymous ? null : user.id,
        original_submitter_id: user.id, // Always store actual submitter
        title: data.title,
        request_type: data.request_type,
        description: data.description,
        priority: data.priority,
        location_type: data.location_type || null,
        location_id: data.location_id || null,
        custom_location_name: data.custom_location_name || null,
        custom_location_lat: data.custom_location_lat || null,
        custom_location_lng: data.custom_location_lng || null,
        is_anonymous: data.is_anonymous || false,
        is_public: data.is_anonymous ? false :
          ['maintenance', 'safety'].includes(data.request_type) ? true :
            (data.is_public || false),
        images: data.images || [],
        tagged_resident_ids: data.tagged_resident_ids || [],
        tagged_pet_ids: data.tagged_pet_ids || [],
        status: 'pending',
      })

    if (error) {
      console.error("[v0] Error creating request:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests`)
    revalidatePath(`/t/${tenantSlug}/admin/requests`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error creating request:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateRequestStatus(
  requestId: string,
  tenantId: string,
  tenantSlug: string,
  status: RequestStatus,
  reason?: string
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    if (status === 'rejected' && reason) {
      updateData.rejection_reason = reason
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    const { data: request, error } = await supabase
      .from("resident_requests")
      .update(updateData)
      .eq("id", requestId)
      .eq("tenant_id", tenantId)
      .select("created_by, title, request_type")
      .single()

    if (error) {
      console.error("[v0] Error updating request status:", error)
      return { success: false, error: error.message }
    }

    // Send notification to resident about status change
    if (request.created_by) {
      await createNotification({
        tenant_id: tenantId,
        recipient_id: request.created_by,
        type: 'request_status_changed',
        title: `Request ${status}: ${request.title}`,
        message: status === 'rejected' && reason
          ? `Reason: ${reason}`
          : `Your ${request.request_type} request has been ${status}.`,
        actor_id: user.id,
        resident_request_id: requestId,
        action_url: `/t/${tenantSlug}/dashboard/requests/${requestId}`,
      })
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests`)
    revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
    revalidatePath(`/t/${tenantSlug}/admin/requests`)
    revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating request status:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function reopenResidentRequest(
  requestId: string,
  tenantId: string,
  tenantSlug: string
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
      return { success: false, error: "Unauthorized" }
    }

    const { data: request, error } = await supabase
      .from("resident_requests")
      .update({
        status: 'in_progress',
        resolved_at: null,
        resolved_by: null,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("tenant_id", tenantId)
      .select("created_by, title")
      .single()

    if (error) {
      console.error("[v0] Error reopening request:", error)
      return { success: false, error: error.message }
    }

    // Send notification to resident about reopening
    if (request.created_by) {
      await createNotification({
        tenant_id: tenantId,
        recipient_id: request.created_by,
        type: 'request_status_changed',
        title: `Request Reopened: ${request.title}`,
        message: `Your request has been reopened and is now back in progress.`,
        actor_id: user.id,
        resident_request_id: requestId,
        action_url: `/t/${tenantSlug}/dashboard/requests/${requestId}`,
      })
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests`)
    revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
    revalidatePath(`/t/${tenantSlug}/admin/requests`)
    revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error reopening request:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function addRequestComment(
  requestId: string,
  tenantId: string,
  tenantSlug: string,
  content: string
) {
  try {
    const supabase = await createServerClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Get the request details to figure out if the user is authorized to comment
    const { data: request } = await adminClient
      .from("resident_requests")
      .select("tenant_id, created_by, title, request_type, is_public")
      .eq("id", requestId)
      .single()

    if (!request) {
      return { success: false, error: "Request not found" }
    }

    // Verify tenant
    if (request.tenant_id !== tenantId) {
      return { success: false, error: "Unauthorized: Tenant mismatch" }
    }

    const { data: userData } = await adminClient
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenantId) // Prevent cross-tenant data leakage
      .single()

    const isAdmin = userData && (['tenant_admin', 'super_admin'].includes(userData.role) || userData.is_tenant_admin)
    const isCreator = request.created_by === user.id
    const isPublic = request.is_public === true

    // Authorization Logic: Creator OR Admin OR (Public post in the same tenant)
    if (!isCreator && !isAdmin && !isPublic) {
      return {
        success: false,
        error: "Unauthorized: You do not have permission to comment on this request."
      }
    }

    // Insert comment
    const { data: comment, error } = await adminClient
      .from("comments")
      .insert({
        tenant_id: tenantId,
        author_id: user.id,
        resident_request_id: requestId,
        content: content,
      })
      .select(`
        *,
        author:users!author_id(id, first_name, last_name, profile_picture_url)
      `)
      .single()

    if (error) {
      console.error("[v0] Error adding comment:", error)
      return { success: false, error: error.message }
    }

    // We already have the 'request' details from the authorization check above.
    if (request) {
      // Determine if this is a resident replying to admin or vice versa
      // (Actually, we can just notify everyone involved except the actor)

      if (isCreator) {
        // Resident (creator) replied -> Notify Admins
        const { data: admins } = await adminClient
          .from("users")
          .select("id")
          .eq("tenant_id", tenantId)
          .or(`role.in.("tenant_admin","super_admin"),is_tenant_admin.eq.true`)

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await createNotification({
              tenant_id: tenantId,
              recipient_id: admin.id,
              type: 'request_resident_reply',
              title: `Resident replied to request: ${request.title}`,
              message: content,
              actor_id: user.id,
              resident_request_id: requestId,
              action_url: `/t/${tenantSlug}/admin/requests/${requestId}`,
            })
          }
        }
      } else if (isAdmin && !isCreator) {
        // Admin replied -> Notify Creator
        if (request.created_by) {
          await createNotification({
            tenant_id: tenantId,
            recipient_id: request.created_by,
            type: 'request_admin_reply', // Reuse or add new type
            title: `Update on your request: ${request.title}`,
            message: content,
            actor_id: user.id,
            resident_request_id: requestId,
            action_url: `/t/${tenantSlug}/dashboard/requests/${requestId}`,
          })
        }
      } else if (isPublic && !isCreator && !isAdmin) {
        // Another resident commented on a public post
        // Notify both original creator and admins

        // 1. Notify Creator
        if (request.created_by) {
          await createNotification({
            tenant_id: tenantId,
            recipient_id: request.created_by,
            type: 'request_resident_reply',
            title: `New community comment on your request: ${request.title}`,
            message: content,
            actor_id: user.id,
            resident_request_id: requestId,
            action_url: `/t/${tenantSlug}/dashboard/requests/${requestId}`,
          })
        }

        // 2. Notify Admins
        const { data: admins } = await adminClient
          .from("users")
          .select("id")
          .eq("tenant_id", tenantId)
          .or(`role.in.("tenant_admin","super_admin"),is_tenant_admin.eq.true`)

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await createNotification({
              tenant_id: tenantId,
              recipient_id: admin.id,
              type: 'request_resident_reply',
              title: `Community comment on request: ${request.title}`,
              message: content,
              actor_id: user.id,
              resident_request_id: requestId,
              action_url: `/t/${tenantSlug}/admin/requests/${requestId}`,
            })
          }
        }
      }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
    revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)

    return { success: true, comment }
  } catch (error) {
    console.error("[v0] Unexpected error adding comment:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateRequestComment(
  commentId: string,
  requestId: string,
  tenantId: string,
  tenantSlug: string,
  content: string
) {
  try {
    const supabase = await createServerClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: comment } = await adminClient
      .from("comments")
      .select("author_id, tenant_id")
      .eq("id", commentId)
      .single()

    if (!comment || comment.tenant_id !== tenantId) {
      return { success: false, error: "Comment not found or tenant mismatch" }
    }

    if (comment.author_id !== user.id) {
      return { success: false, error: "Unauthorized: You can only edit your own comments" }
    }

    const { error } = await adminClient
      .from("comments")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", commentId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
    revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating comment:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteRequestComment(
  commentId: string,
  requestId: string,
  tenantId: string,
  tenantSlug: string
) {
  try {
    const supabase = await createServerClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: comment } = await adminClient
      .from("comments")
      .select("author_id, tenant_id")
      .eq("id", commentId)
      .single()

    if (!comment || comment.tenant_id !== tenantId) {
      return { success: false, error: "Comment not found or tenant mismatch" }
    }

    if (comment.author_id !== user.id) {
      // Check if admin
      const { data: userData } = await adminClient
        .from("users")
        .select("role, is_tenant_admin")
        .eq("id", user.id)
        .eq("tenant_id", tenantId)
        .single()

      const isAdmin = userData && (['tenant_admin', 'super_admin'].includes(userData.role) || userData.is_tenant_admin)

      if (!isAdmin) {
        return { success: false, error: "Unauthorized: You do not have permission to delete this comment" }
      }
    }

    const { error } = await adminClient
      .from("comments")
      .delete()
      .eq("id", commentId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/t/${tenantSlug}/dashboard/requests/${requestId}`)
    revalidatePath(`/t/${tenantSlug}/admin/requests/${requestId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting comment:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

import { getResidentRequests, getResidentRequestById } from "@/lib/data/resident-requests"

// ... (keep createResidentRequest, updateRequestStatus, addAdminReply)

export async function getMyRequests(tenantId: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const requests = await getResidentRequests(tenantId, {
      originalSubmitterId: user.id,
      enrichWithCreator: true, // Show submitter avatar
      enrichWithLocation: true,
      enrichWithResolvedBy: true,
    })

    return requests
  } catch (error) {
    console.error("[v0] Unexpected error fetching my requests:", error)
    return []
  }
}

export async function getAllRequests(tenantId: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Verify admin
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenantId)
      .single()

    if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
      return []
    }

    const requests = await getResidentRequests(tenantId, {
      enrichWithCreator: true,
      enrichWithLocation: true,
      enrichWithResolvedBy: true,
    })

    return requests
  } catch (error) {
    console.error("[v0] Unexpected error fetching all requests:", error)
    return []
  }
}

export async function getCommunityRequests(tenantId: string) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] No user found for community requests")
      return []
    }

    console.log("[v0] Fetching community requests for tenant:", tenantId)

    const requests = await getResidentRequests(tenantId, {
      isPublic: true,
      enrichWithCreator: true,
      enrichWithLocation: true,
      enrichWithResolvedBy: true,
    })

    console.log("[v0] Community requests count:", requests.length)

    return requests
  } catch (error) {
    console.error("[v0] Unexpected error fetching community requests:", error)
    return []
  }
}

export async function getRequestById(requestId: string, tenantId: string) {
  try {
    const request = await getResidentRequestById(requestId, {
      enrichWithCreator: true,
      enrichWithOriginalSubmitter: true,
      enrichWithLocation: true,
      enrichWithResolvedBy: true,
      enrichWithTaggedEntities: true,
      enrichWithComments: true,
    })

    if (!request || request.tenant_id !== tenantId) {
      return null
    }

    return request
  } catch (error) {
    console.error("[v0] Unexpected error fetching request:", error)
    return null
  }
}
