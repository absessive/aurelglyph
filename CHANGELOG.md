# Changelog

## Unreleased

## 0.8.0

- Establish the 0.8 production release foundation with checked-in Web, Rails,
  SwiftUI, and React Native CI; controlled GitHub publication and a staged npm
  provenance/RubyGems path for 1.0.0; pinned Node and Rails toolchains;
  synchronized dependency and
  lockfile version checks; promoted release-note validation; clean-consumer npm
  and gem smoke tests; strict-peer React 19.1/19.2 and React Native 0.86/0.87
  consumer installs with SSR and type compilation; package-size budgets; and an
  explicit compatibility, semantic-versioning, deprecation, and support policy.
  Pre-1.0 and prerelease tags now remain source-only by policy and prereleases
  are marked correctly on GitHub. The stable 1.0.0 registry path
  preflights all artifacts, uses a qualifying pinned
  trusted-publishing toolchain, and recovers from partial failures by verifying
  and skipping exact matching immutable versions. CI and release jobs pin Linux
  runner images and external actions to immutable revisions, receive automated
  weekly action-update proposals, and restrict write and OIDC permissions to the
  exact publication jobs that require them. GitHub release creation verifies and
  skips an exact existing release, including after an ambiguous publication
  response, so workflow retries remain idempotent. The exhaustive UX and
  cross-browser harnesses now bound process-group and HTTP-server teardown, and
  the UX harness fails fast outside POSIX environments, so a completed audit
  cannot leave CI hanging. Custom UX artifact
  roots are constrained to workspace or temporary-directory descendants, and
  each audit writes to a fresh child without recursively deleting caller data.
  Direct `npm test` now builds ignored package artifacts before checking them;
  CI reuses its explicit build through the non-duplicating unit-test entry.
  Consumer documentation labels 0.8.0 as a GitHub/source release so registry
  install examples cannot be mistaken for already-published packages.
  Raise the Rails adapter floor to maintained Ruby 3.3 and lock its Rails 7 and
  default development graphs to patched Nokogiri 1.19.4; end-of-life Ruby 3.2
  and earlier are no longer claimed as secure supported runtimes.
  Add Bundler advisory checks to both Rails matrix jobs and the local release
  contract so future Ruby lockfile vulnerabilities fail before publication.
  Pin the workspace to current Ruby 3.4.11, run the Rails 7 floor on Ruby 3.3,
  reject stale interpreter patches in the security gate, and assert the public
  gem rejects Ruby 3.2 while accepting Ruby 3.3. Load Ruby's URI library
  explicitly before Action View helpers so the Rails 7 contract is independent
  of removed interpreter-default side effects. Pin the Android consumer wrapper
  to the Gradle 9.4.1 minimum required by the React Native 0.87 plugin and verify
  its distribution checksum before compiling the release APK. Align the host's
  SDK, Kotlin, and AGP 9 compatibility settings with the upstream 0.87 template
  so the explicitly applied Kotlin plugin and native Android build remain valid,
  and resolve the platform-specific Hermes compiler executable from the
  monorepo's hoisted dependency graph. Make every React Native consumer-host
  test rebuild the package before bundling so stale ignored artifacts cannot
  invalidate native regression results, and make the iOS Select assertion
  re-query the native combobox while reporting its observed accessibility value
  on failure.
- Harden internationalized Web and Rails behavior with logical CSS geometry and
  direction-aware Tabs, SegmentedControl, and selection-group navigation.
  Normalize stale or disabled controlled Combobox values so display, form
  submission, and native required validity agree, while keeping controlled
  selections editable when their search query remains internally managed.
  Declare the React entry as a client boundary and add server-render/hydration
  evidence plus Chromium, Firefox, and WebKit fallback coverage for selects,
  modes, menus, and restored focus.
- Move focus into React Popover and More Information dialog surfaces when they
  open, preferring their first interactive child and falling back to the labeled
  panel for explanatory-only content, while preserving Escape focus restoration
  and the existing Rails interaction contract.
- Upgrade the private React Native consumer host to the 0.87 toolchain while
  retaining declared 0.86 compatibility. Gate releases with a reviewed,
  expiring security policy: public packages permit no unreviewed runtime
  advisories, while the remaining native-host tooling exceptions are isolated
  from published packages, fingerprinted by advisory, affected range, severity,
  and dependency path, and must be renewed or removed before expiry. Include
  the SwiftUI smoke host in shared workspace-version checks.
- Add a shared More Information disclosure across React, React Native, SwiftUI,
  and Rails so optional supporting copy moves out of primary working surfaces
  while validation errors and live status remain visible. React Native overlays
  now use the maintained safe-area-context implementation instead of the
  deprecated core SafeAreaView. Publish all 19 families and 95 platform claims
  with component-specific React Native implementation evidence. The Android
  consumer gate now compiles a release APK through Gradle with a pinned JDK,
  exercising the native scaffold, Kotlin compilation, autolinking, and packaged
  JavaScript rather than stopping at CLI configuration and Metro output.
- Make React Native-owned state, action, selection, file, pagination, and modal
  copy replaceable through a scoped control-copy provider while retaining
  component-level overrides. Keep Switch descriptions and read-only state on
  the focused native control, and expose Select and Combobox selections as the
  trigger's native accessibility value. Document and enforce the RN 0.87
  source-RNCore CocoaPods workaround, and bundle clean consumers against both
  RN 0.86 and 0.87. Expand the native host across theme, Select/Menu,
  disabled-row, and More Information interactions. Bound SwiftUI More
  Information content in a scrollable region and verify long copy at an
  accessibility text size.
- Theme dropdown surfaces end to end. Web and Rails selects retain native form,
  validation, keyboard, and no-script behavior while progressively adopting the
  standards-based customizable picker with Aurelglyph surfaces, focus rails,
  option states, radii, elevation, and quiet light/dark paint. Older browsers
  retain a mode-aware native picker with explicitly themed option colors.
  SwiftUI menus and selects now present tokenized Aurelglyph popovers instead of
  unstyled system menus, with localizable state copy, enabled-item arrow/Home/End
  traversal, Escape dismissal, and trigger focus restoration; React, React
  Native, examples, and regression coverage document and enforce the same
  dropdown contract.
- Close release-candidate web edge cases: React tab relationships remain unique
  for URI-like and literal item identifiers; Arrow Up opens menus on the last
  enabled item without a focus race; rich menu labels expose an explicit
  typeahead value; controlled Tabs and SegmentedControl documentation
  demonstrates live state updates; and the standalone preview uses the canonical
  semantic success and danger colors.
- Align the public browser baseline with the evidence actually run for 0.8.0:
  pinned Playwright Chromium, Firefox, and WebKit engines. Previous-major,
  branded Edge/Safari, and physical iOS Safari coverage remain explicit pre-1.0
  evidence work instead of unsupported release claims.

## 0.7.0

- Add the opt-in `quiet` appearance across canonical tokens, CSS and React,
  React Native, SwiftUI, Rails, the live example, generated Pages, and the
  static preview. Quiet light mode uses near-white neutral surfaces, quiet dark
  mode uses a compact charcoal scale, both share one restrained violet signal
  palette, and smaller radii and flatter elevation reduce visual ornament while
  preserving Aurelglyph typography, semantics, focus, status colors, and
  accessibility. The existing `atelier` appearance and six accent themes remain
  the default compatibility contract.
- Expand unit and real-browser regression coverage for independent quiet
  light/dark resolution, reduced-accent behavior, responsive layouts, and
  atelier compatibility across package adapters and consumer previews. Complete
  the interaction contract with 3:1 quiet control boundaries, explicit
  selected-state indicators, contrast-safe React Native signal roles,
  mode-synchronized browser chrome, gallery preference persistence, branded
  keyboard focus, route announcements, and quiet hover/pressed feedback. Make
  the native iOS host gate wait for an interactive launch surface and use one
  bounded fresh-process retry for unresolved simulator automation failures.
  Re-baseline the public roadmap so shipped 0.7.0 scope is distinct from future
  catalog, advanced-data, and system-completeness work.

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
