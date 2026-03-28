import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NeighboursPageClient } from "./neighbours-page-client"
import { applyPrivacyFilter, type UserWithPrivacy } from "@/lib/privacy-utils"

export default async function NeighboursPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: currentResident } = await supabase
    .from("users")
    .select("id, tenant_id, role, family_unit_id")
    .eq("id", user.id)
    .in("role", ["resident", "tenant_admin", "super_admin"])
    .single()

  if (!currentResident) {
    redirect(`/t/${slug}/login`)
  }

  // Check if current user is admin
  const isTenantAdmin = currentResident.role === "tenant_admin" || currentResident.role === "super_admin"

  // Get neighbor lists action
  const { getNeighborLists } = await import("@/app/actions/neighbor-lists")

  // Parallel fetch: Residents, Families, Neighborhoods, and Lists
  const [
    residentsRes,
    familiesRes,
    neighborhoodsRes,
    neighborListsRes
  ] = await Promise.all([
    // 1. All residents with privacy and essential joins
    supabase
      .from("users")
      .select(`
        id, first_name, last_name, email, phone, profile_picture_url, journey_stage,
        estimated_move_in_date, birth_country, current_country, languages, preferred_language, birthday, family_unit_id,
        family_units!users_family_unit_id_fkey (id, name, profile_picture_url),
        lots (id, lot_number, neighborhoods (id, name)),
        user_interests (interests (id, name)),
        user_skills (skills (id, name), open_to_requests),
        user_privacy_settings (
          show_email, show_phone, show_birthday, show_birth_country, show_current_country,
          show_languages, show_preferred_language, show_journey_stage, show_estimated_move_in_date,
          show_profile_picture, show_neighborhood, show_family, show_family_relationships,
          show_interests, show_skills, show_open_to_requests
        )
      `)
      .eq("tenant_id", currentResident.tenant_id)
      .eq("role", "resident")
      .order("first_name"),

    // 2. All families
    supabase
      .from("family_units")
      .select(`
        id, name, profile_picture_url, primary_contact_id,
        users!users_family_unit_id_fkey (id, first_name, last_name),
        pets (id)
      `)
      .eq("tenant_id", currentResident.tenant_id)
      .order("name"),

    // 3. All neighborhoods
    supabase
      .from("neighborhoods")
      .select("id, name")
      .eq("tenant_id", currentResident.tenant_id)
      .order("name"),

    // 4. Neighbor lists
    getNeighborLists(currentResident.tenant_id)
  ])

  if (!residentsRes.data || !familiesRes.data || !neighborhoodsRes.data) {
    console.error("[NeighboursPage] Failed to load essential dashboard data:", {
      residents: residentsRes.error,
      families: familiesRes.error,
      neighborhoods: neighborhoodsRes.error
    })
    // Optionally redirect or show error - for now we proceed safely
  }

  const residents = residentsRes.data || []
  const families = familiesRes.data || []
  const neighborhoods = neighborhoodsRes.data || []

  // Handle neighbor lists success specifically (CodeRabbit #3005102645)
  const neighborLists = neighborListsRes.success ? (neighborListsRes.data || []) : []
  if (!neighborListsRes.success) {
    console.warn("[NeighboursPage] Failed to load neighbor lists:", neighborListsRes.error)
  }

  // Apply privacy filter to residents
  const filteredResidents = residents?.map((resident) => {
    const isFamilyMember =
      !!currentResident.family_unit_id &&
      !!resident.family_unit_id &&
      currentResident.family_unit_id === resident.family_unit_id

    // Cast to UserWithPrivacy to satisfy type checker (supabase types vs app types)
    return applyPrivacyFilter(resident as unknown as UserWithPrivacy, user.id, isFamilyMember, isTenantAdmin)
  })

  // Derive interests from resident data (includes user-created interests)
  const uniqueInterests = new Map<string, { id: string; name: string }>()
  filteredResidents?.forEach((resident: any) => {
    if (Array.isArray(resident.user_interests)) {
      resident.user_interests.forEach((ui: any) => {
        if (ui.interests?.id && ui.interests?.name) {
          uniqueInterests.set(ui.interests.id, { id: ui.interests.id, name: ui.interests.name })
        }
      })
    }
  })
  const allInterests = Array.from(uniqueInterests.values()).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <NeighboursPageClient
      residents={(filteredResidents as any) || []}
      families={families || []}
      neighborhoods={neighborhoods || []}
      allInterests={allInterests || []}
      neighborLists={neighborLists || []}
      tenantSlug={slug}
      currentUserFamilyId={currentResident.family_unit_id || null}
      currentTenantId={currentResident.tenant_id}
      isTenantAdmin={isTenantAdmin}
    />
  )
}
