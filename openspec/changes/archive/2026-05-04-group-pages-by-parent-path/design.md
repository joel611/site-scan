## Context

Current `extractLangSection` in `graph-builder.ts` computes section as the first non-empty path segment (or second if first is a language code). This works for hierarchically organized sites (`/blog/post-1`) but fails for flat-URL sites where pages like `/20210319-recruit` live conceptually under `/media-coverage/` without expressing it in the path.

The crawler already captures `outboundLinks` per page. After graph construction we have a complete edge map. We can use inbound edge sources to infer a page's parent section.

## Goals / Non-Goals

**Goals:**
- Group flat-URL pages under the section of the page(s) that link to them
- Preserve existing behavior for well-organized sites
- Minimal performance impact on graph building

**Non-Goals:**
- Changing URL patterns or template grouping
- Modifying the report UI
- Supporting non-crawl-based section detection (e.g., content analysis)

## Decisions

1. **Parent section inference via majority inbound source**
   - For each node, collect the `section` of all inbound-link source nodes
   - If a majority (>50%) share the same section, assign that section to the target
   - Rationale: simple, deterministic, handles cases where a page is linked from multiple contexts
   - Alternative considered: deepest common path prefix — rejected because flat URLs have no common prefix with their parent

2. **Fallback to first path segment**
   - If no majority section exists (ties, no inbound links, or inbound from many sections), keep first-segment behavior
   - Rationale: preserves existing behavior for orphans and well-structured URLs

3. **Root page excluded from inference**
   - Inbound from root (`/`) does not vote for section "/" unless the target is actually under `/`
   - Rationale: root links to everything; using root as a voter would collapse all orphans into `/`

## Risks / Trade-offs

- [Misgrouping when linked from nav/footer] → Mitigation: only count inbound links from pages at depth >= 1 (all crawled pages except root already satisfy this); if nav pages become problematic, future enhancement could weight by depth or exclude templates matching `/:id` or `/:slug`
- [Performance on very large graphs] → Mitigation: single pass over edges after graph construction; O(E) time, negligible overhead

## Migration Plan

No migration needed. This is a behavioral change in graph generation; existing scan HTML files remain valid but will differ if regenerated.
