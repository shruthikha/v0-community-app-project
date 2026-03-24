"use client"

import { create } from 'zustand'

interface RioChatState {
    isOpen: boolean
    initialQuery: string
    openChat: (query?: string) => void
    closeChat: () => void
    clearSession: (tenantSlug: string, userId: string) => void
}

export const useRioChat = create<RioChatState>((set) => ({
    isOpen: false,
    initialQuery: "",
    openChat: (query = "") => set({ isOpen: true, initialQuery: query }),
    closeChat: () => set({ isOpen: false, initialQuery: "" }),
    clearSession: (tenantSlug, userId) => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`rio-chat-thread-${tenantSlug}-${userId}`)
        }
        set({ isOpen: false, initialQuery: "" })
    }
}))
