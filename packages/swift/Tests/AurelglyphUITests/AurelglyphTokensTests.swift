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
