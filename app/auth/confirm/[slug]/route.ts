import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const ALLOWED_OTP_TYPES = ["recovery"] as const
type AllowedOtpType = typeof ALLOWED_OTP_TYPES[number]

/**
 * Handles PKCE token exchange for password resets.
 * The tenant slug is encoded in the URL path (not as a query param) because
 * Supabase strips query parameters from redirect_to during its redirect chain.
 *
 * Uses the middleware-style cookie pattern: writes cookies directly onto the
 * redirect response object to ensure they survive the 307.
 *
 * Origin is derived from a trusted env var (NEXT_PUBLIC_APP_URL) when available,
 * falling back to the Host header only in local dev.
 *
 * Path: /auth/confirm/[slug]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const code = searchParams.get("code")

    // Runtime validation of OTP type — only allow "recovery" for this endpoint
    const rawType = searchParams.get("type")
    const type: AllowedOtpType | null =
        rawType !== null && (ALLOWED_OTP_TYPES as readonly string[]).includes(rawType)
            ? (rawType as AllowedOtpType)
            : null

    // Prefer a trusted, server-configured base URL. Fall back to headers only
    // when no env var is set (local dev).
    const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        (() => {
            const host =
                request.headers.get("x-forwarded-host") ||
                request.headers.get("host") ||
                "localhost:3000"
            const protocol =
                request.headers.get("x-forwarded-proto") || "http"
            return `${protocol}://${host}`
        })()

    const updatePasswordUrl = new URL(`/t/${slug}/update-password`, origin)
    const errorUrl = new URL(`/t/${slug}/login`, origin)
    errorUrl.searchParams.set("error", "recovery_expired")

    let response = NextResponse.redirect(updatePasswordUrl)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session?.access_token) {
            // Verify the session is from a recovery flow by inspecting JWT amr claim
            const [, payload] = data.session.access_token.split(".")
            const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
            const amrMethods = (claims.amr ?? []).map((x: any) => x.method ?? x)
            if (amrMethods.includes("recovery")) {
                return response
            }
            console.error("[Auth] Code Exchange: session is not a recovery session, rejecting")
        }
        console.error("[Auth] Code Exchange Error:", error?.message)
    } else if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })
        if (!error) {
            return response
        }
        console.error("[Auth] PKCE Verification Error:", error.message)
    } else {
        console.error("[Auth] No code or token_hash in auth/confirm request")
    }

    return NextResponse.redirect(errorUrl)
}
