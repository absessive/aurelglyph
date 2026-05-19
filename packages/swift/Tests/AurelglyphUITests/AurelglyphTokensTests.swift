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
