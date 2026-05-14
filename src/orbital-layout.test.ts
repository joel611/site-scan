import { test, expect, describe } from "bun:test"
import { computeSolarOrbitLayout } from "./orbital-layout"
import type { GraphNode } from "./types"

function makeNode(overrides: Partial<GraphNode> & { id: string }): GraphNode {
  return {
    id: overrides.id,
    url: `https://example.com/${overrides.id}`,
    title: "",
    status: 200,
    depth: 1,
    section: "/",
    lang: "default",
    pattern: "/",
    inbound: 1,
    outbound: 1,
    orphan: false,
    dead: false,
    community: "c0",
    subcluster: null,
    navSource: null,
    navSection: null,
    role: "moon",
    ...overrides,
  }
}

function dist(a: {x: number, y: number}, b = {x: 0, y: 0}) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function angle(p: {x: number, y: number}) {
  return Math.atan2(p.y, p.x)
}

function angDiff(a: number, b: number) {
  let d = Math.abs(a - b) % (2 * Math.PI)
  return d > Math.PI ? 2 * Math.PI - d : d
}

// ── Behavior 1: Sun at origin ─────────────────────────────────────────────────
describe("sun placement", () => {
  test("sun placed at origin", () => {
    const nodes = [makeNode({ id: "sun", role: "sun", depth: 0 })]
    const positions = computeSolarOrbitLayout(nodes)
    expect(positions.get("sun")).toEqual({ x: 0, y: 0 })
  })
})

// ── Behavior 2: All planets on same ring radius ───────────────────────────────
describe("planet ring", () => {
  test("all planets at equal distance from sun", () => {
    const nodes = [
      makeNode({ id: "sun", role: "sun", depth: 0 }),
      makeNode({ id: "p1", role: "planet", community: "ca" }),
      makeNode({ id: "p2", role: "planet", community: "cb" }),
      makeNode({ id: "p3", role: "planet", community: "cb" }),
    ]
    const pos = computeSolarOrbitLayout(nodes)
    const dists = ["p1", "p2", "p3"].map(id => dist(pos.get(id)!))
    expect(dists[0]).toBeCloseTo(dists[1], 0)
    expect(dists[1]).toBeCloseTo(dists[2], 0)
  })

  // ── Behavior 3: Ring radius grows with planet count ──────────────────────────
  test("planet ring radius grows with more planets", () => {
    const base = [makeNode({ id: "sun", role: "sun", depth: 0 })]

    const few = computeSolarOrbitLayout([
      ...base,
      makeNode({ id: "p1", role: "planet" }),
      makeNode({ id: "p2", role: "planet" }),
    ])

    const many = computeSolarOrbitLayout([
      ...base,
      ...Array.from({ length: 20 }, (_, i) => makeNode({ id: `p${i}`, role: "planet" })),
    ])

    const rFew = dist(few.get("p1")!)
    const rMany = dist(many.get("p0")!)
    expect(rMany).toBeGreaterThan(rFew)
  })
})

// ── Behavior 4: Moons within MOON_R of their planet ──────────────────────────
describe("moon placement", () => {
  test("moons are closer to their planet than to the sun", () => {
    const nodes = [
      makeNode({ id: "sun", role: "sun", depth: 0 }),
      makeNode({ id: "planet", role: "planet", community: "c0" }),
      makeNode({ id: "moon1", role: "moon", community: "c0" }),
      makeNode({ id: "moon2", role: "moon", community: "c0" }),
    ]
    const pos = computeSolarOrbitLayout(nodes)
    const pPos = pos.get("planet")!
    for (const id of ["moon1", "moon2"]) {
      const mPos = pos.get(id)!
      expect(dist(mPos, pPos)).toBeLessThan(dist(mPos))
    }
  })

  test("all moons equidistant from their planet (on a ring)", () => {
    const nodes = [
      makeNode({ id: "sun", role: "sun", depth: 0 }),
      makeNode({ id: "planet", role: "planet", community: "c0" }),
      makeNode({ id: "m1", role: "moon", community: "c0" }),
      makeNode({ id: "m2", role: "moon", community: "c0" }),
      makeNode({ id: "m3", role: "moon", community: "c0" }),
    ]
    const pos = computeSolarOrbitLayout(nodes)
    const pPos = pos.get("planet")!
    const moonDists = ["m1", "m2", "m3"].map(id => dist(pos.get(id)!, pPos))
    expect(moonDists[0]).toBeCloseTo(moonDists[1], 0)
    expect(moonDists[1]).toBeCloseTo(moonDists[2], 0)
  })
})

// ── Behavior 5: Asteroids beyond planet+moon zone ────────────────────────────
describe("asteroid placement", () => {
  test("asteroids are further from sun than any planet or moon", () => {
    const nodes = [
      makeNode({ id: "sun", role: "sun", depth: 0 }),
      makeNode({ id: "planet", role: "planet", community: "c0" }),
      makeNode({ id: "moon", role: "moon", community: "c0" }),
      makeNode({ id: "asteroid", role: "asteroid", community: "c0" }),
    ]
    const pos = computeSolarOrbitLayout(nodes)
    const aDist = dist(pos.get("asteroid")!)
    const pDist = dist(pos.get("planet")!)
    const mDist = dist(pos.get("moon")!)
    expect(aDist).toBeGreaterThan(pDist)
    expect(aDist).toBeGreaterThan(mDist)
  })
})

// ── Behavior 6: Same-community planets adjacent on ring ───────────────────────
describe("community grouping", () => {
  test("same-community planets have smaller angular gap than cross-community planets", () => {
    const nodes = [
      makeNode({ id: "sun", role: "sun", depth: 0 }),
      makeNode({ id: "pa1", role: "planet", community: "ca" }),
      makeNode({ id: "pa2", role: "planet", community: "ca" }),
      makeNode({ id: "pb1", role: "planet", community: "cb" }),
      makeNode({ id: "pb2", role: "planet", community: "cb" }),
    ]
    const pos = computeSolarOrbitLayout(nodes)
    const sameCa = angDiff(angle(pos.get("pa1")!), angle(pos.get("pa2")!))
    const sameCb = angDiff(angle(pos.get("pb1")!), angle(pos.get("pb2")!))
    const cross = angDiff(angle(pos.get("pa1")!), angle(pos.get("pb1")!))
    expect(sameCa).toBeLessThan(cross)
    expect(sameCb).toBeLessThan(cross)
  })
})
