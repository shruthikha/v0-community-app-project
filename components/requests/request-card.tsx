"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RequestStatusBadge } from "./request-status-badge"
import { RequestPriorityBadge } from "./request-priority-badge"
import { RequestTypeIcon } from "./request-type-icon"
import { formatDistanceToNow } from "date-fns"
import { MapPin, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ResidentRequestWithRelations } from "@/types/requests"

interface RequestCardProps {
    request: ResidentRequestWithRelations
    onClick?: () => void
}

const requestTypeLabels: Record<string, string> = {
    maintenance: "Maintenance",
    question: "Question",
    complaint: "Complaint",
    safety: "Safety Issue",
    account_access: "Account Access",
    other: "Other",
}

export function RequestCard({ request, onClick }: RequestCardProps) {
    const creatorName = request.is_anonymous
        ? "Anonymous"
        : `${request.creator?.first_name || ''} ${request.creator?.last_name || ''}`.trim() || "Unknown"

    const creatorInitials = request.is_anonymous
        ? "?"
        : `${request.creator?.first_name?.[0] || ''}${request.creator?.last_name?.[0] || ''}`.toUpperCase()

    const typeEmoji = {
        maintenance: '🔧',
        question: '❓',
        complaint: '📢',
        safety: '🛡️',
        account_access: '🔑',
        other: '📝',
    }[request.request_type] || '📝'

    return (
        <Card
            className={cn(
                "group h-full flex flex-col transition-all duration-200 hover:shadow-md cursor-pointer border-border/60",
                "hover:border-primary/50"
            )}
            onClick={onClick}
        >
            <CardHeader className="p-4 pb-2 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {request.title}
                    </h3>
                    <div className="text-2xl leading-none">
                        {typeEmoji}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{requestTypeLabels[request.request_type]}</span>
                    <span>•</span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 py-2 flex-1 space-y-4">
                <div className="flex items-center gap-2">
                    <RequestStatusBadge status={request.status} />
                    {(request.location || request.custom_location_name) && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground max-w-[180px]">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                                {request.location?.name || request.custom_location_name}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-2 flex items-center justify-between mt-auto border-t bg-muted/5">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={request.creator?.profile_picture_url || undefined} alt={creatorName} />
                        <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                            {creatorInitials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                        {creatorName}
                    </span>
                </div>
                <RequestPriorityBadge priority={request.priority} />
            </CardFooter>
        </Card>
    )
}
