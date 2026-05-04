## Why

Current graph layout scatters nodes from the same section across the canvas. Users expect section clusters to visually cohere. ForceAtlas2 alone does not enforce intra-section proximity, making it hard to see which pages belong together.

## What Changes

- Add section-aware attractive force to the ForceAtlas2 layout so nodes sharing a section are pulled closer together
- Expose a "Cluster Strength" slider in the graph sidebar to let users tune how tightly sections cluster
- Default cluster strength set to a moderate value that groups sections without collapsing the overall graph structure

## Capabilities

### New Capabilities
- `graph-cluster-layout`: Adds section-based clustering force to the graph layout engine with a user-tunable strength control

### Modified Capabilities
- `html-report`: Update graph layout settings and add cluster strength UI control to the sidebar

## Impact

- `src/html-report.ts`: HTML template for graph layout settings and sidebar controls
- `src/vendor/forceatlas2.bundle.js`: May need custom clustering force injection (or post-layout adjustment if bundle is opaque)
- No API changes; purely visual/layout enhancement to the generated HTML report
