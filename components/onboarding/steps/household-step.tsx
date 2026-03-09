"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, User, Dog, Upload, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ShimmerButton } from "@/components/library/shimmer-button"

interface HouseholdStepProps {
    onNext: (data: any) => void
    onBack: () => void
    onSave?: (data: any, silent?: boolean) => Promise<void>
    initialData?: any
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

export function HouseholdStep({ onNext, onBack, onSave, initialData }: HouseholdStepProps) {
    const [familyName, setFamilyName] = useState("")
    const [familyMembers, setFamilyMembers] = useState<any[]>([])
    const [pets, setPets] = useState<any[]>([])
    const [relationships, setRelationships] = useState<Record<string, string>>({})
    const [showAddPet, setShowAddPet] = useState(false)
    const [newPet, setNewPet] = useState({ name: "", species: "", breed: "", avatarUrl: "" })
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
    const { toast } = useToast()

    useEffect(() => {
        if (initialData) {
            setFamilyName(initialData.familyName || "")
            // Ensure we're setting arrays, even if empty
            setFamilyMembers(Array.isArray(initialData.familyMembers) ? initialData.familyMembers : [])
            setPets(Array.isArray(initialData.pets) ? initialData.pets : [])

            // Initialize relationships from initialData if available
            if (initialData.relationships) {
                setRelationships(initialData.relationships)
            }
        }
    }, [initialData])

    // ... handleRelationshipChange, handleFileChange, handleAddPet remain same ...

    const handleRelationshipChange = async (memberId: string, relationshipType: string) => {
        setRelationships(prev => ({ ...prev, [memberId]: relationshipType }))

        // Save relationship to database
        const supabase = createClient()

        // Check if relationship already exists
        const { data: existingRel } = await supabase
            .from("family_relationships")
            .select("id")
            .eq("user_id", initialData.userId)
            .eq("related_user_id", memberId)
            .maybeSingle()

        if (existingRel) {
            // Update existing relationship
            await supabase
                .from("family_relationships")
                .update({ relationship_type: relationshipType })
                .eq("id", existingRel.id)
        } else {
            // Create new relationship
            await supabase
                .from("family_relationships")
                .insert({
                    user_id: initialData.userId,
                    related_user_id: memberId,
                    relationship_type: relationshipType,
                    tenant_id: initialData.tenantId
                })
        }

        triggerAutoSave({}, false) // just update the save UI indicator
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image must be less than 10MB",
                variant: "destructive",
            })
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Upload failed")

            const { url } = await response.json()
            setNewPet(prev => ({ ...prev, avatarUrl: url }))

            toast({
                description: "Photo uploaded successfully",
            })
        } catch (error) {
            console.error("Upload error:", error)
            toast({
                title: "Upload failed",
                description: "Failed to upload image. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
            e.target.value = ""
        }
    }

    const handleAddPet = async () => {
        if (!newPet.name || !newPet.species) {
            toast({
                title: "Missing information",
                description: "Please provide at least a name and species",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        const supabase = createClient()

        try {
            const { data, error } = await supabase
                .from("pets")
                .insert({
                    name: newPet.name,
                    species: newPet.species,
                    breed: newPet.breed || null,
                    profile_picture_url: newPet.avatarUrl || null,
                    family_unit_id: initialData.familyUnitId,
                    lot_id: initialData.lotId,
                })
                .select()
                .single()

            if (error) throw error

            const formattedPet = {
                id: data.id,
                name: data.name,
                species: data.species,
                breed: data.breed,
                avatarUrl: data.profile_picture_url
            }

            setPets([...pets, formattedPet])
            setNewPet({ name: "", species: "", breed: "", avatarUrl: "" })
            setShowAddPet(false)

            triggerAutoSave({ pets: [...pets, formattedPet] }, false)

            toast({
                description: "Pet added successfully!",
            })
        } catch (error) {
            console.error("Error adding pet:", error)
            toast({
                title: "Error",
                description: "Failed to add pet. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const triggerAutoSave = async (overrides: any = {}, saveFamilyName: boolean = true) => {
        if (!onSave) return

        setSaveStatus('saving')
        try {
            const currentFamilyName = overrides.familyName !== undefined ? overrides.familyName : familyName;

            // Save family name if changed
            if (saveFamilyName && initialData?.familyUnitId && currentFamilyName !== initialData?.familyName) {
                const supabase = createClient()
                await supabase
                    .from("family_units")
                    .update({ name: currentFamilyName })
                    .eq("id", initialData.familyUnitId)
            }

            await onSave({
                familyMembers: overrides.familyMembers !== undefined ? overrides.familyMembers : familyMembers,
                pets: overrides.pets !== undefined ? overrides.pets : pets,
                relationships: overrides.relationships !== undefined ? overrides.relationships : relationships,
                familyName: currentFamilyName,
                ...overrides
            }, true)
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            setSaveStatus('idle')
        }
    }

    const handleNext = async () => {
        // Optional: Save family name if changed
        if (initialData.familyUnitId && familyName !== initialData.familyName) {
            const supabase = createClient()
            await supabase
                .from("family_units")
                .update({ name: familyName })
                .eq("id", initialData.familyUnitId)
        }

        onNext({ familyMembers, pets, relationships, familyName })
    }

    return (
        <>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-primary">Who's in your household?</h2>
                    <p className="text-muted-foreground">
                        Let neighbors know who they might meet
                    </p>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                    {/* Family Name Edit */}
                    <div className="space-y-2">
                        <Label htmlFor="familyName">Family Name</Label>
                        <Input
                            id="familyName"
                            value={familyName}
                            onChange={(e) => setFamilyName(e.target.value)}
                            onBlur={() => triggerAutoSave()}
                            placeholder="e.g. The Smiths"
                        />
                    </div>

                    {/* Family Members List */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Family Members</h3>

                        {familyMembers.length > 0 ? (
                            familyMembers.map((member: any) => (
                                <div key={member.id} className="p-4 border rounded-xl bg-card flex items-center gap-3 shadow-sm">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 overflow-hidden">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{member.name}</p>
                                    </div>
                                    <div className="w-36">
                                        <Select
                                            value={relationships[member.id] || ""}
                                            onValueChange={(value) => handleRelationshipChange(member.id, value)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Relationship" />
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
                            ))
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                <p>No other family members in your household</p>
                            </div>
                        )}
                    </div>

                    {/* Pets List */}
                    <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pets</h3>

                        {pets.length > 0 && pets.map((pet: any) => (
                            <div key={pet.id} className="p-4 border rounded-xl bg-card flex items-center gap-3 shadow-sm">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 overflow-hidden">
                                    {pet.avatarUrl ? (
                                        <img src={pet.avatarUrl} alt={pet.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Dog className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{pet.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{pet.species}{pet.breed && ` • ${pet.breed}`}</p>
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed h-12 gap-2 text-muted-foreground hover:text-primary hover:border-primary/50"
                            onClick={() => setShowAddPet(true)}
                        >
                            <Plus className="h-4 w-4" />
                            Add Pet
                        </Button>
                    </div>

                    <div className="sticky bottom-[-2rem] md:bottom-[-3rem] pt-4 pb-2 bg-background z-10 flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-1 w-full order-3 sm:order-1 flex items-center justify-center sm:justify-start">
                            {saveStatus === 'saving' && (
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" /> Saving...
                                </span>
                            )}
                            {saveStatus === 'saved' && (
                                <span className="text-sm text-muted-foreground">Saved</span>
                            )}
                        </div>
                        <Button type="button" variant="ghost" onClick={onBack} className="w-full sm:w-auto flex-1 order-1 sm:order-2 h-12">Back</Button>
                        <ShimmerButton type="button" onClick={handleNext} className="w-full sm:w-auto flex-1 order-2 sm:order-3 h-12" background="hsl(var(--primary))">
                            Continue
                        </ShimmerButton>
                    </div>
                </div>
            </div>

            {/* Add Pet Modal */}
            <Dialog open={showAddPet} onOpenChange={setShowAddPet}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Pet</DialogTitle>
                        <DialogDescription>
                            Add a new pet to your household
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Pet Photo Upload */}
                        <div className="space-y-2">
                            <Label>Pet Photo (Optional)</Label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                    {newPet.avatarUrl ? (
                                        <img src={newPet.avatarUrl} alt="Pet" className="h-full w-full object-cover" />
                                    ) : (
                                        <Dog className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="pet-photo-upload"
                                        disabled={isUploading}
                                    />
                                    <Label htmlFor="pet-photo-upload">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={isUploading}
                                            asChild
                                        >
                                            <span className="cursor-pointer">
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="mr-2 h-4 w-4" />
                                                        Upload Photo
                                                    </>
                                                )}
                                            </span>
                                        </Button>
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Pet Details */}
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

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleAddPet}
                                disabled={isLoading || !newPet.name || !newPet.species}
                                className="flex-1"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Pet
                            </Button>
                            <Button variant="ghost" onClick={() => {
                                setShowAddPet(false)
                                setNewPet({ name: "", species: "", breed: "", avatarUrl: "" })
                            }}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
