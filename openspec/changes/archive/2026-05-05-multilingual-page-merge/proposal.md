## Why

Sites built for multiple languages duplicate every page under a lang prefix (e.g. `/en/`, `/fr/`), causing the graph to show the same content structure N times — inflating node count, obscuring site architecture, and hiding a critical insight: which pages are missing in certain languages.

## What Changes

- After crawl, automatically detect lang path prefixes across all discovered URLs using structural overlap (not just regex matching)
- Prompt user interactively to confirm detected prefixes before graph build; `--lang-prefix` flag skips detection but still confirms if mismatch found
- Merge language variants of the same canonical page into a single graph node
- Each merged node carries per-language URLs and titles in a `langVariants` map
- Each merged node tracks which detected languages are missing from that page in `missingLangs`
- Node detail panel in the HTML report surfaces per-lang titles, URLs, and missing-lang badges
- Stats panel gains an i18n coverage section showing overall translation completeness

## Capabilities

### New Capabilities

- `lang-prefix-detection`: Detect lang path prefixes site-wide from crawl results using structural overlap heuristic; prompt user to confirm detected prefixes; support `--lang-prefix` flag for pre-seeded but still-confirmed values
- `multilingual-node-merge`: Merge same-page URL variants by canonical path, building `langVariants` (lang → {url, title}) and `missingLangs` on each merged node

### Modified Capabilities

- `cli`: Add `--lang-prefix` flag to `ScanOptions` and `parseArgs`
- `node-detail-panel`: Display `langVariants` titles/URLs and `missingLangs` badges when node is multilingual
- `html-report`: Add i18n coverage section to stats (per-lang page counts, missing pages list)

## Impact

- `src/types.ts`: `GraphNode` gains optional `langVariants` and `missingLangs`; `ScanOptions` gains optional `langPrefixes`
- `src/graph-builder.ts`: New `detectLangPrefixes()` and `mergeMultilingualRecords()` functions; `buildGraph()` accepts pre-merged records
- `src/index.ts`: `--lang-prefix` flag parsing; interactive `confirmLangPrefixes()` step between crawl and buildGraph
- `src/html-report.ts`: Node detail panel and stats panel updates
- No new dependencies required
