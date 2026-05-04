import { test, expect, describe } from "bun:test"
import { buildGraph, inferSectionFromInbound, extractBaseSection, filterHighIndegreeEdges } from "./graph-builder"
import type { CrawlRecord, Graph, GraphNode, GraphEdge } from "./types"

function makeNode(id: string, section: string): GraphNode {
  return {
    id,
    url: id,
    title: "",
    status: 200,
    depth: 1,
    section,
    lang: "default",
    pattern: "/",
    inbound: 0,
    outbound: 0,
    orphan: false,
    dead: false,
  }
}

test("inferSectionFromInbound - single-source majority", () => {
  const nodes = [
    makeNode("https://example.com/events", "events"),
    makeNode("https://example.com/events/annual", "events"),
    makeNode("https://example.com/event-details", "event-details"),
  ]
  const edges: GraphEdge[] = [
    { source: "https://example.com/events", target: "https://example.com/event-details" },
    { source: "https://example.com/events/annual", target: "https://example.com/event-details" },
  ]
  const result = inferSectionFromInbound(nodes, edges, "https://example.com/")
  expect(result.get("https://example.com/event-details")).toBe("events")
})

test("inferSectionFromInbound - tie fallback", () => {
  const nodes = [
    makeNode("https://example.com/blog", "blog"),
    makeNode("https://example.com/news", "news"),
    makeNode("https://example.com/shared", "shared"),
  ]
  const edges: GraphEdge[] = [
    { source: "https://example.com/blog", target: "https://example.com/shared" },
    { source: "https://example.com/news", target: "https://example.com/shared" },
  ]
  const result = inferSectionFromInbound(nodes, edges, "https://example.com/")
  expect(result.has("https://example.com/shared")).toBe(false)
})

test("inferSectionFromInbound - root excluded single voter still infers", () => {
  const nodes = [
    makeNode("https://example.com/", "/"),
    makeNode("https://example.com/media-coverage", "media-coverage"),
    makeNode("https://example.com/20210319-recruit", "20210319-recruit"),
  ]
  const edges: GraphEdge[] = [
    { source: "https://example.com/", target: "https://example.com/20210319-recruit" },
    { source: "https://example.com/media-coverage", target: "https://example.com/20210319-recruit" },
  ]
  const result = inferSectionFromInbound(nodes, edges, "https://example.com/")
  expect(result.get("https://example.com/20210319-recruit")).toBe("media-coverage")
})

test("inferSectionFromInbound - paginated section page infers section", () => {
  const nodes = [
    makeNode("https://example.com/media-coverage/7", "media-coverage"),
    makeNode("https://example.com/20190513-cpjobs", "20190513-cpjobs"),
  ]
  const edges: GraphEdge[] = [
    { source: "https://example.com/media-coverage/7", target: "https://example.com/20190513-cpjobs" },
  ]
  const result = inferSectionFromInbound(nodes, edges, "https://example.com/")
  expect(result.get("https://example.com/20190513-cpjobs")).toBe("media-coverage")
})

test("inferSectionFromInbound - root excluded but majority wins with 2+ voters", () => {
  const nodes = [
    makeNode("https://example.com/", "/"),
    makeNode("https://example.com/media-coverage", "media-coverage"),
    makeNode("https://example.com/media-coverage/press", "media-coverage"),
    makeNode("https://example.com/20210319-recruit", "20210319-recruit"),
  ]
  const edges: GraphEdge[] = [
    { source: "https://example.com/", target: "https://example.com/20210319-recruit" },
    { source: "https://example.com/media-coverage", target: "https://example.com/20210319-recruit" },
    { source: "https://example.com/media-coverage/press", target: "https://example.com/20210319-recruit" },
  ]
  const result = inferSectionFromInbound(nodes, edges, "https://example.com/")
  expect(result.get("https://example.com/20210319-recruit")).toBe("media-coverage")
})

test("inferSectionFromInbound - no inbound fallback", () => {
  const nodes = [makeNode("https://example.com/orphan", "orphan")]
  const edges: GraphEdge[] = []
  const result = inferSectionFromInbound(nodes, edges, "https://example.com/")
  expect(result.has("https://example.com/orphan")).toBe(false)
})

test("buildGraph - flat URL linked from parent section gets inferred section", () => {
  const records: CrawlRecord[] = [
    {
      url: "https://example.com/",
      finalUrl: "https://example.com/",
      title: "Home",
      status: 200,
      depth: 0,
      outboundLinks: ["https://example.com/media-coverage", "https://example.com/media-coverage/press", "https://example.com/20210319-recruit"],
    },
    {
      url: "https://example.com/media-coverage",
      finalUrl: "https://example.com/media-coverage",
      title: "Media Coverage",
      status: 200,
      depth: 1,
      outboundLinks: ["https://example.com/20210319-recruit"],
    },
    {
      url: "https://example.com/media-coverage/press",
      finalUrl: "https://example.com/media-coverage/press",
      title: "Press",
      status: 200,
      depth: 1,
      outboundLinks: ["https://example.com/20210319-recruit"],
    },
    {
      url: "https://example.com/20210319-recruit",
      finalUrl: "https://example.com/20210319-recruit",
      title: "Recruit",
      status: 200,
      depth: 1,
      outboundLinks: [],
    },
  ]

  const graph = buildGraph(records, "https://example.com/")
  const recruit = graph.nodes.find((n) => n.url === "https://example.com/20210319-recruit")
  expect(recruit).toBeDefined()
  expect(recruit!.section).toBe("media-coverage")
})

test("buildGraph - hierarchical URL keeps path-based section", () => {
  const records: CrawlRecord[] = [
    {
      url: "https://example.com/",
      finalUrl: "https://example.com/",
      title: "Home",
      status: 200,
      depth: 0,
      outboundLinks: ["https://example.com/blog/my-post"],
    },
    {
      url: "https://example.com/blog/my-post",
      finalUrl: "https://example.com/blog/my-post",
      title: "My Post",
      status: 200,
      depth: 1,
      outboundLinks: [],
    },
  ]

  const graph = buildGraph(records, "https://example.com/")
  const post = graph.nodes.find((n) => n.url === "https://example.com/blog/my-post")
  expect(post).toBeDefined()
  expect(post!.section).toBe("blog")
})

// ── filterHighIndegreeEdges ───────────────────────────────────────────────────

function makeFullNode(url: string, depth: number, inbound: number, outbound: number): GraphNode {
  return {
    id: url, url, title: "", status: 200, depth,
    section: "test", lang: "default", pattern: "/test",
    inbound, outbound, orphan: false, dead: false,
  }
}

function makeTestGraph(): Graph {
  // 4 nodes: root (depth 0), hub (depth 1, linked from 3), p1 (depth 1), p2 (depth 1)
  // hub in-degree = 3 (75% of 4) → above 50% threshold
  // p1 in-degree = 1 (25%) → below threshold
  // p2 in-degree = 1 (25%) → below threshold
  const root = "https://example.com/"
  const hub  = "https://example.com/about"
  const p1   = "https://example.com/page1"
  const p2   = "https://example.com/page2"
  const nodes: GraphNode[] = [
    makeFullNode(root, 0, 0, 3),
    makeFullNode(hub,  1, 3, 0),
    makeFullNode(p1,   1, 1, 0),
    makeFullNode(p2,   1, 1, 0),
  ]
  const edges: GraphEdge[] = [
    { source: root, target: hub },
    { source: root, target: p1 },
    { source: root, target: p2 },
    { source: p1,   target: hub },
    { source: p2,   target: hub },
  ]
  return {
    nodes,
    edges,
    stats: {
      totalPages: 4, totalEdges: 5, totalSections: 1, totalTemplates: 1,
      orphanCount: 0, deadCount: 0, maxDepth: 1,
      sectionBreakdown: [], templateBreakdown: [], langBreakdown: [], isMultilingual: false,
    },
  }
}

describe("filterHighIndegreeEdges", () => {
  test("2.1 removes edges to nodes with in-degree > 50% of pages", () => {
    const graph = makeTestGraph()
    const result = filterHighIndegreeEdges(graph, 50)
    const hub = "https://example.com/about"
    expect(result.edges.some(e => e.target === hub)).toBe(false)
  })

  test("2.2 does NOT remove edges at exact threshold (exclusive boundary)", () => {
    // 4 nodes, make hub in-degree exactly 2 (50% of 4)
    const graph = makeTestGraph()
    // Replace hub edges: only 2 inbound (root→hub, p1→hub)
    graph.edges = graph.edges.filter(e => !(e.source === "https://example.com/page2" && e.target === "https://example.com/about"))
    graph.nodes.find(n => n.url === "https://example.com/about")!.inbound = 2

    const result = filterHighIndegreeEdges(graph, 50)
    const hub = "https://example.com/about"
    // 2/4 = 50%, not strictly greater → retained
    expect(result.edges.some(e => e.target === hub)).toBe(true)
  })

  test("2.3 retains edges to low-in-degree nodes", () => {
    const graph = makeTestGraph()
    const result = filterHighIndegreeEdges(graph, 50)
    const p1 = "https://example.com/page1"
    const p2 = "https://example.com/page2"
    expect(result.edges.some(e => e.target === p1)).toBe(true)
    expect(result.edges.some(e => e.target === p2)).toBe(true)
  })

  test("2.4 node remains in graph after all inbound edges removed", () => {
    const graph = makeTestGraph()
    const result = filterHighIndegreeEdges(graph, 50)
    const hub = result.nodes.find(n => n.url === "https://example.com/about")
    expect(hub).toBeDefined()
  })

  test("2.5 inbound count recomputed to 0 after all inbound edges removed", () => {
    const graph = makeTestGraph()
    const result = filterHighIndegreeEdges(graph, 50)
    const hub = result.nodes.find(n => n.url === "https://example.com/about")!
    expect(hub.inbound).toBe(0)
  })

  test("2.6 orphan flag set to true when last inbound edge removed", () => {
    const graph = makeTestGraph()
    const result = filterHighIndegreeEdges(graph, 50)
    const hub = result.nodes.find(n => n.url === "https://example.com/about")!
    expect(hub.orphan).toBe(true)
  })

  test("2.7 navThreshold 0 disables filter", () => {
    const graph = makeTestGraph()
    const result = filterHighIndegreeEdges(graph, 0)
    expect(result.edges.length).toBe(graph.edges.length)
  })

  test("2.8 totalEdges stat reflects post-filter count", () => {
    const graph = makeTestGraph()
    const result = filterHighIndegreeEdges(graph, 50)
    expect(result.stats.totalEdges).toBe(result.edges.length)
  })
})
