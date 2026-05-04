## MODIFIED Requirements

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
