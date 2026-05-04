## Why

The DOM-based header/footer/nav filter (from `filter-header-footer-links`) requires parsing element structure and breaks on sites that use non-semantic markup (`<div id="nav">`). A more robust signal is graph topology: if a target page receives links from >50% of all crawled pages, those links are almost certainly sitewide navigation — not meaningful content relationships. Filtering at the graph level is markup-agnostic and self-calibrating per site.

## What Changes

- Graph builder computes per-node in-degree ratio (inbound edge count ÷ total pages) after building the full edge list
- Edges whose target node exceeds the in-degree threshold (default: 50% of total pages) are excluded from the final edge set
- Nodes themselves are retained — only the edges are removed
- The threshold is configurable via a CLI flag (`--nav-threshold N`, where N is a percentage 0–100)
- The header/footer/nav DOM filter (`filter-header-footer-links`) is superseded and can be removed or left as an independent option

## Capabilities

### New Capabilities

- `high-indegree-edge-filter`: Remove edges targeting nodes with in-degree > threshold% of total pages in the graph-builder output

### Modified Capabilities

- `graph-builder`: Edge set is post-processed to drop high-in-degree targets before returning the graph

## Impact

- `src/graph-builder.ts` — post-process edges after initial build; recompute `inbound`/`outbound` counts after filtering
- `src/types.ts` — add `navThreshold?: number` to `ScanOptions`
- `src/index.ts` — add `--nav-threshold N` CLI flag
- The existing `filter-header-footer-links` change becomes redundant for the primary use case but can coexist as an opt-in
