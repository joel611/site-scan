# Node Detail Panel

## Purpose

The node detail panel provides contextual information about a graph node when selected by the user. It displays the node's metadata, its outbound links (Sources), and its inbound links (Backlinks), allowing users to explore site structure and identify dead links without leaving the graph view.

## Requirements

### Requirement: Panel opens on node click
When a user clicks a graph node, the system SHALL open a detail panel for that node instead of navigating to the node's URL. The panel SHALL display the node's title, URL, HTTP status, depth, inbound count, and outbound count.

#### Scenario: Click a normal node
- **WHEN** user clicks a node in the graph
- **THEN** a detail panel appears anchored to the right side of the graph view
- **THEN** the panel shows the node's title, URL, status, and depth

#### Scenario: Click already-selected node
- **WHEN** user clicks the node that is already selected
- **THEN** the panel closes (toggle behavior)

### Requirement: Sources list in panel
The panel SHALL display a "Sources" section listing all pages that this node links out to (outbound edges). Each entry SHALL show the target page's title (or URL path if no title) and a dead indicator if the target is a dead link.

#### Scenario: Node with outbound links
- **WHEN** the detail panel opens for a node with outbound links
- **THEN** the Sources section lists each linked-to page

#### Scenario: Node links to a dead page
- **WHEN** the detail panel opens for a node that links to one or more dead pages
- **THEN** each dead target in the Sources list shows a visual dead indicator (red badge or label)

#### Scenario: Node with no outbound links
- **WHEN** the detail panel opens for a node with zero outbound links
- **THEN** the Sources section shows "No outbound links"

### Requirement: Backlinks list in panel
The panel SHALL display a "Backlinks" section listing all pages that link to this node (inbound edges). Each entry SHALL show the source page's title (or URL path if no title).

#### Scenario: Node with inbound links
- **WHEN** the detail panel opens for a node with inbound links
- **THEN** the Backlinks section lists each linking page

#### Scenario: Orphan node (no inbound links)
- **WHEN** the detail panel opens for an orphan node
- **THEN** the Backlinks section shows "No backlinks (orphan)"

### Requirement: Navigate to linked node from panel
Clicking an entry in the Sources or Backlinks list SHALL close the current panel and open the detail panel for the clicked entry's node, while also centering and highlighting that node in the graph.

#### Scenario: Click a Sources entry
- **WHEN** user clicks a node entry in the Sources list
- **THEN** the graph centers and highlights the target node
- **THEN** the panel updates to show the target node's detail

#### Scenario: Click a Backlinks entry
- **WHEN** user clicks a node entry in the Backlinks list
- **THEN** the graph centers and highlights the source node
- **THEN** the panel updates to show that node's detail

### Requirement: Visit page action
The panel SHALL provide a "Visit page" button that opens the node's URL in a new browser tab.

#### Scenario: Click visit page
- **WHEN** user clicks the "Visit page" button in the panel
- **THEN** the node's URL opens in a new tab

### Requirement: Panel dismissal
The panel SHALL close when the user presses the Escape key or clicks outside the panel (on the graph backdrop).

#### Scenario: Escape key dismissal
- **WHEN** the panel is open and user presses Escape
- **THEN** the panel closes

#### Scenario: Backdrop click dismissal
- **WHEN** the panel is open and user clicks on the graph canvas outside the panel
- **THEN** the panel closes

### Requirement: Dead link locator via panel
When viewing a dead node's detail panel, the Backlinks list SHALL show which pages link to that dead page, enabling the user to locate the origin of the dead link.

#### Scenario: Identify source of dead link
- **WHEN** user clicks a dead (red) node in the graph
- **THEN** the panel opens showing the dead page's URL and status
- **THEN** the Backlinks section lists all pages that contain a link to this dead URL
