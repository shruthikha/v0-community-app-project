"use client"

import React, { useState } from "react"
import { Plus } from "lucide-react"
import { CreatePopover } from "./create-popover"

interface CreateFabProps {
    tenantSlug: string
    tenantId: string
    categories: Array<{ id: string; name: string }>
    neighborhoods: Array<{ id: string; name: string }>
    rioEnabled?: boolean
}

export function CreateFab({ tenantSlug, tenantId, categories, neighborhoods, rioEnabled = false }: CreateFabProps) {
    const [mounted, setMounted] = React.useState(false)
    const [open, setOpen] = useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <div className="hidden md:block fixed top-[64px] right-8 z-40">
            <CreatePopover
                open={open}
                onOpenChange={setOpen}
                tenantSlug={tenantSlug}
                tenantId={tenantId}
                categories={categories}
                neighborhoods={neighborhoods}
                rioEnabled={rioEnabled}
                side="left"
                align="end"
            >
                <button
                    className="flex w-14 h-14 rounded-full bg-forest-canopy shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all items-center justify-center group"
                    aria-label="Create new item"
                >
                    <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
            </CreatePopover>
        </div>
    )
}
