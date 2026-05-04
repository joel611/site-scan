# HTML Report

## Purpose

Generates a self-contained HTML report file with an interactive D3.js force-directed graph, stats view, filter sidebar, and report header — viewable offline with no external dependencies.

## Requirements

### Requirement: Self-contained HTML output
The report SHALL be a single `.html` file with all JavaScript (including D3.js v7), CSS, and data embedded inline. Opening the file SHALL require no internet connection or external dependencies.

#### Scenario: Offline viewable
- **WHEN** user opens the `.html` file without internet access
- **THEN** report renders fully with all interactions working

### Requirement: Embedded graph data
Graph node and edge data SHALL be serialized as JSON and embedded in a `<script>` tag within the HTML.

#### Scenario: Data embedded
- **WHEN** report HTML is opened
- **THEN** browser can access full graph data without any additional fetch

### Requirement: Graph view
The report SHALL include an interactive D3.js force-directed graph where:
- Each node represents a crawled page
- Nodes are colored by section (consistent color per section)
- Node size scales with inbound link count (hub pages appear larger)
- Orphan nodes are rendered with reduced opacity
- Dead link nodes are rendered in red
- Clicking a node opens the page URL in a new browser tab
- Hovering a node shows a tooltip with: page title, URL, status, depth, inbound/outbound counts

#### Scenario: Hub node larger
- **WHEN** homepage has 50 inbound links and a blog post has 1
- **THEN** homepage node is visually larger than the blog post node

#### Scenario: Click opens page
- **WHEN** user clicks a node
- **THEN** browser opens the node's URL in a new tab

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

### Requirement: Per-node lang badge in graph
The graph view SHALL render a small text label showing the `lang` code below each node when `isMultilingual` is `true`. When `isMultilingual` is `false`, no lang badges SHALL be rendered.

#### Scenario: Multilingual site — badges visible
- **WHEN** `GRAPH_DATA.stats.isMultilingual` is `true`
- **THEN** each visible node shows its `lang` code as a small text label below the node

#### Scenario: Monolingual site — no badges
- **WHEN** `GRAPH_DATA.stats.isMultilingual` is `false`
- **THEN** no lang badge text is rendered on any node

#### Scenario: Filtered nodes have no badge
- **WHEN** a node is hidden by filters
- **THEN** its lang badge is also hidden

### Requirement: Stats view
The report SHALL include a stats view with:
- Summary cards: total pages, unique templates, orphan pages, dead links, max depth, total sections
- Section breakdown table: section name, page count, template count — sortable by each column
- Template breakdown table: pattern, page count, section — sortable by each column

#### Scenario: Section table sortable
- **WHEN** user clicks "Page Count" column header in section table
- **THEN** rows sort by page count descending

### Requirement: Language breakdown in Stats tab
The Stats tab SHALL show a Language Breakdown table when `isMultilingual` is `true`, listing each language and its page count.

#### Scenario: Multilingual — table shown
- **WHEN** user views the Stats tab and `isMultilingual` is `true`
- **THEN** a Language Breakdown table is visible with columns: Language, Pages

#### Scenario: Monolingual — table hidden
- **WHEN** user views the Stats tab and `isMultilingual` is `false`
- **THEN** no Language Breakdown table is shown

### Requirement: View switcher
The report SHALL provide a toggle to switch between Graph view and Stats view.

#### Scenario: View toggle
- **WHEN** user clicks "Stats" tab
- **THEN** stats view is shown and graph view is hidden

### Requirement: Filter sidebar
The graph view SHALL include a filter sidebar allowing users to:
- Filter nodes by section (multi-select checkboxes)
- Filter nodes by depth range (min/max slider)
- Toggle visibility of orphan nodes
- Toggle visibility of dead link nodes

#### Scenario: Section filter
- **WHEN** user unchecks section "blog"
- **THEN** all blog section nodes and their edges are hidden from the graph

### Requirement: Hull visibility toggle
The sidebar SHALL include a toggle button to show or hide all hull polygons. Default state SHALL be on (hulls visible).

#### Scenario: Toggle off
- **WHEN** user clicks the hull toggle button while hulls are visible
- **THEN** all hull polygons are hidden and the button shows inactive state

#### Scenario: Toggle on
- **WHEN** user clicks the hull toggle button while hulls are hidden
- **THEN** all hull polygons are shown and the button shows active state

### Requirement: Report header
The report SHALL display a header with: scanned domain, scan timestamp, and a summary of key stats (total pages, templates).

#### Scenario: Header content
- **WHEN** report is opened
- **THEN** header shows domain name, date/time of scan, page count, template count
