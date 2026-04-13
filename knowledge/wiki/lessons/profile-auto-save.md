---
title: Profile Auto-Save & Concurrency
description: Serialized auto-save loop, React functional updater anti-pattern
categories: [react, ux, concurrency]
sources: [log_2026-03-09_profile_auto_save.md]
---

# Profile Auto-Save & Concurrency

## The Problem

Autosaves racing cause older snapshots to clobber newer edits:

```typescript
// BAD: Racing autosaves
const save = () => {
  setProfile(prev => {
    // Multiple rapid calls overwrite each other
    submit(prev);
    return prev;
  });
};
```

## The Solution: Serialized Loop

```typescript
const save = async () => {
  if (isSavingRef.current) {
    // Queue next save
    queueRef.current = getValues();
    return;
  }
  
  isSavingRef.current = true;
  
  try {
    await submitToServer(getValues());
  } finally {
    isSavingRef.current = false;
    
    // Process queued save
    if (queueRef.current) {
      queueRef.current = null;
      save(); // Recursive call
    }
  }
};
```

## React Functional Updater Anti-Pattern

**NEVER** put side effects inside React functional state updaters:

```typescript
// BAD: Side effect in setter crashes React 18+
setProfile(prev => {
  submit(prev); // async side-effect = crash
  return { ...prev, saved: true };
});

// GOOD: Pure setter, side-effect outside
setProfile({ ...getValues(), saved: true });
await submit(getValues());
```

## Key Patterns

1. **Queue-based serialization** — don't cancel, queue and process
2. **useRef for state** — track saving state without re-renders
3. **Pure setters** — side effects happen after the setter returns
4. **Debounce optional** — but serialization handles rapid calls

---

## Related

- [react-perf](../patterns/react-perf.md)