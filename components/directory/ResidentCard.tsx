"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, MapPin, Home } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { filterPrivateData } from "@/lib/privacy-utils"

import { AddToListDropdown } from "./AddToListDropdown"

interface ResidentCardProps {
    resident: any
    tenantSlug: string
    currentUserFamilyId: string | null
    neighborLists?: any[]
    tenantId?: string
    isTenantAdmin?: boolean
}

export function ResidentCard({ resident, tenantSlug, currentUserFamilyId, neighborLists = [], tenantId, isTenantAdmin = false }: ResidentCardProps) {
    const router = useRouter()
    const [imageError, setImageError] = useState(false)

    // Reset error state when URL changes (fix for "sticky" error state)
    React.useEffect(() => {
        setImageError(false)
    }, [resident.profile_picture_url])

    const privacySettings = Array.isArray(resident.user_privacy_settings)
        ? resident.user_privacy_settings[0]
        : resident.user_privacy_settings

    // ... (existing logic) ...
    const isFamily = resident.family_unit_id === currentUserFamilyId
    const filteredData = filterPrivateData(resident, privacySettings, isFamily, isTenantAdmin)

    // ... (existing logic) ...
    const hiddenFieldsCount = [
        !filteredData.show_email,
        !filteredData.show_phone,
        !filteredData.show_neighborhood,
        !filteredData.show_family,
        !filteredData.show_interests,
        !filteredData.show_skills,
    ].filter(Boolean).length

    const showPrivacyBadge = hiddenFieldsCount > 0 && !isFamily
    const initials = `${resident.first_name?.[0] || ""}${resident.last_name?.[0] || ""}`.toUpperCase()

    return (
        <Card
            className="hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden group"
            onClick={() => router.push(`/t/${tenantSlug}/dashboard/neighbours/${resident.id}`)}
        >
            <div className="absolute top-2 right-2 flex gap-1 z-20" onClick={(e) => e.stopPropagation()}>
                {/* Privacy Badge */}
                {showPrivacyBadge && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="secondary" className="gap-1 h-8">
                                    <EyeOff className="h-3 w-3" />
                                    {hiddenFieldsCount}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{hiddenFieldsCount} private field{hiddenFieldsCount > 1 ? "s" : ""}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                    {/* (Rest of content) */}
                    <Avatar className="h-16 w-16 flex-shrink-0">
                        {filteredData.show_profile_picture && resident.profile_picture_url && !imageError ? (
                            <Image
                                src={resident.profile_picture_url}
                                alt={`${resident.first_name} ${resident.last_name}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                                unoptimized={true}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                                {initials}
                            </AvatarFallback>
                        )}
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-semibold text-base truncate">
                            {resident.first_name} {resident.last_name}
                        </h3>

                        {filteredData.show_neighborhood && (resident.lots?.neighborhoods?.name || resident.lots?.lot_number) && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {resident.lots?.neighborhoods?.name && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">{resident.lots.neighborhoods.name}</span>
                                    </div>
                                )}
                                {resident.lots?.lot_number && (
                                    <div className="flex items-center gap-1">
                                        <Home className="h-3 w-3" />
                                        <span>Lot {resident.lots.lot_number}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground truncate min-h-[1.25rem]">
                            {filteredData.show_family && resident.family_units?.name ? (
                                resident.family_units.name
                            ) : (
                                <span className="opacity-0">-</span>
                            )}
                        </div>
                    </div>

                    {/* Add to List Button - Aligned with Avatar */}
                    <div onClick={(e) => e.stopPropagation()}>
                        {tenantId && (
                            <AddToListDropdown
                                neighborId={resident.id}
                                tenantId={tenantId}
                                lists={neighborLists}
                                variant="ghost"
                            />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
