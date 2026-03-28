# Rio Agent - Frontend Components

Río's user interface is built using **shadcn/ui** and **Vercel AI SDK**.

## Global State
`hooks/use-rio-chat.ts`
- Powered by **Zustand**.
- Manages `isOpen` state for the chat sheet.
- Provides `openChat()` and `closeChat()` actions.
- Used by `RioWelcomeCard` and `CreatePopover` to trigger the assistant.

## Components

### `RioChatSheet.tsx`
The primary interaction container.
- **Redesigned Header**: Uses a centered `RioImage` with a horizontal "Ask me anything..." CTA, replacing the standard top bar.
- **Responsive**: Renders as a `Sheet` on desktop and a `Drawer` on mobile.
- **Hook**: Uses `useChat()` from `@ai-sdk/react`.
- **Usage Filtering**: Implements a client-side scan to only display citations actually referenced in the text.
- **Streaming**: Processes SSE streams including `data-citations` parts with `source_document_id` for accurate dashboard routing.
- **Parser**: Detects citation markers `[1]`, `[2]`, etc. and maps them to interactive source cards.

### MobileNav
- **Pattern**: Implements the **`HasMounted`** React pattern to prevent SSR/CSR hydration mismatches.
- **Rationale**: Mobile-only bars and popovers (Radix UI) generate auto-incrementing IDs. Rendering them only after `useEffect` ensures the server-client synchronization is perfect.
- **Entry Points**: Dashboard and Create Popover.

### `InlineCitation.tsx`
Renders formatted markers (e.g., `[1]`) that reveal source details.
- **Interaction**: Uses `Popover` for interactive display.
- **Mobile Support**: Optimized for tap interactions on touch devices.
- **Content**: Displays `document_name` and a truncated `excerpt` from the knowledge base.

## Styling
- **Glassmorphism**: Subtle backdrops and borders to match the Ecovilla aesthetic.
- **Animations**: Framer Motion transitions for message bubbles and sheet movements.
