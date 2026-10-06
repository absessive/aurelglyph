# Aurelglyph SwiftUI smoke host

This private iOS application consumes the repository-root `Package.swift`, the
same Swift Package Manager entry point used by external applications. Its
workbench exercises light and dark modes, atelier and quiet appearances,
adaptive select and menu presentation, a native dialog, and representative form
states and eight unreleased catalog essentials: Link, Chip, PasswordField,
InputGroup, ValidationSummary, Accordion, Stepper, and Rating. Optional form
guidance is kept behind the reusable, compact `AurelglyphMoreInformation`
disclosure instead of occupying the primary work surface.

Run a release-mode simulator build without launching a device:

```bash
npm run build:ios
```

Run the native UI contract on an available iPhone simulator:

```bash
npm run test:ios
```

The UI suite verifies launch, select and menu interaction, dialog and contextual
information presentation, long contextual-copy scrolling at an accessibility
text size, and the reliable XCTest accessibility audit categories available on
iOS 17 or newer. It also verifies separate chip selection/removal, unavailable
link semantics, single-open/disabled accordion behavior, direct rating/clear and
required/read-only states, password conceal/reveal with retained focus/value,
summary field-focus actions, and localized catalog reachability at accessibility
text sizes. The `-aurelglyph-catalog` launch argument selects the focused catalog
specimen without changing the existing workbench contract. All nine declared
tests must pass exactly once. Xcode and an installed iOS Simulator runtime are
required.

Keyboard assertions also require an on-screen software keyboard with hittable
keys, including Done. The runner does not change Simulator keyboard preferences;
a missing key is a prerequisite failure, not a passed native interaction check.

The optional `-aurelglyph-entry-diagnostics` fixture inspects native caret, focus,
secure-entry, and replacement-range state without recording secret contents.
It is absent from the normal workbench and the production-path password test.
