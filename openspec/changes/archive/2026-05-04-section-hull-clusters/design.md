## Context

The graph is a self-contained D3 force simulation embedded in a single-file HTML report. All rendering logic lives in `src/html-report.ts` as an inlined `<script>` block. Graph data (`nodes`, `edges`, `stats`) is serialized as `GRAPH_DATA` JSON at report generation time.

Currently `getSection` in `graph-builder.ts` naively takes the first URL path segment. This breaks for multilingual sites using language prefix conventions (`/en/`, `/zh/`, `/fr-CA/`), misclassifying language codes as sections. No visual grouping beyond node color exists.

## Goals / Non-Goals

**Goals:**
- Draw convex hull polygons per section as a visual grouping layer beneath nodes
- Fix section computation for multilingual sites by stripping detected lang prefix
- Detect multilingual sites and surface lang codes as per-node badges
- Add language breakdown to Stats tab when multilingual
- Add hull visibility toggle to sidebar

**Non-Goals:**
- Subdomain-based language detection (`fr.example.com`)
- Content-based language detection (NLP, page text analysis)
- Separate graph layout per language (nodes remain in one unified simulation)
- Clickable hull regions

## Decisions

### D1: Lang detection via URL path regex only
Regex: `/^[a-z]{2}(-[a-z]{2,4})?$/i` on the first path segment.

Alternatives:
- Full BCP 47 parser: overkill, adds complexity for minimal gain
- Subdomain detection: requires hostname parsing, separate logic; scope creep

Rationale: covers 95%+ of real-world multilingual URL patterns. Simple, zero dependency.

### D2: Unified `extractLangSection(url)` replaces `getSection`
Returns `{ lang: string, section: string }`. `lang = "default"` when no prefix matched.

Keeps the existing `getPattern` fn unchanged — pattern still derived from full path (stripping lang prefix would change template fingerprints in unexpected ways for users).

### D3: Hull polygons drawn in a separate SVG `<g>` layer beneath links/nodes
D3's `d3.polygonHull` computes the convex hull from `[x, y]` point arrays. Hull paths updated on every simulation tick.

Alternatives:
- Voronoi overlay: more complex, regions overlap unpredictably with force layout
- Static bounding box per section: doesn't follow node movement, looks wrong

Groups with fewer than 3 nodes: draw a circle (radius = nodeRadius + padding) around the single/pair instead.

### D4: `isMultilingual` flag computed server-side in `graph-builder.ts`
True when >1 distinct non-`"default"` lang value exists across all nodes.

Lang badges in the report are conditionally rendered only when `GRAPH_DATA.stats.isMultilingual === true`. Avoids cluttering monolingual reports.

### D5: Hull color scale separate from section color scale
Section color scale (node fill): `d3.schemeTableau10`
Hull fill: same hue as section color but at 8% opacity, dashed stroke at 30% opacity.

Achieved by applying `d3.color(sectionColor).copy({opacity: 0.08})` — no second color scale needed.

## Risks / Trade-offs

- **Hull thrash on large graphs**: Recomputing convex hull for every section on every tick is O(n log n) per section. For 500+ nodes across many sections this could degrade tick performance. → Mitigation: throttle hull updates to every 3rd tick using a counter; hulls lag nodes slightly but remain visually acceptable.

- **Hull occlusion with overlapping sections**: Force layout may interleave nodes from different sections, causing hull polygons to overlap heavily. → Mitigation: hulls are semi-transparent (8% fill); overlapping is visually tolerable. A cluster force could reduce overlap but is out of scope.

- **Lang regex false positives**: Short common path segments (`/go/`, `/my/`, `/en/`) may be valid content sections on some sites. → Mitigation: acceptable trade-off; no heuristic is perfect without content inspection. Hull toggle lets user hide hulls if grouping looks wrong.

- **Single-node hull**: `d3.polygonHull` returns null for <3 points. → Handled by circle fallback.

## Migration Plan

No migration needed — output is a self-contained HTML file generated per scan. Changes take effect on next scan run. No stored data or backwards compatibility concerns.

## Open Questions

- Should `getPattern` also strip the lang prefix for more meaningful template fingerprints? (e.g., `/en/blog/:slug` and `/zh/blog/:slug` → both become `/blog/:slug`). Deferred — would change existing template counts and may surprise users. Could be a separate change.
