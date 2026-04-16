"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Plus, Trash2, Users, PawPrint, Home, Upload, AlertCircle, Camera, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { createFamilyMember, addExistingFamilyMember, requestAccountAccess } from "@/app/actions/families"
import { PhotoManager } from "@/components/photo-manager"
import { EditableProfileBanner } from "@/components/profile/editable-profile-banner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CollapsibleCard } from "@/components/ui/collapsible-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FamilyManagementFormProps {
  resident: any
  familyUnit: any
  familyMembers: any[]
  relationships: any[]
  pets: any[]
  lotResidents: any[]
  lotData: LotData
  petsEnabled: boolean
  tenantSlug: string
  isPrimaryContact: boolean
}

type LotData = {
  id: string | null
  lot_number: string | null
  photos: string[]
  hero_photo: string | null
}

const RELATIONSHIP_TYPES = [
  { value: "spouse", label: "Spouse" },
  { value: "partner", label: "Partner" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "sibling", label: "Sibling" },
  { value: "child", label: "Child" },
  { value: "other", label: "Other" },
]

export function FamilyManagementForm({
  resident,
  familyUnit,
  familyMembers: initialFamilyMembers,
  relationships: initialRelationships,
  pets: initialPets,
  lotResidents,
  lotData,
  petsEnabled,
  tenantSlug,
  isPrimaryContact,
}: FamilyManagementFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers)
  const [relationships, setRelationships] = useState<Record<string, string>>(
    initialRelationships.reduce((acc, rel) => ({ ...acc, [rel.related_user_id]: rel.relationship_type }), {}),
  )
  const [pets, setPets] = useState(initialPets)
  const [newPet, setNewPet] = useState({ name: "", species: "", breed: "" })
  const [showAddPet, setShowAddPet] = useState(false)
  const [showAddFamily, setShowAddFamily] = useState(false)
  const [addMemberMode, setAddMemberMode] = useState<"existing" | "new">("new")
  const [selectedResident, setSelectedResident] = useState<string>("")
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    relationship: "",
    profilePictureUrl: "",
  })
  const [existingMemberRelationship, setExistingMemberRelationship] = useState<string>("")
  const [familyProfile, setFamilyProfile] = useState({
    name: familyUnit?.name || "",
    description: familyUnit?.description || "",
    photos: familyUnit?.photos || [],
    heroPhoto: familyUnit?.hero_photo || familyUnit?.profile_picture_url || null,
    bannerImage: familyUnit?.banner_image_url || null,
  })
  const [lotDataState, setLotDataState] = useState({
    id: lotData?.id || null,
    lotNumber: lotData?.lot_number || "",
    photos: lotData?.photos || [],
    heroPhoto: lotData?.hero_photo || null,
  })
  const [accessRequestDialog, setAccessRequestDialog] = useState<{
    open: boolean
    memberId: string | null
    memberName: string
    email: string
    isSubmitting: boolean
  }>({
    open: false,
    memberId: null,
    memberName: "",
    email: "",
    isSubmitting: false
  })

  useEffect(() => {
    setFamilyMembers(initialFamilyMembers)
    setRelationships(
      initialRelationships.reduce((acc, rel) => ({ ...acc, [rel.related_user_id]: rel.relationship_type }), {}),
    )
    setPets(initialPets)
    setFamilyProfile({
      name: familyUnit?.name || "",
      description: familyUnit?.description || "",
      photos: familyUnit?.photos || [],
      heroPhoto: familyUnit?.hero_photo || familyUnit?.profile_picture_url || null,
      bannerImage: familyUnit?.banner_image_url || null,
    })
  }, [initialFamilyMembers, initialRelationships, initialPets, familyUnit])

  // Sync lot data when it changes
  useEffect(() => {
    setLotDataState({
      id: lotData?.id ?? null,
      lotNumber: lotData?.lot_number ?? "",
      photos: lotData?.photos ?? [],
      heroPhoto: lotData?.hero_photo ?? null,
    })
  }, [lotData])

  const handleBannerChange = async (url: string | null) => {
    setFamilyProfile(prev => ({ ...prev, bannerImage: url }))
    const supabase = createClient()
    const { error } = await supabase
      .from("family_units")
      .update({ banner_image_url: url })
      .eq("id", familyUnit.id)

    if (error) {
      console.error("Error updating banner:", error)
      toast({
        title: "Error",
        description: "Failed to update banner image",
        variant: "destructive",
      })
    } else {
      router.refresh()
    }
  }

  const handleProfilePhotoChange = async (url: string | null) => {
    setFamilyProfile(prev => ({ ...prev, heroPhoto: url }))
    const supabase = createClient()
    const { error } = await supabase
      .from("family_units")
      .update({
        hero_photo: url,
        profile_picture_url: url
      })
      .eq("id", familyUnit.id)

    if (error) {
      console.error("Error updating profile photo:", error)
      toast({
        title: "Error",
        description: "Failed to update profile photo",
        variant: "destructive",
      })
    } else {
      router.refresh()
    }
  }

  const handleRelationshipChange = async (relatedUserId: string, relationshipType: string) => {
    setRelationships({ ...relationships, [relatedUserId]: relationshipType })

    const supabase = createClient()

    const existing = initialRelationships.find((r) => r.related_user_id === relatedUserId)

    if (existing) {
      const { error } = await supabase
        .from("family_relationships")
        .update({ relationship_type: relationshipType })
        .eq("id", existing.id)

      if (error) {
        console.error("[v0] Error updating relationship:", error)
      }
    } else {
      const { error } = await supabase.from("family_relationships").insert({
        user_id: resident.id,
        related_user_id: relatedUserId,
        relationship_type: relationshipType,
        tenant_id: resident.tenant_id,
      })

      if (error) {
        console.error("[v0] Error creating relationship:", error)
      }
    }

    router.refresh()
  }

  const handleAddPet = async () => {
    if (!newPet.name || !newPet.species) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("pets")
        .insert({
          name: newPet.name,
          species: newPet.species,
          breed: newPet.breed || null,
          family_unit_id: resident.family_unit_id,
          lot_id: resident.lot_id,
        })
        .select()
        .single()

      if (error) throw error

      setPets([...pets, data])
      setNewPet({ name: "", species: "", breed: "" })
      setShowAddPet(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error adding pet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePet = async (petId: string) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("pets").delete().eq("id", petId)

      if (error) throw error

      setPets(pets.filter((p) => p.id !== petId))
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting pet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFamilyMember = async () => {
    setIsLoading(true)

    try {
      if (addMemberMode === "existing") {
        if (!selectedResident) return

        const result = await addExistingFamilyMember(
          tenantSlug,
          resident.tenant_id,
          familyUnit.id,
          {
            residentId: selectedResident,
            relationshipType: existingMemberRelationship || undefined,
          }
        )

        if (!result.success) {
          throw new Error(result.error)
        }

      } else {
        // Create new member
        if (!newMember.firstName || !newMember.lastName) {
          toast({
            title: "Missing fields",
            description: "First and Last name are required.",
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }

        const result = await createFamilyMember(
          tenantSlug,
          resident.tenant_id,
          familyUnit.id,
          {
            firstName: newMember.firstName,
            lastName: newMember.lastName,
            email: newMember.email || undefined,
            phone: newMember.phone || undefined,
            birthday: newMember.birthday || undefined,
            relationshipType: newMember.relationship || undefined,
            profilePictureUrl: newMember.profilePictureUrl || undefined
          }
        )

        if (!result.success) {
          throw new Error(result.error)
        }
      }

      setShowAddFamily(false)
      setSelectedResident("")
      setExistingMemberRelationship("")
      setNewMember({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        birthday: "",
        relationship: "",
        profilePictureUrl: "",
      })
      router.refresh()
      toast({
        title: "Success",
        description: "Family member added successfully",
      })

    } catch (error: any) {
      console.error("[v0] Error adding family member:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add family member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAccess = async () => {
    if (!accessRequestDialog.memberId || !accessRequestDialog.email) return

    setAccessRequestDialog(prev => ({ ...prev, isSubmitting: true }))

    try {
      const result = await requestAccountAccess(
        tenantSlug,
        resident.tenant_id,
        accessRequestDialog.memberId,
        accessRequestDialog.email
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Request Submitted",
        description: `Access request for ${accessRequestDialog.memberName} has been sent to the admin.`,
      })

      setAccessRequestDialog({
        open: false,
        memberId: null,
        memberName: "",
        email: "",
        isSubmitting: false
      })
      router.refresh()

    } catch (error: any) {
      console.error("[v0] Error requesting access:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit access request",
        variant: "destructive",
      })
      setAccessRequestDialog(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const handleFamilyPhotosChange = async (photos: string[]) => {
    setFamilyProfile({ ...familyProfile, photos })

    const supabase = createClient()
    try {
      const updateData: { photos: string[]; hero_photo?: string | null; profile_picture_url?: string | null } = {
        photos,
      }

      if (familyProfile.heroPhoto && !photos.includes(familyProfile.heroPhoto)) {
        updateData.hero_photo = photos[0] || null
        updateData.profile_picture_url = photos[0] || null
        setFamilyProfile({ ...familyProfile, photos, heroPhoto: photos[0] || null })
      }

      const { error } = await supabase.from("family_units").update(updateData).eq("id", familyUnit.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Family photos updated successfully",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving family photos:", error)
      toast({
        title: "Save failed",
        description: "Failed to save photos. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFamilyHeroPhotoChange = async (heroPhoto: string | null) => {
    setFamilyProfile({ ...familyProfile, heroPhoto })

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("family_units")
        .update({
          hero_photo: heroPhoto,
          profile_picture_url: heroPhoto,
        })
        .eq("id", familyUnit.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving hero photo:", error)
      toast({
        title: "Save failed",
        description: "Failed to save hero photo. Please try again.",
        variant: "destructive",
      })
    }
  }

  // ===== HANDLERS FOR LOT PHOTOS =====
  const handleLotPhotosChange = async (photos: string[]) => {
    if (!lotDataState.id) return

    const previousPhotos = lotDataState.photos
    const previousHero = lotDataState.heroPhoto

    setLotDataState(prev => ({ ...prev, photos }))

    const supabase = createClient()
    try {
      const updateData: { photos: string[]; hero_photo?: string | null } = { photos }

      // If current hero was deleted, set first photo as new hero
      if (lotDataState.heroPhoto && !photos.includes(lotDataState.heroPhoto)) {
        updateData.hero_photo = photos[0] || null
        setLotDataState(prev => ({ ...prev, photos, heroPhoto: photos[0] || null }))
      }

      const { error } = await supabase.from("lots").update(updateData).eq("id", lotDataState.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Home photos updated successfully",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving lot photos:", error)
      toast({
        title: "Save failed",
        description: "Failed to save photos. Please try again.",
        variant: "destructive",
      })
      // Revert state on error
      setLotDataState(prev => ({ ...prev, photos: previousPhotos, heroPhoto: previousHero }))
    }
  }

  const handleLotHeroPhotoChange = async (heroPhoto: string | null) => {
    if (!lotDataState.id) return

    const previousHero = lotDataState.heroPhoto

    setLotDataState(prev => ({ ...prev, heroPhoto }))

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("lots")
        .update({ hero_photo: heroPhoto })
        .eq("id", lotDataState.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving lot hero photo:", error)
      toast({
        title: "Save failed",
        description: "Failed to save hero photo. Please try again.",
        variant: "destructive",
      })
      // Revert state on error
      setLotDataState(prev => ({ ...prev, heroPhoto: previousHero }))
    }
  }

  const handlePetPhotosChange = async (petId: string, photos: string[]) => {
    const pet = pets.find((p) => p.id === petId)
    const currentHeroPhoto = pet?.hero_photo || pet?.profile_picture_url || null

    // Immediately update local state for responsive UI
    setPets(
      pets.map((p) =>
        p.id === petId
          ? {
            ...p,
            photos,
          }
          : p,
      ),
    )

    const supabase = createClient()
    try {
      const updateData: { photos: string[]; hero_photo?: string | null; profile_picture_url?: string | null } = {
        photos,
      }

      // If hero photo was deleted, set first photo as new hero
      if (currentHeroPhoto && !photos.includes(currentHeroPhoto)) {
        updateData.hero_photo = photos[0] || null
        updateData.profile_picture_url = photos[0] || null

        // Update local state with new hero photo
        setPets(
          pets.map((p) =>
            p.id === petId
              ? {
                ...p,
                photos,
                hero_photo: photos[0] || null,
                profile_picture_url: photos[0] || null,
              }
              : p,
          ),
        )
      }

      const { error } = await supabase.from("pets").update(updateData).eq("id", petId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Pet photos updated successfully",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving pet photos:", error)
      toast({
        title: "Save failed",
        description: "Failed to save photos. Please try again.",
        variant: "destructive",
      })

      // Revert state on error
      setPets(
        pets.map((p) =>
          p.id === petId
            ? {
              ...p,
              photos: pet?.photos || [],
            }
            : p,
        ),
      )
    }
  }

  const handlePetHeroPhotoChange = async (petId: string, heroPhoto: string | null) => {
    const pet = pets.find((p) => p.id === petId)

    // Immediately update local state for responsive UI
    setPets(
      pets.map((p) =>
        p.id === petId
          ? {
            ...p,
            hero_photo: heroPhoto,
            profile_picture_url: heroPhoto,
          }
          : p,
      ),
    )

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("pets")
        .update({
          hero_photo: heroPhoto,
          profile_picture_url: heroPhoto,
        })
        .eq("id", petId)

      if (error) throw error

      toast({
        description: "Pet hero photo updated",
      })
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving pet hero photo:", error)
      toast({
        title: "Save failed",
        description: "Failed to save hero photo. Please try again.",
        variant: "destructive",
      })

      // Revert state on error
      setPets(
        pets.map((p) =>
          p.id === petId
            ? {
              ...p,
              hero_photo: pet?.hero_photo,
              profile_picture_url: pet?.profile_picture_url,
            }
            : p,
        ),
      )
    }
  }

  const availableLotResidents = lotResidents.filter((r) => !familyMembers.some((fm) => fm.id === r.id))

  const familyInitials =
    familyUnit?.name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"

  const handleUpdateFamilyDescription = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("family_units")
        .update({ description: familyProfile.description })
        .eq("id", familyUnit.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating family description:", error)
      toast({
        title: "Save failed",
        description: "Failed to update description. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Home Photos - Available to ANY resident with a lot (NOT family-dependent)
  const lotPhotosSection = lotDataState.id && (
    <CollapsibleCard title="Home Photos" description="Share photos of your home" icon={Home} defaultOpen={false}>
      <PhotoManager
        photos={lotDataState.photos}
        heroPhoto={lotDataState.heroPhoto}
        onPhotosChange={handleLotPhotosChange}
        onHeroPhotoChange={handleLotHeroPhotoChange}
        maxPhotos={10}
        entityType="lot"
      />
    </CollapsibleCard>
  )

  // Early return only blocks family-dependent UI, NOT lot photos
  if (!familyUnit) {
    return (
      <div className="space-y-6">
        {/* Lot photos available even without family unit */}
        {lotPhotosSection}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No family unit assigned yet. Contact your administrator to set up your family.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <EditableProfileBanner
        bannerUrl={familyProfile.bannerImage}
        profileUrl={familyProfile.heroPhoto}
        initials={familyInitials}
        onBannerChange={handleBannerChange}
        onProfilePhotoChange={handleProfilePhotoChange}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: Family Profile */}
        <div className="space-y-6">
          <CollapsibleCard title="Household Profile" description="Manage your household's public profile" icon={Home}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="family-name">Family Name</Label>
                <Input id="family-name" value={familyProfile.name} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Contact your administrator to change the family name</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="family-description">Family Description</Label>
                <Textarea
                  id="family-description"
                  placeholder="Tell your neighbours about your family..."
                  value={familyProfile.description}
                  onChange={(e) => setFamilyProfile({ ...familyProfile, description: e.target.value })}
                  rows={4}
                />
                <Button
                  type="button"
                  onClick={handleUpdateFamilyDescription}
                  disabled={isLoading}
                  size="sm"
                  className="mt-2"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Description
                </Button>
              </div>
            </div>
          </CollapsibleCard>

          {/* Family Photos */}
          <CollapsibleCard title="Household Photos" description="Share photos of your household" icon={Camera} defaultOpen={false}>
            <PhotoManager
              photos={familyProfile.photos}
              heroPhoto={familyProfile.heroPhoto}
              onPhotosChange={handleFamilyPhotosChange}
              onHeroPhotoChange={(url) => handleProfilePhotoChange(url)}
              maxPhotos={10}
              entityType="family"
            />
          </CollapsibleCard>

          {/* Lot Photos - Available to any resident with a lot (not family-dependent) */}
          {lotPhotosSection}
        </div>

        {/* RIGHT COLUMN: Members & Pets */}
        <div className="space-y-6">
          {/* Family Members */}
          <CollapsibleCard title="Family Members" description="Manage relationships" icon={Users}>
            {!showAddFamily && (
              <div className="mb-4 flex justify-end">
                <Button onClick={() => setShowAddFamily(true)}>
                  <Plus className="mr-2 h-4 w-4 sm:mr-0" />
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add Member</span>
                </Button>
              </div>
            )}
            {showAddFamily && (
              <div className="mb-4 space-y-3 rounded-lg border p-4 bg-muted/30">
                <Tabs value={addMemberMode} onValueChange={(v) => setAddMemberMode(v as "existing" | "new")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="new">Create New</TabsTrigger>
                    <TabsTrigger value="existing">Select Existing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="new" className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/30">
                          <AvatarImage src={newMember.profilePictureUrl || undefined} />
                          <AvatarFallback className="bg-muted">
                            {newMember.firstName ? newMember.firstName[0].toUpperCase() : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="member-avatar-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Camera className="h-5 w-5 text-white" />
                        </label>
                        <input
                          id="member-avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            const formData = new FormData()
                            formData.append("file", file)
                            formData.append("folder", "family-members")

                            try {
                              const response = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              })
                              const { url } = await response.json()
                              setNewMember({ ...newMember, profilePictureUrl: url })
                            } catch (error) {
                              console.error("Error uploading avatar:", error)
                              toast({
                                title: "Upload failed",
                                description: "Failed to upload photo. Please try again.",
                                variant: "destructive"
                              })
                            }
                          }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">Profile Photo</p>
                        <p className="text-xs">Optional. Hover to upload.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-firstname">First Name *</Label>
                        <Input
                          id="new-firstname"
                          placeholder="Jane"
                          value={newMember.firstName}
                          onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-lastname">Last Name *</Label>
                        <Input
                          id="new-lastname"
                          placeholder="Doe"
                          value={newMember.lastName}
                          onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-email">Email (Optional)</Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="Required for app access"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Leave blank for children or members who don't need app access.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-phone">Phone (Optional)</Label>
                        <Input
                          id="new-phone"
                          type="tel"
                          placeholder="+1..."
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-birthday">Birthday (Optional)</Label>
                        <Input
                          id="new-birthday"
                          type="date"
                          value={newMember.birthday}
                          onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-relationship">Relationship to You</Label>
                      <Select
                        value={newMember.relationship}
                        onValueChange={(val) => setNewMember({ ...newMember, relationship: val })}
                      >
                        <SelectTrigger id="new-relationship">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="existing" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resident-select">Select Neighbor from Lot</Label>
                      <Select value={selectedResident} onValueChange={setSelectedResident}>
                        <SelectTrigger id="resident-select">
                          <SelectValue placeholder="Choose a resident" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLotResidents.length > 0 ? (
                            availableLotResidents.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.first_name} {r.last_name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-xs text-muted-foreground text-center">
                              No other residents found in your lot.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Add someone who is already registered in your unit/lot.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="existing-relationship">Relationship to You</Label>
                      <Select
                        value={existingMemberRelationship}
                        onValueChange={setExistingMemberRelationship}
                      >
                        <SelectTrigger id="existing-relationship">
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddFamilyMember}
                    disabled={isLoading || (addMemberMode === 'existing' && !selectedResident) || (addMemberMode === 'new' && (!newMember.firstName || !newMember.lastName))}
                    size="sm"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {addMemberMode === 'new' ? 'Create Member' : 'Add Selected'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAddFamily(false)} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {familyMembers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No other family members added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={member.profile_picture_url} />
                      <AvatarFallback>{member.first_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email || "No email"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!member.email && isPrimaryContact && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setAccessRequestDialog({
                            open: true,
                            memberId: member.id,
                            memberName: `${member.first_name} ${member.last_name}`,
                            email: "",
                            isSubmitting: false
                          })}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                      )}
                      <Select
                        value={relationships[member.id] || ""}
                        onValueChange={(value) => handleRelationshipChange(member.id, value)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue placeholder="Relation" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>

          {/* Pets */}
          {petsEnabled && (
            <CollapsibleCard title="Household Pets" description="Manage household pets" icon={PawPrint}>
              {!showAddPet && (
                <div className="mb-4 flex justify-end">
                  <Button onClick={() => setShowAddPet(true)}>
                    <Plus className="mr-2 h-4 w-4 sm:mr-0" />
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add Pet</span>
                  </Button>
                </div>
              )}
              {showAddPet && (
                <div className="mb-4 space-y-4 rounded-lg border p-4 bg-muted/50">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pet-name">Name</Label>
                      <Input
                        id="pet-name"
                        value={newPet.name}
                        onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                        placeholder="Pet's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pet-species">Species</Label>
                      <Select
                        value={newPet.species}
                        onValueChange={(value) => setNewPet({ ...newPet, species: value })}
                      >
                        <SelectTrigger id="pet-species">
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dog">Dog</SelectItem>
                          <SelectItem value="Cat">Cat</SelectItem>
                          <SelectItem value="Bird">Bird</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="pet-breed">Breed (Optional)</Label>
                      <Input
                        id="pet-breed"
                        value={newPet.breed}
                        onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                        placeholder="e.g. Golden Retriever"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddPet} disabled={isLoading || !newPet.name || !newPet.species}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <span className="sm:hidden">Add</span>
                      <span className="hidden sm:inline">Add Pet</span>
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddPet(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {pets.length === 0 && !showAddPet ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No pets added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pets.map((pet) => {
                    const petInitials = pet.name.slice(0, 2).toUpperCase()
                    const petHeroPhoto = pet.hero_photo || pet.profile_picture_url || null
                    const petPhotos = Array.isArray(pet.photos) ? pet.photos : []

                    return (
                      <Card key={pet.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between p-4 bg-muted/30">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-background">
                                <AvatarImage src={petHeroPhoto || "/placeholder.svg"} />
                                <AvatarFallback>{petInitials}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-semibold line-clamp-2">{pet.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {pet.species} {pet.breed && `• ${pet.breed}`}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePet(pet.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-4 pt-0">
                            <PhotoManager
                              photos={petPhotos}
                              heroPhoto={petHeroPhoto}
                              onPhotosChange={(photos) => handlePetPhotosChange(pet.id, photos)}
                              onHeroPhotoChange={(heroPhoto) => handlePetHeroPhotoChange(pet.id, heroPhoto)}
                              maxPhotos={5}
                              entityType="pet"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CollapsibleCard>
          )}
        </div>
      </div>

      {/* Request Access Dialog */}
      <Dialog
        open={accessRequestDialog.open}
        onOpenChange={(open) => !accessRequestDialog.isSubmitting && setAccessRequestDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request App Access</DialogTitle>
            <DialogDescription>
              Request app access for {accessRequestDialog.memberName}. Enter an email address where they can receive their invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="access-email">Email Address</Label>
              <Input
                id="access-email"
                type="email"
                placeholder="email@example.com"
                value={accessRequestDialog.email}
                onChange={(e) => setAccessRequestDialog(prev => ({ ...prev, email: e.target.value }))}
                disabled={accessRequestDialog.isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                An admin will review this request and send an invitation to this email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAccessRequestDialog(prev => ({ ...prev, open: false }))}
              disabled={accessRequestDialog.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestAccess}
              disabled={!accessRequestDialog.email || accessRequestDialog.isSubmitting}
            >
              {accessRequestDialog.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
