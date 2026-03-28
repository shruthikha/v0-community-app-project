# Río Agent: API Reference

This document details the internal API endpoints for the Río AI Agent service running on Railway.

## Base URL
- **Local**: `http://localhost:3001`
- **Railway**: `https://rio-agent-production.up.railway.app` (Internal/Proxied)

---

## 1. System Endpoints

### `GET /health`
Liveness probe used by Railway to verify service availability. Note: Custom registerApiRoute prefixes must not include /api.

**Response**: `200 OK`
```json
{
  "status": "ok"
}
```

### `GET /config-check`
Debug endpoint to verify environment variable presence. Only available in non-production environments.

**Response**: `200 OK`
```json
{
  "RIO_DATABASE_URL": "SET",
  "OPENROUTER_API_KEY": "SET",
  "SUPABASE_URL": "SET",
  "NODE_ENV": "development",
  "PORT": "3001"
}
```

---

## 2. Chat Endpoints

### `POST /chat`
Core SSE streaming endpoint for AI interactions. This endpoint is proxied by the Vercel BFF at `/api/v1/ai/chat`.

**Request Headers**:
| Header | Description |
| :--- | :--- |
| `x-agent-key` | Required. Shared secret (`RIO_AGENT_KEY`) between BFF and Agent. |
| `x-tenant-id` | Required for RLS isolation. |
| `x-user-id` | Required for RLS isolation. |

### 1.5 Chat Request Body
Refined during Sprint 11 QA to handle initial chat states (where `threadId` might be null or empty).

- **messages**: Array of message objects (required).
- **threadId**: `string | null | undefined`. Uses `.nullish()` Zod validation to allow graceful initialization.
- **resourceId**: `string | null | undefined`. Optional identifier, defaults to `rio-chat`.

**Example Request**:
```json
{
  "messages": [{"role": "user", "content": "Hello Río!"}],
  "threadId": "user-123-thread-abc"
}
```

**Response**: `Server-Sent Events (SSE)`
Chunks are returned as JSON objects. For RAG results, the agent streams additional citation data via a specialized protocol:
```text
data: {"token": "The sky is blue."}
data: {"text": "[1]", "type": "data-citations", "data": [{"id": "...", "document_name": "Sky Guide", "excerpt": "The sky is blue...", "source_document_id": "..."}]}
data: [DONE]
```
*Note: The Vercel BFF at `/api/v1/ai/chat` transforms these into `m.parts` for the AI SDK client.*

---

### `POST /ingest`
Trigger ingestion workflow for a specific document. Proxied by Vercel BFF at `/api/v1/ai/ingest`.

**Request Headers**:
| Header | Description |
| :--- | :--- |
| `x-agent-key` | Required. Shared secret (`RIO_AGENT_KEY`) between BFF and Agent. |

**Request Body**:
| Field | Type | Description |
| :--- | :--- | :--- |
| `documentId` | `string` | UUID of the record in `rio_documents`. |
| `tenantId` | `string` | UUID of the tenant. |

**Response**: `202 Accepted`
```json
{
  "status": "queued",
  "message": "Ingestion workflow started"
}
```

---

### `GET /api/v1/ai/ingest-status`
Poll the current ingestion status of a document. Handles tenant authorization.

**Query Parameters**:
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `documentId` | `string` | UUID of the source document. |

**Response**: `200 OK`
```json
{
  "data": {
    "status": "processing",
    "hasError": false
  }
}
```

---

## 3. Security
- **Authentication**: Proxied by Vercel BFF which enforces Supabase Auth.
- **Shared Secret**: The `x-agent-key` header ensures only the BFF can trigger backend-heavy tasks.
- **Isolation**: 
    1. **Thread ID**: Composite key `tenant_id:thread_id` used for session isolation.
    2. **Fetch**: Agent downloads file via `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for processing. Note: The `documents` bucket is **private**. Residents and admins access files via **Signed URLs** generated on the server with 1-hour expiries.
    3. **RLS**: Row Level Security is enabled on **all core tables**, enforced via `tenant_id` and `user_id` columns.
    4. **Thread Scoping**: Access to `rio_threads` and `rio_messages` is strictly limited to the `user_id = auth.uid()` to prevent cross-user leakage within a tenant.
    5. **Vector Pre-filtering**: ANN search pre-filters by `metadata->'tenant_id'` to prevent candidate leakage.
- **Permissions**: Ingestion triggers are restricted to `tenant_admin` and `super_admin` roles at the BFF layer.
- **Database SSL**: To prevent `SELF_SIGNED_CERT_IN_CHAIN` crashes on managed databases (e.g. Railway), the service defaults to `rejectUnauthorized: false` unless a `RIO_DATABASE_CA` is provided. This allows flexible security hardening without environmental configuration burden.
