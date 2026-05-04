## ADDED Requirements

### Requirement: Hull polygons rendered per section
The graph view SHALL render a convex hull polygon for each section grouping visible nodes. Hulls SHALL be drawn in a dedicated SVG layer beneath links and nodes. Hull fill SHALL use the section color at 8% opacity. Hull stroke SHALL use the section color at 30% opacity with a dashed pattern. Hulls SHALL update position on every simulation tick to follow node movement.

#### Scenario: Sufficient nodes in section
- **WHEN** a section has 3 or more visible nodes
- **THEN** a convex hull polygon is drawn around those nodes

#### Scenario: Small section fallback
- **WHEN** a section has fewer than 3 visible nodes
- **THEN** a circle is drawn centered on the node(s) with radius = node radius + 12px

#### Scenario: Hulls update on simulation tick
- **WHEN** the force simulation tick fires
- **THEN** all hull paths are recomputed and redrawn to match current node positions

#### Scenario: Filtered nodes excluded from hull
- **WHEN** nodes are hidden by section/depth/orphan/dead filters
- **THEN** hidden nodes are excluded from hull computation

### Requirement: Hull visibility toggle
The sidebar SHALL include a toggle button to show or hide all hull polygons. Default state SHALL be on (hulls visible).

#### Scenario: Toggle off
- **WHEN** user clicks the hull toggle button while hulls are visible
- **THEN** all hull polygons are hidden and the button shows inactive state

#### Scenario: Toggle on
- **WHEN** user clicks the hull toggle button while hulls are hidden
- **THEN** all hull polygons are shown and the button shows active state
