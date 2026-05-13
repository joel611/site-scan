# Solar System Visualization — Design

## Core Philosophy

**Aesthetic, not semantic.** Orbital positions convey the solar system *vibe* but don't encode strict meaning. FA2 runs organically after the orbital seed. Bridge pages with heavy cross-cluster edges may drift slightly — that's acceptable. No hard bounding boxes or ring constraints.

## Node Roles

Determined at layout time from existing node data:

| Role | Criteria | Notes |
|------|----------|-------|
| Sun | `depth === 0` | Exactly one per graph. Homepage. |
| Planet | Shallowest `depth` within community | Multiple planets allowed if tied. |
| Moon | All other community members | May be grouped by `subcluster`. |
| Asteroid | `orphan === true` OR `status !== 200` | Dead pages always get Asteroid treatment regardless of inbound. |

**Planet tie-break:** If a community has N pages sharing the minimum depth, all N become planets (each gets planet sizing and treatment). No single-winner selection.

**Edge case — 1 community:** If Leiden returns only 1 community, there are no planets. Layout is Sun + moons only. Asteroids still placed at periphery.

## Node Sizing

Role-based base size with inbound boost within tier.

| Role | Base size (px) | Max size (px) | Boost |
|------|---------------|--------------|-------|
| Sun | 45 | 45 | None (fixed) |
| Planet | 22 | 28 | +inbound% within tier |
| Moon | 11 | 16 | +inbound% within tier |
| Asteroid | 8 | 8 | None (fixed) |

**Inbound boost formula:**
```
boostedSize = baseMin + (baseMax - baseMin) * clamp(inbound / tierMaxInbound, 0, 1)
```
`tierMaxInbound` = max inbound count among nodes in that role tier (computed per graph).

**Dead pages (status !== 200):** Always sized as Asteroid (8px) regardless of inbound count. Colored with red tint (see Color Encoding).

## Color Encoding

**Community hue + role lightness.** Base hue from `colorScale(community)`. Lightness encodes role:

| Role | Lightness modifier |
|------|--------------------|
| Sun | Gold (#FFD700), overrides community color entirely |
| Planet | Bright — full community hue saturation |
| Moon | Mid — community hue at ~70% saturation/lightness |
| Asteroid | Muted — community hue at ~40% saturation, 60% lightness |
| Dead (any role) | Red tint applied: mix community hue toward #FF4444 at 60% |

Implementation: convert community hex to HSL, adjust L/S per role, convert back.

## Initial Orbital Seed (Pre-FA2)

Deterministic placement before ForceAtlas2 runs.

### Radius Scaling

```
planetRadius = 8 * sqrt(nodeCount)
moonRadius   = planetRadius * 2
asteroidRadius = planetRadius * 3
```

Sun fixed at (0, 0).

### Planet Angle Distribution

Planets distributed around the planet ring. Arc angle per community is weighted by community size:

```
communityFraction = communitySize / totalNonSunNodes
planetAngleStart  = sum of fractions for preceding communities * 2π
planetAngle       = planetAngleStart + (communityFraction * 2π / numPlanets_in_community)
```

Planets within the same community share that community's arc slice, evenly divided.

### Moon Seeding

Each moon placed at `moonRadius`, angle within a small arc around its planet's angle:

```
arcSpan = communityFraction * 2π * 0.8   // 80% of community arc slice, avoid overlap
moonAngle = planetAngle + offset_within_arc
```

**Subcluster grouping:** Moons with the same non-null `subcluster` value are placed adjacently within the arc. Moons with `subcluster === null` placed after subcluster groups.

### Asteroid Seeding

Asteroids with a community assignment: placed near their community's centroid angle, at `asteroidRadius`, with jitter.

Orphan asteroids with no community context: placed at `asteroidRadius` evenly distributed around remaining arc space.

## Edge Weights (Pre-FA2)

Set on graphology edges before FA2 runs. FA2's `edgeWeightInfluence: 0.8` uses these.

```
intra-community edge weight: 2.0
inter-community edge weight: 0.3
```

This handles bridge page pinning: pages with heavy inter-cluster links still feel the stronger intra-cluster pull and stay visually near their home community.

## ForceAtlas2 Settings

```js
forceAtlas2(graph, {
  iterations: 150,
  settings: {
    gravity: 0.9,
    strongGravityMode: true,
    scalingRatio: 6.0,
    slowDown: 4,
    barnesHutOptimize: true,
    barnesHutTheta: 0.6,
    edgeWeightInfluence: 0.8,
    linLogMode: false,
  }
})
```

**Sun node is fixed** during FA2 (`fixed: true` attribute on graphology node).

## Removed: Cluster Strength Slider

The "Cluster strength" range input and `applyClustering()` post-FA2 centroid pull are removed. Edge weights pre-FA2 now handle community cohesion. The sidebar filter group containing this slider is removed entirely.

## New Interaction: Click Planet → Highlight Orbit

Clicking a planet node (any node with `role === 'planet'`):
- All nodes NOT in the same community drop to ~15% opacity
- Edges to/from non-community nodes drop to ~10% opacity
- Clicked planet's community stays full opacity
- Clicking empty canvas or the planet again resets to normal

Reuses the same dim/restore pattern as existing hull hover behavior. No camera movement.

## Baseline Positions

After FA2, store positions in `baselinePositions` as currently implemented. This enables the existing filter system (depth, section, etc.) to restore positions when filters change. No changes needed here.
