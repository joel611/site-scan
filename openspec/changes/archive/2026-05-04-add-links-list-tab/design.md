## Context

The HTML report embeds a single-page app with two tabs: Graph (force-directed D3 visualization) and Stats (aggregate metrics + breakdown tables). The `switchTab()` function toggles visibility of `#graph-view` and `#stats-view`. A third tab for listing all edges fits naturally into this existing tab architecture.

## Goals / Non-Goals

**Goals:**
- Add a Links tab that displays every edge as a sortable table
- Reuse existing CSS classes (`data-table`, `section-title`) for consistency
- Support sorting by Source, Target, and Target Section columns

**Non-Goals:**
- Filtering or searching the links table
- Pagination (sites scanned are typically <1000 pages)
- Click-through navigation from link rows

## Decisions

**Add tab markup alongside existing tabs**
- Rationale: Minimal change to existing DOM structure. Follows the established pattern.

**Reuse `buildTable` / `initSortable` / `sortTable` utilities**
- Rationale: These already exist in the inline script for stats tables. Adding a third call keeps code DRY.

**Data source: `GRAPH_DATA.edges` with `nodeById` lookup for target section**
- Rationale: Edges already contain `source` and `target` IDs. We map target IDs to nodes for section info. No new data needed.

## Risks / Trade-offs

- **Large edge counts could make the table long** → Mitigation: simple overflow scroll on the view container; no pagination needed for typical scan sizes.
