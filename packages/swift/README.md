# AurelglyphUI Swift Package

SwiftUI tokens, typography, icons, and native Aurelglyph components for iOS 17
and macOS 14 or newer.

The public Git package lives at the repository root:

```swift
.package(url: "https://github.com/absessive/aurelglyph.git", from: "0.4.1")
```

```swift
.product(name: "AurelglyphUI", package: "aurelglyph")
```

Register the packaged OFL TTF files before using the typography roles:

```swift
AurelglyphFontRegistry.registerFonts()

Text("Aurelglyph")
  .font(AurelglyphTypography.displayLarge)

Text("Calibrated systems")
  .font(AurelglyphTypography.display(size: 48, relativeTo: .largeTitle))
```

Packaged custom faces keep their requested baseline and scale relative to the
supplied Dynamic Type role; a system fallback still preserves the requested
baseline size. The generic `font` factory defaults display to
`.largeTitle`, editorial serif to `.title3`, UI/body to `.body`, and mono to
`.caption`. Registration validates every expected PostScript face and only
falls back the individual face that is unavailable.

`AurelglyphExpandableSection` follows the system Reduce Motion setting: its
disclosure state changes immediately without the reveal animation when enabled.

The npm manifest in this directory is private and exists only to coordinate
monorepo generation; Swift consumers should use Swift Package Manager.
