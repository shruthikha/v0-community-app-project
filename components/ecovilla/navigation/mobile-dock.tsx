"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Map, Plus, Calendar, ShoppingBag } from "lucide-react"
import { Dock, DockCard } from "@/components/library/dock"
import { CreatePopover } from "./create-popover"
import { cn } from "@/lib/utils"

interface MobileDockProps {
    tenantSlug: string
    unreadEvents?: number
    tenantId: string
    categories: Array<{ id: string; name: string }>
    neighborhoods: Array<{ id: string; name: string }>
    rioEnabled?: boolean
}

export function MobileDock({ tenantSlug, unreadEvents, tenantId, categories, neighborhoods, rioEnabled = false }: MobileDockProps) {
    const pathname = usePathname()
    const [openCreate, setOpenCreate] = useState(false)

    const dockItems = [
        {
            id: "home",
            icon: Home,
            label: "Home",
            href: `/t/${tenantSlug}/dashboard`,
        },
        {
            id: "map",
            icon: Map,
            label: "Map",
            href: `/t/${tenantSlug}/dashboard/community-map`,
        },
        {
            id: "create",
            icon: Plus,
            label: "Create",
            isElevated: true,
        },
        {
            id: "events",
            icon: Calendar,
            label: "Events",
            href: `/t/${tenantSlug}/dashboard/events`,
            badge: unreadEvents,
        },
        {
            id: "exchange",
            icon: ShoppingBag,
            label: "Exchange",
            href: `/t/${tenantSlug}/dashboard/exchange`,
        },
    ]

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <Dock
                magnification={0}
                distance={0}
                className="pointer-events-auto bg-earth-snow/90 backdrop-blur-xl border border-earth-pebble rounded-full shadow-2xl px-4 pb-3 pt-3 h-auto gap-4 relative left-auto transform-none"
                style={{ x: 0 }}
            >
                {dockItems.map((item) => (
                    <DockCard key={item.id} id={item.id} className={item.isElevated ? "border-none bg-transparent shadow-none hover:bg-transparent dark:bg-transparent" : undefined}>
                        {item.isElevated ? (
                            <CreatePopover
                                open={openCreate}
                                onOpenChange={setOpenCreate}
                                tenantSlug={tenantSlug}
                                tenantId={tenantId}
                                categories={categories}
                                neighborhoods={neighborhoods}
                                rioEnabled={rioEnabled}
                                side="top"
                                align="center"
                            >
                                <div
                                    className="cursor-pointer flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors"
                                    role="button"
                                    aria-label={item.label}
                                >
                                    <item.icon className="w-6 h-6" />
                                </div>
                            </CreatePopover>
                        ) : (
                            <Link
                                href={item.href || "#"}
                                aria-label={item.label}
                                className="flex items-center justify-center w-full h-full"
                            >
                                <div className="relative flex items-center justify-center w-10 h-10">
                                    <item.icon
                                        className={cn(
                                            "w-6 h-6 transition-all",
                                            pathname === item.href
                                                ? "text-forest-canopy stroke-[2.5px]"
                                                : "text-mist-gray"
                                        )}
                                    />
                                    {item.badge !== undefined && Number(item.badge) > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-sunrise text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                                            {Number(item.badge) > 99 ? "99+" : item.badge}
                                        </span>
                                    )}
                                    {pathname === item.href && (
                                        <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-forest-canopy" />
                                    )}
                                </div>
                            </Link>
                        )}
                    </DockCard>
                ))}
            </Dock>
        </div>
    )
}
