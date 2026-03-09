"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ProfileUpdateData {
    firstName?: string
    lastName?: string
    phone?: string
    birthday?: string | null
    birthCountry?: string | null
    currentCountry?: string | null
    about?: string
    languages?: string[]
    preferredLanguage?: string
    journeyStage?: string
    estimatedMoveInDate?: string | null
    estimatedConstructionStartDate?: string | null
    estimatedConstructionEndDate?: string | null
    photos?: string[]
    heroPhoto?: string | null
    bannerImageUrl?: string | null
    userInterests?: string[]
    userSkills?: { id: string; skill_name?: string; open_to_requests: boolean; isNew?: boolean }[]
    tenantId: string
    slug: string
}

/**
 * Updates a resident's profile info, interests, and skills in a single multi-step transaction-like flow.
 * Enforces Backend-First architecture by using createAdminClient (service role).
 */
export async function updateProfileAction(userId: string, data: ProfileUpdateData) {
    // 0. Backend-First Security: Verify caller identity
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized: Please log in to update your profile.")
    }

    // TODO: if admin users are allowed to edit other profiles, we would check for `is_tenant_admin` here too.
    // Assuming residents can only edit their own profiles:
    if (user.id !== userId) {
        throw new Error("Forbidden: You do not have permission to modify this profile.")
    }

    const supabase = createAdminClient()

    // 1. Update basic user info
    const { error: userUpdateError } = await supabase
        .from("users")
        .update({
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            birthday: data.birthday,
            birth_country: data.birthCountry,
            current_country: data.currentCountry,
            about: data.about,
            languages: data.languages,
            preferred_language: data.preferredLanguage,
            journey_stage: data.journeyStage,
            estimated_move_in_date: data.estimatedMoveInDate,
            estimated_construction_start_date: data.estimatedConstructionStartDate,
            estimated_construction_end_date: data.estimatedConstructionEndDate,
            photos: data.photos,
            hero_photo: data.heroPhoto,
            profile_picture_url: data.heroPhoto, // Sync profile picture
            banner_image_url: data.bannerImageUrl,
        })
        .eq("id", userId)

    if (userUpdateError) {
        console.error("Error updating user info:", userUpdateError)
        throw new Error(userUpdateError.message)
    }

    // 2. Update Interests
    if (data.userInterests) {
        // Clear existing
        const { error: deleteInterestsError } = await supabase
            .from("user_interests")
            .delete()
            .eq("user_id", userId)

        if (deleteInterestsError) {
            console.error("Error clearing old interests:", deleteInterestsError)
            throw new Error(deleteInterestsError.message)
        }

        // Insert new
        if (data.userInterests.length > 0) {
            const interestsToInsert = data.userInterests.map(interestId => ({
                user_id: userId,
                interest_id: interestId
            }))
            const { error: insertInterestsError } = await supabase
                .from("user_interests")
                .insert(interestsToInsert)

            if (insertInterestsError) {
                console.error("Error inserting new interests:", insertInterestsError)
                throw new Error(insertInterestsError.message)
            }
        }
    }

    // 3. Update Skills
    if (data.userSkills) {
        const skillsToInsert = []

        for (const skill of data.userSkills) {
            if (skill.isNew && skill.skill_name) {
                // Check for duplicates in this tenant
                const { data: existingSkill } = await supabase
                    .from("skills")
                    .select("id")
                    .eq("tenant_id", data.tenantId)
                    .ilike("name", skill.skill_name.trim())
                    .single()

                if (existingSkill) {
                    skillsToInsert.push({
                        user_id: userId,
                        skill_id: existingSkill.id,
                        open_to_requests: skill.open_to_requests
                    })
                } else {
                    // Create new skill
                    const { data: newSkill, error: createError } = await supabase
                        .from("skills")
                        .insert({
                            name: skill.skill_name.trim(),
                            tenant_id: data.tenantId
                        })
                        .select()
                        .single()

                    if (createError) {
                        console.error("Error creating new skill:", createError)
                        continue
                    }

                    if (newSkill) {
                        skillsToInsert.push({
                            user_id: userId,
                            skill_id: newSkill.id,
                            open_to_requests: skill.open_to_requests
                        })
                    }
                }
            } else {
                // Existing skill
                skillsToInsert.push({
                    user_id: userId,
                    skill_id: skill.id,
                    open_to_requests: skill.open_to_requests
                })
            }
        }

        // Clear old user_skills
        const { error: deleteSkillsError } = await supabase
            .from("user_skills")
            .delete()
            .eq("user_id", userId)

        if (deleteSkillsError) {
            console.error("Error clearing old skills:", deleteSkillsError)
            throw new Error(deleteSkillsError.message)
        }

        // Insert new user_skills
        if (skillsToInsert.length > 0) {
            const { error: insertSkillsError } = await supabase
                .from("user_skills")
                .insert(skillsToInsert)

            if (insertSkillsError) {
                console.error("Error inserting new user_skills:", insertSkillsError)
                throw new Error(insertSkillsError.message)
            }
        }
    }

    revalidatePath(`/t/${data.slug}/dashboard/settings/profile`)
    return { success: true }
}
