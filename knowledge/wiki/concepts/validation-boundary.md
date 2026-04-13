---
title: Validation Boundary
---

# Validation Boundary

The validation boundary is the point where raw input becomes trusted application data.

## Core idea

Validation should happen before data is persisted, before side effects run, and before privileged APIs are called. Zod-based parsing is the preferred boundary for request bodies and action inputs.

## Related

- `knowledge/wiki/patterns/zod-validation.md`
- `knowledge/wiki/lessons/zod-validation.md`
- `knowledge/wiki/patterns/server-actions.md`