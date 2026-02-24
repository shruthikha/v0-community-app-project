import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Middleware: Supabase env vars not available, skipping auth refresh")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Skip middleware entirely for auth exchange paths (e.g. /auth/confirm/[slug]).
  // The route handler manages its own session cookies. If the middleware calls
  // getUser() here, it can refresh a stale session and overwrite the Set-Cookie
  // headers the route handler sets for the new recovery session.
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return supabaseResponse
  }

  // This is critical for SSR - it refreshes the auth token
  // If it fails, we still return the response to allow the app to continue
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    // Issue #77: Automatic Logout Logic
    // Only enforce if user is logged in and NOT on a public route (already filtered by matcher but double checking good practice)
    if (user && !error) {
      // Skip timeout enforcement for password recovery paths
      const isRecoveryPath = request.nextUrl.pathname.includes("/update-password") ||
        request.nextUrl.pathname.includes("/forgot-password")

      const rememberMe = request.cookies.get("remember-me")
      const lastActive = request.cookies.get("last-active")

      // If "Remember Me" is NOT present, enforce strict timeout (but NOT for recovery paths)
      if (!rememberMe && !isRecoveryPath) {
        const now = Date.now()
        const lastActiveTime = lastActive ? parseInt(lastActive.value, 10) : 0
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000

        // If inactive for > 2 hours (or no last-active cookie found which implies session start or expired), logout
        // Note: We allow a grace period of 5 seconds for redirects to settle if needed, but here strictly:
        // If cookie is missing in strict mode, it might mean it expired naturally (Max-Age).

        if (!lastActive || (now - lastActiveTime > TWO_HOURS_MS)) {
          // Fix for Issue #108: Grace Period for Fresh Logins
          // If the user just signed in (< 60s ago), don't kick them out even if cookie is missing/stale.
          if (user.last_sign_in_at) {
            const lastSignInTime = new Date(user.last_sign_in_at).getTime()
            if (now - lastSignInTime < 60000) { // 60 seconds grace period
              // User is freshly authenticated. Treat as active.
              const response = await updateSessionCookie(supabaseResponse, now.toString())
              return response
            }
          }

          console.log("[v0] Middleware: Session timed out. Logging out.")
          await supabase.auth.signOut()

          // Check if we are already on a login page to avoid redirect loops
          const isLoginPage = request.nextUrl.pathname.includes("/login")

          if (!isLoginPage) {
            const url = request.nextUrl.clone()
            url.pathname = `/t/${request.nextUrl.pathname.split('/')[2] || 'ecovilla-san-mateo'}/login`
            url.searchParams.set("reason", "timeout")
            const redirectResponse = NextResponse.redirect(url)

            // Preserve cookies from supabaseResponse (e.g. signOut)
            const cookiesToSet = supabaseResponse.cookies.getAll()
            cookiesToSet.forEach((cookie) => {
              redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
            })

            return redirectResponse
          }
        } else {
          // User is active and within window, refresh the "last-active" cookie
          // We do this by setting it on the response
          const response = await updateSessionCookie(supabaseResponse, now.toString())
          return response
        }
      }
    }

  } catch (error) {
    // Network errors in Edge Runtime are expected in preview environments
    // The auth check will happen again in server components
    console.log("[v0] Middleware: Auth refresh failed (expected in preview), continuing")
  }

  return supabaseResponse
}

// Helper to update cookie on an existing response
async function updateSessionCookie(response: NextResponse, value: string) {
  response.cookies.set("last-active", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 60 * 60, // 2 hours
    path: "/",
  })
  return response
}
