"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { timingSafeEqual } from "crypto"

/**
 * Performs a timing-safe comparison of two strings.
 * Prevents timing attacks by ensuring constant-time comparison.
 */
function secureTokenCompare(a: string, b: string): boolean {
  // Ensure both strings are the same length to prevent timing leaks
  // If lengths differ, pad the shorter one (comparison will still fail)
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  if (bufA.length !== bufB.length) {
    // Compare against itself to maintain constant time, then return false
    timingSafeEqual(bufA, bufA)
    return false
  }

  return timingSafeEqual(bufA, bufB)
}

export async function validateInviteToken(token: string, tenantId: string) {
  console.log("[v0] Validating invite token:", { tenantId, tokenPreview: `${token.slice(0, 6)}…` })

  // Create a Supabase client with service role to bypass RLS
  const supabase = createAdminClient()

  const { data: resident, error: residentError } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, invite_token, tenant_id")
    .eq("invite_token", token)
    .eq("tenant_id", tenantId)
    .eq("role", "resident")
    .maybeSingle()

  console.log("[v0] Resident query result:", {
    found: !!resident,
    residentId: resident?.id,
    residentError: residentError?.message ?? null,
  })

  if (residentError) {
    return {
      success: false,
      error: `Database error: ${residentError.message}`,
      resident: null,
    }
  }

  if (!resident) {
    return {
      success: false,
      error: "No resident found with this invite token",
      resident: null,
    }
  }

  // Use timing-safe comparison to prevent timing attacks
  if (!resident.invite_token || !secureTokenCompare(resident.invite_token, token)) {
    return {
      success: false,
      error: "Token mismatch",
      resident: null,
    }
  }

  // Validate that resident has a valid email
  if (!resident.email || resident.email.trim() === "") {
    return {
      success: false,
      error: "Resident email is missing. Please contact your administrator to update your email address.",
      resident: null,
    }
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(resident.email)) {
    return {
      success: false,
      error: "Invalid email format. Please contact your administrator to update your email address.",
      resident: null,
    }
  }

  // Sanitize the resident object before returning to avoid exposing the token to the client
  const sanitizedResident = {
    id: resident.id,
    email: resident.email,
    first_name: resident.first_name,
    last_name: resident.last_name,
  }

  return {
    success: true,
    error: null,
    resident: sanitizedResident,
  }
}
