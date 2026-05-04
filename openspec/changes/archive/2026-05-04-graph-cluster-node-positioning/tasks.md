## 1. Layout Algorithm

- [x] 1.1 Store force-atlas2 baseline positions after initial layout converges
- [x] 1.2 Implement `applyClustering(baselinePositions, strength)` function that computes section centroids from visible nodes and nudges each node toward its section centroid for 30 iterations
- [x] 1.3 Ensure centroid computation excludes hidden/filtered nodes
- [x] 1.4 Wire clustering re-application into `applyFilters()` so layout refreshes when filters change

## 2. UI Controls

- [x] 2.1 Add "Cluster Strength" range slider (0–100, default 30) to the sidebar HTML below depth filters
- [x] 2.2 Add `clusterStrength` variable to filters state and map slider value to 0.0–1.0
- [x] 2.3 Attach slider `oninput` handler to re-apply clustering from baseline and refresh Sigma

## 3. Integration & Polish

- [x] 3.1 Update `applyFilters()` to call clustering pass before `sigma.refresh()`
- [x] 3.2 Update hull rendering to reflect clustered positions correctly
- [x] 3.3 Ensure deterministic output: same strength produces same layout every time
- [x] 3.4 Verify existing tests pass and add test for clustering function if feasible within inline-HTML constraint
