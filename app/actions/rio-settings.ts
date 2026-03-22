"use server"

import { createServerClient } from "@/lib/supabase/server"
import { validatePrompt } from "@/lib/ai/injection-filter"
import { revalidatePath } from "next/cache"

export type RioSettingsPayload = {
    persona?: string | null
    tone?: string | null
    community_policies?: string | null
    sign_off_message?: string | null
    emergency_contacts: { label: string; phone: string }[]
}

export async function updateRioSettings(slug: string, tenantId: string, payload: RioSettingsPayload) {
    const supabase = await createServerClient()

    // 1. Authenticate and check role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: userData } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    if (!userData || (userData.role !== 'tenant_admin' && userData.role !== 'super_admin')) {
        throw new Error("Forbidden: Admin privileges required")
    }

    // 2. Security: Injection Filter
    const personaValidation = validatePrompt(payload.persona)
    if (!personaValidation.safe) {
        return {
            success: false,
            error: `Potential prompt injection detected in persona! Pattern: ${personaValidation.pattern}`
        }
    }

    const policiesValidation = validatePrompt(payload.community_policies)
    if (!policiesValidation.safe) {
        return {
            success: false,
            error: `Potential prompt injection detected in community policies! Pattern: ${policiesValidation.pattern}`
        }
    }

    // 3. Metadata Merge & Required Fields
    const { data: config } = await supabase
        .from('rio_configurations')
        .select('metadata, prompt_community_name')
        .eq('tenant_id', tenantId)
        .single()

    const existingMetadata = config?.metadata || {}
    const communityName = config?.prompt_community_name || slug // Fallback to slug if not set

    // 4. Upsert configuration
    const { error } = await supabase
        .from('rio_configurations')
        .upsert({
            tenant_id: tenantId,
            prompt_community_name: communityName, // Added required field
            prompt_persona: payload.persona, // Fixed schema mismatch: prompt_tone -> prompt_persona
            tone: payload.tone,
            community_policies: payload.community_policies,
            sign_off_message: payload.sign_off_message,
            metadata: {
                ...existingMetadata,
                emergency_contacts: payload.emergency_contacts
            },
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'tenant_id'
        })

    if (error) {
        console.error("[updateRioSettings] Supabase error:", error)
        return { success: false, error: `Database error: ${error.message}` }
    }

    revalidatePath(`/t/${slug}/admin/rio/settings`)
    return { success: true }
}
