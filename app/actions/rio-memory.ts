"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Deletes a specific memory fact or clears all memories for Río AI.
 * 
 * @param index - The index of the fact to delete. If omitted, and all is true, clears everything.
 * @param all - Set to true to bulk delete all memories.
 */
export async function deleteRioMemory(slug: string, index?: number, all: boolean = false) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Unauthorized" }
        }

        const internalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        let url = `${internalUrl}/api/v1/ai/memories`

        if (all) {
            url += '?all=true'
        } else if (index !== undefined) {
            url += `?index=${index}`
        } else {
            return { success: false, error: "Missing parameters" }
        }

        const headersList = await headers()
        const cookie = headersList.get('cookie') || ''

        // We use fetch to the local BFF route to leverage the existing proxy logic and security
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Cookie': cookie,
            }
        })

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.error || "Failed to delete memory" }
        }

        revalidatePath(`/t/${slug}/dashboard/settings/privacy`)
        return { success: true }
    } catch (error: any) {
        console.error("[RIO-MEMORY-ACTION] Deletion failed:", error)
        return { success: false, error: error.message }
    }
}
/**
 * Updates a specific memory fact for Río AI.
 * 
 * @param index - The index of the fact to update.
 * @param content - The new text for the fact.
 */
export async function updateRioMemory(slug: string, index: number, content: string) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: "Unauthorized" }
        }

        const internalUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const url = `${internalUrl}/api/v1/ai/memories`

        const headersList = await headers()
        const cookie = headersList.get('cookie') || ''

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie,
            },
            body: JSON.stringify({ index, content })
        })

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.error || "Failed to update memory" }
        }

        revalidatePath(`/t/${slug}/dashboard/settings/privacy`)
        return { success: true }
    } catch (error: any) {
        console.error("[RIO-MEMORY-ACTION] Update failed:", error)
        return { success: false, error: error.message }
    }
}
