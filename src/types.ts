export interface ScanOptions {
  domain: string
  startUrl: string
  depth: number | null
  limit: number
  noRobots: boolean
  keepQuery: boolean
  noFilterNav: boolean
  navThreshold: number
}

export interface CrawlRecord {
  url: string
  finalUrl: string
  title: string
  status: number
  depth: number
  outboundLinks: string[]
}

export interface GraphNode {
  id: string
  url: string
  title: string
  status: number
  depth: number
  section: string
  lang: string
  pattern: string
  inbound: number
  outbound: number
  orphan: boolean
  dead: boolean
}

export interface GraphEdge {
  source: string
  target: string
}

export interface GraphStats {
  totalPages: number
  totalEdges: number
  totalSections: number
  totalTemplates: number
  orphanCount: number
  deadCount: number
  maxDepth: number
  sectionBreakdown: SectionStat[]
  templateBreakdown: TemplateStat[]
  langBreakdown: LangStat[]
  isMultilingual: boolean
}

export interface LangStat {
  lang: string
  pageCount: number
}

export interface SectionStat {
  section: string
  pageCount: number
  templateCount: number
}

export interface TemplateStat {
  pattern: string
  pageCount: number
  section: string
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: GraphStats
}
