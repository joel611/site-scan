import { parse } from "node-html-parser"
import type { CrawlRecord, Graph, GraphEdge, GraphNode, GraphStats, LangStat, LangVariant, SectionStat, TemplateStat } from "./types"

const LANG_RE = /^[a-z]{2}(-[a-z]{2,4})?$/i
const LANG_OVERLAP_THRESHOLD = 0.30

export function detectLangPrefixes(records: CrawlRecord[]): { prefix: string; count: number }[] {
  // Pass 1: collect first-path-segments matching LANG_RE → Set<canonicalPath>
  const candidatePaths = new Map<string, Set<string>>()
  for (const rec of records) {
    try {
      const { pathname } = new URL(rec.finalUrl || rec.url)
      const parts = pathname.split("/").filter(Boolean)
      if (parts.length === 0) continue
      const first = parts[0]!
      if (!LANG_RE.test(first)) continue
      const canonical = "/" + parts.slice(1).join("/")
      const key = first.toLowerCase()
      const set = candidatePaths.get(key) ?? new Set()
      set.add(canonical)
      candidatePaths.set(key, set)
    } catch { /* skip malformed */ }
  }

  if (candidatePaths.size < 2) return []

  // Pass 2: discard candidates with insufficient path overlap against any other candidate
  const candidates = Array.from(candidatePaths.keys())
  const valid = new Set<string>()
  for (const a of candidates) {
    const aSet = candidatePaths.get(a)!
    for (const b of candidates) {
      if (a === b) continue
      const bSet = candidatePaths.get(b)!
      const overlap = [...aSet].filter(p => bSet.has(p)).length
      const minSize = Math.min(aSet.size, bSet.size)
      if (minSize > 0 && overlap / minSize >= LANG_OVERLAP_THRESHOLD) {
        valid.add(a)
        valid.add(b)
        break
      }
    }
  }

  return Array.from(valid).map(prefix => ({
    prefix,
    count: candidatePaths.get(prefix)!.size,
  })).sort((a, b) => b.count - a.count)
}

function stripLangPrefix(url: string, lang: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.split("/").filter(Boolean)
    if (parts[0]?.toLowerCase() === lang) {
      u.pathname = "/" + parts.slice(1).join("/")
    }
    return u.href
  } catch {
    return url
  }
}

export function mergeMultilingualRecords(records: CrawlRecord[], confirmedLangs: string[]): CrawlRecord[] {
  const langSet = new Set(confirmedLangs.map(l => l.toLowerCase()))

  // Bucket records: lang-prefixed vs plain
  const variantsByCanonical = new Map<string, Map<string, CrawlRecord>>()
  const plain: CrawlRecord[] = []

  for (const rec of records) {
    try {
      const url = rec.finalUrl || rec.url
      const { pathname } = new URL(url)
      const parts = pathname.split("/").filter(Boolean)
      const first = parts[0]?.toLowerCase() ?? ""
      if (langSet.has(first)) {
        const canonical = stripLangPrefix(url, first)
        const byLang = variantsByCanonical.get(canonical) ?? new Map()
        byLang.set(first, rec)
        variantsByCanonical.set(canonical, byLang)
      } else {
        plain.push(rec)
      }
    } catch {
      plain.push(rec)
    }
  }

  if (variantsByCanonical.size === 0) return records

  // Fold plain records whose URL matches a canonical into variantsByCanonical as "default" lang
  const canonicalSet = new Set(variantsByCanonical.keys())
  const remainingPlain: CrawlRecord[] = []
  for (const rec of plain) {
    const url = rec.finalUrl || rec.url
    if (canonicalSet.has(url)) {
      variantsByCanonical.get(url)!.set("default", rec)
    } else {
      remainingPlain.push(rec)
    }
  }

  // Build merged canonical records
  const merged: CrawlRecord[] = []

  for (const [canonical, byLang] of variantsByCanonical) {
    // Pick primary record (first confirmed lang with a variant, or first available)
    const primaryLang = confirmedLangs.find(l => byLang.has(l)) ?? [...byLang.keys()][0]!
    const primary = byLang.get(primaryLang)!

    const langVariants: Record<string, LangVariant> = {}
    for (const [lang, rec] of byLang) {
      langVariants[lang] = { url: rec.finalUrl || rec.url, title: rec.title }
    }

    const missingLangs = confirmedLangs.filter(l => l !== "default" && !byLang.has(l))

    // Merge outboundLinks: map each variant's links to canonical URLs, dedup, drop cross-lang self-refs
    const canonicalLinkSet = new Set<string>()
    for (const rec of byLang.values()) {
      for (const link of rec.outboundLinks) {
        try {
          const linkParts = new URL(link).pathname.split("/").filter(Boolean)
          const linkFirst = linkParts[0]?.toLowerCase() ?? ""
          const canonicalLink = langSet.has(linkFirst) ? stripLangPrefix(link, linkFirst) : link
          // drop self-referencing cross-lang edge
          if (canonicalLink === canonical) continue
          canonicalLinkSet.add(canonicalLink)
        } catch { /* skip */ }
      }
    }

    merged.push({
      url: canonical,
      finalUrl: canonical,
      title: primary.title,
      status: primary.status,
      depth: Math.min(...Array.from(byLang.values()).map(r => r.depth)),
      outboundLinks: Array.from(canonicalLinkSet),
      html: primary.html,
      langVariants,
      missingLangs,
    })
  }

  return [...remainingPlain, ...merged]
}

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

// ── Text extraction ─────────────────────────────────────────────────────────

export function extractPageText(html: string): string {
  if (!html) return ""
  const root = parse(html)
  for (const el of root.querySelectorAll("script, style, nav, header, footer")) {
    el.remove()
  }
  const content = root.querySelector("main") ?? root.querySelector("article") ?? root.querySelector("body")
  if (!content) return ""
  const text = content.innerText.replace(/\s+/g, " ").trim()
  // ~512 tokens (approx 4 chars/token, use word split as proxy)
  return text.split(" ").slice(0, 512).join(" ")
}

// ── Leiden (Louvain) community detection ────────────────────────────────────

export function runLeidenCommunityDetection(
  nodes: GraphNode[],
  edges: GraphEdge[],
  minCommunitySize = 3
): void {
  // Using louvain (deterministic with fixed rng) since no JS leiden package exists
  const { DirectedGraph } = require("graphology") as { DirectedGraph: new (opts?: any) => any }
  const louvain = require("graphology-communities-louvain") as (g: any, opts?: any) => Record<string, number>

  const g = new DirectedGraph()
  for (const node of nodes) g.addNode(node.id)
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target) && !g.hasEdge(edge.source, edge.target)) {
      try { g.addEdge(edge.source, edge.target) } catch { /* skip duplicate */ }
    }
  }

  const communities: Record<string, number> = louvain(g, { resolution: 1, randomWalk: false, rng: () => 0.42 })

  // Count sizes
  const counts = new Map<number, number>()
  for (const c of Object.values(communities)) {
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }

  // Sort by size descending; assign c0, c1, ... to communities >= minCommunitySize
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const communityMap = new Map<number, string>()
  let idx = 0
  for (const [intId, size] of sorted) {
    communityMap.set(intId, size >= minCommunitySize ? `c${idx++}` : "c-other")
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  for (const [nodeId, communityInt] of Object.entries(communities)) {
    const node = nodeMap.get(nodeId)
    if (node) node.community = communityMap.get(communityInt) ?? "c-other"
  }
}

// ── Embeddings ────────────────────────────────────────────────────────────

export async function computeEmbeddings(
  nodes: GraphNode[],
  htmlMap: Map<string, string>
): Promise<void> {
  try {
    const { pipeline } = await import("@xenova/transformers") as any
    console.log("\nLoading embedding model (first run downloads ~80MB, cached afterwards)...")
    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
    process.stdout.write("Computing embeddings")
    for (const node of nodes) {
      const html = htmlMap.get(node.id) ?? ""
      const text = extractPageText(html)
      if (!text) {
        node._embedding = null
        continue
      }
      const output = await extractor(text, { pooling: "mean", normalize: true })
      node._embedding = Array.from(output.data as Float32Array)
      process.stdout.write(".")
    }
    process.stdout.write("\n")
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`\nWarning: embedding computation failed (${msg}), subclusters will be null`)
    for (const node of nodes) node._embedding = null
  }
}

// ── HDBSCAN (DBSCAN-based) subclustering ─────────────────────────────────

function euclidean(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i]! - b[i]!) ** 2
  return Math.sqrt(sum)
}

function estimateEpsilon(points: number[][], k: number): number {
  const kDists: number[] = []
  for (let i = 0; i < points.length; i++) {
    const dists: number[] = []
    for (let j = 0; j < points.length; j++) {
      if (j !== i) dists.push(euclidean(points[i]!, points[j]!))
    }
    dists.sort((a, b) => a - b)
    kDists.push(dists[k - 1] ?? 0.5)
  }
  kDists.sort((a, b) => a - b)
  return kDists[Math.floor(kDists.length / 2)] ?? 0.5
}

// DBSCAN used as HDBSCAN approximation — produces noise points (-1) and cluster labels
function dbscan(points: number[][], eps: number, minPts: number): number[] {
  const n = points.length
  const labels = new Array<number>(n).fill(-1)
  const visited = new Array<boolean>(n).fill(false)
  let cluster = 0

  const rangeQuery = (i: number): number[] => {
    const result: number[] = []
    for (let j = 0; j < n; j++) {
      if (j !== i && euclidean(points[i]!, points[j]!) <= eps) result.push(j)
    }
    return result
  }

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue
    visited[i] = true
    const nbrs = rangeQuery(i)
    if (nbrs.length < minPts - 1) continue
    labels[i] = cluster
    const seed = [...nbrs]
    let k = 0
    while (k < seed.length) {
      const j = seed[k++]!
      if (!visited[j]) {
        visited[j] = true
        const nbrs2 = rangeQuery(j)
        if (nbrs2.length >= minPts - 1) {
          for (const nb of nbrs2) {
            if (!seed.includes(nb)) seed.push(nb)
          }
        }
      }
      if (labels[j] === -1) labels[j] = cluster
    }
    cluster++
  }
  return labels
}

export function runHdbscanSubclustering(
  nodesByCommunity: Map<string, GraphNode[]>
): void {
  for (const [community, communityNodes] of nodesByCommunity) {
    if (communityNodes.length < 5) {
      for (const n of communityNodes) n.subcluster = null
      continue
    }

    const withEmbedding = communityNodes.filter(n => n._embedding != null)
    if (withEmbedding.length < 5) {
      for (const n of communityNodes) n.subcluster = null
      continue
    }

    const minClusterSize = Math.max(3, Math.floor(communityNodes.length * 0.1))
    const points = withEmbedding.map(n => n._embedding!)
    const eps = estimateEpsilon(points, minClusterSize)
    const labels = dbscan(points, eps, minClusterSize)

    for (let i = 0; i < withEmbedding.length; i++) {
      const label = labels[i]!
      withEmbedding[i]!.subcluster = label === -1 ? null : `${community}-s${label}`
    }
    for (const n of communityNodes) {
      if (n._embedding == null) n.subcluster = null
    }
  }
}

// ── Nav anchor extraction ────────────────────────────────────────────────────

export function extractNavAnchors(
  html: string,
  baseUrl: string,
  knownUrls: Set<string>
): Map<string, "nav" | "footer"> {
  if (!html) return new Map()
  const root = parse(html)
  const result = new Map<string, "nav" | "footer">()
  const base = new URL(baseUrl)

  const normalizeHref = (href: string): string | null => {
    try {
      const u = new URL(href, baseUrl)
      if (u.hostname !== base.hostname) return null
      u.hash = ""
      u.search = ""
      const path = u.pathname
      if (path.length > 1 && path.endsWith("/")) u.pathname = path.slice(0, -1)
      return u.href
    } catch {
      return null
    }
  }

  // Footer first (lower priority); nav overwrites
  for (const a of root.querySelectorAll("footer a[href]")) {
    const href = a.getAttribute("href") || ""
    const url = normalizeHref(href)
    if (url && knownUrls.has(url)) result.set(url, "footer")
  }

  // Nav/header second (higher priority; overwrites footer)
  for (const a of root.querySelectorAll("header a[href], nav a[href]")) {
    const href = a.getAttribute("href") || ""
    const url = normalizeHref(href)
    if (url && knownUrls.has(url)) result.set(url, "nav")
  }

  return result
}

// ── navSection BFS assignment ────────────────────────────────────────────────

export function assignNavSections(nodes: GraphNode[], edges: GraphEdge[], rootUrl?: string): void {
  const navAnchors = nodes.filter(n => n.navSource !== null)
  if (navAnchors.length === 0) return

  // Self-assign anchors
  for (const anchor of navAnchors) {
    anchor.navSection = anchor.url
  }

  // Build outbound adjacency
  const outbound = new Map<string, string[]>()
  for (const node of nodes) outbound.set(node.id, [])
  for (const edge of edges) {
    outbound.get(edge.source)?.push(edge.target)
  }

  // BFS: nav anchors first, then footer; root last so listing pages win over home's direct post links
  const navAnchorsNav = navAnchors.filter(n => n.navSource === "nav")
  const navNonRoot = navAnchorsNav.filter(n => n.id !== rootUrl)
  const navRoot = navAnchorsNav.filter(n => n.id === rootUrl)
  const footerQueue = navAnchors.filter(n => n.navSource === "footer")
  const queue: Array<{ id: string; anchorUrl: string }> = [
    ...navNonRoot.map(n => ({ id: n.id, anchorUrl: n.url })),
    ...footerQueue.map(n => ({ id: n.id, anchorUrl: n.url })),
    ...navRoot.map(n => ({ id: n.id, anchorUrl: n.url })),
  ]

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const visited = new Set<string>(navAnchors.map(n => n.id))

  let head = 0
  while (head < queue.length) {
    const item = queue[head++]!
    for (const targetId of outbound.get(item.id) ?? []) {
      if (visited.has(targetId)) continue
      visited.add(targetId)
      const target = nodeMap.get(targetId)
      if (target) {
        target.navSection = item.anchorUrl
        queue.push({ id: targetId, anchorUrl: item.anchorUrl })
      }
    }
  }
}

// ── Graph builder ────────────────────────────────────────────────────────────

export async function buildGraph(
  records: CrawlRecord[],
  startUrl: string,
  navThreshold = 50,
  noEmbeddings = false
): Promise<Graph> {
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
      community: "c0",
      subcluster: null,
      navSource: null,
      navSection: null,
      langVariants: rec.langVariants,
      missingLangs: rec.missingLangs,
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

  // ── Nav anchor detection from homepage ──
  const homepageRec = records.find(r => r.depth === 0)
  if (homepageRec?.html) {
    const knownUrls = new Set(nodeMap.keys())
    const navAnchors = extractNavAnchors(homepageRec.html, homepageRec.finalUrl || homepageRec.url, knownUrls)
    for (const [url, source] of navAnchors) {
      const node = nodeMap.get(url)
      if (node) node.navSource = source
    }
  }

  const nodes = Array.from(nodeMap.values())
  assignNavSections(nodes, edges, normalizedRoot)

  // ── Post-processing: community detection + semantic subclustering ──

  runLeidenCommunityDetection(nodes, edges)

  if (noEmbeddings) {
    for (const node of nodes) node.subcluster = null
  } else {
    const htmlMap = new Map(records.map(r => [r.finalUrl || r.url, r.html ?? ""]))
    await computeEmbeddings(nodes, htmlMap)

    const nodesByCommunity = new Map<string, GraphNode[]>()
    for (const node of nodes) {
      const list = nodesByCommunity.get(node.community) ?? []
      list.push(node)
      nodesByCommunity.set(node.community, list)
    }
    runHdbscanSubclustering(nodesByCommunity)
  }

  // Strip internal embedding field before serialization
  for (const node of nodes) {
    delete node._embedding
  }

  // ── Stats ───────────────────────────────────────────────────────────────

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
