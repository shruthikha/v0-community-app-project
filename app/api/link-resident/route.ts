import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

/**
 * Redacts an email address for safe logging.
 * Example: "user@example.com" -> "us***@example.com"
 */
function redactEmail(email: string | undefined | null): string {
  if (!email) return "unknown"
  const [local, domain] = email.split("@")
  if (!domain) return "****" // Not a valid email
  return `${local.slice(0, 2)}***@${domain}`
}

export async function POST(request: Request) {
  try {
    const { residentId, authUserId } = await request.json()

    console.log("[v0] Link resident request:", { residentId, authUserId })

    if (!residentId || !authUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Verify the caller is authenticated
    const { createClient: createAuthClient } = await import("@/lib/supabase/server")
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Allow user to only link themselves (BFF check)
    if (user.id !== authUserId) {
      return NextResponse.json({ error: "Forbidden: You can only link your own account" }, { status: 403 })
    }

    // Use service role to bypass RLS for administrative relinking
    const supabase = createAdminClient()

    // 3. Fetch the target resident and verify record ownership
    const { data: oldResident, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", residentId)
      .single()

    if (fetchError || !oldResident) {
      console.error("[v0] Error fetching target resident:", fetchError)
      return NextResponse.json({ error: "Resident record not found" }, { status: 404 })
    }

    // SECURITY: Verification of identity match between Auth User and Database Resident
    // This prevents a user from providing their own authUserId but a different residentId.
    if (!user.email || !oldResident.email || oldResident.email.toLowerCase() !== user.email.toLowerCase()) {
      console.error("[v0] SECURITY: Resident record ownership mismatch.", {
        authUserEmail: redactEmail(user.email),
        residentEmail: redactEmail(oldResident.email)
      })
      return NextResponse.json({ error: "Forbidden: You do not have permission to link this resident record" }, { status: 403 })
    }

    // 4. Atomic ID Update: Change the record ID from the temporary residentId to the Auth User ID.
    // This preserves all columns and is atomic in Postgres.
    console.log("[v0] Proceeding with atomic relink (ID Update) for:", redactEmail(user.email))

    const { error: updateError } = await supabase
      .from("users")
      .update({
        id: authUserId,
        invite_token: null // Clear the invite token upon successful link
      })
      .eq("id", residentId)

    if (updateError) {
      console.error("[v0] Error updating resident ID:", updateError)
      return NextResponse.json({ error: "Failed to finalize account link" }, { status: 500 })
    }

    console.log("[v0] Successfully linked resident to auth user")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Link resident error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
