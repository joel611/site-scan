# Tasks

## Phase 1: Node Role Classification

- [x] Add `computeNodeRoles(nodes)` function that returns a Map<nodeId, 'sun'|'planet'|'moon'|'asteroid'>
  - Sun: depth === 0
  - Planet: shallowest depth within community (all tied nodes become planets)
  - Asteroid: orphan === true OR status !== 200
  - Moon: everything else
- [x] Unit test role classification for: single community, multi-community, tie cases, dead pages

## Phase 2: Node Sizing

- [x] Replace current `5 + n.inbound * 0.8` sizing with role-based sizing + inbound boost
- [x] Compute `tierMaxInbound` per role tier before graph.addNode loop
- [x] Apply boostedSize formula per role

## Phase 3: Color Encoding

- [x] Add HSL color utility: hex→HSL, adjust L/S, HSL→hex
- [x] Apply community hue + role lightness to each node
- [x] Dead pages: mix community hue toward red at 60%
- [x] Sun: fixed gold (#FFD700)

## Phase 4: Edge Weights

- [x] Set `weight` attribute on each graphology edge: 2.0 intra-community, 0.3 inter-community
- [x] Set `fixed: true` on Sun node before FA2

## Phase 5: Orbital Seed

- [x] Replace `Math.random()` initial positions with orbital seed function
- [x] Compute planetRadius = 8 * sqrt(nodeCount), moonRadius = 2x, asteroidRadius = 3x
- [x] Distribute planets by community arc (weighted by community size)
- [x] Seed moons in small arc around planet angle, grouped by subcluster
- [x] Seed asteroids near community centroid angle or distributed evenly for orphans

## Phase 6: FA2 Config

- [x] Update FA2 settings: iterations=150, gravity=0.9, scalingRatio=6.0, slowDown=4, edgeWeightInfluence=0.8
- [x] Confirm fixed Sun node is handled correctly by forceAtlas2 vendor bundle

## Phase 7: Remove Cluster Slider

- [x] Remove cluster-strength range input from HTML
- [x] Remove `applyClustering()` function
- [x] Remove `onClusterChange()` handler
- [x] Remove `filters.clusterStrength` state and references
- [x] Remove cluster-strength initialization in `restoreFilters()`

## Phase 8: Planet Click Highlight

- [x] Add `role` attribute to graphology nodes (from Phase 1 map)
- [x] Add click handler: if clicked node is planet, dim non-community nodes/edges
- [x] Add reset on empty-canvas click or second planet click
- [x] Reuse existing dim/restore opacity pattern from hull hover

## Phase 9: Testing & Tuning

- [ ] Generate scan on 2-3 sites, visually verify solar system structure
- [ ] Tune planetRadius formula if layout looks too compressed or spread
- [ ] Verify 1-community fallback (no planets case)
- [ ] Verify dead page red tint is visible but not garish
