## ADDED Requirements

### Requirement: Default exclude pattern list
The system SHALL define a hardcoded default list of URL path glob patterns that are excluded from every crawl without requiring user configuration. The default list SHALL include:

- `/cdn-cgi/*` — Cloudflare CDN internal paths
- `/.well-known/*` — Protocol-level URIs (ACME challenges, security.txt)
- `/wp-json/*` — WordPress REST API endpoints
- `/wp-admin/*` — WordPress admin panel

#### Scenario: Default patterns applied automatically
- **WHEN** crawler encounters a URL whose path matches any default exclude pattern
- **THEN** the URL is not added to the crawl queue

#### Scenario: Default patterns do not require user action
- **WHEN** user runs the CLI with no `--exclude` flag
- **THEN** default exclude patterns are still active

### Requirement: Glob pattern matching against URL pathname
The system SHALL match exclude patterns against the URL pathname only (excluding scheme and hostname). Matching SHALL use glob semantics where `*` matches any sequence of characters within a path segment and `**` matches across segments.

#### Scenario: Pattern matches path prefix
- **WHEN** exclude pattern is `/cdn-cgi/*` and URL is `https://example.com/cdn-cgi/rum`
- **THEN** the URL is excluded (path `/cdn-cgi/rum` matches `/cdn-cgi/*`)

#### Scenario: Pattern does not match different path
- **WHEN** exclude pattern is `/cdn-cgi/*` and URL is `https://example.com/blog/post`
- **THEN** the URL is NOT excluded

#### Scenario: Pattern is domain-agnostic
- **WHEN** exclude pattern is `/wp-admin/*`
- **THEN** it applies regardless of the target hostname
