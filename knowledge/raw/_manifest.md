---
title: Knowledge Raw Manifest
description: Inventory of all legacy documentation ingested into knowledge/raw/
created_date: 2026-04-08
---

# Knowledge Raw Manifest

## Ingestion Summary

| Source | → Destination | Files | Status |
|--------|--------------|-------|--------|
| `docs-legacy/07-product/04_logs/*` | `knowledge/raw/build-logs/` | 72 | ✅ Done |
| `docs-legacy/07-product/03_prds/*` | `knowledge/raw/prds-archive/` | 13 | ✅ Done |
| `docs-legacy/07-product/02_requirements/*` | `knowledge/raw/requirements-archive/` | 64 | ✅ Done |
| `docs-legacy/07-product/01_idea/*` | `knowledge/raw/ideas-archive/` | 7 | ✅ Done |

**Total files ingested:** 156 markdown files

## Directory Structure

```
knowledge/raw/
├── build-logs/          # 72 files - Sprint/product logs
├── prds-archive/        # 13 files - Product requirements documents
├── requirements-archive/ # 64 files - Feature requirements
├── ideas-archive/       # 7 files - Original ideas/brainstorms
├── research/             # Already existing - Brand docs
├── audits/              # Already existing - Framework agent audits
├── coderabbit/          # Already existing - CodeRabbit configs
└── observations-archive/ # Empty - For miscellaneous
```

## Notes

- All files have frontmatter with `source` and `imported_date`
- Original files remain in `docs-legacy/` until Phase 5 confirms wiki structure
- This manifest created as Phase 3 progressed

## Related

- Wiki compiled in `knowledge/wiki/` - See `knowledge/wiki/_index.md`
- Patterns and lessons already in wiki from Phase 1

---

*Generated: 2026-04-08*