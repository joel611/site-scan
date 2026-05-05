## ADDED Requirements

### Requirement: Leiden community detection post-processing
After graph construction, the system SHALL run Leiden community detection on the directed link graph using `graphology-communities-leiden` with a fixed random seed (42). Each node SHALL be assigned a `community` string field in the format `"c<N>"` where N is a zero-indexed integer. Communities SHALL be ordered by size descending (largest community = `"c0"`).

#### Scenario: Basic community assignment
- **WHEN** the graph contains two clearly separated clusters of pages (e.g., blog section linked internally, shop section linked internally, few cross-links)
- **THEN** blog pages are assigned one community id and shop pages a different community id

#### Scenario: Deterministic output
- **WHEN** Leiden is run twice on the same graph
- **THEN** community assignments are identical both times

#### Scenario: Community ordering by size
- **WHEN** community A has 30 nodes and community B has 10 nodes
- **THEN** community A is assigned `"c0"` and community B is assigned `"c1"`

### Requirement: Singleton community merging
Communities with fewer than `minCommunitySize` nodes (default: 3) SHALL be merged into a single `"c-other"` community.

#### Scenario: Singleton merged
- **WHEN** Leiden produces a community containing only 1 node
- **THEN** that node's `community` is set to `"c-other"`

#### Scenario: Small community merged
- **WHEN** `minCommunitySize` is 3 and a community has 2 nodes
- **THEN** both nodes are assigned `"c-other"`

#### Scenario: Community at threshold kept
- **WHEN** `minCommunitySize` is 3 and a community has exactly 3 nodes
- **THEN** the community retains its `"c<N>"` id and is not merged

### Requirement: Root node included in detection
The root node (`/`) SHALL participate in Leiden community detection and receive a community assignment like any other node.

#### Scenario: Root assigned community
- **WHEN** the root node has outbound links to multiple sections
- **THEN** root is assigned to whichever community its link pattern most closely aligns with (per Leiden)
