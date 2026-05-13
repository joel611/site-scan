#!/usr/bin/env bun
import { createInterface } from "readline"
import { crawl } from "./crawler"
import { DEFAULT_EXCLUDE_PATTERNS } from "./exclude-patterns"
import { buildGraph, detectLangPrefixes, mergeMultilingualRecords } from "./graph-builder"
import { generateReport } from "./html-report"
import type { CrawlRecord, ScanOptions } from "./types"

const LANG_CODE_RE = /^[a-z]{2}(-[a-z]{2,4})?$/i

async function confirmLangPrefixes(
  candidates: { prefix: string; count: number }[],
  defaultCount: number,
  flagValue: string[] | undefined,
  isTTY: boolean
): Promise<string[] | null> {
  if (candidates.length === 0) return null

  const detected = candidates.map(c => c.prefix)

  if (!isTTY) {
    if (flagValue) {
      const flagSet = new Set(flagValue)
      const detectedSet = new Set(detected)
      const match = flagValue.every(l => detectedSet.has(l)) && detected.every(l => flagSet.has(l))
      if (match) {
        console.log(`  Lang prefix confirmed: ${flagValue.join(", ")}`)
        return flagValue
      }
    }
    console.warn("  Warning: non-TTY environment and no matching --lang-prefix flag. Skipping multilingual merge.")
    return null
  }

  const detectedSet = new Set(detected)

  const printCandidates = () => {
    if (defaultCount > 0) console.log(`    /       ${defaultCount} pages  (default)`)
    for (const c of candidates) console.log(`    /${c.prefix}   ${c.count} pages`)
  }

  if (flagValue) {
    const flagSet = new Set(flagValue)
    const match = flagValue.every(l => detectedSet.has(l)) && detected.every(l => flagSet.has(l))
    if (match) {
      console.log(`  Lang prefix confirmed: ${flagValue.join(", ")}`)
      return flagValue
    }
    console.log(`\n  Detected lang prefixes:`)
    printCandidates()
    console.log(`  You provided: ${flagValue.join(", ")}`)
  } else {
    console.log("\n  Detected multilingual site:")
    printCandidates()
  }

  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question("  Use these as language prefixes? [Y/n/custom]: ", answer => {
      rl.close()
      const trimmed = answer.trim()
      if (!trimmed || trimmed.toLowerCase() === "y") {
        resolve(flagValue ?? detected)
      } else if (trimmed.toLowerCase() === "n") {
        resolve(null)
      } else {
        const custom = trimmed.split(",").map(s => s.trim()).filter(Boolean)
        resolve(custom.length > 0 ? custom : null)
      }
    })
  })
}

function printUsage() {
  console.error("Usage: site-scan <domain> [--depth N] [--limit N] [--no-robots] [--keep-query] [--no-filter-nav] [--nav-threshold N] [--no-embeddings] [--lang-prefix CODES] [--exclude GLOB] [--json]")
  console.error("       site-scan --from-json <file.json> [--nav-threshold N] [--no-embeddings] [--lang-prefix CODES] [--no-filter-nav]")
  console.error("")
  console.error("  domain              Domain to scan (e.g. example.com or https://example.com)")
  console.error("  --depth N           Max crawl depth (default: unlimited)")
  console.error("  --limit N           Max pages to crawl (default: 1000)")
  console.error("  --no-robots         Ignore robots.txt restrictions")
  console.error("  --keep-query        Treat URLs with different query strings as distinct")
  console.error("  --no-filter-nav     Include links from <header>, <footer>, and <nav> elements")
  console.error("  --nav-threshold N   Remove edges to nodes linked from >N% of pages (default: 50, 0=off)")
  console.error("  --no-embeddings     Skip page embedding computation (subclusters will be null)")
  console.error("  --lang-prefix CODES Comma-separated BCP-47 lang codes to use as path prefixes (e.g. en,fr,es)")
  console.error("  --exclude GLOB      Skip URLs matching glob pattern; repeatable (e.g. /api/**)")
  console.error("  --json              Dump raw crawl records to <domain>-crawl.json (skips graph/report; use --from-json to reprocess)")
  console.error("  --from-json FILE    Re-run full pipeline from a crawl dump; accepts --nav-threshold, --no-embeddings, --lang-prefix, --no-filter-nav")
  process.exit(1)
}

function parseDomain(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const url = new URL(raw)
    return `https://${url.hostname}/`
  }
  return `https://${raw}/`
}

function parseArgs(): ScanOptions {
  const args = process.argv.slice(2)

  if (args.length === 0) printUsage()

  // --from-json mode: no domain required
  const fromJsonIdx = args.indexOf("--from-json")
  if (fromJsonIdx !== -1) {
    const file = args[fromJsonIdx + 1]
    if (!file || file.startsWith("--")) {
      console.error("Error: --from-json requires a file path")
      process.exit(1)
    }

    let navThreshold = 50
    let noEmbeddings = false
    let noFilterNav = false
    let langPrefixes: string[] | undefined

    const remaining = args.filter((_, i) => i !== fromJsonIdx && i !== fromJsonIdx + 1)
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i] === "--nav-threshold" && remaining[i + 1]) {
        navThreshold = parseInt(remaining[++i] ?? "", 10)
        if (isNaN(navThreshold) || navThreshold < 0 || navThreshold > 100) {
          console.error("Error: --nav-threshold must be an integer between 0 and 100")
          process.exit(1)
        }
      } else if (remaining[i] === "--no-embeddings") {
        noEmbeddings = true
      } else if (remaining[i] === "--no-filter-nav") {
        noFilterNav = true
      } else if (remaining[i] === "--lang-prefix" && remaining[i + 1]) {
        const codes = (remaining[++i] ?? "").split(",").map(s => s.trim()).filter(Boolean)
        for (const code of codes) {
          if (!LANG_CODE_RE.test(code)) {
            console.error(`Error: invalid lang code "${code}" in --lang-prefix (expected BCP-47, e.g. en, fr, zh-tw)`)
            process.exit(1)
          }
        }
        langPrefixes = codes
      } else {
        console.error(`Error: Unknown argument: ${remaining[i] ?? ""}`)
        printUsage()
      }
    }

    return {
      domain: "", startUrl: "", depth: null, limit: 1000,
      noRobots: false, keepQuery: false, noFilterNav,
      navThreshold, noEmbeddings, json: false,
      fromJson: file, langPrefixes,
    }
  }

  if ((args[0] ?? "").startsWith("--")) printUsage()

  const domainArg = args[0] ?? ""
  let depth: number | null = null
  let limit = 1000
  let noRobots = false
  let keepQuery = false
  let noFilterNav = false
  let navThreshold = 50
  let noEmbeddings = false
  let json = false
  let langPrefixes: string[] | undefined
  const userExcludePatterns: string[] = []

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--depth" && args[i + 1]) {
      depth = parseInt(args[++i] ?? "", 10)
      if (isNaN(depth) || depth < 0) {
        console.error("Error: --depth must be a non-negative integer")
        process.exit(1)
      }
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[++i] ?? "", 10)
      if (isNaN(limit) || limit < 1) {
        console.error("Error: --limit must be a positive integer")
        process.exit(1)
      }
    } else if (args[i] === "--no-robots") {
      noRobots = true
    } else if (args[i] === "--keep-query") {
      keepQuery = true
    } else if (args[i] === "--no-filter-nav") {
      noFilterNav = true
    } else if (args[i] === "--no-embeddings") {
      noEmbeddings = true
    } else if (args[i] === "--lang-prefix" && args[i + 1]) {
      const codes = (args[++i] ?? "").split(",").map(s => s.trim()).filter(Boolean)
      for (const code of codes) {
        if (!LANG_CODE_RE.test(code)) {
          console.error(`Error: invalid lang code "${code}" in --lang-prefix (expected BCP-47, e.g. en, fr, zh-tw)`)
          process.exit(1)
        }
      }
      langPrefixes = codes
    } else if (args[i] === "--nav-threshold" && args[i + 1]) {
      navThreshold = parseInt(args[++i] ?? "", 10)
      if (isNaN(navThreshold) || navThreshold < 0 || navThreshold > 100) {
        console.error("Error: --nav-threshold must be an integer between 0 and 100")
        process.exit(1)
      }
    } else if (args[i] === "--exclude" && args[i + 1]) {
      userExcludePatterns.push(args[++i] ?? "")
    } else if (args[i] === "--json") {
      json = true
    } else {
      console.error(`Error: Unknown argument: ${args[i] ?? ""}`)
      printUsage()
    }
  }

  const startUrl = parseDomain(domainArg)
  const domain = new URL(startUrl).hostname
  const excludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...userExcludePatterns]

  return { domain, startUrl, depth, limit, noRobots, keepQuery, noFilterNav, navThreshold, noEmbeddings, json, langPrefixes, excludePatterns }
}

async function main() {
  const options = parseArgs()

  if (options.fromJson) {
    const raw: unknown = JSON.parse(await Bun.file(options.fromJson).text())

    if (!Array.isArray(raw)) {
      console.error("Error: --from-json expects a CrawlRecord[] array (output of --json). File is not an array.")
      if (typeof raw === "object" && raw !== null && "nodes" in raw) {
        console.error("       (Looks like an old Graph-format file. Re-crawl with --json to produce a crawl dump.)")
      }
      process.exit(1)
    }
    if (raw.length > 0) {
      const first = raw[0]
      if (!first || typeof first !== "object" || !("url" in first) || !("outboundLinks" in first)) {
        console.error("Error: --from-json expects a CrawlRecord[] array (each item needs url and outboundLinks). Invalid file shape.")
        process.exit(1)
      }
    }

    const rawRecords = raw as CrawlRecord[]
    const root = rawRecords.find(r => r.depth === 0)
    const domain = root
      ? new URL(root.finalUrl || root.url).hostname
      : options.fromJson.replace(/-crawl\.json$/, "").replace(/-/g, ".")
    const startUrl = root ? `https://${domain}/` : ""

    console.log(`Processing crawl dump: ${options.fromJson}`)
    console.log(`  Pages: ${rawRecords.length}`)
    if (options.navThreshold > 0) console.log(`  Hub edge threshold: ${options.navThreshold}%`)
    else console.log("  Hub edge filter: disabled")
    if (options.noEmbeddings) console.log("  Embeddings: disabled (--no-embeddings)")
    if (options.langPrefixes) console.log(`  Lang prefixes: ${options.langPrefixes.join(", ")}`)
    console.log("")

    const candidates = detectLangPrefixes(rawRecords)
    const detectedPrefixSet = new Set(candidates.map(c => c.prefix))
    const defaultCount = rawRecords.filter(r => {
      try {
        const parts = new URL(r.finalUrl || r.url).pathname.split("/").filter(Boolean)
        return parts.length === 0 || !detectedPrefixSet.has(parts[0]!.toLowerCase())
      } catch { return true }
    }).length
    const confirmedLangs = await confirmLangPrefixes(candidates, defaultCount, options.langPrefixes, process.stdin.isTTY ?? false)
    const records = confirmedLangs ? mergeMultilingualRecords(rawRecords, confirmedLangs) : rawRecords

    const graph = await buildGraph(records, startUrl, options.navThreshold, options.noEmbeddings)
    await generateReport(graph, domain)

    const outputFile = `${domain.replace(/\./g, "-")}-scan.html`
    const { stats } = graph
    console.log("")
    console.log("Report generated!")
    console.log(`  Pages processed:  ${stats.totalPages}`)
    console.log(`  Unique templates: ${stats.totalTemplates}`)
    console.log(`  Orphan pages:     ${stats.orphanCount}`)
    console.log(`  Dead links:       ${stats.deadCount}`)
    console.log(`  Output:           ./${outputFile}`)
    return
  }

  const log = options.json ? console.error : console.log

  log(`Scanning ${options.startUrl}`)
  if (options.depth !== null) log(`  Max depth: ${options.depth}`)
  log(`  Max pages: ${options.limit}`)
  if (options.noRobots) log("  robots.txt: ignored")
  if (options.keepQuery) log("  Query strings: preserved")
  if (options.noFilterNav) log("  Nav filter: disabled")
  if (options.navThreshold > 0) log(`  Hub edge threshold: ${options.navThreshold}%`)
  else log("  Hub edge filter: disabled")
  if (options.noEmbeddings) log("  Embeddings: disabled (--no-embeddings)")
  if (options.langPrefixes) log(`  Lang prefixes: ${options.langPrefixes.join(", ")}`)
  const userPatterns = (options.excludePatterns ?? []).filter(p => !DEFAULT_EXCLUDE_PATTERNS.includes(p))
  if (userPatterns.length > 0) log(`  Exclude patterns: ${userPatterns.join(", ")}`)
  log("")

  const rawRecords = await crawl(options)

  if (options.json) {
    const outputFile = `${options.domain.replace(/\./g, "-")}-crawl.json`
    await Bun.write(outputFile, JSON.stringify(rawRecords))
    console.error(`\nSaved: ./${outputFile}`)
    return
  }

  const candidates = detectLangPrefixes(rawRecords)
  const detectedPrefixSet = new Set(candidates.map(c => c.prefix))
  const defaultCount = rawRecords.filter(r => {
    try {
      const parts = new URL(r.finalUrl || r.url).pathname.split("/").filter(Boolean)
      return parts.length === 0 || !detectedPrefixSet.has(parts[0]!.toLowerCase())
    } catch { return true }
  }).length
  const confirmedLangs = await confirmLangPrefixes(candidates, defaultCount, options.langPrefixes, process.stdin.isTTY ?? false)
  const records = confirmedLangs ? mergeMultilingualRecords(rawRecords, confirmedLangs) : rawRecords

  const graph = await buildGraph(records, options.startUrl, options.navThreshold, options.noEmbeddings)

  await generateReport(graph, options.domain)

  const outputFile = `${options.domain.replace(/\./g, "-")}-scan.html`
  const { stats } = graph
  console.log("")
  console.log("Scan complete!")
  console.log(`  Pages crawled:    ${stats.totalPages}`)
  console.log(`  Unique templates: ${stats.totalTemplates}`)
  console.log(`  Orphan pages:     ${stats.orphanCount}`)
  console.log(`  Dead links:       ${stats.deadCount}`)
  console.log(`  Output:           ./${outputFile}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
