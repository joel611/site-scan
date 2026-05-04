## Context

The site scan HTML report renders a directed page graph with Sigma.js and graphology-layout-forceatlas2. Nodes are colored by section and hull outlines group visible nodes per section, but the force-directed layout scatters nodes from the same section. Users expect visual cohesion within sections.

`src/vendor/forceatlas2.bundle.js` is a pre-built UMD bundle; modifying it risks breakage on updates. The graph is rendered entirely client-side inside a self-contained HTML file.

## Goals / Non-Goals

**Goals:**
- Nodes within the same section cluster more tightly than the default FA2 layout produces
- Users can tune clustering strength via a sidebar slider
- Default strength produces visible grouping without collapsing the global graph structure
- Layout remains deterministic (no random jitter on re-render)

**Non-Goals:**
- Rewriting or replacing the force-atlas2 bundle
- Adding new node/edge data to the graph data model
- Clustering by any attribute other than `section`
- Animated real-time layout adjustment while dragging the slider

## Decisions

**Post-layout centroid attraction instead of custom force**
After FA2 runs 300 iterations, run a custom "section centroid nudge" pass. For each section, compute the centroid of its nodes, then move each node a fraction of the distance toward that centroid. Repeat for a small number of iterations (e.g., 30). Strength controls the fraction (0 = no nudge, 1 = snap to centroid).

*Rationale*: Does not require editing the FA2 bundle. Simple to implement in vanilla JS inside the HTML template. Deterministic. Alternatives considered: adding invisible intra-section edges (creates O(n²) edge bloat) or replacing FA2 with d3-force (large dependency swap).

**Strength stored as a node attribute and applied before Sigma init**
The slider updates a `clusterStrength` variable (0.0–1.0). On change, the layout is re-computed from the original FA2 result (stored in a snapshot) and Sigma is refreshed.

*Rationale*: Re-running the full 300 FA2 iterations on every slider change is too slow. Storing the FA2 baseline and applying only the lightweight centroid pass keeps interaction responsive.

**UI: slider in sidebar, 0–100 mapped to 0.0–1.0**
A range input labeled "Cluster Strength" sits below the depth filters. Default 30 (0.3).

*Rationale*: Consistent with existing sidebar controls. Range input is native, no extra dependency.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Centroid attraction can pull small sections into large ones | Nudge is fraction-based; nodes only move partially toward centroid. Large sections have weaker per-node pull because centroid is averaged over many points. |
| Re-layout on every slider change feels sluggish | Only centroid pass re-runs; FA2 baseline is cached. Pass is O(nodes × iterations) and fast for typical site sizes (<5k pages). |
| Orphan nodes with no section peers drift oddly | Orphans have a section (first path segment or inferred). They will cluster with other pages in that section, which is desired behavior. |

## Migration Plan

No migration needed. The change is additive to the generated HTML report. Existing reports are unchanged.

## Open Questions

None.
