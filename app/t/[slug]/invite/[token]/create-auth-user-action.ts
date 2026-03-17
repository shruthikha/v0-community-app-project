"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function createAuthUserAction(email: string, password: string, residentId: string) {
  console.log("[v0] Creating auth user with admin API:", { email, residentId })

  const supabase = createAdminClient()

  // Fetch the resident to get tenant_id and other metadata
  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select("tenant_id, role, name, profile_picture_url, email")
    .eq("id", residentId)
    .single()

  if (residentError || !resident) {
    console.error("[v0] CRITICAL: Resident lookup failed, aborting auth user creation.", residentError)
    return { error: "Unable to find a valid resident record for this invite. Please contact support." }
  }

  // Security: Ensure the provided email matches the resident record to prevent account hijacking/mislinking
  if (resident.email && resident.email.toLowerCase() !== email.toLowerCase()) {
    console.error("[v0] SECURITY: Email mismatch during invite flow.", { inputEmail: email, residentEmail: resident.email })
    return { error: "Email address does not match the invitation record." }
  }

  // The handle_new_user trigger will automatically match by email OR use this metadata
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: resident?.name,
      avatar_url: resident?.profile_picture_url,
    },
    app_metadata: {
      tenant_id: resident?.tenant_id,
      role: resident?.role || "resident",
      resident_id: residentId, // Store original resident ID for debugging
    },
  })

  if (error) {
    console.error("[v0] Error creating auth user:", error)
    return { error: error.message }
  }

  console.log("[v0] Auth user created successfully:", data.user?.id)
  console.log("[v0] Trigger automatically linked auth user to resident record with preserved data")

  return { user: data.user }
}
