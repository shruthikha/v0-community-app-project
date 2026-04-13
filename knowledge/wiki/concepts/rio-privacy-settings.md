---
title: Río Privacy Settings
description: GDPR-compliant memory management, fact viewing/deletion
categories: [privacy, gdpr, ai]
sources: [requirements_2026-03-28_rio_privacy_settings.md]
---

# Río Privacy Settings

## User Requirements

### View Learned Facts
- Display "Río's Memory" as collapsible section
- Paginated (10 facts initially, "Load more" button)
- Format: Fact cards with delete actions

### Delete Individual Facts
- Single delete: Remove specific lines from working memory
- Confirmation modal before deletion

### Bulk Delete (Reset)
- Type `DELETE` in confirmation modal
- Clears entire working memory block

## Implementation Options

### Option 1: Direct Markdown Sync
- Edit text block directly
- **Cons**: Formatting errors, poor UX

### Option 2: Structured Fact Cards (Recommended)
- Parse markdown to JSON array
- Render as elegant cards
- Individual delete actions
- **Pros**: Premium UX, prevents formatting errors

### Option 3: Blacklist Filter
- Maintain forbidden keywords in DB
- Filter context before LLM
- **Cons**: Over-engineering, dual source of truth

---

## Related

- [rio-memory-architecture](./rio-memory-architecture.md)