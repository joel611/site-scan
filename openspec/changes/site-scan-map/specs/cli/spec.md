## ADDED Requirements

### Requirement: Domain argument
The CLI SHALL accept a domain as the first positional argument. The domain MAY be provided with or without `http://`/`https://` scheme prefix; the CLI SHALL normalize it to `https://` if no scheme is provided.

#### Scenario: Domain without scheme
- **WHEN** user runs `bun site-scan example.com`
- **THEN** crawler starts at `https://example.com/`

#### Scenario: Domain with scheme
- **WHEN** user runs `bun site-scan https://example.com`
- **THEN** crawler starts at `https://example.com/`

#### Scenario: Missing domain argument
- **WHEN** user runs `bun site-scan` with no arguments
- **THEN** CLI prints usage help and exits with code 1

### Requirement: Depth flag
The CLI SHALL support a `--depth N` flag to limit crawl depth from the root URL. When omitted, depth is unlimited.

#### Scenario: Depth limit applied
- **WHEN** user runs `bun site-scan example.com --depth 3`
- **THEN** crawler does not follow links beyond depth 3

### Requirement: Page limit flag
The CLI SHALL support a `--limit N` flag to cap total pages crawled. Default SHALL be 1000.

#### Scenario: Limit reached
- **WHEN** crawl reaches N pages
- **THEN** crawler stops, prints warning "Limit of N pages reached. Use --limit to increase.", and proceeds to report generation

### Requirement: No-robots flag
The CLI SHALL support a `--no-robots` flag to bypass robots.txt restrictions.

#### Scenario: robots.txt bypassed
- **WHEN** user runs with `--no-robots`
- **THEN** crawler fetches all URLs regardless of robots.txt Disallow rules

### Requirement: Keep-query flag
The CLI SHALL support a `--keep-query` flag. When omitted, query strings SHALL be stripped before URL deduplication.

#### Scenario: Query strings stripped by default
- **WHEN** crawler encounters `/blog?page=2` and `/blog` without `--keep-query`
- **THEN** both are treated as the same URL `/blog`

### Requirement: Output file naming
The CLI SHALL write the report to `<domain-name>-scan.html` in the current working directory, where `<domain-name>` is the hostname with dots replaced by dashes.

#### Scenario: Output filename
- **WHEN** user scans `example.com`
- **THEN** output file is written to `./example-com-scan.html`

### Requirement: Progress feedback
The CLI SHALL print crawl progress to stdout during execution showing pages crawled and queue size.

#### Scenario: Progress output
- **WHEN** crawl is running
- **THEN** stdout shows a line like `Crawling... 42 pages found, 18 queued` updated in place

### Requirement: Completion summary
The CLI SHALL print a summary on completion with total pages, templates, and output file path.

#### Scenario: Completion output
- **WHEN** crawl finishes
- **THEN** stdout shows summary: total pages, unique templates, orphan count, dead links, output file path
