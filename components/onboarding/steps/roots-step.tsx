"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, Search, X, Plus, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useCreateInterest } from "@/hooks/use-create-interest"
import { useToast } from "@/hooks/use-toast"

interface RootsStepProps {
    onNext: (data: any) => void
    onBack: () => void
    onSave?: (data: any, silent?: boolean) => Promise<void>
    initialData?: any
    availableInterests?: { id: string, name: string }[]
}

export function RootsStep({ onNext, onBack, onSave, initialData, availableInterests = [] }: RootsStepProps) {
    const { toast } = useToast()
    const [selected, setSelected] = useState<string[]>(initialData?.interests || [])
    const [allInterests, setAllInterests] = useState(availableInterests)
    const [searchQuery, setSearchQuery] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
    const searchRef = useRef<HTMLDivElement>(null)

    const triggerAutoSave = async (overrides: any = {}) => {
        if (!onSave) return

        setSaveStatus('saving')
        try {
            await onSave({
                interests: selected,
                ...overrides
            }, true)
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            setSaveStatus('idle')
        }
    }

    const { handleCreateInterest, isAddingInterest } = useCreateInterest({
        tenantId: initialData?.tenantId,
        onSuccess: (newInterest) => {
            setAllInterests(prev => [...prev, newInterest])
            const newSelected = [...selected, newInterest.id]
            setSelected(newSelected)
            triggerAutoSave({ interests: newSelected })
            setSearchQuery("")
        }
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const toggleInterest = (interestId: string) => {
        const newSelected = selected.includes(interestId)
            ? selected.filter(i => i !== interestId)
            : [...selected, interestId]

        setSelected(newSelected)
        triggerAutoSave({ interests: newSelected })
    }

    const removeInterest = (interestId: string) => {
        const newSelected = selected.filter(i => i !== interestId)
        setSelected(newSelected)
        triggerAutoSave({ interests: newSelected })
    }

    // Filter interests based on search query
    const trimmedQuery = searchQuery.trim()
    const normalizedQuery = trimmedQuery.toLowerCase()
    const filteredInterests = allInterests.filter(interest =>
        interest.name.toLowerCase().includes(normalizedQuery)
    )

    const exactMatch = allInterests.find(i => i.name.trim().toLowerCase() === normalizedQuery)
    const showCreateOption = trimmedQuery.length > 0 && !exactMatch

    // Get selected interest names for display
    const selectedInterests = allInterests.filter(i => selected.includes(i.id))

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Plant your roots</h2>
                <p className="text-muted-foreground">
                    What do you enjoy? Connect with neighbors who share your interests
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
                <div className="space-y-4">
                    {/* Search Input with Dropdown */}
                    <div className="relative" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search interests or type to create new..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setShowDropdown(true)
                                }}
                                onFocus={() => setShowDropdown(true)}
                                className="pl-9 h-12"
                            />
                        </div>

                        {/* Dropdown */}
                        {showDropdown && (showCreateOption || filteredInterests.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-popover border rounded-xl shadow-lg z-10">
                                {showCreateOption && (
                                    <button
                                        type="button"
                                        onClick={() => handleCreateInterest(trimmedQuery)}
                                        disabled={isAddingInterest}
                                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-2 bg-primary/5 border-b"
                                    >
                                        {isAddingInterest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                        <span className="text-sm font-medium">Create &quot;{trimmedQuery}&quot;</span>
                                    </button>
                                )}
                                {filteredInterests.map((interest) => {
                                    const isSelected = selected.includes(interest.id)
                                    return (
                                        <button
                                            key={interest.id}
                                            type="button"
                                            onClick={() => {
                                                toggleInterest(interest.id)
                                                setSearchQuery("")
                                            }}
                                            className={cn(
                                                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between",
                                                isSelected && "bg-primary/5"
                                            )}
                                        >
                                            <span className={cn("text-sm", isSelected && "font-medium")}>
                                                {interest.name}
                                            </span>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {showDropdown && trimmedQuery && filteredInterests.length === 0 && !showCreateOption && !isAddingInterest && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-lg z-10 p-4 text-center text-sm text-muted-foreground">
                                No interests found matching &quot;{trimmedQuery}&quot;
                            </div>
                        )}
                    </div>

                    {/* Selected Interests Display */}
                    {selectedInterests.length > 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 border">
                            <p className="text-sm font-medium text-muted-foreground mb-3">Interests</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedInterests.map(interest => (
                                    <Badge
                                        key={interest.id}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 gap-1"
                                    >
                                        {interest.name}
                                        <button
                                            type="button"
                                            onClick={() => removeInterest(interest.id)}
                                            className="ml-1 hover:text-primary-foreground/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
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
                    <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto flex-1 order-1 sm:order-2 h-12">Back</Button>
                    <Button onClick={() => onNext({ interests: selected })} className="w-full sm:w-auto flex-1 order-2 sm:order-3 h-12">Continue</Button>
                </div>
            </div>
        </div>
    )
}
