## ADDED Requirements

### Requirement: Language prefix detection from URL path
The graph builder SHALL detect language codes in the first URL path segment using the pattern `/^[a-z]{2}(-[a-z]{2,4})?$/i`. When detected, the segment SHALL be recorded as `lang` and the second path segment SHALL be used as `section`. When not detected, `lang` SHALL be set to `"default"` and the first segment used as `section` (existing behavior).

#### Scenario: Language prefix present
- **WHEN** a URL path starts with a valid language code segment (e.g., `/en/`, `/zh/`, `/fr-CA/`)
- **THEN** `lang` is set to that code and `section` is the next path segment

#### Scenario: No language prefix
- **WHEN** a URL path first segment does not match the language code pattern
- **THEN** `lang` is set to `"default"` and `section` is the first path segment

#### Scenario: Root URL with no path segments
- **WHEN** a URL has no path segments (e.g., `https://example.com/`)
- **THEN** `lang` is `"default"` and `section` is `"/"`

### Requirement: Multilingual site detection
The graph builder SHALL compute `isMultilingual` as `true` when more than one distinct non-`"default"` lang value exists across all graph nodes. The `langBreakdown` array SHALL list each distinct lang value and its page count, sorted descending by page count.

#### Scenario: Multiple languages detected
- **WHEN** crawled pages include URLs with two or more distinct language prefixes
- **THEN** `isMultilingual` is `true` and `langBreakdown` lists each language with its page count

#### Scenario: Single language or no prefix
- **WHEN** all pages share the same lang value (including `"default"`)
- **THEN** `isMultilingual` is `false`

### Requirement: Per-node lang badge in graph
The graph view SHALL render a small text label showing the `lang` code below each node when `isMultilingual` is `true`. When `isMultilingual` is `false`, no lang badges SHALL be rendered.

#### Scenario: Multilingual site — badges visible
- **WHEN** `GRAPH_DATA.stats.isMultilingual` is `true`
- **THEN** each visible node shows its `lang` code as a small text label below the node

#### Scenario: Monolingual site — no badges
- **WHEN** `GRAPH_DATA.stats.isMultilingual` is `false`
- **THEN** no lang badge text is rendered on any node

#### Scenario: Filtered nodes have no badge
- **WHEN** a node is hidden by filters
- **THEN** its lang badge is also hidden

### Requirement: Language breakdown in Stats tab
The Stats tab SHALL show a Language Breakdown table when `isMultilingual` is `true`, listing each language and its page count.

#### Scenario: Multilingual — table shown
- **WHEN** user views the Stats tab and `isMultilingual` is `true`
- **THEN** a Language Breakdown table is visible with columns: Language, Pages

#### Scenario: Monolingual — table hidden
- **WHEN** user views the Stats tab and `isMultilingual` is `false`
- **THEN** no Language Breakdown table is shown
