## ADDED Requirements

### Requirement: Node detail panel shows lang variants
When a selected node has `langVariants`, the node detail panel SHALL display a section listing each language with its title and URL.

#### Scenario: Lang variants section rendered
- **WHEN** user selects a node with `langVariants: { en: { url: "…/en/about", title: "About Us" }, fr: { url: "…/fr/about", title: "À propos" } }`
- **THEN** panel shows a "Languages" section with rows for `en` and `fr`, each showing the title and a clickable URL

#### Scenario: Missing lang shown as badge
- **WHEN** node has `missingLangs: ["es"]`
- **THEN** panel shows `es` with a distinct visual indicator (e.g. "missing" badge or greyed-out row)

#### Scenario: Non-multilingual node unchanged
- **WHEN** selected node has no `langVariants`
- **THEN** panel renders exactly as before with no lang section
