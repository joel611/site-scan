# Crawler

## Purpose

BFS web crawler that traverses a target site, extracts links, enforces constraints (depth, concurrency, robots.txt), and captures per-page metadata.

## Requirements

### Requirement: BFS traversal from root
The crawler SHALL traverse the target site using breadth-first search starting from the root URL, following only internal links (same hostname).

#### Scenario: Internal links followed
- **WHEN** page contains `<a href="/about">` and `<a href="https://external.com">`
- **THEN** `/about` is added to the crawl queue and `external.com` is recorded as an external link but not crawled

#### Scenario: BFS order
- **WHEN** root page links to A and B, and A links to C
- **THEN** root, A, B are crawled before C

### Requirement: Link extraction
The crawler SHALL extract links from `<a href>` attributes in the main content area. It SHALL skip links inside `<header>`, `<footer>`, and `<nav>` elements. It SHALL also skip: URL fragments (`#`), `mailto:`, `tel:`, and static asset extensions (`.css`, `.js`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.woff`, `.woff2`, `.ttf`, `.pdf`, `.zip`). When `--no-filter-nav` is passed, the sitewide chrome filter SHALL be disabled and all `<a href>` elements SHALL be considered.

#### Scenario: Fragment links skipped
- **WHEN** page contains `<a href="#section-2">`
- **THEN** link is not added to crawl queue

#### Scenario: Asset links skipped
- **WHEN** page contains `<a href="/styles.css">`
- **THEN** link is not added to crawl queue

#### Scenario: Header links excluded by default
- **WHEN** page contains `<header><a href="/home">Home</a></header>` and no `--no-filter-nav` flag
- **THEN** `/home` is NOT included in `outboundLinks`

#### Scenario: All links included with --no-filter-nav
- **WHEN** page contains `<header><a href="/home">Home</a></header>` and `--no-filter-nav` is passed
- **THEN** `/home` IS included in `outboundLinks`

### Requirement: URL normalization and deduplication
The crawler SHALL normalize URLs before deduplication: lowercase hostname, resolve relative paths against current page URL, strip URL fragments. Without `--keep-query`, query strings SHALL also be stripped.

#### Scenario: Relative URL resolution
- **WHEN** page at `https://example.com/blog/` contains `<a href="../about">`
- **THEN** link is resolved to `https://example.com/about`

#### Scenario: Duplicate URL skipped
- **WHEN** same normalized URL appears in multiple pages
- **THEN** URL is crawled only once

### Requirement: Bounded concurrency
The crawler SHALL fetch at most 5 pages concurrently.

#### Scenario: Concurrency cap
- **WHEN** queue contains 20 URLs
- **THEN** at most 5 fetches run simultaneously at any time

### Requirement: Per-page metadata capture
For each crawled URL, the crawler SHALL record: final URL (after redirects), page title (from `<title>`), HTTP status code, crawl depth, and list of extracted outbound internal link URLs.

#### Scenario: Metadata captured
- **WHEN** page at depth 2 responds 200 with `<title>About Us</title>`
- **THEN** record stores url, title "About Us", status 200, depth 2, outbound links[]

### Requirement: Request timeout
Each fetch SHALL timeout after 10 seconds. Timed-out URLs SHALL be recorded with status 0.

#### Scenario: Timeout recorded
- **WHEN** fetch takes longer than 10 seconds
- **THEN** URL recorded with status 0 and not retried

### Requirement: Redirect handling
The crawler SHALL follow HTTP redirects up to 5 hops. The final URL after redirects SHALL be used for deduplication and metadata storage.

#### Scenario: Redirect followed
- **WHEN** `/old-page` redirects 301 to `/new-page`
- **THEN** `/new-page` is recorded; `/old-page` is not crawled again

### Requirement: robots.txt compliance
By default, the crawler SHALL fetch and parse `robots.txt` from the target domain and skip URLs matching `Disallow` rules for `User-agent: *`. When `--no-robots` is set, robots.txt SHALL be ignored.

#### Scenario: Disallowed URL skipped
- **WHEN** robots.txt contains `Disallow: /admin/` and crawler encounters `/admin/settings`
- **THEN** `/admin/settings` is not fetched

#### Scenario: robots.txt parse error
- **WHEN** robots.txt is unreachable or malformed
- **THEN** crawler logs a warning and proceeds as if no rules apply (fail open)

### Requirement: Exclude pattern filtering before enqueue
The crawler SHALL check every candidate URL against the merged exclude pattern list before adding it to the crawl queue. Any URL whose pathname matches at least one pattern SHALL be silently skipped — not fetched, not recorded in the page list.

#### Scenario: Excluded URL not crawled
- **WHEN** crawler extracts link `https://example.com/cdn-cgi/rum` from a page
- **THEN** the URL is not enqueued and does not appear in crawl output

#### Scenario: Non-excluded URL crawled normally
- **WHEN** crawler extracts link `https://example.com/about`
- **THEN** the URL is enqueued and crawled as normal

#### Scenario: Exclusion applied before depth and limit checks
- **WHEN** URL matches an exclude pattern but crawl has not reached depth or page limit
- **THEN** URL is still skipped (exclude takes priority)
