import type { CrawlRecord, Graph, GraphEdge, GraphNode, GraphStats, SectionStat, TemplateStat } from "./types"

function getSection(url: string): string {
  try {
    const { pathname } = new URL(url)
    const parts = pathname.split("/").filter(Boolean)
    return parts.length > 0 ? (parts[0] ?? "/") : "/"
  } catch {
    return "/"
  }
}

function getPattern(url: string): string {
  try {
    const { pathname } = new URL(url)
    const parts = pathname.split("/").filter(Boolean)
    const replaced = parts.map((seg) => {
      if (/^\d+$/.test(seg)) return ":id"
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return ":uuid"
      if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(seg)) return ":date"
      if (seg.includes("-") && seg.length > 20) return ":slug"
      return seg
    })
    return "/" + replaced.join("/")
  } catch {
    return "/"
  }
}

export function buildGraph(records: CrawlRecord[], startUrl: string): Graph {
  const rootUrl = (() => {
    try { return new URL(startUrl).href } catch { return startUrl }
  })()

  const nodeMap = new Map<string, GraphNode>()

  for (const rec of records) {
    const url = rec.finalUrl || rec.url
    nodeMap.set(url, {
      id: url,
      url,
      title: rec.title,
      status: rec.status,
      depth: rec.depth,
      section: getSection(url),
      pattern: getPattern(url),
      inbound: 0,
      outbound: 0,
      orphan: false,
      dead: false,
    })
  }

  const edges: GraphEdge[] = []

  for (const rec of records) {
    const sourceUrl = rec.finalUrl || rec.url
    const sourceNode = nodeMap.get(sourceUrl)
    if (!sourceNode) continue

    for (const link of rec.outboundLinks) {
      if (nodeMap.has(link)) {
        edges.push({ source: sourceUrl, target: link })
        sourceNode.outbound++
        nodeMap.get(link)!.inbound++
      }
    }
  }

  const normalizedRoot = (() => {
    try { return new URL(rootUrl).href } catch { return rootUrl }
  })()

  for (const node of nodeMap.values()) {
    node.orphan = node.inbound === 0 && node.url !== normalizedRoot
    node.dead = node.status >= 400 || node.status === 0
  }

  const nodes = Array.from(nodeMap.values())

  const sectionPageMap = new Map<string, Set<string>>()
  const sectionTemplateMap = new Map<string, Set<string>>()

  for (const node of nodes) {
    if (!sectionPageMap.has(node.section)) {
      sectionPageMap.set(node.section, new Set())
      sectionTemplateMap.set(node.section, new Set())
    }
    sectionPageMap.get(node.section)!.add(node.url)
    sectionTemplateMap.get(node.section)!.add(node.pattern)
  }

  const allTemplates = new Set(nodes.map((n) => n.pattern))
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0)
  const orphanCount = nodes.filter((n) => n.orphan).length
  const deadCount = nodes.filter((n) => n.dead).length

  const sectionBreakdown: SectionStat[] = Array.from(sectionPageMap.entries()).map(([section, pages]) => ({
    section,
    pageCount: pages.size,
    templateCount: sectionTemplateMap.get(section)!.size,
  }))

  const templatePageMap = new Map<string, { count: number; section: string }>()
  for (const node of nodes) {
    const entry = templatePageMap.get(node.pattern)
    if (entry) {
      entry.count++
    } else {
      templatePageMap.set(node.pattern, { count: 1, section: node.section })
    }
  }

  const templateBreakdown: TemplateStat[] = Array.from(templatePageMap.entries()).map(([pattern, { count, section }]) => ({
    pattern,
    pageCount: count,
    section,
  }))

  const stats: GraphStats = {
    totalPages: nodes.length,
    totalEdges: edges.length,
    totalSections: sectionPageMap.size,
    totalTemplates: allTemplates.size,
    orphanCount,
    deadCount,
    maxDepth,
    sectionBreakdown,
    templateBreakdown,
  }

  return { nodes, edges, stats }
}
