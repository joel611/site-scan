## ADDED Requirements

### Requirement: Exclude links from sitewide chrome elements
The crawler SHALL exclude links found inside `<header>`, `<footer>`, and `<nav>` elements from a page's `outboundLinks`. Only links in the main content area SHALL be recorded as outbound edges.

#### Scenario: Header links excluded
- **WHEN** page contains `<header><nav><a href="/about">About</a></nav></header>` and `<main><a href="/blog">Blog</a></main>`
- **THEN** `outboundLinks` contains `/blog` but NOT `/about`

#### Scenario: Footer links excluded
- **WHEN** page contains `<footer><a href="/contact">Contact</a></footer>`
- **THEN** `outboundLinks` does NOT contain `/contact`

#### Scenario: Nav links excluded
- **WHEN** page contains `<nav><a href="/products">Products</a></nav>` outside of main content
- **THEN** `outboundLinks` does NOT contain `/products`

#### Scenario: Content links retained
- **WHEN** page body contains `<article><a href="/related-post">Related Post</a></article>`
- **THEN** `outboundLinks` contains `/related-post`

### Requirement: Opt-out via --no-filter-nav flag
When `--no-filter-nav` is passed, the crawler SHALL include all links from all elements including `<header>`, `<footer>`, and `<nav>`.

#### Scenario: Flag disables filter
- **WHEN** `--no-filter-nav` is passed and page has `<header><a href="/about">About</a></header>`
- **THEN** `outboundLinks` contains `/about`
