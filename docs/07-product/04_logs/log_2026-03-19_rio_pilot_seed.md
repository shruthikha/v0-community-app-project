# Build Log: S1.5: Pilot Seeding & Observability Fix
**Issue:** #185 | **Date:** 2026-03-19 | **Status:** ✅ Complete

## Context
- **PRD Link**: [prd_2026-03-19_sprint_8_rio_foundation.md](../03_prds/prd_2026-03-19_sprint_8_rio_foundation.md)

## Progress Log
- **2026-03-19 14:00**: Created `20260319030000_rio_pilot_seed.sql` to seed Alegría and Ecovilla configurations.
- **2026-03-19 15:30**: Discovered `MastraClientError` in playground: `processedSpan?.exportSpan is not a function`.
- **2026-03-19 16:00**: Root caused error to shallow copying of Span objects in `PatternRedactor.ts`.
- **2026-03-19 16:30**: Implemented in-place redaction fix. Verified observability traces in PostHog.

## Decisions
- **In-place Redaction**: Opted for direct property modification in Spans to ensure the underlying class methods (required by the exporter) remain intact.

## Lessons Learned
- Never use the spread operator (`...`) on complex class instances (like OTel Spans or Mastra objects) if you need to preserve their methods and internal state.
