## 1. Project Setup

- [x] 1.1 Init Bun project: `bun init`, add `node-html-parser` dependency
- [x] 1.2 Create entry point `src/index.ts` with CLI argument parsing (domain, --depth, --limit, --no-robots, --keep-query)
- [x] 1.3 Validate domain argument: normalize to `https://` scheme, exit with usage help if missing
- [x] 1.4 Set up TypeScript types: `CrawlRecord`, `GraphNode`, `GraphEdge`, `GraphStats`, `ScanOptions`

## 2. Crawler

- [x] 2.1 Implement robots.txt fetcher and parser (fail-open on error)
- [x] 2.2 Implement URL normalizer: resolve relative URLs, lowercase hostname, strip fragments, strip query (unless --keep-query)
- [x] 2.3 Implement link extractor from HTML: filter out fragments, mailto:, tel:, asset extensions
- [x] 2.4 Implement BFS queue with visited-URL deduplication
- [x] 2.5 Implement bounded Promise pool (max 5 concurrent fetches) with 10s timeout
- [x] 2.6 Implement redirect following (max 5 hops), record final URL
- [x] 2.7 Capture per-page metadata: final URL, title, HTTP status, depth, outbound links
- [x] 2.8 Apply --depth and --limit caps; print warning when limit reached
- [x] 2.9 Print in-place progress line to stdout during crawl

## 3. Graph Builder

- [x] 3.1 Build directed graph: nodes from crawl records, edges from outbound links
- [x] 3.2 Compute node metrics: section (first path segment), inbound count, outbound count
- [x] 3.3 Implement URL pattern grouper: replace :id, :uuid, :date, :slug segments
- [x] 3.4 Compute unique templates per section
- [x] 3.5 Flag orphan nodes (0 inbound, not root)
- [x] 3.6 Flag dead nodes (status >= 400 or 0)
- [x] 3.7 Compute aggregate stats: totals for pages, edges, sections, templates, orphans, dead links, max depth

## 4. HTML Report Generator

- [x] 4.1 Download and vendor D3.js v7 minified into `src/vendor/d3.min.js`
- [x] 4.2 Create HTML shell template with view switcher tabs (Graph / Stats)
- [x] 4.3 Implement report header: domain, scan timestamp, key stats summary
- [x] 4.4 Implement D3.js force-directed graph: nodes colored by section, sized by inbound count
- [x] 4.5 Implement node styling: orphans dimmed, dead nodes red
- [x] 4.6 Implement node interactions: hover tooltip (title, url, status, depth, in/out counts), click opens URL in new tab
- [x] 4.7 Implement filter sidebar: section checkboxes, depth range slider, orphan toggle, dead toggle
- [x] 4.8 Implement stats view: summary cards (total pages, templates, orphans, dead, max depth, sections)
- [x] 4.9 Implement section breakdown table with sortable columns (section, pages, templates)
- [x] 4.10 Implement template breakdown table with sortable columns (pattern, pages, section)
- [x] 4.11 Embed graph JSON data and D3.js inline into final HTML string
- [x] 4.12 Write output file to `<domain-name>-scan.html` in cwd

## 5. Integration & Polish

- [x] 5.1 Wire CLI → crawler → graph builder → report generator end-to-end
- [x] 5.2 Print completion summary: total pages, templates, orphans, dead links, output file path
- [x] 5.3 Test against a real static site (e.g., docs.bun.sh)
- [x] 5.4 Test --no-robots, --depth, --limit flags
- [x] 5.5 Test output file opens correctly in browser with no internet connection
- [x] 5.6 Handle edge case: single-page site (no links)
- [x] 5.7 Handle edge case: site with >500 nodes (verify graph still renders)
