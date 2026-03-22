import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { RioSettingsForm } from "@/components/admin/rio-settings-form"
import type { RioSettingsPayload } from "@/app/actions/rio-settings"

export default async function RioSettingsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createServerClient()

    // 1. Authenticate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/t/${slug}/login`)

    // 2. Resolve Tenant
    const { data: tenant } = await supabase
        .from("tenants")
        .select("id, features")
        .eq("slug", slug)
        .single()

    if (!tenant) redirect("/backoffice/login")

    // 3. Check Role (Admin Only)
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userData || (userData.role !== 'tenant_admin' && userData.role !== 'super_admin')) {
        redirect(`/t/${slug}/dashboard`)
    }

    // 4. Feature Check (Gate the whole page)
    const rioEnabled = (tenant.features as any)?.rio?.enabled === true
    if (!rioEnabled) {
        redirect(`/t/${slug}/admin/dashboard`)
    }

    // 5. Fetch Configuration
    const { data: config } = await supabase
        .from("rio_configurations")
        .select("*")
        .eq("tenant_id", tenant.id)
        .single()

    const initialData: RioSettingsPayload = {
        persona: (config as any)?.prompt_persona || "",
        tone: config?.tone || "professional",
        community_policies: config?.community_policies || "",
        sign_off_message: config?.sign_off_message || "",
        emergency_contacts: (config?.metadata as any)?.emergency_contacts || [],
    }

    return (
        <div className="max-w-5xl mx-auto py-6">
            <RioSettingsForm
                slug={slug}
                tenantId={tenant.id}
                initialData={initialData}
            />
        </div>
    )
}
