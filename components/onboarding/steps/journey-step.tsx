"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShimmerButton } from "@/components/library/shimmer-button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

interface JourneyStepProps {
    onNext: (data: any) => void
    onBack: () => void
    onSave?: (data: any, silent?: boolean) => Promise<void>
    initialData?: any
}

const JOURNEY_STAGES = [
    {
        value: "planning",
        label: "🔍 Planning",
        description: "Planning my move, researching communities, and learning more",
    },
    {
        value: "building",
        label: "🏗️ Building",
        description: "Actively building or preparing my home",
    },
    {
        value: "arriving",
        label: "🚚 Arriving",
        description: "In the process of moving in",
    },
    {
        value: "integrating",
        label: "🌱 Integrating",
        description: "Moved in and settling into community life",
    },
]

export function JourneyStep({ onNext, onBack, onSave, initialData }: JourneyStepProps) {
    const [journeyStage, setJourneyStage] = useState(initialData?.journeyStage || "")
    const [estimatedMoveInDate, setEstimatedMoveInDate] = useState<Date | undefined>(
        initialData?.estimatedMoveInDate ? new Date(initialData.estimatedMoveInDate) : undefined
    )
    const [constructionStartDate, setConstructionStartDate] = useState<Date | undefined>(
        initialData?.constructionStartDate ? new Date(initialData.constructionStartDate) : undefined
    )
    const [constructionEndDate, setConstructionEndDate] = useState<Date | undefined>(
        initialData?.constructionEndDate ? new Date(initialData.constructionEndDate) : undefined
    )
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

    useEffect(() => {
        if (initialData) {
            setJourneyStage(initialData.journeyStage || "")
            setEstimatedMoveInDate(initialData.estimatedMoveInDate ? new Date(initialData.estimatedMoveInDate) : undefined)
            setConstructionStartDate(initialData.constructionStartDate ? new Date(initialData.constructionStartDate) : undefined)
            setConstructionEndDate(initialData.constructionEndDate ? new Date(initialData.constructionEndDate) : undefined)
        }
    }, [initialData])

    const triggerAutoSave = async (overrides: any = {}) => {
        if (!onSave) return

        setSaveStatus('saving')
        try {
            await onSave({
                journeyStage,
                estimatedMoveInDate: estimatedMoveInDate?.toISOString(),
                constructionStartDate: constructionStartDate?.toISOString(),
                constructionEndDate: constructionEndDate?.toISOString(),
                ...overrides
            }, true)
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            setSaveStatus('idle')
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext({
            journeyStage,
            estimatedMoveInDate: estimatedMoveInDate?.toISOString(),
            constructionStartDate: constructionStartDate?.toISOString(),
            constructionEndDate: constructionEndDate?.toISOString()
        })
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-primary">Your journey to Ecovilla</h2>
                <p className="text-muted-foreground text-sm">
                    Where are you in the process?
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
                <div className="space-y-3">
                    <RadioGroup value={journeyStage} onValueChange={(val) => {
                        setJourneyStage(val)
                        triggerAutoSave({ journeyStage: val })
                    }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {JOURNEY_STAGES.map((stage) => (
                            <div key={stage.value}>
                                <RadioGroupItem value={stage.value} id={stage.value} className="peer sr-only" />
                                <Label
                                    htmlFor={stage.value}
                                    className={cn(
                                        "flex flex-col h-full items-start justify-between rounded-xl border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all",
                                        journeyStage === stage.value && "border-primary bg-primary/10 dark:bg-primary/20"
                                    )}
                                >
                                    <span className="font-semibold text-base text-foreground">{stage.label}</span>
                                    <span className="text-xs text-muted-foreground mt-1 font-normal leading-snug">
                                        {stage.description}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-3 pt-2 border-t">
                    <h3 className="font-medium text-sm">Key Dates</h3>

                    <div className="space-y-2">
                        <Label className="text-sm">Estimated Move-in Date</Label>
                        <DateTimePicker
                            date={estimatedMoveInDate}
                            setDate={(date) => {
                                setEstimatedMoveInDate(date)
                                triggerAutoSave({ estimatedMoveInDate: date?.toISOString() })
                            }}
                            placeholder="Select date"
                        />
                    </div>

                    {(journeyStage === "building" || journeyStage === "planning") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-sm">Construction Start</Label>
                                <DateTimePicker
                                    date={constructionStartDate}
                                    setDate={(date) => {
                                        setConstructionStartDate(date)
                                        triggerAutoSave({ constructionStartDate: date?.toISOString() })
                                    }}
                                    placeholder="Start date"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Construction End</Label>
                                <DateTimePicker
                                    date={constructionEndDate}
                                    setDate={(date) => {
                                        setConstructionEndDate(date)
                                        triggerAutoSave({ constructionEndDate: date?.toISOString() })
                                    }}
                                    placeholder="End date"
                                />
                            </div>
                        </div>
                    )}
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
                    <ShimmerButton type="submit" className="w-full sm:w-auto flex-1 order-2 sm:order-3 h-12" disabled={!journeyStage} background="hsl(var(--primary))">
                        Continue
                    </ShimmerButton>
                </div>
            </form>
        </div>
    )
}
