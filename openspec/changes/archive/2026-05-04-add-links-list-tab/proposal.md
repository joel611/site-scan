## Why

The HTML report currently only shows a graph visualization and aggregate stats. Users cannot see a flat list of all discovered links between pages, making it hard to audit outbound connections and spot unexpected links without clicking through individual node detail panels.

## What Changes

- Add a third tab labeled **Links** alongside Graph and Stats
- Render a sortable table listing every edge (source URL → target URL)
- Columns: Source, Target, Section (of target)
- Preserve existing tab switching behavior
- No changes to crawler, graph builder, or data structures

## Capabilities

### New Capabilities
- `links-list-tab`: A dedicated tab displaying all graph edges in a flat, sortable table

### Modified Capabilities
- *(none — purely frontend UI addition)*

## Impact

- `src/html-report.ts`: Add tab HTML, tab switching logic, and edge table rendering in the inline script
- No API or data structure changes
- No new dependencies
