---
source: build-log
imported_date: 2026-04-08
---
# Debug Log: Map Rendering Regression
**Issue:** Map locations not rendering after merge of #86 and #83.
**Date:** 2026-02-06
**Status:** Investigating

## Phase 1: Reproduce
- **Symptom:** "Map locations now don't render on the map". Data allegedly "still there".
- **Context:** Recently merged #86 (Location Beacon) and #83 (GeoJSON Color).
- **Hypothesis 1:** #83 introduced `color` column but API might be failing if migration didn't run or code expects it.
- **Hypothesis 2:** #86 changed `MapboxViewer` and accidentally removed the locations layer.
- **Hypothesis 3:** RLS issue preventing data fetch.

## Investigation Log
- [ ] Check `MapboxViewer.tsx` for visual regression.
- [ ] Check recent commit history for #83 merge.
- [ ] Check browser console in E2E test for errors.
