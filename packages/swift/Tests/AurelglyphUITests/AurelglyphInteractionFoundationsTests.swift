import Testing
import SwiftUI
import Foundation
import CoreGraphics
@testable import AurelglyphUI

@Test func exposesThemeModeAndAccentEnvironmentContract() {
  #expect(AurelglyphColorMode.allCases.map(\.rawValue) == ["system", "light", "dark"])
  #expect(AurelglyphAccent.allCases.map(\.rawValue) == [
    "amber", "forest", "royal-purple", "deep-blue", "cyan", "steel"
  ])
  #expect(AurelglyphTheme.standard == AurelglyphTheme(mode: .system, accent: .royalPurple))
  #expect(AurelglyphTheme(mode: .light).preferredColorScheme == .light)
  #expect(AurelglyphTheme(mode: .dark).preferredColorScheme == .dark)
  #expect(AurelglyphTheme.standard.preferredColorScheme == nil)
  #expect(AurelglyphAccent.royalPurple.tokenValue(shade: 200) == AurelglyphTokens.colorAccentRoyalPurple200)
  #expect(AurelglyphAccent.royalPurple.tokenValue(shade: 500) == AurelglyphTokens.colorAccentRoyalPurple500)
  #expect(AurelglyphAccent.royalPurple.tokenValue(shade: 600) == AurelglyphTokens.colorAccentRoyalPurple600)

  let themed = Text("Workbench").aurelglyphTheme(.init(mode: .dark, accent: .cyan))
  let localized = Text("Workbench").aurelglyphControlCopy(
    AurelglyphControlCopy(loading: "Chargement", readOnly: "Lecture seule")
  )
  #expect(String(describing: type(of: themed)).contains("ModifiedContent"))
  #expect(String(describing: type(of: localized)).contains("ModifiedContent"))
}

@Test func lightInteractiveForegroundMaintainsContrastOnInsetSurfaces() {
  let interactiveSurfaceContrasts = [
    AurelglyphTokens.colorModeLightBackground,
    AurelglyphTokens.colorModeLightBackgroundElevated,
    AurelglyphTokens.colorModeLightSurface,
    AurelglyphTokens.colorModeLightSurface2,
    AurelglyphTokens.colorModeLightSurface3
  ].map { contrastRatio(AurelglyphTokens.colorModeLightText, $0) }
  let supportingContrast = contrastRatio(
    AurelglyphTokens.colorModeLightTextMuted,
    AurelglyphTokens.colorModeLightSurface2
  )

  #expect(interactiveSurfaceContrasts.allSatisfy { $0 >= 4.5 })
  #expect(interactiveSurfaceContrasts.min()! > supportingContrast)

  for accent in AurelglyphAccent.allCases {
    let accentContrast = contrastRatio(
      accent.tokenValue(shade: 600),
      AurelglyphTokens.colorModeLightSurface2
    )
    #expect(accentContrast >= 4.5)
  }

  let selection = Binding.constant("systems")
  let tabBar = AurelglyphTabBar(
    items: [AurelglyphTabItem(id: "systems", title: "Systems", systemImage: "gearshape")],
    selection: selection
  )
  .aurelglyphTheme(.init(mode: .light))
  let segmented = AurelglyphSegmentedControl(
    items: [AurelglyphSegmentedItem(id: "systems", title: "Systems")],
    selection: selection
  )
  .aurelglyphTheme(.init(mode: .light))
  let iconButton = AurelglyphIconButton("Refresh", systemImage: "arrow.clockwise") {}
    .aurelglyphTheme(.init(mode: .light))

  #expect(String(describing: type(of: tabBar)).contains("ModifiedContent"))
  #expect(String(describing: type(of: segmented)).contains("ModifiedContent"))
  #expect(String(describing: type(of: iconButton)).contains("ModifiedContent"))
}

@Test func exposesNativePresentationAndDisclosureComponents() {
  let presented = Binding.constant(true)
  let dialog = AurelglyphDialog(
    "Archive system",
    message: "This can be restored later.",
    isPresented: presented,
    size: .compact
  ) {
    Text("Dialog body")
  } actions: {
    Button("Archive") {}
  }
  let drawer = AurelglyphDrawer("System details", isPresented: presented, edge: .end) {
    Text("Drawer body")
  }
  let menuItem = AurelglyphMenuItem(id: "archive", title: "Archive", isDestructive: true) {}
  let menu = AurelglyphMenu("More", items: [menuItem])
  let dropdown: AurelglyphDropdown = AurelglyphDropdown("Actions", items: [menuItem])
  let popover = AurelglyphPopover(isPresented: presented) {
    Text("Inspect")
  } content: {
    Text("Inspection details")
  }
  let tooltip = AurelglyphTooltip("Show details") {
    Image(systemName: "info.circle")
  }

  #expect(String(describing: type(of: dialog)).contains("AurelglyphDialog"))
  #expect(String(describing: type(of: drawer)).contains("AurelglyphDrawer"))
  #expect(String(describing: type(of: menu)).contains("AurelglyphMenu"))
  #expect(String(describing: type(of: dropdown)).contains("AurelglyphMenu"))
  #expect(String(describing: type(of: popover)).contains("AurelglyphPopover"))
  #expect(String(describing: type(of: tooltip)).contains("AurelglyphTooltip"))
}

@Test func exposesNativeInteractionControlsAndAliases() {
  let boolean = Binding.constant(false)
  let selected = Binding.constant("quiet")
  let number = Binding.constant(42.0)
  let query = Binding.constant("sys")
  let option = Binding<String?>.constant(nil)

  let iconButton = AurelglyphIconButton("Refresh", systemImage: "arrow.clockwise") {}
  let buttonGroup = AurelglyphButtonGroup("System actions") {
    iconButton
  }
  let checkbox = AurelglyphCheckbox(
    "Quiet mode",
    isChecked: boolean,
    isIndeterminate: true,
    isReadOnly: true
  )
  let radioGroup = AurelglyphRadioGroup(
    "Mode",
    items: [AurelglyphRadioItem(id: "quiet", title: "Quiet")],
    selection: selected
  )
  let slider = AurelglyphSlider("Volume", value: number, in: 0...100, step: 5)
  let numberField = AurelglyphNumberField("Retries", value: number, in: 0...50, step: 2)
  let options = [AurelglyphOption(id: "systems", label: "Systems", detail: "Workbench")]
  let combobox = AurelglyphCombobox(
    "Destination",
    options: options,
    query: query,
    selection: option
  )
  let autocomplete: AurelglyphAutocomplete = AurelglyphAutocomplete(
    "Search",
    options: options,
    query: query,
    selection: option
  )
  let spinner = AurelglyphSpinner("Syncing", size: .small)
  let divider = AurelglyphDivider(.vertical)

  #expect(String(describing: type(of: iconButton)).contains("AurelglyphIconButton"))
  #expect(String(describing: type(of: buttonGroup)).contains("AurelglyphButtonGroup"))
  #expect(String(describing: type(of: checkbox)).contains("AurelglyphCheckbox"))
  #expect(String(describing: type(of: radioGroup)).contains("AurelglyphRadioGroup"))
  #expect(String(describing: type(of: slider)).contains("AurelglyphSlider"))
  #expect(String(describing: type(of: numberField)).contains("AurelglyphNumberField"))
  #expect(String(describing: type(of: combobox)).contains("AurelglyphCombobox"))
  #expect(String(describing: type(of: autocomplete)).contains("AurelglyphCombobox"))
  #expect(String(describing: type(of: spinner)).contains("AurelglyphSpinner"))
  #expect(String(describing: type(of: divider)).contains("AurelglyphDivider"))
}

@Test func exposesNativeLayoutPrimitives() {
  let surface = AurelglyphSurface(level: .elevated) {
    Text("Surface")
  }
  let box: AurelglyphBox<Text> = AurelglyphBox {
    Text("Box")
  }
  let stack = AurelglyphStack(axis: .horizontal, alignment: .center, spacing: 8) {
    Text("Stack")
  }
  let container = AurelglyphContainer(maxWidth: 720) {
    Text("Container")
  }
  let grid = AurelglyphGrid(minimumColumnWidth: 220) {
    Text("Grid item")
  }

  #expect(String(describing: type(of: surface)).contains("AurelglyphSurface"))
  #expect(String(describing: type(of: box)).contains("AurelglyphBox"))
  #expect(String(describing: type(of: stack)).contains("AurelglyphStack"))
  #expect(String(describing: type(of: container)).contains("AurelglyphContainer"))
  #expect(String(describing: type(of: grid)).contains("AurelglyphGrid"))
}

@Test func appliesResponsiveLayoutAndTouchTargetPolicies() {
  #expect(AurelglyphResponsiveLayout.minimumInteractiveDimension == 44)
  #expect(!AurelglyphResponsiveLayout.prefersStackedLayout(for: .xxxLarge))
  #expect(AurelglyphResponsiveLayout.prefersStackedLayout(for: .accessibility1))
  #expect(AurelglyphResponsiveLayout.prefersStackedLayout(for: .accessibility5))
  #expect(AurelglyphResponsiveLayout.navigationWidth(20) == 44)
  #expect(AurelglyphResponsiveLayout.navigationWidth(248) == 248)
  #expect(AurelglyphResponsiveLayout.navigationWidth(.infinity) == 260)
  #expect(AurelglyphResponsiveLayout.navigationWidth(.nan) == 260)
  #expect(
    !AurelglyphResponsiveLayout.usesRegularNavigation(
      availableWidth: 568,
      navigationWidth: 248,
      isCompactWidth: false
    )
  )
  #expect(
    AurelglyphResponsiveLayout.usesRegularNavigation(
      availableWidth: 569,
      navigationWidth: 248,
      isCompactWidth: false
    )
  )
  #expect(
    !AurelglyphResponsiveLayout.usesRegularNavigation(
      availableWidth: 800,
      navigationWidth: 248,
      isCompactWidth: true
    )
  )

  #expect(
    AurelglyphStack<EmptyView>.resolvedAxis(
      axis: .horizontal,
      compactAxis: .vertical,
      isCompactWidth: true,
      usesAccessibilitySize: false
    ) == .vertical
  )
  #expect(
    AurelglyphStack<EmptyView>.resolvedAxis(
      axis: .horizontal,
      compactAxis: .vertical,
      isCompactWidth: false,
      usesAccessibilitySize: true
    ) == .vertical
  )
  #expect(
    AurelglyphStack<EmptyView>.resolvedAxis(
      axis: .horizontal,
      compactAxis: .vertical,
      isCompactWidth: false,
      usesAccessibilitySize: false
    ) == .horizontal
  )
  #expect(
    AurelglyphStack<EmptyView>.resolvedAxis(
      axis: .horizontal,
      compactAxis: nil,
      isCompactWidth: true,
      usesAccessibilitySize: true
    ) == .horizontal
  )
}

@Test func exposesCompatibleScrollOwnershipOptions() {
  let presented = Binding.constant(true)
  let shell = AurelglyphAppShell(scrollsContent: false) {
    Text("Workbench")
  } content: {
    ScrollView { Text("Caller-managed scrolling") }
  } tabBar: {
    EmptyView()
  }
  let adaptiveShell = AurelglyphAppShell(
    scrollsContent: false,
    regularNavigationWidth: 248
  ) {
    Text("Workbench")
  } regularNavigation: {
    Text("Systems rail")
  } content: {
    Text("Adaptive content")
  } tabBar: {
    Text("Compact tabs")
  }
  let sheet = AurelglyphSheet("Details", scrollsContent: false) {
    ScrollView { Text("Caller-managed sheet") }
  } actions: {
    Button("Done") {}
  }
  let drawer = AurelglyphDrawer(
    "Details",
    isPresented: presented,
    scrollsContent: false
  ) {
    ScrollView { Text("Caller-managed drawer") }
  }
  let adaptiveStack = AurelglyphStack(axis: .horizontal, compactAxis: .vertical) {
    Text("Primary")
    Text("Secondary")
  }

  #expect(String(describing: type(of: shell)).contains("AurelglyphAppShell"))
  #expect(String(describing: type(of: adaptiveShell)).contains("AurelglyphAppShell"))
  #expect(String(describing: type(of: sheet)).contains("AurelglyphSheet"))
  #expect(String(describing: type(of: drawer)).contains("AurelglyphDrawer"))
  #expect(String(describing: type(of: adaptiveStack)).contains("AurelglyphStack"))
}

@Test @MainActor func rendersCompactAccessibilityLayoutAtRequestedViewport() {
  let selection = Binding.constant("systems")
  let view = VStack(spacing: 12) {
    AurelglyphTopBar(
      "A deliberately long localized workbench title",
      subtitle: "Systems remain operational while the window changes size"
    ) {
      Image(systemName: "square.grid.2x2")
    } actions: {
      Button("Inspect details") {}
      Button("Archive") {}
    }

    AurelglyphTabBar(
      items: [
        AurelglyphTabItem(id: "workbench", title: "Workbench", systemImage: "hammer"),
        AurelglyphTabItem(id: "notes", title: "Notes", systemImage: "note.text"),
        AurelglyphTabItem(id: "systems", title: "Systems", systemImage: "server.rack"),
        AurelglyphTabItem(id: "lab", title: "Laboratory", systemImage: "flask"),
        AurelglyphTabItem(id: "archive", title: "Archive", systemImage: "archivebox"),
        AurelglyphTabItem(id: "settings", title: "Settings", systemImage: "gearshape")
      ],
      selection: selection
    )

    AurelglyphDataTable(
      headers: ["System", "Environment", "Region", "Status", "Last calibration"],
      rows: [["Observatory", "Production", "North America", "Operational", "Just now"]]
    )
  }
  .environment(\.dynamicTypeSize, .accessibility5)
  .frame(width: 320, height: 568, alignment: .top)

  let renderer = ImageRenderer(content: view)
  renderer.proposedSize = ProposedViewSize(width: 320, height: 568)
  renderer.scale = 1

  #expect(renderer.cgImage?.width == 320)
  #expect(renderer.cgImage?.height == 568)
}

@Test @MainActor func selectsContainerResponsiveLayoutsBeforeContentOverflows() {
  let adaptiveStack = AurelglyphStack(
    axis: .horizontal,
    compactAxis: .vertical,
    spacing: 8
  ) {
    Color.red.frame(width: 200, height: 44)
    Color.blue.frame(width: 200, height: 44)
  }
  .environment(\.horizontalSizeClass, nil)

  let stackRenderer = ImageRenderer(content: adaptiveStack)
  stackRenderer.proposedSize = ProposedViewSize(width: 320, height: 300)
  stackRenderer.scale = 1

  #expect(stackRenderer.cgImage?.width == 200)
  #expect(stackRenderer.cgImage?.height == 96)

  let adaptiveHeader = AurelglyphAdaptiveHeaderLayout(
    leadingItemCount: 1,
    primarySpacing: 12,
    trailingSpacing: 8,
    fallbackSpacing: 10,
    forceFallback: false,
    layoutDirection: .leftToRight
  ) {
    Color.red.frame(width: 200, height: 44)
    Color.blue.frame(width: 200, height: 44)
  }
  let headerRenderer = ImageRenderer(content: adaptiveHeader)
  headerRenderer.proposedSize = ProposedViewSize(width: 320, height: 300)
  headerRenderer.scale = 1

  #expect(headerRenderer.cgImage?.width == 320)
  #expect(headerRenderer.cgImage?.height == 98)

  let selection = Binding.constant("primary")
  let longLabelControls = VStack(spacing: 12) {
    AurelglyphTabBar(
      items: [
        AurelglyphTabItem(
          id: "primary",
          title: "Primary observability workbench",
          systemImage: "waveform.path.ecg"
        ),
        AurelglyphTabItem(
          id: "secondary",
          title: "Secondary infrastructure archive",
          systemImage: "archivebox"
        )
      ],
      selection: selection
    )
    AurelglyphSegmentedControl(
      items: [
        AurelglyphSegmentedItem(id: "primary", title: "Primary observability workbench"),
        AurelglyphSegmentedItem(id: "secondary", title: "Secondary infrastructure archive")
      ],
      selection: selection
    )
  }
  .environment(\.dynamicTypeSize, .xxxLarge)

  let controlsRenderer = ImageRenderer(content: longLabelControls)
  controlsRenderer.proposedSize = ProposedViewSize(width: 320, height: 300)
  controlsRenderer.scale = 1

  #expect(controlsRenderer.cgImage?.width == 320)
  #expect(controlsRenderer.cgImage?.height ?? 0 > 0)
}

@Test @MainActor func mirrorsAdaptiveChromeForRightToLeftLayouts() {
  let adaptiveHeader = AurelglyphAdaptiveHeaderLayout(
    leadingItemCount: 1,
    primarySpacing: 12,
    trailingSpacing: 8,
    fallbackSpacing: 10,
    forceFallback: false,
    layoutDirection: .rightToLeft
  ) {
    Color.red.frame(width: 100, height: 44)
    Color.blue.frame(width: 80, height: 44)
  }
  let headerRenderer = ImageRenderer(content: adaptiveHeader)
  headerRenderer.proposedSize = ProposedViewSize(width: 320, height: 44)
  headerRenderer.scale = 1

  if let image = headerRenderer.cgImage,
     let leftPixel = rgbaPixel(in: image, x: 10, y: 22),
     let rightPixel = rgbaPixel(in: image, x: 310, y: 22) {
    #expect(leftPixel.blue > leftPixel.red)
    #expect(rightPixel.red > rightPixel.blue)
  } else {
    Issue.record("Expected the RTL adaptive header to render")
  }

  let shell = AurelglyphAppShell(
    scrollsContent: false,
    regularNavigationWidth: 80
  ) {
    Color.green.frame(height: 24)
  } regularNavigation: {
    Color.red
  } content: {
    Color.blue.frame(maxWidth: .infinity, maxHeight: .infinity)
  } tabBar: {
    Color.yellow.frame(height: 44)
  }
  .environment(\.horizontalSizeClass, .regular)
  .environment(\.layoutDirection, .rightToLeft)
  .frame(width: 420, height: 240)

  let shellRenderer = ImageRenderer(content: shell)
  shellRenderer.proposedSize = ProposedViewSize(width: 420, height: 240)
  shellRenderer.scale = 1

  if let image = shellRenderer.cgImage,
     let contentPixel = rgbaPixel(in: image, x: 100, y: 120),
     let navigationPixel = rgbaPixel(in: image, x: 380, y: 120) {
    #expect(contentPixel.blue > contentPixel.red)
    #expect(navigationPixel.red > navigationPixel.blue)
  } else {
    Issue.record("Expected the RTL app shell to render")
  }
}

@Test func clampsProgressPaginationAndValidNumberSteps() {
  #expect(AurelglyphProgress.normalizedTotal(0) == 1)
  #expect(AurelglyphProgress.clampedValue(-10, total: 100) == 0)
  #expect(AurelglyphProgress.clampedValue(120, total: 100) == 100)
  #expect(AurelglyphProgress.percentageLabel(value: 42, total: 100) == "42%")
  #expect(AurelglyphPagination.normalizedPage(-1, totalPages: 5) == 1)
  #expect(AurelglyphPagination.normalizedPage(9, totalPages: 5) == 5)
  #expect(AurelglyphPagination.normalizedPage(1, totalPages: 0) == 0)
  #expect(AurelglyphSlider.normalizedStep(0) == 1)
  #expect(AurelglyphSlider.normalizedStep(-5) == 1)
  #expect(AurelglyphSlider.clampedValue(-10, range: 0...100) == 0)
  #expect(AurelglyphSlider.clampedValue(120, range: 0...100) == 100)
  #expect(AurelglyphSlider.clampedValue(.nan, range: 0...100) == 0)

  let negativeRange = -10.0 ... -5.0
  #expect(AurelglyphNumberField.adjusted(value: -10, direction: 1, range: negativeRange, step: 2) == -8)
  #expect(AurelglyphNumberField.adjusted(value: -6, direction: 1, range: negativeRange, step: 2) == -6)
  #expect(!AurelglyphNumberField.canStep(value: -6, direction: 1, range: negativeRange, step: 2))
  #expect(AurelglyphNumberField.adjusted(value: -5, direction: -1, range: negativeRange, step: 2) == -6)
  #expect(AurelglyphNumberField.adjusted(value: -20, direction: 1, range: negativeRange, step: 2) == -10)
  #expect(AurelglyphNumberField.adjusted(value: 0, direction: -1, range: negativeRange, step: 2) == -5)

  #expect(AurelglyphPagination.visibleItems(currentPage: 1, totalPages: 3) == [
    .page(1), .page(2), .page(3)
  ])
  #expect(AurelglyphPagination.visibleItems(currentPage: 50, totalPages: 100) == [
    .page(1), .gap(-1), .page(50), .gap(1), .page(100)
  ])
}

@Test func filtersComboboxAndCommandPaletteWithoutCaseSensitivity() {
  let options = [
    AurelglyphOption(id: "workbench", label: "Workbench", detail: "Systems"),
    AurelglyphOption(id: "archive", label: "Archive")
  ]
  #expect(AurelglyphCombobox.filteredOptions(options, query: "SYSTEM", limit: 8).map(\.id) == ["workbench"])
  #expect(AurelglyphCombobox.filteredOptions(options, query: "", limit: 1).map(\.id) == ["workbench"])
  let disabledOptions = [
    AurelglyphOption(id: "one", label: "One"),
    AurelglyphOption(id: "two", label: "Two", isDisabled: true),
    AurelglyphOption(id: "three", label: "Three")
  ]
  #expect(AurelglyphCombobox.nextEnabledIndex(in: disabledOptions, from: 0, direction: 1) == 2)
  #expect(AurelglyphCombobox.nextEnabledIndex(in: disabledOptions, from: 0, direction: -1) == 2)

  let commands = [
    AurelglyphCommandItem(id: "search", title: "Find system", keywords: ["lookup"]),
    AurelglyphCommandItem(id: "archive", title: "Archive")
  ]
  #expect(AurelglyphCommandPalette.filteredItems(commands, query: "LOOK").map(\.id) == ["search"])
  #expect(AurelglyphCommandPalette.filteredItems(commands, query: "archive").map(\.id) == ["archive"])
  let disabledCommands = [
    AurelglyphCommandItem(id: "one", title: "One", isDisabled: true),
    AurelglyphCommandItem(id: "two", title: "Two")
  ]
  #expect(AurelglyphCommandPalette.firstEnabledIndex(in: disabledCommands) == 1)
  #expect(AurelglyphCommandPalette.nextEnabledIndex(in: disabledCommands, from: 1, direction: 1) == 1)
}

private func contrastRatio(_ firstHex: String, _ secondHex: String) -> Double {
  let first = relativeLuminance(firstHex)
  let second = relativeLuminance(secondHex)
  return (max(first, second) + 0.05) / (min(first, second) + 0.05)
}

private func relativeLuminance(_ hex: String) -> Double {
  let normalized = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
  guard normalized.count == 6, let value = UInt64(normalized, radix: 16) else {
    return 0
  }

  let components = [
    Double((value >> 16) & 0xff) / 255,
    Double((value >> 8) & 0xff) / 255,
    Double(value & 0xff) / 255
  ].map { component in
    component <= 0.04045
      ? component / 12.92
      : pow((component + 0.055) / 1.055, 2.4)
  }

  return components[0] * 0.2126 + components[1] * 0.7152 + components[2] * 0.0722
}

private func rgbaPixel(
  in image: CGImage,
  x: Int,
  y: Int
) -> (red: UInt8, green: UInt8, blue: UInt8, alpha: UInt8)? {
  guard x >= 0, x < image.width, y >= 0, y < image.height else { return nil }

  let bytesPerPixel = 4
  let bytesPerRow = image.width * bytesPerPixel
  var bytes = [UInt8](repeating: 0, count: bytesPerRow * image.height)
  let bitmapInfo = CGBitmapInfo.byteOrder32Big.rawValue
    | CGImageAlphaInfo.premultipliedLast.rawValue

  return bytes.withUnsafeMutableBytes { buffer in
    guard let baseAddress = buffer.baseAddress,
          let context = CGContext(
            data: baseAddress,
            width: image.width,
            height: image.height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: bitmapInfo
          ) else {
      return nil
    }

    context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
    let offset = y * bytesPerRow + x * bytesPerPixel
    return (
      red: buffer[offset],
      green: buffer[offset + 1],
      blue: buffer[offset + 2],
      alpha: buffer[offset + 3]
    )
  }
}
