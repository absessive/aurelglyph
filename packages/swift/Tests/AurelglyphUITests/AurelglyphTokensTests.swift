import Testing
import SwiftUI
@testable import AurelglyphUI

@Test func exposesGeneratedRoyalPurpleAccentToken() {
  #expect(AurelglyphTokens.colorAccentRoyalPurple300 == "#9358e8")
}

@Test func exposesGeneratedDarkBackgroundToken() {
  #expect(AurelglyphTokens.colorModeDarkBackground == "#0d0d0b")
}

@Test func exposesCuratedIconContract() {
  #expect(AurelglyphIcon.allCases.count == 105)
  #expect(AurelglyphIcon.creditCard.rawValue == "credit-card")
  #expect(AurelglyphIcon.thumbsUp.rawValue == "thumbs-up")
  #expect(AurelglyphIcon.help.accessibilityLabel == "Help")
  #expect(AurelglyphIcon.notification.rawValue == "notification")
  #expect(AurelglyphIcon.compass.accessibilityLabel == "Compass")
}

@Test func exposesAnimatedExpandableSection() {
  let expanded = Binding.constant(true)
  let section = AurelglyphExpandableSection("Advanced settings", eyebrow: "React and Swift", isExpanded: expanded) {
    Text("Animated content")
  }

  #expect(String(describing: type(of: section)).contains("AurelglyphExpandableSection"))
}

private struct GlyphMotionProbe: View {
  @Namespace private var namespace

  var body: some View {
    Text("Event")
      .glyphMatch("event-card-image", in: namespace)
      .glyphTransition(.bloom)
      .glyphSpring(.standard)
  }
}

@Test func exposesGlyphMotionVocabularyAndModifiers() {
  let probe = GlyphMotionProbe()
  let interactive = GlyphInteractive(progress: 0.42)
  let cancelled = GlyphInteractive(progress: 0.1, phase: .cancelling)

  #expect(GlyphSpring.allCases.map(\.rawValue) == ["quiet", "standard", "expressive"])
  #expect(GlyphTransition.allCases.map(\.rawValue) == ["bloom", "drift", "collapse", "glass", "thread", "tilt", "arc", "none"])
  #expect(GlyphState.allCases.count == 5)
  #expect(GlyphDirection.allCases.count == 6)
  #expect(GlyphSnapshotStrategy.optimized.rawValue == "optimized")
  #expect(GlyphMotion.standardSpringToken == AurelglyphTokens.motionSpringStandard)
  #expect(interactive.active)
  #expect(interactive.progress == 0.42)
  #expect(cancelled.phase == .cancelling)
  #expect(String(describing: type(of: probe)).contains("GlyphMotionProbe"))
}

@Test func exposesNativeTypographyAdapterWithBundledNativeFonts() {
  let display = AurelglyphTypography.display(size: 34)
  let serif = AurelglyphTypography.editorialSerif(size: 20)
  let ui = AurelglyphTypography.ui(size: 17)
  let body = AurelglyphTypography.font(.body, size: 17)
  let mono = AurelglyphTypography.mono(size: 12)
  let registration = AurelglyphFontRegistry.registerFonts()

  #expect(Mirror(reflecting: display).subjectType == Font.self)
  #expect(Mirror(reflecting: serif).subjectType == Font.self)
  #expect(Mirror(reflecting: ui).subjectType == Font.self)
  #expect(Mirror(reflecting: body).subjectType == Font.self)
  #expect(Mirror(reflecting: mono).subjectType == Font.self)
  #expect(AurelglyphTypography.bundlesWebFontAssets == false)
  #expect(AurelglyphTypography.bundlesNativeFontAssets == true)
  #expect(AurelglyphFontRegistry.fontResourceNames.count == 12)
  #expect(AurelglyphFontRegistry.expectedPostScriptNames.contains("Newsreader72pt-Medium"))
  #expect(AurelglyphFontRegistry.expectedPostScriptNames.contains("IBMPlexSans-Medm"))
  #expect(AurelglyphFontRegistry.expectedPostScriptNames.contains("JetBrainsMono-Regular"))
  #expect(registration.isReady)
  #expect(registration.registeredPostScriptNames.count == 12)
  #expect(AurelglyphTypography.displayFamilyToken == AurelglyphTokens.fontFamilyDisplay)
  #expect(AurelglyphTypography.uiFamilyToken == AurelglyphTokens.fontFamilyUi)
  #expect(AurelglyphTypography.bodyFamilyToken == AurelglyphTokens.fontFamilyBody)
  #expect(AurelglyphTypography.monoFamilyToken == AurelglyphTokens.fontFamilyMono)
}

@Test func exposesPhaseOneMobileFoundationComponents() {
  let selected = Binding.constant("systems")
  let searchText = Binding.constant("")
  let switchValue = Binding.constant(true)

  let topBar = AurelglyphTopBar("Workbench", subtitle: "Systems") {
    EmptyView()
  } actions: {
    Text("Edit")
  }
  let tabBar = AurelglyphTabBar(
    items: [
      AurelglyphTabItem(id: "workbench", title: "Workbench", systemImage: "rectangle.grid.2x2"),
      AurelglyphTabItem(id: "systems", title: "Systems", systemImage: "gearshape")
    ],
    selection: selected
  )
  let card = AurelglyphCard(title: "Status", eyebrow: "Live") {
    Text("Systems operational")
  }
  let section = AurelglyphListSection("Settings") {
    AurelglyphListRow("Quiet mode", subtitle: "Enabled", systemImage: "bell", isSelected: true) {
      Text("On")
    }
  }
  let search = AurelglyphSearchField(text: searchText)
  let toggle = AurelglyphSwitch("Quiet mode", subtitle: "Reduce notifications", isOn: switchValue)
  let shell = AurelglyphAppShell {
    topBar
  } content: {
    card
    section
    search
    toggle
  } tabBar: {
    tabBar
  }

  #expect(String(describing: type(of: shell)).contains("AurelglyphAppShell"))
  #expect(String(describing: type(of: tabBar)).contains("AurelglyphTabBar"))
  #expect(String(describing: type(of: card)).contains("AurelglyphCard"))
  #expect(String(describing: type(of: section)).contains("AurelglyphListSection"))
  #expect(String(describing: type(of: search)).contains("AurelglyphSearchField"))
  #expect(String(describing: type(of: toggle)).contains("AurelglyphSwitch"))
}

@Test func exposesPhaseTwoMobileAppComponents() {
  let selection = Binding.constant("grid")
  let item = AurelglyphSegmentedItem(id: "grid", title: "Grid")
  let nav = AurelglyphNavigationStack("Workbench") {
    Text("Systems")
  }
  let toolbar = AurelglyphToolbar {
    Text("Save")
  }
  let sheet = AurelglyphSheet("Details") {
    Text("Sheet body")
  } actions: {
    Text("Done")
  }
  let segmented = AurelglyphSegmentedControl(items: [item], selection: selection)
  let select = AurelglyphSelect("Theme", items: [item], selection: selection)
  let alert = AurelglyphAlert("Synced") {
    Text("Systems operational")
  }
  let empty = AurelglyphEmptyState("No systems", message: "Create a system") {
    Text("Create")
  }
  let avatar = AurelglyphAvatar("Ajit Chakrapani")
  let badge = AurelglyphBadge("Live")

  #expect(String(describing: type(of: nav)).contains("AurelglyphNavigationStack"))
  #expect(String(describing: type(of: toolbar)).contains("AurelglyphToolbar"))
  #expect(String(describing: type(of: sheet)).contains("AurelglyphSheet"))
  #expect(String(describing: type(of: segmented)).contains("AurelglyphSegmentedControl"))
  #expect(String(describing: type(of: select)).contains("AurelglyphSelect"))
  #expect(String(describing: type(of: alert)).contains("AurelglyphAlert"))
  #expect(String(describing: type(of: empty)).contains("AurelglyphEmptyState"))
  #expect(String(describing: type(of: avatar)).contains("AurelglyphAvatar"))
  #expect(String(describing: type(of: badge)).contains("AurelglyphBadge"))
}

@Test func exposesPhaseThreeWorkbenchComponents() {
  let selection = Binding.constant("overview")
  let tabItem = AurelglyphSegmentedItem(id: "overview", title: "Overview")
  let tabs = AurelglyphTabs(items: [tabItem], selection: selection) {
    Text("Panel")
  }
  let breadcrumbs = AurelglyphBreadcrumbs(items: [
    AurelglyphBreadcrumbItem(id: "workbench", title: "Workbench"),
    AurelglyphBreadcrumbItem(id: "systems", title: "Systems")
  ])
  let toast = AurelglyphToast("Saved") {
    Text("Changes synced")
  }
  let progress = AurelglyphProgress(value: 42)
  let skeleton = AurelglyphSkeleton()
  let metric = AurelglyphMetric(label: "Latency", value: "42ms", delta: "Stable")
  let table = AurelglyphDataTable(headers: ["Name"], rows: [["System"]])
  let pagination = AurelglyphPagination(currentPage: 2, totalPages: 3)
  let command = AurelglyphCommandPalette(items: [
    AurelglyphCommandItem(id: "search", title: "Search", systemImage: "magnifyingglass", shortcut: "Cmd-K")
  ])

  #expect(String(describing: type(of: tabs)).contains("AurelglyphTabs"))
  #expect(String(describing: type(of: breadcrumbs)).contains("AurelglyphBreadcrumbs"))
  #expect(String(describing: type(of: toast)).contains("AurelglyphToast"))
  #expect(String(describing: type(of: progress)).contains("AurelglyphProgress"))
  #expect(String(describing: type(of: skeleton)).contains("AurelglyphSkeleton"))
  #expect(String(describing: type(of: metric)).contains("AurelglyphMetric"))
  #expect(String(describing: type(of: table)).contains("AurelglyphDataTable"))
  #expect(String(describing: type(of: pagination)).contains("AurelglyphPagination"))
  #expect(String(describing: type(of: command)).contains("AurelglyphCommandPalette"))
}
