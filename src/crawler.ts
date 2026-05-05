import { parse } from "node-html-parser"
import type { CrawlRecord, ScanOptions } from "./types"

const ASSET_EXTENSIONS = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf|zip|gz|tar|mp4|mp3|avi|mov|webp|avif)$/i

interface RobotsRule {
  disallow: RegExp[]
}

async function fetchRobots(baseUrl: string): Promise<RobotsRule> {
  try {
    const robotsUrl = new URL("/robots.txt", baseUrl).href
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return { disallow: [] }
    const text = await res.text()
    return parseRobots(text)
  } catch {
    console.warn("Warning: could not fetch robots.txt, proceeding without restrictions")
    return { disallow: [] }
  }
}

function parseRobots(text: string): RobotsRule {
  try {
    const lines = text.split("\n").map((l) => l.trim())
    const disallowPatterns: RegExp[] = []
    let inStarBlock = false

    for (const line of lines) {
      if (line.toLowerCase().startsWith("user-agent:")) {
        inStarBlock = (line.split(":")[1] ?? "").trim() === "*"
      } else if (inStarBlock && line.toLowerCase().startsWith("disallow:")) {
        const path = (line.split(":")[1] ?? "").trim()
        if (path) {
          const escaped = path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")
          disallowPatterns.push(new RegExp(`^${escaped}`))
        }
      }
    }

    return { disallow: disallowPatterns }
  } catch {
    console.warn("Warning: failed to parse robots.txt, proceeding without restrictions")
    return { disallow: [] }
  }
}

function isDisallowed(pathname: string, rules: RobotsRule): boolean {
  return rules.disallow.some((re) => re.test(pathname))
}

function normalizeUrl(href: string, base: string, keepQuery: boolean): string | null {
  try {
    const url = new URL(href, base)
    url.hostname = url.hostname.toLowerCase()
    url.hash = ""
    if (!keepQuery) url.search = ""
    // strip trailing slash except for root
    let path = url.pathname
    if (path.length > 1 && path.endsWith("/")) {
      url.pathname = path.slice(0, -1)
    }
    return url.href
  } catch {
    return null
  }
}

export function extractLinks(html: string, pageUrl: string, keepQuery: boolean, noFilterNav = false): string[] {
  const root = parse(html)
  const links: string[] = []

  const selector = noFilterNav ? "a[href]" : "a[href]:not(header a, footer a, nav a)"
  for (const a of root.querySelectorAll(selector)) {
    const href = a.getAttribute("href") || ""
    if (!href) continue
    if (href.startsWith("#")) continue
    if (href.startsWith("mailto:")) continue
    if (href.startsWith("tel:")) continue
    if (ASSET_EXTENSIONS.test(href.split("?")[0] ?? href)) continue

    const normalized = normalizeUrl(href, pageUrl, keepQuery)
    if (normalized) links.push(normalized)
  }

  return links
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? (match[1] ?? "").trim() : ""
}

interface FetchResult {
  finalUrl: string
  status: number
  html: string
}

async function fetchPage(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    })
    const finalUrl = res.url
    const status = res.status
    const html = res.ok ? await res.text() : ""
    return { finalUrl, status, html }
  } catch (err: any) {
    return { finalUrl: url, status: 0, html: "" }
  }
}

async function runPool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const i = index++
      results[i] = await tasks[i]!()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

export async function crawl(options: ScanOptions): Promise<CrawlRecord[]> {
  const { startUrl, depth, limit, noRobots, keepQuery, noFilterNav } = options
  const baseHostname = new URL(startUrl).hostname

  const robots = noRobots ? { disallow: [] } : await fetchRobots(startUrl)

  const visited = new Set<string>()
  const records: CrawlRecord[] = []

  interface QueueItem { url: string; depth: number }
  let queue: QueueItem[] = [{ url: startUrl, depth: 0 }]
  visited.add(startUrl)

  let limitReached = false

  process.stdout.write(`Crawling... 0 pages found, 1 queued`)

  while (queue.length > 0 && !limitReached) {
    const batch = queue.splice(0, 5)
    const nextQueue: QueueItem[] = []

    const tasks = batch.map((item) => async () => {
      const { url: pageUrl, depth: pageDepth } = item

      if (isDisallowed(new URL(pageUrl).pathname, robots)) {
        return
      }

      const { finalUrl, status, html } = await fetchPage(pageUrl)

      const normalizedFinal = normalizeUrl(finalUrl, finalUrl, keepQuery) || finalUrl
      if (normalizedFinal !== pageUrl && visited.has(normalizedFinal)) return
      if (normalizedFinal !== pageUrl) visited.add(normalizedFinal)

      const title = extractTitle(html)
      const allLinks = html ? extractLinks(html, finalUrl, keepQuery, true) : []
      const edgeLinks = new Set(html ? extractLinks(html, finalUrl, keepQuery, noFilterNav) : [])

      const outboundLinks: string[] = []
      const toEnqueue: QueueItem[] = []

      for (const link of allLinks) {
        try {
          const linkUrl = new URL(link)
          if (linkUrl.hostname !== baseHostname) continue
          if (edgeLinks.has(link)) outboundLinks.push(link)
          if (!visited.has(link)) {
            const nextDepth = pageDepth + 1
            if (depth === null || nextDepth <= depth) {
              visited.add(link)
              toEnqueue.push({ url: link, depth: nextDepth })
            }
          }
        } catch { /* skip malformed */ }
      }

      records.push({ url: pageUrl, finalUrl: normalizedFinal, title, status, depth: pageDepth, outboundLinks, html })

      process.stdout.write(`\rCrawling... ${records.length} pages found, ${queue.length + nextQueue.length} queued`)

      if (records.length >= limit) {
        limitReached = true
        return
      }

      nextQueue.push(...toEnqueue)
    })

    await runPool(tasks, 5)

    if (!limitReached) {
      queue.push(...nextQueue)
    }
  }

  if (limitReached) {
    process.stdout.write("\n")
    console.warn(`Warning: Limit of ${limit} pages reached. Use --limit to increase.`)
  } else {
    process.stdout.write("\n")
  }

  return records
}
