import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, ArrowLeft, Home, MapIcon, Calendar, Star, PawPrint } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import { LocationEventsSection } from "./location-events-section"
import { LocationCheckinsSection } from "./location-checkins-section"
import { LocationExchangeSection } from "./location-exchange-section"
import { FacilityDetailsSection } from "./facility-details-section"
import { PhotoGallerySection } from "./photo-gallery-section"
import { ReserveLocationButton } from "@/components/reservations/ReserveLocationButton"
import { UpcomingReservationsSection } from "@/components/reservations/UpcomingReservationsSection" // Added import
import { getEventsByLocation } from "@/app/actions/events"
import { getCheckInsByLocation } from "@/app/actions/check-ins"
import { getExchangeListingsByLocation, getExchangeCategories } from "@/app/actions/exchange-listings"

export default async function LocationDetailsPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: currentUser } = await supabase.from("users").select("id, tenant_id, role").eq("id", user.id).single()

  if (!currentUser) {
    redirect(`/t/${slug}/login`)
  }

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", currentUser.tenant_id)
    .single()

  if (locationError || !location) {
    console.log("[v0] LocationDetailsPage - Location not found:", locationError)
    notFound()
  }

  let neighborhood = null
  if (location.neighborhood_id) {
    const { data: neighborhoodData } = await supabase
      .from("neighborhoods")
      .select("id, name")
      .eq("id", location.neighborhood_id)
      .single()
    neighborhood = neighborhoodData
  }

  let lot = null
  let lotPhotos: string[] = []
  let lotHeroPhoto: string | null = null
  let residents: any[] = []
  if (location.lot_id) {
    const { data: lotData } = await supabase
      .from("lots")
      .select("id, lot_number, photos, hero_photo")
      .eq("id", location.lot_id)
      .single()
    lot = lotData
    lotPhotos = lotData?.photos || []
    lotHeroPhoto = lotData?.hero_photo || null

    const { data: residentsData } = await supabase
      .from("users")
      .select(
        `
        id,
        first_name,
        last_name,
        profile_picture_url,
        family_unit_id
      `,
      )
      .eq("lot_id", location.lot_id)
      .eq("tenant_id", currentUser.tenant_id)

    residents = residentsData || []
  }

  let familyUnit = null
  if (residents.length > 0 && residents[0].family_unit_id) {
    const { data: familyUnitData } = await supabase
      .from("family_units")
      .select("id, name, profile_picture_url")
      .eq("id", residents[0].family_unit_id)
      .single()
    familyUnit = familyUnitData
  }

  let pets: any[] = []
  if (familyUnit) {
    const { data: petsData } = await supabase
      .from("pets")
      .select("id, name, species, breed, profile_picture_url")
      .eq("family_unit_id", familyUnit.id)

    if (petsData) {
      pets = petsData
    }
  }

  const isAdmin = currentUser.role === "tenant_admin" || currentUser.role === "super_admin"

  const { data: tenant } = await supabase
    .from("tenants")
    .select("events_enabled, checkins_enabled, exchange_enabled, reservations_enabled")
    .eq("id", currentUser.tenant_id)
    .single()

  const eventsEnabled = tenant?.events_enabled === true
  const checkinsEnabled = tenant?.checkins_enabled === true
  const exchangeEnabled = tenant?.exchange_enabled === true
  const reservationsEnabled = tenant?.reservations_enabled === true

  let locationEvents: any[] = []
  if (eventsEnabled) {
    locationEvents = await getEventsByLocation(location.id, currentUser.tenant_id, user.id)
  }

  let locationCheckIns: any[] = []
  if (checkinsEnabled) {
    locationCheckIns = await getCheckInsByLocation(location.id, currentUser.tenant_id)
  }

  const { data: currentResident } = await supabase
    .from("users")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .single()

  const canCreateEvents = eventsEnabled && currentResident?.onboarding_completed === true
  const canCreateCheckIns = checkinsEnabled && currentResident?.onboarding_completed === true
  const canCreateListings = exchangeEnabled && currentResident?.onboarding_completed === true

  let locationListings: any[] = []
  let categories: any[] = []
  let neighborhoods: any[] = []
  let locations: any[] = []

  if (exchangeEnabled) {
    locationListings = await getExchangeListingsByLocation(location.id, currentUser.tenant_id)
    categories = await getExchangeCategories(currentUser.tenant_id)

    const { data: neighborhoodsData } = await supabase
      .from("neighborhoods")
      .select("id, name")
      .eq("tenant_id", currentUser.tenant_id)
      .order("name")

    neighborhoods = neighborhoodsData || []

    const { data: locationsData } = await supabase
      .from("locations")
      .select("id, name, type")
      .eq("tenant_id", currentUser.tenant_id)
      .order("name")

    locations = locationsData || []
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      facility: "Facility",
      lot: "Lot",
      walking_path: "Walking Path",
      neighborhood: "Neighborhood",
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      facility: "bg-orange-100 text-orange-800 border-orange-200",
      lot: "bg-blue-100 text-blue-800 border-blue-200",
      walking_path: "bg-sky-100 text-sky-800 border-sky-200",
      neighborhood: "bg-purple-100 text-purple-800 border-purple-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      Open: { label: "Open", color: "bg-green-100 text-green-800 border-green-200" },
      Closed: { label: "Closed", color: "bg-red-100 text-red-800 border-red-200" },
      Maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      "Coming Soon": { label: "Coming Soon", color: "bg-blue-100 text-blue-800 border-blue-200" },
      "Temporarily Unavailable": {
        label: "Temporarily Unavailable",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
    }
    return config[status] || config.Open
  }

  const getDifficultyBadge = (difficulty: string) => {
    const config: Record<string, { label: string; color: string }> = {
      Easy: { label: "Easy", color: "bg-green-100 text-green-800 border-green-200" },
      Moderate: { label: "Moderate", color: "bg-blue-100 text-blue-800 border-blue-200" },
      Difficult: { label: "Difficult", color: "bg-orange-100 text-orange-800 border-orange-200" },
      Expert: { label: "Expert", color: "bg-red-100 text-red-800 border-red-200" },
    }
    return config[difficulty] || config.Easy
  }

  const statusConfig = location.status && location.type !== "lot" ? getStatusBadge(location.status) : null
  const difficultyConfig = location.path_difficulty ? getDifficultyBadge(location.path_difficulty) : null

  const mainPhoto = location.hero_photo || (location.photos && location.photos.length > 0 ? location.photos[0] : null)
  const galleryPhotos = location.photos || []

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="w-full">
          {/* Title Row */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="-ml-2 shrink-0">
              <Link href={`/t/${slug}/dashboard/community-map`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
              {location.icon && <span className="text-2xl md:text-3xl">{location.icon}</span>}
              {location.name}
            </h1>
          </div>

          {/* Badges + Mobile Actions Row */}
          <div className="flex items-center justify-between md:justify-start gap-2 mt-2 md:ml-12">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={getTypeColor(location.type)}>
                {getTypeLabel(location.type)}
              </Badge>
              {location.facility_type && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hidden md:inline-flex">
                  {location.facility_type}
                </Badge>
              )}
              {statusConfig && (
                <Badge variant="outline" className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
              )}
              {checkinsEnabled && locationCheckIns.length > 0 && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <Users className="h-3 w-3 mr-1" />
                  {locationCheckIns.length} checked in now
                </Badge>
              )}
            </div>

            {/* Mobile Map Button */}
            <div className="md:hidden shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/t/${slug}/dashboard/community-map?highlightLocationId=${location.id}`}>
                  <MapIcon className="h-4 w-4 mr-2" />
                  Map
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex gap-2 shrink-0">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href={`/t/${slug}/admin/map/locations/create?editLocationId=${location.id}`}>Edit</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/t/${slug}/dashboard/community-map?highlightLocationId=${location.id}`}>
              <MapIcon className="h-4 w-4 mr-2" />
              View on Map
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Reserve Button (below title block) */}
      {location.type === "facility" && location.is_reservable && reservationsEnabled && (
        <div className="md:hidden mt-4">
          <ReserveLocationButton
            locationId={location.id}
            locationName={location.name}
            tenantSlug={slug}
            className="w-full"
            variant="secondary"
          />
        </div>
      )}

      {/* Hero Image - Display hero photo */}
      {mainPhoto && (
        <div className="relative w-full rounded-xl overflow-hidden border bg-muted h-[200px] md:h-[300px]">
          <Image
            src={mainPhoto || "/placeholder.svg"}
            alt={location.name}
            fill
            className="object-cover"
            priority
          />
          {location.hero_photo && (
            <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured Photo
            </Badge>
          )}

          {/* Desktop Reserve Button (prominent on banner) */}
          {location.type === "facility" && location.is_reservable && reservationsEnabled && (
            <div className="hidden md:block absolute top-4 right-4 z-10">
              <ReserveLocationButton
                locationId={location.id}
                locationName={location.name}
                tenantSlug={slug}
                size="default"
                className="bg-white/90 text-primary hover:bg-white shadow-md border-0 text-sm font-semibold"
              />
            </div>
          )}
        </div>
      )}

      {location.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{location.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Facility Details */}
      {
        location.type === "facility" &&
        (location.capacity ||
          location.max_occupancy ||
          location.hours ||
          location.amenities?.length ||
          location.parking_spaces !== null ||
          location.accessibility_features ||
          location.rules) && <FacilityDetailsSection location={location} />
      }

      {/* Upcoming Reservations */}
      {location.type === "facility" && location.is_reservable && reservationsEnabled && (
        <UpcomingReservationsSection locationId={location.id} />
      )}

      {/* Walking Path Details */}
      {
        location.type === "walking_path" &&
        (location.path_difficulty || location.path_surface || location.path_length || location.elevation_gain) && (
          <Card>
            <CardHeader>
              <CardTitle>Trail Details</CardTitle>
              <CardDescription>Information about this walking path</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {difficultyConfig && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Difficulty Level</h4>
                  <Badge variant="outline" className={difficultyConfig.color}>
                    {difficultyConfig.label}
                  </Badge>
                </div>
              )}

              {location.path_surface && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Surface Type</h4>
                  <div className="text-sm text-muted-foreground capitalize">{location.path_surface}</div>
                </div>
              )}

              {location.path_length && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Path Length</h4>
                  <div className="text-sm text-muted-foreground">{location.path_length}</div>
                </div>
              )}

              {location.elevation_gain && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Elevation Gain</h4>
                  <div className="text-sm text-muted-foreground">{location.elevation_gain}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Row 2, Col 1: Neighborhood + Gallery (stacked) */}
        <div className="flex flex-col h-full space-y-6">
          {/* Neighborhood Section */}
          {(neighborhood || lot) && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Neighborhood
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {neighborhood && (
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-2 rounded-full bg-green-500/10 text-green-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">{neighborhood.name}</h4>
                    </div>
                  </div>
                )}

                {lot && (
                  <div className="flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-sm text-blue-600 dark:text-blue-400">Lot #{lot.lot_number}</h4>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lot Home Photos (Gallery below neighborhood) */}
          {lotPhotos.length > 1 && lot && (
            <PhotoGallerySection
              photos={lotPhotos}
              heroPhoto={lotHeroPhoto}
              locationName={`Lot #${lot.lot_number}`}
              className="h-full"
            />
          )}
          {/* Location Photo Gallery (shown if no lot photos) */}
          {lotPhotos.length <= 1 && galleryPhotos.length > 1 && (
            <PhotoGallerySection
              photos={galleryPhotos}
              heroPhoto={location.hero_photo}
              locationName={location.name}
              className="h-full"
            />
          )}
        </div>

        {/* Row 2, Col 2: Residents and Pets */}
        <div className="flex flex-col h-full space-y-6">
          {/* Residents */}
          {residents.length > 0 && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-5 w-5" />
                  Residents ({residents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {familyUnit && (
                    <Link
                      href={`/t/${slug}/dashboard/families/${familyUnit.id}`}
                      className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={familyUnit.profile_picture_url || undefined} alt={familyUnit.name} />
                        <AvatarFallback className="bg-amber-200 text-amber-900 font-semibold">
                          {familyUnit.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-amber-900">{familyUnit.name}</p>
                        <p className="text-sm text-amber-700">
                          {residents.length} member{residents.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-amber-600 mt-1">View family profile →</p>
                      </div>
                    </Link>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {residents.map((resident: any) => (
                      <Link
                        key={resident.id}
                        href={`/t/${slug}/dashboard/neighbours/${resident.id}`}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={resident.profile_picture_url || undefined} alt={resident.first_name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {resident.first_name?.[0]}
                            {resident.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {resident.first_name} {resident.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">View profile →</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pets */}
          {pets.length > 0 && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <PawPrint className="h-5 w-5" />
                  Family Pets ({pets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pets.map((pet: any) => {
                    const petInitials = pet.name
                      .split(" ")
                      .map((word: string) => word[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <div key={pet.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={pet.profile_picture_url || "/placeholder.svg"} alt={pet.name} />
                          <AvatarFallback className="bg-pink-100 text-pink-700">{petInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{pet.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {pet.species}
                            {pet.breed && ` • ${pet.breed}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Row 3: Exchange Listings (full width) */}
        <div className="md:col-span-2">
          {exchangeEnabled && locationListings.length > 0 && (
            <div id="exchange">
              <LocationExchangeSection
                listings={locationListings}
                slug={slug}
                userId={user.id}
                tenantId={currentUser.tenant_id}
                locationName={location.name}
                locationId={location.id}
                canCreateListings={canCreateListings}
                categories={categories}
                neighborhoods={neighborhoods}
                locations={locations}
              />
            </div>
          )}
        </div>
      </div>

      {/* Events Section */}
      {
        eventsEnabled && locationEvents.length > 0 && (
          <div id="events">
            <LocationEventsSection
              events={locationEvents}
              slug={slug}
              userId={user.id}
              tenantId={currentUser.tenant_id}
              locationName={location.name}
              locationId={location.id}
              canCreateEvents={canCreateEvents}
            />
          </div>
        )
      }

      {/* Check-ins Section */}
      {
        checkinsEnabled && locationCheckIns.length > 0 && (
          <div id="checkins">
            <LocationCheckinsSection
              checkIns={locationCheckIns}
              slug={slug}
              locationId={location.id}
              locationName={location.name}
              tenantId={currentUser.tenant_id}
              canCreateCheckIns={canCreateCheckIns}
            />
          </div>
        )
      }

      </div>
  )
}
