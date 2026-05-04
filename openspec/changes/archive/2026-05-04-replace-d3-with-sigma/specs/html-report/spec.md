## MODIFIED Requirements

### Requirement: Self-contained HTML output
The report SHALL be a single `.html` file with all JavaScript (including Sigma.js, graphology, and graphology-layout-forceatlas2), CSS, and data embedded inline. Opening the file SHALL require no internet connection or external dependencies.

#### Scenario: Offline viewable
- **WHEN** user opens the `.html` file without internet access
- **THEN** report renders fully with all interactions working

### Requirement: Graph view
The report SHALL include an interactive Sigma.js force-directed graph where:
- Each node represents a crawled page
- Nodes are colored by section (consistent color per section)
- Node size scales with inbound link count (hub pages appear larger)
- Orphan nodes are rendered with reduced opacity
- Dead link nodes are rendered in red
- Clicking a node opens the detail panel for that node
- Hovering a node shows a tooltip with: page title, URL, status, depth, inbound/outbound counts

#### Scenario: Hub node larger
- **WHEN** homepage has 50 inbound links and a blog post has 1
- **THEN** homepage node is visually larger than the blog post node

#### Scenario: Click opens detail panel
- **WHEN** user clicks a node
- **THEN** the node detail panel opens showing node metadata

#### Scenario: Hover shows tooltip
- **WHEN** user hovers over a node
- **THEN** a tooltip appears with the node's title, URL, status, depth, inbound, and outbound counts
