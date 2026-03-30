"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationCard } from "@/components/notifications/notification-card"
import { ExchangeNotificationCard } from "@/components/notifications/exchange-notification-card"
import { markAllAsRead } from "@/app/actions/notifications"
import { toast } from "sonner"
import useSWR from "swr"
import type { NotificationFull } from "@/types/notifications"
import { Bell, BellOff, CheckCheck, Archive, Inbox } from 'lucide-react'
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

interface NotificationsClientProps {
  tenantSlug: string
  tenantId: string
  userId: string
  initialNotifications: any[]
}

type FilterType = "all" | "unread" | "action_required" | "archived"

export function NotificationsClient({
  tenantSlug,
  tenantId,
  userId,
  initialNotifications,
}: NotificationsClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "exchange" | "events" | "checkins" | "announcements">("all")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  // Fetch notifications with SWR for real-time updates
  const { data: notifications, mutate } = useSWR<NotificationFull[]>(
    `/api/notifications/${tenantId}`,
    async () => {
      console.log("[v0] Fetching notifications from API...")
      const response = await fetch(`/api/notifications/${tenantId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }
      const data = await response.json()
      console.log("[v0] API returned data:", data)
      console.log("[v0] Data is array?", Array.isArray(data))
      console.log("[v0] Data length:", data?.length)
      // API now returns direct array, not wrapped in object
      return Array.isArray(data) ? data : initialNotifications
    },
    {
      fallbackData: initialNotifications,
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true, // Revalidate when tab regains focus
    },
  )

  console.log("[v0] Current notifications state:", notifications)
  console.log("[v0] Notifications length:", notifications?.length)

  // Filter notifications by tab
  const filteredByTab = notifications?.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "exchange") return n.type.startsWith("exchange_")
    if (activeTab === "events") return n.type.startsWith("event_")
    if (activeTab === "checkins") return n.type.startsWith("checkin_")
    if (activeTab === "announcements") return n.type === "announcement"
    return true
  })

  // Filter notifications by filter type
  const filteredNotifications = filteredByTab?.filter((n) => {
    if (activeFilter === "all") return !n.is_archived
    if (activeFilter === "unread") return !n.is_read && !n.is_archived
    if (activeFilter === "action_required") return n.action_required && !n.action_taken && !n.is_archived
    if (activeFilter === "archived") return n.is_archived
    return true
  })

  // Count unread and action required
  const unreadCount = notifications?.filter((n) => !n.is_read && !n.is_archived).length || 0
  const actionRequiredCount =
    notifications?.filter((n) => n.action_required && !n.action_taken && !n.is_archived).length || 0

  // Count by tab
  const exchangeCount = notifications?.filter((n) => n.type.startsWith("exchange_") && !n.is_archived).length || 0
  const eventsCount = notifications?.filter((n) => n.type.startsWith("event_") && !n.is_archived).length || 0
  const checkinsCount = notifications?.filter((n) => n.type.startsWith("checkin_") && !n.is_archived).length || 0

  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')

  // Effect to handle scrolling to highlighted notification
  useEffect(() => {
    if (highlightId && notifications?.length) {
      // Check if the highlighted item is an exchange transaction
      const isExchange = notifications.some(
        n => n.type.startsWith('exchange_') && (n.exchange_transaction_id === highlightId || n.id === highlightId)
      )

      if (isExchange) {
        setActiveTab("exchange")
      }

      // Small delay to ensure rendering
      setTimeout(() => {
        // Try finding by transaction ID or direct ID
        const element = document.querySelector(`[data-transaction-id="${highlightId}"]`) ||
          document.getElementById(`notification-${highlightId}`)

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-lg')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-lg')
          }, 3000)
        }
      }, 500)
    }
  }, [highlightId, notifications])

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead(tenantId, tenantSlug)
    if (result.success) {
      toast.success("All notifications marked as read")
      mutate()
    } else {
      toast.error(result.error || "Failed to mark all as read")
    }
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary">
              {unreadCount} unread
            </Badge>
          )}
          {actionRequiredCount > 0 && (
            <Badge variant="destructive">
              {actionRequiredCount} action required
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* DEBUG INFO - TO BE REMOVED */}
      <div className="p-2 bg-slate-100 text-xs font-mono rounded border border-slate-300">
        <strong>Debug:</strong> Total: {notifications?.length || 0} |
        Exch: {notifications?.filter(n => n.type.startsWith('exchange_')).length} |
        Types: {Array.from(new Set(notifications?.map(n => n.type))).join(', ')}
      </div>

      {/* Tabs for notification types */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications && notifications.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {notifications.filter((n) => !n.is_archived).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="exchange">
            Exchange
            {exchangeCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {exchangeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events" disabled>
            Events
            {eventsCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {eventsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checkins" disabled>
            Check-ins
            {checkinsCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {checkinsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements" disabled>
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
          >
            <Inbox className="h-4 w-4 mr-2" />
            All
          </Button>
          <Button
            variant={activeFilter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("unread")}
          >
            <Bell className="h-4 w-4 mr-2" />
            Unread
          </Button>
          <Button
            variant={activeFilter === "action_required" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("action_required")}
          >
            <BellOff className="h-4 w-4 mr-2" />
            Action Required
          </Button>
          <Button
            variant={activeFilter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("archived")}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </Button>
        </div>

        {/* Notification lists */}
        <TabsContent value="all" className="space-y-3">
          {filteredNotifications && filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const wrapperProps = {
                key: notification.id,
                id: `notification-${notification.id}`,
                "data-transaction-id": notification.type.startsWith('exchange_') ? notification.exchange_transaction_id : undefined,
                className: "transition-all duration-300"
              }

              if (notification.type.startsWith('exchange_')) {
                return (
                  <div {...wrapperProps}>
                    <ExchangeNotificationCard
                      notification={notification}
                      tenantSlug={tenantSlug}
                      userId={userId}
                      onUpdate={mutate}
                    />
                  </div>
                )
              }

              return (
                <div {...wrapperProps}>
                  <NotificationCard
                    notification={notification}
                    tenantSlug={tenantSlug}
                    onUpdate={mutate}
                  />
                </div>
              )
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="exchange" className="space-y-3">
          {filteredNotifications && filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const wrapperProps = {
                key: notification.id,
                id: `notification-${notification.id}`,
                "data-transaction-id": notification.type.startsWith('exchange_') ? notification.exchange_transaction_id : undefined,
                className: "transition-all duration-300"
              }

              if (notification.type.startsWith('exchange_')) {
                return (
                  <div {...wrapperProps}>
                    <ExchangeNotificationCard
                      notification={notification}
                      tenantSlug={tenantSlug}
                      userId={userId}
                      onUpdate={mutate}
                    />
                  </div>
                )
              }

              return (
                <div {...wrapperProps}>
                  <NotificationCard
                    notification={notification}
                    tenantSlug={tenantSlug}
                    onUpdate={mutate}
                  />
                </div>
              )
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No exchange notifications</p>
              <p className="text-sm">Exchange activity will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-3">
          <div className="text-center py-12 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Event notifications coming soon</p>
            <p className="text-sm">Event RSVPs and invites will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="checkins" className="space-y-3">
          <div className="text-center py-12 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Check-in notifications coming soon</p>
            <p className="text-sm">Check-in invites will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-3">
          <div className="text-center py-12 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Announcements coming soon</p>
            <p className="text-sm">Community-wide announcements will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
