## ADDED Requirements

### Requirement: Extract nav and footer anchors from homepage
The system SHALL parse the homepage HTML (depth=0 `CrawlRecord`) at graph-build time to extract anchor URLs from `header a, nav a` elements (nav anchors) and `footer a` elements (footer anchors). Only internal same-domain URLs that exist as graph nodes SHALL be considered.

#### Scenario: Nav links detected from header
- **WHEN** homepage HTML contains `<header><nav><a href="/services">Services</a></nav></header>`
- **THEN** `/services` node has `navSource = "nav"`

#### Scenario: Footer links detected
- **WHEN** homepage HTML contains `<footer><a href="/contact">Contact</a></footer>`
- **THEN** `/contact` node has `navSource = "footer"`

#### Scenario: Nav takes precedence over footer for same URL
- **WHEN** a URL appears in both `<nav>` and `<footer>` of the homepage
- **THEN** that node has `navSource = "nav"` (nav beats footer)

#### Scenario: Non-homepage pages not parsed for nav
- **WHEN** an inner page (depth > 0) contains `<nav>` links
- **THEN** those links do NOT set `navSource` on any node

#### Scenario: No nav markup on homepage
- **WHEN** homepage HTML has no `<header>`, `<nav>`, or `<footer>` elements
- **THEN** all nodes have `navSource = null`

### Requirement: BFS navSection assignment from nav anchors
The system SHALL run a BFS traversal starting from nav anchor nodes (navSource = "nav" first, then "footer") through outbound graph edges to assign `navSection` to reachable nodes. Each node receives the URL of the nearest nav anchor as its `navSection`.

#### Scenario: Direct child of nav anchor assigned navSection
- **WHEN** nav anchor `/services` links to `/services/consulting`
- **THEN** `/services/consulting` has `navSection = "/services"`

#### Scenario: Shortest path wins when multiple paths exist
- **WHEN** `/page` is reachable from both nav anchor `/blog` (1 hop) and nav anchor `/news` (2 hops)
- **THEN** `/page` has `navSection = "/blog"`

#### Scenario: Nav anchor wins over footer anchor on equal distance
- **WHEN** `/page` is reachable from nav anchor `/about` (1 hop) and footer anchor `/legal` (1 hop)
- **THEN** `/page` has `navSection = "/about"` (nav beats footer on tie)

#### Scenario: Nodes unreachable from any nav anchor get null navSection
- **WHEN** an orphan node has no inbound edges from any nav-reachable node
- **THEN** that node has `navSection = null`

#### Scenario: Nav anchor nodes themselves get navSection equal to their own URL
- **WHEN** `/services` is a nav anchor
- **THEN** `/services` has `navSection = "/services"`

### Requirement: Inbound multiplier for nav and footer anchors
At graph-build time, after computing real inbound counts, nav anchor nodes (navSource = "nav") SHALL have their effective display size computed with a ×1.5 multiplier on inbound count, and footer anchor nodes (navSource = "footer") with a ×1.3 multiplier. The raw `inbound` field on `GraphNode` SHALL NOT be modified; the multiplier is applied only in the visual size calculation.

#### Scenario: Nav anchor appears larger than equal-inbound non-nav node
- **WHEN** nav anchor `/services` and regular node `/blog/post` both have `inbound = 4`
- **THEN** `/services` renders larger in the graph than `/blog/post`

#### Scenario: Raw inbound count unchanged
- **WHEN** nav anchor `/services` has 2 real inbound links
- **THEN** `node.inbound === 2` (not 3)

### Requirement: navSection takes priority in color grouping
The graph color key SHALL use `navSection` as the highest-priority grouping signal, falling back to `community` then `section` when `navSection` is null.

#### Scenario: Node with navSection colored by nav group
- **WHEN** node has `navSection = "/services"` and `community = "c0"` and `section = "services"`
- **THEN** node color key is `"/services"`

#### Scenario: Node without navSection falls back to community
- **WHEN** node has `navSection = null` and `community = "c1"`
- **THEN** node color key is `"c1"`

#### Scenario: Node without navSection or community falls back to section
- **WHEN** node has `navSection = null` and `community = null` and `section = "blog"`
- **THEN** node color key is `"blog"`
