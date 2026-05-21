# Aurelglyph GlyphMotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Aurelglyph `0.4.0` with GlyphMotion tokens, SwiftUI modifiers, React/web adapters, docs, and examples.

**Architecture:** Add motion tokens to the canonical token source, then expose a stable Aurelglyph-native transition vocabulary in SwiftUI and React. SwiftUI maps the vocabulary to native modifiers and animations; React maps it to data attributes, CSS variables, context, View Transition capability detection, and CSS fallback classes.

**Tech Stack:** TypeScript, React 19, CSS variables, Vitest, SwiftPM/SwiftUI, static GitHub Pages generator.

---

## Files

- Modify `package.json`, workspace package manifests, Rails version files, README, CHANGELOG, docs, Pages, and examples to `0.4.0`.
- Modify `packages/tokens/src/tokens.json` and token tests.
- Create `packages/react/src/components/GlyphMotion.tsx`.
- Modify `packages/react/src/index.ts`, `packages/react/src/styles.css`, and React tests.
- Create `packages/swift/Sources/AurelglyphUI/AurelglyphGlyphMotion.swift`.
- Modify Swift tests.
- Modify `examples/react-vite/src/App.tsx`, `examples/react-vite/src/app.css`, `scripts/pages.ts`, and `docs/consuming.md`.

## Tasks

- [ ] **Task 1: Version and docs baseline**
  - Bump root version to `0.4.0`.
  - Run `npm run version:sync -- "Add GlyphMotion shared transition system for SwiftUI and React."`.
  - Update Rails version constants and gemspec tests.
  - Add `CHANGELOG.md` `0.4.0` entry.

- [ ] **Task 2: Motion tokens**
  - Add `motion.spring`, `motion.depth`, `motion.blur`, `motion.scale`, `motion.opacity`, `motion.drift`, `motion.arc`, and `motion.stagger` token groups.
  - Update token tests to assert generated GlyphMotion token names.

- [ ] **Task 3: React GlyphMotion**
  - Create `GlyphMotion.tsx` with `GlyphMotionProvider`, `GlyphMatch`, `GlyphTransition`, `useGlyphMotion`, and exported types.
  - Add CSS classes for `ag-glyph-*` transitions and View Transition fallback behavior.
  - Update React export and component tests.

- [ ] **Task 4: SwiftUI GlyphMotion**
  - Create `AurelglyphGlyphMotion.swift`.
  - Add `GlyphSpring`, `GlyphTransition`, `GlyphState`, `GlyphDirection`, `GlyphSnapshotStrategy`, `GlyphInteractive`, `GlyphMotionNamespace`, and View modifiers.
  - Update Swift tests.

- [ ] **Task 5: Docs and examples**
  - Update README, consuming docs, Pages generator, and React Vite example with concrete SwiftUI and React GlyphMotion usage.
  - Regenerate Pages.

- [ ] **Task 6: Verification and release**
  - Run `npm run verify`.
  - Run `swift test` in `packages/swift`.
  - Run Rails helper and gemspec tests if Rails files changed.
  - Run `git diff --check`.
  - Commit and retag locally only unless explicitly asked to push.
