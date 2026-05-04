## Context

The DOM-based nav filter works at crawl time by inspecting HTML element ancestry. It fails on sites using non-semantic markup and is awkward to maintain. The graph already contains everything needed to infer sitewide nav links purely from topology: a page linked from >50% of all pages is almost certainly a nav target. This filter can live entirely in the graph builder as a post-processing pass with zero dependency on HTML structure.

## Goals / Non-Goals

**Goals:**
- Remove edges to nodes whose in-degree ratio exceeds the threshold (default 50% of total pages)
- Recompute `inbound`/`outbound` counts and `orphan` flag after edge removal
- Make threshold configurable via `--nav-threshold N` (0–100, integer percent)
- Work independently of the DOM-based nav filter (both can coexist)

**Non-Goals:**
- Removing the nodes themselves — they stay in the graph, just with fewer (or zero) inbound edges
- Changing crawl behavior or URL discovery
- Per-section or per-template threshold variants

## Decisions

### Filter in graph-builder, not crawler

**Decision**: Post-process in `buildGraph()` after initial edge construction.

**Rationale**: In-degree ratio is only knowable once all edges are built and total page count is fixed. The crawler processes pages incrementally and can't know the final ratio. Graph builder already does a full pass; a second pass over the edge list is O(E).

**Alternative considered**: Filter in crawler by counting how many pages link to each URL. Requires a second data structure, a two-pass crawl, or a post-crawl step — all more invasive than a graph-builder pass.

### Threshold as percent of total pages

**Decision**: `navThreshold` is an integer 0–100 representing the percentage. Default 50.

**Rationale**: Absolute in-degree is site-size-dependent; a 10-page site and a 10,000-page site need different raw counts but the same ratio. Percent is portable across sites.

**Alternative considered**: Absolute count. Rejected — not portable.

### Recompute inbound/outbound/orphan after filter

**Decision**: After dropping high-in-degree edges, recompute `inbound` and `outbound` per node, and re-derive `orphan` (zero inbound, non-root).

**Rationale**: Stats must reflect the filtered graph or the HTML report will show inconsistent node metrics.

### `navThreshold` defaults to 50, `0` disables filter

**Decision**: Default 50. Passing `--nav-threshold 0` or `navThreshold: 0` disables the filter entirely (0% threshold would remove all edges, so treat 0 as "off").

**Rationale**: Simple escape hatch without adding a separate boolean flag.

**Alternative considered**: Separate `--no-filter-nav` flag. We already have that from the DOM filter; keeping a single threshold knob is cleaner for the graph-level filter.

## Risks / Trade-offs

- [Risk] Legitimate hub pages (e.g., a homepage or index linked from many content pages) may have edges removed → Mitigation: threshold is configurable; users can raise it or disable with 0
- [Risk] Small sites (< 10 pages) may have skewed ratios → Mitigation: threshold is percent-based; behavior is predictable at any scale; document the limitation
- [Risk] After filtering, a node that was non-orphan may become orphan → Mitigation: recompute orphan flag after filter; this is correct behavior — the node IS now unreachable from content

## Migration Plan

No data migration. The filter is additive: existing scan outputs were produced without it; re-running produces cleaner graphs. The DOM filter (`--no-filter-nav` flag) remains untouched.
