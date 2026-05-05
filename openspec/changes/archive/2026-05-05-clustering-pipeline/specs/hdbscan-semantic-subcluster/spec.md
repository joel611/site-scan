## ADDED Requirements

### Requirement: Per-community HDBSCAN subclustering
After Leiden community detection and embedding generation, the system SHALL run HDBSCAN on the embedding vectors of nodes within each Leiden community separately. Each node SHALL be assigned a `subcluster` string field in the format `"<community>-s<N>"` (e.g., `"c0-s0"`, `"c0-s1"`, `"c1-s0"`). Noise-point nodes (HDBSCAN label -1) SHALL receive `subcluster: null`.

#### Scenario: Subclusters within a community
- **WHEN** community `"c0"` contains nodes with two distinct semantic topics (e.g., product pages vs. support pages)
- **THEN** product nodes receive `"c0-s0"` and support nodes receive `"c0-s1"`

#### Scenario: Noise point handling
- **WHEN** a node's embedding does not belong to any dense cluster within its community
- **THEN** `subcluster` is `null`

#### Scenario: Subcluster IDs scoped to community
- **WHEN** two communities each have two subclusters
- **THEN** ids are `"c0-s0"`, `"c0-s1"`, `"c1-s0"`, `"c1-s1"` — not globally renumbered

### Requirement: HDBSCAN minimum cluster size
HDBSCAN SHALL use `minClusterSize = max(3, floor(communitySize * 0.1))` as the minimum cluster size parameter, adapting to community scale.

#### Scenario: Small community min cluster size
- **WHEN** a community has 10 nodes
- **THEN** HDBSCAN uses `minClusterSize = 3`

#### Scenario: Large community min cluster size
- **WHEN** a community has 50 nodes
- **THEN** HDBSCAN uses `minClusterSize = 5`

### Requirement: Skip HDBSCAN for communities below threshold
Communities with fewer than 5 nodes SHALL skip HDBSCAN. All nodes in such communities receive `subcluster: null`.

#### Scenario: Tiny community skipped
- **WHEN** community `"c-other"` has 4 nodes
- **THEN** all 4 nodes have `subcluster: null`

### Requirement: Skip HDBSCAN when embeddings unavailable
When a node has `_embedding: null` or the `--no-embeddings` flag was used, the system SHALL assign `subcluster: null` without running HDBSCAN.

#### Scenario: No embedding
- **WHEN** a node has no embedding (empty page or model load failure)
- **THEN** `subcluster: null`
