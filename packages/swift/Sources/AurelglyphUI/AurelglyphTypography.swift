import SwiftUI

public enum AurelglyphTypography {
  public enum Role: Sendable {
    case display
    case editorialSerif
    case ui
    case body
    case mono
  }

  public static let bundlesWebFontAssets = false
  public static let bundlesNativeFontAssets = true
  public static let displayFamilyToken = AurelglyphTokens.fontFamilyDisplay
  public static let uiFamilyToken = AurelglyphTokens.fontFamilyUi
  public static let bodyFamilyToken = AurelglyphTokens.fontFamilyBody
  public static let monoFamilyToken = AurelglyphTokens.fontFamilyMono

  public static func font(_ role: Role, size: CGFloat, weight: Font.Weight = .regular) -> Font {
    switch role {
    case .display:
      return display(size: size, weight: weight)
    case .editorialSerif:
      return editorialSerif(size: size, weight: weight)
    case .ui:
      return ui(size: size, weight: weight)
    case .body:
      return bodyText(size: size, weight: weight)
    case .mono:
      return mono(size: size, weight: weight)
    }
  }

  public static func display(size: CGFloat, weight: Font.Weight = .medium) -> Font {
    customFont(postScriptName: newsreaderName(for: weight), fallback: .serif, size: size, weight: weight)
  }

  public static func editorialSerif(size: CGFloat, weight: Font.Weight = .regular) -> Font {
    customFont(postScriptName: plexSerifName(for: weight), fallback: .serif, size: size, weight: weight)
  }

  public static func ui(size: CGFloat, weight: Font.Weight = .regular) -> Font {
    customFont(postScriptName: plexSansName(for: weight), fallback: .default, size: size, weight: weight)
  }

  public static func bodyText(size: CGFloat, weight: Font.Weight = .regular) -> Font {
    customFont(postScriptName: plexSansName(for: weight), fallback: .default, size: size, weight: weight)
  }

  public static func mono(size: CGFloat, weight: Font.Weight = .regular) -> Font {
    customFont(postScriptName: jetBrainsMonoName(for: weight), fallback: .monospaced, size: size, weight: weight)
  }

  public static let displayLarge = display(size: 38, weight: .medium)
  public static let displayTitle = display(size: 30, weight: .medium)
  public static let title = ui(size: 22, weight: .semibold)
  public static let headline = ui(size: 17, weight: .semibold)
  public static let body = font(.body, size: 17)
  public static let label = ui(size: 13, weight: .semibold)
  public static let caption = ui(size: 12)
  public static let monoLabel = mono(size: 12, weight: .medium)
  public static let monoCaption = mono(size: 11)

  private static func customFont(
    postScriptName: String,
    fallback: Font.Design,
    size: CGFloat,
    weight: Font.Weight
  ) -> Font {
    if AurelglyphFontRegistry.registerFonts().isReady {
      return .custom(postScriptName, size: size)
    }

    return .system(size: size, weight: weight, design: fallback)
  }

  private static func newsreaderName(for weight: Font.Weight) -> String {
    switch weightBucket(for: weight) {
    case .bold:
      return "Newsreader72pt-Bold"
    case .medium:
      return "Newsreader72pt-Medium"
    case .regular:
      return "Newsreader72pt-Regular"
    }
  }

  private static func plexSansName(for weight: Font.Weight) -> String {
    switch weightBucket(for: weight) {
    case .bold:
      return "IBMPlexSans-Bold"
    case .medium:
      return "IBMPlexSans-Medm"
    case .regular:
      return "IBMPlexSans"
    }
  }

  private static func plexSerifName(for weight: Font.Weight) -> String {
    switch weightBucket(for: weight) {
    case .bold:
      return "IBMPlexSerif-Bold"
    case .medium:
      return "IBMPlexSerif-Medium"
    case .regular:
      return "IBMPlexSerif-Regular"
    }
  }

  private static func jetBrainsMonoName(for weight: Font.Weight) -> String {
    switch weightBucket(for: weight) {
    case .bold:
      return "JetBrainsMono-Bold"
    case .medium:
      return "JetBrainsMono-Medium"
    case .regular:
      return "JetBrainsMono-Regular"
    }
  }

  private static func weightBucket(for weight: Font.Weight) -> WeightBucket {
    if weight == .bold || weight == .heavy || weight == .black {
      return .bold
    }

    if weight == .medium || weight == .semibold {
      return .medium
    }

    return .regular
  }

  private enum WeightBucket {
    case regular
    case medium
    case bold
  }
}
