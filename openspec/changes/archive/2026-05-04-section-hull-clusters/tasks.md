## 1. Types

- [x] 1.1 Add `lang: string` field to `GraphNode` interface in `src/types.ts`
- [x] 1.2 Add `LangStat` interface `{ lang: string; pageCount: number }` to `src/types.ts`
- [x] 1.3 Add `langBreakdown: LangStat[]` and `isMultilingual: boolean` to `GraphStats` interface in `src/types.ts`

## 2. Graph Builder — Lang-Aware Section Extraction

- [x] 2.1 Replace `getSection` in `src/graph-builder.ts` with `extractLangSection(url): { lang: string; section: string }` using regex `/^[a-z]{2}(-[a-z]{2,4})?$/i` on first path segment
- [x] 2.2 Update `buildGraph` node construction to use `extractLangSection` and populate `node.lang` and `node.section`
- [x] 2.3 Compute `langBreakdown` (count per distinct lang, sorted desc by count) in `buildGraph`
- [x] 2.4 Compute `isMultilingual` (true if >1 distinct non-`"default"` lang) in `buildGraph`
- [x] 2.5 Add `langBreakdown` and `isMultilingual` to the returned `stats` object

## 3. HTML Report — Hull Rendering

- [x] 3.1 Add `hullSelection` variable alongside existing `nodeSelection`, `linkSelection`, `labelSelection`
- [x] 3.2 In `initGraph`, insert hull `<g>` layer as first child of the main `<g>` (beneath links)
- [x] 3.3 Implement `updateHulls()` function: group visible nodes by section, compute `d3.polygonHull` per group, draw/update `<path>` elements with section color at 8% fill opacity and 30% stroke opacity, dashed stroke
- [x] 3.4 Handle small-section fallback in `updateHulls()`: for sections with <3 nodes, draw a `<circle>` instead of hull path
- [x] 3.5 Call `updateHulls()` on every simulation tick (throttled every 3rd tick via counter)
- [x] 3.6 Call `updateHulls()` from `updateGraph()` after simulation restart

## 4. HTML Report — Hull Toggle

- [x] 4.1 Add `showHulls` boolean to the `filters` state object (default `true`)
- [x] 4.2 Add "Section Clusters" toggle button to sidebar HTML, styled same as existing toggle buttons
- [x] 4.3 Wire toggle button to flip `showHulls` and call `updateHulls()` (show/hide hull layer via CSS display or opacity)

## 5. HTML Report — Lang Badges

- [x] 5.1 Add `langLabelSelection` variable for lang badge text elements
- [x] 5.2 In `updateGraph`, when `GRAPH_DATA.stats.isMultilingual` is true, bind lang badge `<text>` elements per visible node; position below node (`y = node.y + nodeRadius + 20`)
- [x] 5.3 Style lang badges: font-size 8px, fill `#94a3b8`, pointer-events none
- [x] 5.4 Update lang badge positions on each simulation tick
- [x] 5.5 When `isMultilingual` is false, ensure no lang badge elements are rendered

## 6. HTML Report — Stats Language Table

- [x] 6.1 In `buildStats()`, after existing tables, conditionally render a "Language Breakdown" section when `stats.isMultilingual` is true
- [x] 6.2 Build table with columns Language, Pages using existing `buildTable` helper
- [x] 6.3 Wire table sorting via existing `initSortable` helper

## 7. Verify

- [ ] 7.1 Run scan on a multilingual test site (e.g., a site with `/en/` and `/zh/` paths) and verify hulls, lang badges, and stats table render correctly
- [x] 7.2 Run scan on a monolingual site and verify no lang badges, hulls still group by section, no language stats table
- [ ] 7.3 Verify hull toggle hides/shows all hull polygons
- [ ] 7.4 Verify filter changes (section/depth/orphan/dead) correctly exclude nodes from hull computation
