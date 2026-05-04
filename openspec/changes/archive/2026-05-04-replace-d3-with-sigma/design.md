## Context

Current HTML report embeds `d3.min.js` (v7, ~290KB minified) as a vendor file and uses D3's force simulation, SVG manipulation, zoom, and drag APIs to render the interactive graph. All graph logic (force layout, hull computation, interaction handling) is hand-written in `src/html-report.ts` using D3's low-level APIs.

## Goals / Non-Goals

**Goals:**
- Replace D3.js with Sigma.js for graph rendering
- Reduce graph rendering code complexity in `html-report.ts`
- Maintain identical visual behavior and interactions
- Keep HTML report fully self-contained (single file, no external deps)

**Non-Goals:**
- Add new graph features or visual styles
- Change graph data model or `graph-builder.ts`
- Change stats view, links view, or non-graph UI
- Support server-side rendering or multi-page reports

## Decisions

### Sigma.js + graphology over D3 force simulation
**Rationale:** Sigma.js provides a dedicated graph rendering layer with WebGL/Canvas support and built-in camera/zoom. graphology provides the graph data structure and layout algorithms. Together they replace D3's SVG+simulation approach with a purpose-built graph stack.

**Alternatives considered:**
- Keep D3: Rejected — explicit user request to migrate
- vis-network: Rejected — larger bundle, less modular
- Custom Canvas: Rejected — too much implementation work

### ForceAtlas2 for layout
**Rationale:** graphology-layout-forceatlas2 is the standard force-directed layout for Sigma.js. It produces similar results to D3's force simulation. Runs as a web worker or in main thread; for self-contained HTML we'll use the main-thread version for simplicity.

### Bundle Sigma.js inline via Bun bundler
**Rationale:** The project already uses Bun. We can `import sigma` and `import graphology` in `html-report.ts`, then use Bun's bundler to produce a self-contained script. However, since the report is generated at runtime, we'll instead install Sigma.js/graphology as npm dependencies and read their bundled UMD builds to embed inline, similar to how `d3.min.js` is currently embedded.

**Approach:** Install `sigma` and `graphology` as dependencies. At report generation time, read the pre-built minified files from `node_modules/` and embed them in the HTML `<script>` tags.

### Canvas-based rendering (Sigma default) replaces SVG
**Rationale:** Sigma.js uses Canvas/WebGL by default. This is a core architectural difference from D3's SVG approach.

**Impact:**
- Hulls: Must be rendered as custom Canvas layer in Sigma instead of SVG paths
- Tooltips: HTML overlay (already used) works unchanged
- Labels: Sigma handles node labels natively
- Zoom/pan: Sigma's built-in camera replaces D3 zoom behavior
- Drag: Sigma's drag plugin replaces D3 drag behavior

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Bundle size increase | graphology + Sigma.js + layout may exceed D3's size. Audit bundle size before finalizing. Consider tree-shaking if possible. |
| Hull rendering complexity | Sigma doesn't have native hull support. Implement as custom Sigma program/layer that draws convex hulls on Canvas. Reuse d3-polygon or implement simple convex hull algorithm. |
| Lang badge positioning | Sigma handles labels natively; lang badges may need custom rendering or can be omitted if Sigma's label system covers the need. |
| Performance on large graphs | WebGL rendering should improve performance over SVG for large graphs. Test with 1000+ node graphs. |
| Self-contained bundling | Ensure all required Sigma/graphology files are available as pre-built bundles in node_modules. If not, build a custom bundle. |

## Migration Plan

1. Add `sigma`, `graphology`, `graphology-layout-forceatlas2` to `package.json`
2. Remove `src/vendor/d3.min.js`
3. Rewrite graph initialization in `html-report.ts`:
   - Create graphology graph from `GRAPH_DATA`
   - Run ForceAtlas2 layout
   - Initialize Sigma with custom node/edge renderers for colors/sizes
   - Add custom hull layer
4. Reimplement interactions: click (detail panel), hover (tooltip), filters (update graph visibility)
5. Verify stats view, links view, header remain unchanged
6. Test output HTML is self-contained and offline-viewable
