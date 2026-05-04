## 1. Add Pages Tab UI

- [x] 1.1 Add third `<div class="tab">` element for Pages in the tab bar HTML
- [x] 1.2 Add `#links-view` container div in the main layout HTML

## 2. Implement Tab Switching

- [x] 2.1 Update `switchTab()` to handle the `links` case and toggle `#links-view` visibility
- [x] 2.2 Update tab active-state logic to account for three tabs instead of two

## 3. Build Pages Table

- [x] 3.1 Create `buildLinks()` function that renders a table from `GRAPH_DATA.nodes`
- [x] 3.2 Columns: URL, Title, Section, Status, Depth, In, Out
- [x] 3.3 Reuse existing `buildTable` / `initSortable` / `sortTable` utilities

## 4. Verification

- [x] 4.1 Run `bun test` to confirm no regressions
- [x] 4.2 Generate a sample report and verify the Pages tab renders correctly
