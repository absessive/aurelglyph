# Compatibility and support

Aurelglyph follows semantic versioning across its npm packages, Rails gem, and
Swift package. All public adapters share one release number. Applications
should pin an exact version; reusable libraries may use a compatible minor
range after validating their own supported platforms.

## Supported environments

| Surface | Supported baseline |
| --- | --- |
| CSS and React | Current and previous major releases of Chrome, Edge, Firefox, and Safari; iOS Safari 17+ |
| React | React 19.1 and 19.2; client components in React Server Component applications |
| React Native | React Native 0.86 and 0.87; iOS 15.1+ and Android API 24+ consumer hosts |
| SwiftUI | Swift tools 5.9+, iOS 17+, and macOS 14+ |
| Rails | Rails 7.2 on Ruby 3.1+; Rails 8.1 on Ruby 3.4+ |
| Workspace tooling | Node 22.13+ and npm 10+ |

The full web accessibility and responsive suite runs in Chromium. A smaller
cross-browser contract runs in Chromium, Firefox, and WebKit for native select
fallback theming, light/dark mode, menu dismissal, and focus restoration.
SwiftUI and React Native each have a real iOS Simulator consumer host. The React
Native gate also creates a minified Android production bundle and validates its
native project configuration.

Clean-consumer package tests install React 19.1 and 19.2 plus React Native 0.86
and 0.87 with normal strict peer resolution. The Rails CI matrix executes the
same package suite against Rails 7.2/Ruby 3.1 and Rails 8.1/Ruby 3.4. Broader
versions admitted by package metadata are install-compatible ranges, not an
untested release-matrix claim.

## API stability

- Patch releases contain compatible fixes and documentation corrections.
- Minor releases may add APIs and may deprecate an older API, but do not remove
  a supported public API without a documented exceptional reason.
- Major releases may remove deprecated APIs and change defaults. Migration
  notes are required before the release is tagged.
- Deprecations remain available for at least one minor release. They must name
  the replacement in documentation and, where practical, in a development-time
  warning.
- Tokens, component names, variants, interaction semantics, generated assets,
  and accessibility behavior are part of the public contract.

## Native and browser substitutions

Aurelglyph preserves native behavior when a platform provides the safer or more
accessible implementation. Web selects use the standards-based customizable
picker where supported and retain a themed native control everywhere else.
SwiftUI and React Native components use platform presentation and accessibility
APIs while sharing Aurelglyph naming, tokens, state semantics, and visual tone.

React Native applications must render `SafeAreaProvider` from
`react-native-safe-area-context` above `AurelglyphProvider`, or pass explicit
overlay insets while deliberately delegating host ownership. Consumer-owned
native modal roots need an inner `AurelglyphOverlayHost` when tooltips or
anchored surfaces must appear above modal content.

## Security and release evidence

Every release must pass linting, type checks, unit tests, package builds,
server-render/hydration coverage, browser accessibility checks, native consumer
hosts, package/gem clean-consumer smoke tests, synchronized version checks, and
the reviewed dependency-audit policy. Time-bounded audit exceptions are kept in
`security/npm-audit-policy.json` and fingerprint the advisory identity, advisory
and affected ranges, severity, and installed dependency path. Expired, changed,
stale, or unreviewed fingerprints fail the release gate.

The release workflow builds and preflights every registry artifact, publishes
npm packages with provenance in dependency order, publishes the Rails gem, and
creates the GitHub release only after the release contract succeeds. Retries
verify and skip exact-version artifacts with matching integrity, so a partial
registry outage is recoverable and mismatched immutable artifacts fail closed.
The protected `release` environment requires `NPM_BOOTSTRAP_TOKEN` for new npm
package names and `RUBYGEMS_API_KEY` for a missing gem version; npm trusted
publishing handles later versions. These credentials and the environment must
be configured by the repository owner.

## Known scope limits before 1.0

Aurelglyph does not yet claim the advanced data, calendar/date-time, virtualized
list, tree, chart, or media-permission catalog planned on the roadmap. The
machine-readable component manifest currently describes the interaction-
foundation subset; the broader catalog remains documented in platform package
guides and will move into a support-status manifest before 1.0.

These are declared product-scope limits, not permission to ship inconsistent
behavior in the components already marked stable. Stable components must retain
keyboard, touch, focus, assistive-technology, reduced-motion, light/dark,
responsive, invalid, loading, disabled, and read-only behavior where applicable.
