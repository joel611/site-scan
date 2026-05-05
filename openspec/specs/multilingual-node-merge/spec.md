# Multilingual Node Merge

## Purpose

TBD — collapses lang-variant crawl records sharing the same canonical path into a single graph node, carrying per-lang metadata and tracking missing language variants.

## Requirements

### Requirement: Merge lang variants into canonical CrawlRecord
The system SHALL collapse lang-variant `CrawlRecord` entries sharing the same canonical path into a single record before graph building.

#### Scenario: Two lang variants merged
- **WHEN** records exist for `/en/about` and `/fr/about` and confirmed lang prefixes are `["en", "fr"]`
- **THEN** output contains one record with canonical URL `https://example.com/about`

#### Scenario: Page present in only one lang not lost
- **WHEN** record exists for `/en/contact` but not `/fr/contact`
- **THEN** canonical record for `contact` is present with `missingLangs: ["fr"]`

#### Scenario: Non-lang-prefixed URLs preserved as-is
- **WHEN** URL `/sitemap.xml` or `/robots.txt` does not match any confirmed lang prefix
- **THEN** record is included in output unchanged with no `langVariants` field

### Requirement: langVariants carries per-lang URL and title
Each merged `GraphNode` SHALL carry a `langVariants` map of `{ [lang]: { url: string; title: string } }` for all variants found during crawl.

#### Scenario: langVariants populated on merged node
- **WHEN** `/en/about` (title "About Us") and `/fr/about` (title "À propos") are merged
- **THEN** node has `langVariants: { en: { url: "…/en/about", title: "About Us" }, fr: { url: "…/fr/about", title: "À propos" } }`

#### Scenario: langVariants absent on non-multilingual node
- **WHEN** merge step is skipped (no lang prefix detected or confirmed)
- **THEN** `GraphNode.langVariants` is `undefined`

### Requirement: missingLangs computed per canonical node
Each merged `GraphNode` SHALL carry `missingLangs: string[]` listing confirmed lang prefixes for which no URL variant exists.

#### Scenario: Missing lang recorded
- **WHEN** confirmed langs are `["en", "fr", "es"]` and only `en` and `fr` variants exist for a page
- **THEN** node has `missingLangs: ["es"]`

#### Scenario: No missing langs
- **WHEN** all confirmed langs have a variant for a page
- **THEN** node has `missingLangs: []`

### Requirement: Cross-lang edges discarded during merge
The system SHALL discard graph edges where source and target are variants of the same canonical page in different languages.

#### Scenario: Cross-lang edge removed
- **WHEN** `/en/about` links to `/fr/about` (lang switcher link)
- **THEN** no edge exists between the merged canonical nodes (same source and target after merge)

#### Scenario: Same-structure edges deduplicated
- **WHEN** `/en/about → /en/pricing` and `/fr/about → /fr/pricing` both exist
- **THEN** merged graph has exactly one edge `about → pricing`
