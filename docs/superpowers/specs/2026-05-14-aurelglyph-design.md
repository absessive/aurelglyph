# Aurelglyph Design System Specification

## Summary

Aurelglyph is a standalone, versioned UX design language and component system for the user's apps across web, iOS, macOS, React Native, and Ruby on Rails. It should stand on its own, without depending on Bootstrap, Material UI, or another third-party design system, while borrowing proven ideas such as semantic tokens, accessible focus treatment, density scales, responsive behavior, and predictable component variants.

The system will use a token-first architecture: one canonical token source will generate platform-specific outputs for CSS, TypeScript, React, React Native, SwiftUI, and Rails. Each platform package should feel native to that ecosystem while inheriting the same design decisions.

## Name

Working name: **Aurelglyph**

Rationale:

- `Aurel` suggests light, clarity, and a mythic/crafted tone without directly using Tolkien terms.
- `glyph` suggests symbols, tokens, reusable language, and component grammar.
- Initial web searches found no meaningful product, npm, or GitHub collisions for `Aurelglyph`, though this does not replace formal trademark, domain, or registry checks.

## Product Personality

Aurelglyph should support an adaptive visual language with a professional default mode.

The default mode should be calm, legible, and suitable for repeated work in dashboards, admin tools, finance, productivity, and operational apps. It should prioritize:

- Clear hierarchy
- Restrained surfaces
- Strong focus states
- Predictable interaction patterns
- Accessible color contrast
- Efficient information density
- Motion that clarifies state instead of calling attention to itself

Expressive modes may adjust warmth, illustration density, color accents, motion, and tone while preserving the same semantic tokens and component APIs. The system should make it possible to build professional, editorial, and more playful products without fragmenting the core language.

## Architecture

Aurelglyph should be created as a new standalone workspace under `/Users/absessive/workspaces`, with one or more example apps proving package consumption.

The recommended architecture is:

- A canonical token source package
- A token compiler/generator
- Generated platform outputs
- Thin platform adapter packages
- Example apps that consume the packages
- Documentation and contribution guidance
- Automated unit, accessibility, visual, and package-boundary checks

The initial package shape should be:

- `@aurelglyph/tokens`: canonical design tokens and generated TypeScript token exports
- `@aurelglyph/css`: CSS variables, reset/base styles, utility classes where useful, and web theme files
- `@aurelglyph/react`: React components built on Aurelglyph tokens and CSS
- `@aurelglyph/react-native`: React Native/Expo theme objects and components
- `AurelglyphUI`: Swift package exposing SwiftUI tokens, environment values, modifiers, and components for iOS/macOS
- `aurelglyph-rails`: Rails helper/gem or engine exposing stylesheets, helpers, and view conventions for server-rendered Rails apps

Each platform package should consume generated tokens instead of hand-copying values. Component implementations may differ by platform, but names, variants, states, and semantic intent should stay aligned.

## Foundations

The canonical token source should cover:

- Color roles: background, foreground, surface, border, accent, danger, warning, success, info, muted, selected, disabled, focus, overlay
- Typography: font families, size scale, line heights, weights, tracking rules, headings, body text, labels, captions, monospace
- Spacing: compact, regular, and spacious scales
- Radius: none, small, medium, large, pill, circular
- Elevation and depth: shadows, overlays, surface layering
- Motion: durations, easing, reduced-motion behavior
- Density: compact, standard, comfortable
- Breakpoints and adaptive layout rules
- Z-index/layering roles
- Interaction states: hover, active, pressed, selected, focused, disabled, loading, invalid, read-only
- Accessibility rules: contrast targets, hit-area minimums, focus visibility, reduced motion, screen-reader labels

Tokens should distinguish primitives from semantic roles. App teams should consume semantic tokens by default so themes can evolve without forcing widespread code changes.

## V1 Components

V1 should include foundations plus core components sufficient to build real apps.

Core controls:

- Button
- Icon button
- Link
- Text field
- Text area
- Search field
- Number field
- Password field
- Select
- Checkbox
- Radio
- Toggle
- Slider
- Stepper
- Segmented control
- Tabs
- Menu

Rich input:

- File upload/dropzone
- Attachment list
- Microphone input affordance
- Camera input affordance
- Video input affordance
- Image preview
- Media permission state
- Upload progress
- Upload error
- Retry/remove actions

Feedback:

- Alert
- Toast
- Inline validation
- Loading indicator
- Skeleton
- Progress bar
- Empty state
- Error state
- Confirmation dialog

Layout and navigation:

- App shell
- Top bar
- Toolbar
- Sidebar
- Bottom tabs
- List row
- Panel
- Card for repeated items
- Modal
- Sheet
- Drawer
- Breadcrumbs
- Page header

Advanced components such as data tables, charts, command palettes, onboarding flows, advanced editors, and full app templates should be documented as future modules, not v1 blockers.

## Icon And Emoji Language

Aurelglyph should define a curated cross-platform icon naming contract. Implementations may map to platform-native icon systems or bundled vector icons, but product teams should use stable Aurelglyph icon names.

V1 icon names should include:

- `upload`
- `attachment`
- `microphone`
- `camera`
- `video`
- `image`
- `play`
- `pause`
- `record`
- `stop`
- `send`
- `save`
- `search`
- `filter`
- `settings`
- `edit`
- `delete`
- `close`
- `back`
- `forward`
- `check`
- `warning`
- `info`
- `success`

Emojis may be used as content accents, status labels, examples, or expressive mode details. Core controls should use system/vector icons rather than emojis so controls remain consistent, accessible, and localizable.

## Platform Behavior

Web and Rails:

- Expose CSS variables and semantic classes.
- Support progressive enhancement for Rails views.
- Keep server-rendered HTML usable without client JavaScript where practical.
- Provide React components for richer web apps.

React Native:

- Export theme objects and native components for Expo/React Native.
- Align spacing, color, state naming, and component variants with web.
- Respect platform conventions for touch targets, keyboard behavior, safe areas, and permissions.

SwiftUI:

- Export a Swift Package named `AurelglyphUI`.
- Provide token constants, environment values, view modifiers, and native SwiftUI components.
- Support iOS and macOS from the same package where practical.
- Respect platform conventions for focus, keyboard navigation, sheets, toolbars, and system accessibility settings.

## Versioning

Aurelglyph should use semantic versioning across the workspace.

Versioning rules:

- Additive tokens are minor changes.
- Renamed or removed tokens are major changes.
- Backward-compatible component variants are minor changes.
- Component API breaks are major changes.
- Bug fixes and implementation corrections are patch changes.
- Visual tweaks that affect screenshots are minor or patch depending on user-visible impact.

The repo should include:

- Changelog
- Migration notes for breaking changes
- Generated artifact checks
- Package-level tests
- Example-app adoption tests
- Release documentation

## Team Model

A full UX design team should be represented in the project plan and review workflow.

Roles:

- UX Bar Raiser: owns design principles, cross-platform quality, accessibility posture, consistency, and final acceptance.
- UX Designer 1: owns foundations, theming, typography, color, and density.
- UX Designer 2: owns components, interaction states, forms, rich input, and media controls.
- UX Designer 3: owns examples, documentation, usage guidance, and design language storytelling.
- UX Engineer 1: owns token schema, compiler, generated artifacts, and package boundaries.
- UX Engineer 2: owns web, React, CSS, and Rails adapter implementation.
- UX Engineer 3: owns React Native/Expo implementation.
- UX Engineer 4: owns SwiftUI implementation for iOS/macOS, if capacity allows.
- QA/SDET 1: owns automated unit, package, and contract tests.
- QA/SDET 2: owns visual regression, accessibility, platform smoke tests, and release verification.

## Initial Delivery Shape

The first implementation should create a standalone `aurelglyph` workspace and at least one example app consuming the packages.

The first example app should be a React web app because it proves CSS, TypeScript tokens, and component behavior fastest. SwiftUI, React Native, and Rails adapters should still be scaffolded in the same repo with initial token consumption so their package boundaries are real from the start.

The implementation should include:

- Workspace setup
- Token source and compiler
- Generated CSS, TypeScript, React Native, Swift, and Rails-friendly outputs
- Initial React components
- Initial React Native token/theme package
- Initial SwiftUI token package
- Initial Rails stylesheet/helper package
- Documentation site or docs app
- Example app consuming the React/CSS packages
- Tests for token generation and component behavior
- Accessibility and visual QA checks where practical

## Source Control And Publishing

Once the implementation is reviewed and verified, the standalone Aurelglyph workspace should be committed to source control and pushed to a remote repository. The first push should include source files, generated package artifacts when appropriate, documentation, tests, and example app wiring.

Generated files should be committed only when they are package outputs that consumers or release workflows need. Build artifacts, local brainstorm files, dependency directories, and temporary files should be ignored.

## Implementation Defaults

Use these defaults unless the user changes them before implementation:

- Package manager and monorepo tooling: npm workspaces, TypeScript project references where useful, and package-local build scripts.
- Token compiler: a TypeScript script that reads canonical JSON token files and writes generated CSS, TypeScript, React Native, Swift, and Rails-friendly outputs.
- Docs/example app: Vite plus React for the first adoption proof.
- Rails support: start as an importable package with stylesheet output and a small helper module structure; package as a gem once the API is stable.
- Swift support: start with generated Swift token files committed in the Swift package, then expand into generated components and modifiers.
- Source-control target: create the first repo as `aurelglyph`; remote owner, visibility, and publication targets should be confirmed before the first push.
- Release workflow: local builds and tests first, then add CI/release automation after the initial package boundaries pass verification.
