"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

type Tenant = {
  id: string
  name: string
  resident_visibility_scope?: "neighborhood" | "tenant"
  features?: {
    neighborhoods?: boolean
    interests?: boolean
    skills?: boolean
    pets?: boolean
    families?: boolean
    lots?: boolean
    journey_stages?: boolean
    onboarding?: boolean
    map?: boolean
    location_types?: {
      facility?: boolean
      lot?: boolean
      walking_path?: boolean
      neighborhood?: boolean
      boundary?: boolean
      protection_zone?: boolean
      easement?: boolean
      playground?: boolean
      public_street?: boolean
      green_area?: boolean
      recreational_zone?: boolean
    }
    rio?: {
      enabled: boolean
      rag: boolean
      memory: boolean
      actions: boolean
    }
  }
  events_enabled?: boolean
  checkins_enabled?: boolean
  exchange_enabled?: boolean
  requests_enabled?: boolean
  announcements_enabled?: boolean
  documents_enabled?: boolean
  neighbor_lists_enabled?: boolean
  reservations_enabled?: boolean
  access_requests_enabled?: boolean
}

type Feature = {
  key: string
  label: string
  description: string
} & (
    | { table: string; checkField?: never }
    | { checkField: string | null; table?: never }
  )

const FEATURES: Feature[] = [
  {
    key: "neighborhoods",
    label: "Neighborhoods",
    description: "Enable multi-neighborhood support for this community",
    table: "neighborhoods",
  },
  {
    key: "lots",
    label: "Lots",
    description: "Enable property lot management (disable for apartments/condos)",
    table: "lots",
  },
  {
    key: "families",
    label: "Family Units",
    description: "Allow grouping residents into family units",
    table: "family_units",
  },
  {
    key: "neighbor_lists",
    label: "Neighbor Lists",
    description: "Allow residents to create custom lists of neighbors",
    table: "neighbor_lists",
  },
  {
    key: "pets",
    label: "Pets",
    description: "Enable pet registration and tracking",
    table: "pets",
  },
  {
    key: "interests",
    label: "Interests",
    description: "Allow residents to select and share community interests",
    table: "interests",
  },
  {
    key: "skills",
    label: "Skills",
    description: "Enable skills marketplace where residents can offer help",
    table: "skills",
  },
  {
    key: "journey_stages",
    label: "Journey Stages",
    description: "Track resident move-in journey stages (planning, building, arriving, integrating)",
    checkField: "journey_stage",
  },
  {
    key: "onboarding",
    label: "Onboarding Flow",
    description: "Enable guided onboarding for new residents (disable to use simple profile editing)",
    checkField: null,
  },
  {
    key: "map",
    label: "Community Map",
    description: "Enable interactive community map with locations and boundaries",
    table: "locations",
  },
  {
    key: "events",
    label: "Events",
    description: "Enable community events with calendar, RSVPs, and event management",
    table: "events",
  },
  {
    key: "checkins",
    label: "Check-ins",
    description: "Enable spontaneous location-based check-ins for real-time community engagement",
    table: "check_ins",
  },
  {
    key: "reservations",
    label: "Reservations",
    description: "Enable facility reservations for residents",
    table: "reservations",
  },
  {
    key: "exchange",
    label: "Exchange Directory",
    description: "Enable community exchange for sharing tools, services, food, rides, and rentals",
    table: "exchange_listings",
  },
  {
    key: "requests",
    label: "Resident Requests",
    description: "Enable resident-submitted requests for maintenance, complaints, questions, and safety issues",
    table: "resident_requests",
  },
  {
    key: "announcements",
    label: "Announcements",
    description: "Enable community announcements for important updates, events, and news",
    table: "announcements",
  },
  {
    key: "documents",
    label: "Document Library",
    description: "Enable official document library for community regulations, HOA documents, and resources",
    table: "documents",
  },
  {
    key: "access_requests",
    label: "Access Requests",
    description: "Allow new residents to request community access from the login page",
    table: "access_requests",
  },
]

const LOCATION_TYPE_OPTIONS = [
  { key: "facility", label: "Facilities", description: "Community amenities like pools, clubs, offices" },
  { key: "lot", label: "Lots", description: "Property boundaries and lot markers" },
  { key: "walking_path", label: "Walking Paths", description: "Trails and pathways" },
  { key: "neighborhood", label: "Neighborhoods", description: "Neighborhood boundaries" },
  { key: "boundary", label: "Community Boundary", description: "Overall community boundary" },
  { key: "protection_zone", label: "Protection Zones", description: "Protected areas" },
  { key: "easement", label: "Easements", description: "Utility and access easements" },
  { key: "playground", label: "Playgrounds", description: "Play areas" },
  { key: "public_street", label: "Public Streets", description: "Roads and streets" },
  { key: "green_area", label: "Green Areas", description: "Parks and green spaces" },
  { key: "recreational_zone", label: "Recreational Zones", description: "Sports and recreation areas" },
] as const

export default function TenantFeaturesForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const defaultFeatures = {
    neighborhoods: true,
    interests: true,
    skills: true,
    pets: true,
    families: true,
    lots: true,
    journey_stages: true,
    onboarding: true,
    map: true,
    events: false,
    checkins: false,
    reservations: false,
    exchange: false,
    requests: true,
    announcements: true,
    location_types: {
      facility: true,
      lot: true,
      walking_path: true,
      neighborhood: true,
      boundary: true,
      protection_zone: true,
      easement: true,
      playground: true,
      public_street: true,
      green_area: true,
      recreational_zone: true,
    },
    rio: {
      enabled: false,
      rag: false,
      memory: false,
      actions: false,
    },
  }

  const [features, setFeatures] = useState<{
    neighborhoods?: boolean
    interests?: boolean
    skills?: boolean
    pets?: boolean
    families?: boolean
    lots?: boolean
    journey_stages?: boolean
    onboarding?: boolean
    map?: boolean
    events?: boolean
    checkins?: boolean
    reservations?: boolean
    exchange?: boolean
    requests?: boolean
    announcements?: boolean
    documents?: boolean
    access_requests?: boolean
    location_types?: {
      facility?: boolean
      lot?: boolean
      walking_path?: boolean
      neighborhood?: boolean
      boundary?: boolean
      protection_zone?: boolean
      easement?: boolean
      playground?: boolean
      public_street?: boolean
      green_area?: boolean
      recreational_zone?: boolean
    }
    rio?: {
      enabled: boolean
      rag: boolean
      memory: boolean
      actions: boolean
    }
  }>({
    ...defaultFeatures,
    ...tenant.features,
    events: tenant.events_enabled ?? false,
    checkins: tenant.checkins_enabled ?? false,
    reservations: tenant.reservations_enabled ?? false,
    exchange: tenant.exchange_enabled ?? false,
    requests: tenant.requests_enabled ?? true,
    announcements: tenant.announcements_enabled ?? true,
    documents: tenant.documents_enabled ?? true,
    access_requests: tenant.access_requests_enabled ?? true,
    location_types: {
      ...defaultFeatures.location_types,
      ...(tenant.features?.location_types || {}),
    },
  })

  const [visibilityScope, setVisibilityScope] = useState<"neighborhood" | "tenant">(
    tenant.resident_visibility_scope || "tenant",
  )

  const getFeatureValue = (key: string): boolean => {
    if (key === "location_types") return false
    const val = features[key as keyof typeof features]
    if (typeof val === "boolean") return val
    return true
  }

  const handleToggle = async (featureKey: string, enabled: boolean) => {
    if (featureKey === "map" && !enabled) {
      const feature = FEATURES.find((f) => f.key === featureKey)
      if (feature?.table) {
        const { count, error } = await supabase
          .from(feature.table)
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)

        if (count && count > 0) {
          toast({
            variant: "destructive",
            title: "Cannot disable feature",
            description: `Cannot disable ${feature.label} because there are ${count} existing records. Please delete all ${feature.label.toLowerCase()} first.`,
          })
          return
        }
      }

      setFeatures((prev) => ({
        ...prev,
        map: false,
        location_types: {
          facility: false,
          lot: false,
          walking_path: false,
          neighborhood: false,
          boundary: false,
          protection_zone: false,
          easement: false,
          playground: false,
          public_street: false,
          green_area: false,
          recreational_zone: false,
        },
      }))
      return
    }

    if (featureKey === "map" && enabled) {
      setFeatures((prev) => ({
        ...prev,
        map: true,
        location_types: {
          facility: true,
          lot: true,
          walking_path: true,
          neighborhood: true,
          boundary: true,
          protection_zone: true,
          easement: true,
          playground: true,
          public_street: true,
          green_area: true,
          recreational_zone: true,
        },
      }))
      return
    }

    if (!enabled) {
      const feature = FEATURES.find((f) => f.key === featureKey)
      if (feature) {
        if (feature.table) {
          const { count, error } = await supabase
            .from(feature.table)
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenant.id)

          if (count && count > 0) {
            toast({
              variant: "destructive",
              title: "Cannot disable feature",
              description: `Cannot disable ${feature.label} because there are ${count} existing records. Please delete all ${feature.label.toLowerCase()} first.`,
            })
            return
          }
        } else if (feature.checkField) {
          const { count, error } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "resident")
            .eq("tenant_id", tenant.id)
            .not(feature.checkField, "is", null)

          if (count && count > 0) {
            toast({
              variant: "destructive",
              title: "Cannot disable feature",
              description: `Cannot disable ${feature.label} because ${count} residents have this data set. Please clear the data first.`,
            })
            return
          }
        }
      }
    }

    setFeatures((prev) => ({ ...prev, [featureKey]: enabled }))
  }

  const handleLocationTypeToggle = (typeKey: string, enabled: boolean) => {
    setFeatures((prev) => ({
      ...prev,
      location_types: {
        ...(prev.location_types || {}),
        [typeKey]: enabled,
      },
    }))
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const {
        events,
        checkins,
        exchange,
        requests,
        announcements,
        documents,
        reservations,
        access_requests,
        rio,
        ...otherFeatures
      } = features

      const wasEventsEnabled = tenant.events_enabled ?? false
      const willEnableEvents = !wasEventsEnabled && (events ?? false)

      const wasExchangeEnabled = tenant.exchange_enabled ?? false
      const willEnableExchange = !wasExchangeEnabled && (exchange ?? false)

      const { error } = await supabase
        .from("tenants")
        .update({
          resident_visibility_scope: visibilityScope,
          events_enabled: events ?? false,
          checkins_enabled: checkins ?? false,
          exchange_enabled: exchange ?? false,
          requests_enabled: requests ?? true,
          announcements_enabled: announcements ?? true,
          documents_enabled: documents ?? true,
          reservations_enabled: reservations ?? false,
          access_requests_enabled: access_requests ?? true,
          features: {
            ...otherFeatures,
            rio: rio || { enabled: false, rag: false, memory: false, actions: false }
          }
        })
        .eq("id", tenant.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save features",
        })
        return
      }

      if (willEnableEvents) {
        try {
          const response = await fetch("/api/seed-event-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId: tenant.id }),
          })

          if (!response.ok) {
            console.error("Failed to seed event categories")
          } else {
            const result = await response.json()
            console.log("Seeded categories:", result)
          }
        } catch (seedError) {
          console.error("Error seeding categories:", seedError)
        }
      }

      if (willEnableExchange) {
        try {
          const response = await fetch("/api/seed-exchange-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId: tenant.id }),
          })

          if (!response.ok) {
            console.error("Failed to seed exchange categories")
          } else {
            const result = await response.json()
            console.log("Seeded exchange categories:", result)
          }
        } catch (seedError) {
          console.error("Error seeding exchange categories:", seedError)
        }
      }

      toast({
        title: "Success",
        description: "Features updated successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Control which features are available for this tenant. Features cannot be disabled if data exists.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Community Structure</h3>
          {FEATURES.filter((f) => ["neighborhoods", "lots", "families"].includes(f.key)).map((feature) => (
            <div key={feature.key} className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.key}
                checked={getFeatureValue(feature.key)}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Community Features</h3>
          {FEATURES.filter((f) => ["pets", "interests", "skills", "events", "checkins", "exchange", "requests", "announcements", "documents", "neighbor_lists", "reservations", "access_requests"].includes(f.key)).map(
            (feature) => (
              <div key={feature.key} className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor={feature.key} className="text-base font-medium">
                    {feature.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Switch
                  id={feature.key}
                  checked={getFeatureValue(feature.key)}
                  onCheckedChange={(checked) => handleToggle(feature.key, checked)}
                />
              </div>
            ),
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Resident Experience</h3>
          {FEATURES.filter((f) => ["journey_stages", "onboarding"].includes(f.key)).map((feature) => (
            <div key={feature.key} className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.key}
                checked={getFeatureValue(feature.key)}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Map & Locations</h3>
          {FEATURES.filter((f) => f.key === "map").map((feature) => (
            <div key={feature.key} className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={feature.key} className="text-base font-medium">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <Switch
                id={feature.key}
                checked={features.map ?? true}
                onCheckedChange={(checked) => handleToggle(feature.key, checked)}
              />
            </div>
          ))}

          {features.map && (
            <div className="ml-6 space-y-3 pt-2">
              <Label className="text-sm font-medium">Active Location Types</Label>
              <p className="text-sm text-muted-foreground">Select which location types are available on the map</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LOCATION_TYPE_OPTIONS.map((locationType) => (
                  <div key={locationType.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={`location-type-${locationType.key}`}
                      checked={
                        features.location_types?.[locationType.key as keyof typeof features.location_types] ?? true
                      }
                      onCheckedChange={(checked) => handleLocationTypeToggle(locationType.key, checked as boolean)}
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={`location-type-${locationType.key}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {locationType.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{locationType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-amber-600">AI & Assistant (Beta)</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">INTERNAL ONLY</span>
              </div>
              <Label htmlFor="rio-enabled" className="text-base font-medium">
                Río AI (Beta)
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable the persistent AI assistant. Includes document-based retrieval (RAG) and user memory capabilities. Actions/Tools are currently disabled.
              </p>
            </div>
            <Switch
              id="rio-enabled"
              checked={features.rio?.enabled ?? false}
              onCheckedChange={(checked) => {
                setFeatures(prev => ({
                  ...prev,
                  rio: {
                    enabled: checked,
                    rag: checked,
                    memory: checked,
                    actions: false
                  }
                }))
              }}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">Privacy & Visibility</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">Resident Directory Scope</Label>
              <p className="text-sm text-muted-foreground">
                Control which residents can see each other in the community directory
              </p>
            </div>
            <RadioGroup
              value={visibilityScope}
              onValueChange={(value) => setVisibilityScope(value as "neighborhood" | "tenant")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant" id="tenant" />
                <Label htmlFor="tenant" className="font-normal cursor-pointer">
                  <span className="font-medium">Entire Community</span>
                  <span className="text-sm text-muted-foreground block">
                    Residents can see all other residents across all neighborhoods
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neighborhood" id="neighborhood" />
                <Label htmlFor="neighborhood" className="font-normal cursor-pointer">
                  <span className="font-medium">Neighborhood Only</span>
                  <span className="text-sm text-muted-foreground block">
                    Residents can only see other residents in their own neighborhood
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
