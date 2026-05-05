## Why

Sites often have URL paths that are noise for site mapping — Cloudflare CDN helpers, CMS admin routes, API endpoints — and crawling them inflates the graph with irrelevant nodes. A default exclusion list and a `--exclude` flag give users control without requiring custom code.

## What Changes

- Add a hardcoded default exclude pattern list applied to every crawl
- Add `--exclude <glob>` CLI flag (repeatable) to append additional patterns at runtime
- Crawler skips any URL matching an exclude pattern before enqueuing

## Capabilities

### New Capabilities

- `url-exclude-patterns`: Defines the default exclude pattern list and the matching logic applied during crawl. Any URL path matching a pattern is skipped.

### Modified Capabilities

- `cli`: New `--exclude` flag added to CLI interface
- `crawler`: Must check URL against exclude patterns before enqueuing

## Impact

- `src/index.ts` — parse `--exclude` flag, merge with defaults, pass to crawler
- `src/crawler.ts` (or equivalent) — filter URLs against pattern list before enqueue
- `openspec/specs/cli/spec.md` — new requirement for `--exclude` flag
- `openspec/specs/crawler/spec.md` — new requirement for exclude pattern filtering
