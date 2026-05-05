## MODIFIED Requirements

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
