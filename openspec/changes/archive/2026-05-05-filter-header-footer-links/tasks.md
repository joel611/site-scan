## 1. Tests

- [x] 1.1 Add test fixture with header/footer/nav links to `src/graph-builder.test.ts` or `src/crawler.test.ts`
- [x] 1.2 Write test: links inside `<header>` excluded from `outboundLinks`
- [x] 1.3 Write test: links inside `<footer>` excluded from `outboundLinks`
- [x] 1.4 Write test: links inside `<nav>` excluded from `outboundLinks`
- [x] 1.5 Write test: links in `<main>` / `<article>` still included
- [x] 1.6 Write test: `--no-filter-nav` flag includes all links

## 2. Core Implementation

- [x] 2.1 Update `extractLinks` selector in `src/crawler.ts` to exclude `header a, footer a, nav a` using `:not()` 
- [x] 2.2 Add `filterNav` boolean param to `extractLinks` and thread it through from `ScanOptions`
- [x] 2.3 Add `noFilterNav?: boolean` to `ScanOptions` type in `src/types.ts`

## 3. CLI Wiring

- [x] 3.1 Add `--no-filter-nav` flag to CLI argument parsing in `src/index.ts`
- [x] 3.2 Pass `noFilterNav` through to crawl options

## 4. Verification

- [x] 4.1 Run `bun test` — all tests pass
- [x] 4.2 Run a crawl on a real site and verify graph edge count is lower
- [x] 4.3 Verify `--no-filter-nav` restores original behavior
