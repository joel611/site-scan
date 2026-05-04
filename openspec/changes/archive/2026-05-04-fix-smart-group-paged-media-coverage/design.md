## Context

The smart section grouping feature (`inferSectionFromInbound`) currently requires at least 2 inbound links before it will infer a section for a flat URL. This threshold was intended to avoid false positives, but in practice it causes pages linked from deep pagination (e.g. `/media-coverage/7`) to fall back to their own slug as section. This contradicts the `graph-builder` spec which states that flat URLs linked from a parent section should receive that section.

## Goals / Non-Goals

**Goals:**
- Allow single inbound links to trigger smart section inference
- Align the `smart-section-grouping` spec with the `graph-builder` spec
- Update tests to match the new behavior

**Non-Goals:**
- Changing the >50% majority threshold
- Changing root voter exclusion behavior
- Changing pattern extraction or language detection

## Decisions

**Remove the `voters.length < 2` guard entirely**
- Rationale: A single inbound link from a known section page is a strong signal. The >50% threshold already handles the case (1/1 = 100% > 50%). The extra 2-link minimum adds no value and breaks legitimate single-source inference.
- Alternative considered: Lower threshold to 1 but only for URLs matching pagination patterns (`/:section/:id`). Rejected because it adds unnecessary complexity and doesn't handle cases like a single link from a non-paginated sub-page (e.g. `/media-coverage/press-release`).

**Update tests rather than add new ones**
- Rationale: The existing "single inbound link fallback" test explicitly validates the bug behavior. It should be updated to expect inference instead.

## Risks / Trade-offs

- **[Risk]** Pages with a single inbound link from an unrelated section could be misclassified.
  - **Mitigation**: In practice, a single inbound link is still a meaningful signal. If the source section is wrong, that is a crawler/normalization issue, not an inference issue. The >50% threshold prevents misclassification when multiple sections link to the same page.
- **[Risk]** Existing scan reports will show different section groupings after this change.
  - **Mitigation**: This is expected and desired — the change fixes incorrect groupings. No migration needed.
