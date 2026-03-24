import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RioChatSheet } from '../RioChatSheet'
import { useRioChat } from '@/hooks/use-rio-chat'
import { useChat } from '@ai-sdk/react'
import { useIsMobile } from '@/hooks/use-mobile'

// Mock dependencies
vi.mock('@/hooks/use-rio-chat', () => ({
    useRioChat: vi.fn()
}))

vi.mock('@ai-sdk/react', () => ({
    useChat: vi.fn()
}))

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: vi.fn()
}))

vi.mock('@/components/ecovilla/dashboard/RioImage', () => ({
    RioImage: () => <div data-testid="rio-image" />
}))

// Mock UI components that might cause issues in JSDOM
vi.mock('@/components/ui/sheet', () => ({
    Sheet: ({ children, open }: any) => open ? <div data-testid="sheet">{children}</div> : null,
    SheetContent: ({ children }: any) => <div>{children}</div>,
    SheetHeader: ({ children }: any) => <div>{children}</div>,
    SheetTitle: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/drawer', () => ({
    Drawer: ({ children, open }: any) => open ? <div data-testid="drawer">{children}</div> : null,
    DrawerContent: ({ children }: any) => <div>{children}</div>,
    DrawerHeader: ({ children }: any) => <div>{children}</div>,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
}))

describe('RioChatSheet', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (useRioChat as any).mockReturnValue({
                isOpen: true,
                initialQuery: '',
                closeChat: vi.fn(),
                openChat: vi.fn()
            })

            ; (useChat as any).mockReturnValue({
                messages: [],
                input: '',
                setInput: vi.fn(),
                handleInputChange: vi.fn(),
                handleSubmit: vi.fn(),
                append: vi.fn(),
                isLoading: false
            })

            ; (useIsMobile as any).mockReturnValue(false)
    })

    it('renders the chat sheet on desktop when open', () => {
        render(<RioChatSheet />)
        expect(screen.getByTestId('sheet')).toBeDefined()
        expect(screen.getByText(/Chat with Rio/)).toBeDefined()
        expect(screen.getByPlaceholderText(/Ask Rio anything/i)).toBeDefined()
    })

    it('renders messages correctly', () => {
        ; (useChat as any).mockReturnValue({
            messages: [
                { id: '1', role: 'user', content: 'Hello Rio' },
                { id: '2', role: 'assistant', content: 'Hello resident!' }
            ],
            input: '',
            handleInputChange: vi.fn(),
            handleSubmit: vi.fn(),
            isLoading: false
        })

        render(<RioChatSheet />)
        expect(screen.getByText('Hello Rio')).toBeDefined()
        expect(screen.getByText('Hello resident!')).toBeDefined()
    })

    it('renders source citations if available', () => {
        ; (useChat as any).mockReturnValue({
            messages: [
                {
                    id: '1',
                    role: 'assistant',
                    content: 'The pool opens at 8am.',
                    annotations: [
                        { type: 'source', documentName: 'Pool Rules.pdf', excerpt: 'Pool hours are 8am to 10pm.' }
                    ]
                }
            ],
            input: '',
            handleInputChange: vi.fn(),
            handleSubmit: vi.fn(),
            isLoading: false
        })

        render(<RioChatSheet />)
        // Checking for the truncated string with emoji
        expect(screen.getByText(/Pool Rules\.pdf|📄 Pool Rules\.pdf/)).toBeDefined()
        expect(screen.getByText(/"Pool hours are 8am to 10pm."/)).toBeDefined()
    })
})
