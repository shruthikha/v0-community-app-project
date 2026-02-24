"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff, Mail } from "lucide-react"
import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/library/button"
import { Input } from "@/components/library/input"
import { Label } from "@/components/library/label"
import { Alert, AlertDescription } from "@/components/library/alert"
import { ShineBorder } from "@/components/library/shine-border"
import { MagicCard } from "@/components/library/magic-card"
import { Checkbox } from "@/components/library/checkbox"
import { cn } from "@/lib/utils"
import { identifyUser, ErrorAnalytics } from "@/lib/analytics"
import { setSessionPersistence } from "@/app/actions/auth-actions"

interface TenantLoginFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  initialError?: string
}

function ResponsiveLoginCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      {/* Mobile View: ShineBorder */}
      <div className={cn("relative w-full max-w-md rounded-2xl overflow-hidden lg:hidden", className)}>
        {/* Background Layer - Bottom */}
        <div className="absolute inset-0 bg-earth-snow/90 backdrop-blur-sm z-0" />

        {/* ShineBorder - Middle */}
        <ShineBorder
          className="pointer-events-none absolute inset-0 z-10"
          shineColor={["transparent", "transparent", "#D97742", "#6B9B47", "transparent", "transparent"]}
          borderWidth={2}
        />

        {/* Content - Top (Transparent background to show layers below) */}
        <div className="relative z-20 h-full w-full">
          {children}
        </div>
      </div>

      {/* Desktop View: MagicCard */}
      <MagicCard
        className={cn("hidden lg:block w-full max-w-md shadow-xl border-earth-pebble rounded-2xl", className)}
        gradientColor="hsl(var(--forest-growth))"
        gradientFrom="hsl(var(--forest-canopy))"
        gradientTo="hsl(var(--sunrise))"
        gradientOpacity={0.25}
        gradientSize={400}
      >
        {/* Background for Desktop */}
        <div className="bg-earth-snow/90 backdrop-blur-sm h-full w-full rounded-[inherit]">
          {children}
        </div>
      </MagicCard>
    </>
  )
}

export function TenantLoginForm({ tenant, initialError }: TenantLoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState(initialError || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      const { data: userData } = await supabase
        .from("users")
        .select("role, tenant_id")
        .eq("id", authData.user.id)
        .maybeSingle()

      // Super admins can access any tenant
      if (userData?.role === "super_admin") {
        identifyUser(authData.user.id, {
          tenant_slug: tenant.slug,
          role: 'super_admin',
          email: authData.user.email,
        })
        await setSessionPersistence(rememberMe)
        router.push(`/t/${tenant.slug}/admin/dashboard`)
        return
      }

      if (userData?.role === "tenant_admin" && userData?.tenant_id === tenant.id) {
        identifyUser(authData.user.id, {
          tenant_slug: tenant.slug,
          role: 'tenant_admin',
          email: authData.user.email,
        })
        await setSessionPersistence(rememberMe)
        router.push(`/t/${tenant.slug}/admin/dashboard`)
        return
      }

      const { data: residentData, error: residentError } = await supabase
        .from("users")
        .select("id, is_tenant_admin, tenant_id")
        .eq("id", authData.user.id)
        .eq("role", "resident")
        .eq("tenant_id", tenant.id)
        .maybeSingle()

      if (process.env.NODE_ENV !== "production") {
        console.log("[v0] Login check - ID:", authData.user.id, "Tenant:", tenant.id, "Role: resident")
        console.log("[v0] Login check result:", { residentData, residentError })
      }

      if (residentError || !residentData) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[v0] Login check failed details:", residentError)
        }
        await supabase.auth.signOut()
        throw new Error("You do not have access to this community")
      }

      // Identify the user for analytics
      identifyUser(authData.user.id, {
        tenant_slug: tenant.slug,
        role: residentData.is_tenant_admin ? 'tenant_admin' : 'resident',
        email: authData.user.email,
      })

      // Set session persistence AFTER tenant validation to avoid middleware race condition
      await setSessionPersistence(rememberMe)

      // Always redirect to dashboard (no onboarding check)
      if (residentData.is_tenant_admin) {
        router.push(`/t/${tenant.slug}/admin/dashboard`)
      } else {
        router.push(`/t/${tenant.slug}/dashboard`)
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err.message)
      ErrorAnalytics.actionFailed('login', err.message || "Unknown login error")
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveLoginCard className="shadow-xl border-earth-pebble">
      <div className="p-8">
        <div className="mb-8 text-center flex flex-col items-center">
          <h2 className="text-2xl font-bold text-forest-canopy mb-4">Welcome back, neighbor! ☀️</h2>

          <div className="relative w-24 h-24 mb-4 lg:hidden">
            <Image
              src="/rio/parrot.png"
              alt="Rio the Parrot"
              fill
              className="object-contain"
              priority
            />
          </div>

          <p className="text-mist-gray">Good to see you at {tenant.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-clay-mist border-clay-red text-clay-red">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-earth-soil font-medium">Your email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 border-earth-pebble focus-visible:ring-forest-canopy bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-earth-soil font-medium">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 border-earth-pebble focus-visible:ring-forest-canopy bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-mist-gray hover:text-forest-canopy transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-earth-soil"
            >
              Remember me
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-forest-canopy hover:bg-forest-deep text-white h-11 text-base font-semibold shadow-md transition-all active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 flex flex-col items-center justify-center space-y-3 text-sm">
          <Link
            href={`/t/${tenant.slug}/request-access`}
            className="text-forest-canopy hover:text-forest-deep hover:underline font-medium transition-colors"
          >
            Request access to this community
          </Link>
          <Link
            href={`/t/${tenant.slug}/forgot-password`}
            className="text-mist-gray hover:text-earth-soil hover:underline transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </ResponsiveLoginCard>
  )
}
