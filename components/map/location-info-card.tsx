"use client"


import { X, MapPin, Home, ExternalLink, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ReservationForm } from "@/components/reservations/ReservationForm"

interface LocationInfoCardProps {
  location: {
    id: string
    name: string
    type: string
    description?: string | null
    facility_type?: string | null
    icon?: string | null
    photos?: string[] | null
    neighborhood_id?: string | null
    lot_id?: string | null
    capacity?: number | null
    max_occupancy?: number | null
    amenities?: string[] | null
    hours?: string | null
    status?: string | null
    parking_spaces?: number | null
    accessibility_features?: string | null
    rules?: string | null
    path_difficulty?: string | null
    path_surface?: string | null
    path_length?: string | number | null
    elevation_gain?: string | number | null
    is_reservable?: boolean
    // Pre-enriched data from getLocations
    residents?: Resident[]
    family_units?: FamilyUnit[]
    pets?: Pet[]
    neighborhood?: { id: string; name: string } | null
    lot?: { id: string; lot_number: string } | null
  }
  onClose: () => void
  minimal?: boolean // Added minimal prop
  eventCount?: number | null // Added eventCount prop
  tenantSlug?: string // Added tenantSlug prop
  className?: string // Added className prop
  variant?: "default" | "embedded" // Added variant prop
}

interface Resident {
  id: string
  first_name: string
  last_name: string
  profile_picture_url?: string | null
  family_unit_id?: string
  family_units?: FamilyUnit[]
}

interface FamilyUnit {
  id: string
  name: string
  profile_picture_url?: string | null
}

interface Pet {
  id: string
  name: string
  species: string
  breed?: string | null
  profile_picture_url?: string | null
}

export function LocationInfoCard({
  location,
  onClose,
  minimal = false,
  eventCount,
  tenantSlug: propTenantSlug,
  className,
  variant = "default",
}: LocationInfoCardProps) {
  console.log("[v0] LocationInfoCard rendering for location:", location.name, location.id)
  console.log("[v0] Location data:", {
    type: location.type,
    lot_id: location.lot_id,
    neighborhood_id: location.neighborhood_id,
    is_reservable: location.is_reservable,
  })

  const [neighborhood, setNeighborhood] = useState<{ id: string; name: string } | null>(null)
  const [lot, setLot] = useState<{ id: string; lot_number: string; photos?: string[]; hero_photo?: string | null } | null>(null)
  const [residents, setResidents] = useState<Resident[]>([])
  const [familyUnit, setFamilyUnit] = useState<FamilyUnit | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [tenantSlug, setTenantSlug] = useState<string>(propTenantSlug || "")
  const [loading, setLoading] = useState(true)
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [reservationsEnabled, setReservationsEnabled] = useState(false)

  useEffect(() => {


    // Reset state before processing new location
    setNeighborhood(null)
    setLot(null)
    setResidents([])
    setFamilyUnit(null)
    setPets([])

    // Use pre-enriched data from props if available
    if ((location as any).neighborhood) {
      setNeighborhood((location as any).neighborhood)
    }
    if ((location as any).lot) {
      setLot((location as any).lot)
    }
    if ((location as any).residents && (location as any).residents.length > 0) {
      setResidents((location as any).residents)
      // Extract family unit from pre-enriched residents
      const resident = (location as any).residents.find((r: any) => r.family_unit_id)
      if (resident && (location as any).family_units && (location as any).family_units.length > 0) {
        setFamilyUnit((location as any).family_units[0])
      }
    }
    if ((location as any).pets) {
      setPets((location as any).pets)
    }

    const fetchRelatedData = async () => {
      setLoading(true)

      const supabase = createBrowserClient()

      if (!propTenantSlug) {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          const { data: user } = await supabase.from("users").select("tenant_id").eq("id", userData.user.id).single()
          if (user?.tenant_id) {
            const { data: tenant } = await supabase.from("tenants").select("slug, reservations_enabled").eq("id", user.tenant_id).single()
            if (tenant) {
              console.log("[v0] Tenant slug set:", tenant.slug)
              setTenantSlug(tenant.slug)
              setReservationsEnabled(tenant.reservations_enabled ?? false)
            }
          }
        }
      } else {
        // If slug is provided, we should probably fetch the tenant config for it if we don't have it passed down
        // For now, let's assume if slug is passed, the caller might need to pass feature flags, or we fetch
        const { data: tenant } = await supabase.from("tenants").select("reservations_enabled").eq("slug", propTenantSlug).single()
        if (tenant) {
          setReservationsEnabled(tenant.reservations_enabled ?? false)
        }
      }

      if (location.neighborhood_id) {
        console.log("[v0] Fetching neighborhood for id:", location.neighborhood_id)
        const { data } = await supabase
          .from("neighborhoods")
          .select("id, name")
          .eq("id", location.neighborhood_id)
          .single()
        if (data) {
          console.log("[v0] Neighborhood found:", data.name)
          setNeighborhood(data)
        }
      }

      if (location.lot_id) {
        console.log("[v0] Fetching lot for id:", location.lot_id)
        const { data } = await supabase.from("lots").select("id, lot_number, photos, hero_photo").eq("id", location.lot_id).single()
        if (data) {
          console.log("[v0] Lot found:", data.lot_number, "photos:", data.photos?.length || 0)
          setLot(data)
        }
      }

      if (location.type === "lot" && location.lot_id) {
        console.log("[v0] Fetching residents for lot_id:", location.lot_id)
        const { data, error } = await supabase
          .from("users")
          .select(
            "id, first_name, last_name, profile_picture_url, family_unit_id, family_units(id, name, profile_picture_url)",
          )
          .eq("lot_id", location.lot_id)
          .eq("role", "resident")

        console.log("[v0] Residents query result:", { count: data?.length || 0, error })

        if (data && data.length > 0) {
          console.log(
            "[v0] Residents found:",
            data.map((r) => `${r.first_name} ${r.last_name}`),
          )
          setResidents(data)

          const familyData = data.find((resident: any) => resident.family_units)?.family_units
          const family = Array.isArray(familyData) ? familyData[0] : familyData

          if (family) {
            console.log("[v0] Family unit found:", family.name)
            setFamilyUnit(family)

            console.log("[v0] Fetching pets for family:", family.id)
            const { data: petsData, error: petsError } = await supabase
              .from("pets")
              .select("id, name, species, breed, profile_picture_url")
              .eq("family_unit_id", family.id)

            console.log("[v0] Pets query result:", { count: petsData?.length || 0, error: petsError })
            if (petsData) {
              console.log(
                "[v0] Pets found:",
                petsData.map((p) => p.name),
              )
              setPets(petsData)
            }
          } else {
            console.log("[v0] No family unit found for residents")
          }
        }
      } else {
        console.log("[v0] Skipping residents fetch - not a lot or no lot_id")
      }

      setLoading(false)
      console.log("[v0] Finished fetching related data, loading set to false")
    }

    fetchRelatedData()
  }, [location.id, location.neighborhood_id, location.lot_id, location.type, propTenantSlug])

  console.log("[v0] LocationInfoCard render state:", {
    loading,
    hasResidents: residents.length > 0,
    hasFamilyUnit: !!familyUnit,
    hasPets: pets.length > 0,
    hasNeighborhood: !!neighborhood,
    hasLot: !!lot,
  })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "facility":
        return "Facility"
      case "lot":
        return "Lot"
      case "walking_path":
        return "Walking Path"
      case "neighborhood":
        return "Neighborhood"
      case "public_street":
        return "Public Street"
      case "green_area":
        return "Green Area"
      case "playground":
        return "Playground"
      case "protection_zone":
        return "Protection Zone"
      default:
        // Capitalize default
        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "facility":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "lot":
        return "bg-neutral-100 text-neutral-800 border-neutral-200"
      case "walking_path":
        return "bg-sky-100 text-sky-800 border-sky-200"
      case "neighborhood":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      Open: { label: "Open", color: "bg-green-100 text-green-800 border-green-200" },
      Closed: { label: "Closed", color: "bg-red-100 text-red-800 border-red-200" },
      Maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      "Coming Soon": { label: "Coming Soon", color: "bg-blue-100 text-blue-800 border-blue-200" },
      "Temporarily Unavailable": {
        label: "Temporarily Unavailable",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
    }
    const config = statusConfig[status] || statusConfig.Open
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig: Record<string, { label: string; color: string; emoji: string }> = {
      Easy: { label: "Easy", color: "bg-green-100 text-green-800 border-green-200", emoji: "🟢" },
      Moderate: { label: "Moderate", color: "bg-blue-100 text-blue-800 border-blue-200", emoji: "🔵" },
      Difficult: { label: "Difficult", color: "bg-orange-100 text-orange-800 border-orange-200", emoji: "🟠" },
      Expert: { label: "Expert", color: "bg-red-100 text-red-800 border-red-200", emoji: "🔴" },
    }
    const config = difficultyConfig[difficulty] || difficultyConfig.Easy
    return (
      <Badge variant="outline" className={config.color}>
        {config.emoji} {config.label}
      </Badge>
    )
  }

  const titleSize = minimal ? "text-sm" : "text-base"
  const spacing = minimal ? "space-y-2" : "space-y-4"
  const textSize = minimal ? "text-xs" : "text-sm"
  const padding = minimal ? "p-1.5" : "p-2"
  const avatarSize = minimal ? "h-6 w-6" : "h-8 w-8"

  const defaultClasses =
    variant === "embedded"
      ? "w-full border-none shadow-none bg-transparent"
      : minimal
        ? "w-80 max-h-[350px] flex flex-col shadow-xl border-2 relative"
        : "w-80 max-h-[400px] flex flex-col shadow-xl border-2 relative"

  if (variant === "embedded") {
    // For embedded mode, we render a div to avoid Card's default styles if they persist
    return (
      <div className={cn("flex flex-col relative", defaultClasses, className)}>
        <CardHeader className="pb-3 shrink-0 px-0 pt-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className={`${titleSize} flex items-center gap-2`}>
                {location.icon && <span className="text-xl">{location.icon}</span>}
                <span className="truncate">{location.name}</span>
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={getTypeColor(location.type)}>
                  {getTypeLabel(location.type)}
                </Badge>
                {location.facility_type && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    {location.facility_type}
                  </Badge>
                )}
                {location.status && location.type !== "lot" && getStatusBadge(location.status)}
                {eventCount !== undefined && eventCount !== null && eventCount > 0 && (
                  <Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200 gap-1">
                    <Calendar className="h-3 w-3" />
                    {eventCount} event{eventCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild className="w-full mt-3" size="sm" variant="default">
            <Link
              href={`/t/${tenantSlug || propTenantSlug}/dashboard/locations/${location.id}${eventCount && eventCount > 0 ? "#events" : ""}`}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {eventCount && eventCount > 0 ? "View Events & Details" : "View Full Details"}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className={`${spacing} overflow-y-auto flex-1 px-0 pb-0`}>
          {location.type === "facility" && location.is_reservable && reservationsEnabled && (
            <div className="mb-4">
              <Button className="w-full" size="sm" variant="secondary" onClick={() => setIsReservationOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Reserve Facility
              </Button>
            </div>
          )}

          {/* Linked Dialog for Embedded Variant */}
          <Dialog open={isReservationOpen} onOpenChange={setIsReservationOpen}>
            <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Reserve {location.name}</DialogTitle>
                <DialogDescription>
                  Fill out the form below to reserve this facility.
                </DialogDescription>
              </DialogHeader>
              <ReservationForm
                locationId={location.id}
                tenantSlug={propTenantSlug || tenantSlug}
                onSuccess={() => setIsReservationOpen(false)}
                onCancel={() => setIsReservationOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {location.photos && location.photos.length > 0 && (
            <div className="relative w-full rounded-lg overflow-hidden border bg-muted cursor-pointer group -mt-1 mb-3">
              <img
                src={location.photos[0] || "/placeholder.svg"}
                alt={location.name}
                className="w-full aspect-[2/1] object-cover hover:scale-105 transition-transform"
                onClick={() => {
                  if (location.photos && location.photos.length > 0) {
                    window.open(location.photos[0], "_blank")
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          )}

          {/* Lot photos display - only show for lot type when photos exist */}
          {location.type === "lot" && lot?.photos && lot.photos.length > 0 && (
            <div className="relative w-full rounded-lg overflow-hidden border bg-muted cursor-pointer group -mt-1 mb-3">
              <img
                src={lot.photos[0] || "/placeholder.svg"}
                alt={`${location.name} home`}
                className="w-full aspect-[2/1] object-cover hover:scale-105 transition-transform"
                onClick={() => {
                  if (lot?.photos && lot.photos.length > 0) {
                    window.open(lot.photos[0], "_blank")
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          )}

          {location.description && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
              <p className={`${textSize} text-foreground leading-relaxed line-clamp-3`}>{location.description}</p>
            </div>
          )}

          {location.type === "facility" && (
            <div className="space-y-2 pt-2">
              {(location.capacity || location.hours || location.amenities?.length) && (
                <div className="space-y-2 text-sm">
                  {location.capacity && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Capacity:</span>
                      <span className="text-foreground">{location.capacity} people</span>
                    </div>
                  )}
                  {location.hours && (
                    <div className="flex items-center gap-2">
                      <span>🕐</span>
                      <span className="text-muted-foreground line-clamp-1">{location.hours.split("\n")[0]}</span>
                    </div>
                  )}
                  {location.amenities && location.amenities.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span>✨</span>
                      <span className="text-muted-foreground">{location.amenities.length} amenities</span>
                    </div>
                  )}
                  {location.parking_spaces !== undefined && location.parking_spaces !== null && (
                    <div className="flex items-center gap-2">
                      <span>🅿️</span>
                      <span className="text-muted-foreground">
                        {location.parking_spaces > 0 ? `${location.parking_spaces} spaces` : "No parking"}
                      </span>
                    </div>
                  )}
                  {location.accessibility_features && (
                    <div className="flex items-center gap-2">
                      <span>♿</span>
                      <span className="text-muted-foreground">Accessible</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {location.type === "walking_path" && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Path Details</h4>
              {(location.path_difficulty || location.path_length || location.path_surface || location.elevation_gain) && (
                <div className="space-y-2 text-sm">
                  {location.path_difficulty && (
                    <div className="flex items-center gap-2">
                      <span title="Difficulty">📈</span>
                      <span className="text-muted-foreground font-medium">Difficulty:</span>
                      <span className="text-foreground capitalize">{location.path_difficulty}</span>
                    </div>
                  )}
                  {location.path_surface && (
                    <div className="flex items-center gap-2">
                      <span title="Surface">🛤️</span>
                      <span className="text-muted-foreground font-medium">Surface:</span>
                      <span className="text-foreground capitalize">{location.path_surface}</span>
                    </div>
                  )}
                  {location.path_length && (
                    <div className="flex items-center gap-2">
                      <span title="Distance">📏</span>
                      <span className="text-muted-foreground font-medium">Distance:</span>
                      <span className="text-foreground">
                        {!isNaN(Number(location.path_length))
                          ? `${(Number(location.path_length) / 1000).toFixed(2)} km`
                          : location.path_length}
                      </span>
                    </div>
                  )}
                  {location.elevation_gain !== undefined && location.elevation_gain !== null && (
                    <div className="flex items-center gap-2">
                      <span title="Elevation Gain">🏔️</span>
                      <span className="text-muted-foreground font-medium">Elevation:</span>
                      <span className="text-foreground">
                        {!isNaN(Number(location.elevation_gain))
                          ? `${Number(location.elevation_gain)} m`
                          : location.elevation_gain} Gain
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {neighborhood && (
            <div className={`flex items-center gap-2 ${padding} bg-purple-50 border border-purple-200 rounded-lg`}>
              <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className={`${textSize} text-purple-900 truncate font-medium`}>{neighborhood.name}</p>
              </div>
            </div>
          )}

          {lot && (
            <div className={`flex items-center gap-2 ${padding} bg-neutral-50 border border-neutral-200 rounded-lg`}>
              <Home className="h-4 w-4 text-neutral-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className={`${textSize} text-neutral-900 truncate font-medium`}>Lot #{lot.lot_number}</p>
              </div>
            </div>
          )}

          {familyUnit && tenantSlug && (
            <Link
              href={`/t/${tenantSlug}/dashboard/families/${familyUnit.id}`}
              className={`flex items-center gap-2 ${padding} bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer`}
            >
              <Avatar className={avatarSize}>
                <AvatarImage
                  src={familyUnit.profile_picture_url || undefined}
                  alt={familyUnit.name}
                  className="object-cover"
                />
                <AvatarFallback className={`bg-amber-200 text-amber-900 ${textSize} font-semibold`}>
                  {familyUnit.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`${titleSize} font-semibold text-amber-900 truncate`}>{familyUnit.name}</p>
                <p className={`${textSize} text-amber-700`}>
                  {residents.length} member{residents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          )}

          {residents.length > 0 && tenantSlug && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Residents</p>
              {residents.map((resident) => (
                <Link
                  key={resident.id}
                  href={`/t/${tenantSlug}/dashboard/neighbours/${resident.id}`}
                  className={`flex items-center gap-2 ${padding} bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer`}
                >
                  <Avatar className={avatarSize}>
                    <AvatarImage
                      src={resident.profile_picture_url || undefined}
                      alt={`${resident.first_name} ${resident.last_name}`}
                      className="object-cover"
                    />
                    <AvatarFallback className={`bg-green-200 text-green-900 ${textSize} font-semibold`}>
                      {resident.first_name?.[0]}
                      {resident.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`${titleSize} font-semibold text-green-900 truncate`}>
                      {resident.first_name} {resident.last_name}
                    </p>
                    <p className={`${textSize} text-green-700`}>View profile</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pets.length > 0 && (
            <div className={`flex items-center gap-2 ${padding} bg-pink-50 border border-pink-200 rounded-lg`}>
              <span className="text-base">🐾</span>
              <div className="min-w-0 flex-1">
                <p className={`${textSize} text-pink-900 font-medium`}>
                  {pets.length} pet{pets.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}

          {!loading &&
            !location.description &&
            (!location.photos || location.photos.length === 0) &&
            !neighborhood &&
            !lot &&
            residents.length === 0 &&
            pets.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-2">No additional information available</p>
            )}

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </CardContent>
      </div>
    )
  }

  return (
    <Card className={cn("flex flex-col shadow-xl border-2 relative", defaultClasses, className)}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className={`${titleSize} flex items-center gap-2`}>
              {location.icon && <span className="text-xl">{location.icon}</span>}
              <span className="truncate">{location.name}</span>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={getTypeColor(location.type)}>
                {getTypeLabel(location.type)}
              </Badge>
              {location.facility_type && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {location.facility_type}
                </Badge>
              )}
              {location.status && location.type !== "lot" && getStatusBadge(location.status)}
              {eventCount !== undefined && eventCount !== null && eventCount > 0 && (
                <Badge variant="outline" className="bg-neutral-50 text-neutral-700 border-neutral-200 gap-1">
                  <Calendar className="h-3 w-3" />
                  {eventCount} event{eventCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button asChild className="w-full mt-3" size="sm" variant="default">
          <Link
            href={`/t/${tenantSlug || propTenantSlug}/dashboard/locations/${location.id}${eventCount && eventCount > 0 ? "#events" : ""}`}
            className="flex items-center justify-center p-2"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {eventCount && eventCount > 0 ? "View Events & Details" : "View Full Details"}
          </Link>
        </Button>

        {location.type === "facility" && location.is_reservable && reservationsEnabled && (
          <Button className="w-full mt-2" size="sm" variant="secondary" onClick={() => setIsReservationOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Reserve Facility
          </Button>
        )}
      </CardHeader>
      <Dialog open={isReservationOpen} onOpenChange={setIsReservationOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Reserve {location.name}</DialogTitle>
            <DialogDescription>
              Fill out the form below to reserve this facility.
            </DialogDescription>
          </DialogHeader>
          <ReservationForm
            locationId={location.id}
            tenantSlug={tenantSlug}
            onSuccess={() => setIsReservationOpen(false)}
            onCancel={() => setIsReservationOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <CardContent className={`${spacing} overflow-y-auto flex-1`}>
        {location.photos && location.photos.length > 0 && (
          <div className="relative w-full rounded-lg overflow-hidden border bg-muted cursor-pointer group -mt-1 mb-3">
            <img
              src={location.photos[0] || "/placeholder.svg"}
              alt={location.name}
              className="w-full aspect-[2/1] object-cover hover:scale-105 transition-transform"
              onClick={() => {
                if (location.photos && location.photos.length > 0) {
                  window.open(location.photos[0], "_blank")
                }
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        )}

        {/* Lot photos display - only show for lot type when photos exist */}
        {location.type === "lot" && lot?.photos && lot.photos.length > 0 && (
          <div className="relative w-full rounded-lg overflow-hidden border bg-muted cursor-pointer group -mt-1 mb-3">
            <img
              src={lot.photos[0] || "/placeholder.svg"}
              alt={`${location.name} home`}
              className="w-full aspect-[2/1] object-cover hover:scale-105 transition-transform"
              onClick={() => {
                if (lot?.photos && lot.photos.length > 0) {
                  window.open(lot.photos[0], "_blank")
                }
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        )}

        {location.description && (
          <div className="space-y-1 mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
            <p className={`${textSize} text-foreground leading-relaxed line-clamp-3`}>{location.description}</p>
          </div>
        )}

        {location.type === "facility" && (
          <div className="space-y-2 pt-2">
            {(location.capacity || location.hours || location.amenities?.length) && (
              <div className="space-y-2 text-sm">
                {location.capacity && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Capacity:</span>
                    <span className="text-foreground">{location.capacity} people</span>
                  </div>
                )}
                {location.hours && (
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span className="text-muted-foreground line-clamp-1">{location.hours.split("\n")[0]}</span>
                  </div>
                )}
                {location.amenities && location.amenities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    <span className="text-muted-foreground">{location.amenities.length} amenities</span>
                  </div>
                )}
                {location.parking_spaces !== undefined && location.parking_spaces !== null && (
                  <div className="flex items-center gap-2">
                    <span>🅿️</span>
                    <span className="text-muted-foreground">
                      {location.parking_spaces > 0 ? `${location.parking_spaces} spaces` : "No parking"}
                    </span>
                  </div>
                )}
                {location.accessibility_features && (
                  <div className="flex items-center gap-2">
                    <span>♿</span>
                    <span className="text-muted-foreground">Accessible</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {location.type === "walking_path" && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Path Details</h4>
            {(location.path_difficulty || (location.path_length !== null && location.path_length !== undefined) || location.path_surface || (location.elevation_gain !== null && location.elevation_gain !== undefined)) && (
              <div className="space-y-2 text-sm">
                {location.path_difficulty && (
                  <div className="flex items-center gap-2">
                    <span title="Difficulty">📈</span>
                    <span className="text-muted-foreground font-medium">Difficulty:</span>
                    <span className="text-foreground">{location.path_difficulty}</span>
                  </div>
                )}
                {location.path_surface && (
                  <div className="flex items-center gap-2">
                    <span title="Surface">🛤️</span>
                    <span className="text-muted-foreground font-medium">Surface:</span>
                    <span className="text-foreground capitalize">{location.path_surface}</span>
                  </div>
                )}
                {(location.path_length !== null && location.path_length !== undefined) && (
                  <div className="flex items-center gap-2">
                    <span title="Distance">📏</span>
                    <span className="text-muted-foreground font-medium">Distance:</span>
                    <span className="text-foreground">
                      {!isNaN(Number(location.path_length))
                        ? `${(Number(location.path_length) / 1000).toFixed(2)} km`
                        : location.path_length}
                    </span>
                  </div>
                )}
                {(location.elevation_gain !== null && location.elevation_gain !== undefined) && (
                  <div className="flex items-center gap-2">
                    <span title="Elevation Gain">🏔️</span>
                    <span className="text-muted-foreground font-medium">Elevation:</span>
                    <span className="text-foreground">
                      {!isNaN(Number(location.elevation_gain))
                        ? `${Number(location.elevation_gain)} m`
                        : location.elevation_gain} Gain
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {neighborhood && (
          <div className={`flex items-center gap-2 ${padding} bg-purple-50 border border-purple-200 rounded-lg`}>
            <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className={`${textSize} text-purple-900 truncate font-medium`}>{neighborhood.name}</p>
            </div>
          </div>
        )}

        {lot && (
          <div className={`flex items-center gap-2 ${padding} bg-neutral-50 border border-neutral-200 rounded-lg`}>
            <Home className="h-4 w-4 text-neutral-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className={`${textSize} text-neutral-900 truncate font-medium`}>Lot #{lot.lot_number}</p>
            </div>
          </div>
        )}

        {familyUnit && tenantSlug && (
          <Link
            href={`/t/${tenantSlug}/dashboard/families/${familyUnit.id}`}
            className={`flex items-center gap-2 ${padding} bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer`}
          >
            <Avatar className={avatarSize}>
              <AvatarImage
                src={familyUnit.profile_picture_url || undefined}
                alt={familyUnit.name}
                className="object-cover"
              />
              <AvatarFallback className={`bg-amber-200 text-amber-900 ${textSize} font-semibold`}>
                {familyUnit.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`${titleSize} font-semibold text-amber-900 truncate`}>{familyUnit.name}</p>
              <p className={`${textSize} text-amber-700`}>
                {residents.length} member{residents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        )}

        {residents.length > 0 && tenantSlug && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Residents</p>
            {residents.map((resident) => (
              <Link
                key={resident.id}
                href={`/t/${tenantSlug}/dashboard/neighbours/${resident.id}`}
                className={`flex items-center gap-2 ${padding} bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer`}
              >
                <Avatar className={avatarSize}>
                  <AvatarImage
                    src={resident.profile_picture_url || undefined}
                    alt={`${resident.first_name} ${resident.last_name}`}
                    className="object-cover"
                  />
                  <AvatarFallback className={`bg-green-200 text-green-900 ${textSize} font-semibold`}>
                    {resident.first_name?.[0]}
                    {resident.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`${titleSize} font-semibold text-green-900 truncate`}>
                    {resident.first_name} {resident.last_name}
                  </p>
                  <p className={`${textSize} text-green-700`}>View profile</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pets.length > 0 && (
          <div className={`flex items-center gap-2 ${padding} bg-pink-50 border border-pink-200 rounded-lg`}>
            <span className="text-base">🐾</span>
            <div className="min-w-0 flex-1">
              <p className={`${textSize} text-pink-900 font-medium`}>
                {pets.length} pet{pets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {!loading &&
          !location.description &&
          (!location.photos || location.photos.length === 0) &&
          !neighborhood &&
          !lot &&
          residents.length === 0 &&
          pets.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-2">No additional information available</p>
          )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </CardContent>
    </Card >
  )
}
