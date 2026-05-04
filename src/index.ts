#!/usr/bin/env bun
import { crawl } from "./crawler"
import { buildGraph } from "./graph-builder"
import { generateReport } from "./html-report"
import type { ScanOptions } from "./types"

function printUsage() {
  console.error("Usage: site-scan <domain> [--depth N] [--limit N] [--no-robots] [--keep-query] [--no-filter-nav] [--nav-threshold N]")
  console.error("")
  console.error("  domain              Domain to scan (e.g. example.com or https://example.com)")
  console.error("  --depth N           Max crawl depth (default: unlimited)")
  console.error("  --limit N           Max pages to crawl (default: 1000)")
  console.error("  --no-robots         Ignore robots.txt restrictions")
  console.error("  --keep-query        Treat URLs with different query strings as distinct")
  console.error("  --no-filter-nav     Include links from <header>, <footer>, and <nav> elements")
  console.error("  --nav-threshold N   Remove edges to nodes linked from >N% of pages (default: 50, 0=off)")
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

  if (args.length === 0 || (args[0] ?? "").startsWith("--")) {
    printUsage()
  }

  const domainArg = args[0] ?? ""
  let depth: number | null = null
  let limit = 1000
  let noRobots = false
  let keepQuery = false
  let noFilterNav = false
  let navThreshold = 50

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
    } else if (args[i] === "--nav-threshold" && args[i + 1]) {
      navThreshold = parseInt(args[++i] ?? "", 10)
      if (isNaN(navThreshold) || navThreshold < 0 || navThreshold > 100) {
        console.error("Error: --nav-threshold must be an integer between 0 and 100")
        process.exit(1)
      }
    } else {
      console.error(`Error: Unknown argument: ${args[i] ?? ""}`)

      printUsage()
    }
  }

  const startUrl = parseDomain(domainArg)
  const domain = new URL(startUrl).hostname

  return { domain, startUrl, depth, limit, noRobots, keepQuery, noFilterNav, navThreshold }
}

async function main() {
  const options = parseArgs()

  console.log(`Scanning ${options.startUrl}`)
  if (options.depth !== null) console.log(`  Max depth: ${options.depth}`)
  console.log(`  Max pages: ${options.limit}`)
  if (options.noRobots) console.log("  robots.txt: ignored")
  if (options.keepQuery) console.log("  Query strings: preserved")
  if (options.noFilterNav) console.log("  Nav filter: disabled")
  if (options.navThreshold > 0) console.log(`  Hub edge threshold: ${options.navThreshold}%`)
  else console.log("  Hub edge filter: disabled")
  console.log("")

  const records = await crawl(options)
  const graph = buildGraph(records, options.startUrl, options.navThreshold)
  await generateReport(graph, options)

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
