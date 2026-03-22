"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, FileText, File, Trash2, BrainCircuit, RefreshCw, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import type { Database } from "@/types/supabase"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { deleteDocument, upsertDocument } from "@/app/actions/documents"
import { IngestionStatusBadge } from "@/components/admin/ingestion-status-badge"
import { ReindexButton } from "@/components/admin/reindex-button"
import { useTenantFeatures } from "@/lib/hooks/use-tenant-features"
import { cn } from "@/lib/utils"
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

type Document = Database["public"]["Tables"]["documents"]["Row"]

interface AdminDocumentsTableProps {
    documents: Document[]
    rioDocs: {
        id: string
        status: string
        source_document_id: string
        error_message: string | null
        updated_at: string
    }[]
    slug: string
    tenantId: string
}

export function AdminDocumentsTable({
    documents,
    rioDocs,
    slug,
    tenantId
}: AdminDocumentsTableProps) {
    const [isMounted, setIsMounted] = useState(false)
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState<string | null>(null)

    const { hasRioFeature } = useTenantFeatures(tenantId)
    const hasRioEnabled = hasRioFeature('enabled')

    useEffect(() => {
        setIsMounted(true)
    }, [])


    const handleDelete = async (documentId: string) => {
        try {
            setIsProcessing(documentId)
            const result = await deleteDocument(documentId, tenantId, slug)
            if (result.success) {
                toast.success("Document deleted successfully")
                router.refresh()
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete document")
        } finally {
            setIsProcessing(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        {hasRioEnabled && <TableHead>AI Status</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isMounted && documents.map((doc) => {
                        const rioDoc = (rioDocs as any[]).find(r => r.source_document_id === doc.id)
                        const isIngesting = isProcessing === doc.id

                        return (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{doc.title}</span>
                                        {doc.is_featured && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                ⭐ Featured
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        {doc.document_type === 'pdf' ? (
                                            <File className="h-4 w-4 text-red-400" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-blue-400" />
                                        )}
                                        <span className="capitalize text-xs">{doc.document_type}</span>
                                    </div>
                                </TableCell>
                                {hasRioEnabled && (
                                    <TableCell>
                                        <div className="flex items-center gap-2 min-h-[32px]">
                                            {!rioDoc ? (
                                                doc.status === 'published' ? (
                                                    <ReindexButton
                                                        documentId={doc.id}
                                                        status="not_indexed"
                                                        aria-label="Reindex document"
                                                        disabled={!!isProcessing}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground italic">Published only</span>
                                                )
                                            ) : (
                                                <>
                                                    <IngestionStatusBadge
                                                        documentId={doc.id}
                                                        initialStatus={rioDoc.status}
                                                        hasError={!!rioDoc.error_message}
                                                        errorMessage={rioDoc.error_message || undefined}
                                                    />
                                                    {doc.status === 'published' && (
                                                        <ReindexButton
                                                            documentId={doc.id}
                                                            status={rioDoc.status}
                                                            className="h-7 w-7"
                                                            aria-label="Re-index document"
                                                            disabled={isProcessing === doc.id}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Badge variant={
                                        doc.status === 'published' ? 'default' :
                                            doc.status === 'draft' ? 'secondary' : 'outline'
                                    }>
                                        {doc.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {format(new Date(doc.updated_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            asChild
                                            disabled={isProcessing === doc.id}
                                        >
                                            <Link href={`/t/${slug}/admin/documents/${doc.id}/edit`} aria-label="Edit document">
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    aria-label="Delete document"
                                                    disabled={isProcessing === doc.id}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the document "{doc.title}".
                                                        All AI embeddings and historical metadata will be purged. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(doc.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
