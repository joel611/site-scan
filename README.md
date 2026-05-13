# site-scan-map

> Crawl any website and visualize its structure as an interactive solar system.

![Screenshot](./screenshot.png)

`site-scan` crawls a domain, maps every internal link into a graph, auto-clusters pages by content similarity, and renders a self-contained interactive HTML report. Pages become planets — their position and size shaped by how they connect to the rest of the site.

## Install

Requires [Bun](https://bun.sh).

```bash
bunx site-scan-map <domain>
# or
npx site-scan-map <domain>
```

Or install globally:

```bash
bun install -g site-scan-map
site-scan <domain>
```

## Usage

```
site-scan <domain> [options]
site-scan --from-json <file.json>
```

### Examples

```bash
# Basic scan
site-scan example.com

# Limit crawl scope
site-scan example.com --depth 3 --limit 500

# Skip API and admin routes
site-scan example.com --exclude '/api/**' --exclude '/admin/**'

# Multilingual site
site-scan example.com --lang-prefix en,fr,de

# Export raw data, generate report later
site-scan example.com --json
site-scan --from-json example-com-scan.json
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--depth N` | unlimited | Max crawl depth |
| `--limit N` | 1000 | Max pages to crawl |
| `--no-robots` | — | Ignore `robots.txt` |
| `--keep-query` | — | Treat URLs with different query strings as distinct pages |
| `--no-filter-nav` | — | Include links from `<header>`, `<footer>`, and `<nav>` elements |
| `--nav-threshold N` | 50 | Remove edges to nodes linked from >N% of pages (0 = off) |
| `--no-embeddings` | — | Skip page embedding computation (disables subcluster detection) |
| `--lang-prefix CODES` | auto-detect | BCP-47 language codes for multilingual path prefixes (e.g. `en,fr,es`) |
| `--exclude GLOB` | — | Skip URLs matching glob pattern; repeatable |
| `--json` | — | Save graph as `<domain>-scan.json` instead of generating an HTML report |
| `--from-json FILE` | — | Generate an HTML report from a previously saved JSON file |

## Output

Produces a self-contained `<domain>-scan.html` in your working directory — no server needed, open in any browser.

The report has three views:

- **Graph** — interactive Sigma.js solar system with filters, hover tooltips, and a node detail panel
- **Stats** — page counts, section breakdown, URL template patterns, language distribution
- **Links** — sortable table of all crawled pages with status, depth, and inbound/outbound link counts

## Solar System Metaphor

Pages are assigned roles based on their position in the link graph:

| Role | Pages | Assigned when |
|------|-------|---------------|
| ☀️ **Sun** | Homepage | Depth 0 (start URL) |
| 🪐 **Planet** | Section roots | Shallowest node in its content cluster |
| 🌕 **Moon** | Regular pages | All other clustered pages |
| ☄️ **Asteroid** | Problem pages | Orphan (no inbound links) or dead (non-200 status) |

Content clusters are detected automatically using Louvain community detection. Page embeddings (via `@xenova/transformers`) power finer-grained subclusters within each community.

## Features

- **Nav-aware crawling** — strips header/footer/nav links from the edge graph by default, so hub noise doesn't distort the layout
- **Hub edge filtering** — removes edges to pages linked from more than 50% of all pages (threshold configurable)
- **Multilingual merging** — auto-detects language prefix paths (`/en/`, `/fr/`) and merges variant pages into single nodes
- **Exclude patterns** — skip routes by glob (e.g. `/api/**`, `/cdn-cgi/**`) with sane defaults built in
- **Self-contained report** — all JS, CSS, and data embedded in a single `.html` file

## Development

```bash
git clone https://github.com/your-username/site-scan-map
cd site-scan-map
bun install
bun src/index.ts example.com
```

Run tests:

```bash
bun test
```

## Tech Stack

- [Bun](https://bun.sh) — runtime
- [Sigma.js](https://www.sigmajs.org/) + [Graphology](https://graphology.github.io/) — graph rendering
- [ForceAtlas2](https://graphology.github.io/standard-library/layout-forceatlas2) — force-directed layout
- [@xenova/transformers](https://github.com/xenova/transformers.js) — local page embeddings for subcluster detection
