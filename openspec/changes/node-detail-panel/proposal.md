## Why

Clicking a node in the graph currently opens the page in a new tab, but users need to understand the link relationships for any given page — which pages link to it (backlinks) and which pages it links out to (sources) — and quickly find where dead links originate. Without this, the graph is a visual overview only with no way to drill into connectivity issues.

## What Changes

- Node click no longer opens URL in new tab; instead it opens a detail panel
- Detail panel shows: page title, URL, status, and two lists — Sources (outbound links from this node) and Backlinks (inbound links to this node)
- Each entry in Sources/Backlinks is clickable: clicking it selects that node in the graph (centers + highlights it)
- Dead links are surfaced in the Sources list with a visual indicator (red/dead badge), enabling users to locate the origin page of any dead link
- A "Visit page" action in the panel provides the previous open-in-new-tab behavior
- Panel can be dismissed by clicking the background or pressing Escape

## Capabilities

### New Capabilities
- `node-detail-panel`: Side panel activated on node click, showing source links and backlinks with navigation and dead-link indicators

### Modified Capabilities

## Impact

- `src/html-report.ts`: Add panel HTML markup, CSS, and JavaScript for panel rendering and interaction
- No changes to crawler, graph-builder, or types — all required data (edges, node status) already exists in `GRAPH_DATA`
