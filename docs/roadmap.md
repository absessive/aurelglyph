# Aurelglyph Roadmap

Current version: `0.8.1`

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

### Current component-gap audit (2026-10-06)

The current Unreleased workspace expansion implements eight complementary
contracts, designed together and verified by adapter-specific tests. These are
not part of the immutable 0.8.0 tag and do not select a release version.

| Slice | Missing family | Contract boundary |
| --- | --- | --- |
| A | Link | Navigation semantics, not a Button variant |
| A | Password Field | Secure entry and localizable reveal without losing native field behavior |
| A | Input Group | One labeled input with logical leading/trailing adornments or actions |
| A | Validation Summary | Declarative issues with field focus/navigation; never owns form state |
| A | Accordion | Coordinated single/multiple disclosure over ExpandableSection |
| B | Chip | Selectable/removable items; static status remains Badge |
| B | Stepper | Ordered workflow state, distinct from NumberField numeric stepping |
| B | Rating | Integer choice with radio/adjustable semantics and a clear action |

The audit uses the official [Material UI catalog](https://mui.com/material-ui/all-components/)
and [Bootstrap catalog](https://getbootstrap.com/docs/5.3/components/accordion/)
as coverage references, not visual templates. Accordion semantics follow the
[WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/);
validation-summary behavior is informed by the
[GOV.UK error-summary contract](https://design-system.service.gov.uk/components/error-summary/).
All package-owned copy must be localizable, and the implementation must cover
CSS, React, React Native, SwiftUI, Rails, examples, and generated previews.

The scoped core-control manifest now certifies 37 families. SearchField,
Switch, Select, Tabs, SegmentedControl, TabBar, Pagination, Progress, and
CommandPalette already had all five adapter implementations and are now included
alongside the 19 interaction foundations, eight essentials, and standalone
ExpandableSection. Unreleased rows distinguish workspace additions from released
contracts. This matrix is still not an exhaustive catalog; a broader support
catalog must distinguish native substitutions and remaining gaps.

React Native also needs a named older-catalog parity project: AppShell, TopBar,
Toolbar, NavigationStack/Page, Sheet, Card, ListSection/Row, Alert, EmptyState,
Avatar, Badge, Breadcrumbs, Toast, Skeleton, Metric, and DataTable remain absent
from its public surface. Accordion closes the standalone ExpandableSection gap
in this change set. The other families remain explicit follow-on work rather
than silent omissions.

### Remaining composition and specialized patterns

Assess the remaining catalog patterns for behavior beyond existing primitives:

- Floating Action Button and Speed Dial need an explicit placement/action
  contract beyond Button/IconButton plus Menu/Popover.
- Navbar and Sidebar should first compose AppShell, TopBar, TabBar,
  NavigationStack, and Toolbar; add first-class APIs only for missing behavior.
- Menubar and responsive navigation composition.
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
