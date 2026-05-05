## ADDED Requirements

### Requirement: --exclude flag
The CLI SHALL accept a repeatable `--exclude <glob>` flag. Each value SHALL be a URL path glob pattern. All user-supplied patterns SHALL be merged with the default exclude list and passed to the crawler.

#### Scenario: Single exclude pattern
- **WHEN** user runs `bun site-scan example.com --exclude "/api/*"`
- **THEN** `ScanOptions.excludePatterns` contains `/api/*` in addition to all default patterns

#### Scenario: Multiple exclude patterns
- **WHEN** user runs `bun site-scan example.com --exclude "/api/*" --exclude "/staging/*"`
- **THEN** `ScanOptions.excludePatterns` contains both `/api/*` and `/staging/*` plus defaults

#### Scenario: Flag omitted
- **WHEN** user runs without `--exclude`
- **THEN** `ScanOptions.excludePatterns` contains only the default exclude patterns
