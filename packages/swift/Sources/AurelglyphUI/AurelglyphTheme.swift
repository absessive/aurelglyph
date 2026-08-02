import SwiftUI

/// The neutral color mode used by Aurelglyph surfaces.
public enum AurelglyphColorMode: String, CaseIterable, Sendable {
  case system
  case light
  case dark
}

/// The shared accent families supported by every Aurelglyph adapter.
public enum AurelglyphAccent: String, CaseIterable, Sendable {
  case amber
  case forest
  case royalPurple = "royal-purple"
  case deepBlue = "deep-blue"
  case cyan
  case steel

  public var color: Color {
    color(shade: 300)
  }

  fileprivate func color(shade: Int) -> Color {
    Color(aurelglyphHex: tokenValue(shade: shade))
  }

  func tokenValue(shade: Int) -> String {
    let hex: String
    switch self {
    case .amber:
      switch shade {
      case 200: hex = AurelglyphTokens.colorAccentAmber200
      case 500: hex = AurelglyphTokens.colorAccentAmber500
      case 600: hex = AurelglyphTokens.colorAccentAmber600
      default: hex = AurelglyphTokens.colorAccentAmber300
      }
    case .forest:
      switch shade {
      case 200: hex = AurelglyphTokens.colorAccentForest200
      case 500: hex = AurelglyphTokens.colorAccentForest500
      case 600: hex = AurelglyphTokens.colorAccentForest600
      default: hex = AurelglyphTokens.colorAccentForest300
      }
    case .royalPurple:
      switch shade {
      case 200: hex = AurelglyphTokens.colorAccentRoyalPurple200
      case 500: hex = AurelglyphTokens.colorAccentRoyalPurple500
      case 600: hex = AurelglyphTokens.colorAccentRoyalPurple600
      default: hex = AurelglyphTokens.colorAccentRoyalPurple300
      }
    case .deepBlue:
      switch shade {
      case 200: hex = AurelglyphTokens.colorAccentDeepBlue200
      case 500: hex = AurelglyphTokens.colorAccentDeepBlue500
      case 600: hex = AurelglyphTokens.colorAccentDeepBlue600
      default: hex = AurelglyphTokens.colorAccentDeepBlue300
      }
    case .cyan:
      switch shade {
      case 200: hex = AurelglyphTokens.colorAccentCyan200
      case 500: hex = AurelglyphTokens.colorAccentCyan500
      case 600: hex = AurelglyphTokens.colorAccentCyan600
      default: hex = AurelglyphTokens.colorAccentCyan300
      }
    case .steel:
      switch shade {
      case 200: hex = AurelglyphTokens.colorAccentSteel200
      case 500: hex = AurelglyphTokens.colorAccentSteel500
      case 600: hex = AurelglyphTokens.colorAccentSteel600
      default: hex = AurelglyphTokens.colorAccentSteel300
      }
    }
    return hex
  }
}

/// Theme configuration installed through the SwiftUI environment.
public struct AurelglyphTheme: Equatable, Sendable {
  public var mode: AurelglyphColorMode
  public var accent: AurelglyphAccent

  public init(mode: AurelglyphColorMode = .system, accent: AurelglyphAccent = .royalPurple) {
    self.mode = mode
    self.accent = accent
  }

  public static let standard = AurelglyphTheme()

  public var preferredColorScheme: ColorScheme? {
    switch mode {
    case .system: nil
    case .light: .light
    case .dark: .dark
    }
  }

  public func palette(for systemColorScheme: ColorScheme) -> AurelglyphPalette {
    let resolvedMode: AurelglyphColorMode = mode == .system
      ? (systemColorScheme == .dark ? .dark : .light)
      : mode
    return AurelglyphPalette(mode: resolvedMode, accent: accent)
  }
}

/// Resolved semantic colors for an Aurelglyph mode and accent.
public struct AurelglyphPalette {
  public let mode: AurelglyphColorMode
  public let accent: Color
  public let accentForeground: Color
  public let accentControl: Color
  public let accentControlStrong: Color
  public let focus: Color
  public let background: Color
  public let backgroundElevated: Color
  public let surface: Color
  public let surfaceMuted: Color
  public let surfaceStrong: Color
  public let border: Color
  public let borderStrong: Color
  public let foreground: Color
  public let muted: Color
  public let subtle: Color
  public let overlay: Color
  public let danger: Color
  public let success: Color
  public let warning: Color
  public let info: Color

  fileprivate init(mode: AurelglyphColorMode, accent: AurelglyphAccent) {
    self.mode = mode
    self.accent = accent.color(shade: mode == .light ? 600 : 200)
    accentForeground = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkText)
    accentControl = accent.color(shade: 500)
    accentControlStrong = accent.color(shade: 600)
    focus = accent.color(shade: mode == .light ? 500 : 300)

    if mode == .light {
      background = Color(aurelglyphHex: AurelglyphTokens.colorModeLightBackground)
      backgroundElevated = Color(aurelglyphHex: AurelglyphTokens.colorModeLightBackgroundElevated)
      surface = Color(aurelglyphHex: AurelglyphTokens.colorModeLightSurface)
      surfaceMuted = Color(aurelglyphHex: AurelglyphTokens.colorModeLightSurface2)
      surfaceStrong = Color(aurelglyphHex: AurelglyphTokens.colorModeLightSurface3)
      border = Color(aurelglyphHex: AurelglyphTokens.colorModeLightBorder).opacity(0.55)
      borderStrong = Color(aurelglyphHex: AurelglyphTokens.colorModeLightBorder)
      foreground = Color(aurelglyphHex: AurelglyphTokens.colorModeLightText)
      muted = Color(aurelglyphHex: AurelglyphTokens.colorModeLightTextMuted)
      subtle = Color(aurelglyphHex: AurelglyphTokens.colorModeLightTextSubtle)
      overlay = Color(aurelglyphHex: AurelglyphTokens.colorModeLightText).opacity(0.42)
      danger = Color(aurelglyphHex: AurelglyphTokens.colorStatusDangerOnLight)
      success = Color(aurelglyphHex: AurelglyphTokens.colorStatusSuccessOnLight)
      warning = Color(aurelglyphHex: AurelglyphTokens.colorStatusWarningOnLight)
      info = Color(aurelglyphHex: AurelglyphTokens.colorStatusInfoOnLight)
    } else {
      background = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkBackground)
      backgroundElevated = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkBackgroundElevated)
      surface = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkSurface)
      surfaceMuted = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkSurface2)
      surfaceStrong = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkSurface3)
      border = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkText).opacity(0.10)
      borderStrong = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkBorder)
      foreground = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkText)
      muted = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkTextMuted)
      subtle = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkTextSubtle)
      overlay = Color(aurelglyphHex: AurelglyphTokens.colorModeDarkBackground).opacity(0.72)
      danger = Color(aurelglyphHex: AurelglyphTokens.colorStatusDanger)
      success = Color(aurelglyphHex: AurelglyphTokens.colorStatusSuccess)
      warning = Color(aurelglyphHex: AurelglyphTokens.colorStatusWarning)
      info = Color(aurelglyphHex: AurelglyphTokens.colorStatusInfo)
    }
  }
}

private struct AurelglyphThemeKey: EnvironmentKey {
  static let defaultValue = AurelglyphTheme.standard
}

public extension EnvironmentValues {
  var aurelglyphTheme: AurelglyphTheme {
    get { self[AurelglyphThemeKey.self] }
    set { self[AurelglyphThemeKey.self] = newValue }
  }
}

private struct AurelglyphThemeModifier: ViewModifier {
  @Environment(\.colorScheme) private var colorScheme
  let theme: AurelglyphTheme

  func body(content: Content) -> some View {
    let palette = theme.palette(for: colorScheme)
    content
      .environment(\.aurelglyphTheme, theme)
      .tint(palette.accent)
      .preferredColorScheme(theme.preferredColorScheme)
  }
}

public extension View {
  /// Installs Aurelglyph mode and accent values for this view hierarchy.
  func aurelglyphTheme(_ theme: AurelglyphTheme) -> some View {
    modifier(AurelglyphThemeModifier(theme: theme))
  }
}

extension Color {
  init(aurelglyphHex hex: String) {
    let normalized = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    let value = UInt64(normalized, radix: 16) ?? 0
    let red = Double((value >> 16) & 0xff) / 255
    let green = Double((value >> 8) & 0xff) / 255
    let blue = Double(value & 0xff) / 255
    self.init(red: red, green: green, blue: blue)
  }
}
