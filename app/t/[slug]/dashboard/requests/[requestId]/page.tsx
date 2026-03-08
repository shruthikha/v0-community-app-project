import { notFound, redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { getLocations } from "@/lib/data/locations"
import { ArrowLeft, MapPin, Calendar, User, MessageSquare, Shield, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { RequestPriorityBadge } from "@/components/requests/request-priority-badge"
import { RequestTypeIcon } from "@/components/requests/request-type-icon"
import { format } from "date-fns"
import Image from "next/image"
import { RequestLocationMap } from "@/components/requests/request-location-map"
import { TrackRequestView } from "@/components/analytics/track-views"
import { getRequestById } from "@/app/actions/resident-requests"
import { RequestComments } from "@/components/requests/RequestComments"

interface RequestDetailPageProps {
  params: Promise<{ slug: string; requestId: string }>
}

const requestTypeLabels: Record<string, string> = {
  maintenance: "Maintenance Request",
  question: "Question",
  complaint: "Complaint",
  safety: "Safety Issue",
  other: "Other Request",
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { slug, requestId } = await params

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    redirect("/")
  }

  const request = await getRequestById(requestId, tenant.id)

  if (!request) {
    notFound()
  }

  // Authorization Guard: Only original submitters, public requests, or admins can view
  const isOriginalSubmitter = request.original_submitter_id === user.id
  const isPublic = request.is_public === true

  if (!isOriginalSubmitter && !isPublic) {
    const { data: userData } = await supabase
      .from("users")
      .select("role, is_tenant_admin")
      .eq("id", user.id)
      .eq("tenant_id", tenant.id)
      .single()

    const isAdmin = userData && (['tenant_admin', 'super_admin'].includes(userData.role) || userData.is_tenant_admin)

    if (!isAdmin) {
      notFound()
    }
  }

  // Fetch all locations for the map context
  const allLocations = await getLocations(tenant.id, {
    enrichWithNeighborhood: false,
    enrichWithLot: false,
    enrichWithResidents: false,
    enrichWithFamilies: false,
    enrichWithPets: false,
  })

  // Calculate map center and custom marker
  let mapCenter = null
  let customMarker = null

  if (request.location) {
    if (request.location.coordinates) {
      mapCenter = request.location.coordinates
    } else if (request.location.boundary_coordinates && request.location.boundary_coordinates.length > 0) {
      const lats = request.location.boundary_coordinates.map((c: any) => c[0])
      const lngs = request.location.boundary_coordinates.map((c: any) => c[1])
      const centerLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length
      const centerLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
      mapCenter = { lat: centerLat, lng: centerLng }
    } else if (request.location.path_coordinates && request.location.path_coordinates.length > 0) {
      mapCenter = { lat: request.location.path_coordinates[0][0], lng: request.location.path_coordinates[0][1] }
    }
  } else if (request.custom_location_name && (request as any).custom_location_coordinates) {
    const coords = (request as any).custom_location_coordinates
    if (coords?.lat && coords?.lng) {
      mapCenter = { lat: coords.lat, lng: coords.lng }
      customMarker = { lat: coords.lat, lng: coords.lng, label: request.custom_location_name }
    }
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <TrackRequestView requestId={requestId} />
      {/* Header Section */}
      <div className="relative bg-gradient-to-br from-primary/5 via-background to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <Link href={`/t/${slug}/dashboard/requests`}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground pl-0">
                <ArrowLeft className="h-4 w-4" />
                Back to Requests
              </Button>
            </Link>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
                {request.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-muted/50 border text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70">
                  <RequestTypeIcon type={request.request_type} className="h-3.5 w-3.5" />
                  <span>{requestTypeLabels[request.request_type]}</span>
                </div>
                <RequestStatusBadge status={request.status} className="text-xs px-2.5 py-0.5" />
                <RequestPriorityBadge priority={request.priority} className="text-xs px-2.5 py-0.5" />
                {request.is_anonymous && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/50 border text-muted-foreground text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    <span>Anonymous</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground/90">Details</h2>
              <Card className="border-none shadow-sm bg-card/50">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {request.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Photos */}
            {request.images && request.images.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {request.images.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border shadow-sm group">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={`Request photo ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Preview */}
            {(request.location || request.custom_location_name) && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Location</h2>
                <Card className="overflow-hidden border-none shadow-sm">
                  <div className="h-[300px] w-full relative">
                    <RequestLocationMap
                      locations={allLocations}
                      tenantId={tenant.id}
                      tenantSlug={slug}
                      highlightLocationId={request.location?.id}
                      mapCenter={mapCenter}
                      mapZoom={16}
                      minimal={true}
                      checkIns={[]}
                      customMarker={customMarker}
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* Conversation */}
            {(request.original_submitter_id === user.id || request.is_public) && (
              <div className="space-y-4">
                <RequestComments
                  requestId={requestId}
                  tenantId={tenant.id}
                  tenantSlug={slug}
                  initialComments={request.comments || []}
                  currentUserId={user.id}
                  isAdmin={false}
                />
              </div>
            )}

            {/* Resolution/Rejection Status */}
            {request.status === 'resolved' && request.resolved_at && (
              <Card className="border-fresh-growth/30 bg-fresh-growth/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-fresh-growth/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-fresh-growth-dark" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-fresh-growth-dark text-lg">Request Resolved</h3>
                      <p className="text-fresh-growth-dark/80 mt-1">
                        Resolved on {format(new Date(request.resolved_at), "MMMM d, yyyy 'at' h:mm a")}
                        {request.resolved_by_user && (
                          <> by {request.resolved_by_user.first_name} {request.resolved_by_user.last_name}</>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {request.status === 'rejected' && request.rejection_reason && (
              <Card className="border-clay/30 bg-clay/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-clay/20 flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-5 w-5 text-clay" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-clay text-lg">Request Rejected</h3>
                      <p className="text-clay/90 mt-1">
                        <span className="font-medium">Reason:</span> {request.rejection_reason}
                      </p>
                      {request.resolved_at && (
                        <p className="text-sm text-clay/70 mt-2">
                          {format(new Date(request.resolved_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Submitter Info */}
            {request.creator && !request.is_anonymous && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">Submitted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/t/${slug}/residents/${request.creator.id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 -m-2 p-2 rounded-lg transition-colors"
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={request.creator.profile_picture_url || undefined} />
                      <AvatarFallback>
                        {request.creator.first_name[0]}{request.creator.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.creator.first_name} {request.creator.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">View Profile</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-muted-foreground">Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-sm font-medium">
                      {format(new Date(request.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-medium">
                      {format(new Date(request.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>

                {(request.location || request.custom_location_name) && (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium line-clamp-1">
                        {request.location?.name || request.custom_location_name}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  )
}
