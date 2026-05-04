## ADDED Requirements

### Requirement: Node hover highlights 1-depth neighborhood
The graph visualization SHALL highlight all edges and adjacent nodes directly connected to a node when the user hovers over that node. All non-connected nodes and edges SHALL be visually dimmed during hover.

#### Scenario: Hover over a node with outbound and inbound links
- **WHEN** the user hovers over a node that has both outbound links and backlinks
- **THEN** all edges connected to that node change to a highlight color
- **AND** all adjacent nodes connected by those edges maintain full opacity
- **AND** all other nodes and edges are dimmed to reduced opacity

#### Scenario: Hover over an orphan node
- **WHEN** the user hovers over a node with zero inbound links and zero outbound links
- **THEN** only that node remains at full opacity
- **AND** all other nodes and edges are dimmed to reduced opacity

#### Scenario: Mouse leaves hovered node
- **WHEN** the user moves the cursor away from the hovered node
- **THEN** all nodes and edges restore their default opacity and color
