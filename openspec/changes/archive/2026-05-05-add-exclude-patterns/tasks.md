## 1. Dependency

- [x] 1.1 Install `minimatch` via `bun add minimatch`

## 2. Types

- [x] 2.1 Add `excludePatterns?: string[]` field to `ScanOptions` in `src/types.ts`

## 3. Default Patterns & Matching Utility

- [x] 3.1 Create `src/exclude-patterns.ts` exporting `DEFAULT_EXCLUDE_PATTERNS` array with: `/cdn-cgi/*`, `/.well-known/*`, `/wp-json/*`, `/wp-admin/*`
- [x] 3.2 Export `isExcluded(pathname: string, patterns: string[]): boolean` using `minimatch` — returns `true` if any pattern matches

## 4. CLI

- [x] 4.1 Parse `--exclude <glob>` flag (repeatable) in `parseArgs()` in `src/index.ts`
- [x] 4.2 Merge user-supplied patterns with `DEFAULT_EXCLUDE_PATTERNS` and assign to `ScanOptions.excludePatterns`
- [x] 4.3 Print active exclude patterns in startup summary if any user patterns were added (e.g., `Exclude patterns: /api/*, /staging/*` showing only the user additions)

## 5. Crawler

- [x] 5.1 In `src/crawler.ts`, import `isExcluded` from `./exclude-patterns`
- [x] 5.2 Before enqueuing each extracted link, call `isExcluded(new URL(link).pathname, options.excludePatterns ?? DEFAULT_EXCLUDE_PATTERNS)` and skip if true

## 6. Tests

- [x] 6.1 In `src/crawler.test.ts`, add test: URL matching default exclude pattern is not crawled
- [x] 6.2 In `src/crawler.test.ts`, add test: URL matching user-supplied `--exclude` pattern is not crawled
- [x] 6.3 In `src/crawler.test.ts`, add test: non-matching URL crawled normally despite exclude list
- [x] 6.4 Add unit tests for `isExcluded` in `src/exclude-patterns.test.ts` covering: exact pattern match, wildcard match, no match, multiple patterns

## 7. Spec Sync

- [x] 7.1 Run `openspec sync` to merge change specs into main specs
