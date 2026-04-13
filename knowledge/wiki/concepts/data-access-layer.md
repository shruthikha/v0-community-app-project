---
title: Data Access Layer
---

# Data Access Layer

The data access layer is the boundary between business logic and the database. It should return explicit types, enforce safe query limits, and avoid duplicated query patterns.

## Core idea

A healthy data layer minimizes type holes, avoids N+1 queries, and keeps business logic from reaching directly into persistence details.

## Related

- `knowledge/wiki/patterns/type-safe-data-layer.md`
- `knowledge/wiki/patterns/batch-rpc-counts.md`
- `knowledge/wiki/lessons/double-query-pattern.md`