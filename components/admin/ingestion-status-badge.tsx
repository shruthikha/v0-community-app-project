"use client"

import { useEffect, useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react"

interface IngestionStatusBadgeProps {
    documentId: string
    initialStatus?: string
    hasError?: boolean
    errorMessage?: string
    publishedOnly?: boolean
}

const POLLING_INTERVALS = [5000, 10000, 20000, 30000] // Backoff intervals in ms

export function IngestionStatusBadge({
    documentId,
    initialStatus = "not_indexed",
    hasError: initialHasError = false,
    errorMessage: initialErrorMessage,
    publishedOnly = false
}: IngestionStatusBadgeProps) {
    const [status, setStatus] = useState(initialStatus)
    const [hasError, setHasError] = useState(initialHasError)
    const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage || null)
    const [pollingIndex, setPollingIndex] = useState(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const isTerminal = status === "processed" || status === "error" || status === "not_indexed"

    // Sync state with props when router.refresh() or parent state changes
    useEffect(() => {
        if (initialStatus !== status || initialHasError !== hasError || initialErrorMessage !== errorMessage) {
            setStatus(initialStatus)
            setHasError(initialHasError)
            setErrorMessage(initialErrorMessage || null)
            if (initialStatus === "pending" || initialStatus === "processing") {
                setPollingIndex(0)
            }
        }
    }, [initialStatus, initialHasError, initialErrorMessage])

    useEffect(() => {
        if (isTerminal) {
            if (timerRef.current) clearTimeout(timerRef.current)
            return
        }

        const fetchStatus = async () => {
            try {
                // Add timestamp to bust any cache
                const res = await fetch(`/api/v1/ai/ingest-status?documentId=${documentId}&t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                })
                if (!res.ok) throw new Error("Failed to fetch status")

                const { data } = await res.json()
                if (data.status !== status || data.hasError !== hasError || data.errorMessage !== errorMessage) {
                    setStatus(data.status)
                    setHasError(data.hasError)
                    setErrorMessage(data.errorMessage)
                    // If status improved, we'll hit the next interval or stop via isTerminal
                }
            } catch (err) {
                console.error("[IngestionStatusBadge] Polling error:", err)
            } finally {
                setPollingIndex(prev => Math.min(prev + 1, POLLING_INTERVALS.length - 1))
            }
        }

        const interval = POLLING_INTERVALS[pollingIndex]
        timerRef.current = setTimeout(fetchStatus, interval)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [status, pollingIndex, documentId, isTerminal])

    if (status === "processed") {
        return (
            <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready
            </Badge>
        )
    }

    if ((status === "error" || hasError) && status !== "pending" && status !== "processing") {
        return (
            <Badge
                variant="destructive"
                className="gap-1.5 py-1 px-2.5 cursor-help"
                title={errorMessage || "An unknown error occurred during ingestion"}
            >
                <AlertCircle className="h-3.5 w-3.5" />
                Error
            </Badge>
        )
    }

    if (status === "pending" || status === "processing") {
        return (
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 animate-pulse text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {status === "pending" ? "Queued" : "Ingesting..."}
            </Badge>
        )
    }

    if (status === "not_indexed") {
        return null
    }

    return (
        <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
            <Clock className="h-3.5 w-3.5" />
            {status}
        </Badge>
    )
}
