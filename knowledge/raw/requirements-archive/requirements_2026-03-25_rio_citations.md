source: requirement
imported_date: 2026-04-08
---
# Rio Assistant: UX & Design Improvements

## Problem Statement

The Rio Assistant needs to align more closely with the Ecovilla (Nido) design system and provide a more intuitive, friendly user experience. Current UI elements (generic icons, standard headers) feel disconnected from the brand's warm and practical neighborhood guiding persona.

## User Persona

- **Resident**: Wants a friendly, familiar interface that feels like part of their community.
- **Newcomer**: Needs clear paths (like the tour) to learn the platform.

## Context

- **Current Implementation**: 
    - Header uses a standard Sheet/Drawer title "🦜 Chat with Rio".
    - Message avatars are generic Lucide `Bot` and `User` icons.
    - Widget button is labeled "Chat with Rio".
- **Design Docs**: `docs/03-design/design-system/nido_design_system.md` defines the Forest/Sunrise color palette and approachable UI principles.

## Proposed Requirements

### 1. Design System Alignment [x]
- [x] **Colors**: Update primary actions to use `Forest Growth` (#6B9B47).
- [x] **Typography**: Consistency with `Inter`.

### 2. New Header Experience (Logo Style) [x]
- [x] **Remove Header Bar**: Removed default Sheet header.
- [x] **Centered Brand**: Centered `RioImage`.
- [x] **Friendly CTA**: "Ask me anything..." horizontal layout.
- [x] **Floating Close**: Close (X) button as floating element.

### 3. Rich Message Avatars [x]
- [x] **Rio Icon**: Replaced bot icon with `RioImage`.
- [x] **User Initial**: Initials inside the message bubble.

### 4. Widget Label Change [x]
- [x] **Take tour**: Linked to onboarding tour.

### 5. Citation Improvements [x]
- [x] **Collapsed Sources**: Collapsible "Sources" section.
- [x] **Usage Filtering**: Only show cited sources.
- [x] **"See Document" Button**: Linked to official document pages.
- [x] **PDF Preview**: Fix 404s by making 'documents' bucket public.
- [x] **UI Alignment**: Aligned Rio widget with Dashboard Priority Feed.


---

## 8. Technical Review

### Phase 0: Context Gathering

**Issue Details**:
- **Issue**: [Brainstorm] Rio Assistant Citation Improvements (#247)
- **Status**: In Review
- **Goal**: Implement component-level usage filtering for citations and improve Source UI visibility.

**Impact Map**:
- **Logic**: `packages/rio-agent/src/agents/rio-agent.ts` (tool: `search_documents`).
- **BFF/Stream**: `packages/rio-agent/src/index.ts` (result mapping).
- **Frontend**: `components/ecovilla/chat/RioChatSheet.tsx` (Internal `InlineCitation` and Sources footer).

**Historical Context**:
- Current implementation uses a 3-tier prompt and Mastra for agent orchestration.
- Citations were recently adjusted to handle AI SDK v6 `parts` format.
- No direct regressions found, but the current UI for "Sources" at the bottom of messages is redundant if sources aren't used in the text.


### Phase 1: Vibe & Security Audit

**Vibe Check**:
- ✅ **Backend-First**: Citation logic and document search are handled via the `rio-agent` (Mastra) and BFF (`index.ts`).
- ✅ **Zero Policy RLS**: Database has strong RLS policies (`Rio: tenant member read`). However, the `search_documents` tool uses a privileged `pool` connection, making manual `tenant_id` filtering critical.

**Attack Surface**:
- **Tenant Isolation**: The `search_documents` tool logic must never allow `tenantId` to be `null` or bypassed.
- **Context Leakage**: Currently, the BFF sends all 10 search results to the client regardless of whether they are cited.
- **Recommendation**: Implement usage filtering on the **BFF level** (in `index.ts`) or ensure the client-side filtering is robust enough to handle malicious or malformed message parts.

🔁 [PHASE 1 COMPLETE] Handing off to Test Engineer...

### Phase 2: Test Strategy

**Sad Paths**:
- **No Citations Found**: Rio answers correctly but provides no citations.
- **Hallucinated Citations**: Rio cites `[11]` when only 10 results were provided.
- **Malformed Brackets**: Rio writes `[1, 2` or `[ 1 ]`.
- **Duplicate Citations**: Rio cites `[1]` multiple times in the same sentence.
- **Unauthorized Tenant**: Attempting to fetch citations for a different `tenant_id`.

**Test Plan**:
1.  **Unit Tests (`rio-agent`)**:
    *   Test `search_documents` tool with valid/invalid `tenantId`.
    *   Verify `ragEnabled` flag enforcement.
2.  **Integration Tests (`BFF`)**:
    *   Mock `rioAgent.stream` to return specific tool calls/results and verify SSE output.
    *   Verify `x-tenant-id` and `x-agent-key` validation.
3.  **E2E Tests (`Frontend`)**:
    *   Verify `InlineCitation` correctly renders the popover with document details.
    *   Verify the "Sources" section is collapsible and only shows cited documents.
    *   Verify "See Document" button links to the correct route.


### Phase 3: Performance Review

**Schema Static Analysis**:
- ✅ **Vector Search**: `rio_document_chunks` has an `@hnsw` index (`vector_cosine_ops`) which ensures low-latency semantic search.
- ⚠️ **Missing Indices**: Neither `rio_documents` nor `rio_document_chunks` has a B-tree index on `tenant_id`. This is critical for scaling across multiple communities.
- ✅ **BFF Efficiency**: Reducing the number of search results sent to the client via "Usage Filtering" will decrease payload size and slightly improve render time.

**Live Introspection**:
- **nido.prod (Ref: csatxwfaliwlwzrkvyju)**: Table sizes are currently small (1 doc, 284 chunks). Query performance is near-instant. Indexing on `tenant_id` should be prioritized before entering a high-growth phase.

🔁 [PHASE 3 COMPLETE] Handing off to Documentation Writer...

### Phase 4: Documentation Plan

**Mandatory Audit**:
1.  **User Manuals (`docs/01-manuals/`)**:
    *   `resident-guide.md`: Update "Chatting with Rio" section to explain how to view sources and what citations mean.
2.  **Architecture (`docs/02-technical/architecture/`)**:
    *   Update `domains/rio-agent.md` (if exists) or create one specifically for the **RAG Citation Strategy**.
3.  **Schema (`docs/02-technical/schema/`)**:
    *   Update `tables/rio_documents.md` and `tables/rio_document_chunks.md` (if exists) to document new expected behavior or indexing requirements.
4.  **Flows (`docs/02-technical/flows/`)**:
    *   Update the RAG flow diagram to include the "Usage Filtering" step in the BFF/BUI interaction.

**Gap Logging**:
- ⚠️ `docs/02-technical/architecture/domains/rio-agent.md` is missing.
- ⚠️ `docs/02-technical/schema/policies/rio_documents.md` is missing and should be created to document RLS rules in plain English.

🔁 [PHASE 4 COMPLETE] Documentation gaps logged to doc and gaps file. Handing off to Strategic Alignment...
