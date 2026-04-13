---
source: nido_patterns
imported_date: 2026-04-08
---

# Mobile UI Patterns

## Mobile Dock Padding

Ensure strict padding for mobile dock:

```css
/* Main page container */
.pb-[80px] {
  padding-bottom: 80px;
}

/* Safe area support */
.pb-safe {
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}
```

## Usage in Pages

```typescript
// ✅ CORRECT: Include dock padding
export default function DashboardPage() {
  return (
    <main className="pb-[80px] min-h-screen">
      {/* Page content */}
    </main>
  );
}

// ❌ WRONG: Missing padding
export default function DashboardPage() {
  return (
    <main>
      {/* Content hidden behind dock */}
    </main>
  );
}
```

## Empty States

Use standard component:

```typescript
// ✅ CORRECT: Standard component
import { RioEmptyState } from '@/components/dashboard/rio-empty-state';

<RioEmptyState
  title="No results"
  description="Try adjusting your filters"
  action={{ label: "Browse", href: "/browse" }}
/>

// ❌ WRONG: Custom implementation
<div className="flex flex-col items-center">
  <img src="/custom-empty.png" />
  {/* Inconsistent with other empty states */}
</div>
```

## Geolocation Lazy Enable

NEVER prompt for permissions on mount:

```typescript
// ✅ CORRECT: Button-triggered
const [locationEnabled, setLocationEnabled] = useState(false);

<Button onClick={() => enableLocation()}>
  Find Me
</Button>

function enableLocation() {
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

// ❌ WRONG: On mount
useEffect(() => {
  navigator.geolocation.getCurrentPosition(...); // Rejection on load!
}, []);
```

## Event Bus Sync

For cross-widget ephemeral state:

```typescript
// Emit event
window.dispatchEvent(new CustomEvent('rio-sync', { 
  detail: { type: 'rsvp', itemId: '123' } 
}));

// Listen
useEffect(() => {
  const handler = (e: Event) => {
    const { detail } = e as CustomEvent;
    // Update local state
  };
  
  window.addEventListener('rio-sync', handler);
  return () => window.removeEventListener('rio-sync', handler);
}, []);
```

## Mobile Wrapper Structural Parity

When UI elements must align, share same wrapper:

```typescript
// ❌ WRONG: Different wrappers
<div className="overflow-x-auto -mx-4 px-4">
  <TabsList />
</div>
<SearchBar /> {/* Missing wrapper */}

// ✅ CORRECT: Shared structure
<div className="overflow-x-auto -mx-4 px-4">
  <TabsList />
</div>
<div className="overflow-x-auto -mx-4 px-4">
  <SearchBar />
</div>
```