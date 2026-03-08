import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, MapPin, AlertCircle, User, MessageSquare } from 'lucide-react'
import Link from "next/link"
import { formatDate } from "date-fns"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { RequestPriorityBadge } from "@/components/requests/request-priority-badge"
import { RequestTypeIcon } from "@/components/requests/request-type-icon"
import { MarkInProgressDialog } from "@/components/requests/mark-in-progress-dialog"
import { MarkResolvedDialog } from "@/components/requests/mark-resolved-dialog"
import { MarkRejectedDialog } from "@/components/requests/mark-rejected-dialog"
import { ReopenRequestDialog } from "@/components/requests/reopen-request-dialog"
import { getRequestById } from "@/app/actions/resident-requests"
import { RequestComments } from "@/components/requests/RequestComments"

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ slug: string; requestId: string }>
}) {
  const { slug, requestId } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  // Verify admin
  const { data: userData } = await supabase
    .from("users")
    .select("role, is_tenant_admin")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!userData || (!['tenant_admin', 'super_admin'].includes(userData.role) && !userData.is_tenant_admin)) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Fetch request details
  const request = await getRequestById(requestId, tenant.id)

  if (!request) {
    notFound()
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getLocationDisplay = () => {
    if (request.custom_location_name) return request.custom_location_name
    if (request.location) return request.location.name
    return "No location specified"
  }

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      maintenance: "Maintenance",
      question: "Question",
      complaint: "Complaint",
      safety: "Safety",
      other: "Other",
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/t/${slug}/admin/requests`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{request.title}</h2>
        </div>
        <div className="flex gap-2">
          {request.status === 'pending' && (
            <MarkInProgressDialog
              requestIds={[request.id]}
              requestTitle={request.title}
              tenantId={tenant.id}
              tenantSlug={slug}
            />
          )}
          {request.status !== 'resolved' && (
            <MarkResolvedDialog
              requestIds={[request.id]}
              requestTitle={request.title}
              tenantId={tenant.id}
              tenantSlug={slug}
            />
          )}
          {request.status !== 'rejected' && (
            <MarkRejectedDialog
              requestIds={[request.id]}
              requestTitle={request.title}
              tenantId={tenant.id}
              tenantSlug={slug}
            />
          )}
          {(request.status === 'resolved' || request.status === 'rejected') && (
            <ReopenRequestDialog
              requestId={request.id}
              requestTitle={request.title}
              tenantId={tenant.id}
              tenantSlug={slug}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {request.photo_url ? (
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border">
                    <Image
                      src={request.photo_url}
                      alt="Request photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <RequestTypeIcon type={request.request_type} className="h-12 w-12" />
                )}
                <div>
                  <CardTitle>{getRequestTypeLabel(request.request_type)} Request</CardTitle>
                  <CardDescription>
                    Created {formatDate(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <RequestStatusBadge status={request.status} />
                <RequestPriorityBadge priority={request.priority} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>
            </div>

            {request.images && request.images.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="grid grid-cols-2 gap-2">
                  {request.images.map((url, index) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`Attachment ${index + 1}`}
                      className="rounded-lg border object-cover aspect-video"
                    />
                  ))}
                </div>
              </div>
            )}



            {request.rejection_reason && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Rejection Reason
                </h3>
                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {request.rejection_reason}
                </p>
              </div>
            )}

            {request.request_type === 'complaint' && ((request.tagged_residents?.length ?? 0) > 0 || (request.tagged_pets?.length ?? 0) > 0) && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Complaint Regarding</h3>

                {request.tagged_residents && request.tagged_residents.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">Residents:</p>
                    <div className="flex flex-wrap gap-3">
                      {request.tagged_residents.map((resident: any) => (
                        <Link
                          key={resident.id}
                          href={`/t/${slug}/admin/residents/${resident.id}`}
                          className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            {resident.profile_picture_url ? (
                              <AvatarImage src={resident.profile_picture_url || "/placeholder.svg"} alt={`${resident.first_name} ${resident.last_name}`} />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {getInitials(resident.first_name, resident.last_name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-sm font-medium">
                            {resident.first_name} {resident.last_name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {request.tagged_pets && request.tagged_pets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pets:</p>
                    <div className="flex flex-wrap gap-3">
                      {request.tagged_pets.map((pet: any) => (
                        <Link
                          key={pet.id}
                          href={`/t/${slug}/admin/pets/${pet.id}`}
                          className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            {pet.profile_picture_url ? (
                              <AvatarImage src={pet.profile_picture_url || "/placeholder.svg"} alt={pet.name} />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {pet.name[0].toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{pet.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {pet.species} {pet.breed && `(${pet.breed})`}
                            </p>
                            {pet.family_unit?.primary_contact && (
                              <Link
                                href={`/t/${slug}/admin/residents/${pet.family_unit.primary_contact.id}`}
                                className="text-xs text-primary hover:underline inline-block mt-0.5"
                              >
                                Owner: {pet.family_unit.primary_contact.first_name} {pet.family_unit.primary_contact.last_name}
                              </Link>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-6">
              <RequestComments
                requestId={requestId}
                tenantId={tenant.id}
                tenantSlug={slug}
                initialComments={request.comments || []}
                currentUserId={user.id}
                isAdmin={true}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(request.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{getLocationDisplay()}</p>
                </div>
              </div>

              {request.resolved_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Resolved</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date(request.resolved_at), "MMM d, yyyy")}
                    </p>
                    {request.resolved_by_user && (
                      <p className="text-xs text-muted-foreground">
                        by {request.resolved_by_user.first_name} {request.resolved_by_user.last_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submitted By</CardTitle>
            </CardHeader>
            <CardContent>
              {request.is_anonymous ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Anonymous Request</p>
                      <p className="text-xs text-muted-foreground">Identity hidden from residents</p>
                    </div>
                  </div>
                  {request.original_submitter && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Actual Submitter (Admin Only):</p>
                      <Link
                        href={`/t/${slug}/admin/residents/${request.original_submitter.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Avatar>
                          {request.original_submitter.profile_picture_url ? (
                            <AvatarImage src={request.original_submitter.profile_picture_url || "/placeholder.svg"} />
                          ) : (
                            <AvatarFallback>
                              {getInitials(request.original_submitter.first_name, request.original_submitter.last_name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {request.original_submitter.first_name} {request.original_submitter.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Click to view profile</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              ) : request.creator ? (
                <Link
                  href={`/t/${slug}/admin/residents/${request.creator.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar>
                    {request.creator.profile_picture_url ? (
                      <AvatarImage src={request.creator.profile_picture_url || "/placeholder.svg"} />
                    ) : (
                      <AvatarFallback>
                        {getInitials(request.creator.first_name, request.creator.last_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {request.creator.first_name} {request.creator.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Click to view profile</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">Unknown</p>
              )}
            </CardContent>
          </Card>

          {request.admin_internal_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
                <CardDescription>Only visible to admins</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.admin_internal_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
