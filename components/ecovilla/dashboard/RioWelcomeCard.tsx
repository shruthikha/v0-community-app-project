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
        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <CardContent className="p-4 md:p-6 flex flex-col gap-4">
                {/* Top Section: Parrot and Actions */}
                <div className="flex flex-row items-center gap-4 relative min-h-[140px] md:min-h-[160px]">
                    {/* Parrot on left */}
                    <div className="w-[120px] shrink-0 flex items-center justify-center">
                        <div className="transform scale-125 md:scale-[1.4] translate-y-2 md:translate-y-4">
                            {/* @ts-ignore */}
                            <RioImage pose="general" size="md" />
                        </div>
                    </div>

                    {/* Right side Text & Secondary Buttons */}
                    <div className="space-y-3 z-10 flex-1">
                        <div className="space-y-1 text-left">
                            <p className="text-orange-950 px-2 py-1 inline-block rounded-lg md:text-sm text-xs leading-relaxed font-medium bg-white/50 backdrop-blur-sm border border-orange-100 shadow-sm relative">
                                Chat with Rio - Ask me anything about your community!
                                {/* Chat bubble tail */}
                                <span className="absolute -left-2 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-[8px] border-r-white/50"></span>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:gap-3 justify-start pl-2">
                            <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm h-8"
                                onClick={() => openChat("")}
                            >
                                Chat with Rio
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="bg-white/60 hover:bg-white border-orange-200 text-orange-950 hover:text-orange-950 shadow-sm h-8"
                            >
                                <Link href={`/t/${slug}/onboarding/profile?source=dashboard`}>
                                    Complete Profile
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Full Width Input */}
                <form onSubmit={handleSubmit} className="relative mt-2 w-full max-w-2xl mx-auto z-20">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask Rio a question..."
                        className="w-full rounded-2xl pl-5 pr-12 py-6 bg-white border-orange-200 shadow-sm text-sm focus-visible:ring-orange-500"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                    >
                        <Play className="h-4 w-4 -ml-0.5" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
