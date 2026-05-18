import SwiftUI

public enum AurelglyphTypography {
  public enum Role: Sendable {
    case display
    case ui
    case body
    case mono
  }

  public static let bundlesWebFontAssets = false
  public static let displayFamilyToken = AurelglyphTokens.fontFamilyDisplay
  public static let uiFamilyToken = AurelglyphTokens.fontFamilyUi
  public static let bodyFamilyToken = AurelglyphTokens.fontFamilyBody
  public static let monoFamilyToken = AurelglyphTokens.fontFamilyMono

  public static func font(_ role: Role, size: CGFloat, weight: Font.Weight = .regular) -> Font {
    switch role {
    case .display:
      return display(size: size, weight: weight)
    case .ui:
      return ui(size: size, weight: weight)
    case .body:
      return .system(size: size, weight: weight, design: .default)
    case .mono:
      return mono(size: size, weight: weight)
    }
  }

  public static func display(size: CGFloat, weight: Font.Weight = .medium) -> Font {
    .system(size: size, weight: weight, design: .serif)
  }

  public static func ui(size: CGFloat, weight: Font.Weight = .regular) -> Font {
    .system(size: size, weight: weight, design: .default)
  }

  public static func mono(size: CGFloat, weight: Font.Weight = .regular) -> Font {
    .system(size: size, weight: weight, design: .monospaced)
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
}
