---
title: Data Quality
---

# Data Quality

Data quality covers type safety, query shape, bounded result sets, and the reliability of the persistence layer contract.

## What good looks like

- No widespread `any` leakage in core data functions.
- Query results are typed and stable.
- List endpoints have safe defaults.
- N+1 and double-query patterns are avoided.

## Related

- `knowledge/wiki/patterns/type-safe-data-layer.md`
- `knowledge/wiki/patterns/batch-rpc-counts.md`
- `knowledge/wiki/lessons/double-query-pattern.md`