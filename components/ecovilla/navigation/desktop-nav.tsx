"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    Megaphone,
    Users,
    Map,
    Calendar,
    ShoppingBag,
    ClipboardList,
    User,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Bell,
    FileText,
} from "lucide-react"
import { AnimatedThemeToggler } from "@/components/library/animated-theme-toggler"
import { LanguageToggle } from "@/components/language-toggle"
import { useTranslation } from "@/lib/i18n"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/library/avatar"
import { Button } from "@/components/library/button"
import { Separator } from "@/components/library/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/library/tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/library/popover"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { NavigationAnalytics } from "@/lib/analytics"

interface DesktopNavProps {
    tenantSlug: string
    tenantName: string
    tenantLogoUrl?: string
    user: {
        name: string
        avatarUrl?: string | null
        unreadAnnouncements?: number
        unreadNotifications?: number
    }
    isCollapsed: boolean
    onToggleCollapse: () => void
}

export function DesktopNav({
    tenantSlug,
    tenantName,
    tenantLogoUrl,
    user,
    isCollapsed,
    onToggleCollapse,
}: DesktopNavProps) {
    const [mounted, setMounted] = React.useState(false)
    const pathname = usePathname()
    const supabase = createClient()
    const { t } = useTranslation()

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="hidden md:flex flex-col fixed left-2 top-2 bottom-2 bg-background border border-earth-pebble/50 rounded-2xl w-16 invisible" />
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = `/t/${tenantSlug}/login`
    }

    type NavItem = {
        icon: any
        label: string
        href: string
        badge?: number
    }

    const navSections: { title: string; items: NavItem[] }[] = [
        {
            title: t("nav.personal"),
            items: [
                {
                    icon: Home,
                    label: t("nav.dashboard"),
                    href: `/t/${tenantSlug}/dashboard`,
                },
                {
                    icon: FileText,
                    label: t("nav.official"),
                    href: `/t/${tenantSlug}/dashboard/official`,
                    badge: user.unreadAnnouncements,
                },
            ],
        },
        {
            title: t("nav.community"),
            items: [
                {
                    icon: Users,
                    label: t("nav.neighbours"),
                    href: `/t/${tenantSlug}/dashboard/neighbours`,
                },
                {
                    icon: Map,
                    label: t("nav.map"),
                    href: `/t/${tenantSlug}/dashboard/community-map`,
                },
                {
                    icon: Calendar,
                    label: t("nav.events"),
                    href: `/t/${tenantSlug}/dashboard/events`,
                },
                {
                    icon: ShoppingBag,
                    label: t("nav.exchange"),
                    href: `/t/${tenantSlug}/dashboard/exchange`,
                },
                {
                    icon: ClipboardList,
                    label: t("nav.requests"),
                    href: `/t/${tenantSlug}/dashboard/requests`,
                },
            ],
        },
    ]

    return (
        <TooltipProvider>
            <aside
                className={cn(
                    "hidden md:flex flex-col fixed left-2 top-2 bottom-2 bg-background border border-earth-pebble/50 rounded-2xl shadow-sm transition-all duration-300 z-30 overflow-hidden",
                    isCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* Profile Section (Top) */}
                <div className={cn("px-2 pt-4 pb-2 border-b border-earth-pebble/50 flex items-center gap-1", isCollapsed ? "justify-center flex-col" : "justify-between")}>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "p-0 hover:bg-earth-cloud/50 h-auto py-2 flex-1",
                                    isCollapsed ? "justify-center w-full" : "justify-start px-2"
                                )}
                            >
                                <div className={cn("flex items-center gap-3 w-full", isCollapsed && "justify-center")}>
                                    <Avatar className="w-10 h-10 border border-earth-pebble shadow-sm">
                                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                                        <AvatarFallback className="bg-forest-mist text-forest-canopy font-semibold text-xs">
                                            {user.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    {!isCollapsed && (
                                        <div className="flex-1 overflow-hidden text-left">
                                            <p className="text-sm font-bold text-forest-canopy truncate">
                                                {user.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start" side="right">
                            <div className="space-y-1">
                                <Link href={`/t/${tenantSlug}/dashboard/settings/profile`}>
                                    <Button variant="ghost" size="sm" className="w-full justify-start text-forest-canopy">
                                        <User className="mr-2 h-4 w-4" />
                                        {t("nav.profile")}
                                    </Button>
                                </Link>
                                <div className="px-2 py-1.5">
                                    <AnimatedThemeToggler className="w-full justify-start text-forest-canopy hover:bg-forest-mist/50 h-9 px-2 inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                                        {t("common.theme")}
                                    </AnimatedThemeToggler>
                                </div>
                                <div className="px-2 py-1.5">
                                    <LanguageToggle className="w-full justify-start text-forest-canopy hover:bg-forest-mist/50 h-9 px-2 inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
                                </div>
                                <Separator className="my-1" />
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-clay-red hover:text-clay-red hover:bg-clay-mist">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {t("nav.logout")}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Notification Bell */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href={`/t/${tenantSlug}/dashboard/notifications`}>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-mist-gray hover:text-forest-canopy hover:bg-earth-cloud/50">
                                    <div className="relative">
                                        <Bell className="h-5 w-5" />
                                        {(user.unreadNotifications ?? 0) > 0 && (
                                            <span className="absolute top-0 right-0 w-2 h-2 bg-secondary rounded-full ring-1 ring-background" />
                                        )}
                                    </div>
                                </Button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">Notifications</TooltipContent>
                    </Tooltip>
                </div>

                {/* Navigation */}
                <div className={cn("flex-1 overflow-y-auto py-4 scrollbar-hide flex flex-col", isCollapsed ? "space-y-2" : "space-y-6")}>
                    {navSections.map((section) => (
                        <div key={section.title} className="px-2">
                            {!isCollapsed && (
                                <h3 className="mb-2 px-4 text-[10px] font-bold text-mist-gray/80 uppercase tracking-widest">
                                    {section.title}
                                </h3>
                            )}
                            <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href

                                    return isCollapsed ? (
                                        <Tooltip key={item.href} delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => NavigationAnalytics.sidebarClicked(item.label)}
                                                    className={cn(
                                                        "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                                                        isActive
                                                            ? "bg-forest-mist text-forest-canopy"
                                                            : "text-mist-gray hover:bg-earth-cloud hover:text-earth-soil"
                                                    )}
                                                >
                                                    <item.icon className="w-5 h-5" />
                                                    {item.badge && item.badge > 0 && (
                                                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-background" />
                                                    )}
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="font-medium bg-forest-deep text-white border-none">
                                                {item.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => NavigationAnalytics.sidebarClicked(item.label)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                                                isActive
                                                    ? "text-forest-canopy font-semibold bg-forest-mist/50"
                                                    : "text-mist-gray hover:bg-earth-cloud hover:text-earth-soil"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                                            <span className="flex-1 text-sm">
                                                {item.label}
                                            </span>
                                            {item.badge && item.badge > 0 && (
                                                <span className="bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="p-2 border-t border-earth-pebble/50 bg-background/50 backdrop-blur-sm">
                    <div className={cn("flex flex-col gap-1", isCollapsed && "items-center")}>
                        {/* Collapse Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleCollapse}
                            className={cn(
                                "text-mist-gray hover:text-forest-canopy hover:bg-forest-mist h-8",
                                isCollapsed ? "w-full justify-center px-0" : "w-full justify-between px-2"
                            )}
                        >
                            {!isCollapsed && <span className="text-xs font-medium">Collapse</span>}
                            {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                            ) : (
                                <ChevronLeft className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </aside>
        </TooltipProvider>
    )
}
