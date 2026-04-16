import { createClient } from "@/lib/supabase/server"
import { deleteFile } from "@/lib/supabase-storage"
import { NextResponse } from "next/server"
import { z } from "zod"

const DeleteSchema = z.object({
    url: z.string().url("Invalid URL"),
    lotId: z.string().uuid().optional(),
    tenantId: z.string().uuid().optional(),
})

/**
 * Extract lot ID, tenant ID, and entity type from storage URL
 * Supports three formats:
 * 1. New lot photo format: {tenantId}/lots/{lotId}/{year}/{month}/{filename}
 * 2. Tenant-only format: {tenantId}/{year}/{month}/{filename}
 * 3. Legacy format: {year}/{month}/{filename}
 * 
 * Note: Supabase Storage URLs include prefix: /storage/v1/object/public/{bucket}/
 */
function extractPathParams(url: string): { lotId?: string; tenantId?: string; entityType?: string; entityId?: string } {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split("/").filter(Boolean)

        // Define supported buckets and entity types
        const buckets = ["photos", "documents"]
        const entityTypes = ["lots", "families", "pets", "users", "locations", "neighborhoods", "events"]
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        // 1. Find the bucket folder (photos or documents)
        const bucketIndex = pathParts.findIndex(part => buckets.includes(part))
        
        if (bucketIndex < 0) {
            // Try legacy format starting from index 0 (for backward compatibility)
            return parseLegacyOrEntityFormat(pathParts, 0, entityTypes, uuidRegex)
        }

        // 2. Parse from after the bucket
        // Remaining parts after bucket: [tenantId or entityType, entityId?, year, month, filename]
        const afterBucket = pathParts.slice(bucketIndex + 1)

        if (afterBucket.length < 1) {
            return {}
        }

        const firstAfterBucket = afterBucket[0]

        // 3a. Check if first segment after bucket is UUID (tenant-only format)
        // Path: /storage/v1/object/public/photos/{tenantId}/{year}/{month}/{filename}
        if (afterBucket.length >= 3 && uuidRegex.test(firstAfterBucket)) {
            const tenantId = firstAfterBucket
            
            // Check if there's an entity type after tenantId
            if (afterBucket.length >= 4 && entityTypes.includes(afterBucket[1])) {
                const entityType = afterBucket[1]
                const entityId = afterBucket[2]
                if (entityType === "lots") {
                    return { tenantId, lotId: entityId, entityType }
                }
                return { tenantId, entityType, entityId }
            }
            
            return { tenantId }
        }

        // 3b. First segment after bucket might be an entity type (new format without UUID prefix for entity-specific uploads)
        // Path: /storage/v1/object/public/photos/{entityType}/{entityId}/...
        if (entityTypes.includes(firstAfterBucket)) {
            const entityIndex = afterBucket.findIndex(part => entityTypes.includes(part))
            
            if (entityIndex > 0) {
                // tenantId is before entity type
                const tenantId = afterBucket[entityIndex - 1]
                const entityType = afterBucket[entityIndex]
                const entityId = afterBucket[entityIndex + 1]
                
                if (entityType === "lots") {
                    return { tenantId, lotId: entityId, entityType }
                }
                return { tenantId, entityType, entityId }
            }
        }

        // 4. Legacy format: no tenantId (year/month/filename)
        return parseLegacyOrEntityFormat(afterBucket, 0, entityTypes, uuidRegex)
    } catch {
        return {}
    }
}

/**
 * Parse legacy or entity format from given path parts starting at offset
 */
function parseLegacyOrEntityFormat(
    pathParts: string[],
    startIndex: number,
    entityTypes: string[],
    uuidRegex: RegExp
): { lotId?: string; tenantId?: string; entityType?: string; entityId?: string } {
    // Check if first segment is a valid UUID (tenant-only format)
    const first = pathParts[startIndex]
    if (first && uuidRegex.test(first) && pathParts.length >= startIndex + 3) {
        return { tenantId: first }
    }

    // Check for entity type folder
    for (const entityType of entityTypes) {
        const entityIndex = pathParts.indexOf(entityType, startIndex)
        if (entityIndex > startIndex && entityIndex + 1 < pathParts.length) {
            const tenantId = pathParts[entityIndex - 1]
            const entityId = pathParts[entityIndex + 1]
            
            if (entityType === "lots") {
                return { tenantId, lotId: entityId, entityType }
            }
            return { tenantId, entityType, entityId }
        }
    }

    // Legacy format: no tenantId
    return {}
}

/**
 * Check if user can delete the photo
 * - User is super_admin
 * - User is tenant_admin for the same tenant
 * - User has a resident record for the same lot (own the photo)
 * - User's tenant matches the photo's tenant (for tenant-only format photos)
 * - User owns the entity (family, pet, user profile, location, etc.)
 */
async function checkDeletePermission(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    params: { lotId?: string; tenantId?: string; entityType?: string; entityId?: string }
): Promise<boolean> {
    // Get user data first (needed for role checks)
    const { data: userData } = await supabase
        .from("users")
        .select("role, tenant_id, is_tenant_admin, lot_id")
        .eq("id", userId)
        .single()

    if (!userData) return false

    // Super admin can delete any photo (always allowed)
    if (userData.role === "super_admin") return true

    // If we have a tenantId (from non-lot entity paths), verify tenant_admin is for THAT tenant
    // This handles non-lot entity photos (location, family, user, pet, neighborhood, event)
    // MUST verify the user's tenant_id matches the target tenantId
    if (params.tenantId) {
        const isTenantAdmin = 
            (userData.role === "tenant_admin" || userData.is_tenant_admin) &&
            userData.tenant_id === params.tenantId
        if (isTenantAdmin) return true
        
        // Check entity-specific ownership for non-lot entities
        if (params.entityType && params.entityId) {
            const isOwner = await checkEntityOwnership(supabase, userId, params.entityType, params.entityId)
            if (isOwner) return true
        }
    }
    
    // Tenant-only format: if no tenantId could be extracted at all, deny
    if (!params.lotId && !params.tenantId) {
        // Cannot determine target tenant - fail closed
        return false
    }

    // Resident can delete their lot photos if lotId provided
    if (params.lotId) {
        // First check users table (primary lot ownership)
        const { data: userWithLot } = await supabase
            .from("users")
            .select("id, lot_id")
            .eq("id", userId)
            .eq("lot_id", params.lotId)
            .single()

        if (userWithLot) return true

        // Fall back to residents table (uses auth_user_id to link to auth.users)
        const { data: residentData } = await supabase
            .from("residents")
            .select("id")
            .eq("auth_user_id", userId)
            .eq("lot_id", params.lotId)
            .single()
            
        if (residentData) return true
    }

    // Tenant-only format: allow delete if user's tenant matches photo's tenant
    // This handles photos uploaded with path {tenantId}/{year}/{month}/{filename}
    if (params.tenantId && userData.tenant_id === params.tenantId) {
        // User has a lot_id and their tenant matches the photo's tenant
        return true
    }

    return false
}

/**
 * Check if user owns a specific entity (family, pet, user profile, location, etc.)
 */
async function checkEntityOwnership(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    entityType: string,
    entityId: string
): Promise<boolean> {
    switch (entityType) {
        case "users":
            // User can delete their own profile photo
            // Note: users.id is the Supabase Auth user ID, so we match directly
            const { data: userData } = await supabase
                .from("users")
                .select("id")
                .eq("id", entityId)
                .eq("id", userId)
                .single()
            return !!userData

        case "families":
            // Family member can delete family photos
            const { data: familyMember } = await supabase
                .from("family_members")
                .select("id")
                .eq("member_user_id", userId)
                .eq("family_id", entityId)
                .single()
            return !!familyMember

        case "pets":
            // Pet owner can delete pet photos
            const { data: petOwner } = await supabase
                .from("pets")
                .select("id")
                .eq("id", entityId)
                .eq("owner_id", userId)
                .single()
            return !!petOwner

        case "locations":
            // Location creator can delete location photos
            const { data: locationCreator } = await supabase
                .from("locations")
                .select("id")
                .eq("id", entityId)
                .eq("created_by", userId)
                .single()
            return !!locationCreator

        case "neighborhoods":
            // Neighborhood creator can delete neighborhood photos
            const { data: neighborhoodCreator } = await supabase
                .from("neighborhoods")
                .select("id")
                .eq("id", entityId)
                .eq("created_by", userId)
                .single()
            return !!neighborhoodCreator

        case "events":
            // Event creator can delete event photos
            const { data: eventCreator } = await supabase
                .from("events")
                .select("id")
                .eq("id", entityId)
                .eq("created_by", userId)
                .single()
            return !!eventCreator

        default:
            return false
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const urlParam = searchParams.get("url")
        const lotIdParam = searchParams.get("lotId") || undefined
        const tenantIdParam = searchParams.get("tenantId") || undefined

        // Validate input - Zod expects url to be a string, handle null case
        if (!urlParam) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 })
        }

        const validation = DeleteSchema.safeParse({ 
            url: urlParam, 
            lotId: lotIdParam || undefined, 
            tenantId: tenantIdParam || undefined 
        })
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0]?.message || "Invalid parameters" },
                { status: 400 }
            )
        }

        // Authenticate user
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Extract path params from URL
        const extractedParams = extractPathParams(urlParam)
        
        // Validate: query params must not conflict with URL-extracted values
        // URL-extracted values are authoritative; query params only as fallback
        if (extractedParams.lotId && lotIdParam && lotIdParam !== extractedParams.lotId) {
            return NextResponse.json({ error: "lotId does not match URL path" }, { status: 400 })
        }
        if (extractedParams.tenantId && tenantIdParam && tenantIdParam !== extractedParams.tenantId) {
            return NextResponse.json({ error: "tenantId does not match URL path" }, { status: 400 })
        }
        
        // URL-extracted values take precedence; query params are fallback only
        const finalLotId = extractedParams.lotId ?? lotIdParam
        const finalTenantId = extractedParams.tenantId ?? tenantIdParam
        const finalEntityType = extractedParams.entityType
        const finalEntityId = extractedParams.entityId

        // Check permission
        const hasPermission = await checkDeletePermission(supabase, user.id, {
            lotId: finalLotId,
            tenantId: finalTenantId,
            entityType: finalEntityType,
            entityId: finalEntityId,
        })

        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to delete this photo" },
                { status: 403 }
            )
        }

        // Delete the file
        await deleteFile(urlParam)

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("[v0] Delete error:", error)
        const message = error instanceof Error ? error.message : "Failed to delete file"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}