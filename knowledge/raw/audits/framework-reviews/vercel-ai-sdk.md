---
framework: Vercel AI SDK
source: github.com/vercel/ai-sdk
relevance_score: 4
extracted_patterns:
  - Streaming AI responses (<100ms latency)
  - AI UI best practices
  - Server Actions integration
  - Tool calling patterns
  - Generative UI (streaming components)
  - Full MCP support
  - Multi-provider support (20+ providers)
skills_to_port:
  - streaming-patterns
  - generative-ui
  - tool-calling
  - server-actions
workflows_to_adapt:
  - /implement (streaming patterns for Río)
  - /ship (tool calling verification)
anti_patterns:
  - Installation/setup (not relevant)
  - Provider-specific configurations
customizations_needed:
  - Extract patterns, not configuration
  - Focus on Río-specific streaming needs
---

# Vercel AI SDK Framework Deep Dive

## Overview

**Repository:** github.com/vercel/ai-sdk  
**Creator:** Vercel  
**Downloads:** 20 million+ monthly  
**Latest:** v6 (December 2025)

Vercel AI SDK is a **comprehensive library for building AI-powered applications** with React, Next.js, Node.js, and more.

## Key Patterns

### Streaming Responses

AI SDK 6 emphasizes **native streaming**:

- **<100ms streaming latency** — Start receiving immediately
- **Server Actions** — Replaces REST-based approach
- **Type-safe** — Full TypeScript coverage

```typescript
import { useChat } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit } = useChat();
```

### Tool Calling

AI SDK excels at **tool calling**:

```typescript
const tools = {
  getWeather: {
    description: "Get weather for a location",
    parameters: z.object({
      location: z.string(),
    }),
  }
};

const result = await generateText({
  model,
  prompt,
  tools,
});
```

### Generative UI

The most innovative pattern: **streaming components**:

```typescript
import { useAssistant } from 'ai/react';

function Chat() {
  const { content, done } = useAssistant({
    api: '/api/assistant',
  });
  
  return <Markdown>{content}</Markdown>;
}
```

Components can be streamed directly to the client.

### Multi-Provider Support

20+ providers supported:
- OpenAI (GPT-4, o1)
- Anthropic (Claude)
- Google (Gemini)
- AWS Bedrock
- Azure OpenAI
- Cohere
- And more...

## Architecture Patterns

### Core Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│   LLM       │
│  (React)    │     │ (Next.js)   │     │ (API)       │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │              ┌────┴────┐
       │              ▼         ▼
       │         ┌────────┐  ┌──────┐
       │         │ Tools  │  │ Store│
       │         └────────┘  └──────┘
       ▼
┌─────────────┐
│  UI Update │
└─────────────┘
```

### Server Actions Pattern

AI SDK 6 uses **Server Actions** instead of REST:

```typescript
// Instead of API routes:
app/api/chat/route.ts

// Use Server Actions:
'use server'
import { generateText } from 'ai';

export async function chat(prompt: string) {
  const { text } = await generateText({
    model,
    prompt,
  });
  return text;
}
```

## Relevance to Nido+Río Migration

### What to Extract (High Priority)

1. **Streaming patterns** — Essential for Río's real-time responses
2. **Tool calling** — Río uses Mastra, which has similar patterns
3. **Generative UI** — Future-proofing for streaming components
4. **Server Actions** — Nido uses Next.js, this is relevant

### What to Skip

- **Installation/configuration** — Not relevant
- **Provider-specific setups** — Keep generic

### Customization for OpenCode

- These are implementation patterns, not workflow patterns
- Reference for Phase 2 agent definitions (frontend-specialist)
- Not directly relevant to workflow/agent design

### Scoring

| Criterion | Score | Notes |
|-----------|-------|-------|
| Workflow discipline | N/A | Not a workflow framework |
| Skill portability | 3/5 | Implementation patterns, not workflow |
| Multi-agent coordination | N/A | Not applicable |
| **Overall** | **3.5/5** | **Implementation reference** |

## Files to Reference

- `.opencode/agent/frontend-specialist.md` — Include streaming patterns
- `knowledge/wiki/tools/mastra-nido-patterns.md` — Cross-reference with Río
