"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Trash2, Brain, Sparkles, Loader2, AlertTriangle, Info, Pencil, Check, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { deleteRioMemory, updateRioMemory } from "@/app/actions/rio-memory"

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch memories");
    return res.json();
})

export function RioMemorySection() {
    const params = useParams()
    const slug = params.slug as string
    const { toast } = useToast()
    const { data, error, isLoading, mutate } = useSWR("/api/v1/ai/memories", fetcher)
    const [isDeletingAll, setIsDeletingAll] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState("")
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const facts = data?.facts || []

    const handleDeleteIndividual = async (index: number) => {
        const result = await deleteRioMemory(slug, index)
        if (result.success) {
            toast({
                title: "Fact removed",
                description: "Río has forgotten this specific detail.",
            })
            mutate()
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to remove fact",
                variant: "destructive",
            })
        }
    }

    const handleSaveEdit = async (index: number) => {
        if (!editValue.trim() || editValue === facts[index]) {
            setEditingIndex(null)
            return
        }

        setIsSaving(true)
        const result = await updateRioMemory(slug, index, editValue)
        setIsSaving(false)

        if (result.success) {
            toast({
                title: "Fact updated",
                description: "Río's memory has been adjusted.",
            })
            mutate()
            setEditingIndex(null)
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to update memory",
                variant: "destructive",
            })
        }
    }

    const handleDeleteAll = async () => {
        if (deleteConfirm !== "DELETE") return

        setIsDeletingAll(true)
        const result = await deleteRioMemory(slug, undefined, true)
        setIsDeletingAll(false)

        if (result.success) {
            toast({
                title: "Memories cleared",
                description: "All learned facts have been wiped from Río's memory.",
            })
            mutate()
            setDeleteConfirm("")
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to clear memories",
                variant: "destructive",
            })
        }
    }

    if (error) {
        return (
            <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <p>Failed to load Río's memory settings.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden border-primary/10 transition-all hover:border-primary/20">
            <CardHeader className="bg-muted/30 pb-4 border-b border-primary/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Brain className="h-5 w-5 text-primary" />
                            Río AI Memory
                        </CardTitle>
                        <CardDescription>
                            Manage what Río has learned about you to personalize your experience.
                        </CardDescription>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/5 border-destructive/20 transition-all flex-shrink-0"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear all memories
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently wipe everything Río has learned about your residency preferences, interests, and history.
                                    Río will start with a fresh slate.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4 space-y-4">
                                <p className="text-sm font-medium">Please type <span className="font-bold text-destructive">DELETE</span> to confirm.</p>
                                <Input
                                    placeholder="DELETE"
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    className="border-destructive/30 focus-visible:ring-destructive"
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={deleteConfirm !== "DELETE" || isDeletingAll}
                                    onClick={handleDeleteAll}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Wipe Memory"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                            <p className="text-xs text-muted-foreground animate-pulse">Accessing vault...</p>
                        </div>
                    </div>
                ) : facts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                        <div className="rounded-full bg-muted p-3">
                            <Info className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No learned facts yet</p>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                As you chat with Río, it will recall important details about your preferences here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <AnimatePresence mode="popLayout">
                                {facts.map((fact: string, index: number) => (
                                    <motion.div
                                        key={`fact-${index}-${fact.slice(0, 32)}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className="group relative overflow-hidden h-full border-muted/60 hover:border-primary/30 transition-all bg-card/50 shadow-none hover:shadow-sm">
                                            <CardContent className="p-4 flex flex-col h-full min-h-[100px]">
                                                {editingIndex === index ? (
                                                    <div className="space-y-3 flex-grow flex flex-col">
                                                        <Textarea
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="text-sm min-h-[80px] resize-none focus-visible:ring-primary/30"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setEditingIndex(null)}
                                                                className="h-7 px-2"
                                                            >
                                                                <X className="h-3.5 w-3.5 mr-1" />
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSaveEdit(index)}
                                                                disabled={isSaving}
                                                                className="h-7 px-2"
                                                            >
                                                                {isSaving ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Check className="h-3.5 w-3.5 mr-1" />
                                                                        Save
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-grow">
                                                            <p className="text-sm leading-relaxed text-card-foreground/90">{fact}</p>
                                                        </div>
                                                        <div className="flex justify-end items-center mt-3 gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setEditingIndex(index)
                                                                    setEditValue(fact)
                                                                }}
                                                                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 focus-visible:ring-1 focus-visible:ring-primary focus-visible:opacity-100"
                                                                aria-label={`Edit memory: ${fact.slice(0, 20)}...`}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteIndividual(index)}
                                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 focus-visible:ring-1 focus-visible:ring-destructive focus-visible:opacity-100"
                                                                aria-label={`Delete memory: ${fact.slice(0, 20)}...`}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-col items-center pt-4 border-t border-primary/5">
                            <p className="text-[10px] text-muted-foreground text-center max-w-sm flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-primary/40" />
                                Río's memories are encrypted and isolated to your resident profile.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
