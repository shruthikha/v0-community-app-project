---
title: Password Reset Flow
description: Next.js 15 params, session cookies, hostname mismatch
categories: [auth, nextjs, cookies]
sources: [log_2026-02-22_70-password-reset.md]
---

# Password Reset Flow

## Next.js 15 Params

Params is a Promise in Next.js 15+:

```typescript
// Page component
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Use slug
}
```

## Session Cookies Across Redirect

Use request Host header for redirect URLs:

```typescript
// BAD: Uses 0.0.0.0 from request.url
const redirect = new URL('/dashboard', request.url);

// GOOD: Uses actual Host header
const redirect = new URL('/dashboard', request.headers.get('host'));
```

## Middleware Path Exclusions

Exclude auth routes from session timeout:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Skip timeout check for auth routes
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }
  // Apply timeout logic
}
```

## Tenant-Scoped Email Check

Only registered residents should receive reset emails:

```typescript
// Server action always returns success (no email enumeration)
const resetPassword = async (email: string, tenantId: string) => {
  const isResident = await checkResidentEmail(email, tenantId);
  if (!isResident) {
    return { success: true }; // Same response
  }
  await sendResetEmail(email);
  return { success: true };
};
```

---

## Related

- [route-redirect](./route-redirect.md)