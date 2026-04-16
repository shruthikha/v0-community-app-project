
import { createClient } from "@/lib/supabase/server"
import { sanitizeFilename } from "@/lib/upload-security"
import { v4 as uuidv4 } from "uuid"

// Storage bucket names
export const STORAGE_BUCKETS = {
    PHOTOS: "photos",
    DOCUMENTS: "documents",
} as const

// Max file size: 2MB
export const MAX_FILE_SIZE = 2 * 1024 * 1024

// Max photos per lot
export const MAX_PHOTOS_PER_LOT = 10

/**
 * Upload a file to Supabase Storage
 * @param file File object to upload
 * @param bucket Storage bucket name (default: "photos")
 * @param options Optional parameters: tenantId, lotId for path format
 * @returns Object containing public URL and other metadata
 */
export async function uploadFile(
    file: File,
    bucket: "photos" | "documents" = "photos",
    options?: {
        tenantId?: string
        lotId?: string
    }
) {
    // Validate file size before upload
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`)
    }

    const supabase = await createClient()

    const filename = sanitizeFilename(file.name)
    const uniqueId = uuidv4()

    // Create path based on options
    const date = new Date()
    let path: string

    if (options?.tenantId && options?.lotId) {
        // New path format: {tenantId}/lots/{lotId}/{year}/{month}/{uuid-filename}
        path = `${options.tenantId}/lots/${options.lotId}/${date.getFullYear()}/${date.getMonth() + 1}/${uniqueId}-${filename}`
    } else if (options?.tenantId) {
        // Tenant-only path: {tenantId}/{year}/{month}/{uuid-filename}
        path = `${options.tenantId}/${date.getFullYear()}/${date.getMonth() + 1}/${uniqueId}-${filename}`
    } else {
        // Legacy path for backward compatibility: year/month/uuid-filename
        path = `${date.getFullYear()}/${date.getMonth() + 1}/${uniqueId}-${filename}`
    }

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
        pathname: data.path, // Matches Vercel Blob's identifier concept
        contentType: file.type
    }
}

/**
 * Delete a file from Supabase Storage
 * @param pathOrUrl Full public URL or storage path
 * @param bucket Storage bucket name (default: "photos")
 */
export async function deleteFile(pathOrUrl: string, bucket: "photos" | "documents" = "photos") {
    const supabase = await createClient()

    // Extract path if it's a full URL
    let path = pathOrUrl
    if (pathOrUrl.startsWith('http')) {
        const url = new URL(pathOrUrl)
        // Supabase public URL format: .../storage/v1/object/public/bucket/path/to/file
        // We need to extract the path after the bucket name
        const pathParts = url.pathname.split(`/public/${bucket}/`)
        if (pathParts.length > 1) {
            path = pathParts[1]
        }
    }

    // Decode URI component in case the path has %20 etc
    path = decodeURIComponent(path)

    const { error } = await supabase
        .storage
        .from(bucket)
        .remove([path])

    if (error) {
        console.error(`[Supabase Storage] Delete error from ${bucket}:`, error)
        throw new Error(`Failed to delete from storage: ${error.message}`)
    }

    return true
}
