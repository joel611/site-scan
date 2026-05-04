## Why

Developers and PMs scoping a website revamp need to quickly understand site structure — total pages, unique templates, section breakdown, and link relationships — before estimating effort. No existing lightweight CLI tool produces this scoped audit as a shareable, self-contained HTML report.

## What Changes

- New Bun CLI tool (`site-scan`) that accepts a domain and crawls all reachable HTML pages
- BFS crawler with configurable depth/page limits, robots.txt compliance, and bounded concurrency
- URL pattern grouper that identifies unique page templates from URL structures
- Directed link graph builder tracking inbound/outbound relationships per page
- Self-contained HTML report with interactive D3.js node graph + stats table view
- Output file named `<domain-name>-scan.html`

## Capabilities

### New Capabilities

- `cli`: Entry point — `bun site-scan <domain> [--depth N] [--limit N] [--no-robots]` — argument parsing, orchestration, output file writing
- `crawler`: BFS HTML crawler using `Bun.fetch()` + `node-html-parser`, respects `robots.txt` by default, bounded Promise pool (5 concurrent), extracts internal links only, tracks URL → {title, status, depth, links[]}
- `graph-builder`: Builds directed graph from crawl data, groups URLs into patterns (`:slug`, `:id` segments), computes per-node metrics (inbound count, depth, section), identifies orphan pages
- `html-report`: Generates single self-contained `.html` with embedded JSON data, D3.js force-directed graph view, and stats table view — no external dependencies at runtime

### Modified Capabilities

## Impact

- New project: no existing code affected
- Dependencies: `bun` runtime, `node-html-parser`, D3.js (bundled into HTML output)
- v1 scope: static HTML sites only; SPA/JS-rendered sites deferred to v2 (Playwright)
- Auth-gated pages: out of scope
