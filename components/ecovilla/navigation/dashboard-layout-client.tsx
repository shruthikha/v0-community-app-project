"use client"

import React, { useState, useEffect } from "react"
import { MobileNav } from "@/components/ecovilla/navigation/mobile-nav"
import { DesktopNav } from "@/components/ecovilla/navigation/desktop-nav"
import { CreateFab } from "@/components/ecovilla/navigation/create-fab"
import { RioChatSheet } from "@/components/ecovilla/chat/RioChatSheet"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/lib/i18n"

interface DashboardLayoutClientProps {
    children: React.ReactNode
    slug: string
    tenantName: string
    tenantLogoUrl?: string
    user: {
        id: string
        name: string
        avatarUrl?: string | null
        unreadAnnouncements?: number
        pendingRequests?: number
        unreadEvents?: number
    }
    tenantId: string
    categories: Array<{ id: string; name: string }>
    neighborhoods: Array<{ id: string; name: string }>
    rioEnabled?: boolean
}

export function DashboardLayoutClient({
    children,
    slug,
    tenantName,
    tenantLogoUrl,
    user,
    tenantId,
    categories,
    neighborhoods,
    rioEnabled = false,
}: DashboardLayoutClientProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Persist collapse state
    useEffect(() => {
        const saved = localStorage.getItem("desktop-nav-collapsed")
        if (saved) {
            setIsCollapsed(saved === "true")
        }
    }, [])

    const toggleCollapse = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem("desktop-nav-collapsed", String(newState))
    }

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-earth-cloud/30">
                {/* Mobile Navigation (< 768px) */}
                <MobileNav
                    tenantSlug={slug}
                    user={user}
                    tenantId={tenantId}
                    categories={categories}
                    neighborhoods={neighborhoods}
                    rioEnabled={rioEnabled}
                />

                {/* Desktop Navigation (>= 768px) */}
                <DesktopNav
                    tenantSlug={slug}
                    tenantName={tenantName}
                    tenantLogoUrl={tenantLogoUrl}
                    user={user}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={toggleCollapse}
                />

                {/* Main Content Area */}
                <main
                    className={cn(
                        "min-h-screen pb-24 md:pb-0 transition-all duration-300",
                        isCollapsed ? "md:pl-20" : "md:pl-64"
                    )}
                >
                    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                        {children}
                    </div>
                </main>

                {/* Desktop FAB */}
                <CreateFab
                    tenantSlug={slug}
                    tenantId={tenantId}
                    categories={categories}
                    neighborhoods={neighborhoods}
                    rioEnabled={rioEnabled}
                />

                {/* Global Chat Sheet */}
                <RioChatSheet tenantId={tenantId} tenantSlug={slug} userId={user.id} />
            </div>
        </LanguageProvider>
    )
}
