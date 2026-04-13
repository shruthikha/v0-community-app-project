---
title: Navigation Debt
description: Broken links when features move, tab-based routing
categories: [navigation, routing, ux]
sources: [log_2026-03-12_announcement_archive_404.md]
---

# Navigation Debt

## The Problem

When features move between routes, old links break:

```typescript
// Old link that stopped working
href="/t/${slug}/dashboard/announcements"

// New location
href="/t/${slug}/dashboard/official?tab=announcements"
```

## Tab-Based Feature Migration

Use query params for tab state:

```typescript
// Instead of new routes, use tabs
<Link href={`/dashboard/official?tab=${activeTab}`} />

// Page reads tab from searchParams
const { searchParams } = props;
const activeTab = searchParams.get('tab') || 'announcements';
```

## Audit Rule

When moving features, audit all navigation components immediately:

```typescript
// Check widgets, sidebars, breadcrumbs
const navigationComponents = [
  'announcements-widget.tsx',
  'Sidebar.tsx',
  'Breadcrumbs.tsx',
];

for (const comp of navigationComponents) {
  checkForBrokenLinks(comp);
}
```

---

## Related

- [route-redirect](./route-redirect.md)