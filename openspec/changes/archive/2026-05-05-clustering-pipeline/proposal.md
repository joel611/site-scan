## Why

Current section grouping relies on URL path structure and inbound-link majority voting, which produces noisy or arbitrary clusters—especially on flat-URL sites. A graph-native clustering pipeline (Leiden/Louvain for structural communities + HDBSCAN on embeddings for semantic subclusters) will produce meaningfully grouped nodes regardless of URL convention.

## What Changes

- Add **Leiden/Louvain community detection** on the cleaned structural graph, assigning each node a `community` field that replaces or overrides path-based section assignment
- Add **page embedding** step in the crawler: extract text from each crawled page and generate a vector embedding
- Add **HDBSCAN semantic subclustering** within each Leiden community (or globally), assigning each node a `subcluster` field
- Extend `GraphNode` type with `community` and `subcluster` fields
- Update `graph-cluster-layout` to drive centroid attraction by `community` instead of `section`
- Expose community/subcluster assignments as node metadata in the HTML report

## Capabilities

### New Capabilities

- `leiden-community-detection`: Detect structural communities in the link graph using Leiden (preferred) or Louvain algorithm; assigns `community` id to each node
- `page-embeddings`: During crawl, extract visible text from each page and compute a vector embedding (stored on the node); used downstream by HDBSCAN
- `hdbscan-semantic-subcluster`: Within each Leiden community (or globally if community count is low), run HDBSCAN on node embeddings to produce `subcluster` id per node

### Modified Capabilities

- `graph-builder`: `GraphNode` gains `community: string` and `subcluster: string | null` fields; community detection runs as a post-processing pass after graph construction
- `graph-cluster-layout`: Centroid attraction pass uses `community` field instead of `section` when community data is available

## Impact

- `src/crawler.ts` — add text extraction + embedding call per page
- `src/graph-builder.ts` — run Leiden/HDBSCAN post-processing; populate new fields on nodes
- `src/types.ts` — extend `GraphNode` with `community`, `subcluster`, `embedding` (optional, stripped before serialization)
- `frontend/` — color coding and legend updated to use `community`/`subcluster`
- New dependency: a JS-native graph library supporting Leiden (e.g., `graphology-communities-leiden`) and a JS HDBSCAN implementation; embeddings via local model (e.g., `@xenova/transformers`) or optional external API call
