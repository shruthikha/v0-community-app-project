"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Check, Search, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SkillsStepProps {
    onNext: (data: any) => void
    onBack: () => void
    onSave?: (data: any, silent?: boolean) => Promise<void>
    initialData?: any
    availableSkills?: { id: string, name: string, description: string }[]
}

interface SkillSelection {
    id: string
    name?: string
    openToRequests: boolean
    isNew?: boolean
}

export function SkillsStep({ onNext, onBack, onSave, initialData, availableSkills = [] }: SkillsStepProps) {
    // Initialize with existing skills from profile
    const [selected, setSelected] = useState<SkillSelection[]>(() => {
        if (initialData?.skills && Array.isArray(initialData.skills)) {
            // If skills is array of objects with id and openToRequests
            if (initialData.skills.length > 0 && typeof initialData.skills[0] === 'object') {
                return initialData.skills
            }
            // If skills is array of IDs, convert to objects
            return initialData.skills.map((id: string) => ({ id, openToRequests: false }))
        }
        return []
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
    const searchRef = useRef<HTMLDivElement>(null)

    const triggerAutoSave = async (overrides: any = {}) => {
        if (!onSave) return

        setSaveStatus('saving')
        try {
            await onSave({
                skills: selected,
                ...overrides
            }, true)
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            setSaveStatus('idle')
        }
    }

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

    const toggleSkill = (skillId: string, skillName?: string) => {
        const exists = selected.find(s => s.id === skillId)
        const newSelected = exists
            ? selected.filter(s => s.id !== skillId)
            : [...selected, { id: skillId, name: skillName, openToRequests: false }]

        setSelected(newSelected)
        triggerAutoSave({ skills: newSelected })
    }

    const addCustomSkill = (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        // Generate a temporary ID for new skills
        const tempId = `new:${trimmedName}`;

        // Check if already selected
        if (selected.some(s => s.id === tempId || s.name?.toLowerCase() === trimmedName.toLowerCase())) {
            return;
        }

        const newSkill = {
            id: tempId,
            name: trimmedName,
            openToRequests: false,
            isNew: true
        }

        const newSelected = [...selected, newSkill]
        setSelected(newSelected)
        triggerAutoSave({ skills: newSelected })
        setSearchQuery("")
        setShowDropdown(false)
    }

    const toggleOpenToRequests = (skillId: string) => {
        const newSelected = selected.map(s =>
            s.id === skillId
                ? { ...s, openToRequests: !s.openToRequests }
                : s
        )
        setSelected(newSelected)
        triggerAutoSave({ skills: newSelected })
    }

    const removeSkill = (skillId: string) => {
        const newSelected = selected.filter(s => s.id !== skillId)
        setSelected(newSelected)
        triggerAutoSave({ skills: newSelected })
    }

    // Filter skills based on search query
    const filteredSkills = availableSkills.filter(skill =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Check if exact match exists in available skills
    const exactMatch = filteredSkills.find(s => s.name.toLowerCase() === searchQuery.trim().toLowerCase())

    // Get selected skill objects for display
    const selectedSkills = selected.map(s => {
        if (s.isNew) {
            return { id: s.id, name: s.name || "", description: "Custom skill", openToRequests: s.openToRequests, isNew: true }
        }
        const skill = availableSkills.find(sk => sk.id === s.id)
        return skill ? { ...skill, openToRequests: s.openToRequests } : null
    }).filter(Boolean)

    const handleNext = () => {
        onNext({ skills: selected })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-primary">Share your gifts</h2>
                <p className="text-muted-foreground">
                    What skills can you share with the community?
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
                                placeholder="Search skills..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setShowDropdown(true)
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchQuery.trim() && !exactMatch) {
                                        e.preventDefault()
                                        addCustomSkill(searchQuery)
                                    }
                                }}
                                className="pl-9 h-12"
                            />
                        </div>

                        {/* Dropdown */}
                        {showDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-popover border rounded-xl shadow-lg z-50">
                                {searchQuery.trim() && !exactMatch && (
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            addCustomSkill(searchQuery)
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-2 text-primary"
                                    >
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Search className="h-3 w-3" />
                                        </div>
                                        <span className="font-medium">Create "{searchQuery}"</span>
                                    </button>
                                )}

                                {filteredSkills.map((skill) => {
                                    const isSelected = selected.some(s => s.id === skill.id)
                                    return (
                                        <button
                                            key={skill.id}
                                            type="button"
                                            onClick={() => {
                                                toggleSkill(skill.id)
                                                setSearchQuery("")
                                            }}
                                            className={cn(
                                                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between",
                                                isSelected && "bg-primary/5"
                                            )}
                                        >
                                            <span className={cn("text-sm", isSelected && "font-medium")}>
                                                {skill.name}
                                            </span>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    )
                                })}

                                {filteredSkills.length === 0 && !searchQuery && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        Type to search or add skills
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected Skills Display */}
                    {selectedSkills.length > 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">Selected Skills</p>
                            </div>

                            <div className="space-y-2">
                                {selectedSkills.map(skill => {
                                    if (!skill) return null
                                    const skillSelection = selected.find(s => s.id === skill.id)
                                    const isOpen = skillSelection?.openToRequests || false

                                    return (
                                        <div
                                            key={skill.id}
                                            className="flex items-center justify-between p-3 bg-card rounded-lg border"
                                        >
                                            <span className="font-medium text-sm">{skill.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleOpenToRequests(skill.id)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                                        isOpen
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {isOpen ? "Open to Help" : "Not Open"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(skill.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <p className="text-xs text-muted-foreground/80 italic pt-1 border-t border-border/50 mt-2">
                                "Open to help" lets neighbors know they can ask you about these topics.
                            </p>
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
                    <Button onClick={handleNext} className="w-full sm:w-auto flex-1 order-2 sm:order-3 h-12">Continue</Button>
                </div>
            </div>
        </div>
    )
}
