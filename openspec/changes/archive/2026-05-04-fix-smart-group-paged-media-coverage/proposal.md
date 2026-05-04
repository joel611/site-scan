## Why

Flat URLs (e.g. `/20190513-cpjobs`) linked from paginated section pages (e.g. `/media-coverage/7`) currently fall back to their own path segment as section instead of being inferred as `media-coverage`. This happens because `inferSectionFromInbound` requires at least 2 inbound links before triggering smart section assignment. Articles on deep pagination pages often have only a single inbound link, causing them to be incorrectly grouped under their own slug rather than the parent section.

## What Changes

- Remove the 2-link minimum threshold in `inferSectionFromInbound` so that a single inbound link from a section page is sufficient for inference
- Update `smart-section-grouping` spec to remove the single-link fallback requirement and allow inference with 1+ inbound links
- Update `graph-builder` tests to reflect the new behavior

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `smart-section-grouping`: Remove the minimum 2 inbound links requirement for majority section inference. Single inbound links from a section page will now trigger smart grouping.

## Impact

- `src/graph-builder.ts` — `inferSectionFromInbound` function
- `src/graph-builder.test.ts` — update single-link fallback test to expect inference instead of fallback
- `openspec/specs/smart-section-grouping/spec.md` — update requirements and scenarios
