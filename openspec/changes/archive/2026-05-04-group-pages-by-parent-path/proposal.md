## Why

Sites with flat URL structures (e.g., `/20210319-recruit`) do not encode category hierarchy in paths. Current graph-builder assigns section = first path segment, producing misleading sections and fragmenting the graph view. We need smarter section grouping that uses parent-path context when URLs lack categorical prefixes.

## What Changes

- **BREAKING**: Change section assignment in `graph-builder` from "first path segment" to "parent-aware grouping"
- Pages whose URL lacks a recognizable category prefix but are linked from a consistent parent section will be grouped under that parent section
- Orphan pages without parent context continue to use first path segment as fallback
- `GraphNode.section` and `GraphStats.sectionBreakdown` semantics remain the same; only assignment logic changes

## Capabilities

### New Capabilities
- `smart-section-grouping`: Detect parent section for flat-URL pages by analyzing inbound link sources and path structure

### Modified Capabilities
- `graph-builder`: Section assignment requirement changes from "first non-empty path segment" to "parent-aware grouping with fallback to first segment"

## Impact

- `src/graph-builder.ts`: Core section assignment logic
- `src/types.ts`: No changes (section field semantics unchanged)
- `src/html-report.ts`: No changes (consumes section data same way)
- Generated HTML reports: Section groupings will differ for affected sites (more accurate)
