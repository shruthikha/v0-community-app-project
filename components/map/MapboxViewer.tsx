"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Map, { Source, Layer, MapRef, Marker } from "react-map-gl"
import * as turf from "@turf/turf"
import { Search, X, Filter, Layers, Check, MapPin } from "lucide-react"
import "mapbox-gl/dist/mapbox-gl.css"

import { toast } from "sonner"
import { rsvpToCheckIn } from "@/app/actions/check-ins"

import { LocationWithRelations } from "@/lib/data/locations"
import { MapAnalytics } from "@/lib/analytics"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useGeolocation } from "@/hooks/useGeolocation"
import { LocationInfoCard } from "./location-info-card"

interface CheckIn {
    id: string
    resident: {
        id: string
        first_name: string
        last_name: string
        profile_picture_url?: string
    }
    location: {
        id: string
        name: string
        type: string
        coordinates?: { lat: number; lng: number }
    } | null
    coordinates?: { lat: number; lng: number }
    displayCoords?: { lat: number; lng: number }
    created_at: string
    expires_at: string
    // Additional properties used in component
    activity_type?: string
    title?: string
    custom_location_name?: string
    start_time?: string
    duration_minutes?: number
    description?: string
    visibility_scope?: string
    location_type?: string
    custom_location_coordinates?: { lat: number; lng: number }
    user_rsvp_status?: string | null
}

interface MapboxFullViewerProps {
    locations: LocationWithRelations[]
    checkIns?: CheckIn[]
    tenantId: string
    tenantSlug: string
    mapCenter?: { lat: number; lng: number } | null
    mapZoom?: number
    showControls?: boolean // Toggle top bar controls
    isFullPage?: boolean // True for full map page, false for dashboard preview
    externalHighlightedCategories?: Set<string> // Categories highlighted from parent component
    className?: string
    onLocationClick?: (locationId: string, location: LocationWithRelations) => void
    highlightLocationId?: string | null
    customMarker?: { lat: number; lng: number; label?: string } | null
    onMapClick?: (coords: { lat: number; lng: number }) => void
    onPoiClick?: (poi: { name: string; address?: string; lat: number; lng: number }) => void
    onMapMove?: (center: { lat: number; lng: number; zoom: number }) => void
    enableSelection?: boolean
    children?: React.ReactNode
    animationDuration?: number
    disableAutoScroll?: boolean
    hideSidebar?: boolean
}

export function MapboxFullViewer({
    locations,
    checkIns = [],
    tenantId,
    tenantSlug,
    mapCenter,
    mapZoom = 14,
    showControls = true,
    isFullPage = false,
    externalHighlightedCategories,
    className,
    onLocationClick,
    highlightLocationId,
    customMarker,
    onMapClick,
    onPoiClick,
    onMapMove,
    enableSelection = true,
    children,
    animationDuration = 1000,
    disableAutoScroll = false,
    hideSidebar = false,
}: MapboxFullViewerProps) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const router = useRouter()

    // Calculate initial center - prioritize boundary center, then mapCenter prop, then default
    const initialCenter = useMemo(() => {
        const boundary = locations.find((loc) => loc.type === "boundary")
        if (boundary?.boundary_coordinates && boundary.boundary_coordinates.length > 0) {
            const lats = boundary.boundary_coordinates.map(([lat]) => lat)
            const lngs = boundary.boundary_coordinates.map(([, lng]) => lng)
            return {
                latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
                longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                zoom: mapZoom, // Use passed zoom level
            }
        }
        return {
            latitude: mapCenter?.lat || 9.9567,
            longitude: mapCenter?.lng || -84.5333,
            zoom: mapZoom,
        }
    }, [locations, mapCenter, mapZoom])

    const [viewState, setViewState] = useState({
        longitude: initialCenter.longitude,
        latitude: initialCenter.latitude,
        zoom: initialCenter.zoom,
        pitch: 0,
        bearing: 0,
    })

    // Map state
    const [hoveredLot, setHoveredLot] = useState<string | null>(null)
    const [selectedLocation, setSelectedLocation] = useState<LocationWithRelations | CheckIn | null>(null)
    const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/satellite-streets-v12")
    const [currentZoom, setCurrentZoom] = useState(viewState.zoom)
    const mapRef = useRef<MapRef>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const hasUserInteracted = useRef(false) // Track if user manually selected a location
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [pendingFlyTo, setPendingFlyTo] = useState(false) // Wait for location to become available

    // Geolocation Hook
    const userLocation = useGeolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    })

    // Sync check-in RSVP from dashboard/priority feed
    useEffect(() => {
        const handleCheckinSync = (e: Event) => {
            const { checkInId, status, goingCount } = (e as CustomEvent<{ checkInId: string; status: "yes" | "maybe" | "no" | null; goingCount?: number }>).detail
            if (selectedLocation && (selectedLocation as CheckIn).activity_type && selectedLocation.id === checkInId) {
                setSelectedLocation(prev => prev ? {
                    ...prev,
                    user_rsvp_status: status,
                    ...(goingCount !== undefined && { rsvp_going_count: goingCount })
                } as any : null)
            }
        }
        window.addEventListener('rio-checkin-rsvp-sync', handleCheckinSync)
        return () => window.removeEventListener('rio-checkin-rsvp-sync', handleCheckinSync)
    }, [selectedLocation])

    // Handle Geolocation Errors with Sonner
    useEffect(() => {
        if (userLocation.error) {
            let errorMessage = 'Unable to get your location'
            switch (userLocation.error.code) {
                case 1: // PERMISSION_DENIED
                    errorMessage = 'Location permission denied. Please enable location access in your browser.'
                    break
                case 2: // POSITION_UNAVAILABLE
                    errorMessage = 'Location information unavailable.'
                    break
                case 3: // TIMEOUT
                    errorMessage = 'Location request timed out.'
                    break
            }
            toast.error(errorMessage)
            setPendingFlyTo(false) // Cancel pending fly
        }
    }, [userLocation.error])

    // Pending Fly To Effect
    useEffect(() => {
        if (pendingFlyTo && userLocation.latitude && userLocation.longitude) {
            const map = mapRef.current
            if (map) {
                map.flyTo({
                    center: [userLocation.longitude, userLocation.latitude],
                    zoom: 16,
                    duration: 1000
                })
                setPendingFlyTo(false)
            }
        }
    }, [pendingFlyTo, userLocation.latitude, userLocation.longitude])

    // Debug logging & Analytics
    useEffect(() => {
        MapAnalytics.viewed()
    }, [locations, mapCenter, mapboxToken])

    // Helper to check if a point is inside the community boundary
    const checkIfInsideBoundary = useCallback((lat: number, lng: number) => {
        const boundaryLoc = locations.find(l => l.type === 'boundary');
        if (!boundaryLoc?.boundary_coordinates || boundaryLoc.boundary_coordinates.length < 3) return false;

        try {
            const coords = [...boundaryLoc.boundary_coordinates];
            // Ensure closed polygon
            if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
                coords.push(coords[0]);
            }
            // Turf expects [lng, lat]
            const polygonCoords = coords.map(c => [c[1], c[0]]);
            const boundaryPoly = turf.polygon([polygonCoords]);
            const point = turf.point([lng, lat]);
            return turf.booleanPointInPolygon(point, boundaryPoly);
        } catch (e) {
            console.error("Error checking boundary:", e);
            return false;
        }
    }, [locations]);

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<LocationWithRelations[]>([])
    const [showSearchDropdown, setShowSearchDropdown] = useState(false)
    const [highlightedCategories, setHighlightedCategories] = useState<Set<string>>(externalHighlightedCategories || new Set())

    // Debounced search analytics
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                MapAnalytics.searched(searchQuery.length, searchResults.length)
            }
        }, 1500) // Debounce 1.5s

        return () => clearTimeout(timer)
    }, [searchQuery, searchResults.length])

    // Collapsible panel state
    const [showLayersPanel, setShowLayersPanel] = useState(false)
    const [showBaseMapPanel, setShowBaseMapPanel] = useState(false)

    // Auto-focus map on location selection
    const focusOnLocation = useCallback(
        (location: LocationWithRelations | CheckIn, overrideZoom?: number) => {
            if (!mapRef.current) return

            let coords: { lat: number; lng: number } | null = null

            // Check if this is a check-in with displayCoords
            if ((location as CheckIn).displayCoords) {
                coords = (location as CheckIn).displayCoords || null
            }
            // Get coordinates based on location type
            else if (location.coordinates) {
                coords = location.coordinates
            } else if (
                (location as LocationWithRelations).boundary_coordinates &&
                (location as LocationWithRelations).boundary_coordinates!.length > 0
            ) {
                // For boundaries/polygons, use center
                const lats = (location as LocationWithRelations).boundary_coordinates!.map(([lat]: [number, number]) => lat)
                const lngs = (location as LocationWithRelations).boundary_coordinates!.map(([, lng]: [number, number]) => lng)
                coords = {
                    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                }
            } else if (
                (location as LocationWithRelations).path_coordinates &&
                (location as LocationWithRelations).path_coordinates!.length > 0
            ) {
                // For lots/facilities with path_coordinates but no explicit coordinates
                const lats = (location as LocationWithRelations).path_coordinates!.map(([lat]: [number, number]) => lat)
                const lngs = (location as LocationWithRelations).path_coordinates!.map(([, lng]: [number, number]) => lng)
                coords = {
                    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
                    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                }
            }

            if (coords) {
                mapRef.current.flyTo({
                    center: [coords.lng, coords.lat],
                    zoom: overrideZoom || Math.max(currentZoom, 18), // Use override or default zoom in
                    duration: animationDuration, // Reduced from 1000ms for faster animation
                })
            }
        },
        [currentZoom],
    )

    // Effect to force map resize when sidebar opens/closes
    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current?.resize()
            }, 300) // Wait for transition to complete
        }
    }, [selectedLocation, highlightedCategories])

    // Effect to resize map on mount and when container resizes (fixes blank map issues)
    useEffect(() => {
        if (!mapRef.current) return

        // Initial resize
        setTimeout(() => {
            mapRef.current?.resize()
        }, 500)

        // ResizeObserver to handle container size changes
        const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) {
                mapRef.current.resize()
            }
        })

        // Observe the map container's parent
        const mapContainer = mapRef.current.getMap().getContainer()
        if (mapContainer && mapContainer.parentElement) {
            resizeObserver.observe(mapContainer.parentElement)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    // Effect to fly to mapCenter prop changes
    useEffect(() => {
        if (mapCenter && mapRef.current) {
            mapRef.current.flyTo({
                center: [mapCenter.lng, mapCenter.lat],
                zoom: mapZoom, // Use the passed zoom level
                duration: animationDuration,
            })
        }
    }, [mapCenter, mapZoom])

    // Track last focused ID to prevent re-focusing on same location during re-renders
    const [lastFocusedId, setLastFocusedId] = useState<string | null>(null)

    // Auto-scroll to sidebar on mobile when location is selected
    useEffect(() => {
        if (!disableAutoScroll && selectedLocation && sidebarRef.current && window.innerWidth < 768) {
            setTimeout(() => {
                sidebarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 300)
        }
    }, [selectedLocation, disableAutoScroll])

    // Fullscreen toggle handler with iOS Safari support
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return

        const elem = containerRef.current as any
        const isFullscreen = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        )

        if (!isFullscreen) {
            // Enter fullscreen with vendor prefixes
            const requestFullscreen =
                elem.requestFullscreen ||
                elem.webkitRequestFullscreen ||
                elem.webkitEnterFullscreen ||
                elem.mozRequestFullScreen ||
                elem.msRequestFullscreen

            if (requestFullscreen) {
                requestFullscreen.call(elem).then(() => {
                    setIsFullscreen(true)
                    // Force map resize after entering fullscreen
                    setTimeout(() => {
                        mapRef.current?.resize()
                    }, 100)
                }).catch((err: any) => {
                    console.error('Error entering fullscreen:', err)
                })
            } else {
                console.warn('Fullscreen API not supported on this device')
            }
        } else {
            // Exit fullscreen with vendor prefixes
            const exitFullscreen =
                document.exitFullscreen ||
                (document as any).webkitExitFullscreen ||
                (document as any).mozCancelFullScreen ||
                (document as any).msExitFullscreen

            if (exitFullscreen) {
                exitFullscreen.call(document).then(() => {
                    setIsFullscreen(false)
                    // Force map resize after exiting fullscreen
                    setTimeout(() => {
                        mapRef.current?.resize()
                    }, 100)
                })
            }
        }
    }, [])

    // Listen for fullscreen changes (e.g., ESC key) with vendor prefixes
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            )
            setIsFullscreen(isCurrentlyFullscreen)
            // Resize map when fullscreen state changes
            setTimeout(() => {
                mapRef.current?.resize()
            }, 100)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.addEventListener('mozfullscreenchange', handleFullscreenChange)
        document.addEventListener('MSFullscreenChange', handleFullscreenChange)

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
        }
    }, [])

    // Effect to handle highlightLocationId prop
    useEffect(() => {
        // Only auto-select if it's a new ID (prevents re-focusing on refresh)
        if (highlightLocationId && highlightLocationId !== lastFocusedId) {
            const location = locations.find((l) => l.id === highlightLocationId)
            if (location) {
                setSelectedLocation(location)
                // Small timeout to allow map to load/resize before flying
                setTimeout(() => {
                    focusOnLocation(location, 18) // Use zoom 18 for search selection
                    setLastFocusedId(highlightLocationId)
                }, 500)
            }
        }
    }, [highlightLocationId, locations, focusOnLocation, lastFocusedId, mapZoom])

    // Layer visibility toggles
    const [showBoundary, setShowBoundary] = useState(true)
    const [showLots, setShowLots] = useState(true)
    const [showFacilities, setShowFacilities] = useState(true)
    const [showStreets, setShowStreets] = useState(true)
    const [showPaths, setShowPaths] = useState(true)
    const [showCheckIns, setShowCheckIns] = useState(true)

    const {
    boundaryGeoJSON,
    lotsGeoJSON,
    facilitiesGeoJSON,
    streetsGeoJSON,
    pathsGeoJSON,
} = useMemo(() => {
    let boundary = null

    const lots: any[] = []
    const facilities: any[] = []
    const streets: any[] = []
    const paths: any[] = []

    for (const loc of locations) {
        // Boundary
        if (loc.type === "boundary" && loc.boundary_coordinates) {
            boundary = {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [loc.boundary_coordinates.map(([lat, lng]) => [lng, lat])],
                },
                properties: {
                    id: loc.id,
                    name: loc.name,
                    color: loc.color,
                },
            }
        }

        // Lots
        else if (loc.type === "lot" && loc.path_coordinates?.length) {
            lots.push({
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [loc.path_coordinates.map(([lat, lng]) => [lng, lat])],
                },
                properties: {
                    id: loc.id,
                    name: loc.name,
                    neighborhood: loc.neighborhood?.name,
                    occupancy: loc.residents?.length > 0 ? "occupied" : "vacant",
                    color: loc.color,
                },
            })
        }

        // Facilities
        else if (loc.type === "facility" && loc.path_coordinates?.length) {
            facilities.push({
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [loc.path_coordinates.map(([lat, lng]) => [lng, lat])],
                },
                properties: {
                    id: loc.id,
                    name: loc.name,
                    facility_type: loc.facility_type,
                    icon: loc.icon || "🏛️",
                    color: loc.color,
                },
            })
        }

        // Streets
        else if (loc.type === "public_street" && loc.path_coordinates) {
            streets.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: loc.path_coordinates.map(([lat, lng]) => [lng, lat]),
                },
                properties: {
                    id: loc.id,
                    name: loc.name,
                    color: loc.color,
                },
            })
        }

        // Paths
        else if (loc.type === "walking_path" && loc.path_coordinates) {
            paths.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: loc.path_coordinates.map(([lat, lng]) => [lng, lat]),
                },
                properties: {
                    id: loc.id,
                    name: loc.name,
                    color: loc.color,
                },
            })
        }
    }

    return {
        boundaryGeoJSON: boundary
            ? { type: "FeatureCollection", features: [boundary] }
            : null,
        lotsGeoJSON: { type: "FeatureCollection", features: lots },
        facilitiesGeoJSON: { type: "FeatureCollection", features: facilities },
        streetsGeoJSON: { type: "FeatureCollection", features: streets },
        pathsGeoJSON: { type: "FeatureCollection", features: paths },
    }
}, [locations])

    // Calculate lot label positions using Turf (only for lots with proper names)
    const lotLabelsGeoJSON = useMemo(() => {
        const features = lotsGeoJSON.features
            .filter((feature) => {
                const name = feature.properties.name
                // Only show labels for lots with proper names (not "Imported LineString")
                return name && !name.toLowerCase().includes("imported") && !name.toLowerCase().includes("linestring")
            })
            .map((feature) => {
                const centroid = turf.centroid(feature)
                return {
                    type: "Feature" as const,
                    geometry: centroid.geometry,
                    properties: feature.properties,
                }
            })

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [lotsGeoJSON])

    // Calculate facility label positions using Turf
    const facilityLabelsGeoJSON = useMemo(() => {
        const features = facilitiesGeoJSON.features
            .map((feature) => {
                const centroid = turf.centroid(feature)
                return {
                    type: "Feature" as const,
                    geometry: centroid.geometry,
                    properties: feature.properties,
                }
            })

        return {
            type: "FeatureCollection" as const,
            features,
        }
    }, [facilitiesGeoJSON])

    // Filter and distribute check-ins - only show LIVE/ACTIVE ones
    const distributedCheckIns = useMemo(() => {
        const now = Date.now()

        // First filter to only LIVE check-ins
        const liveCheckIns = checkIns.filter((checkIn: any) => {
            const startTime = new Date(checkIn.start_time).getTime()
            const durationMs = checkIn.duration_minutes * 60 * 1000
            const endTime = startTime + durationMs
            return endTime > now // Only show if hasn't expired
        })

        return liveCheckIns
            .map((checkIn: any) => {
                // Extract coordinates based on location type
                let coords = null

                if (checkIn.location_type === "community_location") {
                    // Get from linked location
                    coords = checkIn.location?.coordinates
                } else if (checkIn.location_type === "custom_temporary") {
                    // custom_location_coordinates is already an object {lat, lng}
                    coords = checkIn.custom_location_coordinates
                }

                if (!coords || !coords.lat || !coords.lng) {
                    return null
                }

                // Find all check-ins at roughly the same location
                const sameLocation = liveCheckIns.filter((ci: any) => {
                    let ciCoords = null
                    if (ci.location_type === "community_location") {
                        ciCoords = ci.location?.coordinates
                    } else if (ci.location_type === "custom_temporary") {
                        ciCoords = ci.custom_location_coordinates
                    }
                    if (!ciCoords) return false
                    return Math.abs(ciCoords.lat - coords.lat) < 0.0001 && Math.abs(ciCoords.lng - coords.lng) < 0.0001
                })

                // If only one check-in at this location, use exact coordinates
                if (sameLocation.length === 1) {
                    return {
                        ...checkIn,
                        displayCoords: coords,
                    }
                }

                // Otherwise distribute in a circle
                const ciIndex = sameLocation.findIndex((ci: any) => ci.id === checkIn.id)
                const angle = (ciIndex / sameLocation.length) * 2 * Math.PI
                const radius = 0.00008 // ~8 meters
                const distributed = {
                    lat: coords.lat + radius * Math.cos(angle),
                    lng: coords.lng + radius * Math.sin(angle),
                }

                return {
                    ...checkIn,
                    displayCoords: distributed,
                }
            })
            .filter(Boolean) as any[]
    }, [checkIns])

    // Search locations as user types
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase()
            const results = locations
                .filter(
                    (loc) =>
                        loc.name.toLowerCase().includes(query) ||
                        loc.type.toLowerCase().includes(query) ||
                        loc.neighborhood?.name?.toLowerCase().includes(query),
                )
                .slice(0, 10) // Limit to 10 results
            setSearchResults(results)
            setShowSearchDropdown(true)
        } else {
            setSearchResults([])
            setShowSearchDropdown(false)
        }
    }, [searchQuery, locations])

    // Category buttons configuration
    const categoryButtons = useMemo(
        () => [
            {
                id: "boundary",
                label: "Boundary",
                icon: "🗺️",
                count: boundaryGeoJSON ? 1 : 0,
                type: "boundary",
            },
            {
                id: "lots",
                label: "Lots",
                icon: "🏡",
                count: lotsGeoJSON.features.length,
                type: "lot",
            },
            {
                id: "facilities",
                label: "Facilities",
                icon: "🏛️",
                count: facilitiesGeoJSON.features.length,
                type: "facility",
            },
            {
                id: "streets",
                label: "Streets",
                icon: "🛣️",
                count: streetsGeoJSON.features.length,
                type: "public_street",
            },
            {
                id: "paths",
                label: "Paths",
                icon: "🚶",
                count: pathsGeoJSON.features.length,
                type: "walking_path",
            },
            {
                id: "checkins",
                label: "Check-ins",
                icon: "📍",
                count: distributedCheckIns.length,
                type: "checkin",
            },
        ],
        [boundaryGeoJSON, lotsGeoJSON, facilitiesGeoJSON, streetsGeoJSON, pathsGeoJSON, distributedCheckIns],
    )



    if (!mapboxToken) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <Card className="p-6">
                    <p className="text-red-600">❌ Mapbox token not found in environment variables</p>
                    <p className="mt-2 text-sm text-muted-foreground">Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file</p>
                </Card>
            </div>
        )
    }

    return (
        <div className={`relative h-full w-full flex flex-col overflow-hidden ${className || ""}`}>
            {/* Top Bar - Search + Category Filters (desktop only on full page, hide on dashboard preview) */}
            {showControls && isFullPage && (
                <div className="hidden md:block relative z-20 bg-card border-b border-border px-4 py-3">
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Input
                                type="text"
                                placeholder="Search locations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                                className="w-full bg-background"
                            />
                            {/* Search Results Dropdown */}
                            {showSearchDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-30">
                                    {searchResults.map((location) => (
                                        <button
                                            key={location.id}
                                            className="w-full text-left px-4 py-2 hover:bg-accent border-b border-border last:border-b-0 transition-colors"
                                            onClick={() => {
                                                hasUserInteracted.current = true
                                                setSelectedLocation(location)
                                                setSearchQuery("")
                                                setShowSearchDropdown(false)
                                                focusOnLocation(location)
                                            }}
                                        >
                                            <div className="font-medium text-sm text-foreground">{location.name}</div>
                                            <div className="text-xs text-muted-foreground capitalize flex items-center gap-2">
                                                <span>{location.type}</span>
                                                {location.neighborhood && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{location.neighborhood.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category Filter Buttons */}
                        <div className="flex items-center gap-2">
                            {categoryButtons.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        const newHighlighted = new Set(highlightedCategories)
                                        if (newHighlighted.has(category.type)) {
                                            newHighlighted.delete(category.type)
                                        } else {
                                            newHighlighted.add(category.type)
                                        }
                                        setHighlightedCategories(newHighlighted)
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${highlightedCategories.has(category.type)
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-card hover:bg-accent border-border"
                                        }`}
                                    disabled={category.count === 0}
                                >
                                    <span className="text-lg">{category.icon}</span>
                                    <span className="text-sm font-medium">{category.label}</span>
                                    <Badge
                                        variant={highlightedCategories.has(category.type) ? "secondary" : "outline"}
                                        className="ml-1 text-xs"
                                    >
                                        {category.count}
                                    </Badge>
                                </button>
                            ))}
                        </div>

                        {/* Layer Settings */}
                        <div className="flex gap-2">
                            {/* ... existing toggle buttons could go here ... */}
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area - Map + Sidebar (Stacked on mobile, Side-by-side on desktop) */}
            <div ref={containerRef} className={`relative flex-1 flex flex-col md:flex-row overflow-hidden ${isFullscreen ? 'bg-background' : ''}`}>
                {/* Map Container - Full width on mobile, responsive width on desktop */}
                <div
                    className={`relative touch-none ${!hideSidebar && enableSelection && (selectedLocation || highlightedCategories.size > 0) ? "h-[40%] md:h-full md:w-2/3" : "h-full w-full"}`}
                >
                    <Map
                        {...viewState}
                        style={{ width: "100%", height: "100%" }}
                        mapStyle={mapStyle}
                        mapboxAccessToken={mapboxToken}
                        onMove={(evt) => {
                            setViewState(evt.viewState)
                            setCurrentZoom(evt.viewState.zoom)
                            if (onMapMove) {
                                onMapMove({
                                    lat: evt.viewState.latitude,
                                    lng: evt.viewState.longitude,
                                    zoom: evt.viewState.zoom,
                                })
                            }
                        }}
                        onLoad={() => console.log("[MapboxFullViewer] Map Loaded")}
                        onError={(e) => console.error("[MapboxFullViewer] Map Error:", e)}
                        ref={mapRef}
                        interactiveLayerIds={["lots-fill", "facilities-fill", "paths-line", "paths-hit-area", "streets-line", "poi-label"]}
                        onClick={(e: any) => {
                            const { lng, lat } = e.lngLat;
                            const isInside = checkIfInsideBoundary(lat, lng);

                            if (e.features && e.features.length > 0) {
                                const feature = e.features[0]

                                // Handle Community Location Click
                                if (
                                    feature.layer.id === "lots-fill" ||
                                    feature.layer.id === "facilities-fill" ||
                                    feature.layer.id === "paths-line" ||
                                    feature.layer.id === "paths-hit-area" ||
                                    feature.layer.id === "streets-line"
                                ) {
                                    const locationId = feature.properties.id
                                    const location = locations.find((loc) => loc.id === locationId)
                                    if (location) {
                                        MapAnalytics.locationClicked(locationId, location.type, isInside)
                                        // Call external callback if provided
                                        if (onLocationClick) {
                                            onLocationClick(locationId, location)
                                        }
                                        // Set internal state only if selection is enabled
                                        if (enableSelection) {
                                            hasUserInteracted.current = true
                                            setSelectedLocation(location)
                                        }
                                    }
                                }
                                // Handle POI Click
                                else if (feature.layer.id === "poi-label" && onPoiClick) {
                                    const name = feature.properties.name || "Unknown Location"
                                    const address = feature.properties.address

                                    onPoiClick({
                                        name,
                                        address,
                                        lat: e.lngLat.lat,
                                        lng: e.lngLat.lng,
                                    })
                                }
                            } else {
                                MapAnalytics.mapClicked(isInside, { lat, lng })
                                setSelectedLocation(null)
                                // Handle background click (for pin dropping)
                                if (onMapClick) {
                                    onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })
                                }
                            }
                        }}
                        onMouseEnter={useCallback((e: any) => {
                            if (e.features && e.features.length > 0) {
                                setHoveredLot(e.features[0].properties.id)
                            }
                        }, [])}
                        onMouseLeave={useCallback(() => setHoveredLot(null), [])}
                        cursor={hoveredLot ? "pointer" : "grab"}
                        terrain={
                            mapStyle === "mapbox://styles/mapbox/satellite-streets-v12" && viewState.pitch > 0
                                ? { source: "mapbox-dem", exaggeration: 1.5 }
                                : undefined
                        }
                        maxPitch={85}
                        dragRotate={true}
                        touchZoomRotate={true}
                        preserveDrawingBuffer={true}
                    >
                        {/* Terrain Source - Always render */}
                        <Source
                            id="mapbox-dem"
                            type="raster-dem"
                            url="mapbox://mapbox.mapbox-terrain-dem-v1"
                            tileSize={512}
                            maxzoom={14}
                        />

                        {/* Community Boundary */}
                        {showBoundary && boundaryGeoJSON && (
                            <Source id="boundary" type="geojson" data={boundaryGeoJSON}>
                                <Layer
                                    id="boundary-line"
                                    type="line"
                                    paint={{
                                        "line-color": ["coalesce", ["get", "color"], "#D97742"], // Use color or fallback to Sunrise Orange
                                        "line-width": 3,
                                        "line-opacity": 0.9,
                                    }}
                                />
                            </Source>
                        )}

                        {children}

                        {/* Lots - Fill */}
                        {showLots && (
                            <Source id="lots" type="geojson" data={lotsGeoJSON}>
                                <Layer
                                    id="lots-fill"
                                    type="fill"
                                    paint={{
                                        "fill-color": [
                                            "coalesce",
                                            ["get", "color"],
                                            [
                                                "case",
                                                ["==", ["get", "occupancy"], "occupied"],
                                                "#F59E0B", // Warm Amber for occupied
                                                "#86B25C" // Organic Green for vacant
                                            ]
                                        ],
                                        "fill-opacity": [
                                            "match",
                                            ["get", "occupancy"],
                                            "occupied", 0.5,
                                            0.3 // Updated to 30% per design doc
                                        ],
                                    }}
                                />

                                {/* Lots - Border */}
                                <Layer
                                    id="lots-border"
                                    type="line"
                                    paint={{
                                        "line-color": [
                                            "case",
                                            ["boolean", ["feature-state", "selected"], false],
                                            "#F97316", // Orange when individually selected
                                            ["==", ["get", "id"], selectedLocation?.id || ""],
                                            "#F97316", // Orange when ID matches
                                            highlightedCategories.has("lot") ? "#F97316" : "#2D5016", // Orange when category highlighted
                                        ],
                                        "line-width": [
                                            "case",
                                            ["==", ["get", "id"], selectedLocation?.id || ""],
                                            3, // Thicker orange border for selected
                                            2, // Normal width
                                        ],
                                    }}
                                />
                            </Source>
                        )}

                        {/* Lot Labels */}
                        {showLots && (
                            <Source id="lot-labels" type="geojson" data={lotLabelsGeoJSON}>
                                <Layer
                                    id="lot-labels"
                                    type="symbol"
                                    minzoom={15} // Only show labels when zoomed in
                                    layout={{
                                        "text-field": ["get", "name"],
                                        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                                        "text-size": 11,
                                        "text-anchor": "center",
                                    }}
                                    paint={{
                                        "text-color": "#111827", // Gray-900 for sharp contrast
                                        "text-halo-color": "#FFFFFF",
                                        "text-halo-width": 2, // Thicker halo to separate from background
                                    }}
                                />
                            </Source>
                        )}

                        {/* Facilities - Icons */}
                        {showFacilities && facilitiesGeoJSON.features.length > 0 && (
                            <Source id="facilities" type="geojson" data={facilitiesGeoJSON}>
                                {/* Facility Fill */}
                                <Layer
                                    id="facilities-fill"
                                    type="fill"
                                    paint={{
                                        "fill-color": ["coalesce", ["get", "color"], "#3B82F6"],
                                        "fill-opacity": 0.2,
                                    }}
                                />

                                {/* Facility Border */}
                                <Layer
                                    id="facilities-border"
                                    type="line"
                                    paint={{
                                        "line-color": [
                                            "case",
                                            ["boolean", ["feature-state", "selected"], false],
                                            "#F97316", // Orange when individually selected
                                            ["==", ["get", "id"], selectedLocation?.id || ""],
                                            "#F97316", // Orange when ID matches
                                            highlightedCategories.has("facility") ? "#F97316" : "#1E40AF", // Orange when category highlighted
                                        ],
                                        "line-width": 2,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Facility Labels */}
                        {showFacilities && (
                            <Source id="facility-labels" type="geojson" data={facilityLabelsGeoJSON}>
                                <Layer
                                    id="facility-labels"
                                    type="symbol"
                                    minzoom={13}
                                    layout={{
                                        "text-field": ["get", "name"],
                                        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
                                        "text-size": 11,
                                        "text-anchor": "center",
                                    }}
                                    paint={{
                                        "text-color": "#1E40AF",
                                        "text-halo-color": "#FFFFFF",
                                        "text-halo-width": 1.5,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Facility Markers (Points) */}
                        {showFacilities && locations.map(location => {
                            if (location.type !== 'facility' || !location.coordinates || (location.path_coordinates && location.path_coordinates.length > 0)) return null;

                            const isHighlighted = highlightedCategories.has('facility');
                            const isSelected = selectedLocation?.id === location.id;

                            // Use dynamic color for marker border/bg if available, else default
                            const markerColor = location.color || (isSelected ? "#3b82f6" : "#ffffff");

                            return (
                                <Marker
                                    key={location.id}
                                    longitude={location.coordinates.lng}
                                    latitude={location.coordinates.lat}
                                    anchor="bottom"
                                    style={{ zIndex: isSelected ? 40 : 5 }}
                                    onClick={(e) => {
                                        e.originalEvent.stopPropagation();
                                        // Check boundary status for marker
                                        const isInside = checkIfInsideBoundary(location.coordinates!.lat, location.coordinates!.lng);
                                        MapAnalytics.locationClicked(location.id, location.type, isInside)

                                        if (onLocationClick) {
                                            onLocationClick(location.id, location);
                                        }
                                        setSelectedLocation(location);
                                        focusOnLocation(location);
                                    }}
                                >
                                    <div className={`cursor-pointer transform transition-transform hover:scale-110 ${isHighlighted ? 'scale-110' : ''}`}>
                                        {isHighlighted && (
                                            <div className="absolute -inset-2 rounded-full border-2 border-[#F97316] animate-pulse opacity-70"></div>
                                        )}
                                        <div
                                            className={`p-1.5 rounded-full shadow-md border ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-1' : 'border-gray-200'} text-xl flex items-center justify-center w-10 h-10`}
                                            style={{ backgroundColor: location.color || 'white' }}
                                        >
                                            {location.icon || '🏛️'}
                                        </div>
                                    </div>
                                </Marker>
                            );
                        })}

                        {/* Streets */}
                        {showStreets && streetsGeoJSON.features.length > 0 && (
                            <Source id="streets" type="geojson" data={streetsGeoJSON}>
                                <Layer
                                    id="streets-line"
                                    type="line"
                                    paint={{
                                        "line-color": ["coalesce", ["get", "color"], highlightedCategories.has("public_street") ? "#F97316" : "#eab308"], // Yellow-500
                                        "line-width": 2,
                                        "line-opacity": 0.6,
                                    }}
                                />
                            </Source>
                        )}

                        {/* Walking Paths */}
                        {showPaths && pathsGeoJSON.features.length > 0 && (
                            <Source id="paths" type="geojson" data={pathsGeoJSON}>
                                <Layer
                                    id="paths-hit-area"
                                    type="line"
                                    paint={{
                                        "line-color": "#ffffff",
                                        "line-width": 20,
                                        "line-opacity": 0,
                                    }}
                                />
                                <Layer
                                    id="paths-line"
                                    type="line"
                                    paint={{
                                        "line-color": ["coalesce", ["get", "color"], highlightedCategories.has("walking_path") ? "#F97316" : "#84cc16"], // Lime-500
                                        "line-width": 2,
                                        "line-dasharray": [2, 1],
                                        "line-opacity": 0.8,
                                    }}
                                />
                            </Source>
                        )}
                        {/* Custom Marker */}
                        {customMarker && (
                            <Marker latitude={customMarker.lat} longitude={customMarker.lng} anchor="bottom">
                                <div className="flex flex-col items-center">
                                    <div className="bg-white px-2 py-1 rounded shadow text-xs font-medium mb-1 whitespace-nowrap">
                                        {customMarker.label || "Custom Location"}
                                    </div>
                                    <MapPin className="h-8 w-8 text-primary fill-current" />
                                </div>
                            </Marker>
                        )}

                        {/* Facility Markers (Points) - Only show when zoomed in */}
                        {showFacilities &&
                            locations.map((location) => {
                                // Only show markers for Point facilities (no path_coordinates)
                                // Polygon facilities are rendered via the facilities-fill layer
                                if (
                                    location.type !== "facility" ||
                                    !location.coordinates ||
                                    (location.path_coordinates && location.path_coordinates.length > 0)
                                )
                                    return null

                                const isHighlighted = highlightedCategories.has("facility")
                                const isSelected = selectedLocation?.id === location.id

                                return (
                                    <Marker
                                        key={location.id}
                                        longitude={location.coordinates.lng}
                                        latitude={location.coordinates.lat}
                                        anchor="bottom"
                                        style={{ zIndex: isSelected ? 40 : 5 }}
                                        onClick={(e) => {
                                            e.originalEvent.stopPropagation()
                                            // Check boundary status for marker
                                            const isInside = checkIfInsideBoundary(location.coordinates!.lat, location.coordinates!.lng);
                                            MapAnalytics.locationClicked(location.id, location.type, isInside)

                                            if (onLocationClick) {
                                                onLocationClick(location.id, location)
                                            }
                                            hasUserInteracted.current = true
                                            setSelectedLocation(location)
                                            focusOnLocation(location)
                                        }}
                                    >
                                        <div
                                            className={`cursor-pointer transform transition-transform hover:scale-110 ${isHighlighted ? "scale-110" : ""
                                                }`}
                                        >
                                            {isHighlighted && (
                                                <div className="absolute -inset-2 rounded-full border-2 border-[#F97316] animate-pulse opacity-70"></div>
                                            )}
                                            <div
                                                className={`p-1.5 rounded-full shadow-md border ${isSelected ? "border-primary ring-2 ring-primary ring-offset-1" : "border-gray-200"
                                                    } text-xl flex items-center justify-center w-10 h-10`}
                                                style={{ backgroundColor: location.color || 'white' }}
                                            >
                                                {location.icon || "🏛️"}
                                            </div>
                                        </div>
                                    </Marker>
                                )
                            })}

                        {/* User Location Beacon (Blue Dot) */}
                        {userLocation.latitude && userLocation.longitude && (
                            <Marker
                                longitude={userLocation.longitude}
                                latitude={userLocation.latitude}
                                anchor="center"
                                style={{ zIndex: 100 }} // Always on top
                            >
                                <div className="relative flex items-center justify-center w-6 h-6">
                                    {/* Pulsing Ring */}
                                    <div className="absolute w-full h-full bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                                    {/* White Stroke */}
                                    <div className="absolute w-4 h-4 bg-white rounded-full shadow-md"></div>
                                    {/* Blue Center */}
                                    <div className="absolute w-3 h-3 bg-blue-600 rounded-full"></div>
                                </div>
                            </Marker>
                        )}

                        {/* Map Controls - Top Right - All 5 buttons in ONE control group */}
                        <div className="absolute top-4 right-4 z-50">
                            <div className="mapboxgl-ctrl mapboxgl-ctrl-group">
                                {/* Zoom In */}
                                <button
                                    onClick={() => {
                                        const map = mapRef.current
                                        if (map) map.zoomIn()
                                    }}
                                    className="mapboxgl-ctrl-icon"
                                    type="button"
                                    title="Zoom in"
                                    style={{
                                        width: "29px",
                                        height: "29px",
                                        display: "block",
                                        padding: 0,
                                        outline: "none",
                                        border: 0,
                                        boxSizing: "border-box",
                                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E %3Cpath d='M14.5 8.5c-.75 0-1.5.75-1.5 1.5v3h-3c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h3v3c0 .75.75 1.5 1.5 1.5S16 19.75 16 19v-3h3c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-3v-3c0-.75-.75-1.5-1.5-1.5z'/%3E %3C/svg%3E")`,
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        backgroundColor: "#fff",
                                        cursor: "pointer",
                                    }}
                                />

                                {/* Zoom Out */}
                                <button
                                    onClick={() => {
                                        const map = mapRef.current
                                        if (map) map.zoomOut()
                                    }}
                                    className="mapboxgl-ctrl-icon"
                                    type="button"
                                    title="Zoom out"
                                    style={{
                                        width: "29px",
                                        height: "29px",
                                        display: "block",
                                        padding: 0,
                                        outline: "none",
                                        border: 0,
                                        boxSizing: "border-box",
                                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E %3Cpath d='M10 13c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h9c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-9z'/%3E %3C/svg%3E")`,
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        backgroundColor: "#fff",
                                        cursor: "pointer",
                                    }}
                                />

                                {/* Compass / Reset North */}
                                <button
                                    onClick={() => {
                                        const map = mapRef.current
                                        if (map) {
                                            map.flyTo({
                                                bearing: 0,
                                                pitch: 0,
                                                duration: 500
                                            })
                                        }
                                    }}
                                    className="mapboxgl-ctrl-icon"
                                    type="button"
                                    title="Reset bearing to north"
                                    style={{
                                        width: "29px",
                                        height: "29px",
                                        display: "block",
                                        padding: 0,
                                        outline: "none",
                                        border: 0,
                                        boxSizing: "border-box",
                                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E %3Cpath d='M10.5 14l4-8 4 8h-8z'/%3E %3Cpath d='M10.5 16l4 8 4-8h-8z' fill='%23ccc'/%3E %3C/svg%3E")`,
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        backgroundColor: "#fff",
                                        cursor: "pointer",
                                    }}
                                />

                                {/* Geolocate */}
                                <button
                                    onClick={() => {
                                        // 1. Enable tracking (triggers permission prompt if needed)
                                        userLocation.enable()

                                        // 2. If we already have a location, fly to it immediately
                                        if (userLocation.latitude && userLocation.longitude) {
                                            const map = mapRef.current
                                            if (map) {
                                                map.flyTo({
                                                    center: [userLocation.longitude, userLocation.latitude],
                                                    zoom: 16,
                                                    duration: 1000
                                                })
                                            }
                                        }
                                        // 3. Otherwise, set pending flag and wait for hook to update
                                        else {
                                            toast.info("Locating you...")
                                            setPendingFlyTo(true)
                                        }
                                    }}
                                    className="mapboxgl-ctrl-icon"
                                    type="button"
                                    title="Find my location"
                                    style={{
                                        width: "29px",
                                        height: "29px",
                                        display: "block",
                                        padding: 0,
                                        outline: "none",
                                        border: 0,
                                        boxSizing: "border-box",
                                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E %3Cpath d='M10 4C9 4 9 5 9 5v.1A5 5 0 0 0 5.1 9H5s-1 0-1 1 1 1 1 1h.1A5 5 0 0 0 9 14.9v.1s0 1 1 1 1-1 1-1v-.1a5 5 0 0 0 3.9-3.9h.1s1 0 1-1-1-1-1-1h-.1A5 5 0 0 0 11 5.1V5s0-1-1-1zm0 2.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 1 1 0-7z'/%3E %3Ccircle cx='10' cy='10' r='2'/%3E %3C/svg%3E")`,
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        backgroundColor: "#fff",
                                        cursor: "pointer",
                                    }}
                                />

                                {/* Fullscreen - Desktop Only */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="mapboxgl-ctrl-icon desktop-only-control"
                                    type="button"
                                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                                    style={{
                                        width: "29px",
                                        height: "29px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: 0,
                                        outline: "none",
                                        border: 0,
                                        boxSizing: "border-box",
                                        backgroundColor: "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    {isFullscreen ? (
                                        <svg width="20" height="20" viewBox="0 0 29 29" fill="#333" style={{ pointerEvents: 'none' }}>
                                            <path d="M10 16h3v3h-3v-3zm6 0h3v3h-3v-3zm0-6h3v3h-3v-3zm-6 0h3v3h-3v-3z" />
                                            <path d="M22 7v15h-15v-15h15zm2-2h-19v19h19v-19z" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 29 29" fill="#333" style={{ pointerEvents: 'none' }}>
                                            <path d="M24 16h-2v4h-4v2h6v-6zm-14 4h-4v-4h-2v6h6v-2zm-4-14h4v-2h-6v6h2v-4zm14 0h-4v2h4v4h2v-6h-6z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <style jsx global>{`
                                @media (max-width: 768px) {
                                    .desktop-only-control {
                                        display: none !important;
                                    }
                                }
                            `}</style>
                        </div>

                        {/* Collapsible Layer Toggle Button */}
                        <div className="absolute left-4 top-4 z-10">
                            <button
                                onClick={() => {
                                    setShowLayersPanel(!showLayersPanel)
                                    if (!showLayersPanel) setShowBaseMapPanel(false)
                                }}
                                className="mapboxgl-ctrl mapboxgl-ctrl-group"
                                title="Toggle Layers"
                                style={{
                                    width: "29px",
                                    height: "29px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                    boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
                                }}
                            >
                                <Layers className="h-4 w-4" style={{ color: "#333" }} />
                            </button>

                            {/* Expandable Layers Panel */}
                            {showLayersPanel && (
                                <div className="mt-2 rounded-lg border bg-card border-border p-4 shadow-lg w-64">
                                    <h4 className="mb-3 text-sm font-semibold text-foreground">Map Layers</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1 rounded text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={showBoundary}
                                                onChange={(e) => setShowBoundary(e.target.checked)}
                                                className="rounded"
                                            />
                                            Community Boundary
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1 rounded text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={showLots}
                                                onChange={(e) => setShowLots(e.target.checked)}
                                                className="rounded"
                                            />
                                            Lots ({lotsGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1 rounded text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={showFacilities}
                                                onChange={(e) => setShowFacilities(e.target.checked)}
                                                className="rounded"
                                            />
                                            Facilities ({facilitiesGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1 rounded text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={showStreets}
                                                onChange={(e) => setShowStreets(e.target.checked)}
                                                className="rounded"
                                            />
                                            Streets ({streetsGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1 rounded text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={showPaths}
                                                onChange={(e) => setShowPaths(e.target.checked)}
                                                className="rounded"
                                            />
                                            Walking Paths ({pathsGeoJSON.features.length})
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent p-1 rounded text-foreground">
                                            <input
                                                type="checkbox"
                                                checked={showCheckIns}
                                                onChange={(e) => setShowCheckIns(e.target.checked)}
                                                className="rounded"
                                            />
                                            Check-ins ({distributedCheckIns.length})
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Collapsible Base Map Button */}
                        <div className="absolute left-16 top-4 z-10">
                            <button
                                onClick={() => {
                                    setShowBaseMapPanel(!showBaseMapPanel)
                                    if (!showBaseMapPanel) setShowLayersPanel(false)
                                }}
                                className="mapboxgl-ctrl mapboxgl-ctrl-group"
                                title="Change Base Map"
                                style={{
                                    width: "29px",
                                    height: "29px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "white",
                                    border: "none",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                    boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
                                }}
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ color: "#333" }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                    />
                                </svg>
                            </button>

                            {/* Expandable Base Map Panel */}
                            {showBaseMapPanel && (
                                <div className="mt-2 rounded-lg border bg-card border-border p-4 shadow-lg w-64">
                                    <h4 className="mb-3 text-sm font-semibold text-foreground">Base Map</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setMapStyle("mapbox://styles/mapbox/satellite-streets-v12")
                                                mapRef.current?.flyTo({
                                                    pitch: 0,
                                                    bearing: 0,
                                                    duration: 300,
                                                })
                                            }}
                                            className={`px-3 py-2 text-xs rounded-md border transition-all ${mapStyle === "mapbox://styles/mapbox/satellite-streets-v12" && viewState.pitch <= 60
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card hover:bg-accent border-border text-foreground"
                                                }`}
                                        >
                                            Satellite
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMapStyle("mapbox://styles/mapbox/streets-v12")
                                                mapRef.current?.flyTo({
                                                    pitch: 0,
                                                    bearing: 0,
                                                    duration: 300,
                                                })
                                            }}
                                            className={`px-3 py-2 text-xs rounded-md border transition-all ${mapStyle === "mapbox://styles/mapbox/streets-v12"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card hover:bg-accent border-border text-foreground"
                                                }`}
                                        >
                                            Streets
                                        </button>
                                        <button
                                            onClick={() => setMapStyle("mapbox://styles/mapbox/outdoors-v12")}
                                            className={`px-3 py-2 text-xs rounded-md border transition-all ${mapStyle === "mapbox://styles/mapbox/outdoors-v12"
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card hover:bg-accent border-border text-foreground"
                                                }`}
                                        >
                                            Outdoors
                                        </button>
                                        <button
                                            onClick={() => {
                                                setMapStyle("mapbox://styles/mapbox/satellite-streets-v12")
                                                mapRef.current?.flyTo({
                                                    pitch: 80,
                                                    zoom: 16,
                                                    duration: 2000,
                                                })
                                            }}
                                            className={`px-3 py-2 text-xs rounded-md border transition-all ${mapStyle === "mapbox://styles/mapbox/satellite-streets-v12" && viewState.pitch > 60
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card hover:bg-accent border-border text-foreground"
                                                }`}
                                        >
                                            3D Terrain
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Check-in Markers with Profile Pictures - Only show when zoomed in */}
                        {showCheckIns && currentZoom >= 14 &&
                            distributedCheckIns.map(checkIn => {
                                if (!checkIn?.displayCoords) return null;
                                const isHighlighted = highlightedCategories.has('checkin');
                                const isSelected = selectedLocation?.id === checkIn.id;

                                return (
                                    <Marker
                                        key={checkIn.id}
                                        longitude={checkIn.displayCoords.lng}
                                        latitude={checkIn.displayCoords.lat}
                                        anchor="center"
                                        style={{ zIndex: isSelected ? 50 : 10 }} // Bring selected to front
                                    >
                                        <div
                                            className={`group relative cursor-pointer transition-all duration-300 ${isHighlighted ? 'scale-110' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Check boundary status for checkin
                                                const lat = checkIn.displayCoords?.lat;
                                                const lng = checkIn.displayCoords?.lng;
                                                const isInside = lat && lng ? checkIfInsideBoundary(lat, lng) : false;

                                                MapAnalytics.locationClicked(checkIn.id, 'checkin', isInside)

                                                console.log('[Mapbox] Check-in clicked:', checkIn);
                                                console.log('[Mapbox] Setting selectedLocation to:', checkIn);
                                                hasUserInteracted.current = true
                                                setSelectedLocation(checkIn);
                                                focusOnLocation(checkIn);
                                            }}
                                        >
                                            {/* Highlight Ring */}
                                            {isHighlighted && (
                                                <div className="absolute -inset-2 rounded-full border-2 border-[#F97316] animate-pulse opacity-70"></div>
                                            )}

                                            {/* Avatar + Pulse */}
                                            <div className="relative">
                                                <img
                                                    src={checkIn.resident.profile_picture_url || '/default-avatar.png'}
                                                    alt={checkIn.resident.first_name}
                                                    className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-lg transition-transform group-hover:scale-110"
                                                />
                                                {/* Pulse animation */}
                                                <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-75" />
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
                                                {checkIn.resident.first_name}
                                                {checkIn.location?.name && ` @ ${checkIn.location.name}`}
                                            </div>
                                        </div>
                                    </Marker>
                                );
                            })}
                    </Map>
                </div>


                {/* Sidebar/Info Panel - Below map on mobile (60%), side panel on desktop */}
                {!hideSidebar && (
                    <div
                        ref={sidebarRef}
                        className={`relative bg-card border-t md:border-t-0 md:border-l border-border transition-all duration-300 ease-in-out overflow-y-auto md:pb-0
                            ${enableSelection && (selectedLocation || highlightedCategories.size > 0)
                                ? "h-[60%] pb-24 md:h-full md:w-1/3"
                                : "h-0 pb-0 md:h-full md:w-0"
                            }`}
                    >
                        {selectedLocation && (
                            <div className="p-6">
                                {/* Check if this is a check-in */}
                                {(selectedLocation as CheckIn).activity_type ? (
                                    /* Check-in Card */
                                    <>
                                        {/* Header with Close Button */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h2 className="font-semibold text-2xl mb-2">
                                                    {(selectedLocation as CheckIn).title || "Check-in"}
                                                </h2>
                                                <Badge variant="secondary" className="capitalize">
                                                    {(selectedLocation as CheckIn).activity_type}
                                                </Badge>
                                            </div>
                                            <button
                                                onClick={() => setSelectedLocation(null)}
                                                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                                                title="Close"
                                            >
                                                <X className="h-6 w-6" />
                                            </button>
                                        </div>

                                        {/* User Info */}
                                        {(selectedLocation as CheckIn).resident && (
                                            <div className="flex items-center gap-3 mb-4 p-3 bg-accent rounded-lg">
                                                <img
                                                    src={(selectedLocation as CheckIn).resident.profile_picture_url || "/default-avatar.png"}
                                                    alt={(selectedLocation as CheckIn).resident.first_name}
                                                    className="h-12 w-12 rounded-full object-cover border-2 border-card shadow"
                                                />
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {(selectedLocation as CheckIn).resident.first_name}{" "}
                                                        {(selectedLocation as CheckIn).resident.last_name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Checked in</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {(selectedLocation as CheckIn).location?.name && (
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-muted-foreground">Location</span>
                                                <p className="text-foreground">{(selectedLocation as CheckIn).location?.name}</p>
                                            </div>
                                        )}
                                        {(selectedLocation as CheckIn).custom_location_name && (
                                            <div className="mb-3">
                                                <span className="text-sm font-medium text-muted-foreground">Location</span>
                                                <p className="text-foreground">{(selectedLocation as CheckIn).custom_location_name}</p>
                                            </div>
                                        )}

                                        {/* Time & Remaining Duration */}
                                        <div className="space-y-3 mb-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                {(selectedLocation as CheckIn).start_time && (
                                                    <div>
                                                        <span className="text-sm font-medium text-muted-foreground">Started</span>
                                                        <p className="text-foreground">
                                                            {new Date((selectedLocation as CheckIn).start_time!).toLocaleTimeString("en-US", {
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                                hour12: true,
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {(selectedLocation as CheckIn).duration_minutes && (
                                                    <div>
                                                        <span className="text-sm font-medium text-muted-foreground">Duration</span>
                                                        <p className="text-foreground">{(selectedLocation as CheckIn).duration_minutes} min</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Remaining Time Timer */}
                                            {(() => {
                                                const startTime = new Date((selectedLocation as CheckIn).start_time!).getTime()
                                                const durationMs = (selectedLocation as CheckIn).duration_minutes! * 60 * 1000
                                                const endTime = startTime + durationMs
                                                const now = Date.now()
                                                const remainingTime = Math.max(0, endTime - now)

                                                if (remainingTime > 0) {
                                                    return (
                                                        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-foreground">Time Remaining</span>
                                                                <span className="text-lg font-bold text-primary">
                                                                    {Math.floor(remainingTime / 60000)}:
                                                                    {Math.floor((remainingTime % 60000) / 1000)
                                                                        .toString()
                                                                        .padStart(2, "0")}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <div className="bg-accent rounded-lg p-3 border border-border">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-foreground">Status</span>
                                                                <span className="text-lg font-bold text-muted-foreground">Expired</span>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            })()}
                                        </div>

                                        {/* Description */}
                                        {(selectedLocation as CheckIn).description && (
                                            <div className="mb-4">
                                                <span className="text-sm font-medium text-muted-foreground">Message</span>
                                                <p className="text-foreground mt-1">{(selectedLocation as CheckIn).description}</p>
                                            </div>
                                        )}

                                        {/* Visibility */}
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                            <span className="capitalize">
                                                {(selectedLocation as CheckIn).visibility_scope || "community"}
                                            </span>
                                        </div>

                                        {/* RSVP Actions */}
                                        <div className="border-t pt-4 mt-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm font-medium text-foreground">Are you joining?</p>
                                                {(selectedLocation as any).rsvp_going_count > 0 && (
                                                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                        {(selectedLocation as any).rsvp_going_count} going
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === "yes"
                                                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                        : ""
                                                        }`}
                                                    onClick={async () => {
                                                        const checkIn = selectedLocation as CheckIn
                                                        const previousStatus = (checkIn as any).user_rsvp_status
                                                        const newStatus = previousStatus === "yes" ? null : "yes"

                                                        // Optimistic update
                                                        const updatedCheckIn = {
                                                            ...checkIn,
                                                            user_rsvp_status: newStatus,
                                                            rsvp_going_count: Math.max(0, ((checkIn as any).rsvp_going_count || 0) + (newStatus === "yes" ? 1 : previousStatus === "yes" ? -1 : 0)),
                                                        } as any
                                                        setSelectedLocation(updatedCheckIn)

                                                        try {
                                                            const apiStatus = newStatus === null ? "no" : "yes"
                                                            await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus)
                                                            // Dispatch sync event
                                                            window.dispatchEvent(new CustomEvent('rio-checkin-rsvp-sync', {
                                                                detail: { checkInId: checkIn.id, status: newStatus }
                                                            }))
                                                        } catch (error) {
                                                            console.error("Failed to RSVP:", error)
                                                            hasUserInteracted.current = true
                                                            setSelectedLocation(checkIn)
                                                        }
                                                    }}
                                                >
                                                    <Check className="h-4 w-4" />
                                                    Going
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className={`flex-1 gap-2 ${(selectedLocation as any).user_rsvp_status === "maybe"
                                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                        : ""
                                                        }`}
                                                    onClick={async () => {
                                                        const checkIn = selectedLocation as CheckIn
                                                        const previousStatus = (checkIn as any).user_rsvp_status
                                                        const newStatus = previousStatus === "maybe" ? null : "maybe"

                                                        const updatedCheckIn = {
                                                            ...checkIn,
                                                            user_rsvp_status: newStatus,
                                                            rsvp_going_count: Math.max(0, ((checkIn as any).rsvp_going_count || 0) + (previousStatus === "yes" ? -1 : 0)),
                                                        } as any
                                                        setSelectedLocation(updatedCheckIn)

                                                        try {
                                                            const apiStatus = newStatus === null ? "no" : "maybe"
                                                            await rsvpToCheckIn(checkIn.id, tenantId, tenantSlug, apiStatus)
                                                            // Dispatch sync event
                                                            window.dispatchEvent(new CustomEvent('rio-checkin-rsvp-sync', {
                                                                detail: { checkInId: checkIn.id, status: newStatus }
                                                            }))
                                                        } catch (error) {
                                                            console.error("Failed to RSVP:", error)
                                                            setSelectedLocation(checkIn)
                                                        }
                                                    }}
                                                >
                                                    ? Maybe
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Regular Location Card */
                                    <LocationInfoCard
                                        location={selectedLocation as any}
                                        onClose={() => setSelectedLocation(null)}
                                        tenantSlug={tenantSlug}
                                        variant="embedded"
                                    />
                                )}

                            </div>
                        )}

                        {!selectedLocation && highlightedCategories.size > 0 && (
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-xl">
                                        {`Showing ${Array.from(highlightedCategories)
                                            .map((c) => {
                                                const btn = categoryButtons.find(btn => btn.type === c)
                                                return btn ? btn.label : c.replace("_", " ")
                                            })
                                            .join(", ")}`}
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setHighlightedCategories(new Set())}
                                        className="text-gray-500 hover:text-gray-900"
                                    >
                                        Clear all
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {/* Check-ins List */}
                                    {highlightedCategories.has("checkin") && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                Active Check-ins
                                            </h3>
                                            {distributedCheckIns.length > 0 ? (
                                                distributedCheckIns.map((checkIn) => {
                                                    const startTime = new Date(checkIn.start_time!).getTime()
                                                    const durationMs = checkIn.duration_minutes! * 60 * 1000
                                                    const endTime = startTime + durationMs
                                                    const now = Date.now()
                                                    const timeRemaining = Math.max(0, endTime - now)

                                                    return (
                                                        <div
                                                            key={checkIn.id}
                                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                setSelectedLocation(checkIn)
                                                                focusOnLocation(checkIn)
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                                    📍
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">
                                                                        {checkIn.user?.full_name || "Neighbor"}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {checkIn.custom_location_name || checkIn.location?.name}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {timeRemaining > 0 && (
                                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                                    {Math.ceil(timeRemaining / (60 * 1000))}m left
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No active check-ins</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Other Categories List */}
                                    {Array.from(highlightedCategories)
                                        .filter((c) => c !== "checkin")
                                        .map((categoryType) => {
                                            const categoryLocations = locations.filter((loc) => loc.type === categoryType)
                                            if (categoryLocations.length === 0) return null

                                            return (
                                                <div key={categoryType} className="space-y-2">
                                                    {highlightedCategories.size > 1 && (
                                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                                                            {categoryButtons.find((c) => c.type === categoryType)?.label}
                                                        </h3>
                                                    )}
                                                    {categoryLocations.map((location) => (
                                                        <button
                                                            key={location.id}
                                                            onClick={() => {
                                                                hasUserInteracted.current = true
                                                                setSelectedLocation(location)
                                                                focusOnLocation(location)
                                                            }}
                                                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-gray-50 transition-all text-left"
                                                        >
                                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">
                                                                {categoryButtons.find((c) => c.type === location.type)?.icon}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{location.name}</div>
                                                                {location.neighborhood && (
                                                                    <div className="text-xs text-gray-500">{location.neighborhood.name}</div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
