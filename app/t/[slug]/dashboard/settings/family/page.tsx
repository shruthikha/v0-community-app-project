import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FamilyManagementForm } from "./family-management-form"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { SettingsTabs } from "@/components/settings-tabs"

export default async function FamilySettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Get current resident
  const { data: resident } = await supabase
    .from("users")
    .select("id, tenant_id, family_unit_id, role, lot_id")
    .eq("id", user.id)
    .single()

  if (!resident) {
    redirect(`/t/${slug}/login`)
  }

  // Get family unit if exists
  const validFamilyUnitId = resident.family_unit_id && resident.family_unit_id !== "" ? resident.family_unit_id : null
  let familyUnit = null
  let familyMembers: any[] = []
  let relationships: any[] = []
  let pets: any[] = []
  let isPrimaryContact = false

  if (validFamilyUnitId) {
    const { data: familyUnitData } = await supabase
      .from("family_units")
      .select("*")
      .eq("id", validFamilyUnitId)
      .single()

    familyUnit = familyUnitData

    if (familyUnit) {
      isPrimaryContact = familyUnit.primary_contact_id === resident.id

      const { data: membersData } = await supabase
        .from("users")
        .select(`
          *,
          user_privacy_settings (*)
        `)
        .eq("family_unit_id", validFamilyUnitId)
        .eq("role", "resident")
        .neq("id", resident.id)
        .order("first_name")

      familyMembers = membersData || []

      const { data: relationshipsData } = await supabase
        .from("family_relationships")
        .select("*")
        .eq("user_id", resident.id)

      relationships = relationshipsData || []

      const { data: petsData } = await supabase
        .from("pets")
        .select("*")
        .eq("family_unit_id", validFamilyUnitId)
        .order("name")

      pets = petsData || []
    }
  }

  // Get tenant for features
  const { data: tenant } = await supabase
    .from("tenants")
    .select("features")
    .eq("id", resident.tenant_id)
    .single()

  const validLotId = resident.lot_id && resident.lot_id !== "" ? resident.lot_id : null
  let lotResidents: any[] = []
  let lotData: any = null

  if (validLotId) {
    const { data: lotResidentsData } = await supabase
      .from("users")
      .select(`
        *,
        user_privacy_settings (*)
      `)
      .eq("lot_id", validLotId)
      .eq("role", "resident")
      .neq("id", resident.id)
      .order("first_name")

    lotResidents = lotResidentsData || []

    // Fetch lot data including photos
    const { data: lotDataResult } = await supabase
      .from("lots")
      .select("id, lot_number, photos, hero_photo")
      .eq("id", validLotId)
      .single()

    lotData = lotDataResult
  }

  return (
    <SettingsLayout tenantSlug={slug} title="Household Settings" description="Manage your household members">
      <FamilyManagementForm
        resident={resident}
        familyUnit={familyUnit}
        familyMembers={familyMembers}
        relationships={relationships}
        pets={pets}
        lotResidents={lotResidents}
        lotData={lotData}
        petsEnabled={tenant?.features?.pets || false}
        tenantSlug={slug}
        isPrimaryContact={isPrimaryContact}
      />
    </SettingsLayout>
  )
}
