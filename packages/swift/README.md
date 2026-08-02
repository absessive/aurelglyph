# AurelglyphUI Swift Package

SwiftUI tokens, typography, icons, and native Aurelglyph interaction components
for iOS 17 and macOS 14 or newer.

The public Git package lives at the repository root:

```swift
.package(url: "https://github.com/absessive/aurelglyph.git", from: "0.5.0")
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

## Theme environment

Install a mode and accent once near the application root. `.system` follows the
device appearance; light mode uses the warm drafting-paper neutrals rather than
pure white. Royal purple is the default accent, with amber, forest, deep blue,
cyan, and steel also available.

```swift
WorkbenchView()
  .aurelglyphTheme(
    AurelglyphTheme(mode: .system, accent: .royalPurple)
  )
```

The environment resolves semantic `AurelglyphPalette` colors for surfaces,
borders, foregrounds, status colors, overlays, and active controls. Existing
shell components now use this environment instead of forcing a dark background.
Accent, control-fill, focus, and accent-foreground roles follow the canonical
mode-specific token mapping rather than reusing one raw accent shade.
Interactive labels use the foreground role in both modes, including inactive
tabs, segmented options, and icon controls; muted text remains reserved for
supporting descriptions and metadata.

## Interaction foundations

The 0.5 interaction layer uses native SwiftUI presentation and accessibility
behavior while preserving shared Aurelglyph naming:

- Presentation: `AurelglyphDialog`, `AurelglyphDrawer`, `AurelglyphMenu`
  (`AurelglyphDropdown` alias), `AurelglyphPopover`, and
  `AurelglyphTooltip`.
- Actions and forms: `AurelglyphIconButton`, `AurelglyphButtonGroup`,
  `AurelglyphCheckbox`, `AurelglyphRadioGroup`, `AurelglyphSlider`,
  `AurelglyphNumberField`, and `AurelglyphCombobox`
  (`AurelglyphAutocomplete` alias).
- Feedback and structure: `AurelglyphSpinner`, `AurelglyphProgress`,
  `AurelglyphDivider`, `AurelglyphSurface` and flat-default `AurelglyphBox`,
  `AurelglyphStack`, `AurelglyphContainer`, and `AurelglyphGrid`.

Form controls expose native bindings and, where applicable, disabled, loading,
read-only, error, mixed, and per-option disabled states. Labels, values, selected
traits, modal traits, help hints, and dismissal controls are included in the
component accessibility contract. Interactive targets retain a minimum 44-point
hit area on iOS. Control errors are announced with the focused field, and built-in
dialog, drawer, pagination, command-palette, and combobox copy can be overridden
for localization. Shared state phrases and generated labels can be replaced once
per hierarchy with `.aurelglyphControlCopy(AurelglyphControlCopy(...))`.

```swift
@State private var showingArchive = false
@State private var retries = 2.0
@State private var query = ""
@State private var destination: String?

var body: some View {
  AurelglyphContainer {
    AurelglyphStack(spacing: 16) {
      AurelglyphNumberField(
        "Retries",
        value: $retries,
        in: 0...10,
        step: 1
      )

      AurelglyphCombobox(
        "Destination",
        options: destinations,
        query: $query,
        selection: $destination
      )

      Button("Archive") { showingArchive = true }
    }
  }
  .aurelglyphDialog(
    isPresented: $showingArchive,
    title: "Archive system",
    message: "This can be restored later."
  ) {
    Text("The current system will move to Archive.")
  } actions: {
    Button("Cancel", role: .cancel) { showingArchive = false }
    Button("Archive", role: .destructive) { archive() }
  }
}
```

`AurelglyphDrawer` can be composed directly in an overlay or presented with
`.aurelglyphDrawer(isPresented:title:edge:content:)`. Logical `.start` and
`.end` edges follow layout direction, drawer motion follows Reduce Motion, and
the presenter isolates modal focus, handles Escape, and moves initial focus to
the close control.
The existing `AurelglyphSheet` surface can now be presented natively with
`.aurelglyphSheet(isPresented:title:content:actions:)`.

`AurelglyphPagination` now accepts a `Binding<Int>` and emits page changes.
`AurelglyphCommandPalette` accepts a query binding, filters titles and keywords,
provides selection/dismiss callbacks, supports arrow-key navigation and two-stage
Escape behavior, and scrolls long result sets. Pagination windows large page
counts instead of rendering every page. `AurelglyphCombobox` also supports
arrow-key navigation, bounded scrolling, async option updates, and synchronized
query/selection state. `AurelglyphProgress` clamps invalid values and supports
both determinate and indeterminate progress.

The npm manifest in this directory is private and exists only to coordinate
monorepo generation; Swift consumers should use Swift Package Manager.
