# Solar System Visualization

## Problem

Current graph layout uses pure ForceAtlas2 with random seed positions, producing generic force-directed graphs with no visual hierarchy. Sites with clear community structure (hub pages, section clusters) look the same as flat sites.

## Proposal

Replace the current layout pipeline with a **solar system metaphor**: aesthetic, not strictly semantic. Homepage is the Sun, community hubs are Planets, regular pages are Moons, orphans/dead pages are Asteroids. Orbital seeding before FA2 creates the solar structure; FA2 polishes it organically.

## Scope

- `src/html-report.ts` — layout pipeline, node sizing, color encoding, edge weights, click interaction
- No changes to crawler, graph-builder, or types

## Out of Scope

- Strict orbital ring enforcement (aesthetic layout, not semantic constraint)
- HDBSCAN subcluster as separate planet tier (used only for moon grouping within arc)
- Capping maximum planet count
