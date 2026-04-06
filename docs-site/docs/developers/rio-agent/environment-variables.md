# Environment Variables

The Río AI Agent requires specific environment variables to be set in both the **Vercel BFF (Frontend)** and the **Railway Agent (Backend)**.

## Vercel BFF (Frontend Proxy)

These variables ensure the proxy can securely communicate with the Railway agent and enforce tenant isolation.

| Variable | Required | Description |
|----------|----------|-------------|
| `RIO_AGENT_KEY` | **Yes** | A shared secret used to authenticate calls from the BFF to the Railway Agent. Must match the agent's `RIO_AGENT_KEY`. |
| `RIO_RAILWAY_URL` | **Yes** (Prod) | The public URL of the Railway service (e.g., `https://rio-agent-production.up.railway.app`). |
| `RIO_AGENT_URL` | Optional | A secondary URL for the agent service. |
| `NODE_ENV` | Yes | Set to `production` or `development`. |

---

## Railway Agent (Backend Service)

These variables configure the Mastra engine, LLM providers, and storage/parsing services.

### Core Credentials
| Variable | Required | Description |
|----------|----------|-------------|
| `RIO_AGENT_KEY` | **Yes** | The shared secret used to validate incoming requests from the BFF. |
| `OPENROUTER_API_KEY` | **Yes** | API key for OpenRouter, providing access to Gemini 2.0 Flash and Claude 3.7. |
| `SUPABASE_URL` | **Yes** | Your Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service role key for administrative access to `pgvector` and metadata tables. |

### Ingestion & Analysis
| Variable | Required | Description |
|----------|----------|-------------|
| `LLAMA_CLOUD_API_KEY` | **Yes** | Key for LlamaParse, used for high-fidelity document structure extraction during RAG ingestion. |

### Observability & Telemetry
| Variable | Required | Description |
|----------|----------|-------------|
| `POSTHOG_API_KEY` | Optional | PostHog project API key for event and trace logging. |
| `POSTHOG_HOST` | Optional | PostHog host (default: `https://us.i.posthog.com`). |

---

## Security Best Practices
1.  **Shared Secret**: Ensure `RIO_AGENT_KEY` is a long, random string (at least 32 characters).
2.  **Service Role Protection**: Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client-side code. It must only reside in the Railway environment.
3.  **Environment Sync**: When adding a new tenant or changing the infrastructure URL, remember to update `RIO_RAILWAY_URL` in the Vercel dashboard.
