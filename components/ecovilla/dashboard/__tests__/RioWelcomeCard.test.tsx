import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RioWelcomeCard } from '../RioWelcomeCard'
import { useRioChat } from '@/hooks/use-rio-chat'

// Mock the Zustand store
vi.mock('@/hooks/use-rio-chat', () => ({
    useRioChat: vi.fn()
}))

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>
}))

// Mock the RioImage
vi.mock('../RioImage', () => ({
    RioImage: () => <div data-testid="rio-image" />
}))

describe('RioWelcomeCard', () => {
    const mockOpenChat = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
            ; (useRioChat as any).mockReturnValue({
                openChat: mockOpenChat
            })
    })

    it('renders the input and send button', () => {
        render(<RioWelcomeCard slug="test-slug" />)

        expect(screen.getByPlaceholderText(/Ask Rio a question/i)).toBeDefined()
        // The send button has a sr-only "Send message" or "Send" text
        expect(screen.getByText('Send')).toBeDefined()
    })

    it('calls openChat with the query when form is submitted', () => {
        render(<RioWelcomeCard slug="test-slug" />)

        const input = screen.getByPlaceholderText(/Ask Rio a question/i)
        fireEvent.change(input, { target: { value: 'What are the pool hours?' } })

        // The button should be enabled now
        expect((screen.getByRole('button', { name: /Send/i }) as HTMLButtonElement).disabled).toBe(false)

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /Send/i }))

        expect(mockOpenChat).toHaveBeenCalledWith('What are the pool hours?')
        // Input should be cleared
        expect((input as HTMLInputElement).value).toBe('')
    })

    it('disables the send button when input is empty', () => {
        render(<RioWelcomeCard slug="test-slug" />)

        expect((screen.getByRole('button', { name: /Send/i }) as HTMLButtonElement).disabled).toBe(true)
    })
})
