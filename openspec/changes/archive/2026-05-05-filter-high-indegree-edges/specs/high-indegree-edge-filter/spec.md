## ADDED Requirements

### Requirement: Remove edges to high-in-degree nodes
After building the full edge set, the graph builder SHALL remove all edges whose target node's in-degree (number of inbound edges before filtering) is greater than `navThreshold`% of total pages. Nodes SHALL be retained regardless of edge removal.

#### Scenario: Nav target edges removed
- **WHEN** site has 100 pages and `/about` is linked from 60 of them, and `navThreshold` is 50
- **THEN** all edges targeting `/about` are removed from the graph; the `/about` node remains

#### Scenario: Content page edges retained
- **WHEN** site has 100 pages and `/blog/post-1` is linked from 3 pages, and `navThreshold` is 50
- **THEN** edges targeting `/blog/post-1` are NOT removed

#### Scenario: Exact threshold boundary (not exceeded)
- **WHEN** site has 100 pages and a node has exactly 50 inbound edges, and `navThreshold` is 50
- **THEN** edges to that node are NOT removed (threshold is exclusive: must be strictly greater than)

### Requirement: Recompute node metrics after edge filtering
After removing high-in-degree edges, the graph builder SHALL recompute `inbound` and `outbound` counts for all affected nodes and re-derive the `orphan` flag (zero inbound, non-root).

#### Scenario: Inbound count updated
- **WHEN** edges to node `/about` are removed
- **THEN** `/about`'s `inbound` count reflects only edges that were NOT removed (may become 0)

#### Scenario: Orphan flag updated
- **WHEN** a node's last inbound edge is removed by the filter
- **THEN** that node is marked `orphan: true`

### Requirement: Configurable threshold via navThreshold
The filter threshold SHALL be configurable as an integer percentage 0–100 via `navThreshold` in `ScanOptions`. When `navThreshold` is 0, the filter SHALL be disabled (no edges removed). Default SHALL be 50.

#### Scenario: Filter disabled with navThreshold 0
- **WHEN** `navThreshold` is 0
- **THEN** no edges are removed regardless of in-degree

#### Scenario: Custom threshold applied
- **WHEN** `navThreshold` is 80 and a node has in-degree 75% of total pages
- **THEN** edges to that node are NOT removed (75 < 80)
