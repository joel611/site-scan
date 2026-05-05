## ADDED Requirements

### Requirement: i18n coverage section in stats panel
When `GraphStats.isMultilingual` is `true`, the stats panel SHALL display an i18n coverage section showing per-language page counts and a list of pages missing in at least one language.

#### Scenario: Coverage section shown for multilingual site
- **WHEN** `isMultilingual` is `true` and nodes carry `missingLangs`
- **THEN** stats panel shows a section with: total pages per lang, count of pages missing in at least one lang, and a table of canonical paths that have at least one `missingLangs` entry

#### Scenario: Coverage section hidden for monolingual site
- **WHEN** `isMultilingual` is `false`
- **THEN** stats panel renders as before with no i18n coverage section
