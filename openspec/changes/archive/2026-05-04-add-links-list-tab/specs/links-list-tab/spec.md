## ADDED Requirements

### Requirement: Pages tab displays all pages
The report visualization SHALL provide a tab labeled "Pages" that lists every crawled page as a sortable table with URL, Title, Section, Status, Depth, Inbound, and Outbound columns.

#### Scenario: User switches to Pages tab
- **WHEN** the user clicks the Pages tab
- **THEN** the Pages view is displayed showing a table of all crawled pages
- **AND** the table contains columns for URL, Title, Section, Status, Depth, In, and Out

#### Scenario: User sorts pages table
- **WHEN** the user clicks a column header in the pages table
- **THEN** the table rows are sorted by that column in ascending order
- **AND** clicking the same column again sorts in descending order

#### Scenario: Pages tab coexists with existing tabs
- **WHEN** the user clicks between Graph, Stats, and Pages tabs
- **THEN** only the active tab's content is visible
- **AND** the active tab is styled with the same visual treatment as the existing tabs
