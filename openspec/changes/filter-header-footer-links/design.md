## Context

The crawler's `extractLinks` function queries all `<a href>` elements in the full page HTML. Sites typically repeat navigation links in `<header>`, `<footer>`, and `<nav>` elements on every page. These produce O(pages²) edges in the worst case — every page links to every other page via the nav — overwhelming the graph with noise.

The fix is a one-line change to the CSS selector used in `extractLinks`: target only anchors that are NOT descendants of `<header>`, `<footer>`, or `<nav>`.

## Goals / Non-Goals

**Goals:**
- Remove sitewide chrome links from `outboundLinks` to reduce graph edge noise
- Keep the change contained to `extractLinks` with no impact on other crawler behavior
- Make the filter opt-outable via a CLI flag for users who want raw link data

**Non-Goals:**
- Filtering links from `<aside>` or sidebar elements (may contain content links)
- Affecting the crawl queue itself — pages linked only from nav are still discovered and crawled; only the edge is dropped from `outboundLinks`

## Decisions

### Filter at `extractLinks`, not at graph-builder

**Decision**: Filter inside `extractLinks` in `crawler.ts`.

**Rationale**: `outboundLinks` in the crawl record is the source of truth for edges. Filtering there keeps graph-builder stateless and avoids a second pass over raw data. Filtering at graph-builder would require storing unfiltered links alongside filtered ones.

**Alternative considered**: Post-filter in graph-builder based on a "link source element" tag. Rejected — it requires changing the `CrawlRecord` type and the graph-builder contract.

### CSS selector approach (`:not(header *, footer *, nav *)`)

**Decision**: Change the `querySelectorAll` selector in `extractLinks` from `"a[href]"` to `"a[href]:not(header a, footer a, nav a)"`.

**Rationale**: `node-html-parser` supports `:not()` with compound selectors. This avoids iterating over and filtering out anchors after selection — it never selects them in the first place.

**Alternative considered**: Collect all anchors, then check `a.closest('header, footer, nav')`. Also correct but slightly less idiomatic; the selector approach is cleaner.

### `--no-filter-nav` CLI flag

**Decision**: Add `--no-filter-nav` flag to disable the filter.

**Rationale**: Some users may legitimately want to map full link structure including navigation. An escape hatch avoids a hard breaking change.

## Risks / Trade-offs

- [Risk] Sites using non-semantic markup (e.g., `<div id="header">`) won't be filtered → Mitigation: filter only semantic HTML5 elements; document this limitation
- [Risk] `node-html-parser` `:not()` compound selector support may differ from browsers → Mitigation: test with a fixture page containing header/footer links

## Migration Plan

No migration needed. Existing scan outputs reflect the old behavior; re-crawling produces cleaner graphs. No stored data is affected.
