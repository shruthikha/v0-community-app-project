"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { reopenResidentRequest } from "@/app/actions/resident-requests"
import { RequestsAnalytics } from "@/lib/analytics"

interface ReopenRequestDialogProps {
    requestId: string
    requestTitle: string
    tenantId: string
    tenantSlug: string
}

export function ReopenRequestDialog({
    requestId,
    requestTitle,
    tenantId,
    tenantSlug,
}: ReopenRequestDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleReopen = async () => {
        startTransition(async () => {
            try {
                const result = await reopenResidentRequest(requestId, tenantId, tenantSlug)
                if (result.success) {
                    RequestsAnalytics.updated(requestId, 'in_progress')
                    toast.success("Request reopened successfully")
                    setOpen(false)
                    router.refresh()
                } else {
                    toast.error(result.error || "Failed to reopen request")
                }
            } catch (error) {
                toast.error("An unexpected error occurred")
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reopen
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reopen "{requestTitle}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will move the request back to an in-progress state and notify the resident.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => {
                        e.preventDefault();
                        handleReopen();
                    }} disabled={isPending}>
                        {isPending ? "Reopening..." : "Confirm Reopen"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
