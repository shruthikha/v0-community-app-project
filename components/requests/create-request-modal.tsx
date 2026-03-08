"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowLeft, ArrowRight, Check, Wrench, HelpCircle, AlertTriangle, Shield, MessageSquare, MoreHorizontal, MapPin, Image as ImageIcon } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRioFeedback } from "@/components/feedback/rio-feedback-provider"
import { createResidentRequest } from "@/app/actions/resident-requests"
import { LocationSelector } from "@/components/event-forms/location-selector"
import { PhotoManager } from "@/components/photo-manager"
import { RequestTypeIcon } from "./request-type-icon"
import { ResidentPetSelector } from "./resident-pet-selector"
import { StepProgress } from "@/components/exchange/create-listing-steps/step-progress"
import { cn } from "@/lib/utils"
import type { RequestType, RequestPriority } from "@/types/requests"
import { RequestsAnalytics, ErrorAnalytics } from "@/lib/analytics"

interface CreateRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantSlug: string
  tenantId: string
  defaultType?: RequestType
}

const requestTypes: { value: RequestType; title: string; description: string; icon: any; emoji: string }[] = [
  { value: 'maintenance', title: 'Maintenance', description: 'Fixing or repair needed', icon: Wrench, emoji: '🔧' },
  { value: 'question', title: 'Question', description: 'Policies or info', icon: HelpCircle, emoji: '❓' },
  { value: 'complaint', title: 'Complaint', description: 'Issues or concerns', icon: AlertTriangle, emoji: '📢' },
  { value: 'safety', title: 'Safety Issue', description: 'Urgent safety concerns', icon: Shield, emoji: '🛡️' },
  { value: 'other', title: 'Other', description: 'Anything else', icon: MoreHorizontal, emoji: '📝' },
]

const steps = [
  { id: 'category', title: 'Category' },
  { id: 'details', title: 'Details' },
  { id: 'context', title: 'Location & Photos' },
  { id: 'review', title: 'Review' },
]

export function CreateRequestModal({
  open,
  onOpenChange,
  tenantSlug,
  tenantId,
  defaultType,
}: CreateRequestModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { showFeedback } = useRioFeedback()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [communityLocationName, setCommunityLocationName] = useState<string>("")

  const [formData, setFormData] = useState({
    request_type: defaultType || null as RequestType | null,
    title: "",
    description: "",
    priority: "normal" as RequestPriority,
    location_type: "none" as "community" | "custom" | "none",
    location_id: null as string | null,
    custom_location_name: "",
    custom_location_lat: null as number | null,
    custom_location_lng: null as number | null,
    community_location_name: "" as string, // Store name directly
    is_anonymous: false,
    is_public: false,
    images: [] as string[],
    tagged_resident_ids: [] as string[],
    tagged_pet_ids: [] as string[],
  })

  // Reset state when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setStep(defaultType ? 1 : 0)
      setFormData(prev => ({ ...prev, request_type: defaultType || null }))
    }
    onOpenChange(newOpen)
  }

  const handleNext = () => {
    if (step === 0 && !formData.request_type) return
    if (step === 1) {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast({ title: "Please fill in all required fields", variant: "destructive" })
        return
      }
    }
    if (step === 2) {
      // Location step validation if needed
    }
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const effectiveIsPublic = formData.is_anonymous ? false :
    formData.request_type && ['maintenance', 'safety'].includes(formData.request_type) ? true :
      formData.request_type && ['complaint', 'account_access'].includes(formData.request_type) ? false :
        formData.is_public;

  const handleSubmit = async () => {
    if (!formData.request_type) return
    setIsSubmitting(true)

    try {
      const requestData = {
        title: formData.title.trim(),
        request_type: formData.request_type,
        description: formData.description.trim(),
        priority: formData.priority,
        location_type: formData.location_type === "none" ? null : formData.location_type,
        location_id: formData.location_type === "community" ? formData.location_id : null,
        custom_location_name: formData.location_type === "custom" ? formData.custom_location_name : null,
        custom_location_lat: formData.location_type === "custom" ? formData.custom_location_lat : null,
        custom_location_lng: formData.location_type === "custom" ? formData.custom_location_lng : null,
        is_anonymous: formData.is_anonymous,
        is_public: effectiveIsPublic,
        images: formData.images,
        tagged_resident_ids: formData.tagged_resident_ids,
        tagged_pet_ids: formData.tagged_pet_ids,
      }

      const result = await createResidentRequest(tenantId, tenantSlug, requestData)

      if (result.success) {
        RequestsAnalytics.submitted({
          type: formData.request_type as 'maintenance' | 'safety' | 'general',
          type_label: requestTypes.find(t => t.value === formData.request_type)?.title || 'Unknown',
          priority: formData.priority
        })
        showFeedback({
          title: "Request Submitted",
          description: "Your request has been sent to the community administration. We'll get back to you soon.",
          variant: "success",
          image: "/rio/rio_taking_request.png"
        })
        onOpenChange(false)
        router.refresh()
        // Reset form
        setStep(0)
        setFormData({
          request_type: null,
          title: "",
          description: "",
          priority: "normal",
          location_type: "none",
          location_id: null,
          custom_location_name: "",
          custom_location_lat: null,
          custom_location_lng: null,
          community_location_name: "",
          is_anonymous: false,
          is_public: false,
          images: [],
          tagged_resident_ids: [],
          tagged_pet_ids: [],
        })
      } else {
        showFeedback({
          title: "Couldn't submit request",
          description: result.error || "Something went wrong. Please try again.",
          variant: "error",
          image: "/rio/rio_no_results_confused.png"
        })
      }
    } catch (error) {
      console.error("[v0] Request submission error:", error)
      showFeedback({
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
        image: "/rio/rio_no_results_confused.png"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Effect to ensure location name is fetched for review step
  useEffect(() => {
    if (step === 3 && formData.location_type === 'community' && formData.location_id && !formData.community_location_name) {
      fetch(`/api/locations/${formData.location_id}?tenantId=${tenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data.location) {
            setFormData(prev => ({ ...prev, community_location_name: data.location.name }));
          }
        })
        .catch(err => console.error("Error fetching location name:", err));
    }
  }, [step, formData.location_type, formData.location_id, formData.community_location_name, tenantId])

  const renderStepContent = () => {
    switch (step) {
      case 0: // Category
        return (
          <div className="grid grid-cols-2 gap-3 py-4">
            {requestTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setFormData(prev => ({ ...prev, request_type: type.value }))
                  setStep(1)
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:border-primary hover:bg-primary/5 h-full",
                  formData.request_type === type.value ? "border-primary bg-primary/5" : "border-muted bg-card"
                )}
              >
                <div className="text-3xl mb-2">
                  {type.emoji}
                </div>
                <span className="font-semibold text-sm text-center leading-tight">{type.title}</span>
                <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">{type.description}</span>
              </button>
            ))}
          </div>
        )

      case 1: // Details
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="Brief summary of your request"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="description"
                placeholder="Please provide details..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
              />
            </div>
            <div className="space-y-3">
              <Label>Priority</Label>
              <RadioGroup
                value={formData.priority}
                onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val as RequestPriority }))}
                className="grid grid-cols-3 gap-4"
              >
                {['normal', 'urgent', 'emergency'].map((p) => (
                  <div key={p}>
                    <RadioGroupItem value={p} id={p} className="peer sr-only" />
                    <Label
                      htmlFor={p}
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer capitalize",
                        p === 'emergency' && "peer-data-[state=checked]:border-destructive peer-data-[state=checked]:text-destructive"
                      )}
                    >
                      <span className="text-2xl mb-2">
                        {p === 'normal' ? '🟢' : p === 'urgent' ? '🟠' : '🔴'}
                      </span>
                      {p}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                {formData.priority === 'normal' && "Standard request, no rush."}
                {formData.priority === 'urgent' && "Needs attention within a few days."}
                {formData.priority === 'emergency' && "Immediate danger or safety threat."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Photos (Optional)</Label>
              <PhotoManager
                photos={formData.images}
                heroPhoto={null}
                onPhotosChange={(photos) => setFormData(prev => ({ ...prev, images: photos }))}
                onHeroPhotoChange={() => { }}
                maxPhotos={5}
                entityType={"request" as any}
              />
            </div>

            {/* Visibility Toggle */}
            {formData.request_type && !['complaint', 'account_access'].includes(formData.request_type) && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/30 border border-muted transition-all">
                  <Checkbox
                    id="is_public"
                    checked={effectiveIsPublic}
                    disabled={['maintenance', 'safety'].includes(formData.request_type)}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked as boolean }))}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="is_public" className="text-sm font-semibold cursor-pointer">
                      Allow other residents to see this request
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {['maintenance', 'safety'].includes(formData.request_type)
                        ? "For community awareness, maintenance and safety issues are always visible to other residents."
                        : "Enable this to allow your neighbors to see the progress and join the conversation."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 2: // Context
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-2 pt-4 border-t">
              <Label>Location (Optional)</Label>
              <LocationSelector
                tenantId={tenantId}
                locationType={formData.location_type}
                communityLocationId={formData.location_id}
                customLocationName={formData.custom_location_name}
                customLocationCoordinates={
                  formData.custom_location_lat && formData.custom_location_lng
                    ? { lat: formData.custom_location_lat, lng: formData.custom_location_lng }
                    : null
                }
                customLocationType="marker"
                customLocationPath={null}
                onLocationTypeChange={(type) => setFormData(prev => ({ ...prev, location_type: type === 'none' ? 'none' : type }))}
                onCommunityLocationChange={(id, name) => {
                  setFormData(prev => ({
                    ...prev,
                    location_id: id,
                    community_location_name: name || prev.community_location_name
                  }))

                  // Fallback fetch if name not provided (e.g. initial load or edge case)
                  if (id && !name) {
                    fetch(`/api/locations/${id}?tenantId=${tenantId}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.location) {
                          setFormData(prev => ({ ...prev, community_location_name: data.location.name }))
                        }
                      })
                  }
                }}
                onCustomLocationNameChange={(name) => setFormData(prev => ({ ...prev, custom_location_name: name }))}
                onCustomLocationChange={(data) => setFormData(prev => ({
                  ...prev,
                  custom_location_lat: data.coordinates?.lat || null,
                  custom_location_lng: data.coordinates?.lng || null
                }))}
              />
            </div>

            {formData.request_type === 'complaint' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Tag Residents/Pets (Optional)</Label>
                  <ResidentPetSelector
                    tenantId={tenantId}
                    selectedResidentIds={formData.tagged_resident_ids}
                    selectedPetIds={formData.tagged_pet_ids}
                    onResidentsChange={(ids) => setFormData(prev => ({ ...prev, tagged_resident_ids: ids }))}
                    onPetsChange={(ids) => setFormData(prev => ({ ...prev, tagged_pet_ids: ids }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_anonymous: checked as boolean }))}
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer">Submit anonymously</Label>
                </div>
              </div>
            )}
          </div>
        )

      case 3: // Review
        return (
          <div className="space-y-6 py-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <RequestTypeIcon type={formData.request_type!} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{formData.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{formData.request_type} • {formData.priority} Priority</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
                  <p className="text-sm whitespace-pre-wrap">{formData.description}</p>
                </div>

                {(formData.location_type !== 'none' || formData.images.length > 0) && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {formData.location_type !== 'none' && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Location
                        </Label>
                        <p className="text-sm font-medium truncate">
                          {formData.location_type === 'community'
                            ? (formData.community_location_name || 'Loading location...')
                            : (formData.custom_location_name || 'Custom Location')}
                        </p>
                      </div>
                    )}
                    {formData.images.length > 0 && (
                      <div className="space-y-2 col-span-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> Photos ({formData.images.length})
                        </Label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {formData.images.map((img, i) => (
                            <div key={i} className="relative h-16 w-16 rounded-md overflow-hidden border flex-shrink-0">
                              <img src={img} alt={`Attached ${i}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.is_anonymous && (
                  <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Submitting anonymously
                  </div>
                )}

                {effectiveIsPublic && !formData.is_anonymous && (
                  <div className="bg-primary/5 p-3 rounded-md text-sm text-primary flex items-center gap-2 border border-primary/10">
                    <MessageSquare className="h-4 w-4" />
                    Visible to community
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>New Request</DialogTitle>
          <DialogDescription>
            Submit a request to the community
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-6">
          <StepProgress
            currentStep={step + 1}
            steps={steps.map((s, i) => ({ number: i + 1, title: s.title }))}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {renderStepContent()}
        </div>

        <DialogFooter className="px-6 py-4 border-t mt-auto">
          <div className="flex w-full justify-between gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step === 0 && (
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            )}

            {step < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={step === 0 && !formData.request_type}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
