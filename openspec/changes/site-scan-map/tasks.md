## 1. Project Setup

- [ ] 1.1 Init Bun project: `bun init`, add `node-html-parser` dependency
- [ ] 1.2 Create entry point `src/index.ts` with CLI argument parsing (domain, --depth, --limit, --no-robots, --keep-query)
- [ ] 1.3 Validate domain argument: normalize to `https://` scheme, exit with usage help if missing
- [ ] 1.4 Set up TypeScript types: `CrawlRecord`, `GraphNode`, `GraphEdge`, `GraphStats`, `ScanOptions`

## 2. Crawler

- [ ] 2.1 Implement robots.txt fetcher and parser (fail-open on error)
- [ ] 2.2 Implement URL normalizer: resolve relative URLs, lowercase hostname, strip fragments, strip query (unless --keep-query)
- [ ] 2.3 Implement link extractor from HTML: filter out fragments, mailto:, tel:, asset extensions
- [ ] 2.4 Implement BFS queue with visited-URL deduplication
- [ ] 2.5 Implement bounded Promise pool (max 5 concurrent fetches) with 10s timeout
- [ ] 2.6 Implement redirect following (max 5 hops), record final URL
- [ ] 2.7 Capture per-page metadata: final URL, title, HTTP status, depth, outbound links
- [ ] 2.8 Apply --depth and --limit caps; print warning when limit reached
- [ ] 2.9 Print in-place progress line to stdout during crawl

## 3. Graph Builder

- [ ] 3.1 Build directed graph: nodes from crawl records, edges from outbound links
- [ ] 3.2 Compute node metrics: section (first path segment), inbound count, outbound count
- [ ] 3.3 Implement URL pattern grouper: replace :id, :uuid, :date, :slug segments
- [ ] 3.4 Compute unique templates per section
- [ ] 3.5 Flag orphan nodes (0 inbound, not root)
- [ ] 3.6 Flag dead nodes (status >= 400 or 0)
- [ ] 3.7 Compute aggregate stats: totals for pages, edges, sections, templates, orphans, dead links, max depth

## 4. HTML Report Generator

- [ ] 4.1 Download and vendor D3.js v7 minified into `src/vendor/d3.min.js`
- [ ] 4.2 Create HTML shell template with view switcher tabs (Graph / Stats)
- [ ] 4.3 Implement report header: domain, scan timestamp, key stats summary
- [ ] 4.4 Implement D3.js force-directed graph: nodes colored by section, sized by inbound count
- [ ] 4.5 Implement node styling: orphans dimmed, dead nodes red
- [ ] 4.6 Implement node interactions: hover tooltip (title, url, status, depth, in/out counts), click opens URL in new tab
- [ ] 4.7 Implement filter sidebar: section checkboxes, depth range slider, orphan toggle, dead toggle
- [ ] 4.8 Implement stats view: summary cards (total pages, templates, orphans, dead, max depth, sections)
- [ ] 4.9 Implement section breakdown table with sortable columns (section, pages, templates)
- [ ] 4.10 Implement template breakdown table with sortable columns (pattern, pages, section)
- [ ] 4.11 Embed graph JSON data and D3.js inline into final HTML string
- [ ] 4.12 Write output file to `<domain-name>-scan.html` in cwd

## 5. Integration & Polish

- [ ] 5.1 Wire CLI → crawler → graph builder → report generator end-to-end
- [ ] 5.2 Print completion summary: total pages, templates, orphans, dead links, output file path
- [ ] 5.3 Test against a real static site (e.g., docs.bun.sh)
- [ ] 5.4 Test --no-robots, --depth, --limit flags
- [ ] 5.5 Test output file opens correctly in browser with no internet connection
- [ ] 5.6 Handle edge case: single-page site (no links)
- [ ] 5.7 Handle edge case: site with >500 nodes (verify graph still renders)
