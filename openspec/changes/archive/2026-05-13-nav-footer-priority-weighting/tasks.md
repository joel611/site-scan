## 1. Types

- [ ] 1.1 Add `navSource: "nav" | "footer" | null` and `navSection: string | null` to `GraphNode` interface in `src/types.ts`
- [ ] 1.2 Update `makeNode` helper in `src/graph-builder.test.ts` to include `navSource: null, navSection: null` defaults

## 2. Nav Anchor Extraction

- [ ] 2.1 Write failing tests for `extractNavAnchors()` in `src/graph-builder.test.ts`: nav links from `header/nav`, footer links, nav beats footer on same URL, non-homepage ignored, no markup returns empty
- [ ] 2.2 Implement `extractNavAnchors(html: string, baseUrl: string, knownUrls: Set<string>): Map<string, "nav" | "footer">` in `src/graph-builder.ts` — parse `header a, nav a` → "nav", `footer a` → "footer", normalize URLs, filter to `knownUrls`
- [ ] 2.3 Run tests; verify all pass

## 3. navSource Assignment

- [ ] 3.1 Write failing test: after `buildGraph`, nodes linked from homepage nav have `navSource = "nav"`, footer links have `navSource = "footer"`, others have `navSource = null`
- [ ] 3.2 In `buildGraph` in `src/graph-builder.ts`, after `nodeMap` is populated, find depth=0 record, call `extractNavAnchors`, set `node.navSource` for matched nodes
- [ ] 3.3 Run tests; verify all pass

## 4. BFS navSection Assignment

- [ ] 4.1 Write failing tests for `assignNavSections()`: direct child gets parent's URL as navSection, shortest path wins, nav beats footer on tie, unreachable node gets null, nav anchor gets its own URL
- [ ] 4.2 Implement `assignNavSections(nodes: GraphNode[], edges: GraphEdge[]): void` in `src/graph-builder.ts` — BFS from nav anchors (nav first, then footer) through outbound edges; set `node.navSection = anchorUrl` for each reached node
- [ ] 4.3 Call `assignNavSections(nodes, edges)` in `buildGraph` after `navSource` is set
- [ ] 4.4 Run tests; verify all pass

## 5. Visual Size Multiplier

- [ ] 5.1 Write failing test: nav anchor and regular node with same `inbound` — nav anchor renders larger (test `getRoleSize` equivalent logic or verify via node attribute in output)
- [ ] 5.2 In `html-report.ts`, update `getRoleSize(n, role, tierMaxInbound)` to apply `n.navSource === "nav" ? 1.5 : n.navSource === "footer" ? 1.3 : 1.0` multiplier to `n.inbound` before size computation
- [ ] 5.3 Verify raw `node.inbound` field unchanged in graph JSON output

## 6. Color Grouping

- [ ] 6.1 In `html-report.ts`, update `getGroupKey(n)` to: `n.navSection || (hasCommunityData ? n.community : null) || n.section`
- [ ] 6.2 Update `colorGroups` derivation (line ~235) to use the updated `getGroupKey`
- [ ] 6.3 Pass `navSource` and `navSection` through `graph.addNode(...)` attribute map so `nodeReducer` can access them

## 7. Integration Test

- [ ] 7.1 Write integration test in `src/graph-builder.test.ts` using `buildGraph` with a homepage record containing nav/footer HTML: verify `navSource`, `navSection` assigned correctly end-to-end
- [ ] 7.2 Run full test suite: `bun test`; all tests pass

## 8. Commit

- [ ] 8.1 Commit: `feat: add nav/footer priority weighting for graph section grouping`
