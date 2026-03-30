"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { updatePrivacySettings } from "@/app/actions/privacy-settings"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RioMemorySection } from "./rio-memory-section"

interface PrivacySettings {
  id: string
  user_id: string
  show_email: boolean
  show_phone: boolean
  show_birthday: boolean
  show_birth_country: boolean
  show_current_country: boolean
  show_languages: boolean
  show_preferred_language: boolean
  show_journey_stage: boolean
  show_estimated_move_in_date: boolean
  show_construction_dates: boolean
  show_neighborhood: boolean
  show_family: boolean
  show_family_relationships: boolean
  show_interests: boolean
  show_skills: boolean
  show_open_to_requests: boolean
}

interface PrivacySettingsFormProps {
  privacySettings: PrivacySettings
  tenantSlug: string
  rioEnabled?: boolean
}

export function PrivacySettingsForm({ privacySettings, tenantSlug, rioEnabled = false }: PrivacySettingsFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    showEmail: privacySettings?.show_email ?? true,
    showPhone: privacySettings?.show_phone ?? true,
    showBirthday: privacySettings?.show_birthday ?? true,
    showBirthCountry: privacySettings?.show_birth_country ?? true,
    showCurrentCountry: privacySettings?.show_current_country ?? true,
    showLanguages: privacySettings?.show_languages ?? true,
    showPreferredLanguage: privacySettings?.show_preferred_language ?? true,
    showJourneyStage: privacySettings?.show_journey_stage ?? true,
    showEstimatedMoveInDate: privacySettings?.show_estimated_move_in_date ?? true,
    showConstructionDates: privacySettings?.show_construction_dates ?? true,
    showNeighborhood: privacySettings?.show_neighborhood ?? true,
    showFamily: privacySettings?.show_family ?? true,
    showFamilyRelationships: privacySettings?.show_family_relationships ?? true,
    showInterests: privacySettings?.show_interests ?? true,
    showSkills: privacySettings?.show_skills ?? true,
    showOpenToRequests: privacySettings?.show_open_to_requests ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updatePrivacySettings({
        show_email: settings.showEmail,
        show_phone: settings.showPhone,
        show_birthday: settings.showBirthday,
        show_birth_country: settings.showBirthCountry,
        show_current_country: settings.showCurrentCountry,
        show_languages: settings.showLanguages,
        show_preferred_language: settings.showPreferredLanguage,
        show_journey_stage: settings.showJourneyStage,
        show_estimated_move_in_date: settings.showEstimatedMoveInDate,
        show_construction_dates: settings.showConstructionDates,
        show_family: settings.showFamily,
        show_family_relationships: settings.showFamilyRelationships,
        show_interests: settings.showInterests,
        show_skills: settings.showSkills,
        show_open_to_requests: settings.showOpenToRequests,
      })

      if (result.success) {
        toast({
          title: "Settings updated",
          description: "Your privacy preferences have been saved.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const privacyGroups = [
    {
      title: "Contact Information",
      description: "Control who can contact you",
      settings: [
        { key: "showEmail", label: "Show Email Address", value: settings.showEmail },
        { key: "showPhone", label: "Show Phone Number", value: settings.showPhone },
      ],
    },
    {
      title: "Personal Details",
      description: "Manage visibility of your personal info",
      settings: [
        { key: "showBirthday", label: "Show Birthday", value: settings.showBirthday },
        { key: "showBirthCountry", label: "Show Country of Origin", value: settings.showBirthCountry },
        { key: "showCurrentCountry", label: "Show Current Country", value: settings.showCurrentCountry },
        { key: "showLanguages", label: "Show Languages", value: settings.showLanguages },
      ],
    },
    {
      title: "Journey Information",
      description: "Share your progress in the community",
      settings: [
        { key: "showJourneyStage", label: "Show Journey Stage", value: settings.showJourneyStage },
        { key: "showEstimatedMoveInDate", label: "Show Move-in Date", value: settings.showEstimatedMoveInDate },
        { key: "showConstructionDates", label: "Show Construction Dates", value: settings.showConstructionDates },
      ],
    },
    {
      title: "Community & Family",
      description: "Manage family and community visibility",
      settings: [
        { key: "showFamily", label: "Show Family Members", value: settings.showFamily },
        { key: "showInterests", label: "Show Interests", value: settings.showInterests },
        { key: "showSkills", label: "Show Skills", value: settings.showSkills },
      ],
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Public Information</AlertTitle>
        <AlertDescription>
          Your name, profile picture, lot number, and neighborhood are always visible to other residents to help identify
          neighbors.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {privacyGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle className="text-lg">{group.title}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor={setting.key} className="text-base cursor-pointer">
                      {setting.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {setting.value ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Eye className="h-3 w-3" /> Visible to neighbors
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <EyeOff className="h-3 w-3" /> Hidden from neighbors
                        </span>
                      )}
                    </p>
                  </div>
                  <Switch
                    id={setting.key}
                    checked={setting.value}
                    onCheckedChange={(checked) => setSettings({ ...settings, [setting.key]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {rioEnabled && (
        <div className="mt-8">
          <RioMemorySection />
        </div>
      )}

      <div className="sticky bottom-6 flex justify-end pt-4">
        <Button type="submit" size="lg" className="shadow-lg" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Privacy Settings
        </Button>
      </div>
    </form>
  )
}
