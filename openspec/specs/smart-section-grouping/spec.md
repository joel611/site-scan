# Smart Section Grouping

## Purpose

Detects the logical section for pages with flat or non-hierarchical URLs by analyzing which existing section links to them, rather than relying solely on the URL path.

## Requirements

### Requirement: Majority inbound section detection
For each graph node, the system SHALL collect the `section` value of every inbound-link source node. If any single section accounts for more than 50% of inbound links, that section SHALL be assigned as the target node's `section`.

#### Scenario: Flat URL linked from single section
- **WHEN** page `/20210319-recruit` is linked only from `/media-coverage/` (section `media-coverage`)
- **THEN** node section is `media-coverage`

#### Scenario: Flat URL linked from paginated section page
- **WHEN** page `/20190513-cpjobs` is linked only from `/media-coverage/7` (section `media-coverage`)
- **THEN** node section is `media-coverage`

#### Scenario: Flat URL linked from multiple sections with clear majority
- **WHEN** page `/event-details` is linked from 3 pages in section `events` and 1 page in section `about`
- **THEN** node section is `events`

#### Scenario: Flat URL with no clear majority
- **WHEN** page `/shared-resource` is linked from 2 pages in section `blog` and 2 pages in section `news`
- **THEN** node section falls back to first path segment behavior

### Requirement: Fallback to path-based section
When majority inbound section detection does not yield a section (no inbound links or tie vote), the system SHALL fall back to the existing path-based section assignment.

#### Scenario: Orphan page fallback
- **WHEN** page `/orphan-page` has zero inbound links
- **THEN** node section is `orphan-page` (first path segment)

### Requirement: Root excluded as section voter
Inbound links from the root URL (`/`) SHALL NOT contribute to the majority section vote.

#### Scenario: Root links to flat URL
- **WHEN** page `/20210319-recruit` is linked from `/` and from `/media-coverage/`
- **THEN** the root inbound link is ignored in voting; only `media-coverage` votes count

### Requirement: navSection complements section without replacing it
The `navSection` field SHALL be assigned independently of the `section` field. The `section` field SHALL continue to be used for sidebar filter grouping. The `navSection` field is used only for graph color priority. Both fields coexist on every `GraphNode`.

#### Scenario: Node retains URL-path section when navSection is assigned
- **WHEN** node `/services/consulting` has `navSection = "/services"` from BFS
- **THEN** `node.section` is still `"services"` (first path segment)

#### Scenario: Sidebar filter uses section, not navSection
- **WHEN** user toggles the "services" section filter in the sidebar
- **THEN** all nodes with `section = "services"` are toggled, regardless of their `navSection` value
