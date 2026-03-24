"use client"

import React from "react"
import dynamic from "next/dynamic"

const MobileTopBar = dynamic(() => import("./mobile-top-bar").then((mod) => mod.MobileTopBar), {
    ssr: false,
})
import { MobileDock } from "./mobile-dock"

interface MobileNavProps {
    tenantSlug: string
    user: {
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

export function MobileNav({ tenantSlug, user, tenantId, categories, neighborhoods, rioEnabled = false }: MobileNavProps) {
    const [hasMounted, setHasMounted] = React.useState(false)

    React.useEffect(() => {
        setHasMounted(true)
    }, [])

    if (!hasMounted) {
        return null
    }

    return (
        <div className="md:hidden">
            <MobileTopBar tenantSlug={tenantSlug} user={user} />

            <MobileDock
                tenantSlug={tenantSlug}
                unreadEvents={user.unreadEvents}
                tenantId={tenantId}
                categories={categories}
                neighborhoods={neighborhoods}
                rioEnabled={rioEnabled}
            />
        </div>
    )
}
