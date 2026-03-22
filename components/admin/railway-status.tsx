"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Activity, Signal, SignalLow, AlertCircle, Loader2 } from "lucide-react"

interface RailwayStatusProps {
    railwayUrl?: string
}

export function RailwayStatus({ railwayUrl }: RailwayStatusProps) {
    const [status, setStatus] = useState<"ready" | "offline" | "loading">("loading")

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Use the BFF proxy to check health (to avoid CORS issues if direct fetch fails)
                const res = await fetch("/api/v1/ai/chat/health", { cache: "no-store" })
                if (res.ok) {
                    setStatus("ready")
                } else {
                    setStatus("offline")
                }
            } catch (err) {
                setStatus("offline")
            }
        }

        checkStatus()
        const interval = setInterval(checkStatus, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    if (status === "loading") {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking agent status...
            </div>
        )
    }

    if (status === "ready") {
        return (
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-600">Agent Live</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 text-xs font-medium text-destructive">
            <AlertCircle className="h-3 w-3" />
            Agent Offline
        </div>
    )
}
