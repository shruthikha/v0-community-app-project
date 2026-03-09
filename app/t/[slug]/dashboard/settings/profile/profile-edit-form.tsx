"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, X, Plus, AlertCircle, Mail, Phone, Languages, Lightbulb, Wrench, MapPin, User, MessageSquare, Calendar, Camera, Map as MapIcon, Search } from "lucide-react"
import { COUNTRIES, LANGUAGES } from "@/lib/data/countries-languages"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCreateInterest } from "@/hooks/use-create-interest"
import { updateProfileAction } from "@/app/actions/profile"
import { useToast } from "@/hooks/use-toast"
import { EditableProfileBanner } from "@/components/profile/editable-profile-banner"
import { MapPreviewWidget } from "@/components/map/map-preview-widget"
import { PhotoManager } from "@/components/photo-manager"
import { MultiSelect } from "@/components/ui/multi-select"
import { CollapsibleCard } from "@/components/ui/collapsible-card"
import { ProfileAnalytics, ErrorAnalytics } from "@/lib/analytics"

interface Resident {
  id: string
  tenant_id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  birthday: string | null
  birth_country: string | null
  current_country: string | null
  languages: string[] | null
  preferred_language: string | null
  photos: string[] | null
  hero_photo: string | null
  profile_picture_url: string | null
  banner_image_url: string | null
  about: string | null
  journey_stage: string | null
  estimated_move_in_date: string | null
  estimated_construction_start_date: string | null
  estimated_construction_end_date: string | null
  user_interests?: { interest_id: string }[]
  user_skills?: { skill_id: string; skills?: { name: string }; open_to_requests: boolean }[]
  lot_id?: string
  lots?: {
    lot_number: string
    neighborhoods?: {
      name: string
    }
  }
}

interface Tenant {
  features?: {
    interests?: boolean
  }
  map_center_coordinates?: {
    lat: number
    lng: number
  }
}

interface Interest {
  id: string
  name: string
  description?: string | null
  user_interests?: { count: number }[]
}

interface Skill {
  id: string
  name: string
  user_skills?: { count: number }[]
}

interface ProfileEditFormProps {
  resident: Resident
  tenant: Tenant
  availableInterests: Interest[]
  availableSkills: Skill[]
  tenantSlug: string
  locations?: any[]
  userEmail: string
  isSuperAdmin?: boolean
}

export function ProfileEditForm({
  resident,
  tenant,
  availableInterests,
  availableSkills,
  tenantSlug,
  locations = [],
  userEmail,
  isSuperAdmin = false,
}: ProfileEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const [formData, setFormData] = useState({
    firstName: resident.first_name || "",
    lastName: resident.last_name || "",
    phone: resident.phone || "",
    birthday: resident.birthday || "",
    birthCountry: resident.birth_country || "",
    currentCountry: resident.current_country || "",
    languages: resident.languages || [],
    preferredLanguage: resident.preferred_language || "",
    photos: resident.photos || [],
    heroPhoto: resident.hero_photo || resident.profile_picture_url || null,
    bannerImageUrl: resident.banner_image_url || null,
    about: resident.about || "",
    journeyStage: resident.journey_stage || "",
    estimatedMoveInDate: resident.estimated_move_in_date || "",
    estimatedConstructionStartDate: resident.estimated_construction_start_date || "",
    estimatedConstructionEndDate: resident.estimated_construction_end_date || "",
    selectedInterests: resident.user_interests?.map((ui) => ui.interest_id) || [],
    skills:
      resident.user_skills?.map((us) => ({
        skill_id: us.skill_id,
        skill_name: us.skills?.name || "",
        open_to_requests: us.open_to_requests || false,
      })) || [] as { skill_id?: string; skill_name: string; open_to_requests: boolean; isNew?: boolean }[],
    newSkill: "",
    languageSearch: "",
  })

  const latestFormData = React.useRef(formData)
  latestFormData.current = formData

  const inFlightSave = React.useRef(false)
  const pendingOverrides = React.useRef<Partial<typeof formData>>({})
  const saveStatusTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const persistedResident = React.useRef({
    about: resident.about,
    journeyStage: resident.journey_stage
  })

  // Inline interest search+create state
  const [allProfileInterests, setAllProfileInterests] = useState(availableInterests)
  const [interestSearch, setInterestSearch] = useState("")
  const [showInterestDropdown, setShowInterestDropdown] = useState(false)

  const { handleCreateInterest, isAddingInterest } = useCreateInterest({
    tenantId: resident.tenant_id,
    onSuccess: (newInterest) => {
      ProfileAnalytics.interestAdded(newInterest.name)
      setAllProfileInterests((prev) => [...prev, newInterest])
      setFormData((prev) => ({ ...prev, selectedInterests: [...prev.selectedInterests, newInterest.id] }))
      setInterestSearch("")
    }
  })

  const initials = [formData.firstName, formData.lastName]
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()


  const saveProfile = async (silent = false, overrides: Partial<typeof formData> = {}) => {
    if (!silent) setIsLoading(true)
    setSaveStatus("saving")
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current)
      saveStatusTimeoutRef.current = null
    }

    Object.assign(pendingOverrides.current, overrides)

    if (inFlightSave.current) {
      return
    }

    inFlightSave.current = true

    try {
      if (isSuperAdmin) {
        if (!silent) {
          toast({ title: "Success", description: "Profile updated successfully (test mode)!" })
          router.refresh()
        }
        setSaveStatus("saved")
        saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000)
        return
      }

      while (true) {
        const currentOverrides = { ...pendingOverrides.current }
        pendingOverrides.current = {}

        const dataToSave = { ...latestFormData.current, ...currentOverrides }
        Object.assign(latestFormData.current, currentOverrides)

        await updateProfileAction(resident.id, {
          firstName: dataToSave.firstName,
          lastName: dataToSave.lastName,
          phone: dataToSave.phone,
          birthday: dataToSave.birthday || null,
          birthCountry: dataToSave.birthCountry || null,
          currentCountry: dataToSave.currentCountry || null,
          about: dataToSave.about,
          languages: dataToSave.languages,
          preferredLanguage: dataToSave.preferredLanguage,
          journeyStage: dataToSave.journeyStage,
          estimatedMoveInDate: dataToSave.estimatedMoveInDate || null,
          estimatedConstructionStartDate: dataToSave.estimatedConstructionStartDate || null,
          estimatedConstructionEndDate: dataToSave.estimatedConstructionEndDate || null,
          photos: dataToSave.photos,
          heroPhoto: dataToSave.heroPhoto,
          bannerImageUrl: dataToSave.bannerImageUrl,
          userInterests: dataToSave.selectedInterests,
          userSkills: dataToSave.skills.map(s => ({
            id: s.skill_id || "",
            skill_name: s.skill_name!,
            open_to_requests: s.open_to_requests,
            isNew: (s as any).isNew !== undefined ? (s as any).isNew : !s.skill_id
          })),
          tenantId: resident.tenant_id,
          slug: tenantSlug,
        })

        if (dataToSave.about !== persistedResident.current.about) {
          ProfileAnalytics.aboutUpdated("bio")
          persistedResident.current.about = dataToSave.about
        }
        if (dataToSave.journeyStage !== persistedResident.current.journeyStage) {
          ProfileAnalytics.aboutUpdated("journey")
          persistedResident.current.journeyStage = dataToSave.journeyStage
        }

        if (Object.keys(pendingOverrides.current).length === 0) {
          break
        }
      }

      setSaveStatus("saved")
      saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000)

      if (!silent) {
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        })
        ProfileAnalytics.updated(["profile"])
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      ErrorAnalytics.actionFailed("update_profile", error instanceof Error ? error.message : "Unknown error")
      setSaveStatus("idle")
      if (!silent) {
        toast({
          title: "Error",
          description: error.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      inFlightSave.current = false
      if (!silent) setIsLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    await saveProfile(false)
  }

  const handleBannerChange = async (url: string | null) => {
    setFormData(prev => ({ ...prev, bannerImageUrl: url }))
    saveProfile(true, { bannerImageUrl: url })
  }

  const handleProfilePhotoChange = async (url: string | null) => {
    setFormData(prev => ({ ...prev, heroPhoto: url }))
    saveProfile(true, { heroPhoto: url })
  }

  const addLanguage = (language: string) => {
    if (language && !formData.languages.includes(language)) {
      const newLanguages = [...formData.languages, language]
      setFormData({ ...formData, languages: newLanguages, languageSearch: "" })
      saveProfile(true, { languages: newLanguages, languageSearch: "" })
      ProfileAnalytics.languageAdded(language)
    }
  }

  const removeLanguage = (language: string) => {
    const newLanguages = formData.languages.filter((l) => l !== language)
    setFormData({ ...formData, languages: newLanguages })
    saveProfile(true, { languages: newLanguages })
  }



  const toggleInterest = (interestId: string) => {
    const interest = allProfileInterests.find(i => i.id === interestId)
    if (formData.selectedInterests.includes(interestId)) {
      if (interest) ProfileAnalytics.interestRemoved(interest.name)
      const newInterests = formData.selectedInterests.filter(id => id !== interestId)
      setFormData((prev) => ({ ...prev, selectedInterests: newInterests }))
      saveProfile(true, { selectedInterests: newInterests })
    } else {
      if (interest) ProfileAnalytics.interestAdded(interest.name)
      const newInterests = [...formData.selectedInterests, interestId]
      setFormData((prev) => ({ ...prev, selectedInterests: newInterests }))
      saveProfile(true, { selectedInterests: newInterests })
    }
  }

  const addSkill = () => {
    const newSkillTrimmed = formData.newSkill.trim()
    if (newSkillTrimmed) {
      if (!formData.skills.some(s => s.skill_name.toLowerCase() === newSkillTrimmed.toLowerCase())) {
        ProfileAnalytics.skillAdded(newSkillTrimmed, false)
        const newSkills = [...formData.skills, { skill_name: newSkillTrimmed, open_to_requests: false }]
        setFormData({
          ...formData,
          skills: newSkills,
          newSkill: "",
        })
        saveProfile(true, { skills: newSkills, newSkill: "" })
      }
    }
  }

  const removeSkill = (index: number) => {
    const newSkills = formData.skills.filter((_: any, i: number) => i !== index)
    setFormData({
      ...formData,
      skills: newSkills,
    })
    saveProfile(true, { skills: newSkills })
    const skillName = formData.skills[index]?.skill_name
    if (skillName) {
      ProfileAnalytics.skillRemoved(skillName)
    }
  }

  const toggleSkillOpenToRequests = (index: number) => {
    const updatedSkills = [...formData.skills]
    updatedSkills[index].open_to_requests = !updatedSkills[index].open_to_requests
    setFormData({ ...formData, skills: updatedSkills })
    saveProfile(true, { skills: updatedSkills })
  }

  // Find the location for this resident's lot
  const lotLocation = locations?.find((loc) => loc.lot_id === resident.lot_id && loc.type === "lot")
  const mapCenter = tenant?.map_center_coordinates
    ? { lat: tenant.map_center_coordinates.lat, lng: tenant.map_center_coordinates.lng }
    : null

  const hasEmptyFields =
    !formData.firstName ||
    !formData.lastName ||
    !formData.phone ||
    !formData.birthday ||
    !formData.birthCountry ||
    !formData.currentCountry ||
    formData.languages.length === 0 ||
    !formData.preferredLanguage ||
    !formData.journeyStage

  return (
    <div className="space-y-6">
      <EditableProfileBanner
        bannerUrl={formData.bannerImageUrl}
        profileUrl={formData.heroPhoto}
        initials={initials}
        onBannerChange={handleBannerChange}
        onProfilePhotoChange={handleProfilePhotoChange}
      />

      {hasEmptyFields && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is incomplete. Fill in the missing information to help your neighbours get to know you better.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Identity & Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    onBlur={() => saveProfile(true)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    onBlur={() => saveProfile(true)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userEmail}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Contact your community administrator to change your email address</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-9"
                      placeholder="+1 (555) 000-0000"
                      onBlur={() => saveProfile(true)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* About */}
          <CollapsibleCard title="About" description="Tell your neighbors a bit about yourself" icon={MessageSquare} defaultOpen={false}>
            <Textarea
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              placeholder="I love gardening and community dinners..."
              rows={4}
              onBlur={() => saveProfile(true)} />
          </CollapsibleCard>

          {/* Personal Details */}
          <CollapsibleCard title="Personal Details" description="Your birthday and origin" icon={User}>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    onBlur={() => saveProfile(true)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthCountry">Country of Origin</Label>
                  <Combobox
                    options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                    value={formData.birthCountry}
                    onValueChange={(value) => {
                      setFormData({ ...formData, birthCountry: value })
                      saveProfile(true, { birthCountry: value })
                    }}
                    placeholder="Select country"
                    searchPlaceholder="Search countries..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentCountry">Current Country</Label>
                <Combobox
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                  value={formData.currentCountry}
                  onValueChange={(value) => {
                    setFormData({ ...formData, currentCountry: value })
                    saveProfile(true, { currentCountry: value })
                  }}
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                />
              </div>
            </div>
          </CollapsibleCard>

          {/* Languages */}
          <CollapsibleCard title="Languages" description="Languages you speak" icon={Languages} defaultOpen={false}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Languages You Speak</Label>
                <Combobox
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  value={formData.languageSearch}
                  onValueChange={(value) => {
                    addLanguage(value)
                  }}
                  placeholder="Add a language"
                  searchPlaceholder="Search languages..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.languages.map((language) => (
                    <Badge key={language} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                      {language}
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="ml-1 hover:text-destructive rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Combobox
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  value={formData.preferredLanguage}
                  onValueChange={(value) => {
                    setFormData({ ...formData, preferredLanguage: value })
                    saveProfile(true, { preferredLanguage: value })
                  }}
                  placeholder="Select preferred language"
                />
              </div>
            </div>
          </CollapsibleCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Journey Section */}
          <CollapsibleCard title="My Journey" description="Track your progress in the community" icon={Calendar} defaultOpen={false}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="journeyStage">Journey Stage *</Label>
                <Select
                  value={formData.journeyStage}
                  onValueChange={(value) => {
                    setFormData({ ...formData, journeyStage: value })
                    saveProfile(true, { journeyStage: value })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="arriving">Arriving</SelectItem>
                    <SelectItem value="integrating">Integrating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estimated Move-in Date</Label>
                <Input
                  type="date"
                  value={formData.estimatedMoveInDate}
                  onChange={(e) => setFormData({ ...formData, estimatedMoveInDate: e.target.value })}
                  onBlur={() => saveProfile(true)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Construction Start</Label>
                  <Input
                    type="date"
                    value={formData.estimatedConstructionStartDate}
                    onChange={(e) => setFormData({ ...formData, estimatedConstructionStartDate: e.target.value })}
                    onBlur={() => saveProfile(true)} />
                </div>
                <div className="space-y-2">
                  <Label>Construction End</Label>
                  <Input
                    type="date"
                    value={formData.estimatedConstructionEndDate}
                    onChange={(e) => setFormData({ ...formData, estimatedConstructionEndDate: e.target.value })}
                    onBlur={() => saveProfile(true)} />
                </div>
              </div>
            </div>
          </CollapsibleCard>

          {/* Interests */}
          {tenant?.features?.interests && (
            <CollapsibleCard title="Interests" description="Things you're passionate about" icon={Lightbulb} defaultOpen={false}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <p className="text-sm text-muted-foreground">Search for existing interests or create a new one</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search interests or type to create new..."
                    value={interestSearch}
                    onChange={(e) => setInterestSearch(e.target.value)}
                    onFocus={() => setShowInterestDropdown(true)}
                    onBlur={() => setTimeout(() => setShowInterestDropdown(false), 200)}
                    className="pl-9"
                  />

                  {showInterestDropdown && (() => {
                    const normalizedQuery = interestSearch.trim().toLowerCase()
                    const filtered = allProfileInterests.filter(
                      (i) => i.name.toLowerCase().includes(normalizedQuery) && !formData.selectedInterests.includes(i.id)
                    )
                    const exactMatch = allProfileInterests.find((i) => i.name.trim().toLowerCase() === normalizedQuery)
                    const showCreate = interestSearch.trim() && !exactMatch

                    return (
                      <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-auto">
                        {showCreate && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleCreateInterest(interestSearch.trim())
                            }}
                            disabled={isAddingInterest}
                            className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b flex items-center gap-2 bg-primary/5"
                          >
                            {isAddingInterest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            <span className="font-medium">Create &quot;{interestSearch.trim()}&quot;</span>
                          </button>
                        )}

                        {filtered.length > 0 && (
                          filtered.map((interest) => (
                            <button
                              key={interest.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                toggleInterest(interest.id)
                                setInterestSearch("")
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                            >
                              <div className="font-medium text-sm">{interest.name}</div>
                            </button>
                          ))
                        )}
                        {filtered.length === 0 && !showCreate && !isAddingInterest && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {interestSearch ? `No interests found matching "${interestSearch}"` : "No more interests available"}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {formData.selectedInterests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedInterests.map((interestId) => {
                      const interest = allProfileInterests.find(i => i.id === interestId)
                      return interest ? (
                        <Badge key={interestId} variant="secondary" className="flex items-center gap-1">
                          {interest.name}
                          <button type="button" onClick={() => toggleInterest(interestId)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </CollapsibleCard>
          )}

          {/* Skills */}
          <CollapsibleCard title="Skills" description="What you can help with" icon={Wrench} defaultOpen={false}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Skills</Label>
                <MultiSelect
                  options={availableSkills.map(s => ({ value: s.id, label: s.name }))}
                  selected={formData.skills.filter(s => s.skill_id).map(s => s.skill_id!)}
                  onChange={(selectedIds) => {
                    // Handle selection changes
                    // Keep existing skills that are still selected
                    const existingSkills = formData.skills.filter(s => s.skill_id && selectedIds.includes(s.skill_id))

                    // Find newly selected skills
                    const newIds = selectedIds.filter(id => !formData.skills.some(s => s.skill_id === id))
                    const newSkills = newIds.map(id => {
                      const skill = availableSkills.find(s => s.id === id)
                      return {
                        skill_id: id,
                        skill_name: skill?.name || "",
                        open_to_requests: false
                      }
                    })

                    // Keep custom skills (no skill_id)
                    const customSkills = formData.skills.filter(s => !s.skill_id)

                    const newSkillsList = [...existingSkills, ...newSkills, ...customSkills]
                    setFormData({
                      ...formData,
                      skills: newSkillsList
                    })
                    saveProfile(true, { skills: newSkillsList })
                  }}
                  placeholder="Select skills..."
                  searchPlaceholder="Search skills..."
                  emptyMessage="No skills found."
                />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a custom skill..."
                  value={formData.newSkill}
                  onChange={(e) => setFormData({ ...formData, newSkill: e.target.value })}
                  onBlur={() => saveProfile(true)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <span className="font-medium">{skill.skill_name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={skill.open_to_requests ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSkillOpenToRequests(index)}
                        className="text-xs h-7"
                      >
                        {skill.open_to_requests ? "Open to Help" : "Not Open"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSkill(index)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleCard>

          {/* Photo Gallery */}
          <CollapsibleCard title="Photo Gallery" description="Share photos of yourself and your life" icon={Camera} defaultOpen={false}>
            <PhotoManager
              photos={formData.photos}
              heroPhoto={formData.heroPhoto}
              onPhotosChange={(photos) => { setFormData({ ...formData, photos }); saveProfile(true, { photos }); }}
              onHeroPhotoChange={(heroPhoto) => { setFormData({ ...formData, heroPhoto }); saveProfile(true, { heroPhoto }); }}
              entityType="user"
              maxPhotos={10}
            />
          </CollapsibleCard>

          {/* Location Map */}
          {lotLocation && locations && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">My Location</Label>
                {resident.lots && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    Lot {resident.lots.lot_number}
                  </Badge>
                )}
              </div>
              <div className="rounded-xl overflow-hidden border shadow-sm">
                <MapPreviewWidget
                  tenantSlug={tenantSlug}
                  tenantId={resident.tenant_id}
                  locations={locations}
                  mapCenter={mapCenter}
                  highlightLocationId={lotLocation.id}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Location is managed by administrators
              </p>
            </div>
          )}

          {/* Save Button (Sticky on mobile or bottom of column) */}

          {/* Save Button (Sticky on mobile or bottom of column) */}
          <div className="sticky bottom-6 pt-4 flex flex-col items-center gap-2">
            <div className="flex w-full items-center gap-2">
              <Button type="submit" size="lg" className="flex-1 shadow-lg" disabled={isLoading || saveStatus === "saving"}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
            {saveStatus === "saving" && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs text-green-600 dark:text-green-400">All changes saved</span>}
          </div>

        </div>
      </form >
    </div >
  )
}
