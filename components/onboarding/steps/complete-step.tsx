"use client"

import { RainbowButton } from "@/components/library/rainbow-button"
import { AuroraText } from "@/components/library/aurora-text"
import { Confetti } from "@/components/library/confetti"
import { Sparkles } from "lucide-react"
import { useEffect } from "react"

interface CompleteStepProps {
    onNext: (data?: any) => void
}

export function CompleteStep({ onNext }: CompleteStepProps) {

    // Trigger confetti on mount
    useEffect(() => {
        // Confetti logic if needed, or rely on the component's internal auto-trigger if it has one
    }, [])

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 text-center py-12">

            <div className="mx-auto h-32 w-32 md:h-40 md:w-40 flex items-center justify-center mb-6">
                <img
                    src="/rio/rio_profile_tour_complete.png"
                    alt="Rio celebrating"
                    className="w-full h-full object-contain"
                />
            </div>

            <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                    <span className="bg-gradient-to-r from-orange-500 to-primary bg-clip-text text-transparent">
                        You're all set!
                    </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-md mx-auto">
                    Your profile is ready. Welcome to the neighborhood!
                </p>
            </div>

            <div className="sticky bottom-[-2rem] md:bottom-[-3rem] pt-4 pb-2 bg-background z-10 flex justify-center">
                <RainbowButton
                    onClick={() => onNext({})}
                    className="h-14 px-8 text-lg font-semibold"
                >
                    Explore Your Community
                </RainbowButton>
            </div>

            <Confetti />
        </div>
    )
}
