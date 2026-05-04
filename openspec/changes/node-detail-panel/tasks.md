## 1. Panel HTML & CSS

- [ ] 1.1 Add panel container markup to `buildHtml` (fixed overlay, right-anchored, 320px wide)
- [ ] 1.2 Add panel CSS: header row (title + close button), URL line, meta row (status/depth), sections for Sources and Backlinks, scrollable list items, dead badge style
- [ ] 1.3 Add panel open/close transition CSS (slide-in from right)

## 2. Panel JavaScript — Data

- [ ] 2.1 On init, build two lookup maps from `GRAPH_DATA`: `nodeById` (id → node) and `edgesFrom` / `edgesTo` (id → edge[]) for O(1) adjacency access
- [ ] 2.2 Write `getSourceNodes(nodeId)` — returns array of target nodes for all outbound edges
- [ ] 2.3 Write `getBacklinkNodes(nodeId)` — returns array of source nodes for all inbound edges

## 3. Panel JavaScript — Render & Interaction

- [ ] 3.1 Write `openPanel(node)` — populates panel fields (title, URL, status, depth, inbound count, outbound count) and calls `renderSources` / `renderBacklinks`
- [ ] 3.2 Write `renderSources(nodeId)` — renders Sources list with dead badge for dead targets; "No outbound links" fallback; cap at 50 with "+N more" note
- [ ] 3.3 Write `renderBacklinks(nodeId)` — renders Backlinks list; "No backlinks (orphan)" fallback; cap at 50 with "+N more" note
- [ ] 3.4 Write `closePanel()` — hides panel, clears selected node highlight
- [ ] 3.5 Write `focusNode(id)` — transitions D3 zoom to center on target node, applies selected highlight stroke, calls `openPanel`

## 4. Node Click Wiring

- [ ] 4.1 Replace `window.open(d.url, '_blank')` click handler with `openPanel(d)` call (toggle: close if same node re-clicked)
- [ ] 4.2 Add "Visit page" button handler in panel that calls `window.open(node.url, '_blank')`
- [ ] 4.3 Attach click handlers on Sources/Backlinks list items to call `focusNode(id)`

## 5. Dismissal

- [ ] 5.1 Add `keydown` listener for Escape key to call `closePanel()`
- [ ] 5.2 Add click listener on graph canvas backdrop (outside panel) to call `closePanel()`

## 6. Visual: Selected Node Highlight

- [ ] 6.1 Track `selectedNodeId` in state
- [ ] 6.2 In `updateGraph`, apply distinct stroke (white, 2px) to selected node; reset on deselect
