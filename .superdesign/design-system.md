# Aurelglyph component expansion

Aurelglyph is a token-first standalone UX language for React/CSS, Rails, React Native, and SwiftUI. Preserve “Warm precision. Quiet systems. Obsessive details.”

This target is a self-contained reusable-component specimen board, not a redesign of the existing example. The draft guides implementation without setting a release version or replacing platform-native component APIs.

## Visual source of truth

Use the canonical tokens summarized at the top of `.superdesign/init/theme.md`. Prefer quiet near-white light surfaces with an equivalent charcoal dark presentation. Retain atelier compatibility and all six accent preferences in actual adapters. Royal-purple is the personalized default.

Typography: Atkinson Hyperlegible for all controls; Libre Baskerville only for the small editorial board heading; Space Mono only for tiny component/category labels. Compact clean panels, thin boundaries, visible focus, minimal depth. No gradients, decorative texture, marketing hero, new logos, extra explanation, or excessive mono/uppercase. The specimen board intentionally has no logo position or app navigation shell.

Use the existing Button, IconButton, Badge, TextField, RadioGroup and ExpandableSection styles. New paint must be expressed with existing semantic tokens; add canonical tokens first only if a genuinely new role is necessary. Quiet interactive text uses readable foreground or focus tokens, not low-contrast accents. Errors remain visibly inline; optional educational detail belongs in More Information.

## Candidate first expansion batch

1. Link: distinguish navigation from actions; enabled/external state, visible underline/focus, native link semantics. An unavailable destination must render a labeled non-navigable placeholder with no href/destination, activation handler, context-menu link action, or Tab stop, plus an accessible unavailable state. aria-disabled alone never disables navigation.
2. Chip: interactive selection and/or removal; ordinary static labels remain Badge. Use a selection button and separately labeled sibling remove action. Never nest buttons. Selected and disabled states must remain clear without relying on color alone.
3. Password Field: masked text entry with a separately labeled show/hide button; preserve field value, selection and focus; integrate native password managers/autofill; disabled/loading/read-only/error states.
4. Input Group: labeled field with prefix/suffix text or an independently accessible action; one field label/error contract, wrapping at narrow widths, no duplicated input ownership.
5. Validation Summary: concise form-error heading and links/actions to invalid fields, supplied errors only; no invented validation engine, no success text when empty, no secret values in announcements. Focus/announce once after a failed submission at the application's request; avoid repeated alerts and duplicate inline-error announcements.
6. Accordion: grouped controlled/uncontrolled expandable sections, single/multiple-open policy, disabled items, real header/panel relationships, explicit heading hierarchy. Preserve ExpandableSection as the independent disclosure API.
7. Stepper: ordered workflow status, current/completed/upcoming/error states, optional enabled navigation callback, no router or workflow engine. Use readable numbered/check/error indicators; wrap or stack on phones.
8. Rating: whole-number 0-to-max choice with clear action, read-only/disabled/required/invalid states, radio/adjustable semantics, meaningful value label and keyboard/native accessibility. Reuse the existing Web/Swift/Rails star vocabulary and add React Native's missing star vector/name before implementing Rating; never use emoji.

## Board composition

Two adjacent equal columns labeled Light / Dark, each containing matching compact samples of all eight families. At phone widths stack columns. Include a selected removable chip, masked password and error, labeled prefix/suffix amount field, two-error summary, three-section accordion with one expanded, four-step workflow, and 3-of-5 rating with clear action. Use minimal practical specimen copy, not tutorial prose.

## Implementation contract after approval

Apply the affected component contracts across CSS, React, React Native, SwiftUI, Rails, generated support matrix/static preview, and real examples in one changeset. Publish evidence, not just component counts. Preserve semantic HTML, RTL, responsive targets, hydration, native screen-reader values, reduced motion and light/dark themes. Reuse framework-native primitives where appropriate.

The current manifest covers 19 interaction foundations, not the entire component catalog. Nine existing five-adapter families (SearchField, Switch, Select, Tabs, SegmentedControl, TabBar, Pagination, Progress, CommandPalette) are missing from that manifest. Broaden coverage or explicitly scope an expansion manifest; do not imply an exhaustive catalog by merely appending new rows. Accordion also requires a native ExpandableSection. Older RN shell/feedback/data-display omissions must be documented as a separate parity project.

Gate implementation in two reviewable slices: A = Link, PasswordField, InputGroup, ValidationSummary, Accordion; B = Chip, Stepper, Rating. Package-owned Show/Hide, Remove, selection, validation, step-state, and rating phrases must be localizable from day one; extend native control-copy environments and accept explicit Web/Rails copy rather than assembling English fragments.

React Native currently has a narrower icon vocabulary than the Web catalog. Add the required star, eye, eye-off, external-link, warning, expand, and contract names/vectors to its existing curated icon contract where these controls use them; reuse the canonical React path geometry rather than inventing alternative symbols. Existing check/close/chevron icons remain reusable.

Tests before and after: `npm run lint`, `npm run test:unit` (targeted Vitest first), `npm run typecheck`, package builds, Rails tests, Swift package tests, native renderer/host tests, browser/accessibility/UX checks. QA review is required. Do not modify the immutable v0.8.0 tag, release workflow, or publication state as part of this task; npm/RubyGems publication remains future 1.0.0.

Advanced calendar/time-zone/data-grid/tree/virtualization/chart/upload-queue families remain separately designed projects, not incidental additions to this batch. Existing AppShell/TopBar/TabBar/Dropdown/Pagination are not missing and must not be duplicated.

## Design review state

The preview project is https://superdesign.dev/teams/cc0d7e9e-0486-4a46-87be-5428bf400a54/projects/0bb4cf64-dafe-45c9-94c4-0e45375a8a5a. Its active draft is https://p.superdesign.dev/draft/66ee13f1-eba7-4199-b72a-1ced6ef573d8, version 3: matching compact light/dark specimens for all eight families. A deterministic import corrected the draft's accessibility, compactness, semantic colors, and packaged-font references. Source inspection verifies content, not rendered visual QA. Implementation uses canonical tokens and native APIs; release versions and publication state remain unchanged.
