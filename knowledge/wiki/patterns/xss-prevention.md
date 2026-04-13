---
source: nido_patterns
imported_date: 2026-04-08
---

# XSS Prevention Patterns

## dangerouslySetInnerHTML Trap

```typescript
// ✅ CORRECT: Always sanitize before render
import DOMPurify from 'dompurify':
const sanitized = DOMPurify.sanitize(content);
return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;

// ❌ WRONG: Raw HTML rendering from user input
return <div dangerouslySetInnerHTML={{ __html: content }} />;
```

## TipTap Content Sanitization

We use `DOMPurify` before rendering content from TipTap:

```typescript
// Utility: lib/sanitize-html.ts
import DOMPurify from 'dompurify';
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}
```

## Usage in Components

```typescript
import { sanitizeHtml } from '@/lib/sanitize-html';
// In render
<div 
  className="prose prose-stone dark:prose-invert"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} 
/>
```