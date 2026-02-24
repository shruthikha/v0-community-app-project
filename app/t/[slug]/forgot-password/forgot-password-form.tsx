"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/library/button"
import { Input } from "@/components/library/input"
import { Label } from "@/components/library/label"
import { Alert, AlertDescription } from "@/components/library/alert"
import { resetPassword } from "@/app/actions/auth-actions"

export function ForgotPasswordForm({ tenantSlug }: { tenantSlug: string }) {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            // Server action checks tenant membership before sending.
            // Always returns success to prevent email enumeration.
            await resetPassword(email, tenantSlug)
            setSuccess(true)
        } catch (err: any) {
            console.error("[v0] Forgot password error:", err)
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl border border-earth-pebble text-center space-y-6">
                <div className="mx-auto w-12 h-12 bg-forest-growth/20 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-forest-canopy" />
                </div>
                <h2 className="text-2xl font-bold text-forest-canopy">Check your email</h2>
                <p className="text-mist-gray">
                    If you are a current resident in this community, you will receive an email with password reset instructions.
                </p>
                <Button asChild className="w-full mt-4 bg-forest-canopy hover:bg-forest-deep text-white h-11">
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
                <Link
                    href={`/t/${tenantSlug}/login`}
                    className="inline-flex items-center text-sm text-mist-gray hover:text-earth-soil transition-colors mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                </Link>
                <h2 className="text-2xl font-bold text-forest-canopy mb-2">Reset password</h2>
                <p className="text-mist-gray text-sm">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="destructive" className="bg-clay-mist border-clay-red text-clay-red">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-earth-soil font-medium">Email address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-mist-gray" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10 border-earth-pebble focus-visible:ring-forest-canopy"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-forest-canopy hover:bg-forest-deep text-white h-11"
                    disabled={loading || !email}
                >
                    {loading ? "Sending link..." : "Send reset link"}
                </Button>
            </form>
        </div>
    )
}
