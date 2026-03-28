"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/library/card"
import { RioImage } from "./RioImage"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Play } from "lucide-react"
import { useRioChat } from "@/hooks/use-rio-chat"

export function RioWelcomeCard({ slug, isAiEnabled = false }: { slug: string; isAiEnabled?: boolean }) {
    const { openChat } = useRioChat()
    const [query, setQuery] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            openChat(query)
            setQuery("")
        }
    }

    if (!isAiEnabled) {
        return (
            <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 min-h-[160px] md:min-h-[180px] flex flex-col justify-center">
                <CardContent className="p-4 md:p-6 flex items-center justify-between h-full relative">
                    <div className="absolute left-0 bottom-0 top-0 w-[40%] flex items-center justify-center pointer-events-none">
                        <div className="transform scale-[1.3] md:scale-[1.5] translate-y-2 md:translate-y-4 -translate-x-2">
                            {/* @ts-ignore */}
                            <RioImage pose="general" size="md" />
                        </div>
                    </div>
                    <div className="ml-auto space-y-3 z-10 max-w-[65%] text-left">
                        <div className="space-y-1">
                            <h3 className="text-lg md:text-xl font-bold text-orange-950">Welcome Home!</h3>
                            <p className="text-orange-900/80 text-xs md:text-sm leading-relaxed font-medium">
                                I'm Rio, your community guide. I'll keep an eye out for important updates for you.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                asChild
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm h-8 px-3"
                            >
                                <Link href={`/t/${slug}/onboarding/tour`}>
                                    <div className="flex items-center gap-2">
                                        <Play className="h-3 w-3 fill-current" />
                                        <span>Start tour</span>
                                    </div>
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="bg-white/60 hover:bg-white border-orange-200 text-orange-950 hover:text-orange-950 shadow-sm h-8 px-3"
                            >
                                <Link href={`/t/${slug}/onboarding/profile?source=dashboard`}>
                                    Complete Profile
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden bg-white border-slate-200 h-full flex flex-col shadow-sm">
            <CardContent className="p-4 md:p-5 flex flex-col h-full">
                {/* Top Section: Parrot and Actions */}
                <div className="flex flex-row items-center gap-4 relative flex-1 min-h-[100px] mb-2">
                    {/* Parrot on left */}
                    <div className="w-[100px] shrink-0 flex items-center justify-center">
                        <div className="transform scale-110 md:scale-125 translate-y-2">
                            {/* @ts-ignore */}
                            <RioImage pose="general" size="md" />
                        </div>
                    </div>

                    {/* Right side Actions */}
                    <div className="flex flex-col gap-3 z-10 flex-1 justify-center">
                        <div className="flex flex-wrap gap-2 md:gap-3 justify-start">
                            <Button
                                asChild
                                size="sm"
                                className="bg-primary hover:bg-forest-canopy text-primary-foreground border-none shadow-sm h-8 px-4"
                            >
                                <Link href={`/t/${slug}/onboarding/tour`}>
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                        <span>Take tour</span>
                                    </div>
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="bg-white/60 hover:bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm h-8"
                            >
                                <Link href={`/t/${slug}/onboarding/profile?source=dashboard`}>
                                    Complete Profile
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Full Width Input */}
                <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto z-20">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask Rio a question..."
                        className="w-full rounded-2xl pl-5 pr-12 py-5 bg-slate-50 border-slate-200 shadow-sm text-sm focus-visible:ring-forest-deep"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-forest-canopy text-primary-foreground disabled:opacity-50 transition-all active:scale-95"
                    >
                        <Play className="h-4 w-4 -ml-0.5" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
