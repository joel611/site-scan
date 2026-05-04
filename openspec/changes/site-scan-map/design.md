## Context

New Bun CLI tool from scratch. No existing codebase. Target users: developers and PMs scoping a website revamp — need to understand page count, unique templates, section structure, and link relationships before estimating effort. v1 targets static HTML sites only.

## Goals / Non-Goals

**Goals:**
- BFS crawl any static HTML site starting from domain root
- Build directed link graph with per-node metrics
- Group URLs into patterns to surface template count (the key sizing insight)
- Generate single self-contained `.html` report with D3.js graph + stats table
- CLI UX: single command, auto-named output file, progress feedback

**Non-Goals:**
- JS-rendered/SPA pages (Playwright integration — v2)
- Auth-gated pages
- Storing/persisting scan results beyond the HTML file
- Diff/compare between scans
- Cloud/remote execution

## Decisions

### Bun + `node-html-parser` for crawling

**Decision**: Use `Bun.fetch()` natively + `node-html-parser` for HTML parsing.

**Rationale**: Bun's native fetch is fast and zero-config. `node-html-parser` is lightweight, Bun-compatible, and sufficient for extracting `<a href>` links without a full DOM implementation. Avoids pulling in heavyweight deps like `cheerio` or `jsdom`.

**Alternative considered**: `cheerio` — jQuery-like API but heavier; `jsdom` — full DOM simulation, overkill for link extraction.

### BFS traversal with bounded Promise pool

**Decision**: BFS queue with max 5 concurrent fetches.

**Rationale**: BFS gives natural depth-level grouping, which maps to the `--depth` limit intuitively. Bounded pool (5) is polite to target servers without sacrificing speed for small/medium sites. Sequential crawling would be too slow; unbounded parallelism risks rate-limiting or bans.

**Alternative considered**: DFS — harder to implement depth limits cleanly; unbounded concurrency — risky.

### URL pattern grouping via segment heuristics

**Decision**: Replace URL path segments that look like IDs/slugs with typed placeholders using regex heuristics:
- Pure numeric → `:id`
- UUID → `:uuid`
- Date-like (`2024-01-15`) → `:date`
- Long hyphenated string (>20 chars) → `:slug`

**Rationale**: Deterministic, zero-config, fast. Doesn't require ML or training data. Covers 90% of real-world CMS URL patterns. The PM insight ("247 pages, 12 templates") emerges automatically.

**Alternative considered**: Machine learning clustering — too complex for v1; manual route config — requires user input.

### D3.js force-directed graph, bundled inline

**Decision**: Bundle D3.js v7 minified directly into the generated HTML via `<script>` tag. No CDN dependency.

**Rationale**: Self-contained requirement means zero external deps at report-open time. D3 force-directed layout is the de facto standard for this type of interactive graph. Embedding ~250KB minified D3 is acceptable for a one-time-generated audit file.

**Alternative considered**: Cytoscape.js — larger bundle, similar capability; vis.js — less flexible; custom Canvas — too much effort.

### Output: single `.html` file with embedded JSON

**Decision**: Serialize graph data as a JSON blob inside a `<script>` tag in the HTML. No separate data file.

**Rationale**: Single file = trivially shareable (email, Slack, Dropbox). PM doesn't need to keep two files together. JSON embedded in script tag is parsed instantly by the browser.

**Alternative considered**: Separate `.json` data file — breaks shareability; SQLite — overkill.

## Risks / Trade-offs

- **Infinite redirect loops** → Mitigation: track visited URLs by normalized form (lowercase, strip trailing slash, strip fragment); max redirect follow = 5.
- **robots.txt parsing edge cases** → Mitigation: use a well-tested robots.txt parser library; fail open (allow) on parse error, log warning.
- **Very large sites (10k+ pages)** → Mitigation: `--limit` flag (default: 1000); warn user when limit hit; graph renders with simplified layout above 500 nodes.
- **Relative vs absolute URL resolution** → Mitigation: resolve all `href` values against the current page URL using `URL` constructor.
- **Slow target servers** → Mitigation: per-request timeout (10s default); failed URLs tracked as status 0 (timeout).

## Open Questions

- Default `--depth` limit: 10? Unlimited with only `--limit` as the brake? → Recommend: unlimited depth, `--limit 1000` as default page cap.
- Should query strings be normalized/stripped? → Recommend: strip query params by default (treat `?page=2` same as `/blog`), `--keep-query` flag for override.
