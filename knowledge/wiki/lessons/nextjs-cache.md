---
source: lessons_learned
imported_date: 2026-04-08
---

# Lesson: Next.js Cache Invalidation

## Server Action + Cache

For live admin dashboards, explicitly force dynamic:

```typescript
// ✅ CORRECT: Force dynamic for live data
export const dynamic = 'force-dynamic';

export async function updateData(formData: FormData) {
  await updateInDb(formData);
  revalidatePath('/admin/dashboard');
}

// ❌ WRONG: Cached response
export async function updateData(formData: FormData) {
  await updateInDb(formData);
  // Still returns cached data!
}
```

## Dynamic Path Revalidation

Use actual path, not pattern:

```typescript
// ✅ CORRECT: Interpolate actual slug
revalidatePath(`/t/${slug}/dashboard`);

// ❌ WRONG: Literal pattern
revalidatePath('/t/[slug]/dashboard');
```

## Middleware Session Grace Period

On fresh login, cookie may not be set yet. Use server-side grace:

```typescript
// ✅ CORRECT: Check auth timestamp
const userLastSignIn = user.last_sign_in_at;
const isNewSession = (Date.now() - new Date(userLastSignIn).getTime()) < 60000;

if (!cookie || isNewSession) {
  // Allow session, grace period
}

// ❌ WRONG: Strict cookie check
if (!cookie) {
  return redirect('/logout'); // Double-login loop!
}
```