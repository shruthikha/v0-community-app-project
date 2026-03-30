"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"
import { LoginForm } from "@/components/library/login-form"

function LoginContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl space-y-4">
        {reason === "timeout" && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your session has expired. Please log in again to continue.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-svh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
