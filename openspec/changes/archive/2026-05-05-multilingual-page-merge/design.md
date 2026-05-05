## Context

`site-scan-map` crawls a domain and builds a directed graph of pages. Each URL becomes a unique `GraphNode` (id = URL). For multilingual sites structured as `/en/about`, `/fr/about`, `/es/about`, these three become three separate nodes — the graph shows identical content structure repeated N times, obscuring real site architecture and hiding missing translations.

Lang detection already exists (`extractBaseSection` in `graph-builder.ts`) but is per-URL, heuristic-only (regex match on first path segment), and fully silent. No confirmation, no merging.

The pipeline today: `crawl → buildGraph → generateReport`. The new step slots between crawl and buildGraph.

## Goals / Non-Goals

**Goals:**
- Detect lang prefixes site-wide using structural overlap (stronger signal than regex alone)
- Interactive confirmation UX before any merging occurs
- Support `--lang-prefix` flag for pre-seeded values with mismatch-aware confirmation
- Merge same-canonical-path URLs into one `GraphNode` with `langVariants` and `missingLangs`
- Discard cross-lang edges (lang switcher noise) during merge
- Surface per-lang titles/URLs and missing-lang badges in the node detail panel
- Add i18n coverage section to the stats panel

**Non-Goals:**
- Changing the crawl behavior (dedup across langs during crawl)
- Detecting lang via HTML `lang` attribute or `hreflang` links (URL-structure only)
- Supporting lang-in-query-string patterns (`?lang=fr`)
- Handling sites where lang is part of the subdomain (`fr.example.com`)

## Decisions

### D1: Slot between crawl and buildGraph, not inside either

**Decision:** New pipeline step `detectAndMerge(records, options)` runs after `crawl()` returns and before `buildGraph()` is called. Returns `CrawlRecord[]` with lang-variant records collapsed.

**Alternatives considered:**
- Inside `buildGraph`: would require threading interactive I/O into a pure data-transform function — wrong layer.
- Inside `crawl`: would require knowing lang prefixes before seeing all URLs — chicken-and-egg.

### D2: Two-pass structural overlap detection

**Decision:**
1. Pass 1: collect all first-path-segments matching `LANG_RE` (`/^[a-z]{2}(-[a-z]{2,4})?$/i`) across all URLs, group by segment → Set of canonical paths (first segment stripped).
2. Pass 2: discard candidates where overlap with any other candidate's path set is below threshold (default 30%). This eliminates `/go`, `/tv`, `/uk` style false positives that happen to match the regex.

**Alternatives considered:**
- Regex-only (current approach): too many false positives on short product-area segments.
- `hreflang` link detection: more accurate but requires HTML parsing per page and won't work on pages that omit `hreflang`.

### D3: Interactive confirmation via readline, non-interactive via `--lang-prefix`

**Decision:**
- Default: after detection, print candidates table and prompt `[Y/n/custom]:` using `readline`.
- `--lang-prefix en,fr,es`: auto-detection still runs. If detected set matches flag set exactly → log and proceed without prompt. If mismatch → show both sets, prompt user to confirm.

**Alternatives considered:**
- `--no-confirm` flag to skip all prompts: adds complexity; the mismatch-aware path is the important safety net.
- Always require `--lang-prefix` (no auto-detect): worse UX for the common case.

### D4: Merge produces a single CrawlRecord per canonical path

**Decision:** Merged record uses:
- `url` / `finalUrl` = canonical URL (lang prefix stripped, e.g. `https://example.com/about`)
- `title` = title from first detected lang (used as graph node label)
- `outboundLinks` = union of all variant outboundLinks mapped to their canonical URLs, minus cross-lang edges
- `html` = html from first detected lang (for embedding computation)
- New field `langVariants: Record<string, { url: string; title: string }>` carried through to `GraphNode`

**Alternatives considered:**
- Option B (primary-lang URL as node id): ties node identity to a specific lang, breaks if that lang is missing on some pages.
- Option C variant with separate virtual canonical meta-node: preserves old graph structure but adds complexity with no UX benefit in the viz.

### D5: `langVariants` and `missingLangs` as optional fields on GraphNode

**Decision:** Add `langVariants?: Record<string, { url: string; title: string }>` and `missingLangs?: string[]` to `GraphNode`. Undefined when site is not multilingual — no behavior change for non-multilingual scans.

**Alternatives considered:**
- New `MultilingualGraphNode` subtype: requires type narrowing everywhere the type is consumed; overkill for two optional fields.

## Risks / Trade-offs

- **False negatives on unconventional lang codes** (`zh-hant`, `pt-br`) → The `LANG_RE` pattern `/^[a-z]{2}(-[a-z]{2,4})?$/i` covers BCP-47 subtags up to 4 chars; edge cases (3-char primary tags like `zho`) not covered. Low risk in practice.
- **Canonical path collision** → Two unrelated pages that happen to share a canonical path after stripping different lang prefixes. Mitigated by requiring overlap threshold: if `/go/pricing` and `/en/pricing` both exist but `/go/` has no other overlap with `/en/`, `/go` won't be detected as a lang prefix.
- **readline blocks non-TTY environments** (pipes, CI) → Wrap readline prompt in a TTY check; if `process.stdin.isTTY === false` and no `--lang-prefix` flag, skip merging with a warning.
- **Cross-lang edge discard loses real cross-lang links** → A page might legitimately link to its own variant in another language outside of a nav element. These are rare and the nav-threshold filter already removes most. Acceptable trade-off.
- **Embed computation uses only one lang variant's HTML** → Subclusters may be slightly biased toward the primary lang. Low impact; embeddings are optional anyway.

## Migration Plan

No data migration needed — output is a new standalone HTML file per scan. Old scan files are unaffected.

Rollback: remove the `detectAndMerge` call in `index.ts`; all other changes are additive.

## Open Questions

- Should the confirmation prompt default to **Y** (proceed with detected langs) or **N** (skip merging)? Currently leaning Y since the detection threshold is conservative.
- Overlap threshold of 30% — needs validation against real multilingual sites in the test corpus (hypthon-com-scan, www-pinecaregroup-com-scan). Could be made a hidden flag `--lang-overlap-threshold` if needed.
