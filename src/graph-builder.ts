import type { CrawlRecord, Graph, GraphEdge, GraphNode, GraphStats, LangStat, SectionStat, TemplateStat } from "./types"

const LANG_RE = /^[a-z]{2}(-[a-z]{2,4})?$/i

export function extractBaseSection(url: string): { lang: string; section: string } {
  try {
    const { pathname } = new URL(url)
    const parts = pathname.split("/").filter(Boolean)
    if (parts.length === 0) return { lang: "default", section: "/" }
    const first = parts[0]!
    if (LANG_RE.test(first)) {
      return { lang: first.toLowerCase(), section: parts.length > 1 ? parts[1]! : "/" }
    }
    return { lang: "default", section: first }
  } catch {
    return { lang: "default", section: "/" }
  }
}

export function getPattern(url: string): string {
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

export function inferSectionFromInbound(
  nodes: GraphNode[],
  edges: GraphEdge[],
  rootUrl: string
): Map<string, string> {
  const result = new Map<string, string>()
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  const inboundByTarget = new Map<string, GraphEdge[]>()
  for (const edge of edges) {
    const list = inboundByTarget.get(edge.target) ?? []
    list.push(edge)
    inboundByTarget.set(edge.target, list)
  }

  for (const [targetUrl, inboundEdges] of inboundByTarget) {
    const voters: string[] = []
    for (const edge of inboundEdges) {
      if (edge.source === rootUrl) continue
      const sourceNode = nodeMap.get(edge.source)
      if (!sourceNode) continue
      voters.push(sourceNode.section)
    }

    const counts = new Map<string, number>()
    for (const section of voters) {
      counts.set(section, (counts.get(section) ?? 0) + 1)
    }

    for (const [section, count] of counts) {
      if (count / voters.length > 0.5) {
        result.set(targetUrl, section)
        break
      }
    }
  }

  return result
}

export function filterHighIndegreeEdges(graph: Graph, navThreshold: number): Graph {
  if (navThreshold === 0) return graph

  const { nodes, edges, stats } = graph
  const totalPages = nodes.length
  const thresholdCount = (navThreshold / 100) * totalPages

  const rawInDegree = new Map<string, number>()
  for (const edge of edges) {
    rawInDegree.set(edge.target, (rawInDegree.get(edge.target) ?? 0) + 1)
  }

  const filteredEdges = edges.filter(e => (rawInDegree.get(e.target) ?? 0) <= thresholdCount)

  const nodeMap = new Map(nodes.map(n => [n.id, { ...n, inbound: 0, outbound: 0 }]))
  for (const edge of filteredEdges) {
    nodeMap.get(edge.source)!.outbound++
    nodeMap.get(edge.target)!.inbound++
  }

  const rootUrl = nodes.find(n => n.depth === 0)?.url ?? ""
  const newNodes = Array.from(nodeMap.values()).map(node => ({
    ...node,
    orphan: node.inbound === 0 && node.url !== rootUrl,
  }))

  const newStats = {
    ...stats,
    totalEdges: filteredEdges.length,
    orphanCount: newNodes.filter(n => n.orphan).length,
  }

  return { nodes: newNodes, edges: filteredEdges, stats: newStats }
}

export function buildGraph(records: CrawlRecord[], startUrl: string, navThreshold = 50): Graph {
  const rootUrl = (() => {
    try { return new URL(startUrl).href } catch { return startUrl }
  })()

  const nodeMap = new Map<string, GraphNode>()

  for (const rec of records) {
    const url = rec.finalUrl || rec.url
    const { lang, section } = extractBaseSection(url)
    nodeMap.set(url, {
      id: url,
      url,
      title: rec.title,
      status: rec.status,
      depth: rec.depth,
      section,
      lang,
      pattern: getPattern(url),
      inbound: 0,
      outbound: 0,
      orphan: false,
      dead: false,
    })
  }

  const edges: GraphEdge[] = []
  const seenEdges = new Set<string>()

  for (const rec of records) {
    const sourceUrl = rec.finalUrl || rec.url
    const sourceNode = nodeMap.get(sourceUrl)
    if (!sourceNode) continue

    for (const link of rec.outboundLinks) {
      if (nodeMap.has(link)) {
        const key = sourceUrl + '->' + link
        if (seenEdges.has(key)) continue
        seenEdges.add(key)
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

  const inferredSections = inferSectionFromInbound(Array.from(nodeMap.values()), edges, normalizedRoot)
  for (const [url, section] of inferredSections) {
    nodeMap.get(url)!.section = section
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

  const langPageMap = new Map<string, number>()
  for (const node of nodes) {
    langPageMap.set(node.lang, (langPageMap.get(node.lang) ?? 0) + 1)
  }
  const langBreakdown: LangStat[] = Array.from(langPageMap.entries())
    .map(([lang, pageCount]) => ({ lang, pageCount }))
    .sort((a, b) => b.pageCount - a.pageCount)
  const distinctNonDefaultLangs = new Set(nodes.map(n => n.lang).filter(l => l !== "default"))
  const isMultilingual = distinctNonDefaultLangs.size > 1

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
    langBreakdown,
    isMultilingual,
  }

  return filterHighIndegreeEdges({ nodes, edges, stats }, navThreshold)
}
