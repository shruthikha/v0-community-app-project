"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/library/button"
import { Input } from "@/components/library/input"
import { Label } from "@/components/library/label"
import { Alert, AlertDescription } from "@/components/library/alert"
import { updatePassword } from "@/app/actions/auth-actions"

export function UpdatePasswordForm({ tenantSlug }: { tenantSlug: string }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(password)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("[Auth] Update password error:", err)
      setError("An error occurred. Your recovery session may have expired.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border border-earth-pebble text-center space-y-6">
        <div className="mx-auto w-12 h-12 bg-forest-growth/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6 text-forest-canopy" />
        </div>
        <h2 className="text-2xl font-bold text-forest-canopy">Password Updated</h2>
        <p className="text-mist-gray">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <Button asChild className="w-full bg-forest-canopy hover:bg-forest-deep text-white mt-4">
          <Link href={`/t/${tenantSlug}/login`}>
            Return to Login
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border border-earth-pebble">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-forest-canopy mb-2">Create new password</h2>
        <p className="text-mist-gray text-sm">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-clay-mist border-clay-red text-clay-red">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password" className="text-earth-soil font-medium">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="pl-10 pr-10 border-earth-pebble focus-visible:ring-forest-canopy"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-mist-gray hover:text-forest-canopy"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-earth-soil font-medium">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="pl-10 pr-10 border-earth-pebble focus-visible:ring-forest-canopy"
            />
          </div>
        </div >

        <Button
          type="submit"
          className="w-full bg-forest-canopy hover:bg-forest-deep text-white h-11"
          disabled={loading || !password || !confirmPassword}
        >
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form >
    </div >
  )
}
