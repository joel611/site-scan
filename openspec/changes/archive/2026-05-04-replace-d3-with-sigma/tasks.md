## 1. Setup

- [x] 1.1 Add `sigma`, `graphology`, `graphology-layout-forceatlas2` to `package.json` dependencies
- [x] 1.2 Run `bun install` to install new dependencies
- [x] 1.3 Delete `src/vendor/d3.min.js`
- [x] 1.4 Verify Sigma.js and graphology provide pre-built minified bundles in `node_modules` for inline embedding

## 2. Graph Data & Layout

- [x] 2.1 Replace D3 graph data binding with graphology `Graph` instantiation from `GRAPH_DATA.nodes` and `GRAPH_DATA.edges`
- [x] 2.2 Map node attributes: `x`, `y`, `size` (from inbound), `color` (from section), `label` (pathname), `lang`, `depth`, `section`, `orphan`, `dead`, `status`, `title`, `url`
- [x] 2.3 Run ForceAtlas2 layout on graphology instance
- [x] 2.4 Stop layout after stabilization (fixed iterations or convergence check)

## 3. Sigma.js Rendering

- [x] 3.1 Initialize Sigma instance targeting a container div (replace SVG `#graph-svg` with Sigma canvas container)
- [x] 3.2 Configure node reducer to apply dynamic styles: red fill for dead nodes, reduced opacity for orphans
- [x] 3.3 Configure edge reducer for visibility based on node filters
- [x] 3.4 Add custom color palette mapped to sections (consistent with existing `colorScale`)
- [x] 3.5 Implement custom Sigma layer/program for convex hull polygons per section
- [x] 3.6 Ensure hull layer updates on each render frame (replacing D3 tick-based updates)

## 4. Interactions

- [x] 4.1 Reimplement node click handler to open detail panel (replace D3 click handler)
- [x] 4.2 Reimplement node hover handler to show tooltip (replace D3 mouseover handler)
- [x] 4.3 Wire up Sigma's built-in zoom/pan camera controls (replace D3 zoom behavior)
- [x] 4.4 Wire up Sigma's drag plugin for node dragging (replace D3 drag behavior)
- [x] 4.5 Implement `focusNode` functionality using Sigma camera animation
- [x] 4.6 Ensure Escape key and canvas click still close detail panel

## 5. Filters & UI Integration

- [x] 5.1 Reimplement section filter: update Sigma graph node visibility when checkboxes change
- [x] 5.2 Reimplement depth range filter: update Sigma graph node visibility when sliders change
- [x] 5.3 Reimplement orphan/dead toggle buttons: update Sigma graph node visibility
- [x] 5.4 Reimplement hull visibility toggle: show/hide custom hull layer
- [x] 5.5 Reimplement lang badge rendering (if not handled natively by Sigma labels)

## 6. Report Generation

- [x] 6.1 Update `generateReport` to read Sigma.js + graphology + layout bundles from `node_modules` instead of `d3.min.js`
- [x] 6.2 Embed all three library bundles inline in generated HTML `<script>` tags
- [x] 6.3 Ensure HTML output is still a single self-contained file with no external dependencies
- [x] 6.4 Verify generated HTML opens and renders correctly offline

## 7. Verification

- [x] 7.1 Confirm stats view renders unchanged
- [x] 7.2 Confirm links view renders unchanged
- [x] 7.3 Confirm header, tabs, sidebar UI renders unchanged
- [x] 7.4 Test graph with a sample scan: node colors, sizes, hulls, tooltips, detail panel, filters all work
- [x] 7.5 Run existing tests (`bun test`) to ensure no regressions in `graph-builder` or other modules
