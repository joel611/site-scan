#!/usr/bin/env bun
import { crawl } from "./crawler"
import { buildGraph } from "./graph-builder"
import { generateReport } from "./html-report"
import type { ScanOptions } from "./types"

function printUsage() {
  console.error("Usage: site-scan <domain> [--depth N] [--limit N] [--no-robots] [--keep-query]")
  console.error("")
  console.error("  domain        Domain to scan (e.g. example.com or https://example.com)")
  console.error("  --depth N     Max crawl depth (default: unlimited)")
  console.error("  --limit N     Max pages to crawl (default: 1000)")
  console.error("  --no-robots   Ignore robots.txt restrictions")
  console.error("  --keep-query  Treat URLs with different query strings as distinct")
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
    } else {
      console.error(`Error: Unknown argument: ${args[i] ?? ""}`)

      printUsage()
    }
  }

  const startUrl = parseDomain(domainArg)
  const domain = new URL(startUrl).hostname

  return { domain, startUrl, depth, limit, noRobots, keepQuery }
}

async function main() {
  const options = parseArgs()

  console.log(`Scanning ${options.startUrl}`)
  if (options.depth !== null) console.log(`  Max depth: ${options.depth}`)
  console.log(`  Max pages: ${options.limit}`)
  if (options.noRobots) console.log("  robots.txt: ignored")
  if (options.keepQuery) console.log("  Query strings: preserved")
  console.log("")

  const records = await crawl(options)
  const graph = buildGraph(records, options.startUrl)
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
