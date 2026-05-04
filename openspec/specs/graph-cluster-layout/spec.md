# Graph Cluster Layout

## Purpose

Defines the post-layout section centroid attraction pass that pulls nodes toward their section's center after the initial force-atlas2 run, enabling tunable section-based clustering.

## Requirements

### Requirement: Post-layout section centroid attraction
After the force-atlas2 layout converges, the system SHALL run a section centroid attraction pass that pulls each node toward the arithmetic mean position of all nodes in its section. The pass SHALL iterate a fixed number of times (30). On each iteration, for every node, the system SHALL compute the current centroid of its section and move the node by `clusterStrength * (centroid - nodePosition)`.

#### Scenario: Cluster strength zero
- **WHEN** cluster strength is set to 0
- **THEN** node positions remain exactly as output by force-atlas2

#### Scenario: Cluster strength maximum
- **WHEN** cluster strength is set to 1.0
- **THEN** after 30 iterations all nodes in a section converge to a single shared position (the section centroid)

#### Scenario: Moderate cluster strength groups nodes visibly
- **WHEN** cluster strength is set to 0.3
- **THEN** nodes in the same section are noticeably closer together than in the raw force-atlas2 layout
- **THEN** the overall graph structure and cross-section edge topology remain readable

### Requirement: Deterministic layout baseline
The system SHALL store the node positions produced by the initial 300-iteration force-atlas2 run as a deterministic baseline. When cluster strength changes, the system SHALL re-apply the centroid attraction pass starting from this baseline, not from the previously nudged positions.

#### Scenario: Slider adjusted multiple times
- **WHEN** user moves the cluster strength slider from 0.2 to 0.5 and then back to 0.2
- **THEN** the layout at 0.2 after the second adjustment matches the layout at 0.2 after the first adjustment

### Requirement: Centroid computation excludes hidden nodes
When computing section centroids during the attraction pass, the system SHALL include only nodes that are currently visible according to active filters (section, depth, orphan, dead). Hidden nodes SHALL neither contribute to centroid calculation nor be moved.

#### Scenario: Filtered section partially hidden
- **WHEN** a section has 10 nodes but only 3 are visible due to depth filtering
- **THEN** the centroid for that section is computed from the 3 visible nodes only
- **THEN** the 3 visible nodes are pulled toward that filtered centroid
