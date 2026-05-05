## MODIFIED Requirements

### Requirement: Node metrics
Each node SHALL include: url, title, status, depth, section (first non-empty path segment, or `/` for root, with parent-aware override for flat URLs), inbound link count, outbound link count, `community` (Leiden community id string, e.g. `"c0"`), and `subcluster` (HDBSCAN semantic subcluster id string or `null`).

#### Scenario: Section assignment for hierarchical URL
- **WHEN** page URL is `https://example.com/blog/my-post`
- **THEN** node section is `blog`

#### Scenario: Section assignment for flat URL linked from parent section
- **WHEN** page URL is `https://example.com/20210319-recruit` and the only inbound links are from pages in section `media-coverage`
- **THEN** node section is `media-coverage`

#### Scenario: Root section
- **WHEN** page URL is `https://example.com/`
- **THEN** node section is `/`

#### Scenario: Community assigned
- **WHEN** Leiden community detection completes
- **THEN** node has `community` set to a string like `"c0"` or `"c-other"`

#### Scenario: Subcluster assigned
- **WHEN** HDBSCAN completes for the node's community and node embedding exists
- **THEN** node has `subcluster` set to a string like `"c0-s1"` or `null` for noise points

#### Scenario: Community present without embeddings
- **WHEN** `--no-embeddings` flag is passed
- **THEN** node has `community` set (from Leiden) but `subcluster` is `null`
