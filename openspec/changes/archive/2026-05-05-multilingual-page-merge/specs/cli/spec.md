## ADDED Requirements

### Requirement: --lang-prefix flag accepted by CLI
The CLI SHALL accept an optional `--lang-prefix` flag taking a comma-separated list of BCP-47 language codes.

#### Scenario: Valid flag parsed
- **WHEN** user passes `--lang-prefix en,fr,es`
- **THEN** `ScanOptions.langPrefixes` is `["en", "fr", "es"]`

#### Scenario: Invalid code rejected
- **WHEN** user passes `--lang-prefix en,toolong`
- **THEN** CLI prints an error and exits with code 1

#### Scenario: Flag omitted
- **WHEN** `--lang-prefix` is not provided
- **THEN** `ScanOptions.langPrefixes` is `undefined` and auto-detection runs after crawl
