# API Reference

The Río AI Agent provides a set of endpoints through the Next.js BFF (Vercel) and the standalone Agent service (Railway).

## Authentication & Headers

All requests to the BFF must include a valid **Supabase JWT** in the `Authorization` header.

The BFF communicates with the Railway Agent using a shared secret:
- `x-agent-key`: The shared secret configured in `RIO_AGENT_KEY`.

---

## Chat & Conversation

### `POST /api/v1/ai/chat`
The primary endpoint for interacting with Río. Returns an SSE (Server-Sent Events) stream compatible with the Vercel AI SDK.

**Request Body**:
```json
{
  "messages": [
    { "role": "user", "content": "How do I report a noise complaint?" }
  ],
  "threadId": "tenant-uuid:thread-uuid"
}
```

**Response**:
A tokenized SSE stream (`text/event-stream`).

---

### `POST /api/v1/ai/threads/new`
Creates a new conversation thread for the authenticated user and tenant.

**Response**:
```json
{
  "threadId": "tenant-uuid:thread-uuid",
  "createdAt": "2026-03-31T12:00:00Z"
}
```

---

### `GET /api/v1/ai/threads/active`
Retrieves the most recent active thread for the authenticated user within the last 1 hour.

**Response**:
```json
{
  "threadId": "tenant-uuid:thread-uuid",
  "active": true
}
```

---

---

## Memory Management

These endpoints power the **Privacy Dashboard**, allowing residents to manage what Río learns about them.

### `GET /api/v1/ai/memories`
Fetch all extracted facts for the authenticated resident.

**Response**:
```json
{
  "facts": ["Likes gardening", "Prefers English"],
  "threadId": "optional-uuid"
}
```

---

### `PUT /api/v1/ai/memories`
Update a specific learned fact.

**Request Body**:
```json
{
  "index": 0,
  "content": "Likes advanced gardening and permaculture"
}
```

---

### `DELETE /api/v1/ai/memories`
Remove a fact (GDPR erasure). Triggers historical pruning.

**Query Parameters**:
- `index`: Index of the fact to remove.
- `all`: (boolean) Set to `true` to wipe all memories.

---

## Resident Context Optimization

### `x-resident-context` (Header)
Pass a **Base64-encoded JSON** string containing real-time resident information.
- **Fields**: `bio`, `interests`, `expertise`, `language_preference`.
- **Injection**: This is appended to the system prompt as **Tier 3** context.

---

## Error Codes Reference

| Status | Code | Meaning |
|--------|------|---------|
| `401` | `UNAUTHORIZED` | Invalid or missing Supabase JWT. |
| `403` | `FORBIDDEN` | Tenant mismatch or thread ownership failure. |
| `504` | `GATEWAY_TIMEOUT` | Railway Agent did not respond within 30s. |
| `429` | `TOO_MANY_REQUESTS` | Token budget or rate limit exceeded. |
