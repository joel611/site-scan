## 1. Adjust Force Simulation Parameters

- [x] 1.1 Increase `d3.forceLink().distance()` from `60` to `100`
- [x] 1.2 Increase `d3.forceManyBody().strength()` from `-120` to `-200`
- [x] 1.3 Increase `d3.forceCollide().radius()` padding from `+ 4` to `+ 6`

## 2. Build Adjacency Index for Hover Lookup

- [x] 2.1 Create `neighborMap: Map<string, Set<string>>` during graph init
- [x] 2.2 Populate neighborMap from `edgesFrom` and `edgesTo` so each node ID maps to all directly connected node IDs

## 3. Implement Hover Highlighting

- [x] 3.1 Add `mouseover` handler on nodes that computes the hovered node's neighbor set
- [x] 3.2 Dim all nodes not in the neighbor set (including the hovered node itself — no, hovered node should stay bright) to `opacity: 0.15`
- [x] 3.3 Dim all edges not connected to the hovered node to `opacity: 0.1`
- [x] 3.4 Highlight connected edges by changing stroke color to `#a78bfa` and opacity to `1`
- [x] 3.5 Ensure hovered node and its adjacent nodes stay at full opacity (`0.9` for normal, `0.35` for orphan)

## 4. Implement Mouseout Restoration

- [x] 4.1 Add `mouseout` handler on nodes that restores all nodes and edges to default opacity and stroke color
- [x] 4.2 Ensure restoration does not interfere with the existing selected-node white stroke behavior

## 5. Verification

- [x] 5.1 Run `bun test` to confirm no regressions in graph builder or report generation
- [x] 5.2 Generate a sample report and visually verify node spacing and hover interactions in browser
