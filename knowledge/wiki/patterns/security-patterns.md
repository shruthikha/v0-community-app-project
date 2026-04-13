---
source: nido_patterns
imported_date: 2026-04-08
---

# Security Patterns

## Service Role Verification (CRITICAL)

NEVER use service_role in API routes without auth verification:

```typescript
// ✅ CORRECT: Verify first
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check role
  const { data: profile } = await supabase
    .from('users')
    .select('is_tenant_admin')
    .eq('id', user.id)
    .single();
    
  if (!profile?.is_tenant_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Now safe to proceed with elevated access
}

// ❌ WRONG: No verification
const supabase = createClient(SERVICE_ROLE_KEY);
// Anyone can trigger this!
```

## BFF-First Security Gates

AI config must be derived server-side, not from client:

```typescript
// ✅ CORRECT: Server-side config
const { data: tenant } = await supabase
  .from('tenants')
  .select('is_rag_enabled')
  .eq('id', tenantId)
  .single();

// Client can only DISABLE, never ENABLE
const ragEnabled = tenant?.is_rag_enabled && !clientDisableFlag;

// ❌ WRONG: Client controls config
const ragEnabled = clientPayload.isRagEnabled; // Malicious!
```

## PII Redaction in Logs

Never log raw IDs in production:

```typescript
// ✅ CORRECT: Hash or redact
if (process.env.NODE_ENV !== 'production') {
  console.log('[debug] User:', userId);
}
// Or use hashing for trace-ability without identity
console.log('[debug] User:', hashUserId(userId));

// ❌ WRONG: Raw PII
console.log('[debug] User:', userId);
```

## Middleware Skip Auth Paths

Always skip `/auth/*` to avoid corrupting recovery sessions:

```typescript
// middleware.ts
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const path = request.nextUrl.pathname;
  
  // Skip auth exchange routes
  if (path.startsWith('/auth/')) {
    return NextResponse.next();
  }
  
  // Continue with session check
  // ...
}
```

## Security-First Thread Management

Verify ownership before continuing conversation:

```typescript
// ✅ CORRECT: Verify ownership
const thread = await mastra.threads.get({ threadId });
if (!thread || thread.tenantId !== sessionTenantId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ❌ WRONG: Trust client-provided threadId
// Could allow conversation hijacking
```

## Non-Admin Endpoint Authentication

Service role verification is critical, but so is basic auth on non-admin endpoints:

```typescript
// ❌ WRONG: Upload endpoints with no auth (found 2026-04-11)
export async function POST(request: Request) {
  const formData = await request.formData()
  // Anyone can upload files
}

// ✅ CORRECT: Verify session before processing
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Proceed with upload
}
```

## Rate Limiting — Fail-Closed

```typescript
// ❌ FAIL-OPEN — if Redis down, ALL requests allowed
if (!redis) return { success: true }

// ✅ FAIL-CLOSED — if Redis down, reject requests
if (!redis) {
  console.error("[rate-limit] Redis unavailable — failing closed")
  return { success: false, reason: "service_unavailable" }
}
```

## Error Message Sanitization

Never expose Supabase error details to clients (80+ instances found 2026-04-11):

```typescript
// ❌ LEAKS internal details
return NextResponse.json({ error: error.message }, { status: 500 })

// ✅ SAFE — generic message, log details server-side
console.error("[api]", error)
return NextResponse.json({ error: "Internal server error" }, { status: 500 })
```

## SQL Injection Prevention

```typescript
// ❌ STRING INTERPOLATION in subquery (announcements.ts:19)
.not("id", "in", `(SELECT request_id FROM comments WHERE user_id = '${userId}')`)

// ✅ PARAMETERIZED
.not("id", "in", supabase.rpc("get_commented_request_ids", { p_user_id: userId }))
```

## Storage Bucket Least Privilege

```sql
-- ❌ TOO PERMISSIVE — any authenticated user can read documents
CREATE POLICY "Authenticated Read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

-- ✅ LEAST PRIVILEGE — signed URLs only, no direct SELECT
-- Remove the authenticated SELECT policy entirely
```

## Related Patterns

- `patterns/cron-endpoint-security.md` — Cron endpoint security
- `patterns/file-upload-security.md` — File upload security
- `patterns/standardized-error-handling.md` — Error handling standardization
- `lessons/rate-limiting.md` — Rate limiting patterns
- `lessons/pii-log-redaction.md` — PII redaction in logs

## Non-Admin Endpoint Authentication

Service role verification is critical, but so is basic auth on non-admin endpoints:

```typescript
// ❌ WRONG: Upload endpoints with no auth (found 2026-04-11)
export async function POST(request: Request) {
  const formData = await request.formData()
  // Anyone can upload files
}

// ✅ CORRECT: Verify session before processing
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Proceed with upload
}
```

## Rate Limiting — Fail-Closed

```typescript
// ❌ FAIL-OPEN — if Redis down, ALL requests allowed
if (!redis) return { success: true }

// ✅ FAIL-CLOSED — if Redis down, reject requests
if (!redis) {
  console.error("[rate-limit] Redis unavailable — failing closed")
  return { success: false, reason: "service_unavailable" }
}
```

## Error Message Sanitization

Never expose Supabase error details to clients (80+ instances found 2026-04-11):

```typescript
// ❌ LEAKS internal details
return NextResponse.json({ error: error.message }, { status: 500 })

// ✅ SAFE — generic message, log details server-side
console.error("[api]", error)
return NextResponse.json({ error: "Internal server error" }, { status: 500 })
```

## SQL Injection Prevention

```typescript
// ❌ STRING INTERPOLATION in subquery (announcements.ts:19)
.not("id", "in", `(SELECT request_id FROM comments WHERE user_id = '${userId}')`)

// ✅ PARAMETERIZED
.not("id", "in", supabase.rpc("get_commented_request_ids", { p_user_id: userId }))
```

## Storage Bucket Least Privilege

```sql
-- ❌ TOO PERMISSIVE — any authenticated user can read documents
CREATE POLICY "Authenticated Read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

-- ✅ LEAST PRIVILEGE — signed URLs only, no direct SELECT
-- Remove the authenticated SELECT policy entirely
```

## Related Patterns

- `patterns/cron-endpoint-security.md` — Cron endpoint security
- `patterns/file-upload-security.md` — File upload security
- `patterns/standardized-error-handling.md` — Error handling standardization
- `lessons/rate-limiting.md` — Rate limiting patterns
- `lessons/pii-log-redaction.md` — PII redaction in logs