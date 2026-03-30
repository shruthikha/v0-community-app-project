import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PrivacySettingsForm } from "./privacy-settings-form"
import { SettingsLayout } from "@/components/settings/settings-layout"

export default async function PrivacySettingsPage({
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

  // Get current resident and tenant features
  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select("id, tenant_id, tenants:tenant_id(slug, features)")
    .eq("id", user.id)
    .single()

  if (residentError || !resident) {
    console.error(`[PrivacySettingsPage] Failed to fetch resident:`, residentError)
    redirect(`/login`) // Fallback to main login if context is lost
  }

  const tenant = (resident as any).tenants
  const tenantFeatures = tenant?.features || {}
  const tenantSlug = tenant?.slug
  const rioEnabled = tenantFeatures.rio?.enabled === true

  // M12: Fail-closed Security Policy
  // Ensure the URL slug strictly matches the resident's authorized tenant context.
  if (!tenantSlug || tenantSlug !== slug) {
    console.warn(`[PrivacySettingsPage] SECURITY: Unauthorized access attempt. Resident ${user.id} (tenant: ${tenantSlug || 'none'}) tried to access URL slug: ${slug}`)
    // Redirect to login to force re-authentication or context correction
    redirect(`/login`)
  }

  // Get privacy settings
  let { data: privacySettings } = await supabase
    .from("user_privacy_settings")
    .select("*")
    .eq("user_id", resident.id)
    .single()

  // If no settings exist, create default
  if (!privacySettings) {
    const { data: newSettings } = await supabase
      .from("user_privacy_settings")
      .insert({ user_id: resident.id })
      .select()
      .single()
    privacySettings = newSettings
  }

  return (
    <SettingsLayout tenantSlug={slug} title="Privacy Settings" description="Control what information is visible to others">
      <PrivacySettingsForm privacySettings={privacySettings} tenantSlug={slug} rioEnabled={rioEnabled} />
    </SettingsLayout>
  )
}
