## 1. Dependencies

- [x] 1.1 Add `graphology-communities-leiden` to package.json and install
- [x] 1.2 Add `@xenova/transformers` to package.json and install
- [x] 1.3 Research and add a JS HDBSCAN library (evaluate `density-clustering` vs alternatives) to package.json and install
- [x] 1.4 Verify all three deps resolve correctly under Bun

## 2. Type Extensions

- [x] 2.1 Extend `GraphNode` in `src/types.ts` with `community: string`, `subcluster: string | null`, and internal `_embedding?: number[] | null`

## 3. Leiden Community Detection

- [x] 3.1 In `src/graph-builder.ts`, add `runLeidenCommunityDetection(graph)` that calls `graphology-communities-leiden` with seed 42
- [x] 3.2 Map Leiden integer community ids to `"c<N>"` strings ordered by community size descending
- [x] 3.3 Merge communities below `minCommunitySize` (3) into `"c-other"`
- [x] 3.4 Assign `community` field on every graph node
- [x] 3.5 Write unit tests for community id ordering, singleton merging, and determinism

## 4. Page Embeddings

- [x] 4.1 In `src/graph-builder.ts`, add `extractPageText(html: string): string` — strips scripts/styles/nav/header/footer, truncates to 512 tokens
- [x] 4.2 Add `computeEmbeddings(nodes: GraphNode[]): Promise<void>` that loads `all-MiniLM-L6-v2` via `@xenova/transformers` and batch-embeds all non-empty texts, setting `_embedding` on each node
- [x] 4.3 Add `--no-embeddings` CLI flag in `src/index.ts`; when set, skip embedding step and set all `subcluster: null`
- [x] 4.4 Ensure `_embedding` is deleted from all nodes before JSON serialization
- [x] 4.5 Write unit tests for `extractPageText` (body fallback, empty page, truncation)

## 5. HDBSCAN Semantic Subclustering

- [x] 5.1 In `src/graph-builder.ts`, add `runHdbscanSubclustering(nodesByCommunity: Map<string, GraphNode[]>): void` that runs HDBSCAN per community
- [x] 5.2 Implement `minClusterSize = max(3, floor(communitySize * 0.1))` per community
- [x] 5.3 Skip HDBSCAN for communities with fewer than 5 nodes; assign `subcluster: null`
- [x] 5.4 Assign `subcluster` in format `"<community>-s<N>"` for clustered nodes; `null` for noise points and skipped nodes
- [x] 5.5 Write unit tests for subcluster id format, noise handling, small community skip

## 6. Graph Builder Integration

- [x] 6.1 Wire Leiden detection → embedding computation → HDBSCAN subclustering as sequential post-processing steps in `buildGraph()`
- [x] 6.2 Verify `community` and `subcluster` appear in the serialized graph JSON (and `_embedding` does not)
- [x] 6.3 Run existing graph-builder tests and fix any regressions

## 7. Frontend: Centroid Attraction Update

- [x] 7.1 In the `graph-cluster-layout` frontend code, update centroid attraction to use `community` field when present, falling back to `section`
- [x] 7.2 Update node color assignment to use `community` for color coding (keep `section` as secondary legend label)
- [x] 7.3 Verify the cluster strength slider still works correctly with community-based grouping

## 8. Verification

- [x] 8.1 Run `bun test` — all tests pass
- [x] 8.2 Scan a real site and verify `community` and `subcluster` fields appear on nodes in the report
- [ ] 8.3 Visually verify that community-based centroid attraction groups nodes meaningfully in Sigma.js
- [x] 8.4 Test `--no-embeddings` flag: scan completes, `community` populated, `subcluster` all null
