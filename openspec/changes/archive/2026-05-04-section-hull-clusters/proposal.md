## Why

The graph view renders nodes with color-coded sections but no spatial grouping, making it hard to see section boundaries or identify multilingual site structure at a glance. Sites built with language prefixes (e.g., `/en/`, `/zh/`) have their section detection broken — `/en/post` reads as section "en" instead of "post".

## What Changes

- Draw convex hull polygons per section in the graph view, visually bounding each section's nodes
- Detect language prefix in URL paths and strip it before computing section (e.g., `/en/post/x` → lang=`en`, section=`post`)
- Show lang code badge on every node when site is multilingual (>1 distinct non-default lang detected)
- Add `lang`, `langBreakdown`, `isMultilingual` to graph data types
- Add sidebar toggle to show/hide hull polygons
- Add language breakdown table to Stats tab (only when multilingual)

## Capabilities

### New Capabilities

- `section-hull`: Convex hull polygon rendering per section in the D3 graph, with sidebar toggle
- `multilingual-detection`: Language prefix detection from URL path, lang-aware section computation, per-node lang badges, stats breakdown

### Modified Capabilities

- `graph-builder`: Section and pattern computation becomes lang-aware (strips detected lang prefix before deriving section)
- `html-report`: Graph rendering adds hull layer and lang badges; Stats tab adds language breakdown

## Impact

- `src/types.ts`: `GraphNode` gains `lang: string`; `GraphStats` gains `langBreakdown: LangStat[]` and `isMultilingual: boolean`; new `LangStat` interface
- `src/graph-builder.ts`: `getSection` / new `getLang` unified into lang-aware extraction; stat computation updated
- `src/html-report.ts`: SVG layer for hulls (drawn under nodes); lang badge text elements; sidebar hull toggle; stats language table
