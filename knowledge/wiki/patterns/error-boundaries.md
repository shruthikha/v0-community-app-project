# Error Boundary Placement Strategy

> Zero error boundaries exist in the Ecovilla app. Any unhandled error crashes the entire page.

## Current State

The application has **no `error.tsx` files** anywhere in the route tree. This means:
- A single component error crashes the entire page
- Map failures (invalid token, WebGL) crash the dashboard
- Data-heavy component errors crash their parent pages
- No graceful degradation for users

## Recommended Placement

### Route-Level Error Boundaries

```
app/
├── error.tsx                          # Global error boundary
├── t/[slug]/
│   ├── error.tsx                      # Tenant-scoped error
│   ├── dashboard/
│   │   └── error.tsx                  # Dashboard-specific
│   └── admin/
│       └── error.tsx                  # Admin-specific
└── backoffice/
    └── error.tsx                      # Backoffice-specific
```

### Component-Level Error Boundaries

For client components that fetch data or render complex UI:

```tsx
// components/library/error-boundary.tsx
"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
    console.error("[ErrorBoundary]", error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 text-center">
          <p className="text-destructive">Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

### Priority Areas

| Area | Risk | Boundary Type |
|------|------|---------------|
| Map components | Token invalid, WebGL failure | Component-level |
| Data-heavy lists | API failures, type mismatches | Component-level |
| Dashboard widgets | Multiple independent data sources | Per-widget |
| Forms | Validation crashes | Component-level |
| Exchange listings | Complex state management | Component-level |

## Next.js Error Files

```tsx
// app/t/[slug]/error.tsx
"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Route Error]", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <button onClick={() => reset()} className="mt-4">
        Try again
      </button>
    </div>
  )
}
```

## Related Patterns

- `patterns/standardized-error-handling.md` — Error response standardization
- `patterns/data-layer-error-handling.md` — Data layer error contracts
