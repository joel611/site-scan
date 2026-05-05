# Lang Prefix Detection

## Purpose

TBD — detects BCP-47 language path prefixes from crawl results using structural overlap analysis, and confirms them with the user before proceeding to the merge step.

## Requirements

### Requirement: Detect lang prefixes via structural overlap
The system SHALL detect lang path prefixes from crawl results using a two-pass algorithm: first collect first-path-segments matching BCP-47 format (`^[a-z]{2}(-[a-z]{2,4})?$/i`), then discard candidates whose canonical-path overlap with other candidates falls below 30%.

#### Scenario: Multilingual site detected
- **WHEN** crawl results contain URLs `/en/about`, `/fr/about`, `/en/pricing`, `/fr/pricing`
- **THEN** system detects `["en", "fr"]` as lang prefixes with >30% path overlap

#### Scenario: False positive discarded
- **WHEN** crawl results contain `/go/features` (product area) and `/en/features`
- **THEN** `/go` is discarded because its canonical-path set does not sufficiently overlap with `/en`

#### Scenario: No lang prefix detected
- **WHEN** all URL first-path-segments fail LANG_RE or fail overlap threshold
- **THEN** system detects no lang prefixes and skips the merge step entirely

### Requirement: Interactive confirmation prompt
The system SHALL prompt the user interactively to confirm detected lang prefixes before proceeding with the merge step.

#### Scenario: User confirms detected prefixes
- **WHEN** system detects `["en", "fr", "es"]` and user presses Enter or types `Y`
- **THEN** merge proceeds with `["en", "fr", "es"]`

#### Scenario: User rejects detected prefixes
- **WHEN** system detects prefixes and user types `n`
- **THEN** merge step is skipped; graph builds from unmerged records

#### Scenario: User provides custom prefixes
- **WHEN** user types `en,fr` at the confirmation prompt
- **THEN** merge proceeds with `["en", "fr"]` only, ignoring other detected candidates

#### Scenario: Non-TTY environment skips prompt
- **WHEN** `process.stdin.isTTY` is `false` and no `--lang-prefix` flag is provided
- **THEN** system logs a warning and skips the merge step

### Requirement: --lang-prefix flag with mismatch-aware confirmation
When `--lang-prefix` is provided, the system SHALL compare the flag value against auto-detected prefixes and confirm with the user only if they differ.

#### Scenario: Flag matches detected — proceed silently
- **WHEN** `--lang-prefix en,fr` is given and detection finds exactly `["en", "fr"]`
- **THEN** system logs "Lang prefix confirmed: en, fr" and proceeds without prompting

#### Scenario: Flag mismatches detected — prompt user
- **WHEN** `--lang-prefix en,fr` is given but detection finds `["en", "fr", "es"]`
- **THEN** system shows both sets and prompts user to confirm before proceeding
