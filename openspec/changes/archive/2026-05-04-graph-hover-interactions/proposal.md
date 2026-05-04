## Why

The current D3 force-directed graph feels cramped on larger sites and lacks interactive depth exploration. Adding node spacing and hover-driven edge highlighting (like Obsidian's graph view) improves readability and lets users quickly trace one-hop connections without opening the detail panel.

## What Changes

- Increase default force-directed link distance and charge strength to reduce node overlap and improve visual clarity
- Add hover interaction on graph nodes that highlights all directly connected edges (1-depth) and their adjacent nodes
- Fade non-connected nodes and edges during hover to emphasize the local neighborhood
- Restore default styling on mouseout

## Capabilities

### New Capabilities
- `graph-hover-highlight`: Interactive hover state that highlights 1-depth edges and adjacent nodes while dimming the rest of the graph

### Modified Capabilities
- *(none — this is purely a frontend visualization change; graph builder requirements remain unchanged)*

## Impact

- `src/html-report.ts`: Update D3 simulation forces and add hover event handlers to the inline graph script
- No API or data structure changes
- No new dependencies
