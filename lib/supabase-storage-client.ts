import { createClient } from "@/lib/supabase/client"
import { sanitizeFilename } from "@/lib/upload-security"
import { v4 as uuidv4 } from "uuid"

/**
 * Upload a file to Supabase Storage (Client-side)
 * @param file File object to upload
 * @param tenantId UUID of the current tenant (required for RLS isolation)
 * @param bucket Storage bucket name (default: "documents")
 * @returns Object containing public URL and other metadata
 */
export async function uploadFileClient(file: File, tenantId: string, bucket: "documents" | "photos" = "documents") {
    const supabase = createClient()

    const filename = sanitizeFilename(file.name)
    const uniqueId = uuidv4()

    // Create a clean path: tenantId/year/month/uuid-filename
    // RLS policy requires the first folder to be the tenantId
    const date = new Date()
    const path = `${tenantId}/${date.getFullYear()}/${date.getMonth() + 1}/${uniqueId}-${filename}`

    const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error(`[Supabase Storage] Upload error to ${bucket}:`, error)
        throw new Error(`Failed to upload to storage: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(data.path)

    return {
        url: publicUrl,
        pathname: data.path,
        contentType: file.type
    }
}
