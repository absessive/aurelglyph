# Changelog

## 0.6.1

- Add a private React Native 0.86 iOS and Android host that consumes the built
  adapter as an application dependency, plus renderer coverage, an Android
  release-bundle and native-configuration smoke check, and a release-mode iOS
  XCTest contract for consumer-owned modal overlay layering, anchor and
  viewport remeasurement, clipping, and touch pass-through.
- Add a zero-warning workspace ESLint flat configuration and include it in the
  full verification gate, including the packaged Rails interaction controller.
  Resolve the surfaced React and React Native hook dependencies, and make
  invalid helper text use the native danger and live announcement treatment
  even without a separate error string.

## 0.6.0

- Harden compact portrait, phone landscape, tablet/split-view, and wide-window
  behavior across Web, React, React Native, SwiftUI, generated Pages, and the
  static preview: constrained overlays remain reachable, navigation and action
  groups adapt without clipping, data surfaces scroll deliberately, and native
  controls preserve platform-sized interaction targets. React Native providers
  can defer overlay-host ownership to the application, and consumer-owned
  native modals can install an inner host for correctly layered tooltips.
  Shared CSS AppShell rails now respond to their own container width and retain
  the flexible body row when optional chrome is absent. React and Rails
  anchored surfaces honor nested clipping scrollports as well as the visual
  viewport, and dismiss
  rather than detach when their anchor leaves those bounds. React menu keyboard
  focus no longer scrolls a collision-shifted surface away from its anchor.
- Expand the real-browser UX gate to reject browser auto-scaling, clipped
  headings, escaped controls and anchored surfaces, missing responsive viewport
  metadata, and layout overflow across 44 full mode/viewport audits, 44
  accessibility-tree audits, 41 additional responsive probes, and desktop,
  compact, and landscape interaction suites. Each interaction viewport uses an
  isolated disposable Chrome process so instrumentation from one suite cannot
  contaminate the next suite's timing or lifecycle. A CDP transport timeout
  receives one recorded fresh-process retry; product, layout, and accessibility
  assertions still fail immediately. Interactive text colors switch directly between
  contrast-verified theme endpoints instead of passing through a nonconformant
  transition color.

## 0.5.0

- Add 18 interaction and layout families across CSS, React, React Native,
  SwiftUI, and Rails with shared naming, states, accessibility, and responsive
  behavior.
- Harden overlay focus and dismissal, unavailable form states, finite numeric
  bounds, bounded pagination, and responsive data and layout controls.
- Expand the React Native adapter with native theme, icon, navigation, form,
  selection, and overlay contracts, and bring SwiftUI presentation,
  interaction, layout, and theme APIs to parity.
- Add Rails progressive-enhancement helpers and controllers with generated
  cross-platform CSS, JavaScript, and token outputs.
- Publish a machine-readable component manifest, JSON Schema, support matrix,
  and staged roadmap toward 1.0 feature completeness.
- Expand the live gallery, static preview, package guides, and consuming
  documentation across light and dark modes and all six accent themes.
- Add a reproducible headless-Chrome and axe UX gate across 28 responsive
  contexts, plus broader adapter, contrast, package-contract, and
  dependency-security coverage.

## 0.4.1

- Make React `Sheet` a genuinely modal controlled component with native
  `showModal()`/`close()` lifecycle, accessible title association, focus entry
  and restoration, Escape/backdrop/native-close reasons, and a tested fallback
  that also isolates background content and locks scrolling.
- Give Rails sheets the same accessible modal lifecycle through a packaged,
  framework-neutral controller with trigger/dismiss attributes, Turbo-aware
  initialization, controlled server intent, focus restoration, and fallback
  isolation; connect generated titles with `aria-labelledby`.
- Rebuild Rails helpers with ActionView tag builders so ordinary ERB output is
  safe markup, untrusted values remain escaped, and all 105 curated icons emit
  SVG paths identical to the React adapter, including a visible disclosure
  affordance.
- Add native Rails `<details open>` styling, mode-aware status and accent inks,
  WCAG-conformant focus indicators across every accent theme, and reduced-motion
  fallbacks for shared CSS, generated Pages disclosures, and SwiftUI animation.
- Add explicit dark/light chart roles for CSS, React Native, SwiftUI, and Rails,
  with executable contrast coverage for every semantic mark and surface.
- Add rendered jsdom modal tests, real ActionView integration and injection
  tests, cross-adapter icon parity assertions, and executable contrast checks.
- Extend version synchronization to consumer-facing root, Swift, and consuming
  guides so install examples cannot silently lag behind the package release.

## 0.4.0

- Replace the packaged typography set with a more distinct OFL stack:
  Libre Baskerville for display/editorial text, Atkinson Hyperlegible for
  UI/body copy, and Space Mono for technical labels and code.
- Update CSS WOFF2 assets, Swift TTF assets, token font families, generated
  Pages typography, README guidance, and font license attribution.
- Package matching WOFF2 assets with Rails and native-safe font aliases plus TTF
  assets with React Native so every supported adapter can use the new stack.
- Preserve Dynamic Type-relative Swift custom fonts, validate registered faces
  exactly, use available faces independently, and preserve requested fallback sizes.
- Add checksum-verified font synchronization, complete OFL notices, package
  READMEs/licenses, safe private build-harness manifests, and broader Rails and
  Swift verification.
- Add accessible light-mode controls to generated Pages and the static preview,
  correct light-mode accent contrast, prevent code clipping, and improve preview
  responsiveness and version synchronization.

## 0.3.0

- Add Phase 2 and Phase 3 component support across React, SwiftUI, Rails, CSS, docs, and examples.
- Add Phase 2 app controls: navigation stack, toolbar, sheet, segmented control, select, alert, empty state, avatar, and badge.
- Add Phase 3 workbench controls: tabs, breadcrumbs, toast, progress, skeleton, metric, data table, pagination, and command palette.
- Extend Rails helpers, SwiftUI components, generated Pages, and the React Vite example to show the same component contract.
- Clarify Phase 2 and Phase 3 documentation so examples describe concrete app structure, feedback, data, and command use cases.
- Update the React example so the sheet opens from an explicit control instead of rendering as an always-open preview surface.

## 0.2.0

- Add Phase 1 mobile foundation components across React, SwiftUI, Rails, and docs.
- Publish the shared component CSS through `@aurelglyph/css` and the generated Rails stylesheet so raw CSS, React, and Rails consumers render the same starter controls.
- Add SwiftUI app shell, top bar, tab bar, cards, lists, search, and switch controls with cross-platform iOS/macOS-safe styling.

## 0.1.1

- Add iOS-compatible Swift font assets, runtime font registration, and custom-font typography roles.

## 0.1.0

- Establish the first Aurelglyph cross-platform design-system workspace.
- Add GitHub Pages usage, components, and changelog pages.
- Add the GitHub Pages custom-domain CNAME for `aurelglyph.absessive.com`.
- Add React component previews with theme and accent switching.
- Expand the Aurelglyph icon catalog for common web and iOS app surfaces.
- Add Rails and Swift icon-name helpers for cross-platform adoption.
- Add a native SwiftUI typography adapter for Aurelglyph display, UI/body, and mono roles without bundling web WOFF2 font files into Swift packages.
- Correct the `git-branch` icon shape, add `thumbs-up`, `thumbs-down`,
  `help`, `notification`, `expand`, and `contract` icons, and temporarily remove
  `key` pending a better glyph.
- Add animated expandable section components for React and SwiftUI, plus a
  server-rendered Rails disclosure helper.
- Document generic icon usage and per-component React usage for Button,
  ExpandableSection, TextField, TextArea, and FileUpload.
- Package OFL WOFF2 files for Newsreader, IBM Plex Serif, IBM Plex Sans, and
  JetBrains Mono as the Aurelglyph font set.
- Copy the packaged font files into the generated GitHub Pages output so
  static docs use the same typography without external font requests.
- Replace the earlier bundled font stack with OFL-licensed packaged fonts so
  Aurelglyph code can stay MIT while font files retain their own license.
- Improve light-mode primary button contrast across supported accent themes.
