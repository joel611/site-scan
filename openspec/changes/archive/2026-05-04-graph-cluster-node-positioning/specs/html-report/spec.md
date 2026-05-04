## MODIFIED Requirements

### Requirement: Graph view
The report SHALL include an interactive Sigma.js force-directed graph where:
- Each node represents a crawled page
- Nodes are colored by section (consistent color per section)
- Node size scales with inbound link count (hub pages appear larger)
- Orphan nodes are rendered with reduced opacity
- Dead link nodes are rendered in red
- Clicking a node opens the detail panel for that node
- Hovering a node shows a tooltip with: page title, URL, status, depth, inbound/outbound counts
- The layout applies a post-force-atlas2 section centroid attraction with a user-tunable cluster strength

#### Scenario: Hub node larger
- **WHEN** homepage has 50 inbound links and a blog post has 1
- **THEN** homepage node is visually larger than the blog post node

#### Scenario: Click opens detail panel
- **WHEN** user clicks a node
- **THEN** the node detail panel opens showing node metadata

#### Scenario: Section clustering visible
- **WHEN** the graph renders with cluster strength set to 0.3
- **THEN** nodes in the same section appear closer together than in a standard force-atlas2 layout

## ADDED Requirements

### Requirement: Cluster strength slider
The filter sidebar SHALL include a "Cluster Strength" range slider controlling the intensity of the post-layout section centroid attraction. The slider SHALL range from 0 to 100 and map linearly to a cluster strength of 0.0 to 1.0. The default value SHALL be 30 (0.3). Changing the slider SHALL immediately recompute the layout from the force-atlas2 baseline and refresh the Sigma renderer.

#### Scenario: Default cluster strength
- **WHEN** the graph view is first opened
- **THEN** the cluster strength slider shows 30 and nodes are moderately clustered by section

#### Scenario: Increase clustering
- **WHEN** user drags the slider to 70
- **THEN** nodes pull more tightly toward their section centroids
- **THEN** hull polygons shrink to reflect tighter grouping

#### Scenario: Disable clustering
- **WHEN** user drags the slider to 0
- **THEN** node positions match the raw force-atlas2 output with no section-based attraction
