"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, X, ChevronDown, Wrench, HelpCircle, AlertTriangle, Shield, MoreHorizontal } from 'lucide-react'
import { RequestCard } from "@/components/requests/request-card"
import { RioEmptyState } from "@/components/exchange/rio-empty-state"
import { RequestsFilterCards, type RequestFilterSectionType } from "@/components/requests/requests-filter-cards"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { ResidentRequestWithRelations, RequestType, RequestStatus, RequestPriority } from "@/types/requests"

interface RequestsPageClientProps {
    requests: ResidentRequestWithRelations[]
    tenantSlug: string
}

const requestTypes: { value: RequestType; label: string; icon: any; emoji: string }[] = [
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, emoji: '🔧' },
    { value: 'question', label: 'Question', icon: HelpCircle, emoji: '❓' },
    { value: 'complaint', label: 'Complaint', icon: AlertTriangle, emoji: '📢' },
    { value: 'safety', label: 'Safety Issue', icon: Shield, emoji: '🛡️' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, emoji: '📝' },
]

const statusOptions: { value: RequestStatus; label: string; color: string; dotColor: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dotColor: 'bg-yellow-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200', dotColor: 'bg-blue-500' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200', dotColor: 'bg-green-500' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', dotColor: 'bg-red-500' },
]

const priorityOptions: { value: RequestPriority; label: string; color: string; icon: string }[] = [
    { value: 'normal', label: 'Normal', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: '🟢' },
    { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🟠' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
]

export function RequestsPageClient({ requests, tenantSlug }: RequestsPageClientProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTypes, setSelectedTypes] = useState<RequestType[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<RequestStatus[]>([])
    const [selectedPriorities, setSelectedPriorities] = useState<RequestPriority[]>([])
    const [activeFilter, setActiveFilter] = useState<RequestFilterSectionType>(null)

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            // Search filter
            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase()
                const titleMatch = request.title.toLowerCase().includes(searchLower)
                const descMatch = request.description.toLowerCase().includes(searchLower)
                if (!titleMatch && !descMatch) return false
            }

            // Type filter
            if (selectedTypes.length > 0) {
                if (!selectedTypes.includes(request.request_type)) return false
            }

            // Status filter
            if (selectedStatuses.length > 0) {
                if (!selectedStatuses.includes(request.status)) return false
            }

            // Priority filter
            if (selectedPriorities.length > 0) {
                if (!selectedPriorities.includes(request.priority)) return false
            }

            return true
        })
    }, [requests, searchQuery, selectedTypes, selectedStatuses, selectedPriorities])

    const handleTypeToggle = (type: RequestType) => {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        )
    }

    const handleStatusToggle = (status: RequestStatus) => {
        setSelectedStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        )
    }

    const handlePriorityToggle = (priority: RequestPriority) => {
        setSelectedPriorities((prev) =>
            prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
        )
    }

    const clearFilters = () => {
        setSearchQuery("")
        setSelectedTypes([])
        setSelectedStatuses([])
        setSelectedPriorities([])
        setActiveFilter(null)
    }

    const hasActiveFilters =
        searchQuery ||
        selectedTypes.length > 0 ||
        selectedStatuses.length > 0 ||
        selectedPriorities.length > 0



    return (
        <div className="space-y-8 mt-8">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Filter Cards */}
                <RequestsFilterCards
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />

                {/* Active Filter Chips */}
                {
                    hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {selectedTypes.map((type) => (
                                <Badge
                                    key={type}
                                    variant="secondary"
                                    className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleTypeToggle(type)}
                                >
                                    <span className="mr-1">{requestTypes.find(t => t.value === type)?.emoji}</span>
                                    {requestTypes.find(t => t.value === type)?.label}
                                    <span className="ml-1">×</span>
                                </Badge>
                            ))}
                            {selectedStatuses.map((status) => {
                                const option = statusOptions.find(s => s.value === status)
                                return (
                                    <Badge
                                        key={status}
                                        variant="secondary"
                                        className={cn("gap-1 cursor-pointer hover:opacity-80", option?.color)}
                                        onClick={() => handleStatusToggle(status)}
                                    >
                                        {option?.label}
                                        <span className="ml-1">×</span>
                                    </Badge>
                                )
                            })}
                            {selectedPriorities.map((priority) => {
                                const option = priorityOptions.find(p => p.value === priority)
                                return (
                                    <Badge
                                        key={priority}
                                        variant="secondary"
                                        className={cn("gap-1 cursor-pointer hover:opacity-80", option?.color)}
                                        onClick={() => handlePriorityToggle(priority)}
                                    >
                                        <span className="mr-1">{option?.icon}</span>
                                        {option?.label}
                                        <span className="ml-1">×</span>
                                    </Badge>
                                )
                            })}
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                                Clear all
                            </Button>
                        </div>
                    )
                }

                {/* Collapsible Filter Panel */}
                <AnimatePresence mode="wait">
                    {activeFilter && (
                        <motion.div
                            key={activeFilter}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-2 border-muted/50">
                                <CardContent className="p-4">
                                    {activeFilter === "types" && (
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm">Select Type</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {requestTypes.map((type) => (
                                                    <div key={type.value} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`type-${type.value}`}
                                                            checked={selectedTypes.includes(type.value)}
                                                            onCheckedChange={() => handleTypeToggle(type.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`type-${type.value}`}
                                                            className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                                                        >
                                                            <span className="text-base">{type.emoji}</span>
                                                            {type.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeFilter === "status" && (
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm">Select Status</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {statusOptions.map((status) => (
                                                    <div key={status.value} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`status-${status.value}`}
                                                            checked={selectedStatuses.includes(status.value)}
                                                            onCheckedChange={() => handleStatusToggle(status.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`status-${status.value}`}
                                                            className="cursor-pointer text-sm font-normal flex-1 flex items-center gap-2"
                                                        >
                                                            <div
                                                                className={cn("w-2 h-2 rounded-full shrink-0", status.dotColor)}
                                                                style={{ backgroundColor: status.dotColor.includes('yellow') ? '#eab308' : status.dotColor.includes('blue') ? '#3b82f6' : undefined }}
                                                            />
                                                            {status.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeFilter === "priority" && (
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-sm">Select Priority</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {priorityOptions.map((priority) => (
                                                    <div key={priority.value} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`priority-${priority.value}`}
                                                            checked={selectedPriorities.includes(priority.value)}
                                                            onCheckedChange={() => handlePriorityToggle(priority.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`priority-${priority.value}`}
                                                            className="cursor-pointer text-sm font-normal flex-1 flex items-center gap-2"
                                                        >
                                                            <span>{priority.icon}</span>
                                                            {priority.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            <div className="text-sm text-muted-foreground">
                Showing {filteredRequests.length} of {requests.length} requests
            </div>

            {/* Results Grid */}
            {
                filteredRequests.length === 0 ? (
                    <RioEmptyState
                        variant={hasActiveFilters ? "no-matches" : "no-requests"}
                        title={hasActiveFilters ? "No requests match your filters" : "No requests yet"}
                        description={
                            hasActiveFilters
                                ? "Try adjusting your search or filters to see more results."
                                : "Be the first to submit a request to the community!"
                        }
                        action={
                            hasActiveFilters ? (
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear all filters
                                </Button>
                            ) : undefined
                        }
                        className="py-0 [&>div:first-child]:w-40 [&>div:first-child]:h-40 [&>div:first-child]:mb-2 [&>div:last-child]:mt-4"
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredRequests.map((request) => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                onClick={() => router.push(`/t/${tenantSlug}/dashboard/requests/${request.id}`)}
                            />
                        ))}
                    </div>
                )
            }
        </div >
    )
}
