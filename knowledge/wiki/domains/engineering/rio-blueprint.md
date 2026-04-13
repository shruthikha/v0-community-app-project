---
title: Río AI Blueprint
description: Architectural blueprint for Río AI Assistant
categories: [ai, architecture, blueprint]
sources: [blueprint_rio_agent.md, epic-rio_agent.md, rio_requirements_draft.md]
---

# Río AI Blueprint

## Executive Summary

Río is an AI Community Assistant for Nido multi-tenant platform. It answers resident questions using community knowledge (RAG), personalizes over time (memory), and executes in-app tasks (Phase 2).

## Sprint Roadmap

| Sprint | Name | Focus |
|--------|------|-------|
| 7 | Spike | Infrastructure validation |
| 8 | Foundation | DB schema, Storage, Feature flags |
| 9 | Ingestion Pipeline | LlamaParse → chunk → embed → vector |
| 10 | Chat Interface | UI, SSE streaming, RAG tool |
| 11 | Admin Experience | Settings, Knowledge Base UI |
| 12 | Memory & Privacy | Working/Episodic memory, GDPR |
| 13 | In-App Actions | Tools + HITL confirmation |
| 14 | Observability | Hardening, load testing |

## Key Architecture Decisions

### ADR-001: Mastra on Railway
- Vercel = BFF auth proxy only
- Railway = Node.js agent (no serverless timeout)

### ADR-004: Embeddings
- `text-embedding-3-small` (1536-dim) aligns with pgvector schema

### ADR-006: Chunking Strategy
1. LlamaParse → structured blocks
2. Section-level split (respect h1/h2)
3. Recursive within sections (400-512 tok, 50 overlap)
4. Table rows = atomic

### Tier Prompt Architecture
- **Tier 1**: Immutable base (env var)
- **Tier 2**: Tenant config (DB)
- **Tier 3**: User profile + RAG + Memory

---

## Related

- [rio-ai-pipeline.md](../patterns/rio-ai-pipeline.md)
- [3-tier-prompt.md](../concepts/3-tier-prompt.md)