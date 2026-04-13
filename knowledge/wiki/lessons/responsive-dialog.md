---
title: Responsive Dialogs
description: Drawer on mobile, Dialog on desktop, z-index management
categories: [ui, mobile, responsive]
sources: [log_2026-02-07_issue_93_mobile_series_rsvp.md]
---

# Responsive Dialogs

## Mobile Drawer / Desktop Dialog Pattern

```typescript
const ResponsiveDialog = ({ 
  open, 
  onOpenChange, 
  children 
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return isMobile ? (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
};
```

## Z-Index Management

Mobile Dock has `z-50`. Drawer must be higher:

```typescript
// Mobile Drawer overlay
<Drawer className="z-[60]">
  {children}
</Drawer>
```

## SSR Safety

Ensure hooks work during SSR:

```typescript
const useMediaQuery = (query: string) => {
  if (typeof window === 'undefined') {
    return false; // SSR safe default
  }
  return window.matchMedia(query).matches;
};
```

---

## Related

- [mobile-ui](../patterns/mobile-ui.md)