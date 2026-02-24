"use server"

import { cookies, headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const resetPasswordSchema = z.object({
    email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()),
    tenantSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})

const updatePasswordSchema = z.object({
    password: z.string().min(6).max(256),
})

const REMEMBER_ME_COOKIE = "remember-me"
const LAST_ACTIVE_COOKIE = "last-active"
const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Sets or clears the session persistence cookies based on "Remember Me" choice.
 * 
 * Logic:
 * - If rememberMe is TRUE: Set a long-lived "remember-me" cookie.
 * - If rememberMe is FALSE: Clear "remember-me" cookie and set "last-active" timestamp.
 */
export async function setSessionPersistence(rememberMe: boolean) {
    const cookieStore = await cookies()

    if (rememberMe) {
        // Trusted Device: Set persistent cookie
        cookieStore.set(REMEMBER_ME_COOKIE, "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: THIRTY_DAYS_MS / 1000,
            path: "/",
        })

        // Cleanup strict mode cookie if it exists
        cookieStore.delete(LAST_ACTIVE_COOKIE)
    } else {
        // Strict Mode: Clear persistent cookie
        cookieStore.delete(REMEMBER_ME_COOKIE)

        // Initialize activity timer
        cookieStore.set(LAST_ACTIVE_COOKIE, Date.now().toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: TWO_HOURS_MS / 1000, // Cookie itself expires in 2h
            path: "/",
        })
    }

    console.log(`[Auth] Session persistence set. RememberMe: ${rememberMe}`)
}

/**
 * Triggers the Supabase password reset email flow.
 */
export async function resetPassword(email: string, tenantSlug: string) {
    try {
        const parsed = resetPasswordSchema.safeParse({ email, tenantSlug })
        if (!parsed.success) {
            return { success: true } // Invalid input — fail silently (anti-enumeration)
        }

        const supabase = await createClient()
        const normalizedEmail = parsed.data.email // already normalized by Zod transform

        // Build a reliable absolute origin for the password reset redirect URL.
        // Prioritize the trusted env var. Only fall back to request headers
        // in non-production (local dev) — headers are attacker-controllable
        // and could inject phishing URLs into reset emails.
        const headersList = await headers()
        const origin =
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.NODE_ENV !== "production"
                ? headersList.get("origin") ||
                (headersList.get("host")
                    ? `${headersList.get("x-forwarded-proto") || "https"}://${headersList.get("host")}`
                    : "")
                : "")

        if (!origin) {
            console.error("[Auth] Reset password: could not determine absolute origin — NEXT_PUBLIC_APP_URL must be set")
            return { success: true }
        }

        // 1. Look up the tenant by slug
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id")
            .eq("slug", tenantSlug)
            .maybeSingle()

        if (tenantError || !tenant) {
            // Don't reveal tenant existence; always return success
            console.error("[Auth] Reset password: tenant not found for slug:", tenantSlug)
            return { success: true }
        }

        // 2. Check if the email belongs to a user who is a resident of this tenant.
        const { data: resident, error: residentError } = await supabase
            .rpc("check_resident_email", {
                p_email: normalizedEmail,
                p_tenant_id: tenant.id,
            })

        // Fail-closed: any RPC error (including function-not-found) blocks the send
        // to preserve tenant gating.
        if (residentError) {
            console.error("[Auth] check_resident_email RPC error, aborting reset for safety:", residentError.message)
            return { success: true }
        }
        if (!resident) {
            console.log("[Auth] Reset password: email not found as resident in tenant", tenantSlug)
            return { success: true }
        }

        // 3. Send the reset email only for verified residents
        // Encode the tenant slug in the URL path (not a query param) because
        // Supabase strips query parameters from redirect_to during its own redirect chain.
        const redirectTo = `${origin}/auth/confirm/${tenantSlug}`

        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo,
        })

        if (error) {
            console.error("[Auth] Reset password error:", error.message)
            // Don't expose Supabase errors to the user (e.g., rate limits)
            // Return success to prevent info leakage
            return { success: true }
        }

        return { success: true }
    } catch (err: any) {
        console.error("[Auth] Unexpected reset password error:", err)
        // Always return success to prevent email enumeration
        return { success: true }
    }
}

/**
 * Updates the user's password using the current recovery session.
 */
export async function updatePassword(password: string) {
    try {
        const parsed = updatePasswordSchema.safeParse({ password })
        if (!parsed.success) {
            return { error: "Password must be at least 6 characters." }
        }

        const supabase = await createClient()

        const { error } = await supabase.auth.updateUser({
            password: parsed.data.password
        })

        if (error) {
            console.error("[Auth] Update password error:", error.message)
            return { error: error.message }
        }

        return { success: true }
    } catch (err: any) {
        console.error("[Auth] Unexpected update password error:", err)
        return { error: "An unexpected error occurred." }
    }
}
