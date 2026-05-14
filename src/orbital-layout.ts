import type { GraphNode } from "./types"

type Pos = { x: number; y: number }

export function computeSolarOrbitLayout(nodes: GraphNode[]): Map<string, Pos> {
  const positions = new Map<string, Pos>()

  // Sun at origin
  const sun = nodes.find(n => n.role === "sun")
  if (sun) positions.set(sun.id, { x: 0, y: 0 })

  // Group non-sun nodes by community, preserving insertion order (community grouping)
  const byComm = new Map<string, { planets: GraphNode[]; moons: GraphNode[]; asteroids: GraphNode[] }>()
  const commOrder: string[] = []
  for (const n of nodes) {
    if (n.role === "sun") continue
    const key = n.community ?? "__orphan__"
    if (!byComm.has(key)) { byComm.set(key, { planets: [], moons: [], asteroids: [] }); commOrder.push(key) }
    const g = byComm.get(key)!
    if (n.role === "planet") g.planets.push(n)
    else if (n.role === "moon") g.moons.push(n)
    else g.asteroids.push(n)
  }

  const keys = commOrder.filter(k => k !== "__orphan__")

  // All planets in community order so same-community planets are adjacent on ring
  const allPlanets = keys.flatMap(k => byComm.get(k)!.planets)
  const N_p = allPlanets.length || 1

  // Assign moons to planets within each community (round-robin)
  const moonsByPlanetId = new Map<string, GraphNode[]>(allPlanets.map(p => [p.id, []]))
  for (const k of keys) {
    const g = byComm.get(k)!
    const np = g.planets.length
    if (np === 0) continue
    const sorted = [...g.moons].sort(moonSortKey)
    sorted.forEach((m, i) => moonsByPlanetId.get(g.planets[i % np].id)!.push(m))
  }

  // MOON_R: accommodates the busiest planet's moon count
  const maxMoonsOnPlanet = Math.max(...[...moonsByPlanetId.values()].map(v => v.length), 1)
  const MOON_R = Math.max(30, maxMoonsOnPlanet * 12 + 20)

  // R_PLANET: circumference fits N_p planets each needing 2.5 × MOON_R gap
  const MIN_SPACING = MOON_R * 2.5
  const R_PLANET = Math.max(MOON_R * 3.5, (MIN_SPACING * N_p) / (2 * Math.PI))

  // Asteroid belt beyond planet ring + moon reach
  const R_ASTEROID = R_PLANET + MOON_R * 2.2

  // Place planets evenly on ring (communities grouped adjacently by iteration order)
  allPlanets.forEach((n, i) => {
    const angle = (i / N_p) * 2 * Math.PI
    positions.set(n.id, { x: Math.cos(angle) * R_PLANET, y: Math.sin(angle) * R_PLANET })
  })

  // Moons: full 360° ring around their planet, start perpendicular to sun–planet axis
  moonsByPlanetId.forEach((moons, planetId) => {
    if (moons.length === 0) return
    const pPos = positions.get(planetId)!
    const pAngle = Math.atan2(pPos.y, pPos.x)
    const startAngle = pAngle + Math.PI / 2
    moons.forEach((n, j) => {
      const mAngle = startAngle + (j / moons.length) * 2 * Math.PI
      positions.set(n.id, { x: pPos.x + Math.cos(mAngle) * MOON_R, y: pPos.y + Math.sin(mAngle) * MOON_R })
    })
  })

  // Moons from planet-less communities: inner asteroid belt
  for (const k of keys) {
    const g = byComm.get(k)!
    if (g.planets.length > 0) continue
    g.moons.forEach((n, i) => {
      const angle = (i / Math.max(1, g.moons.length)) * 2 * Math.PI
      positions.set(n.id, { x: Math.cos(angle) * R_ASTEROID * 0.88, y: Math.sin(angle) * R_ASTEROID * 0.88 })
    })
  }

  // Asteroids: outer belt with slight radial jitter
  const allAsteroids = keys.flatMap(k => byComm.get(k)!.asteroids)
  allAsteroids.forEach((n, i) => {
    const angle = (i / Math.max(1, allAsteroids.length)) * 2 * Math.PI
    const r = R_ASTEROID + (i % 5) * (MOON_R * 0.2)
    positions.set(n.id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r })
  })

  // Orphans: beyond asteroid belt
  const orphan = byComm.get("__orphan__")
  if (orphan) {
    const all = [...orphan.planets, ...orphan.moons, ...orphan.asteroids]
    all.forEach((n, i) => {
      const angle = (i / Math.max(1, all.length)) * 2 * Math.PI
      positions.set(n.id, { x: Math.cos(angle) * R_ASTEROID * 1.2, y: Math.sin(angle) * R_ASTEROID * 1.2 })
    })
  }

  // Fallback for any missed nodes
  for (const n of nodes) {
    if (!positions.has(n.id)) positions.set(n.id, { x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 })
  }

  return positions
}

function moonSortKey(a: GraphNode, b: GraphNode): number {
  if (a.subcluster == null && b.subcluster != null) return 1
  if (a.subcluster != null && b.subcluster == null) return -1
  if (a.subcluster != null && b.subcluster != null) return String(a.subcluster).localeCompare(String(b.subcluster))
  return 0
}
