## 1. Types and CLI

- [x] 1.1 Add `navThreshold: number` to `ScanOptions` in `src/types.ts` (default 50)
- [x] 1.2 Add `--nav-threshold N` flag to CLI parsing in `src/index.ts`
- [x] 1.3 Pass `navThreshold` through to `buildGraph()` call in `src/index.ts`

## 2. Tests

- [x] 2.1 Add test: edges to nodes with in-degree > 50% of pages are removed
- [x] 2.2 Add test: edges to nodes with in-degree exactly at threshold are NOT removed (exclusive boundary)
- [x] 2.3 Add test: edges to low-in-degree nodes are retained
- [x] 2.4 Add test: node remains in graph after all its inbound edges are removed
- [x] 2.5 Add test: `inbound` count recomputed to 0 after all inbound edges removed
- [x] 2.6 Add test: `orphan` flag set to true when last inbound edge removed
- [x] 2.7 Add test: `navThreshold: 0` disables filter (no edges removed)
- [x] 2.8 Add test: `totalEdges` stat reflects post-filter count

## 3. Implementation

- [x] 3.1 Add `filterHighIndegreeEdges(graph, navThreshold)` function in `src/graph-builder.ts`
  - Compute raw in-degree per node from full edge list
  - Compute threshold = `navThreshold / 100 * totalPages`
  - Filter out edges where target's raw in-degree > threshold
  - Skip filter when `navThreshold === 0`
- [x] 3.2 Recompute `inbound` and `outbound` per node after filtering
- [x] 3.3 Recompute `orphan` per node after filtering
- [x] 3.4 Recompute `totalEdges` stat from filtered edge list
- [x] 3.5 Call `filterHighIndegreeEdges` at end of `buildGraph()` before returning

## 4. Verification

- [x] 4.1 Run `bun test` — all tests pass
- [x] 4.2 Run crawl on real site, verify graph has fewer noisy hub edges
