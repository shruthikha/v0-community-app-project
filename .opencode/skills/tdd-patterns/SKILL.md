---
name: tdd-patterns
description: Test-Driven Development patterns for Nido. RED-GREEN-REFACTOR cycle with Vitest for unit tests and Playwright for E2E. Enforces writing tests before code. Includes unhappy-path testing matrix. Hybrid of Superpowers TDD skill.
---

# TDD Patterns

Write the test first. Watch it fail. Write the minimal code. Watch it pass. Refactor. Commit.

## When to Use

- During `/implement` when writing new features
- When the plan includes test tasks
- When fixing bugs (write the failing test first, then fix)

## The RED-GREEN-REFACTOR Cycle

### RED: Write a Failing Test

```typescript
// tests/unit/events.test.ts
import { describe, it, expect } from 'vitest';
import { createEvent } from '@/lib/events';

describe('createEvent', () => {
  it('requires a tenant_id', async () => {
    await expect(createEvent({ title: 'Test' }))
      .rejects.toThrow('tenant_id is required');
  });
});
```

Run: `npm run test -- events.test.ts`
Expected: ❌ FAIL (function doesn't exist yet or doesn't validate)

### GREEN: Write Minimal Code to Pass

```typescript
// lib/events.ts
export async function createEvent(data: { title: string; tenant_id?: string }) {
  if (!data.tenant_id) throw new Error('tenant_id is required');
  // minimal implementation
}
```

Run: `npm run test -- events.test.ts`
Expected: ✅ PASS

### REFACTOR: Clean Up Without Breaking Tests

Improve the code while keeping tests green. Run tests after every change.

## Hard Rule

**If code was written before the test, delete the code and start with the test.** This sounds extreme but prevents the common failure mode of tests that verify implementation instead of behavior.

## Testing Stack

| Type | Tool | Command |
|------|------|---------|
| Unit | Vitest | `npm run test` |
| E2E | Playwright | `npm run test:e2e` |
| Coverage | Vitest | `npm run test:coverage` |

## Unhappy Path Matrix

Developers test happy paths. QA tests chaos. But during TDD, write unhappy path tests too:

| Scenario | Test |
|----------|------|
| Missing required field | Expect validation error |
| Invalid UUID | Expect 400 |
| Unauthorized user | Expect 401 |
| Cross-tenant access | Expect 403 |
| Resource not found | Expect 404 |
| Duplicate creation | Expect 409 or idempotent success |
| Server error | Expect graceful error message (no stack trace) |

## Test Coding Standards

### Page Object Model (E2E)
```typescript
// tests/e2e/pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}

// Never use selectors in test files directly
```

### Data Isolation
Each test creates its own data. Never rely on seed data or previous test state.

### Deterministic Waits
```typescript
// ❌ WRONG
await page.waitForTimeout(5000);

// ✅ CORRECT
await expect(page.getByText('Event created')).toBeVisible();
```

## When to Skip TDD

- Prototyping / throwaway code (but mark it as such)
- Pure UI layout work (visual regression testing instead)
- Configuration changes (no business logic to test)
