---
title: Session Timeout Pattern
description: Remember me, middleware timeout, HttpOnly cookies
categories: [auth, security, middleware]
sources: [log_2026-02-09_issue_77_auto_logout.md, log_2026-02-16_double_login_regression.md]
---

# Session Timeout Pattern

## Middleware Timeout with Remember Me

Middleware checks for session timeout:

```typescript
// lib/supabase/middleware.ts
export function middleware(request: NextRequest) {
  const lastActive = request.cookies.get('last-active');
  const rememberMe = request.cookies.get('remember-me');
  
  // Remember Me: Skip timeout
  if (rememberMe) {
    return NextResponse.next();
  }
  
  // Check idle timeout (2 hours default)
  if (lastActive) {
    const last = new Date(lastActive.value);
    const now = new Date();
    const diff = now.getTime() - last.getTime();
    
    if (diff > 2 * 60 * 60 * 1000) {
      return signOut();
    }
  }
}
```

## Grace Period for Fresh Logins

Allow grace period using `last_sign_in_at` from Supabase Auth:

```typescript
export function middleware(request: NextRequest) {
  const user = await getUser();
  
  // Grace period for fresh login (60s)
  if (user?.last_sign_in_at) {
    const last = new Date(user.last_sign_in_at);
    const diff = Date.now() - last.getTime();
    
    if (diff < 60000) {
      return NextResponse.next(); // Skip timeout
    }
  }
}
```

## HttpOnly Cookies

Use HttpOnly for security:

```typescript
// Server action to set cookie
cookies().set('last-active', Date.now().toString(), {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 2
});
```

---

## Related

- [password-reset-flow](./password-reset-flow.md)