## Why

Links inside `<header>` and `<footer>` elements appear on nearly every page of a site, causing the graph to be flooded with repetitive edges that obscure meaningful content relationships. These sitewide navigation links inflate edge counts and make it hard to see real page-to-page connections.

## What Changes

- The crawler filters out links found inside `<header>`, `<footer>`, and `<nav>` elements before adding them to `outboundLinks`
- Only links in the main content area (i.e., not in sitewide chrome) are recorded as outbound edges

## Capabilities

### New Capabilities

- `header-footer-link-filtering`: Exclude links from `<header>`, `<footer>`, and `<nav>` elements during crawl link extraction

### Modified Capabilities

- `crawler`: Link extraction now skips links inside sitewide chrome elements

## Impact

- `src/crawler.ts` — `extractLinks` function updated to skip links inside `<header>`, `<footer>`, `<nav>`
- `src/graph-builder.ts` — no change needed (filtering happens upstream at crawl time)
- Existing scan output files will show fewer edges once re-crawled
