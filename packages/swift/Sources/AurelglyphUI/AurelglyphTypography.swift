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

  public static func font(
    _ role: Role,
    size: CGFloat,
    weight: Font.Weight = .regular,
    relativeTo textStyle: Font.TextStyle? = nil
  ) -> Font {
    switch role {
    case .display:
      return display(size: size, weight: weight, relativeTo: textStyle ?? .largeTitle)
    case .editorialSerif:
      return editorialSerif(size: size, weight: weight, relativeTo: textStyle ?? .title3)
    case .ui:
      return ui(size: size, weight: weight, relativeTo: textStyle ?? .body)
    case .body:
      return bodyText(size: size, weight: weight, relativeTo: textStyle ?? .body)
    case .mono:
      return mono(size: size, weight: weight, relativeTo: textStyle ?? .caption)
    }
  }

  public static func display(
    size: CGFloat,
    weight: Font.Weight = .regular,
    relativeTo textStyle: Font.TextStyle = .largeTitle
  ) -> Font {
    customFont(
      postScriptName: libreBaskervilleName(for: weight),
      fallback: .serif,
      size: size,
      weight: weight,
      relativeTo: textStyle,
      appliesRequestedWeight: usesSyntheticLibreBaskervilleWeight(for: weight)
    )
  }

  public static func editorialSerif(
    size: CGFloat,
    weight: Font.Weight = .regular,
    relativeTo textStyle: Font.TextStyle = .title3
  ) -> Font {
    customFont(
      postScriptName: libreBaskervilleName(for: weight),
      fallback: .serif,
      size: size,
      weight: weight,
      relativeTo: textStyle,
      appliesRequestedWeight: usesSyntheticLibreBaskervilleWeight(for: weight)
    )
  }

  public static func ui(
    size: CGFloat,
    weight: Font.Weight = .regular,
    relativeTo textStyle: Font.TextStyle = .body
  ) -> Font {
    customFont(
      postScriptName: atkinsonHyperlegibleName(for: weight),
      fallback: .default,
      size: size,
      weight: weight,
      relativeTo: textStyle,
      appliesRequestedWeight: usesSyntheticWeight(for: weight)
    )
  }

  public static func bodyText(
    size: CGFloat,
    weight: Font.Weight = .regular,
    relativeTo textStyle: Font.TextStyle = .body
  ) -> Font {
    customFont(
      postScriptName: atkinsonHyperlegibleName(for: weight),
      fallback: .default,
      size: size,
      weight: weight,
      relativeTo: textStyle,
      appliesRequestedWeight: usesSyntheticWeight(for: weight)
    )
  }

  public static func mono(
    size: CGFloat,
    weight: Font.Weight = .regular,
    relativeTo textStyle: Font.TextStyle = .caption
  ) -> Font {
    customFont(
      postScriptName: spaceMonoName(for: weight),
      fallback: .monospaced,
      size: size,
      weight: weight,
      relativeTo: textStyle,
      appliesRequestedWeight: usesSyntheticWeight(for: weight)
    )
  }

  public static let displayLarge = display(size: 38, relativeTo: .largeTitle)
  public static let displayTitle = display(size: 30, relativeTo: .title)
  public static let title = ui(size: 22, weight: .semibold, relativeTo: .title2)
  public static let headline = ui(size: 17, weight: .semibold, relativeTo: .headline)
  public static let body = font(.body, size: 17, relativeTo: .body)
  public static let label = ui(size: 13, weight: .semibold, relativeTo: .subheadline)
  public static let caption = ui(size: 12, relativeTo: .caption)
  public static let monoLabel = mono(size: 12, weight: .medium, relativeTo: .caption)
  public static let monoCaption = mono(size: 11, relativeTo: .caption2)

  private static func customFont(
    postScriptName: String,
    fallback: Font.Design,
    size: CGFloat,
    weight: Font.Weight,
    relativeTo textStyle: Font.TextStyle,
    appliesRequestedWeight: Bool
  ) -> Font {
    if AurelglyphFontRegistry.registerFonts().contains(postScriptName: postScriptName) {
      let font = Font.custom(postScriptName, size: size, relativeTo: textStyle)
      return appliesRequestedWeight ? font.weight(weight) : font
    }

    return Font.system(size: size, weight: weight, design: fallback)
  }

  private static func libreBaskervilleName(for weight: Font.Weight) -> String {
    if weight == .bold || weight == .heavy || weight == .black {
      return "LibreBaskerville-Bold"
    }

    if weight == .semibold {
      return "LibreBaskerville-SemiBold"
    }

    if weight == .medium {
      return "LibreBaskerville-Medium"
    }

    return "LibreBaskerville-Regular"
  }

  private static func atkinsonHyperlegibleName(for weight: Font.Weight) -> String {
    switch weightBucket(for: weight) {
    case .bold:
      return "AtkinsonHyperlegible-Bold"
    case .medium, .regular:
      return "AtkinsonHyperlegible-Regular"
    }
  }

  private static func spaceMonoName(for weight: Font.Weight) -> String {
    switch weightBucket(for: weight) {
    case .bold:
      return "SpaceMono-Bold"
    case .medium, .regular:
      return "SpaceMono-Regular"
    }
  }

  private static func weightBucket(for weight: Font.Weight) -> WeightBucket {
    if weight == .semibold || weight == .bold || weight == .heavy || weight == .black {
      return .bold
    }

    if weight == .medium {
      return .medium
    }

    return .regular
  }

  private static func usesSyntheticWeight(for weight: Font.Weight) -> Bool {
    weightBucket(for: weight) != .bold && weight != .regular
  }

  private static func usesSyntheticLibreBaskervilleWeight(for weight: Font.Weight) -> Bool {
    weight != .regular
      && weight != .medium
      && weight != .semibold
      && weight != .bold
      && weight != .heavy
      && weight != .black
  }

  private enum WeightBucket {
    case regular
    case medium
    case bold
  }
}
