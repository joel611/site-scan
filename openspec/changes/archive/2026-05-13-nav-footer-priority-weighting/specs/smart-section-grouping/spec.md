## ADDED Requirements

### Requirement: navSection complements section without replacing it
The `navSection` field SHALL be assigned independently of the `section` field. The `section` field SHALL continue to be used for sidebar filter grouping. The `navSection` field is used only for graph color priority. Both fields coexist on every `GraphNode`.

#### Scenario: Node retains URL-path section when navSection is assigned
- **WHEN** node `/services/consulting` has `navSection = "/services"` from BFS
- **THEN** `node.section` is still `"services"` (first path segment)

#### Scenario: Sidebar filter uses section, not navSection
- **WHEN** user toggles the "services" section filter in the sidebar
- **THEN** all nodes with `section = "services"` are toggled, regardless of their `navSection` value
