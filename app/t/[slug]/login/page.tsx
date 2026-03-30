import { redirect } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { TenantLoginForm } from "./login-form"

// Map URL error keys to fixed messages to prevent phishing via crafted URLs.
const ERROR_MESSAGES: Record<string, string> = {
  timeout: "Your session timed out. Please log in again.",
  recovery_expired: "The recovery link is invalid or has expired.",
  access_denied: "You do not have access to this community.",
}

export default async function TenantLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const rawError = resolvedSearchParams?.error
  const errorKey = Array.isArray(rawError) ? rawError[0] : rawError
  const urlError = errorKey ? ERROR_MESSAGES[errorKey] : undefined
  const supabase = await createClient()
  const MAX_RETRIES = 2
  let tenant = null
  let tenantError = null

  // Retry logic for transient DB connection issues during dev restarts
  for (let i = 0; i <= MAX_RETRIES; i++) {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle()

    tenant = data
    tenantError = error

    if (!error || i === MAX_RETRIES) break
    // Exponential backoff
    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 500))
  }

  if (tenantError || !tenant) {
    const isDbError = !!tenantError
    return (
      <div className="flex min-h-screen items-center justify-center bg-earth-cloud p-4">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-clay-red/20 bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-clay-red">
            {isDbError ? "System Temporarily Unavailable" : "Community Not Found"}
          </h1>
          <p className="text-mist-gray">
            {isDbError
              ? "We're having trouble connecting to the database. Please try refreshing in a few seconds."
              : `The community "${slug}" does not exist or is not available.`}
          </p>
          {isDbError && tenantError && process.env.NODE_ENV !== "production" && (
            <p className="text-xs text-clay-red/60 mt-4 tabular-nums">Error: {tenantError.message}</p>
          )}
        </div>
      </div>
    )
  }

  // Check if already logged in
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (user && !authError) {
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .single()

    if (userData) {
      if (userData.role === "super_admin" || userData.is_tenant_admin) {
        redirect(`/t/${slug}/admin/dashboard`)
      } else {
        // Always redirect residents to dashboard (no onboarding check)
        redirect(`/t/${slug}/dashboard`)
      }
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col lg:grid lg:grid-cols-2">
      {/* Left Panel: Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 bg-earth-cloud/30 w-full">
        <TenantLoginForm tenant={tenant} initialError={urlError} />
      </div>

      {/* Right Side - Hero/Brand */}
      <div className="hidden lg:block relative h-full overflow-hidden bg-forest-deep">
        <Image
          src="/login.png"
          alt="Login Hero"
          fill
          className="object-cover object-center saturate-150 brightness-90"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-forest-canopy/20 mix-blend-overlay" />
      </div>
    </div>
  )
}
