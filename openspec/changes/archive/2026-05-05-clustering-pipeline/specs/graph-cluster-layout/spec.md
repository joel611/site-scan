## MODIFIED Requirements

### Requirement: Post-layout section centroid attraction
After the force-atlas2 layout converges, the system SHALL run a centroid attraction pass that pulls each node toward the arithmetic mean position of all nodes sharing the same group key. The group key SHALL be `community` when community data is present on nodes, and SHALL fall back to `section` when `community` is absent or all nodes have `community: undefined`. The pass SHALL iterate a fixed number of times (30). On each iteration, for every node, the system SHALL compute the current centroid of its group and move the node by `clusterStrength * (centroid - nodePosition)`.

#### Scenario: Community data drives centroid attraction
- **WHEN** nodes have `community` fields populated
- **THEN** centroid attraction groups nodes by `community`, not `section`

#### Scenario: Fallback to section when community absent
- **WHEN** nodes do not have a `community` field (legacy scan data loaded in browser)
- **THEN** centroid attraction groups nodes by `section` as before

#### Scenario: Cluster strength zero
- **WHEN** cluster strength is set to 0
- **THEN** node positions remain exactly as output by force-atlas2

#### Scenario: Cluster strength maximum
- **WHEN** cluster strength is set to 1.0
- **THEN** after 30 iterations all nodes in a community converge to a single shared position (the community centroid)

#### Scenario: Moderate cluster strength groups nodes visibly
- **WHEN** cluster strength is set to 0.3
- **THEN** nodes in the same community are noticeably closer together than in the raw force-atlas2 layout
- **THEN** the overall graph structure and cross-community edge topology remain readable
