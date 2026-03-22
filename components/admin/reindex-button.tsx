"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, BrainCircuit, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface ReindexButtonProps {
    documentId: string
    tenantId?: string
    status?: string
    className?: string
    disabled?: boolean
    "aria-label"?: string
}

export function ReindexButton({
    documentId,
    tenantId,
    status,
    className,
    disabled: externalDisabled,
    "aria-label": ariaLabel
}: ReindexButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleTrigger = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/v1/ai/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId })
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result.error?.message || "Failed to trigger ingestion")
            }

            toast({
                title: "Ingestion Started",
                description: "The AI is now processing your document.",
            })

            // We call router.refresh() to ensure the parent sees the initial 'pending' state
            // The badge component will take over polling from there
            router.refresh()
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err instanceof Error ? err.message : "An unexpected error occurred",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const isNotIndexed = !status || status === "not_indexed"
    const isProcessing = status === "pending" || status === "processing"

    // High-level gating: we don't show the button if it's currently processing
    if (isProcessing) return null

    if (isNotIndexed) {
        return (
            <Button
                variant="outline"
                size="sm"
                className={cn("h-7 text-xs gap-1.5", className)}
                onClick={handleTrigger}
                disabled={isLoading || externalDisabled}
                aria-label={ariaLabel || "Add to knowledge base"}
            >
                {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <BrainCircuit className="h-3 w-3" />
                )}
                Add to Knowledge Base
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 text-muted-foreground hover:text-foreground", className)}
            onClick={handleTrigger}
            disabled={isLoading || externalDisabled}
            title="Re-index document"
            aria-label={ariaLabel || "Re-index document"}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <RefreshCw className="h-4 w-4" />
            )}
        </Button>
    )
}
