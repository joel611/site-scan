## Context

`graph-builder.ts` builds nodes and edges from `CrawlRecord[]`. Node `section` comes from URL path prefix or majority-inbound voting (`inferSectionFromInbound`). Node size in the renderer (`html-report.ts`) is based on raw `inbound` count. Color keys off `community || section` via `getGroupKey()`.

The crawler already fetches all links (including nav/footer) via `extractLinks(..., noFilterNav=true)` for crawl discovery, storing raw HTML in `CrawlRecord.html`. Nav/footer links are excluded from `outboundLinks` (graph edges) by default, but the HTML is available.

## Goals / Non-Goals

**Goals:**
- Use homepage nav/footer structure as primary section grouping signal
- Make nav-anchor nodes visually larger proportional to their navigational importance
- Preserve existing `section` field and sidebar filter behavior
- Work on old sites without URL-prefix-based structure

**Non-Goals:**
- Change crawler behavior or add new CLI flags
- Replace Leiden community detection (still used as fallback)
- Parse nav/footer on pages other than the homepage (depth=0)
- Support dynamically rendered nav (JavaScript-only menus)

## Decisions

### Decision: Parse at graph-build time, not crawl time
Rationale: Nav analysis is a graph concern, not a crawl concern. `CrawlRecord.html` already stores homepage HTML. No crawler API changes needed, no new fields on `CrawlRecord`. Keeps crawler single-responsibility.

Alternative considered: Tag nav/footer links during crawl, store on `CrawlRecord.outboundLinks` with metadata. Rejected — mixes graph semantics into crawl output, complicates `CrawlRecord` type.

### Decision: Separate `navSection` field, don't overwrite `section`
Rationale: `section` drives sidebar filter checkboxes. Changing it would break filter UX. `navSection` is a separate color-priority signal; nodes without nav ancestry naturally fall back. Existing tests for `section` remain valid.

Alternative considered: Overwrite `section` with nav-detected group. Rejected — breaks sidebar filter grouping and all existing `section`-based tests.

### Decision: BFS via outbound edges from nav anchors
Rationale: Outbound edges model the "linked from" relationship which reflects how users navigate. BFS gives shortest path automatically. Directed traversal avoids circular propagation.

Alternative considered: URL-prefix matching against nav anchor URLs. Rejected — fails on old sites with non-hierarchical URLs (the core problem being solved).

### Decision: Multiplier (×1.5 nav, ×1.3 footer) applied in `getRoleSize`, not stored
Rationale: `inbound` count is the ground truth; inflating it permanently would break orphan detection and `filterHighIndegreeEdges`. The multiplier is a visual-only concern. Apply it in `getRoleSize` using `navSource` attribute.

Alternative considered: Store boosted inbound on the node. Rejected — corrupts data used by other logic (orphan flag, indegree filter).

### Decision: Shortest path wins; nav beats footer on tie
Rationale: BFS naturally produces shortest paths. Tie-breaking by source type (nav > footer) reflects navigational hierarchy — primary nav is more authoritative than footer links.

## Risks / Trade-offs

- **Sites with no `<header>/<nav>/<footer>` markup** → `navSource` and `navSection` remain null for all nodes; graph falls back to existing community/section coloring. No regression.
- **Mega-menus or deep nav trees** → BFS will propagate `navSection` broadly. Most sub-pages will be correctly attributed; occasional over-grouping is acceptable.
- **Performance** → BFS over all nodes/edges is O(V+E). For 10k node graphs this is negligible compared to FA2 layout.
- **`navSection` color groups may outnumber TABLEAU10 palette (10 colors)** → Same risk exists with community detection today; colors wrap modulo 10. Nav-detected groups typically ≤10 (number of top-nav items).

## Open Questions

- None — all decisions resolved in design session.
