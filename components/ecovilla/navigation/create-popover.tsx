"use client"

import React from "react"
import Link from "next/link"
import { MapPin, Calendar, ShoppingBag, ClipboardList, Smile } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/library/popover"
import { Button } from "@/components/library/button"
import { cn } from "@/lib/utils"

import { useState } from "react"
import { CreateCheckInModal } from "@/components/check-ins/create-check-in-modal"
import { CreateExchangeListingModal } from "@/components/exchange/create-exchange-listing-modal"
import { useUserJot } from "@/components/userjot/userjot-provider"

interface CreatePopoverProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tenantSlug: string
    tenantId: string
    categories: Array<{ id: string; name: string }>
    neighborhoods: Array<{ id: string; name: string }>
    rioEnabled?: boolean
    children: React.ReactNode
    align?: "center" | "end" | "start"
    side?: "top" | "bottom" | "left" | "right"
}

export function CreatePopover({
    open,
    onOpenChange,
    tenantSlug,
    tenantId,
    categories,
    neighborhoods,
    rioEnabled = false,
    children,
    align = "center",
    side = "top"
}: CreatePopoverProps) {
    const [showCheckIn, setShowCheckIn] = useState(false)
    const [showListing, setShowListing] = useState(false)
    const { openWidget } = useUserJot()

    const actions = [
        {
            icon: Smile,
            title: "Give feedback",
            description: "Share thoughts",
            onClick: () => {
                onOpenChange(false)
                openWidget()
            },
            color: "text-sunrise",
            bgColor: "bg-sunrise-soft",
            borderColor: "border-sunrise-soft",
        },
        ...(rioEnabled ? [{
            icon: Smile, // Or a chatbot icon if available
            title: "Chat with Río",
            description: "AI Assistant",
            href: `/t/${tenantSlug}/dashboard/rio`,
            color: "text-forest-canopy",
            bgColor: "bg-forest-soft",
            borderColor: "border-forest-gentle",
        }] : []),
        {
            icon: MapPin,
            title: "Check-in",
            description: "Share location",
            onClick: () => {
                onOpenChange(false)
                setShowCheckIn(true)
            },
            color: "text-sky-600",
            bgColor: "bg-sky-50",
            borderColor: "border-sky-100",
        },
        {
            icon: Calendar,
            title: "Event",
            description: "Organize",
            href: `/t/${tenantSlug}/dashboard/events/create`,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-100",
        },
        {
            icon: ShoppingBag,
            title: "Listing",
            description: "Share/Borrow",
            onClick: () => {
                onOpenChange(false)
                setShowListing(true)
            },
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-100",
        },
        {
            icon: ClipboardList,
            title: "Request",
            description: "Report issue",
            href: `/t/${tenantSlug}/dashboard/requests`,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-100",
        },
    ]

    return (
        <>
            <Popover open={open} onOpenChange={onOpenChange}>
                <PopoverTrigger asChild>
                    {children}
                </PopoverTrigger>
                <PopoverContent
                    side={side}
                    align={align}
                    className="w-72 p-4 rounded-2xl backdrop-blur-xl border shadow-xl"
                    sideOffset={16}
                >
                    <div className="mb-3 px-1">
                        <h3 className="font-bold text-lg">Create</h3>
                        <p className="text-xs text-muted-foreground">Contribute to your community</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {actions.map((action) => {
                            const content = (
                                <>
                                    <div className={cn("p-2 rounded-full shadow-sm transition-colors", action.color)}>
                                        <action.icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className={cn("font-semibold text-sm transition-colors", action.color)}>{action.title}</h4>
                                        <p className="text-[10px] text-muted-foreground">{action.description}</p>
                                    </div>
                                </>
                            )

                            const className = cn(
                                "flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:bg-accent active:scale-[0.98] w-full",
                            )

                            if (action.href) {
                                return (
                                    <Link
                                        key={action.title}
                                        href={action.href}
                                        onClick={() => onOpenChange(false)}
                                        className={className}
                                    >
                                        {content}
                                    </Link>
                                )
                            }

                            return (
                                <button
                                    key={action.title}
                                    onClick={action.onClick}
                                    className={className}
                                >
                                    {content}
                                </button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>

            <CreateCheckInModal
                open={showCheckIn}
                onOpenChange={setShowCheckIn}
                tenantSlug={tenantSlug}
                tenantId={tenantId}
            />

            <CreateExchangeListingModal
                open={showListing}
                onOpenChange={setShowListing}
                tenantSlug={tenantSlug}
                tenantId={tenantId}
                categories={categories}
                neighborhoods={neighborhoods}
            />
        </>
    )
}
