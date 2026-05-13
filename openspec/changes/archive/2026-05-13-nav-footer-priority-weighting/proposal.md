## Why

The site graph currently groups and colors nodes by URL-path sections or Leiden community detection — neither of which reflects the site's own navigation intent. Homepage nav menus define the primary information architecture of a site, and pages reachable from them should be visually prominent and correctly grouped, even on older sites that don't use URL path prefixes for content organization.

## What Changes

- Parse the homepage HTML (depth=0) at graph-build time to extract nav and footer anchor links
- Mark nav-anchor nodes (`header a, nav a`) with `navSource="nav"`, footer-anchor nodes with `navSource="footer"`
- Assign `navSection` to all nodes via BFS from nav anchors through outbound edges (shortest path wins; nav beats footer on tie)
- Apply inbound multiplier: nav anchors ×1.5, footer anchors ×1.3 — making them visually larger in the force graph
- Color key priority: `navSection → community → section` (nav structure takes precedence when detected)
- Nodes unreachable from any nav anchor fall back to `community || section` coloring

## Capabilities

### New Capabilities
- `nav-anchor-section-weighting`: Extracts homepage nav/footer links, tags nodes with `navSource` and `navSection`, applies inbound multipliers, and uses nav-detected structure as the primary grouping signal for graph color.

### Modified Capabilities
- `smart-section-grouping`: `navSection` assignment via BFS augments the existing majority-inbound-vote section logic — navSection is a separate field that takes color priority without replacing the `section` field used by sidebar filters.

## Impact

- `src/types.ts`: Two new optional fields on `GraphNode` — `navSource` and `navSection`
- `src/graph-builder.ts`: New `extractNavAnchors()` function; BFS traversal for `navSection` assignment; inbound multiplier applied after edge counting
- `src/html-report.ts`: `getGroupKey()` updated to prefer `navSection`; `getRoleSize()` reads `navSource` to apply multiplier before size calculation
- No CLI flag changes; no crawler changes; sidebar filter behavior unchanged
