import type React from "react"
import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Home, MapPin, Users, Building2, HeartHandshake, Map, Calendar, Package, ClipboardList, Megaphone,
  User,
  Settings,
  FileText,
  Warehouse, // Added for Facilities
  CalendarCheck,
  Stars,
} from 'lucide-react'
import Link from "next/link"
import { UserAvatarMenu } from "@/components/user-avatar-menu"

import { cache } from 'react'

// Cache the data fetching to prevent duplicate requests
const getAdminLayoutData = cache(async (slug: string) => {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, redirect: `/t/${slug}/login` }

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, first_name, last_name, email, profile_picture_url")
    .eq("id", user.id)
    .maybeSingle()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) return { user, redirect: "/backoffice/login" }

  const isSuperAdmin = userData?.role === "super_admin"
  const isTenantAdminRole = userData?.role === "tenant_admin" && userData?.tenant_id === tenant.id

  let isTenantAdmin = false
  let residentData = null

  if (isSuperAdmin) {
    const { data } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        is_tenant_admin,
        lot_id
      `)
      .eq("id", user.id)
      .maybeSingle()

    residentData = data
    isTenantAdmin = true

  } else if (isTenantAdminRole) {
    isTenantAdmin = true
    residentData = {
      id: user.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      profile_picture_url: userData?.profile_picture_url,
    }
  } else {
    const { data } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        is_tenant_admin,
        lot_id,
        lots!inner (
          neighborhood_id,
          neighborhoods!inner (
            tenant_id
          )
        )
      `)
      .eq("id", user.id)
      .maybeSingle()

    residentData = data
    const residentTenantId = data?.lots?.neighborhoods?.tenant_id
    isTenantAdmin = data?.is_tenant_admin === true && residentTenantId === tenant.id
  }

  return {
    user,
    userData,
    tenant,
    isSuperAdmin,
    isTenantAdminRole,
    isTenantAdmin,
    residentData,
    redirect: !isTenantAdmin ? `/t/${slug}/login` : null
  }
})

export default async function TenantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const data = await getAdminLayoutData(slug)

  if (data.redirect) {
    redirect(data.redirect)
  }

  const { user, userData, tenant, isSuperAdmin, isTenantAdminRole, residentData } = data

  const defaultFeatures = {
    neighborhoods: true,
    interests: true,
    families: true,
    lots: true,
    map: true,
    events_enabled: false,
    requests_enabled: true,
  }

  const features = {
    ...defaultFeatures,
    ...(tenant?.features || {}),
    events_enabled: tenant?.events_enabled ?? false,
    requests_enabled: tenant?.requests_enabled ?? true,
    announcements_enabled: tenant?.announcements_enabled ?? true,
  } as {
    neighborhoods?: boolean
    interests?: boolean
    families?: boolean
    lots?: boolean
    map?: boolean
    events_enabled?: boolean
    requests_enabled?: boolean
    announcements_enabled?: boolean
    location_types?: Record<string, boolean>
  }


  console.log("[v0] Tenant features from DB (layout):", tenant?.features)
  console.log("[v0] Merged features (layout):", features)
  console.log("[v0] Map feature enabled?", features.map)
  console.log("[v0] Events enabled?", features.events_enabled)
  console.log("[v0] Requests enabled?", features.requests_enabled)
  console.log("[v0] Announcements enabled?", features.announcements_enabled)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="px-2 py-2">
            <h2 className="text-lg font-semibold text-forest-900">{tenant.name}</h2>
            <p className="text-xs text-forest-600">
              {isSuperAdmin ? "Super Admin Access" : isTenantAdminRole ? "Tenant Admin" : "Community Admin"}
            </p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/dashboard`}>
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {features.map && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/map`}>
                        <Map />
                        <span>Community Map</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {features.neighborhoods && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/neighborhoods`}>
                        <MapPin />
                        <span>Neighborhoods</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/facilities`}>
                      <Warehouse />
                      <span>Facilities</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {tenant.reservations_enabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/reservations`}>
                        <CalendarCheck />
                        <span>Reservations</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {features.lots && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/lots`}>
                        <Building2 />
                        <span>Lots</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/residents`}>
                      <Users />
                      <span>Residents</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {features.families && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/families`}>
                        <HeartHandshake />
                        <span>Families</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {features.events_enabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/events`}>
                        <Calendar />
                        <span>Events</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/exchange`}>
                      <Package />
                      <span>Exchange</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {features.requests_enabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/requests`}>
                        <ClipboardList />
                        <span>Requests</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {features.announcements_enabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/announcements`}>
                        <Megaphone />
                        <span>Announcements</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/documents`}>
                      <FileText />
                      <span>Documents</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {(features as any).rio?.enabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/rio/settings`}>
                        <Stars className="text-forest-500" />
                        <span>Community Agent</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <UserAvatarMenu
            user={{
              firstName: residentData?.first_name || null,
              lastName: residentData?.last_name || null,
              email: residentData?.email || user.email || "",
              profilePictureUrl: residentData?.profile_picture_url || null,
            }}
            tenantSlug={slug}
            showResidentView={true}
            showBackToSuperAdmin={isSuperAdmin}
            isSuperAdmin={isSuperAdmin}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Community Administration</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
