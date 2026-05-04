## Why

D3.js is a low-level visualization library that requires significant custom code for graph/network rendering. Sigma.js is purpose-built for large graph visualization with optimized WebGL rendering, built-in camera controls, and a focused graph API. Switching reduces graph rendering code complexity and improves performance for larger site scans.

## What Changes

- **Remove** `src/vendor/d3.min.js` vendor bundle
- **Replace** D3.js graph rendering in HTML report with Sigma.js + graphology
- **Add** Sigma.js and graphology dependencies to `package.json`
- **Rewrite** `src/html-report.ts` graph view: force-directed layout, zoom, drag, tooltips, hulls, click/hover interactions
- **Preserve** all existing graph behavior: node coloring by section, size by inbound count, orphan/dead styling, hull polygons, lang badges, detail panel, filters
- **Maintain** self-contained HTML output (Sigma.js bundled inline, no external fetches)

## Capabilities

### New Capabilities
- *(none — no new features introduced)*

### Modified Capabilities
- `html-report`: Graph rendering engine changes from D3.js to Sigma.js. Requirements unchanged (same visual behavior, interactions, and self-contained output). Implementation detail swap only.

## Impact

- `src/html-report.ts` — major rewrite of graph rendering code
- `src/vendor/d3.min.js` — deleted
- `package.json` — new dependencies: `sigma`, `graphology`, `graphology-layout-forceatlas2` (or similar layout library)
- HTML report output format unchanged (still single self-contained `.html` file)
- No changes to `graph-builder`, `crawler`, or other core logic
