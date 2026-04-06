"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import DOMPurify from "dompurify"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ExchangeCategoryBadge } from "./exchange-category-badge"
import { ExchangeStatusBadge } from "./exchange-status-badge"
import { ExchangePriceBadge } from "./exchange-price-badge"
import { MapPin, Calendar, Package, Pencil, Trash2, Pause, Play, Archive, ArchiveRestore, History, Flag } from 'lucide-react'
import { getExchangeListingById, pauseExchangeListing, deleteExchangeListing, getExchangeListingFlagCount, getListingFlagDetails } from "@/app/actions/exchange-listings"
import { archiveListing, unarchiveListing } from "@/app/actions/exchange-history"
import { getUserPendingRequest } from "@/app/actions/exchange-transactions"
import { MapboxFullViewer } from "@/components/map/MapboxViewer"
import { useRouter } from 'next/navigation'
import { FlagListingDialog } from "./flag-listing-dialog"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { EditExchangeListingModal } from "./edit-exchange-listing-modal"
import { ListingHistoryModal } from "./listing-history-modal"
import { RequestBorrowDialog } from "./request-borrow-dialog"
import { ListingFlagDetails } from "./listing-flag-details"
import { RioConfirmationModal } from "@/components/feedback/rio-confirmation-modal"
import { SharedPhotoGallery } from "@/components/shared/SharedPhotoGallery"
import { MarketplaceAnalytics } from "@/lib/analytics"

interface ExchangeListingDetailModalProps {
  listingId: string
  tenantId: string
  tenantSlug: string
  userId: string | null
  userRole?: string | null
  isAdmin?: boolean
  locations: any[]
  categories?: Array<{ id: string; name: string }>
  neighborhoods?: Array<{ id: string; name: string }>
  initialListing?: any
  initialFlagCount?: number
  initialHasUserFlagged?: boolean
  initialPendingRequest?: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

function parseLocationCoordinates(coords: any): { lat: number; lng: number } | any[] | null {
  if (!coords) return null

  // Handle string JSON
  if (typeof coords === 'string') {
    try {
      coords = JSON.parse(coords)
    } catch (e) {
      console.error("[v0] Failed to parse coords string:", e)
      return null
    }
  }

  // Handle object - try multiple formats
  if (typeof coords === 'object') {
    // Format 1: {lat, lng}
    if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      return { lat: coords.lat, lng: coords.lng }
    }

    // Format 2: {latitude, longitude}
    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      return { lat: coords.latitude, lng: coords.longitude }
    }

    // Format 3: {x, y} (PostGIS format)
    if (typeof coords.x === 'number' && typeof coords.y === 'number') {
      return { lat: coords.x, lng: coords.y }
    }

    // Format 4: [lat, lng] single point array
    if (Array.isArray(coords) && coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return { lat: Number(coords[0]), lng: Number(coords[1]) }
    }

    // Format 5: [[lat, lng], [lat, lng], ...] path/boundary array (return as-is for caller to handle)
    if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
      console.log("[v0] Detected path/boundary array format, returning as-is")
      return coords
    }
  }

  console.warn("[v0] Unknown coordinate format:", coords)
  return null
}

export function ExchangeListingDetailModal({
  listingId,
  tenantId,
  tenantSlug,
  userId,
  userRole,
  isAdmin = false,
  locations,
  categories = [],
  neighborhoods = [],
  initialListing,
  initialFlagCount,
  initialHasUserFlagged,
  initialPendingRequest,
  open,
  onOpenChange,
}: ExchangeListingDetailModalProps) {
  const [listing, setListing] = useState<any>(initialListing || null)
  const [isLoading, setIsLoading] = useState(!initialListing)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(initialListing?.hero_photo || initialListing?.photos?.[0] || null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<any>(initialPendingRequest || null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [flagCount, setFlagCount] = useState(initialFlagCount || 0)
  const [hasUserFlagged, setHasUserFlagged] = useState(initialHasUserFlagged || false)
  const [flagDetails, setFlagDetails] = useState<any[]>([])
  const router = useRouter()
  const { showFeedback } = useRioFeedback()

  useEffect(() => {
    if (open && listingId) {
      MarketplaceAnalytics.listingViewed(listingId)
      if (!initialListing) loadListing()
      if (initialFlagCount === undefined) loadFlagStatus()
      if (userId && !initialPendingRequest) {
        loadPendingRequest()
      }
    }
  }, [open, listingId, userId])

  async function loadListing() {
    setIsLoading(true)
    const result = await getExchangeListingById(listingId, tenantId)

    if (result.success && result.data) {
      setListing(result.data)
      setSelectedPhoto(result.data.hero_photo || result.data.photos?.[0] || null)

      console.log("[v0] LOCATION DEBUG:", {
        hasLocationObject: !!result.data.location,
        locationId: result.data.location?.id,
        locationName: result.data.location?.name,
        locationType: result.data.location?.type,
        coordinatesRaw: result.data.location?.coordinates,
        coordinatesType: typeof result.data.location?.coordinates,
        pathCoordinatesRaw: result.data.location?.path_coordinates,
        pathCoordinatesType: typeof result.data.location?.path_coordinates,
        boundaryCoordinatesRaw: result.data.location?.boundary_coordinates,
        boundaryCoordinatesType: typeof result.data.location?.boundary_coordinates,
        customLat: result.data.custom_location_lat,
        customLatType: typeof result.data.custom_location_lat,
        customLng: result.data.custom_location_lng,
        customLngType: typeof result.data.custom_location_lng,
        customLocationName: result.data.custom_location_name,
      })
    } else {
      showFeedback({
        title: "Couldn't load listing",
        description: result.error || "Failed to load listing",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
      onOpenChange(false)
    }

    setIsLoading(false)
  }

  async function loadFlagStatus() {
    if (!userId) return

    const result = await getExchangeListingFlagCount(listingId, userId, tenantId)

    if (result.success) {
      setFlagCount(result.flagCount ?? 0)
      setHasUserFlagged(result.hasUserFlagged ?? false)

      if (isAdmin && result.flagCount && result.flagCount > 0) {
        const flagDetailsResult = await getListingFlagDetails(listingId, tenantId)
        if (flagDetailsResult.success && flagDetailsResult.data) {
          setFlagDetails(flagDetailsResult.data)
        }
      }
    }
  }

  async function loadPendingRequest() {
    if (!userId) return
    const request = await getUserPendingRequest(userId, listingId, tenantId)
    setPendingRequest(request)
  }

  async function handleTogglePause() {
    setIsPausing(true)
    const result = await pauseExchangeListing(listingId, tenantSlug, tenantId)

    if (result.success) {
      if (!result.is_available) {
        MarketplaceAnalytics.listingPaused(listingId)
      }
      showFeedback({
        title: result.is_available ? "Listing Resumed" : "Listing Paused",
        description: result.is_available ? "Your listing is now visible to others." : "Your listing is now hidden from others.",
        variant: "success",
        image: "/rio/rio_clapping.png"
      })
      await loadListing()
    } else {
      showFeedback({
        title: "Update failed",
        description: result.error || "Failed to update listing",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    }
    setIsPausing(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteExchangeListing(listingId, tenantSlug, tenantId)

    if (result.success) {
      onOpenChange(false)
      setShowDeleteDialog(false)
      router.push(`/t/${tenantSlug}/dashboard/exchange`)
    } else {
      showFeedback({
        title: "Couldn't delete listing",
        description: result.error || "Failed to delete listing",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
      setShowDeleteDialog(false)
    }
    setIsDeleting(false)
  }

  async function handleArchive() {
    if (!listing) return

    setIsArchiving(true)
    const result = listing.archived_at
      ? await unarchiveListing(listingId, userId!, tenantId, tenantSlug)
      : await archiveListing(listingId, userId!, tenantId, tenantSlug)

    if (result.success) {
      if (listing.archived_at) {
        showFeedback({
          title: "Listing Restored",
          description: (result as any).warning || "Listing restored successfully",
          variant: "success",
          image: "/rio/rio_clapping.png"
        })
      } else {
        showFeedback({
          title: "Listing Archived",
          description: "Listing archived successfully",
          variant: "success",
          image: "/rio/rio_clapping.png"
        })
      }
      onOpenChange(false)
      router.refresh()
    } else {
      showFeedback({
        title: "Update failed",
        description: result.error || "Failed to update listing",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    }
    setIsArchiving(false)
  }

  function handleEditSuccess() {
    loadListing()
  }

  function handleRequestSuccess() {
    loadListing()
    loadPendingRequest()
  }

  function handleFlagSuccess() {
    loadFlagStatus()
    onOpenChange(false)
  }

  if (isLoading || !listing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl" aria-describedby="listing-detail-loading">
          <VisuallyHidden>
            <DialogTitle>Loading Listing Details</DialogTitle>
          </VisuallyHidden>
          <div id="listing-detail-loading" className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Loading listing...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isCreator = userId === listing.created_by
  const creatorName =
    `${listing.creator?.first_name || ""} ${listing.creator?.last_name || ""} `.trim() || "Unknown User"
  const creatorInitials =
    `${listing.creator?.first_name?.[0] || ""}${listing.creator?.last_name?.[0] || ""}`.toUpperCase() || "?"

  const conditionDisplay = listing.condition
    ? listing.condition.split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : null

  const shouldShowQuantity =
    listing.available_quantity !== null &&
    listing.available_quantity !== undefined &&
    listing.category &&
    (listing.category.name === "Tools & Equipment" || listing.category.name === "Food & Produce")

  let listingLocationForMap = null
  let locationName = null

  if (listing.location_id && listing.location) {
    locationName = listing.location.name
    let coords: { lat: number; lng: number } | null = null

    if (listing.location.coordinates) {
      const parsed = parseLocationCoordinates(listing.location.coordinates)
      if (parsed && !Array.isArray(parsed)) {
        coords = parsed
        console.log("[v0] Using coordinates:", coords)
      }
    }

    if (!coords && listing.location.path_coordinates) {
      const pathData = listing.location.path_coordinates
      console.log("[v0] Raw path_coordinates:", pathData)

      if (Array.isArray(pathData) && pathData.length > 0) {
        const firstPoint = pathData[0]
        if (Array.isArray(firstPoint) && firstPoint.length === 2) {
          coords = { lat: Number(firstPoint[0]), lng: Number(firstPoint[1]) }
          console.log("[v0] Using path_coordinates first point:", coords)
        }
      }
    }

    if (!coords && listing.location.boundary_coordinates) {
      const boundaryData = listing.location.boundary_coordinates
      console.log("[v0] Raw boundary_coordinates:", boundaryData)

      if (Array.isArray(boundaryData) && boundaryData.length > 0) {
        const lats = boundaryData.map((point: any) => (Array.isArray(point) ? Number(point[0]) : 0))
        const lngs = boundaryData.map((point: any) => (Array.isArray(point) ? Number(point[1]) : 0))
        const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
        const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
        coords = { lat: centerLat, lng: centerLng }
        console.log("[v0] Using boundary_coordinates center:", coords)
      }
    }

    if (coords) {
      listingLocationForMap = {
        id: listing.location.id,
        name: listing.location.name,
        type: (listing.location.type || "facility") as any,
        coordinates: coords
      }
      console.log("[v0] Community location resolved:", listingLocationForMap)
    }
  }

  if (!locationName && listing.custom_location_name) {
    locationName = listing.custom_location_name
  }

  if (!listingLocationForMap && listing.custom_location_lat && listing.custom_location_lng) {
    listingLocationForMap = {
      id: "custom-location",
      name: listing.custom_location_name || "Pickup Location",
      type: "facility" as const,
      coordinates: {
        lat: Number(listing.custom_location_lat),
        lng: Number(listing.custom_location_lng)
      }
    }
    console.log("[v0] Custom location resolved:", listingLocationForMap)
  }

  const mapLocations = listingLocationForMap
    ? [...locations, listingLocationForMap]
    : locations

  const hasMapLocation = listingLocationForMap !== null
  const visibleNeighborhoods = listing.neighborhoods?.map((n: any) => n.neighborhood?.name).filter(Boolean) || []
  const showBorrowButton = !isCreator && listing.is_available && listing.status === "published"
  const hasPendingRequest = !!pendingRequest

  function getActionButtonText(categoryName: string) {
    if (categoryName === "Services & Skills") return "Request Service"
    if (categoryName === "House sitting & Rentals") return "Request to Rent"
    if (categoryName === "Rides & Carpooling") return "Request Ride"
    if (categoryName === "Food & Produce") return "Request"
    return "Request to Borrow"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>[data-slot=dialog-close]]:top-8 md:[&>[data-slot=dialog-close]]:top-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 mt-8 md:mt-0">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.category && <ExchangeCategoryBadge categoryName={listing.category.name} />}
                  <ExchangeStatusBadge status={listing.status} isAvailable={listing.is_available ?? true} />
                  {flagCount > 0 && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Flag className="h-3 w-3" />
                      {flagCount}
                    </Badge>
                  )}
                  {listing.archived_at && (
                    <Badge variant="secondary" className="text-xs">
                      Archived
                    </Badge>
                  )}
                  {conditionDisplay && (
                    <Badge variant="secondary" className="text-xs">
                      {conditionDisplay}
                    </Badge>
                  )}
                  {listing.visibility_scope === "neighborhood" && (
                    <Badge variant="outline" className="text-xs">
                      Neighborhood Only
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-3xl font-bold leading-tight">{listing.title}</DialogTitle>
              </div>
            </div>

            {/* Action buttons for creators - moved to top */}
            {isCreator && !listing.archived_at && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePause}
                  disabled={isPausing}
                >
                  {listing.is_available ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}

            {/* Request/Flag buttons for viewers - prominent at top */}
            {!isCreator && !listing.archived_at && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                {showBorrowButton && !hasPendingRequest && (
                  <Button
                    onClick={() => setIsRequestDialogOpen(true)}
                    className="flex-1"
                    size="lg"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {getActionButtonText(listing.category?.name || "")}
                  </Button>
                )}
                {hasPendingRequest && (
                  <Button
                    variant="secondary"
                    className="flex-1 cursor-default opacity-100"
                    size="lg"
                    disabled
                  >
                    Request Pending
                  </Button>
                )}
                <FlagListingDialog
                  listingId={listingId}
                  tenantSlug={tenantSlug}
                  triggerVariant="outline"
                  triggerSize="lg"
                  initialFlagCount={flagCount}
                  initialHasUserFlagged={hasUserFlagged}
                  onFlagSuccess={handleFlagSuccess}
                />
              </div>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {isAdmin && flagDetails.length > 0 && (
              <ListingFlagDetails
                flags={flagDetails}
                listingId={listingId}
                listingTitle={listing.title}
                tenantId={tenantId}
                tenantSlug={tenantSlug}
                onActionComplete={() => onOpenChange(false)}
              />
            )}

            {/* Image Gallery */}
            {listing.photos && listing.photos.length > 0 && (
              <div className="space-y-3">
                <SharedPhotoGallery
                  photos={listing.hero_photo && !listing.photos.includes(listing.hero_photo)
                    ? [listing.hero_photo, ...listing.photos]
                    : listing.photos}
                  altPrefix={listing.title}
                  columns={4}
                />
              </div>
            )}

            {/* Price Card with enhanced styling */}
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <div className="flex items-center gap-2">
                      <ExchangePriceBadge pricingType={listing.pricing_type} price={listing.price} className="text-lg" />
                    </div>
                  </div>
                  {shouldShowQuantity && (
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground">Available Quantity</p>
                      <div className="flex items-center gap-1 text-lg font-semibold justify-end">
                        <Package className="h-5 w-5" />
                        <span>{listing.available_quantity}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {listing.description && (
              <div
                className="text-sm text-gray-700 mt-4 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(listing.description) }}
              />
            )}

            {/* Creator Profile Card */}
            <Card className="border-2 bg-gradient-to-br from-muted/30 to-background">
              <CardContent className="py-3">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-border">
                    <AvatarImage src={listing.creator?.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {creatorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">{isCreator ? "Listed by You" : `Listed by ${creatorName}`}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Posted {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {locationName && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Location</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{locationName}</span>
                </div>
                {hasMapLocation && (
                  <div className="h-[300px] rounded-lg overflow-hidden border">
                    <MapboxFullViewer
                      locations={mapLocations}
                      tenantId={tenantId}
                      tenantSlug={tenantSlug}
                      checkIns={[]}
                      mapCenter={listingLocationForMap!.coordinates}
                      mapZoom={16}
                      highlightLocationId={listingLocationForMap!.id}
                      showControls={false}
                      enableSelection={false}
                      customMarker={listing.location_type === 'custom' && listing.custom_location_coordinates ? {
                        lat: (listing.custom_location_coordinates as any).lat,
                        lng: (listing.custom_location_coordinates as any).lng,
                        label: listing.custom_location_name || "Custom Location"
                      } : null}
                      disableAutoScroll={true}
                    />
                  </div>
                )}
                {!hasMapLocation && (
                  <p className="text-sm text-muted-foreground italic">
                    Map not available for this location
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 text-sm">
              <h3 className="font-semibold text-lg">Additional Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{listing.category?.name || "N/A"}</p>
                </div>
                {conditionDisplay && (
                  <div>
                    <p className="text-muted-foreground">Condition</p>
                    <p className="font-medium">{conditionDisplay}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Date Posted</p>
                  <div className="flex items-center gap-1 font-medium">
                    <Calendar className="h-4 w-4" />
                    {new Date(listing.published_at || listing.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                {listing.visibility_scope === "neighborhood" && visibleNeighborhoods.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">Visible To</p>
                    <p className="font-medium">{visibleNeighborhoods.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isCreator && (
        <EditExchangeListingModal
          listingId={listingId}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          categories={categories}
          neighborhoods={neighborhoods}
          onSuccess={handleEditSuccess}
        />
      )}

      {isCreator && (
        <ListingHistoryModal
          listingId={listingId}
          listingName={listing?.title || "Listing"}
          open={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          userId={userId!}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
        />
      )}

      <RioConfirmationModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete listing?"
        description={
          <span>
            This action cannot be undone. This will permanently delete your listing and remove it from the community exchange.
            {listing?.status === "published" && " Make sure there are no active transactions before deleting."}
          </span>
        }
        image="/rio/rio_delete_warning.png"
        confirmText="Delete Listing"
        onConfirm={handleDelete}
        isDestructive={true}
        isLoading={isDeleting}
      />

      {showBorrowButton && !hasPendingRequest && (
        <RequestBorrowDialog
          open={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          listingId={listingId}
          listingTitle={listing?.title || ""}
          listingCategory={listing?.category?.name || ""}
          pricingType={listing?.pricing_type || "free"}
          price={listing?.price}
          availableQuantity={listing?.available_quantity || 0}
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          onSuccess={handleRequestSuccess}
        />
      )}
    </>
  )
}
