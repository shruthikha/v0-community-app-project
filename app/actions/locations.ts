"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

import { getLocations as getLocationsFromLib } from "@/lib/data/locations"

export async function getLocations(tenantId: string) {
  return getLocationsFromLib(tenantId)
}

export async function createLocation(
  data: {
    tenant_id: string
    name: string
    type: "facility" | "lot" | "walking_path" | "neighborhood"
    description?: string | null
    coordinates?: { lat: number; lng: number } | null
    boundary_coordinates?: Array<[number, number]> | null
    path_coordinates?: Array<[number, number]> | null
    facility_type?: string | null
    icon?: string | null
    lot_id?: string | null
    neighborhood_id?: string | null
    photos?: string[] | null
    accessibility_features?: string[] | null
    parking_spaces?: number | null
    opening_hours?: any | null
    contact_phone?: string | null
    contact_email?: string | null
    website?: string | null
    capacity?: number | null
    rules?: string | null
    color?: string | null
    path_length?: number | string | null
    elevation_gain?: number | string | null
    path_difficulty?: string | null
    path_surface?: string | null
  },
  path?: string
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (
    !userData ||
    (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin") ||
    (userData.tenant_id !== data.tenant_id && userData.role !== "super_admin")
  ) {
    throw new Error("Unauthorized")
  }

  if (data.lot_id) {
    const { data: existingLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("lot_id", data.lot_id)
      .eq("type", "lot")
      .maybeSingle()

    if (existingLocation) {
      const { data: updatedLocation, error } = await supabase
        .from("locations")
        .update(data)
        .eq("id", existingLocation.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating location:", error)
        throw new Error("Failed to update location")
      }

      if (path) {
        revalidatePath(path)
      } else {
        revalidatePath("/", "layout")
      }
      return updatedLocation
    }
  }

  if (data.neighborhood_id && data.type === "neighborhood") {
    const { data: existingLocation } = await supabase
      .from("locations")
      .select("id")
      .eq("neighborhood_id", data.neighborhood_id)
      .eq("type", "neighborhood")
      .maybeSingle()

    if (existingLocation) {
      const { data: updatedLocation, error } = await supabase
        .from("locations")
        .update(data)
        .eq("id", existingLocation.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating location:", error)
        throw new Error("Failed to update location")
      }

      if (path) {
        revalidatePath(path)
      } else {
        revalidatePath("/", "layout")
      }
      return updatedLocation
    }
  }

  const { data: newLocation, error } = await supabase.from("locations").insert(data).select().single()

  if (error) {
    console.error("Error creating location:", error)
    throw new Error("Failed to create location")
  }

  // Link the location back to the lot or neighborhood
  if (newLocation && data.lot_id) {
    await supabase.from("lots").update({ location_id: newLocation.id }).eq("id", data.lot_id)
  }

  if (newLocation && data.neighborhood_id && data.type === "neighborhood") {
    await supabase.from("neighborhoods").update({ location_id: newLocation.id }).eq("id", data.neighborhood_id)
  }

  if (path) {
    revalidatePath(path)
  } else {
    revalidatePath("/", "layout")
  }
  return newLocation
}

export async function updateLocation(
  locationId: string,
  data: {
    tenant_id: string
    name: string
    type: "facility" | "lot" | "walking_path" | "neighborhood"
    description?: string | null
    coordinates?: { lat: number; lng: number } | null
    boundary_coordinates?: Array<[number, number]> | null
    path_coordinates?: Array<[number, number]> | null
    facility_type?: string | null
    icon?: string | null
    lot_id?: string | null
    neighborhood_id?: string | null
    photos?: string[] | null
    accessibility_features?: string[] | null
    parking_spaces?: number | null
    opening_hours?: any | null
    contact_phone?: string | null
    contact_email?: string | null
    website?: string | null
    capacity?: number | null
    rules?: string | null
    is_reservable?: boolean
    color?: string | null
    path_length?: number | string | null
    elevation_gain?: number | string | null
    path_difficulty?: string | null
    path_surface?: string | null
  },
  path?: string
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (
    !userData ||
    (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin") ||
    (userData.tenant_id !== data.tenant_id && userData.role !== "super_admin")
  ) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase.from("locations").update(data).eq("id", locationId)

  if (error) {
    console.error("Error updating location:", error)
    throw new Error("Failed to update location")
  }

  if (path) {
    revalidatePath(path)
  } else {
    const { data: tenant } = await supabase.from("tenants").select("slug").eq("id", data.tenant_id).single()
    if (tenant?.slug) {
      revalidatePath(`/t/${tenant.slug}/admin/map`, "page")
    } else {
      revalidatePath("/", "layout")
    }
  }
}

export async function deleteLocation(locationId: string, tenantId: string, path?: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  if (
    !userData ||
    (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin") ||
    (userData.tenant_id !== tenantId && userData.role !== "super_admin")
  ) {
    throw new Error("Unauthorized")
  }

  const { data: location } = await supabase.from("locations").select("type").eq("id", locationId).single()

  if (location?.type === "boundary") {
    await supabase.from("tenants").update({ map_boundary_coordinates: null }).eq("id", tenantId)
  }

  // Update ONLY ACTIVE check-ins that reference this location to use custom_temporary location type
  // Historical/expired check-ins can keep their location_id for record keeping
  // This prevents the "valid_location" constraint violation for active check-ins
  const { data: affectedCheckIns } = await supabase
    .from("check_ins")
    .select("id, start_time, duration_minutes, custom_location_name, custom_location_coordinates")
    .eq("location_id", locationId)

  if (affectedCheckIns && affectedCheckIns.length > 0) {
    const now = new Date()

    // Filter to only active (non-expired) check-ins
    const activeCheckIns = affectedCheckIns.filter((checkIn) => {
      const startTime = new Date(checkIn.start_time)
      const endTime = new Date(startTime.getTime() + (checkIn.duration_minutes * 60 * 1000))
      return endTime > now // Only include if not yet expired
    })

    if (activeCheckIns.length > 0) {
      // Get location name for check-ins that don't have a custom name
      const { data: locationData } = await supabase
        .from("locations")
        .select("name, coordinates")
        .eq("id", locationId)
        .single()

      // Convert active check-ins to custom_temporary to preserve them
      for (const checkIn of activeCheckIns) {
        await supabase
          .from("check_ins")
          .update({
            location_id: null,
            location_type: "custom_temporary",
            custom_location_name: checkIn.custom_location_name || locationData?.name || "Deleted Location",
            custom_location_coordinates: checkIn.custom_location_coordinates || locationData?.coordinates || null
          })
          .eq("id", checkIn.id)
      }
    }
  }

  // Clear location references from lots and neighborhoods
  await supabase.from("lots").update({ location_id: null }).eq("location_id", locationId)
  await supabase.from("neighborhoods").update({ location_id: null }).eq("location_id", locationId)

  const { error: deleteError } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId)
    .eq("tenant_id", tenantId)

  if (deleteError) {
    console.error("Error deleting location:", deleteError)
    throw new Error("Failed to delete location")
  }

  if (path) {
    revalidatePath(path)
  } else {
    revalidatePath("/", "layout")
  }
}
