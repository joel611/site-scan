## Context

Site-scan-map currently assigns nodes to visual groups ("sections") via URL path parsing and inbound-link majority voting (`smart-section-grouping`). The centroid-attraction pass in `graph-cluster-layout` then pulls same-section nodes together in Sigma.js. This works for well-structured sites but produces arbitrary clusters on flat-URL sites or single-section sites.

The proposed pipeline adds two graph-algorithm passes as a post-processing step after graph construction:

1. **Leiden community detection** on the link graph → structural communities
2. **HDBSCAN** on page text embeddings → semantic subclusters within each community

Both run server-side (at scan time, in `src/graph-builder.ts`) and annotate each `GraphNode` with `community` and `subcluster` fields that the frontend consumes for coloring and centroid attraction.

## Goals / Non-Goals

**Goals:**

- Produce meaningful node groupings independent of URL structure
- Keep the pipeline entirely local (no external API calls required)
- Assign `community` to every node; `subcluster` where HDBSCAN finds density
- Preserve backward compatibility: `section` field unchanged; `community` is additive
- Make `graph-cluster-layout` centroid pass use `community` when available

**Non-Goals:**

- Real-time / interactive re-clustering in the browser
- Persisting embeddings between scans (recomputed each run)
- Supporting custom embedding models (single default model for now)
- Replacing `section` entirely (kept for URL-based filtering)

## Decisions

### Decision: Leiden via `graphology-communities-leiden`

**Choice**: Use `graphology-communities-leiden` (already compatible with `graphology` which is used by Sigma.js tooling).

**Alternatives considered**:
- Louvain (`graphology-communities-louvain`): Faster but non-deterministic across runs; Leiden converges to better optima and is deterministic with a fixed seed.
- Custom JS implementation: Unnecessary given mature graphology ecosystem.

**Rationale**: Graphology is already the graph data structure used in the frontend. Using its community detection library keeps the dependency surface minimal and avoids serialization round-trips.

### Decision: Embeddings via `@xenova/transformers` (local, WASM)

**Choice**: Run `all-MiniLM-L6-v2` (or equivalent) locally via `@xenova/transformers` at scan time in the Bun process.

**Alternatives considered**:
- OpenAI `text-embedding-ada-002`: Requires API key, adds latency and cost.
- Pre-computed static embeddings: Not feasible for arbitrary sites.
- Skip embeddings, use TF-IDF or bag-of-words: Lower quality semantic signal.

**Rationale**: Local WASM model runs without network access. First-run model download (~80MB) is cached by the library. Bun supports WASM. Embedding is optional — if model load fails, `subcluster` defaults to `null`.

### Decision: HDBSCAN per-community (not globally)

**Choice**: Run HDBSCAN separately within each Leiden community.

**Alternatives considered**:
- Global HDBSCAN then intersect with Leiden: Two independent clusterings can diverge badly; requires reconciliation heuristic.
- HDBSCAN globally, ignore Leiden: Loses structural signal entirely.

**Rationale**: Leiden provides the "coarse" split (site sections), HDBSCAN provides "fine" split (topic clusters within a section). Running HDBSCAN per-community keeps cluster counts manageable and keeps semantically related pages that share a structural community together.

### Decision: Strip embeddings before serialization

**Choice**: Embeddings are computed in-memory and stored temporarily on nodes; they are deleted before writing the JSON output.

**Rationale**: Embedding vectors (~384 floats) would bloat the HTML report significantly. Only `community` and `subcluster` string fields are serialized.

### Decision: `community` field format

**Choice**: `community` is a string like `"c0"`, `"c1"`, etc. (zero-indexed, ordered by community size descending).

**Rationale**: Stable, human-readable, sortable. Avoids raw integer types that require special null handling.

## Risks / Trade-offs

- **Model download on first run** (~80MB): acceptable for a dev tool; cached after first use. → Mitigation: Print progress message; allow `--no-embeddings` flag to skip.
- **WASM performance in Bun**: `@xenova/transformers` WASM path may be slow for large sites (1000+ pages). → Mitigation: Batch embedding calls; add a `--no-embeddings` flag to skip semantic subcluster step entirely.
- **HDBSCAN noise points**: HDBSCAN can label nodes as noise (`subcluster: null`) — the frontend must handle null subclusters gracefully.
- **Leiden on sparse graphs**: Very sparse or disconnected graphs may produce communities of size 1 (each node its own community). → Mitigation: Merge singleton communities into a `"c-other"` bucket if community size < `minCommunitySize` (default: 3).

## Migration Plan

1. Add new npm deps: `graphology-communities-leiden`, `@xenova/transformers`, a JS HDBSCAN lib
2. Extend `GraphNode` type (non-breaking additive fields)
3. Add post-processing step in `graph-builder.ts` after existing graph construction
4. Update `graph-cluster-layout` frontend code to prefer `community` over `section` for centroid attraction
5. Update HTML report legend / color assignment to use `community`
6. No breaking changes to CLI interface; no migration needed for existing scans

## Open Questions

- Which JS HDBSCAN library? (`density-clustering`, `hdbscan`, or port from Python)? Need to benchmark on medium graphs (~500 nodes).
- Should `--no-embeddings` be on by default for CI/headless use, requiring opt-in?
- Min community size threshold (currently proposed: 3) — should this be configurable?
