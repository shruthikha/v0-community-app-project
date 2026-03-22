"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createNotification } from "./notifications"

const DocumentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    content: z.string().optional(),
    category: z.enum(["regulation", "financial", "construction", "hoa"]),
    document_type: z.enum(["page", "pdf"]),
    status: z.enum(["draft", "published", "archived"]),
    file_url: z.string().optional(),
    cover_image_url: z.string().optional(),
    is_featured: z.boolean().optional(),
    change_summary: z.string().optional(),
})

export async function upsertDocument(formData: FormData, tenantId: string, slug: string, documentId?: string) {
    const supabase = await createClient()

    // Validate user permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: userData } = await supabase
        .from("users")
        .select("role, tenant_id, is_tenant_admin")
        .eq("id", user.id)
        .single()

    const isSuperAdmin = userData?.role === "super_admin"
    const isTenantAdmin = (userData?.role === "tenant_admin" || userData?.is_tenant_admin) && userData?.tenant_id === tenantId

    if (!isSuperAdmin && !isTenantAdmin) {
        throw new Error("Unauthorized")
    }

    // Parse and validate form data
    const rawData = {
        title: formData.get("title"),
        description: formData.get("description"),
        content: formData.get("content"),
        category: formData.get("category"),
        document_type: formData.get("document_type"),
        status: formData.get("status"),
        file_url: formData.get("file_url"),
        cover_image_url: formData.get("cover_image_url"),
        is_featured: formData.get("is_featured") === "true",
        change_summary: formData.get("change_summary"),
    }

    const validated = DocumentSchema.parse(rawData)

    // Extra validation for updates and PDF types
    if (documentId && !validated.change_summary) {
        throw new Error("Change summary is required for document updates")
    }

    if (validated.document_type === "pdf" && !validated.file_url) {
        throw new Error("File URL is required for PDF documents")
    }

    // Construct DB payload
    const payload = {
        tenant_id: tenantId,
        title: validated.title,
        description: validated.description,
        content: validated.content,
        category: validated.category,
        document_type: validated.document_type,
        status: validated.status,
        file_url: validated.file_url,
        cover_image_url: validated.cover_image_url,
        is_featured: validated.is_featured,
        created_by: documentId ? undefined : user.id, // Only set on create
        updated_at: new Date().toISOString(),
    }

    let resultId = documentId

    if (documentId) {
        // Update existing document
        const { error } = await supabase
            .from("documents")
            .update(payload)
            .eq("id", documentId)

        if (error) throw new Error(error.message)
    } else {
        // Create new document
        const { data, error } = await supabase
            .from("documents")
            .insert(payload)
            .select("id")
            .single()

        if (error) throw new Error(error.message)
        resultId = data.id
    }

    // Handle changelog if summary provided
    if (validated.change_summary && resultId) {
        await supabase.from("document_changelog").insert({
            document_id: resultId,
            change_summary: validated.change_summary,
            changed_by: user.id
        })
    }

    // Trigger notifications if published
    if (validated.status === "published" && resultId) {
        try {
            // Fetch all residents in the tenant
            const { data: residents } = await supabase
                .from("users")
                .select("id")
                .eq("tenant_id", tenantId)
                .eq("role", "resident")
                .neq("id", user.id) // Don't notify the person who created/updated it

            console.log(`[upsertDocument] Found ${residents?.length || 0} residents to notify`)

            if (residents && residents.length > 0) {
                const notificationType = documentId ? "document_updated" : "document_published"
                const title = documentId ? `Updated: ${validated.title}` : `New: ${validated.title}`
                const message = validated.change_summary || validated.description || ""

                await Promise.all(
                    residents.map(resident =>
                        createNotification({
                            tenant_id: tenantId,
                            recipient_id: resident.id,
                            type: notificationType,
                            title: title,
                            message: message,
                            document_id: resultId,
                            actor_id: user.id
                        })
                    )
                )
                console.log(`[upsertDocument] Notifications triggered successfully`)
            }

            // Clear read status for everyone if this is an update so it reappears in feeds
            if (documentId) {
                const { error: clearError } = await supabase
                    .from("document_reads")
                    .delete()
                    .eq("document_id", resultId)

                if (clearError) {
                    console.error("[upsertDocument] Error clearing document_reads:", clearError)
                } else {
                    console.log(`[upsertDocument] Cleared read status for document ${resultId}`)
                }
            }
        } catch (notifyError) {
            console.error("Error triggering document notifications:", notifyError)
            // Don't fail the whole action if notification fails
        }
    }

    revalidatePath(`/t/${slug}/admin/documents`)
    return { success: true, id: resultId }
}

export async function deleteDocument(documentId: string, tenantId: string, slug: string) {
    const supabase = await createClient()

    // Validate user permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: userData } = await supabase
        .from("users")
        .select("role, tenant_id, is_tenant_admin")
        .eq("id", user.id)
        .single()

    const isSuperAdmin = userData?.role === "super_admin"
    const isTenantAdmin = (userData?.role === "tenant_admin" && userData?.tenant_id === tenantId) || userData?.is_tenant_admin

    if (!isSuperAdmin && !isTenantAdmin) {
        throw new Error("Unauthorized")
    }

    // 1. Fetch document for storage cleanup
    const { data: document, error: fetchError } = await supabase
        .from("documents")
        .select("file_url, tenant_id")
        .eq("id", documentId)
        .single()

    if (fetchError || !document) {
        throw new Error("Document not found")
    }

    // Security check: ensure tenant ID matches for tenant admins
    if (!isSuperAdmin && document.tenant_id !== tenantId) {
        throw new Error("Unauthorized: Tenant mismatch")
    }

    // 2. Cleanup related tables (per user request: keep in server action)
    await supabase.from("document_reads").delete().eq("document_id", documentId)
    await supabase.from("document_changelog").delete().eq("document_id", documentId)

    // 3. Cleanup Storage if PDF
    if (document.file_url && document.file_url.includes("/storage/v1/object/public/documents/")) {
        const filePath = document.file_url.split("/documents/")[1]
        if (filePath) {
            const { error: storageError } = await supabase.storage
                .from("documents")
                .remove([filePath])

            if (storageError) {
                console.error("[deleteDocument] Storage cleanup failed:", storageError)
                // We don't fail the whole action if storage cleanup fails, but we log it
            }
        }
    }

    // 4. Atomic Delete via Postgres RPC
    // This handles rio_document_chunks, rio_documents, and the source document record
    const { error: deleteError } = await supabase.rpc('delete_document_with_rio_cascade', {
        p_document_id: documentId,
        p_tenant_id: tenantId
    })

    if (deleteError) {
        console.error("[deleteDocument] RPC Error:", deleteError)
        throw new Error(deleteError.message)
    }

    revalidatePath(`/t/${slug}/admin/documents`)
    return { success: true }
}

export async function markDocumentAsRead(documentId: string, slug: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

    if (!userData) return { success: false, error: "Tenant not found" }

    try {
        await supabase
            .from("document_reads")
            .insert({
                document_id: documentId,
                user_id: user.id,
                tenant_id: userData.tenant_id
            })
            // Ignore if already exists
            .select()
    } catch (error) {
        // Ignore duplicate key errors, which mean it's already read
        console.error("Error marking document as read:", error)
    }

    revalidatePath(`/t/${slug}/dashboard/official`)
    return { success: true }
}
