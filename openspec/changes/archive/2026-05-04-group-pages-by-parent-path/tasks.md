## 1. Refactor section extraction

- [x] 1.1 Extract `extractLangSection` and `getPattern` into standalone pure functions (already are, verify no side effects)
- [x] 1.2 Rename `extractLangSection` to `extractBaseSection` to clarify it returns the raw path-based section

## 2. Implement parent-aware section assignment

- [x] 2.1 Add `inferSectionFromInbound(nodes, edges): Map<string, string>` function that:
  - Iterates edges grouped by target
  - For each target, collects source sections (excluding root `/`)
  - Returns majority section if >50% and total inbound >= 2, else undefined
- [x] 2.2 Integrate inference into `buildGraph`:
  - After edge construction, call `inferSectionFromInbound`
  - Override `node.section` when inference returns a value
  - Fallback keeps `extractBaseSection` result

## 3. Update tests and verify

- [x] 3.1 Add unit tests for `inferSectionFromInbound`:
  - Single-source majority
  - Tie fallback
  - Root voter exclusion
  - No inbound fallback
- [x] 3.2 Add integration test in `buildGraph`:
  - Flat URL `/20210319-recruit` linked from `/media-coverage/` gets section `media-coverage`
- [x] 3.3 Run `bun test` and ensure all pass

## 4. Validate with real scan

- [x] 4.1 Run `bun src/index.ts www.pinecaregroup.com --limit 500`
- [x] 4.2 Open generated HTML and verify `/20210319-recruit` appears in `media-coverage` section color
- [x] 4.3 Verify no regressions on hierarchical sites (e.g., `bun src/index.ts example.com`)
