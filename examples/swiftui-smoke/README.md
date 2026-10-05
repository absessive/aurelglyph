# Aurelglyph SwiftUI smoke host

This private iOS application consumes the repository-root `Package.swift`, the
same Swift Package Manager entry point used by external applications. Its
workbench exercises light and dark modes, atelier and quiet appearances,
adaptive select and menu presentation, a native dialog, and representative form
states. Optional form guidance is kept behind the reusable, compact
`AurelglyphMoreInformation` disclosure instead of occupying the primary work
surface.

Run a release-mode simulator build without launching a device:

```bash
npm run build:ios
```

Run the native UI contract on an available iPhone simulator:

```bash
npm run test:ios
```

The UI suite verifies launch, select and menu interaction, dialog and contextual
information presentation, deterministic accessibility-size layout, and the
reliable XCTest accessibility audit categories available on iOS 17 or newer.
Xcode and an installed iOS Simulator runtime are required.
