# Graph Builder

## Purpose

Constructs a directed graph from crawl results, computes node metrics, detects orphans and dead links, groups URLs into patterns/templates, and produces aggregate site-level stats.

## Requirements

### Requirement: Directed graph construction
The graph builder SHALL construct a directed graph where each node is a crawled page and each edge represents a link from one page to another.

#### Scenario: Edge from link
- **WHEN** page A contains a link to page B
- **THEN** graph contains directed edge A → B

### Requirement: Node metrics
Each node SHALL include: url, title, status, depth, section (first non-empty path segment, or `/` for root), inbound link count, outbound link count.

#### Scenario: Section assignment
- **WHEN** page URL is `https://example.com/blog/my-post`
- **THEN** node section is `blog`

#### Scenario: Root section
- **WHEN** page URL is `https://example.com/`
- **THEN** node section is `/`

### Requirement: Orphan page detection
The graph builder SHALL flag nodes with zero inbound links (excluding the root URL) as orphans.

#### Scenario: Orphan detected
- **WHEN** page `/hidden-page` is reachable only via direct URL and no other crawled page links to it
- **THEN** node is marked `orphan: true`

### Requirement: Dead link detection
The graph builder SHALL flag nodes with HTTP status >= 400 or status 0 (timeout) as dead.

#### Scenario: Dead link flagged
- **WHEN** page returns status 404
- **THEN** node is marked `dead: true`

### Requirement: URL pattern grouping
The graph builder SHALL group URLs into patterns by replacing variable path segments with typed placeholders:
- Pure numeric segment → `:id`
- UUID (8-4-4-4-12 hex) → `:uuid`
- Date-like segment (`YYYY-MM-DD` or `YYYY`) → `:date`
- Hyphenated segment longer than 20 characters → `:slug`

Each unique pattern represents one template. The builder SHALL compute template count per section.

#### Scenario: Blog posts grouped
- **WHEN** site has `/blog/my-first-post`, `/blog/another-long-post-title`, `/blog/third-entry`
- **THEN** all three match pattern `/blog/:slug` and count as 1 template

#### Scenario: Short segments not replaced
- **WHEN** URL is `/about` or `/contact`
- **THEN** segment is not replaced; pattern equals the URL itself

### Requirement: Site-level stats
The graph builder SHALL compute aggregate stats: total pages, total edges, total sections, total unique templates, orphan count, dead link count, max depth.

#### Scenario: Stats computed
- **WHEN** crawl completes with 247 pages
- **THEN** stats object contains all aggregate fields with correct values
