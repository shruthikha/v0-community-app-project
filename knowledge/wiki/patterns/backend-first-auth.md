---
source: nido_patterns + lessons_learned
imported_date: 2026-04-08
---

# Backend-First Authorization Patterns

## Core Pattern: Defense-in-Depth

Use **simple RLS** for tenant insulation + **Backend-First Authorization** in Server Actions:

```typescript
// 1. Simple RLS (tenant isolation only)
CREATE POLICY "Tenant isolation" ON table_name
FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

// 2. Backend-First in Server Action
export async function addComment(formData: FormData) {
  const supabase = createServerClient();
  
  // Get user from session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  // Manual auth check (more control than complex RLS)
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();
    
  if (!profile) throw new Error('Not found');
  
  // Verify tenant match
  if (profile.tenant_id !== data.tenantId) {
    throw new Error('Cross-tenant access denied');
  }
  
  // Perform action with elevated access if needed
  const { error } = await supabase.from('comments').insert({
    ...data,
    user_id: user.id,
  });
}
```

## When to Use Admin Client

Use `createAdminClient` (service role) for complex scenarios:

- Cross-table writes
- Complex authorization logic
- Bulk operations
- When RLS policies become brittle or slow

```typescript
// Admin client usage
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/ssr';

export async function complexAction(formData: FormData) {
  // Regular client for auth check
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  
  // Manual authorization
  const { data: canPerform } = await serverClient
    .from('permissions')
    .select('action')
    .eq('user_id', user.id)
    .eq('action', 'delete_comment')
    .single();
    
  if (!canPerform) throw new Error('Forbidden');
  
  // Admin client for the actual operation
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  await adminClient.from('comments').delete().eq('id', id);
}
```

## When NOT to Use Admin Client

- Simple single-table CRUD with RLS
- When user can only access their own data
- Straightforward tenant isolation

## RLS vs Server Action Tradeoffs

| Approach | Use When |
|----------|---------|
| **RLS-only** | Simple tenant/user isolation, read queries |
| **Backend-First** | Complex auth, cross-tenant features, writes needing control |
| **Defense-in-Depth** | Both — simple RLS + manual checks |

## Critical: Admin Client Authorization Gap (2026-04-11 Audit)

**Vulnerable pattern** — admin client used without verifying caller identity:

```typescript
// ❌ VULNERABLE — accepts userId with no verification
export async function updateBasicInfo(userId: string, data: {...}) {
    const supabase = createAdminClient()  // ← NO auth verification
    await supabase.from("users").update({...}).eq("id", userId)
}
```

**Affected files** (as of 2026-04-11):
- `app/actions/onboarding.ts` — `updateBasicInfo`, `updateContactInfo`, `updateJourney`
- `app/actions/interests.ts` — no auth checks at all
- 6 server action files with zero auth: `interests.ts`, `tenant-features.ts`, `event-categories.ts`, `exchange-history.ts`, `neighborhoods.ts`, `neighbor-lists.ts`

**Canonical secure pattern** — `app/actions/profile.ts`:
```typescript
// ✅ CORRECT — authenticate, verify, then use admin client
const supabaseAuth = await createClient()
const { data: { user } } = await supabaseAuth.auth.getUser()
if (!user) throw new Error("Unauthorized")
if (user.id !== userId) throw new Error("Forbidden")
const supabase = createAdminClient()
```

## Backoffice Login Enumeration Risk

Backoffice login queries `users` table by email instead of auth user ID, enabling email enumeration. Fix: query by `user.id` after successful auth.

## Related

- `lessons/idor-prevention.md` — IDOR prevention in server actions
- `lessons/backoffice-client-side-mutations.md` — Backoffice mutation risks
- `concepts/authz-boundaries.md` — Authorization boundaries

## Critical: Admin Client Authorization Gap (2026-04-11 Audit)

**Vulnerable pattern** — admin client used without verifying caller identity:

```typescript
// ❌ VULNERABLE — accepts userId with no verification
export async function updateBasicInfo(userId: string, data: {...}) {
    const supabase = createAdminClient()  // ← NO auth verification
    await supabase.from("users").update({...}).eq("id", userId)
}
```

**Affected files** (as of 2026-04-11):
- `app/actions/onboarding.ts` — `updateBasicInfo`, `updateContactInfo`, `updateJourney`
- `app/actions/interests.ts` — no auth checks at all
- 6 server action files with zero auth: `interests.ts`, `tenant-features.ts`, `event-categories.ts`, `exchange-history.ts`, `neighborhoods.ts`, `neighbor-lists.ts`

**Canonical secure pattern** — `app/actions/profile.ts`:
```typescript
// ✅ CORRECT — authenticate, verify, then use admin client
const supabaseAuth = await createClient()
const { data: { user } } = await supabaseAuth.auth.getUser()
if (!user) throw new Error("Unauthorized")
if (user.id !== userId) throw new Error("Forbidden")
const supabase = createAdminClient()
```

## Backoffice Login Enumeration Risk

Backoffice login queries `users` table by email instead of auth user ID, enabling email enumeration. Fix: query by `user.id` after successful auth.

## Related

- `lessons/idor-prevention.md` — IDOR prevention in server actions
- `lessons/backoffice-client-side-mutations.md` — Backoffice mutation risks
- `concepts/authz-boundaries.md` — Authorization boundaries