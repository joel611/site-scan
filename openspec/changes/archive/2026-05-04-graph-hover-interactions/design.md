## Context

The site scan tool generates a self-contained HTML report with an embedded D3 force-directed graph. The graph is rendered entirely within `src/html-report.ts` via an inline `<script>` block. Current simulation parameters (`link.distance(60)`, `charge(-120)`, `collision.radius(nodeRadius + 4)`) produce a dense layout on sites with >50 nodes, making it hard to distinguish nodes and trace connections.

The graph already supports click-to-open detail panel, section filters, depth filters, and hull clustering. There is no hover-based neighborhood highlighting.

## Goals / Non-Goals

**Goals:**
- Increase visual spacing between nodes to reduce overlap
- Highlight all 1-depth edges and adjacent nodes on node hover
- Dim non-connected graph elements during hover for focus
- Keep interaction smooth for graphs up to ~500 nodes

**Non-Goals:**
- Multi-depth highlighting (2+ hops)
- Persistent selection state beyond existing click-to-panel
- Changing graph data structures or the crawler/builder
- Adding new dependencies

## Decisions

**Increase link distance and charge strength**
- Rationale: Current `distance(60)` and `charge(-120)` cause overlap on dense graphs. Bumping to `distance(100)` and `charge(-200)` with `collision.radius(nodeRadius + 6)` gives breathing room without excessive sprawl.
- Alternative considered: Dynamic distance based on node count. Rejected — adds complexity with marginal benefit; static increase works well for typical site sizes.

**Use CSS class toggling for hover state instead of per-element D3 attr updates**
- Rationale: Toggling a `.dimmed` class on the root `<g>` and `.highlight` on connected links/nodes is faster than re-binding D3 data and re-rendering attributes. The force simulation continues ticking unaffected.
- Alternative considered: Full `updateGraph()` re-render on hover. Rejected — triggers simulation restart and is janky.

**Compute adjacency on init, not on every hover**
- Rationale: The graph already builds `edgesFrom` and `edgesTo` Maps at init. We extend this with a `neighbors` Map (Set of node IDs per node) for O(1) lookup during hover.

**Fade styling via CSS variables / inline styles on the D3 selections**
- Rationale: Since the graph is inline HTML without external stylesheets for links/nodes, we apply opacity directly via D3 `.style()` in mouseover/mouseout handlers. Non-connected elements drop to `opacity: 0.15`, connected edges brighten to `#a78bfa`.

## Risks / Trade-offs

- **Denser graphs may spread beyond viewport** → Mitigation: default zoom is fit-to-view; users can zoom out. Charge strength increase is moderate.
- **Hover flicker on rapidly moving nodes** → Mitigation: use `mouseout` on the node element only; force simulation movement does not trigger unexpected mouseout because cursor tracks with node.
- **Performance on very large graphs (>1000 nodes)** → Mitigation: class-based DOM manipulation is O(1) per hover; adjacency lookup is O(1). No data re-binding.
