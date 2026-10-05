# Aurelglyph Roadmap

Aurelglyph is aiming for practical component completeness without cloning the
visual language or implementation model of another system. The comparison
baseline is the current official [Bootstrap 5.3 component
catalog](https://getbootstrap.com/docs/5.3/getting-started/introduction/#js-components)
and the [Material UI component
catalog](https://mui.com/material-ui/all-components/). Platform-native behavior,
accessibility, and the Aurelglyph token language remain part of the contract.

Released milestones below describe shipped work. Planned milestones remain
unversioned until their scope and cross-platform evidence are ready for a
release, so roadmap labels do not imply an API or delivery commitment.

## What “feature complete” means

Aurelglyph is feature complete when a product can be built without importing a
second general-purpose UI kit. That requires more than a matching list of names:

- The component has a documented semantic purpose and state model.
- CSS/Web, React, React Native, SwiftUI, and Rails expose an equivalent contract,
  or the manifest documents a deliberate native substitution.
- Keyboard, touch, focus, screen-reader, reduced-motion, high-contrast, light,
  dark, responsive, loading, disabled, read-only, and invalid behavior is tested
  where each state applies.
- Generated assets and examples use the released package surface.
- The canonical `component-manifest.json` is schema-valid, and every stable
  support cell has implementation evidence checked by executable tests.

## 0.5.0 — Interaction foundations

0.5.0 closes the highest-impact gaps shared by Bootstrap and Material UI while
establishing one declared interaction contract across every adapter, with
platform and browser tests for applicable behavior and accessibility.

- Overlays: Dialog, Drawer, Menu/Dropdown, Popover, and Tooltip.
- Actions: Icon Button and Button Group.
- Forms: Checkbox, Radio Group, Slider, Number Field, and
  Combobox/Autocomplete.
- Feedback: Spinner.
- Layout: Divider, Surface/Box, Stack, Container, and responsive Grid.
- Existing-control completion: shared disabled, loading, read-only, invalid,
  focus, keyboard, dismissal, and reduced-motion behavior.
- Delivery infrastructure: a machine-readable component manifest, generated
  support matrix, expanded live example, and browser/accessibility regression.

## 0.6.x — Responsive and integration hardening

The 0.6 series made the existing catalog production-ready across compact
portrait, phone landscape, tablet, split-view, and wide layouts. It also added
the React Native consumer host, native modal overlay contracts, Rails and React
interaction hardening, typography packaging, and the full lint, native, and
browser accessibility release gates.

## 0.7.0 — Quiet appearance and UX completeness

0.7.0 adds the opt-in quiet appearance across tokens, CSS, React, React Native,
SwiftUI, Rails, examples, and generated previews. Near-white and charcoal
surfaces, a restrained violet signal palette, smaller radii, and flatter
elevation keep the interface simple while preserving Aurelglyph semantics and
typography. Contrast-safe control boundaries, selected-state signals,
keyboard focus, preference persistence, page announcements, responsive checks,
and atelier compatibility complete the shared UX contract.

## 0.8.0 — Production foundation and internationalization

0.8.0 makes the existing framework safer to adopt and release. It closes stale
controlled-value handling, adds bidirectional keyboard and logical-layout
behavior across React and Rails, strengthens themed dropdown fallbacks, and
adds React server-render/hydration evidence. A real SwiftUI consumer host now
exercises compact presentation and recovery, disabled-row semantics,
localizable copy, accessibility-sized scrolling, and accessibility values in
light/dark atelier and quiet appearances; package tests cover the enabled-item
navigation helpers.

Optional supporting copy now uses the shared More Information disclosure
instead of permanently occupying primary work surfaces; validation and live
status remain inline. React Native overlays use the maintained safe-area
context contract rather than the deprecated core safe-area view.

The release also adds pinned toolchains, clean-consumer npm and gem smoke tests,
package-size budgets, time-bounded security triage, reproducible CI on Web,
Rails, SwiftUI, and React Native hosts, and a source-only pre-1.0 release path
with provenance-enabled registry publication staged for 1.0.0. The compatibility
policy makes browser, platform,
semantic-versioning, deprecation, and pre-1.0 limits explicit.

## Planned — Catalog expansion

Finish the remaining core Bootstrap and Material UI catalog gaps:

- Link, Chip, Rating, Floating Action Button, Speed Dial, and Stepper.
- Input Group, Password Field, and richer validation summaries.
- Accordion as a first-class alias and contract over expandable sections.
- Navbar, Sidebar, Menubar, and responsive navigation composition.
- Carousel, Scrollspy, Image List, and Timeline/Masonry primitives.
- Transfer List where it is an appropriate desktop/tablet pattern, with a native
  selection-flow alternative documented for compact mobile surfaces.

## Planned — Advanced inputs and data

Cover the component families commonly supplied by larger application suites:

- Date, time, date-range, and calendar pickers with locale/time-zone behavior.
- Data Grid with sorting, filtering, selection, column visibility, pagination,
  virtualization, empty/loading/error states, and export hooks.
- Tree View, advanced list virtualization, and drag/reorder primitives.
- Chart components over the existing chart tokens, with accessible summaries.
- Attachment list, image preview, upload queue/progress/error/retry/remove, and
  camera/microphone/video permission states.

## Planned — System completeness

Make completeness operational rather than component-count driven:

- Locale-aware formatting and broader long translated-copy regression beyond
  the bidirectional layout, keyboard, and localizable native copy shipped in
  0.8.0.
- Density modes, responsive visibility/layout utilities, typography utilities,
  and stable portal/transition/media-query APIs where a platform needs them.
- Form composition and validation APIs that integrate with native forms and
  popular React form libraries without owning application state.
- Automated visual snapshots across themes, modes, contrast preferences,
  reduced motion, viewports, and representative interaction states.
- Performance budgets, SSR/hydration checks, package-size checks, migration
  guides, and API deprecation policy.

## 1.0.0 — Stable product-system contract

1.0 requires the core and advanced manifests to be green on every supported
adapter, WCAG 2.2 AA verification for applicable web interactions, documented
native substitutions, production examples, and a compatibility policy. A
component count alone is not a release gate.
