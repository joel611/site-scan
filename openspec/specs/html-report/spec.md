# HTML Report

## Purpose

Generates a self-contained HTML report file with an interactive Sigma.js force-directed graph, stats view, filter sidebar, and report header — viewable offline with no external dependencies.

## Requirements

### Requirement: Self-contained HTML output
The report SHALL be a single `.html` file with all JavaScript (including Sigma.js, graphology, and graphology-layout-forceatlas2), CSS, and data embedded inline. Opening the file SHALL require no internet connection or external dependencies.

#### Scenario: Offline viewable
- **WHEN** user opens the `.html` file without internet access
- **THEN** report renders fully with all interactions working

### Requirement: Embedded graph data
Graph node and edge data SHALL be serialized as JSON and embedded in a `<script>` tag within the HTML.

#### Scenario: Data embedded
- **WHEN** report HTML is opened
- **THEN** browser can access full graph data without any additional fetch

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

### Requirement: i18n coverage section in stats panel
When `GraphStats.isMultilingual` is `true`, the stats panel SHALL display an i18n coverage section showing per-language page counts and a list of pages missing in at least one language.

#### Scenario: Coverage section shown for multilingual site
- **WHEN** `isMultilingual` is `true` and nodes carry `missingLangs`
- **THEN** stats panel shows a section with: total pages per lang, count of pages missing in at least one lang, and a table of canonical paths that have at least one `missingLangs` entry

#### Scenario: Coverage section hidden for monolingual site
- **WHEN** `isMultilingual` is `false`
- **THEN** stats panel renders as before with no i18n coverage section

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
