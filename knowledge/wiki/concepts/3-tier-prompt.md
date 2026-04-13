---
title: 3-Tier Prompt Architecture
description: Base → Community → Resident prompt hierarchy
categories: [ai, prompts, architecture]
sources: [requirements_2026-03-26_rio_memory_3tier.md]
---

# 3-Tier Prompt Architecture

## Tier Hierarchy

| Tier | Name | Source | Content |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Base Instructions | Agent code | Core persona, safety, tools |
| **Tier 2** | Community Context | DB (rio_configurations) | Tenant persona, policies |
| **Tier 3** | Resident Context | BFF (x-resident-context) | Name, lot, interests |

## Injection Pattern

```typescript
// BFF: Fetch profile, pass via header
const profile = await db.users.select(...).eq('id', userId);
const contextHeader = Buffer.from(JSON.stringify(profile)).toString('base64');

await fetch('/ai/chat', {
  headers: { 'x-resident-context': contextHeader }
});

// Agent: Parse and append to system prompt
const residentContext = JSON.parse(base64_decode(header));
const prompt = `${tier1}\n${tier2}\n${tier3(residentContext)}`;
```

## Priority Order

Most specific context (Resident) goes **closest to user message** (bottom of system prompt):

```
System: [Tier 1: Global Instructions]
       [Tier 2: Community Context]
       [Tier 3: Resident Profile]
       
User:   "What's my lot number?"
```

---

## Related

- [rio-memory-architecture](./rio-memory-architecture.md)