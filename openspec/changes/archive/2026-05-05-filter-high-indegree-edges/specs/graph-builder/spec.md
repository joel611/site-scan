## MODIFIED Requirements

### Requirement: Site-level stats
The graph builder SHALL compute aggregate stats: total pages, total edges, total sections, total unique templates, orphan count, dead link count, max depth. All stats SHALL reflect the post-filtered edge set (after high-in-degree edge removal).

#### Scenario: Stats computed
- **WHEN** crawl completes with 247 pages
- **THEN** stats object contains all aggregate fields with correct values

#### Scenario: Edge count reflects filtering
- **WHEN** high-in-degree edge filter removes 500 edges
- **THEN** `totalEdges` in stats equals the count AFTER removal
