"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { RioFeedbackModal, RioFeedbackVariant } from "./rio-feedback-modal"

interface RioFeedbackOptions {
    title: string
    description: string
    variant: RioFeedbackVariant
    image: string
    action?: {
        label: string
        onClick: () => void
    }
    autoDismiss?: boolean
    dismissDuration?: number
}

interface RioFeedbackContextType {
    showFeedback: (options: RioFeedbackOptions) => void
    hideFeedback: () => void
}

const RioFeedbackContext = createContext<RioFeedbackContextType | undefined>(undefined)

export function RioFeedbackProvider({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [options, setOptions] = useState<RioFeedbackOptions | null>(null)

    const showFeedback = useCallback((newOptions: RioFeedbackOptions) => {
        if (!enabled) return
        setOptions(newOptions)
        setIsOpen(true)
    }, [enabled])

    const hideFeedback = useCallback(() => {
        setIsOpen(false)
    }, [])

    return (
        <RioFeedbackContext.Provider value={{ showFeedback, hideFeedback }}>
            {children}
            {enabled && options && (
                <RioFeedbackModal
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    variant={options.variant}
                    title={options.title}
                    description={options.description}
                    image={options.image}
                    action={options.action}
                    autoDismiss={options.autoDismiss}
                    dismissDuration={options.dismissDuration}
                />
            )}
        </RioFeedbackContext.Provider>
    )
}

export function useRioFeedback() {
    const context = useContext(RioFeedbackContext)
    if (context === undefined) {
        throw new Error("useRioFeedback must be used within a RioFeedbackProvider")
    }
    return context
}
