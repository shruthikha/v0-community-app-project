"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Upload, AlertCircle, Trash2 } from "lucide-react"
import { upsertDocument, deleteDocument } from "@/app/actions/documents"
import { toast } from "sonner"
import { uploadFileClient } from "@/lib/supabase-storage-client"
import TiptapEditor from "@/components/tiptap-editor"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    content: z.string().optional(),
    category: z.enum(["regulation", "financial", "construction", "hoa"]),
    document_type: z.enum(["page", "pdf"]),
    status: z.enum(["draft", "published", "archived"]),
    file_url: z.string().optional(),
    cover_image_url: z.string().optional(),
    is_featured: z.boolean().default(false),
    change_summary: z.string().min(0).default(""),
})

type DocumentFormValues = z.infer<typeof formSchema>

interface DocumentFormProps {
    tenantId: string
    slug: string
    document?: any
}

export function DocumentForm({ tenantId, slug, document }: DocumentFormProps) {
    const [isUploading, setIsUploading] = useState(false)

    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: document?.title || "",
            description: document?.description || "",
            content: document?.content || "",
            category: (document?.category as any) || "regulation",
            document_type: (document?.document_type as any) || "page",
            status: (document?.status as any) || "draft",
            file_url: document?.file_url || "",
            cover_image_url: document?.cover_image_url || "",
            is_featured: !!document?.is_featured,
            change_summary: "",
        },
    })

    const documentType = form.watch("document_type")
    const fileUrl = form.watch("file_url")

    async function onFileChange(e: React.ChangeEvent<HTMLInputElement>, fieldName: "file_url" | "cover_image_url") {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)
            const bucket = fieldName === "file_url" ? "documents" : "photos"
            const { url } = await uploadFileClient(file, tenantId, bucket)
            form.setValue(fieldName, url)
            toast.success("File uploaded successfully")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    async function onSubmit(data: DocumentFormValues) {
        // Enforce file upload for PDF types
        if (data.document_type === 'pdf' && !data.file_url) {
            toast.error("Please upload a PDF file before saving")
            return
        }

        try {
            const formData = new FormData()
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value.toString())
                }
            })

            const result = await upsertDocument(formData, tenantId, slug, document?.id)
            if (result && result.success) {
                toast.success(document ? "Document updated" : "Document created")
                router.push(`/t/${slug}/admin/documents`)
            } else {
                toast.error("An unexpected error occurred")
            }
        } catch (error: any) {
            console.error("Submit error:", error)
            toast.error(error.message || "Failed to save document")
        }
    }

    async function handleDelete() {
        if (!document) return
        try {
            const result = await deleteDocument(document.id, tenantId, slug)
            if (result.success) {
                toast.success("Document deleted successfully")
                router.push(`/t/${slug}/admin/documents`)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete document")
        }
    }

    if (!isMounted) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">

                {document && (
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <AlertTitle className="text-blue-800">New Version</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Updating this document will record a new entry in the changelog. Please provide a summary of changes below.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. HOA Bylaws 2025" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="regulation">📋 Regulation</SelectItem>
                                        <SelectItem value="financial">💰 Financial</SelectItem>
                                        <SelectItem value="construction">🏗️ Construction</SelectItem>
                                        <SelectItem value="hoa">🏠 HOA</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Brief summary of what this document contains..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="document_type"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Document Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="page">Web Page (Rich Text)</SelectItem>
                                        <SelectItem value="pdf">PDF File</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="cover_image_url"
                    render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Cover Image</FormLabel>
                            <div className="flex gap-4 items-start">
                                {field.value && (
                                    <div className="relative h-20 w-20 rounded-md overflow-hidden border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={field.value}
                                            alt="Cover"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => onFileChange(e, "cover_image_url")}
                                        disabled={isUploading}
                                    />
                                    <FormDescription>
                                        Optional. Displayed in the document library grid.
                                    </FormDescription>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {documentType === "page" ? (
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                    <div className="border rounded-md p-1 min-h-[300px]">
                                        <TiptapEditor
                                            content={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Write your document content here..."
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <FormItem>
                        <FormLabel>Upload PDF</FormLabel>
                        <div className="flex gap-4 items-center">
                            <Input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => onFileChange(e, "file_url")}
                                disabled={isUploading}
                            />
                            {isUploading && <Loader2 className="animate-spin h-4 w-4" />}
                        </div>
                        {fileUrl && (
                            <p className="text-sm text-green-600 mt-1">
                                ✅ File uploaded
                            </p>
                        )}
                    </FormItem>
                )}

                <div className="flex items-center space-x-4 border p-4 rounded-md">
                    <FormField
                        control={form.control}
                        name="is_featured"
                        render={({ field }: { field: any }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg p-0 space-y-0 gap-2">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Featured Document</FormLabel>
                                    <FormDescription>
                                        Pin this document to the top of the resident library.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                {document && (
                    <FormField
                        control={form.control}
                        name="change_summary"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Change Summary (Required for updates)</FormLabel>
                                <FormControl>
                                    <Input placeholder="What changed in this version?" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                    <Button type="submit" disabled={isUploading || form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            document ? "Update Document" : "Create Document"
                        )}
                    </Button>

                    {document && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete Document
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete "{document.title}" and purge all related AI embeddings.
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </form>
        </Form>
    )
}
