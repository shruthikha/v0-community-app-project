source: idea
imported_date: 2026-04-08
---
# Río: Architecture and Technology Evaluation for an AI Community Assistant

**Río is architecturally feasible, economically compelling, and can be built by a small team.** At $3/lot/month with ~300 residents, monthly revenue of $900 per community faces infrastructure costs of just $35–60 — a **95%+ gross margin** where LLM inference represents under 3% of revenue. The recommended stack centers on a TypeScript-native approach with Mastra + Vercel AI SDK for the agent layer, Supabase pgvector with RLS for RAG and memory, and a multi-model LLM router using Gemini 2.5 Flash for routine queries with Claude Sonnet for complex reasoning. This report evaluates all ten architecture domains and closes with an integrated architecture diagram and prototyping plan.

---

## 1. Mastra emerges as the agent framework of choice

The framework landscape has consolidated around four serious options. After evaluating maturity, feature completeness, deployment fit, and operational complexity, **Mastra (TypeScript)** is the strongest choice for Río's constraints — a small team already building on Next.js 16, TypeScript, and Vercel.

**Mastra** (v1.9.0, 21.8K GitHub stars, $13M seed from YC) provides agents, workflows with suspend/resume for human-in-the-loop, built-in RAG, short- and long-term memory, evals, and pluggable auth with RBAC — all TypeScript-native. It runs on Vercel AI SDK under the hood, ships server adapters that expose agents as HTTP endpoints, and deploys directly to Vercel or any Node.js host. Enterprise adopters include Replit (Agent 3), PayPal, Adobe, and Docker.

**PydanticAI** (v1.67.0, 15.3K stars) is the strongest Python alternative. Its dependency injection system maps beautifully to multi-tenant auth context, AG-UI integration is first-party, and durable execution via Temporal enables robust human-in-the-loop workflows. The CopilotKit + PydanticAI + FastAPI stack is production-proven. However, it requires a **separate Python microservice** — two runtimes, two CI/CD pipelines, and a network hop between frontend and agent. For a small team, this operational tax is significant.

**Vercel AI SDK v6** (beta, 20M+ monthly NPM downloads) added `ToolLoopAgent` and `needsApproval` for tool confirmation, but remains lower-level — no built-in RAG pipeline, memory, or eval framework. It excels as a foundation layer (which Mastra already uses internally).

**LangGraph** (v1.0) offers powerful graph-based orchestration adopted by Klarna and Uber, but its complexity is disproportionate to Río's relatively linear workflows. The TypeScript version is less mature than Python, and the ecosystem nudges toward paid LangSmith and LangGraph Platform.

| Criterion             | Mastra                     | PydanticAI                | Vercel AI SDK v6           | LangGraph              |
| --------------------- | -------------------------- | ------------------------- | -------------------------- | ---------------------- |
| Language              | TypeScript                 | Python                    | TypeScript                 | Both                   |
| Next.js/Vercel fit    | Native                     | Microservice              | Native                     | Microservice           |
| RAG pipeline          | Built-in                   | Examples only             | None                       | Via LangChain          |
| Human-in-the-loop     | Workflow suspend/resume    | Durable execution + AG-UI | `needsApproval`(v6 beta) | Interrupt nodes        |
| Memory                | Built-in short + long-term | DIY (DI-friendly)         | DIY                        | Built-in checkpointing |
| Multi-tenant          | Auth + RBAC                | DI for context            | DIY                        | Thread isolation       |
| Evals                 | Built-in                   | Pydantic Evals            | None                       | Via LangSmith          |
| Maturity              | v1 since Nov 2025          | v1 since Sep 2025         | v5 stable, v6 beta         | v1 since Oct 2025      |
| Deployment complexity | Single deploy              | Two services              | Single deploy              | Two services           |

 **Recommendation** : Use **Mastra** as the primary agent framework, running within the Next.js/TypeScript stack. This eliminates the Python microservice entirely for agent logic. Reserve PydanticAI as a fallback if Mastra's younger age causes friction — the AG-UI bridge via CopilotKit makes a future migration to Python feasible without rewriting the frontend.

**The Python vs. TypeScript decision** ultimately hinges on team composition. For a team already invested in TypeScript and Vercel, the single-stack advantage of Mastra outweighs the Python AI ecosystem's depth. The gap is narrowing fast.

---

## 2. Vercel AI SDK v6 wins the frontend, with AG-UI as an emerging standard

The frontend chat UI needs streaming, human-in-the-loop confirmation cards, generative UI components, and flexible embedding in a bento-style dashboard.

**Vercel AI SDK v6 + AI Elements** is the recommended frontend approach. It is completely free (Apache 2.0), offers 25+ production-ready shadcn/ui-based components (Conversation, Message, PromptInput, Sources, Tool display), and its new `needsApproval` flag on tool definitions directly handles the create-event / post-listing / RSVP confirmation pattern. AI Elements are copy-pasted into your codebase (shadcn philosophy), giving full CSS control for bento dashboard embedding. Thomson Reuters built CoCounsel — an AI legal assistant serving 1,300 firms — with **three developers in two months** using this SDK.

**CopilotKit** (28K stars, used by 10%+ of Fortune 500) offers faster time-to-copilot with drop-in components (`CopilotSidebar`, `CopilotPopup`, `CopilotChat`) and superior state sync via `useAgent()`. It created the AG-UI protocol. However, the Team tier at **$1,000/seat/month** is prohibitive for a startup, and while the open-source version is capable, premium features (headless UI, observability) require paid plans.

**The AG-UI protocol** (launched May 2025 by CopilotKit) standardizes ~16 event types across five categories: lifecycle, text messages, tool calls, state sync, and interrupts. Adoption is strong — LangGraph, CrewAI, Mastra, PydanticAI, Google ADK, and AG2 all support it natively. Oracle, Microsoft, and Google have announced protocol partnerships. It is complementary to MCP (agent ↔ tools) and A2A (agent ↔ agent). Core event types are stable for production use, though edge features (multi-modal, generative UI specs) remain in draft.

**Chainlit** should be avoided — the original team stepped back from development in May 2025, its `@chainlit/react-client` depends on the deprecated Recoil library, and embedding it in Next.js requires a separate Python service.

 **Recommendation** : Start with **Vercel AI SDK v6 + AI Elements** for zero cost and maximum control. Use Mastra's server adapters to expose the agent backend, connecting to the frontend via AI SDK's `useChat`. If richer generative UI or state sync becomes necessary, evaluate CopilotKit's open-source tier later — the AG-UI protocol ensures backend interoperability.

---

## 3. Custom RAG on Supabase pgvector delivers at a fraction of managed costs

At 50–100 documents per community producing under 10K vectors, **pgvector on Supabase with RLS** is not only sufficient — it outperforms dedicated vector databases on accuracy and latency at this scale. Benchmarks show pgvector achieving **4× better QPS than Pinecone at 0.99 accuracy** (vs. Pinecone's 0.94) for datasets under 10M vectors. HNSW indexing keeps searches under 5ms.

The critical advantage is  **database-level multi-tenant isolation** . RLS policies attached to the embeddings table enforce community boundaries at the PostgreSQL engine level — mathematically impossible for tenant data to cross. This is stronger than application-level partitioning offered by managed RAG services.

 **For Spanish/English embeddings** , the landscape offers a clear winner for this bilingual use case: **Jina Embeddings v2 base-es** is purpose-built for balanced Spanish-English performance, outperforming general multilingual models on Spanish benchmarks specifically. At 768 dimensions, it's compact enough for pgvector efficiency. If cost is the primary concern, **OpenAI text-embedding-3-small** at $0.02 per million tokens offers solid multilingual quality — embedding all 100 documents costs roughly  **$0.01 per community** .

For document parsing, community documents (bylaws, meeting minutes, Google Docs) are typically well-structured text. **LlamaParse** (~6s per document regardless of size) provides fast, consistent results. For Google Drive integration, export documents via the Drive API, then parse. For chunking, **recursive character splitting at 400–512 tokens with 50-token overlap** matches semantic chunking quality up to ~5K tokens per a NAACL 2025 finding, at a fraction of the compute cost.

 **Managed alternatives worth noting** : **Ragie** ($100/month Starter) offers turnkey multi-tenant RAG with "Partitions" that map directly to communities, native Google Drive connectors, and multilingual hybrid search. This is the pragmatic choice if the team cannot invest 2–4 weeks building a custom pipeline. The trade-off is vendor lock-in and less control over embedding quality.

| Solution                             | Monthly cost (10 communities) | Multi-tenant         | Engineering effort | Lock-in risk |
| ------------------------------------ | ----------------------------- | -------------------- | ------------------ | ------------ |
| **Supabase pgvector + custom** | ~$25–50                      | RLS (database-level) | 2–4 weeks         | Very low     |
| **Ragie**                      | $100–500                     | Partitions           | Days               | High         |
| **Vectara**                    | $500+                         | Built-in             | Low                | Very high    |
| **Pinecone**                   | $0–20                        | Application-level    | Low                | High         |

 **Recommendation** : Build a custom RAG pipeline on **Supabase pgvector with RLS** using Jina or OpenAI embeddings and LlamaParse for document processing. The cost is ~$25/month (Supabase Pro) plus negligible embedding API costs, versus $100–500/month for managed alternatives. Use Ragie only if initial development bandwidth is critically limited.

---

## 4. A multi-model router keeps LLM costs under 3% of revenue

LLM costs are emphatically **not the bottleneck** for Río. Even using Claude Sonnet exclusively at $3/$15 per million tokens, a 300-resident community generating 100 daily conversations costs roughly **$25–70/month** against $900 in revenue. A multi-model router reduces this further.

The recommended strategy routes **75–80% of traffic** through a cheap workhorse model and **20–25%** through a premium model for complex reasoning and tool orchestration:

* **Workhorse** : **Gemini 2.5 Flash** ($0.30/$2.50 per MTok) — strong reasoning at the lowest cost, 1M context, excellent Spanish, 220 tokens/second
* **Premium** : **Claude Sonnet 4** ($3/$15 per MTok) — industry-leading tool use reliability and the best bilingual quality, with explicit Spanish optimization
* **Classifier** : **GPT-4.1-nano** ($0.10/$0.40 per MTok) — ultra-cheap intent routing to select the appropriate model
* **Embeddings** : **OpenAI text-embedding-3-small** ($0.02/MTok) — negligible cost at any scale

With **prompt caching** (50–70% cache hit rates for repeated system prompts), total LLM costs drop to **$11–17/month** for the medium scenario. This represents  **1.2–1.9% of revenue** .

| Scale                   | Conversations/mo | Router cost              | Revenue | Margin |
| ----------------------- | ---------------- | ------------------------ | ------- | ------ |
| Small (50 residents)    | 600              | ~$3–5/mo    | $150/mo   | ~97%    |        |
| Medium (300 residents)  | 3,000            | ~$15–25/mo  | $900/mo   | ~97%    |        |
| Scale (3,000 residents) | 15,000           | ~$80–120/mo | $9,000/mo | ~99%    |        |

**DeepSeek** offers compelling pricing ($0.28/$0.42 per MTok) but carries unacceptable risk for a SaaS handling resident data — all data routes through Chinese servers subject to National Intelligence Law, it has a documented security breach (1M+ plaintext logs exposed), and CCP narrative alignment is baked into model weights. Skip it.

**Self-hosting** open models (Llama, Mistral, Qwen) is not viable at this scale. GPU cloud costs ($2K–5K/month) exceed API costs ($10–70/month) by 30–700×. The breakeven requires ~2M tokens/day at 70%+ GPU utilization.

**BYOK architecture** should be designed from day one via a provider abstraction layer, but implemented as a feature later. Start with platform-managed keys. The key gotchas when switching models: different tool-calling schemas, different caching mechanisms, different tokenizers, and materially different responses to the same system prompt.

---

## 5. Build memory in Supabase, borrow extraction patterns from LangMem

The three-layer memory architecture — conversation history, extracted facts, compressed summaries — is well-proven. The critical question is build vs. buy.

**Custom Supabase implementation** is the clear winner for Río's constraints. The memory tables sit alongside resident profiles in the same PostgreSQL database, protected by the same RLS policies. A resident's memory is just rows in `extracted_memories` with an embedded vector column — searchable via pgvector, deletable via a single `DELETE CASCADE`, and GDPR-compliant by construction.

The extraction pipeline runs after each conversation as a background job: pass the conversation to a cheap LLM (Haiku/Flash) with a structured prompt that extracts facts, preferences, interests, and skills as JSON. Check against existing memories for duplicates using embedding similarity. Store new facts, mark superseded ones. Periodically compress old conversation history into summaries.

**Mem0** ($249/month for Pro tier) offers best-in-class extraction quality with 3 lines of integration code, but creates a split data architecture — user profiles in Supabase, memories in Mem0's infrastructure. Multi-tenant isolation is API-level (user_id parameter), not database-level RLS. For a privacy-critical platform, this is a meaningful downgrade.

**Zep** (temporal knowledge graph via Graphiti) provides state-of-the-art retrieval benchmarks (94.8% accuracy) but requires Neo4j infrastructure entirely separate from Supabase. Overkill for a residential assistant.

**LangMem** (LangChain's memory SDK) offers excellent extraction patterns with `AsyncPostgresStore` that connects directly to Supabase's PostgreSQL. Its three memory types (semantic, episodic, procedural) and "subconscious" background processing align perfectly with Río's needs. However, it's tightly coupled to LangGraph — adapt its **patterns** rather than importing the library directly if using Mastra.

| Solution                                   | Supabase fit | Privacy    | Cost/mo   | Extraction quality      |
| ------------------------------------------ | ------------ | ---------- | --------- | ----------------------- |
| **Custom Supabase + LLM extraction** | ★★★★★   | ★★★★★ | ~$35–55  | ★★★★ (you build it) |
| **Mem0 Pro**                         | ★★☆       | ★★★★   | $249      | ★★★★★              |
| **Zep Flex**                         | ★☆         | ★★★★   | ~$50–150 | ★★★★★              |
| **AWS AgentCore Memory**             | ★☆         | ★★★★★ | Unknown   | ★★★★                |

 **Recommendation** : Build the three-layer memory in  **Supabase with RLS** , using LLM-based fact extraction running as background jobs after conversations. Estimated implementation:  **4 weeks** . If timeline pressure is extreme, use Mem0's open-source self-hosted version pointed at the same Supabase PostgreSQL instance.

---

## 6. Telegram Bot API with admin privileges captures everything needed

The critical finding: **Telegram's privacy mode is enabled by default** for all bots, meaning they only see messages addressed to them. However, **making the bot a group admin** bypasses this entirely — admin bots receive all messages regardless of privacy mode. This aligns perfectly with the "admin explicitly connects the bot" consent model.

**grammY** is the recommended library for a TypeScript stack. It is the spiritual successor to Telegraf with superior TypeScript types, always supports the latest Bot API (currently 9.4), runs on Node.js/Deno/Cloudflare Workers, and has comprehensive documentation. For a Python stack, **python-telegram-bot** (v22.6, fully async) is equally mature.

**Avoid userbot libraries** (Telethon, GramJS). They use the MTProto user API which violates Telegram ToS §5.2 — accounts face 24-hour soft-bans or permanent suspension. The Bot API with admin privileges provides all the message capture Río needs.

 **Summarization should use a hybrid incremental + on-demand approach** . Capture all messages to Supabase in real-time. Generate chunk summaries every 50–100 messages as background jobs. When a resident asks "what did I miss?", combine relevant chunk summaries with recent unsummarized messages and generate a fresh user-facing summary. A moderately active eco-village group (~200 messages/day × 30 tokens each = ~6,000 tokens/day) fits comfortably in any modern context window. Recursive summarization compresses month-long histories to ~12,000 tokens.

 **Privacy architecture** :

* Bot sends an introductory message when joining a group explaining data collection
* Individual opt-out via `/optout` command (messages excluded from summaries)
* Right to erasure via `/deletemydata`
* 90-day retention policy on raw messages; only summaries kept long-term
* `tenant_id` on all message tables with RLS enforcement
* Bot writes using `service_role` key; user-facing API uses authenticated RLS

---

## 7. Railway or Fly.io for the agent backend, Vercel stays as frontend host

Even with Vercel's new Fluid Compute extending timeouts to 800 seconds on Pro,  **Vercel is not suitable for full agent logic** . Multi-step RAG + LLM workflows, Telegram webhook handling, and background jobs (memory extraction, incremental summarization) require an always-on service.

If using Mastra (TypeScript), the agent can run as a standalone Node.js server deployed to Railway or Fly.io while the Next.js frontend remains on Vercel. If using PydanticAI, FastAPI deploys identically to these platforms.

**Railway** ($5/month Hobby, usage-based) offers the simplest developer experience: git-push deploys, automatic FastAPI/Node.js detection, built-in Celery + Redis templates for background jobs, and visual project canvas. Estimated cost for the agent backend: **$5–15/month** at medium scale.

**Fly.io** provides the **best latency for Costa Rica users** — its São Paulo (GRU) region delivers ~50–80ms versus ~100–150ms for US East servers. It uses real Firecracker microVMs with no cold starts. Cost is comparable at **$7–15/month** (shared VM + IPv4).

**Google Cloud Run** is the cost optimization play — potentially **free** under the generous free tier (2M requests, 180K vCPU-seconds/month), with 60-minute request timeouts and a São Paulo region. The trade-off is cold starts (2–5s for Python) and GCP operational complexity.

| Platform            | Best for               | Monthly cost | Latency (Costa Rica)   |
| ------------------- | ---------------------- | ------------ | ---------------------- |
| **Railway**   | Simplicity, small team | $5–15       | ~100–150ms (US)       |
| **Fly.io**    | Latency, Latin America | $7–15       | ~50–80ms (São Paulo) |
| **Cloud Run** | Cost optimization      | $0–15       | ~50–80ms (São Paulo) |
| **Render**    | Predictable pricing    | $7–25       | ~100–150ms (US)       |

 **Communication pattern** : Next.js API routes on Vercel act as a BFF (Backend-for-Frontend) proxy, forwarding requests to the agent backend and streaming SSE tokens back to the client. Telegram webhooks hit the agent backend directly (not through Vercel) to avoid timeout issues.

 **Recommendation** : Start with **Railway** for simplest DX. Migrate to **Fly.io** if Costa Rica latency proves important. Keep Supabase Edge Functions for lightweight tasks only (2-second CPU limit makes them unsuitable for agent logic).

---

## 8. Layered prompt composition with structured admin fields

Non-technical eco-village admins need to customize Río's personality and knowledge without breaking it. The proven pattern is  **layered prompt composition** :

* **Layer 1 (immutable)** : Base system prompt — identity, safety rails, core behavior
* **Layer 2 (admin-configurable)** : Community name, tone, policies, knowledge, custom instructions
* **Layer 3 (runtime)** : Conversation context, RAG results, resident memory

The admin UI should offer **structured fields** for core configuration (community name, tone dropdown, response language, escalation contacts) and **sectioned free-form text areas** for policies and custom instructions. Pre-populated templates with examples ("When asked about parking, respond with: [your parking policy]") help non-technical users understand the format.

 **Guardrails** : Admin input gets sandboxed within clear delimiters in the composed prompt. Input validation blocks prompt injection patterns ("ignore previous instructions"), enforces character limits, and optionally runs content through a lightweight LLM filter. A **draft/live toggle** with a prompt playground where admins test questions before publishing prevents production issues.

 **For prompt management and versioning** , **Langfuse** (MIT license, self-hostable) provides prompt versioning with labels (prod/staging), a UI for editing, SDK-level caching, and traces linked to prompt versions — all at zero cost when self-hosted. This eliminates the need to build version control from scratch.

---

## 9. Langfuse anchors observability, with Helicone for cost tracking

Cross-tenant analytics must never expose raw tenant data. The architecture uses a **nightly aggregation pipeline** that strips PII, classifies conversation topics via LLM-as-judge into predefined categories, and reports only anonymized cluster statistics.

**Langfuse** (MIT, self-hosted = free) is the recommended primary observability platform. It provides framework-agnostic tracing, prompt management, cost tracking via metadata tags (`tenant_id` on every trace), and a built-in evaluation interface. The free self-hosted tier has no usage limits.

**Pydantic Logfire** (10M spans free) is the natural fit if using PydanticAI — same ecosystem, full OpenTelemetry tracing, SQL-queryable traces. **Helicone** (10K requests free, then $79/month Pro) excels specifically as an AI gateway with zero-markup proxying and automatic per-tenant cost breakdowns via custom HTTP headers.

 **Cost tracking per tenant** : Tag every LLM API call with `tenant_id` metadata. Store `{tenant_id, model, input_tokens, output_tokens, cost, timestamp}` per request. Langfuse or Helicone dashboards then show cost per tenant automatically. At scale, this enables usage-based billing tiers beyond the flat $3/lot rate.

 **Eval pipeline** : Run automated LLM-as-judge evals on factuality (is the response grounded in retrieved RAG context?), relevance, and safety. Sample 5–10% of conversations monthly for human admin review. Use **DeepEval** (open-source, 700K+ monthly downloads) or Langfuse's built-in eval capabilities.

---

## 10. Unit economics validate even generous infrastructure spending

The most important finding across all research:  **infrastructure costs are dominated by Supabase's $25/month base, not LLM inference** . This means model quality decisions should prioritize user experience over cost savings.

| Component                       | Small (50 residents)                  | Medium (300 residents) | Scale (10 communities) |
| ------------------------------- | ------------------------------------- | ---------------------- | ---------------------- |
| LLM inference (router strategy) | $3–5                | $15–25        | $80–120               |                        |
| Embeddings                      | <$0.10               | <$0.50         | <$2                    |                        |
| Supabase Pro                    | $25                  | $25            | $25                    |                        |
| Agent hosting (Railway)         | $5                   | $10            | $25                    |                        |
| Observability (self-hosted)     | $0                   | $0             | $0–49                 |                        |
| **Total monthly cost**    | **~$33**       | **~$51** | **~$135–221**   |                        |
| **Monthly revenue**       | **$150**       | **$900** | **$9,000**       |                        |
| **Gross margin**          | **78%**                         | **94%**          | **97–98%**      |

Even at the smallest viable community (50 lots), the $3/lot pricing yields positive unit economics. The **$3/lot price point may actually undervalue the product** — at medium scale, Río costs roughly $0.17/lot/month to operate, leaving $2.83/lot in gross margin. The platform could sustain premium model usage (Claude Sonnet exclusively at ~$70/month) while maintaining 92% margins at 300 residents.

---

## Recommended architecture tying everything together

```
┌────────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js 16)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend: Tailwind + Shadcn UI + AI Elements            │  │
│  │  Chat UI: Vercel AI SDK v6 useChat + AI Elements         │  │
│  │  HITL: needsApproval cards for write operations          │  │
│  │  i18n: next-intl for Spanish/English                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  BFF Proxy: /api/chat → streams from agent backend       │  │
│  │  Auth middleware: Supabase JWT + tenant_id in app_metadata│  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────────────┘
                       │ SSE streaming
┌──────────────────────▼─────────────────────────────────────────┐
│              RAILWAY / FLY.IO (Agent Backend)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Mastra Agent (TypeScript)                               │  │
│  │  ├─ RAG Tool: pgvector search with RLS                   │  │
│  │  ├─ Action Tools: createEvent, postListing, rsvp         │  │
│  │  ├─ Telegram Tool: fetch summaries                       │  │
│  │  ├─ Memory Tool: retrieve/store resident facts           │  │
│  │  └─ Model Router: nano classifier → Flash/Sonnet         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Telegram Bot (grammY) — webhook receiver                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Background Jobs                                         │  │
│  │  ├─ Memory extraction (post-conversation)                │  │
│  │  ├─ Incremental chat summarization (every 50-100 msgs)   │  │
│  │  ├─ Document ingestion (on admin upload/Drive sync)      │  │
│  │  └─ Periodic memory compression                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────┐
│                      SUPABASE                                   │
│  PostgreSQL + pgvector + PostGIS + Auth + RLS + Realtime        │
│  ├─ document_chunks (embeddings + RLS by tenant_id)            │
│  ├─ conversation_messages (full history + RLS)                 │
│  ├─ extracted_memories (facts + embeddings + RLS)              │
│  ├─ resident_summaries (compressed profiles + RLS)             │
│  ├─ telegram_messages (archived chats + RLS)                   │
│  ├─ telegram_summaries (incremental summaries + RLS)           │
│  ├─ tenant_config (admin prompt customizations)                │
│  └─ llm_usage_log (per-tenant cost tracking)                   │
└────────────────────────────────────────────────────────────────┘
```

 **Key design decisions in this architecture** :

* **Single TypeScript stack** with Mastra for agent logic and grammY for Telegram, deployed to Railway as a standalone Node.js server. No Python needed.
* **Every table has `tenant_id`** with RLS policies enforced via JWT `app_metadata`. The bot writes using `service_role`; user-facing queries go through authenticated RLS.
* **Model router** uses rule-based classification initially (simple Q&A → Gemini 2.5 Flash; tool use or complex reasoning → Claude Sonnet; classification → GPT-4.1-nano), evolving to an LLM-based classifier as usage patterns emerge.
* **BYOK** is architecturally supported via a `tenant_config` table storing encrypted API keys and model preferences, but implemented as a feature only after the core product is validated.
* **Prompt composition** merges immutable base prompt + admin customizations from `tenant_config` + runtime RAG context + resident memory at each request.

---

## Prototyping plan for validating highest-risk assumptions

The riskiest unknowns are not technical — they are product assumptions. The following four-sprint plan validates each in order of business risk.

**Sprint 1 (Weeks 1–2): RAG quality over community documents**
Validate that Río gives genuinely useful answers to community questions. Set up Supabase pgvector, ingest 20 real community documents (bylaws, guides), implement basic retrieval with Jina or OpenAI embeddings, and test with 50 real questions in both Spanish and English.  **Success metric** : >80% of answers rated "useful" by community admin.  **Risk being tested** : Is RAG quality sufficient for real community knowledge, or do documents need special preprocessing?

**Sprint 2 (Weeks 3–4): Chat UI with human-in-the-loop actions**
Build the Mastra agent with Vercel AI SDK v6 frontend, implementing one write action (create event) with `needsApproval` confirmation. Test streaming latency, confirmation flow UX, and multi-tenant isolation.  **Success metric** : End-to-end action completes in <5 seconds with clear confirmation UX.  **Risk being tested** : Does the Mastra + AI SDK stack support the full HITL flow in production, or are there gaps?

**Sprint 3 (Weeks 5–6): Telegram integration and summarization**
Deploy grammY bot, connect to a test group with admin privileges, store messages, and implement "what did I miss?" with hybrid summarization.  **Success metric** : Summaries accurately capture key topics and decisions from 3 days of chat.  **Risk being tested** : Does the Bot API actually capture all messages reliably? Is summarization quality useful to residents?

**Sprint 4 (Weeks 7–8): Memory and personalization**
Implement the three-layer memory schema, build the LLM extraction pipeline as a background job, and test personalization across 10+ conversations per resident.  **Success metric** : By conversation 5, the assistant demonstrably references prior context that improves the response.  **Risk being tested** : Does extracted memory meaningfully improve the user experience, or is it invisible?

Each sprint produces a deployable increment. The output of all four sprints is a functional MVP covering all core Río capabilities, deployed on Railway + Vercel + Supabase, ready for a pilot community in Costa Rica.

# Architecture and Technology Evaluation for Río: A Multi-Tenant AI Community Assistant

The engineering of Río, an AI-driven community assistant tailored for multi-tenant eco-villages and intentional communities, demands an architecture that carefully balances advanced artificial intelligence capabilities with stringent constraints on cost, data privacy, and operational overhead. The target deployment stack—Next.js 16 utilizing the App Router, TypeScript, Supabase for PostgreSQL and authentication, Tailwind CSS, and Shadcn UI on Vercel—establishes a modern, serverless-first baseline.

Building an assistant capable of semantic knowledge retrieval, conversational synthesis, persistent memory, and authorized platform actions requires navigating a complex landscape of emerging frameworks. The multi-tenant nature of the platform necessitates strict data isolation via Row Level Security (RLS) to ensure that inter-community data boundaries are mathematically enforced at the database level. Furthermore, the economic model—capped at approximately $3 per lot per month—strictly invalidates heavy infrastructure expenditures or inefficient large language model (LLM) orchestration.

The following exhaustive research report evaluates the technology landscape across ten critical domains, synthesizing the optimal architecture for Río through deep comparative analysis.

## 1. Agent Framework & Architecture

The selection of an agent framework defines the fundamental control plane of the application. It dictates how the language model interfaces with platform tools, manages conversational state, and handles asynchronous human-in-the-loop (HITL) approval workflows for write operations.

### Recommendation

The optimal framework for this architecture is  **Mastra (TypeScript)** . Operating natively within the Next.js and Vercel AI SDK ecosystem, Mastra provides robust, production-ready primitives for agent routing, workflows, and tool execution without requiring the team to fracture the codebase into multiple languages.^^ Mastra orchestrates complex multi-agent topologies through an `Agent Network` pattern, utilizing a supervisor routing mechanism that allows a primary LLM to delegate specialized tasks (e.g., RAG querying vs. platform action execution) to sub-agents.^^ By maintaining a homogeneous TypeScript stack, the engineering team can share types between the frontend components and the agent backend, vastly accelerating development velocity. Furthermore, Mastra natively supports Bring Your Own Key (BYOK) architectures, allowing provider options to be configured on a per-tenant or per-message basis.^^

### Alternatives Considered

| **Framework**        | **Language** | **Architecture** | **Evaluation**                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PydanticAI**       | Python             | ReAct / Fast-API       | Built by the Pydantic team, this framework offers unparalleled type safety, native structured outputs, and a highly mature Agent-User Interaction (AG-UI) protocol integration.^^It supports advanced dependency injection, which is highly effective for passing Supabase JWTs.^^However, it necessitates deploying and monitoring a separate Python microservice, significantly increasing operational burden.^^ |
| **Vercel AI SDK**    | TypeScript         | React Hooks / Core     | Deeply integrated into Next.js. Version 6 introduced structured workflows and tool execution approval.^^While Mastra is built upon this SDK, using the Vercel AI SDK directly requires developers to manually wire multi-agent orchestration, state synchronization, and memory persistence, leading to higher custom engineering effort.^^                                                                        |
| **LangGraph**        | TS / Python        | Directed Acyclic Graph | Treats agent steps as nodes in a graph, allowing granular control over execution state and cyclical logic.^^While powerful for highly deterministic multi-step enterprise workflows, its steep learning curve and heavy abstraction make it excessive for Río's core use cases.^^                                                                                                                                 |
| **Direct API Calls** | Agnostic           | Custom Orchestration   | Executing raw API calls is simpler for single-turn Q&A. However, for multi-step reasoning with tool callbacks, persistent memory, and human-in-the-loop interruptions, building custom orchestration quickly leads to unmaintainable technical debt.^^                                                                                                                                                             |

### Tradeoffs

Choosing Mastra over PydanticAI sacrifices access to the deeper, more mature Python AI ecosystem (such as native integrations with scientific libraries or advanced data processing tools). It also foregoes PydanticAI's out-of-the-box AG-UI integration, requiring more manual wiring of Server-Sent Events (SSE) to achieve complex generative UI states.^^ However, avoiding the operational complexity of a split stack—managing a Next.js frontend alongside a FastAPI backend—presents a massive advantage for a small team.

### Unknowns

While Mastra's documentation cites robust multi-agent orchestration, its persistent memory sync engine under high concurrent loads across thousands of multi-tenant threads requires rigorous load testing to ensure it does not introduce unacceptable latency during retrieval.^^

### Cost Implications

Hosting Mastra within Next.js API routes on Vercel incurs zero additional base infrastructure costs beyond standard Vercel serverless compute usage. Deploying a separate Python service would add a baseline of $20–$50 per month on platforms like Railway or Render.

### Links

* Mastra Documentation: [mastra.ai/docs](https://mastra.ai/docs/introduction)
* PydanticAI AG-UI Integration: [ai.pydantic.dev/ui/ag-ui/](https://ai.pydantic.dev/ui/ag-ui/)
* Vercel AI SDK Agents: [sdk.vercel.ai/docs/foundations/agents](https://sdk.vercel.ai/docs/foundations/agents)

## 2. Frontend Chat UI & Agent-UI Protocol

Embedding an AI assistant into a multi-tenant dashboard requires a user interface capable of rendering complex, generative UI components—such as event creation forms, community polls, or resident profiles—directly within the chat stream.

### Recommendation

The most effective approach is utilizing **Assistant-UI** combined with the Vercel AI SDK. Assistant-UI is a React component library built on top of Shadcn UI and Tailwind CSS, specifically engineered for generative AI chat experiences.^^ It integrates seamlessly with the Vercel AI SDK, allowing developers to create declarative generative UI components based on structured tool calls emitted by the agent.^^ This approach maintains absolute control over the DOM, styling, and application state, aligning perfectly with Río's existing Next.js and Shadcn architectural baseline.

### Alternatives Considered

| **Framework**                   | **Protocol** | **Evaluation**                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CopilotKit**                  | AG-UI              | Offers powerful drop-in components (`CopilotChat`) and robust state synchronization (`useCoAgent()`).^^It heavily utilizes the AG-UI protocol for human-in-the-loop checkpoints.^^However, it introduces heavy abstractions, proprietary UI rendering techniques, and potential vendor lock-in for headless UI features, which conflicts with a desire for full UI control.^^ |
| **Vercel AI SDK (`useChat`)** | Custom             | Provides low-level React hooks for streaming.^^While highly flexible, developers must manually build the entire visual interface and handle the complex state management of generative UI tool rendering, resulting in repetitive boilerplate.^^                                                                                                                                  |
| **Custom SSE/WebSocket**        | Custom             | Rolling a custom implementation is only necessary if sub-millisecond real-time bidirectional audio/video streaming is required. For text and UI generation, it is an unnecessary re-engineering of established streaming protocols.^^                                                                                                                                             |
| **Chainlit**                    | Python Native      | A Python-native chat UI. It is fundamentally incompatible with a Next.js monolithic architecture without relying on insecure and clunky iframe embedding.                                                                                                                                                                                                                         |

### Tradeoffs

Assistant-UI provides total control over styling and component rendering, but it places the burden of implementing the nuances of the Agent-User Interaction (AG-UI) protocol on the development team. The AG-UI protocol is rapidly becoming an industry standard for communicating tool calls, state snapshots, and human-in-the-loop events.^^ While CopilotKit provides this out of the box, Assistant-UI requires careful mapping of backend state emissions to frontend UI states.

### Unknowns

The transition of the industry toward standardized protocols like A2UI and MCP Apps suggests that generative UI standards are still fluctuating.^^ It remains to be validated how cleanly Mastra's tool call emissions map to Assistant-UI's expected generative UI payload structure under heavy concurrent loads.

### Cost Implications

Assistant-UI is open-source and incurs no licensing fees. CopilotKit offers a free tier, but highly customized headless implementations often require premium enterprise licenses, which would degrade the project's unit economics.^^

### Links

* Assistant-UI: [mastra.ai/guides/build-your-ui/assistant-ui](https://mastra.ai/guides/build-your-ui/assistant-ui)
* AG-UI Protocol Overview: [copilotkit.ai/blog/the-state-of-agentic-ui](https://www.copilotkit.ai/blog/the-state-of-agentic-ui-comparing-ag-ui-mcp-ui-and-a2ui-protocols)
* Vercel AI SDK Generative UI: [vercel.com/blog/ai-sdk-6](https://vercel.com/blog/ai-sdk-6)

## 3. RAG Pipeline — Build vs. Buy

Río must process admin-curated community documents—ranging from poorly formatted PDFs containing bylaws to markdown files of meeting minutes—in both English and Spanish, respecting strict multi-tenant visibility permissions.

### Recommendation

A **Custom RAG pipeline utilizing Supabase `pgvector` and LlamaParse** provides the optimal balance of data sovereignty, RLS compliance, and low recurring costs. By storing document chunks in a `document_sections` table equipped with a `tenant_id` column, Supabase Row Level Security (RLS) physically filters vector similarity searches at the database level based on the user's JWT claims.^^

For document parsing, **LlamaParse** is significantly superior for complex documents. It utilizes agentic OCR to accurately extract tables, messy layouts, and multilingual text, which is critical for legal bylaws and financial meeting minutes.^^ Embedding generation should be handled by OpenAI's `text-embedding-3-small`, which offers exceptional multilingual capability and low latency at a fraction of the cost of older models.

### Alternatives Considered

| **RAG Solution**      | **Type** | **Evaluation**                                                                                                                                                                                                               |
| --------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ragie**             | Managed        | Exceptional developer experience with document partitioning for multi-tenancy.^^However, its pricing model ($100/month Starter, $500/month Pro) severely damages unit economics for a low-cost SaaS targeting small communities.^^ |
| **Vectara**           | Managed        | Enterprise-grade RAG with SOC-2 compliance and hybrid search (BM25 + vectors).^^Starting at $830/month for Pro, it is economically prohibitive.^^                                                                                  |
| **Trieve / Pinecone** | Managed        | Excellent for large-scale enterprise vector search, but introduces an external dependency for data storage, complicating the enforcement of Supabase RLS policies.^^                                                               |
| **Google NotebookLM** | Managed        | Highly capable for end-users, but lacks the programmatic API and strict programmatic multi-tenant isolation required for a white-labeled SaaS platform.                                                                            |
| **Unstructured.io**   | Custom Parser  | A standard open-source parsing tool. However, it struggles with complex layouts and embedded tables compared to the vision-based extraction capabilities of LlamaParse, increasing preprocessing costs.^^                          |
| **LlamaIndex**        | Framework      | Can be used strictly as a data ingestion and chunking orchestration layer, passing the parsed outputs to Supabase. This is viable, but adds dependency weight to the monolithic application.^^                                     |

### Tradeoffs

Building a custom pipeline requires upfront engineering effort to handle chunking strategies (e.g., semantic chunking for bylaws vs. recursive character chunking for casual guides), orchestrate embedding API calls, and manage vector indexing optimizations. However, it circumvents vendor lock-in, avoids data sovereignty issues, and eliminates the high recurring baseline costs associated with RAG-as-a-Service platforms.

### Unknowns

The efficacy of the embedding model across highly colloquial Costa Rican Spanish dialects mixed with English terminology (Spanglish) within the same document requires empirical testing to tune the retrieval similarity thresholds.

### Cost Implications

LlamaParse offers a generous free tier (1,000 pages per day).^^ Supabase `pgvector` incurs no additional software costs beyond the existing database compute. OpenAI embeddings cost mere fractions of a cent per million tokens, representing a near-zero marginal cost compared to managed RAG platforms.

### Links

* Supabase RAG with Permissions: [supabase.com/docs/guides/ai/rag-with-permissions](https://supabase.com/docs/guides/ai/rag-with-permissions)
* LlamaParse vs Unstructured: [llamaindex.ai/compare/llamaparse-vs-unstructured](https://www.llamaindex.ai/compare/llamaparse-vs-unstructured)

## 4. LLM Model Selection

Model selection must balance complex reasoning capability for platform actions, multilingual proficiency (Spanish/English), context window size for Telegram summarization, and strict cost constraints aligned with the ~$3/lot/month pricing model.

### Recommendation

A single-model approach is economically inefficient. Río must implement **Dynamic Model Routing** based on the specific task parameters:

1. **Summarization & Routine Chat (DeepSeek V3 / Gemini 1.5 Flash):** DeepSeek V3 provides exceptional reasoning at remarkably low costs ($0.14/M input tokens), rivaling top-tier models while maintaining strong multilingual coverage.^^ For summarizing massive Telegram chat histories, Gemini 1.5 Flash offers a 1–2 million token context window at $0.075/M input tokens, making it the definitive choice for long-context ingestion.^^
2. **Complex RAG & Platform Actions (Claude 3.5 Sonnet):** For tasks requiring precise tool execution, prompt adherence, and multi-step reasoning, Claude 3.5 Sonnet consistently outperforms competitors. Benchmarks demonstrate that Claude 3.5 Sonnet excels in structured data extraction and maintains thread state stability under tight guardrail prompts, which is critical for human-in-the-loop write operations.^^

### Alternatives Considered

| **Model**                   | **Evaluation**                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GPT-4o**                  | Offers strong multilingual support and lower output costs than Claude 3.5 Sonnet, but trails slightly in advanced coding, agentic reliability, and strict adherence to complex structural prompts.^^                                                   |
| **GPT-4o-mini**             | An excellent fallback for basic conversational turns, but lacks the deep reasoning required for multi-step platform API executions.                                                                                                                    |
| **Gemini 1.5 Pro**          | Highly capable with massive context, but cost-prohibitive for routine operations compared to Flash and DeepSeek V3.^^                                                                                                                                  |
| **Self-hosted Open Source** | Models like Llama 3.3 (70B) or Qwen offer total data privacy. However, self-hosting requires significant GPU infrastructure (e.g., A100 instances), presenting massive fixed costs that destroy the unit economics of a startup with small user bases. |

### Tradeoffs

Implementing a multi-model routing system increases the complexity of the application layer. The system must dynamically choose the provider and handle differing API failure modes and rate limits. However, modern frameworks like Mastra abstract much of this complexity by providing a unified, provider-agnostic interface.^^

### Bring Your Own Key (BYOK) Architecture

To accommodate larger, high-volume communities without breaking the platform's cost model, Río must support a BYOK architecture.^^ This allows tenant administrators to supply their own API keys, bypassing platform rate limits and shifting the LLM cost directly to the community.
Implementation requires a highly secure key management system:

* **Storage:** Keys must be encrypted at rest using a dedicated secrets manager (e.g., AWS KMS or Supabase Vault).^^
* **Execution:** The backend dynamically injects the tenant's API key into the Mastra provider configuration at runtime based on the user's `tenant_id`.^^
* **Validation:** A low-cost test call must validate keys upon entry to ensure adequate permissions.^^

### Cost Implications

Exclusive use of Claude 3.5 Sonnet would cost ~$0.02 to $0.05 per conversation, rapidly consuming the profit margin of a $3/month subscription. DeepSeek V3 lowers this cost by over 90%, allowing the platform to remain highly profitable while reserving expensive tokens only for high-value actions.^^

### Links

* Mastra Provider Configurations: [mastra.ai/models](https://mastra.ai/models)
* BYOK Security Patterns: [daon.com/resource/how-byok](https://www.daon.com/resource/how-byok-empowers-organizations-with-true-data-ownership/)

## 5. Agent Memory & Personalization

An AI assistant that learns resident preferences over time transforms from a generic chatbot into a personalized community concierge. This requires an architecture capable of retaining long-term facts without infinitely expanding the context window, which triggers the "Token Cost Trap".^^

### Recommendation

Río should implement a **Three-Tier Custom Memory Architecture** utilizing its existing Supabase infrastructure. This ensures strict RLS multi-tenant isolation and eliminates third-party data compliance risks.^^

1. **Working Memory (Short-Term):** The raw message log of the current active session, strictly pruned to the last 10–20 turns.
2. **Semantic Memory (Episodic):** Older conversations are summarized by a background job (e.g., utilizing the highly affordable DeepSeek V3) and embedded into `pgvector`. This allows the agent to semantically retrieve past interactions relevant to the current query.^^
3. **Structured Entity Memory (Long-Term):** An LLM-driven process extracts concrete facts (e.g., "Resident owns a dog," "Resident is a carpenter," "Resident lives in Lot 42") and updates a structured JSONB column in the `user_profiles` table. The agent interacts with this data via an explicit `execute_sql` or `update_user_profile` tool scoped securely by Postgres roles.^^

### Alternatives Considered

| **Solution**          | **Architecture** | **Evaluation**                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mem0**              | Managed SaaS           | A highly mature managed memory platform that automatically extracts entities, builds knowledge graphs, and compresses context.^^While highly capable, it introduces a separate data silo, complicates RLS integration, and imposes a starting cost of $19–$249/month, which significantly damages unit economics.^^ |
| **Zep**               | Managed / Self-Hosted  | Offers advanced long-term memory and entity extraction.^^It can be self-hosted, but doing so adds significant operational overhead and database management to the small engineering team.                                                                                                                            |
| **Bedrock AgentCore** | Enterprise Cloud       | Offers native enterprise memory strategies but requires deep entanglement with the AWS ecosystem, which conflicts with the Vercel/Supabase stack.                                                                                                                                                                    |
| **PydanticAI Native** | Framework-Level        | Offers robust `message_history`and `history_processors`. However, it focuses primarily on short-term state management rather than long-term vector-backed episodic memory retrieval.                                                                                                                             |

### Tradeoffs

A custom implementation requires building the extraction, pruning, and summarization logic natively within the TypeScript application. However, utilizing Supabase guarantees that resident memories are physically and logically bound to their specific tenant and user ID via RLS, ensuring absolute regulatory and privacy compliance.^^ It also avoids paying premium API fees to third-party memory providers.

### Unknowns

The optimal threshold for triggering background summarization (e.g., after every session vs. nightly cron jobs) requires profiling to balance compute costs against real-time personalization accuracy.

### Cost Implications

By lazily loading relevant context via vector search rather than stuffing the entire conversation history into every prompt, token costs per conversation can be reduced by 60% to 80%, avoiding exponential cost growth as users interact with the platform over months.^^

### Links

* Supabase LLM Memory Architecture: [supabase.com/blog/natural-db](https://supabase.com/blog/natural-db)
* The Token Cost Trap: [medium.com/@klaushofenbitzer/token-cost-trap](https://medium.com/@klaushofenbitzer/token-cost-trap-why-your-ai-agents-roi-breaks-at-scale-and-how-to-fix-it-4e4a9f6f5b9a)

## 6. Telegram Integration

Eco-villages and intentional communities heavily rely on Telegram groups for daily coordination. Archiving, organizing, and summarizing these chaotic, high-volume chats is a critical value proposition for Río.

### Recommendation

The Telegram integration should be built using the **`grammY` framework (TypeScript/Node.js)** deployed on  **Supabase Edge Functions** .^^ `grammY` is a highly performant, modern framework that interacts seamlessly with the Telegram Bot API via webhooks. When a message is received, the Edge Function processes the payload, extracts text, media captions, and reply structures (utilizing `reply_to_message_id` to maintain conversation trees), and inserts the raw data into a multi-tenant `telegram_messages` Supabase table.^^

To address Telegram's strict API limitations, the bot administrator must disable the default "Privacy Mode" via `@BotFather` (`/setprivacy`) and promote the bot to a group administrator. Without this, the bot will only receive commands starting with `/`, direct replies, and mentions, completely failing to capture the ambient community dialogue required for effective summarization.^^

### Alternatives Considered

| **Library**             | **Language** | **Evaluation**                                                                                                                                                                                                                                                            |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **python-telegram-bot** | Python             | The most popular and robust Python option. However, it requires a separate Python microservice deployment, fracturing the codebase.^^                                                                                                                                           |
| **Telegraf**            | TypeScript         | A very capable Node.js library, but `grammY`was written specifically to modernize Telegraf's architecture, offering better type safety, middleware composition, and Edge environment compatibility.^^                                                                         |
| **Telethon / Pyrogram** | Python (MTProto)   | These are "userbot" libraries that interact with Telegram's core MTProto API rather than the Bot API. While they can bypass Privacy Mode limitations without admin privileges, they violate Telegram's Terms of Service for automated scraping and risk permanent account bans. |

### Tradeoffs

Storing high volumes of raw text messages indefinitely will rapidly inflate Supabase storage costs.^^ To mitigate this, the system must implement an asynchronous process (via `pg_cron`) to aggregate and summarize messages older than 7 days, purging the raw text to maintain lean storage metrics. Furthermore, Telegram limits media captions to 1024 characters, requiring the bot to handle long messages gracefully.^^

### Unknowns

Supabase Edge Functions have strict execution timeout limits. If a group chat experiences a massive burst of messages, the webhook handler must immediately acknowledge the request and offload intensive processing to an asynchronous queue to prevent timeouts and lost messages.^^ The exact queueing architecture (e.g., using Postgres `SKIP LOCKED` queues) must be prototyped.

### Cost Implications

Processing millions of messages per month requires ultra-low-cost summarization models. Gemini 1.5 Flash is ideal here due to its high context window and sub-cent pricing per million tokens.^^ Storage costs on Supabase are negligible if aggressively pruned.

### Links

* grammY Framework on Supabase:([https://www.youtube.com/watch?v=AWfE3a9J_uo](https://www.youtube.com/watch?v=AWfE3a9J_uo))
* Telegram Bot Privacy Mode: [core.telegram.org/bots/features#privacy-mode](https://core.telegram.org/bots/features#privacy-mode)

## 7. Deployment Architecture

The deployment architecture dictates the operational overhead, scalability, and integration friction of the entire system. A small engineering team must fiercely protect its time by minimizing infrastructure management.

### Recommendation

The entire application—frontend, API routes, and agent backend—should be deployed on **Vercel** utilizing Next.js App Router API routes.^^ Background tasks, cron jobs, and webhook handlers should utilize  **Supabase Edge Functions** .^^ By keeping the Mastra agent framework within the Next.js API routes, the system avoids the operational complexity of a split stack. Vercel's Edge runtime enables streaming for generative UI, which keeps connections alive and circumvents some standard serverless timeout restrictions while delivering tokens progressively to the client.

### Alternatives Considered

| **Platform**         | **Architecture** | **Evaluation**                                                                                                                                                                                                                                                                                 |
| -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Railway / Render** | Docker/Container       | If a Python framework (PydanticAI) were chosen, these containerized PaaS solutions would be necessary.^^They offer durable execution and long-running processes but require managing Dockerfiles, CI/CD pipelines, and network security bridging between the Vercel frontend and the Python backend. |
| **Fly.io**           | Global Edge VM         | Excellent for low-latency stateful applications, but introduces significant DevOps overhead for a small team compared to Vercel's push-to-deploy ecosystem.                                                                                                                                          |
| **Modal**            | Serverless Python      | Exceptional for bursty Python AI workloads with massive scale-to-zero GPU capabilities, but introduces another vendor and billing dashboard into the stack.                                                                                                                                          |
| **AWS Lambda**       | Serverless             | Powerful, but configuring API Gateways, VPCs, and IAM roles requires dedicated platform engineering effort.                                                                                                                                                                                          |

### Tradeoffs

Vercel Serverless Functions have strict timeout limits (typically 15 to 60 seconds on standard plans, extendable to 5 minutes on Pro). Multi-step agent workflows utilizing Claude 3.5 Sonnet may occasionally exceed these limits if network latency is high or multiple retry loops are required. Long-running tasks, such as generating massive monthly analytics reports, must be offloaded to background jobs rather than executed inline.

### Unknowns

While Vercel Edge functions support streaming, certain Node.js APIs required by complex database drivers or third-party integrations are not available in the Edge runtime. Ensuring compatibility between Mastra, Supabase drivers, and the Edge environment requires immediate technical validation.

### Cost Implications

Deploying a monolithic TypeScript application on Vercel Pro ($20/month per developer) avoids the baseline compute costs of running dedicated containerized microservices ($20–$50/month per environment) and simplifies the CI/CD pipeline.

### Links

* Vercel AI SDK Deployment: [vercel.com/kb/guide/how-to-build-ai-agents](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)
* Supabase Edge Functions: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

## 8. Tenant Admin Prompt Customization

To successfully scale across diverse eco-villages, tenant administrators must have the autonomy to customize Río's behavior, tone, and specific community regulations without requiring platform engineers to alter the core source code.

### Recommendation

The admin dashboard should utilize a  **Bento-Box UI pattern with Structured Guardrails** .^^ Exposing a massive, intimidating blank text area for system prompt engineering to non-technical users inevitably leads to broken agents. Instead, the UI should compartmentalize the prompt into discrete, structured fields:

* **Persona & Tone:** (e.g., "Friendly, uses Pura Vida often.")
* **Community Policies:** (e.g., "Quiet hours are 10 PM to 6 AM.")
* **Action Permissions:** Checkboxes enabling/disabling the agent's ability to execute specific tools, like creating calendar events or posting marketplace listings.

These distinct fields are concatenated programmatically on the backend to form the final system prompt.^^

### Security and Sandboxing

Exposing prompt customization introduces severe risks of prompt injection, where a malicious or negligent admin could attempt to override the platform's multi-tenant constraints or extract internal system data.^^

* **Immutable Core Prompt:** Admin-defined text must never be concatenated into the SQL-generating instructions or core RLS constraint logic. The platform's security boundaries must remain utterly immutable.^^
* **Input Sanitization:** Guardrails must filter prompt updates containing override commands (e.g., "Ignore all previous instructions").^^
* **Testing Sandbox:** The UI must feature an isolated chat window allowing admins to test their custom instructions against simulated resident queries before deploying them live to the community.^^

### Alternatives Considered

| **Approach**              | **Evaluation**                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free-form Text Box**    | Simple to build, but overwhelming for non-technical users. Increases the risk of conflicting instructions and degraded agent performance.^^ |
| **Fully Managed Prompts** | Highly secure, but eliminates the white-label customizability that justifies a premium SaaS subscription for intentional communities.       |

### Tradeoffs

Building a structured prompt UI requires significantly more frontend engineering than a simple text area. However, it drastically reduces customer support tickets caused by administrators breaking their own agents with poorly engineered natural language instructions.

### Unknowns

Evaluating how strictly models like DeepSeek V3 adhere to complex, concatenated multi-part system prompts compared to Claude 3.5 Sonnet will dictate how much behavioral variance admins actually experience.

### Cost Implications

Implementing robust input sanitization and sandboxing utilizes development time but incurs zero ongoing infrastructure costs.

### Links

* Salesforce Prompt Builder Best Practices: [admin.salesforce.com/blog/2025/prompt-like-a-pro](https://admin.salesforce.com/blog/2025/prompt-like-a-pro-ai-prompt-writing-for-salesforce-admins)
* AI Sandboxing for Untrusted Code: [blaxel.ai/blog/ai-sandbox](https://blaxel.ai/blog/ai-sandbox)

## 9. Cross-Tenant Analytics Architecture

Observability is critical. The platform operators must understand how the agent fails, track precise token usage per tenant for accurate billing, and analyze aggregated topics to improve the platform's features over time.

### Recommendation

**Langfuse** is the optimal choice for comprehensive LLM observability. It is a highly regarded open-source platform that tracks execution traces, captures the internal reasoning of multi-step agents (including tool calls and vector retrieval), and monitors costs and latency with granular precision.^^ Langfuse integrates flawlessly with TypeScript frameworks and the Vercel AI SDK.

Crucially, Langfuse allows developers to attach custom metadata—such as `tenant_id` and `user_id`—to every trace. This enables the platform operators to aggregate anonymized analytics across all tenants to identify common failure modes (e.g., "The agent frequently hallucinates when querying Spanish meeting minutes") while maintaining the ability to track exact token burn rates per eco-village to enforce BYOK usage limits or standard plan quotas.

### Alternatives Considered

| **Tool**                      | **Evaluation**                                                                                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Helicone**                  | An excellent low-latency proxy gateway that adds caching, analytics, and cost visibility with minimal code changes.^^While great for basic metrics, it lacks the deep, step-by-step agent trajectory visualization provided by Langfuse. |
| **Pydantic Logfire**          | Deeply integrated into PydanticAI.^^If the Python route were chosen, Logfire would be the default, but it is less optimized for a Mastra/TypeScript stack.                                                                               |
| **LangSmith**                 | The enterprise standard for LangChain. It is heavily biased toward the LangChain ecosystem, requires significant engineering to integrate seamlessly outside of it, and carries higher commercial costs.^^                               |
| **Braintrust / Confident AI** | Evaluation-first platforms that excel at dataset generation and metric tracking but are often overkill for a startup primarily needing robust trace visibility and cost attribution.^^                                                   |

### Tradeoffs & Privacy

Utilizing a cloud-hosted observability platform like Langfuse Cloud requires sending trace data (which contains user conversations) to a third-party server. To comply with strict tenant privacy expectations, Río must implement a lightweight obfuscation layer before sending traces, hashing Personally Identifiable Information (PII) and resident names, ensuring that cross-tenant analytics evaluate structural performance rather than sensitive content.^^

### Unknowns

The performance impact of asynchronous tracing middleware on Vercel Serverless Functions under heavy load must be monitored to ensure it does not artificially inflate execution times and trigger timeouts.

### Cost Implications

Langfuse offers a generous free tier for initial scaling, after which it shifts to a usage-based model. By implementing strategic sampling (e.g., only logging 10% of routine summarization calls but 100% of failed tool executions), observability costs can be kept highly manageable.

### Links

* Langfuse Open-Source AI Agent Frameworks: [langfuse.com/blog/2025-03-19-ai-agent-comparison](https://langfuse.com/blog/2025-03-19-ai-agent-comparison)
* LLM Observability Tools Overview: [langchain.com/articles/llm-observability-tools](https://www.langchain.com/articles/llm-observability-tools)

## 10. Cost Analysis & Unit Economics

The strict economic constraint driving this architecture is the target pricing of **~$3/lot/month** for an average community of 300 residents. This equates to approximately  **$900/month in total revenue per community** . Standard SaaS margins dictate that infrastructure, database, and variable AI compute costs should not exceed 15-20% of gross revenue, leaving a maximum AI operations budget of roughly  **$135 to $180 per month per community** .

### Model Scenarios & The Token Cost Trap

Assume an average of 100 daily conversations per community, with each conversation averaging 5 turns. Due to the "Token Cost Trap," multi-step workflows drastically inflate context windows. A single conversational turn involving RAG context injection, conversation history, and system prompts can easily consume 4,000 input tokens and 300 output tokens.^^

* **Total Daily Tokens:** 100 conversations * 5 turns * 4,000 input = 2,000,000 input tokens/day.
* **Total Monthly Tokens:** ~60 Million input tokens, ~4.5 Million output tokens.

### Cost Modeling (Monthly per 300-resident community)

| **Model Combination**                                | **Input Cost (60M)**          | **Output Cost (4.5M)** | **Total AI Cost**         | **Viability**                     |
| ---------------------------------------------------------- | ----------------------------------- | ---------------------------- | ------------------------------- | --------------------------------------- |
| **100% Claude 3.5 Sonnet**                           | $180.00                    | $67.50 | **$247.50**            | ❌ Unviable (>27% of revenue)   |                                         |
| **100% GPT-4o**                                      | $150.00                    | $45.00 | **$195.00**            | ⚠️ Marginal (~21% of revenue) |                                         |
| **Hybrid (80% DeepSeek V3 / 20% Claude 3.5 Sonnet)** | $6.72 + $36.00                      | $1.00 + $13.50               | **$57.22**                | ✅ Highly Profitable (~6.3% of revenue) |

### Additional Infrastructure Costs (Monthly)

* **Vercel (Pro):** $20/month (Fixed, shared across all tenants).
* **Supabase (Pro):** $25/month + usage (Fixed base, shared across all tenants).
* **Embedding Generation:** ~$0.50 per month per community (one-time ingestion + incremental).
* **LlamaParse:** Free up to 1,000 pages/day.
* **Telegram Summarization (Gemini 1.5 Flash):** ~$2.00 per month per community (High context, ultra-low cost).

### Conclusion on Economics

Exclusive reliance on premium models like Claude 3.5 Sonnet will shatter the unit economics of the platform.^^ Implementing the recommended  **Hybrid Routing architecture** —utilizing DeepSeek V3 for casual chat, memory context, and general Q&A, while reserving Claude 3.5 Sonnet strictly for complex platform write-actions and rigorous RAG synthesis—brings the per-community AI cost down to approximately $60/month. This represents highly sustainable margins, proving that the $3/lot/month pricing model is technically and financially viable at scale.^^

## Recommended Architecture Summary

Through exhaustive evaluation of the constraints, frameworks, and unit economics, the optimal technology stack for Río is a highly cohesive, TypeScript-native monolith that leverages native Postgres features for data isolation.

* **Core Framework:** Next.js 16 (App Router) with TypeScript, deployed on Vercel.
* **Agent Orchestration:** Mastra (TypeScript) running as Next.js API routes, unified within the monolithic repository to eliminate DevOps overhead and share typing schemas.
* **Database & Auth:** Supabase PostgreSQL. Multi-tenancy is strictly enforced at the database level utilizing Row Level Security (RLS) policies intrinsically tied to `auth.jwt()`.
* **RAG Pipeline:** Supabase `pgvector` for vector storage. LlamaParse for high-fidelity OCR and document ingestion. OpenAI `text-embedding-3-small` for multilingual embeddings.
* **LLM Engine:** Dynamic task routing. DeepSeek V3 handles standard conversation and semantic memory extraction. Claude 3.5 Sonnet executes deterministic tool calls and platform write-operations. Gemini 1.5 Flash processes massive Telegram context windows.
* **Frontend UI:** Assistant-UI utilizing Shadcn components, streaming standard events from the Mastra backend to render rich generative interfaces and human-in-the-loop confirmation components.
* **Memory:** Custom tiered architecture within Supabase. Ephemeral working memory, vector-embedded episodic memory, and structured JSONB long-term entity storage.
* **Telegram Integration:** `grammY` operating on Supabase Edge Functions, processing webhooks and inserting raw chats into Supabase for asynchronous summarization via `pg_cron`.
* **Observability & Analytics:** Langfuse for tracing, cost attribution per tenant, and obfuscated prompt evaluation.

## Suggested Prototyping Plan

To validate the highest-risk assumptions before committing to full-scale development, the engineering team must execute the following targeted prototyping phases:

1. **Phase 1: RLS + Vector Isolation Validation (1 Week)**
   * *Risk:* Vector similarity search bleeding across tenant boundaries.
   * *Action:* Initialize Supabase `pgvector`. Create two mock tenants. Upload distinct Spanish and English documents parsed by LlamaParse. Write RLS policies and execute semantic searches using a raw script to mathematically prove zero cross-tenant data leakage.
2. **Phase 2: Telegram Archiving & Context Window Limits (1 Week)**
   * *Risk:* Telegram Privacy Mode limitations and token explosion during summarization.
   * *Action:* Deploy a `grammY` webhook to Supabase Edge Functions. Promote the bot to admin in a high-volume group. Archive 3 days of chaotic bilingual chat. Pass the payload to Gemini 1.5 Flash to test prompt limits, latency, and the qualitative accuracy of the generated summary.
3. **Phase 3: Mastra + Assistant-UI Tool Execution (1.5 Weeks)**
   * *Risk:* Human-in-the-loop streaming failure and generative UI state desynchronization.
   * *Action:* Build a simple Next.js page with Assistant-UI. Configure a Mastra agent with a mocked `create_community_event` tool. Trigger the tool via natural language and ensure the frontend halts execution, renders a confirmation button (Generative UI), and successfully resumes the agent trajectory upon explicit user approval.
