"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface SettingsTabsProps {
  tenantSlug: string
}

export function SettingsTabs({ tenantSlug }: SettingsTabsProps) {
  const pathname = usePathname()

  const currentTab = pathname.includes("/privacy") ? "privacy" : pathname.includes("/family") ? "family" : "profile"

  return (
    <Tabs value={currentTab} className="w-full" id="settings-navigation-tabs">
      <TabsList className="w-full bg-muted/30 p-1 rounded-full h-auto flex">
        <TabsTrigger
          value="profile"
          asChild
          className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
        >
          <Link href={`/t/${tenantSlug}/dashboard/settings/profile`}>Profile</Link>
        </TabsTrigger>
        <TabsTrigger
          value="family"
          asChild
          className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
        >
          <Link href={`/t/${tenantSlug}/dashboard/settings/family`}>Household</Link>
        </TabsTrigger>
        <TabsTrigger
          value="privacy"
          asChild
          className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
        >
          <Link href={`/t/${tenantSlug}/dashboard/settings/privacy`}>Privacy</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
