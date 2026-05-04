# Graph Builder

## Purpose

Constructs a directed graph from crawl results, computes node metrics, detects orphans and dead links, groups URLs into patterns/templates, and produces aggregate site-level stats.

## MODIFIED Requirements

### Requirement: Node metrics
Each node SHALL include: url, title, status, depth, section (first non-empty path segment, or `/` for root, with parent-aware override for flat URLs), inbound link count, outbound link count.

#### Scenario: Section assignment for hierarchical URL
- **WHEN** page URL is `https://example.com/blog/my-post`
- **THEN** node section is `blog`

#### Scenario: Section assignment for flat URL linked from parent section
- **WHEN** page URL is `https://example.com/20210319-recruit` and the only inbound links are from pages in section `media-coverage`
- **THEN** node section is `media-coverage`

#### Scenario: Root section
- **WHEN** page URL is `https://example.com/`
- **THEN** node section is `/`
