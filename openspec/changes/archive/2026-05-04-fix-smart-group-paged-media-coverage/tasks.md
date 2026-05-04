## 1. Core Fix

- [x] 1.1 Remove `voters.length < 2` guard from `inferSectionFromInbound` in `src/graph-builder.ts`
- [x] 1.2 Update `graph-builder.test.ts` single-link test to expect inference instead of fallback
- [x] 1.3 Add test for flat URL linked from paginated section page (e.g. `/media-coverage/7` → `/20190513-cpjobs`)

## 2. Verification

- [x] 2.1 Run `bun test` to ensure all graph-builder tests pass
- [x] 2.2 Confirm `smart-section-grouping` spec delta is consistent with implementation
