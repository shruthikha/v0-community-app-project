"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updatePrivacySettings(settings: {
    show_email: boolean
    show_phone: boolean
    show_birthday: boolean
    show_birth_country: boolean
    show_current_country: boolean
    show_languages: boolean
    show_preferred_language: boolean
    show_journey_stage: boolean
    show_estimated_move_in_date: boolean
    show_construction_dates: boolean
    show_family: boolean
    show_family_relationships: boolean
    show_interests: boolean
    show_skills: boolean
    show_open_to_requests: boolean
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: "Not authenticated" }
    }

    const privacyData = {
        user_id: user.id,
        show_email: settings.show_email,
        show_phone: settings.show_phone,
        show_birthday: settings.show_birthday,
        show_birth_country: settings.show_birth_country,
        show_current_country: settings.show_current_country,
        show_languages: settings.show_languages,
        show_preferred_language: settings.show_preferred_language,
        show_journey_stage: settings.show_journey_stage,
        show_estimated_move_in_date: settings.show_estimated_move_in_date,
        show_construction_dates: settings.show_construction_dates,
        show_family: settings.show_family,
        show_family_relationships: settings.show_family_relationships,
        show_interests: settings.show_interests,
        show_skills: settings.show_skills,
        show_open_to_requests: settings.show_open_to_requests,
    }

    // Check if privacy settings exist
    const { data: existingSettings } = await supabase
        .from("user_privacy_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()

    let error
    if (existingSettings) {
        const { error: updateError } = await supabase
            .from("user_privacy_settings")
            .update(privacyData)
            .eq("user_id", user.id)
        error = updateError
    } else {
        const { error: insertError } = await supabase.from("user_privacy_settings").insert(privacyData)
        error = insertError
    }

    if (error) {
        console.error("Error updating privacy settings:", error)
        return { success: false, error: error.message }
    }

    // Fetch tenant slug for dynamic revalidation
    const { data: userData } = await supabase
        .from("users")
        .select("tenant_id(slug)")
        .eq("id", user.id)
        .single()
    const slug = (userData?.tenant_id as any)?.slug

    if (slug) {
        revalidatePath(`/t/${slug}/dashboard/settings/privacy`, "page")
    } else {
        revalidatePath("/t/[slug]/dashboard/settings/privacy", "page")
    }
    return { success: true }
}
