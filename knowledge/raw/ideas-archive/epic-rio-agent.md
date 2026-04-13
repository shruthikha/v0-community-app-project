source: idea
imported_date: 2026-04-08
---
# Product Requirements Document (PRD): Epic "Río" (AI Community Assistant)

## 1. Executive Summary
**Río** is an AI-driven community assistant integrated into the Nido platform. Its primary goal is to alleviate the administrative burden on community managers by autonomously answering resident questions, retrieving community-specific knowledge, and eventually executing operational tasks on behalf of users. 

Río aims to be the "concierge" of every Nido community, bridging the gap between static documents (bylaws, announcements) and dynamic interaction.

## 2. Goals & Non-Goals
### 2.1. Goals
*   **Instant Knowledge Retrieval:** drastically reduce repetitive questions to admins by providing accurate answers based on uploaded tenant documents.
*   **Personalization:** Remember resident preferences and interaction history without violating privacy boundaries (strict 1-on-1 isolated memory).
*   **Operational Assistance (Phase 2):** Allow residents to interact with the Nido app via natural language (RSVPs, bookings, finding neighbors).
*   **Scalability & Security:** Architect a multi-tenant solution where data leakage between tenants is cryptographically impossible via Supabase RLS.

### 2.2. Non-Goals
*   **Replacing Community Managers:** Río is an assistant, not a replacement for human empathy and dispute resolution.
*   **Unrestricted Access:** Río will not have admin-level write access to delete users or modify core community settings.
*   **General Intelligence:** Río should refuse queries unrelated to community living, real estate, Nido, or the specific tenant organization.

## 3. User Personas
### 3.1. The Resident (End-User)
*   **Desires:** Quick answers about parking rules, facility hours, upcoming events, and an easy way to interact with the app without navigating complex menus.
*   **Interaction:** Primarily mobile chat UI. Expects fast, conversational, and personalized responses.

### 3.2. The Tenant Admin (Manager)
*   **Desires:** Zero-configuration setup. They want to upload PDFs and have the agent instantly "learn" them. They want to control the agent's tone and restrict its capabilities if needed.
*   **Interaction:** Web-based dashboard. Needs discrete, explicit fields to configure the agent, not complex prompt engineering.

## 4. Phase 1: Knowledge & Memory (Read-Only)
The initial release focuses on building the foundational agent architecture, ensuring accuracy, and securing data.

*   **Sprint 1: RAG & Ingestion.** Admins upload documents. A Mastra Workflow orchestrates parsing (LlamaParse), chunking, formatting, and saving vector embeddings to Supabase `pgvector`.
*   **Sprint 2: Chat Interface.** A premium, streaming Chat UI using `Assistant-UI` and Vercel AI SDK. A backend server on Railway ensures we don't hit serverless timeouts.
*   **Sprint 3: Isolated Memory.** Leveraging Mastra's native Memory system, Río extracts and stores long-term facts about individual users to personalize future chats. A UI is provided for users to view/delete these memories.
*   **Sprint 4: Passive Collection (Telegram).** A webhook integration captures community group chats, aggregates them into daily summaries, and injects them into the RAG vector store so Río knows "what the community is talking about."

## 5. Phase 2: Operational Actions (Write Capabilities)
Transitioning Río from a chatbot to an active agent. Once Nido's internal APIs mature, Río will use Mastra Tools to interact with the database on the user's behalf.

### 5.1. Target Capabilities
*   **Events:** "RSVP me to the community BBQ this Friday +1." or "Create an event for a Yoga session on the rooftop next Tuesday."
*   **Marketplace:** "Are there any bikes for sale in the building?" or "List my couch for $100."
*   **Resident Discovery:** "Who plays tennis in the building?" or "Connect me with the building manager."
*   **Reservations:** "Book the BBQ grill for Saturday afternoon."

### 5.2. Execution Safety: Human-in-the-Loop (HITL)
To prevent accidental or malicious modifications, **all state-mutating actions must require explicit user approval**. 
Before writing to the database, Río will yield a Generative UI "Confirmation Card" in the chat interface detailing the proposed action. The action only executes if the user taps "Confirm".

### 5.3. Admin Controls
Admins will have toggle switches in their dashboard to explicitly enable or disable specific actions for their tenant's instance of Río (e.g., "Allow RSVPs: ON", "Allow Event Creation: OFF").

## 6. Architecture & Security Requirements
*   **Multi-Tier Prompts:** The final instructions sent to the LLM will be a secure concatenation of:
    1.  *Tier 1 (Core Base):* Immutable identity, safety rails, format enforcement.
    2.  *Tier 2 (Tenant Config):* Admin-defined rules, tone, and emergency contacts (configured via specific UI fields).
    3.  *Tier 3 (User Context):* The resident's prompt and active memories.

## 7. Release Notes

### 2026-03-18: Vector Store & Isolation Milestone (S0.5)
*   **Infrastructure**: Implemented `pgvector` on Supabase with HNSW indexing for the `rio_document_chunks` table.
*   **Accuracy**: Achieved 100% semantic retrieval accuracy on a 10-query cross-lingual (EN/ES) test suite. Stricter 90% threshold enforced in validation scripts.
*   **Security**: Verified strict tenant isolation via metadata filtering and SHA-256 deterministic vector IDs. Conducted specialized audit (Vibe Check) identifying tech debt in client-side mutations.
*   **API**: Exposed `/health` and `/api/chat` with `x-tenant-id` header support.
*   **Tech Debt**: Identified "Cardinal Sins" (client-side DB access) and SEO/A11y gaps in common dashboard components, logged for future sprints.
