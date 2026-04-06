# Frontend State Management

Río's frontend interactions and visibility are managed via a centralized Zustand store, ensuring a consistent experience across the dashboard and navigation menus.

## The `useRioChat` Store

The `useRioChat` hook provides a global state for controlling the Río Chat Sheet. It is located in `hooks/use-rio-chat.ts`.

### State Definition
```typescript
interface RioChatState {
  isOpen: boolean;           // Whether the chat sheet is currently visible
  initialQuery: string;      // A query passed from an entry point (e.g. Dashboard card)
  openChat: (query?: string) => void;
  closeChat: () => void;
  clearSession: (tenantSlug: string, userId: string) => void;
}
```

### Key Actions

#### `openChat(query?: string)`
Opens the chat sheet. If a `query` is provided, it is passed to the `initialQuery` state, which the `RioChatSheet` uses to trigger an immediate message send upon mounting.

#### `clearSession(tenantSlug, userId)`
Used to perform a "Hard Reset" of the conversation history for the current user and tenant. It removes the `rio-chat-thread-{tenantSlug}-{userId}` key from `localStorage` and closes the chat sheet.

---

## Component Integration

### `RioChatSheet`
This is the primary container for the chat experience. It listens to the `isOpen` state from `useRioChat`.

- **Mobile**: Renders as a `Vaul` bottom drawer.
- **Desktop**: Renders as a side sheet.
- **Hydration**: Uses the `HasMounted` pattern to prevent SSR mismatch during thread ID retrieval from `localStorage`.

### Entry Points
Any component can trigger Río by importing the hook:

```tsx
const { openChat } = useRioChat();

// Example: Trigger from a button
<button onClick={() => openChat("How do I pay my HOA fees?")}>
  Ask Río about payments
</button>
```

---

## Thread Persistence

While the agent manages message persistence in Postgres, the frontend maintains the **Thread ID affinity** in `localStorage`. This ensures that if a user refreshes the page, they are returned to the same conversation thread as long as it was active within the last hour.
