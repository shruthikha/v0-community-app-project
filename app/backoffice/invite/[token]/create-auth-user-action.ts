"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function createAuthUserAction(email: string, password: string, userId: string) {
  console.log("[v0] Creating auth user with admin API:", { email, userId })

  const supabase = createAdminClient()

  // The handle_new_user trigger will automatically:
  // 1. Find the existing user record by email
  // 2. Delete the old placeholder record
  // 3. Create a new record with the auth user ID, preserving tenant_id, role, etc.

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  })

  if (error) {
    console.error("[v0] Error creating auth user:", error)
    return { error: error.message }
  }

  console.log("[v0] Auth user created successfully:", data.user?.id)
  console.log("[v0] Trigger automatically linked auth user to tenant admin record with preserved data")

  return { user: data.user }
}
