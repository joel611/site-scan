## ADDED Requirements

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

### Requirement: Stats view
The report SHALL include a stats view with:
- Summary cards: total pages, unique templates, orphan pages, dead links, max depth, total sections
- Section breakdown table: section name, page count, template count — sortable by each column
- Template breakdown table: pattern, page count, section — sortable by each column

#### Scenario: Section table sortable
- **WHEN** user clicks "Page Count" column header in section table
- **THEN** rows sort by page count descending

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

### Requirement: Report header
The report SHALL display a header with: scanned domain, scan timestamp, and a summary of key stats (total pages, templates).

#### Scenario: Header content
- **WHEN** report is opened
- **THEN** header shows domain name, date/time of scan, page count, template count
