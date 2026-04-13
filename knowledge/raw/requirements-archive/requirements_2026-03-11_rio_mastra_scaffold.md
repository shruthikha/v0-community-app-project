source: requirement
imported_date: 2026-04-08
---
# Requirements: Río Mastra Scaffold on Railway (S0.2)

## Context
This project item is part of **Sprint 0** of the Río AI Assistant roadmap. Its purpose is to establish the core Node.js infrastructure for the agent, independent of the main Nido frontend, to ensure the deployment pipeline and SSE streaming work as expected on Railway.

## Problem Statement
Developing an AI agent in a serverless environment (Vercel) risks timeouts during long-running streaming sessions. We need a standalone, persistent Node.js service using Mastra to handle agent logic and streaming properly.

## User Persona
- **Developer (Antigravity)**: Needs a stable environment to deploy and test Mastra agents.
- **Tenant Admin**: Will eventually use this service (indirectly) for their community residents.

## Dependencies
- **Parent Epic**: [#158](https://github.com/mjcr88/v0-community-app-project/issues/158)
- **Supabase Free Tier**: We will proceed on the Free Tier for now to validate when the upgrade becomes strictly necessary.
- **Railway Profile**: Access to deploy Node.js services.

## Functional Requirements
- **FR1: Mastra Initialization**: A new TypeScript project initialized with `@mastra/core`.
- **FR2: Railway Deployment**: Configure for Railway using `nixpacks` (default) to avoid manual Dockerfile management unless specific system dependencies are required.
- **FR3: Health Check**: A `/health` endpoint that returns a `200 OK` status.
- **FR4: Mock SSE Endpoint**: A `/api/chat` (or similar) endpoint that returns a hardcoded SSE stream to test the streaming pipeline.

## Technical Requirements
- **Runtime**: Node.js 20+ / TypeScript.
- **Framework**: Fastify or Express (Fastify preferred for performance/SSE).
- **Environment Variables**:
  - `OPENROUTER_API_KEY` (Primary LLM gateway)
  - `PORT` (assigned by Railway)

## Documentation Gaps
- Railway deployment guides for Mastra are currently missing from `docs/`.
- Local development workflow for the Railway agent + Vercel frontend proxying needs to be documented in `docs/development/rio_workflow.md`.

## Technical Options

### Option 1: Fastify + Mastra Native SSE (Recommended)
Use Fastify as the web server for its superior SSE handling and Mastra's native `Response` helper for streaming.
- **Pros**: High performance, low overhead, Mastra native compatibility.
- **Cons**: Fastify has a slightly steeper learning curve for middleware if not familiar.
- **Effort**: S (1-2 days)

### Option 2: Express + `sse-express` 
Use the traditional Express framework with a dedicated SSE middleware.
- **Pros**: Widest ecosystem support, extremely easy to find boilerplate.
- **Cons**: Express is not built for streaming by default; manual header management is more prone to timeout errors on proxies.
- **Effort**: S (1 day)

### Option 3: Mastra `serve` (Vercel-style standalone)
Use Mastra's built-in `serve` command (if available in current v1 version) or a thin wrapper around `@mastra/core`'s internal server.
- **Pros**: Zero-config, perfectly aligned with Mastra's internal lifecycle.
- **Cons**: Less control over health check endpoints or custom observability middleware on Railway.
- **Effort**: XS (0.5 days)

## Handoff
## Recommendation
**Option 1 (Fastify + Mastra Native SSE)** is the recommended path. 
Fastify's first-class support for asynchronous streaming and its lightweight footprint make it the ideal companion for Mastra in a standalone Railway service. It minimizes the risk of streaming timeouts and provides the most "production-ready" scaffold for future RAG and Memory sprints.

## Classification
- **Priority**: P0 (Foundational block for Río Epic)
- **Size**: S (Scaffolding + Infra setup)
- **Horizon**: Q1 26 (Targeted for Sprint 0)

## Handoff
🔁 [PHASE 3 COMPLETE] Handing off to Product Owner for User Review...
