## 1. Types

- [x] 1.1 Add `langVariants?: Record<string, { url: string; title: string }>` to `GraphNode` in `types.ts`
- [x] 1.2 Add `missingLangs?: string[]` to `GraphNode` in `types.ts`
- [x] 1.3 Add `langPrefixes?: string[]` to `ScanOptions` in `types.ts`

## 2. Lang Prefix Detection

- [x] 2.1 Implement `detectLangPrefixes(records: CrawlRecord[]): { prefix: string; count: number }[]` in `graph-builder.ts` — pass 1 collect LANG_RE segments, pass 2 discard by overlap threshold
- [x] 2.2 Write unit tests for `detectLangPrefixes` covering: multilingual detected, false positive discarded, no prefix detected

## 3. Interactive Confirmation

- [x] 3.1 Implement `confirmLangPrefixes(candidates, flagValue?, isTTY): Promise<string[] | null>` in `index.ts` — handles interactive prompt, flag match/mismatch, non-TTY skip
- [x] 3.2 Add readline-based prompt rendering the candidates table and `[Y/n/custom]:` input
- [x] 3.3 Handle non-TTY case: log warning, return `null` to skip merge

## 4. Multilingual Merge

- [x] 4.1 Implement `mergeMultilingualRecords(records: CrawlRecord[], confirmedLangs: string[]): CrawlRecord[]` in `graph-builder.ts`
- [x] 4.2 Canonical URL construction: strip lang prefix from path, reconstruct URL
- [x] 4.3 Build `langVariants` map per canonical record from all variant records
- [x] 4.4 Compute `missingLangs` per canonical record by diffing `Object.keys(langVariants)` against `confirmedLangs`
- [x] 4.5 Merge `outboundLinks`: union all variant outboundLinks mapped to canonical URLs; exclude self-referencing (cross-lang) edges
- [x] 4.6 Write unit tests for `mergeMultilingualRecords` covering: two-lang merge, missing lang, non-prefixed URL passthrough, cross-lang edge discard, same-structure edge dedup

## 5. CLI Integration

- [x] 5.1 Add `--lang-prefix <codes>` flag parsing in `parseArgs()` in `index.ts`
- [x] 5.2 Validate each code against LANG_RE; exit with error on invalid
- [x] 5.3 Wire `detectLangPrefixes → confirmLangPrefixes → mergeMultilingualRecords` between `crawl()` and `buildGraph()` in `main()`
- [x] 5.4 Pass merged records and `confirmedLangs` into `buildGraph()`

## 6. Graph Builder Integration

- [x] 6.1 Propagate `langVariants` and `missingLangs` from `CrawlRecord` to `GraphNode` in `buildGraph()`
- [x] 6.2 Ensure `extractBaseSection` still runs correctly on canonical (non-prefixed) URLs

## 7. HTML Report — Node Detail Panel

- [x] 7.1 In `html-report.ts` node detail panel JS: detect presence of `langVariants` on selected node
- [x] 7.2 Render "Languages" section with per-lang title + URL rows
- [x] 7.3 Render missing-lang rows with distinct visual indicator (badge or greyed row)

## 8. HTML Report — Stats Panel

- [x] 8.1 Pass `missingLangs` data into graph stats or compute in `html-report.ts`
- [x] 8.2 Render i18n coverage section when `isMultilingual` is true: per-lang page counts, count of pages with at least one missing lang, table of incomplete pages
- [x] 8.3 Hide i18n section entirely when `isMultilingual` is false
