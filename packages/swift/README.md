# AurelglyphUI Swift Package

SwiftUI tokens, typography, icons, and native Aurelglyph interaction components
for iOS 17 and macOS 14 or newer.

The public Git package lives at the repository root:

```swift
.package(url: "https://github.com/absessive/aurelglyph.git", from: "0.7.0")
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
supplied Dynamic Type role; a system fallback preserves that Dynamic Type role
even when an individual packaged face is unavailable. The generic `font`
factory defaults display to `.largeTitle`, editorial serif to `.title3`, UI/body
to `.body`, and mono to `.caption`. Registration validates every expected
PostScript face and only falls back the individual face that is unavailable.

`AurelglyphExpandableSection` follows the system Reduce Motion setting: its
disclosure state changes immediately without the reveal animation when enabled.

## Theme environment

Install an appearance, mode, and accent once near the application root.
`.system` follows the device appearance. The default `.atelier` appearance uses
warm drafting-paper and graphite neutrals with all six accents; `.quiet` uses
near-white and compact charcoal surfaces, smaller radii, flatter elevation, and
one restrained violet signal palette.

```swift
WorkbenchView()
  .aurelglyphTheme(
    AurelglyphTheme(mode: .system, accent: .royalPurple, appearance: .quiet)
  )
```

The environment resolves semantic `AurelglyphPalette` colors for surfaces,
borders, foregrounds, status colors, overlays, and active controls. Existing
shell components now use this environment instead of forcing a dark background.
Accent, control-fill, focus, and accent-foreground roles follow the canonical
mode-specific token mapping rather than reusing one raw accent shade.
Quiet field boundaries use the contrast-verified neutral boundary role, while
selected tabs, segments, rows, and pagination add an explicit focus-color rail
or outline instead of relying on a low-opacity fill alone.
Interactive labels use the foreground role in both modes, including inactive
tabs, segmented options, and icon controls; muted text remains reserved for
supporting descriptions and metadata.

## Interaction foundations

The 0.6 responsive interaction layer uses native SwiftUI presentation and accessibility
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

## Responsive behavior

Interactive controls owned by Aurelglyph enforce a minimum 44-point iOS target.
Top bars, list rows, toolbars, button groups, tab bars, and segmented controls
fall back to stacked or horizontally scrollable layouts when their content no
longer fits. Accessibility Dynamic Type sizes prefer the expanded layouts so
essential labels are not forced onto one truncated line.

`AurelglyphGrid` automatically reduces its adaptive column count as width
shrinks. For a horizontal stack that should become vertical when its container
is narrow, in a compact horizontal size class, or at accessibility text sizes,
opt in without branching at each call site:

```swift
AurelglyphStack(axis: .horizontal, compactAxis: .vertical, spacing: 12) {
  PrimaryAction()
  SecondaryAction()
}
```

`AurelglyphAppShell` owns vertical scrolling by default. Pass
`scrollsContent: false` when its content is already a `List`, `ScrollView`, or
another container that must own scrolling:

```swift
AurelglyphAppShell(scrollsContent: false) {
  WorkbenchTopBar()
} content: {
  List(systems) { system in
    SystemRow(system)
  }
} tabBar: {
  WorkbenchTabBar()
}
```

Apps with a regular-width rail can provide it without maintaining a separate
shell. `AurelglyphAppShell` uses the rail outside compact horizontal size classes
when it and a 320-point content region fit, then falls back to the compact bottom
navigation as the window narrows:

```swift
AurelglyphAppShell(regularNavigationWidth: 248) {
  WorkbenchTopBar()
} regularNavigation: {
  SystemsRail()
} content: {
  WorkbenchContent()
} tabBar: {
  WorkbenchTabBar()
}
```

Drawer and sheet bodies scroll by default while their headers remain reachable.
Their initializers and presentation modifiers also accept
`scrollsContent: false` for caller-managed `List` or `ScrollView` content.
Popovers use SwiftUI's native compact adaptation, so they become sheets where
the platform determines that a popover would be too constrained. Data tables
preserve every column through horizontal scrolling in compact windows.

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
