# Aurelglyph Phase 2 And Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Aurelglyph `0.3.0` with Phase 2 mobile/app controls and Phase 3 product/workbench controls across React/CSS, Rails, SwiftUI, docs, and examples.

**Architecture:** Keep React components small and typed, with shared `ag-*` classes in `packages/react/src/styles.css`. Continue generating `@aurelglyph/css` and Rails stylesheets from the React component class layer so CSS-only, React, and Rails consumers share the same visual contract. Add SwiftUI-native view types that mirror component names and semantics.

**Tech Stack:** TypeScript, React 19, CSS variables, Vitest, Ruby minitest, SwiftPM/SwiftUI, GitHub Pages static generator.

---

## Files

- Modify `package.json`, workspace package manifests, and Rails version files to `0.3.0`.
- Create React component files under `packages/react/src/components/`.
- Modify `packages/react/src/index.ts`, `packages/react/src/styles.css`, and React tests.
- Modify `packages/rails/lib/aurelglyph/rails/helper.rb` and Rails tests.
- Create or extend SwiftUI components under `packages/swift/Sources/AurelglyphUI/`.
- Modify Swift tests.
- Modify `README.md`, `CHANGELOG.md`, `docs/consuming.md`, `scripts/pages.ts`, and React Vite example files.

## Tasks

- [ ] **Task 1: Bump workspace to 0.3.0**
  - Run `npm run version:sync -- "Add Phase 2 and Phase 3 component support across React, SwiftUI, Rails, CSS, docs, and examples."`
  - Update Rails version constants and tests to `0.3.0`.
  - Add `CHANGELOG.md` section for `0.3.0`.

- [ ] **Task 2: Add React Phase 2 components**
  - Create `NavigationStack.tsx`, `Toolbar.tsx`, `Sheet.tsx`, `SegmentedControl.tsx`, `Select.tsx`, `Alert.tsx`, `EmptyState.tsx`, `Avatar.tsx`, and `Badge.tsx`.
  - Export all components and types from `packages/react/src/index.ts`.
  - Add accessible markup tests in `packages/react/src/components/Button.test.ts`.

- [ ] **Task 3: Add React Phase 3 components**
  - Create `Tabs.tsx`, `Breadcrumbs.tsx`, `Toast.tsx`, `Progress.tsx`, `Skeleton.tsx`, `Metric.tsx`, `Table.tsx`, `Pagination.tsx`, and `CommandPalette.tsx`.
  - Export all components and types.
  - Add tests for selected/current states, ARIA roles, and source-level contracts for hook or ID components.

- [ ] **Task 4: Style shared web components**
  - Extend `packages/react/src/styles.css` with tokenized `ag-*` classes for every Phase 2 and Phase 3 component.
  - Ensure focus states, selected states, light/dark compatibility, and responsive behavior.
  - Update `packages/css/src/adapter-skeleton.test.ts` to assert generated CSS and Rails CSS contain representative Phase 2 and Phase 3 classes.

- [ ] **Task 5: Add Rails helper parity**
  - Add helpers that emit equivalent `ag-*` markup for Phase 2 and Phase 3 controls.
  - Update `packages/rails/test/aurelglyph_rails_test.rb` to cover helper output and accessibility attributes.

- [ ] **Task 6: Add SwiftUI component parity**
  - Add `AurelglyphPhaseTwoComponents.swift` and `AurelglyphPhaseThreeComponents.swift`.
  - Add view types for the Phase 2 and Phase 3 component names.
  - Update Swift tests to assert the symbols are available and basic models initialize.

- [ ] **Task 7: Update docs, examples, and Pages**
  - Update README, consuming docs, static Pages generator, and React Vite example.
  - Run `npm run build:pages`.

- [ ] **Task 8: Verify and commit**
  - Run `npm run verify`.
  - Run `swift test` in `packages/swift`.
  - Run Rails helper and gemspec tests.
  - Run `git diff --check`.
  - Commit once all checks pass.
