import SwiftUI

/// The neutral color mode used by Aurelglyph surfaces.
public enum AurelglyphColorMode: String, CaseIterable, Sendable {
  case system
  case light
  case dark
}

/// The visual treatment applied independently from color mode.
public enum AurelglyphAppearance: String, CaseIterable, Sendable {
  case atelier
  case quiet
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
  public var appearance: AurelglyphAppearance

  public init(
    mode: AurelglyphColorMode = .system,
    accent: AurelglyphAccent = .royalPurple,
    appearance: AurelglyphAppearance = .atelier
  ) {
    self.mode = mode
    self.accent = accent
    self.appearance = appearance
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
    return AurelglyphPalette(mode: resolvedMode, accent: accent, appearance: appearance)
  }

  public var surfaceCornerRadius: CGFloat { appearance == .quiet ? 12 : 18 }
  public var boxCornerRadius: CGFloat { appearance == .quiet ? 8 : 12 }

  public func resolvedPanelCornerRadius(_ preferred: CGFloat) -> CGFloat {
    appearance == .quiet ? min(preferred, surfaceCornerRadius) : preferred
  }
}

/// Resolved semantic colors for an Aurelglyph mode and accent.
public struct AurelglyphPalette {
  public let mode: AurelglyphColorMode
  public let appearance: AurelglyphAppearance
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

  fileprivate init(mode: AurelglyphColorMode, accent: AurelglyphAccent, appearance: AurelglyphAppearance) {
    self.mode = mode
    self.appearance = appearance
    let quiet = appearance == .quiet
    self.accent = quiet
      ? Color(aurelglyphHex: mode == .light
        ? AurelglyphTokens.colorAppearanceQuietAccent600
        : AurelglyphTokens.colorAppearanceQuietAccent200)
      : accent.color(shade: mode == .light ? 600 : 200)
    accentForeground = Color(aurelglyphHex: quiet ? "#ffffff" : AurelglyphTokens.colorModeDarkText)
    accentControl = quiet
      ? Color(aurelglyphHex: AurelglyphTokens.colorAppearanceQuietAccent500)
      : accent.color(shade: 500)
    accentControlStrong = quiet
      ? Color(aurelglyphHex: AurelglyphTokens.colorAppearanceQuietAccent600)
      : accent.color(shade: 600)
    focus = quiet
      ? Color(aurelglyphHex: mode == .light
        ? AurelglyphTokens.colorAppearanceQuietAccent500
        : AurelglyphTokens.colorAppearanceQuietAccent300)
      : accent.color(shade: mode == .light ? 500 : 300)

    if mode == .light {
      background = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightBackground : AurelglyphTokens.colorModeLightBackground)
      backgroundElevated = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightBackgroundElevated : AurelglyphTokens.colorModeLightBackgroundElevated)
      surface = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightSurface : AurelglyphTokens.colorModeLightSurface)
      surfaceMuted = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightSurface2 : AurelglyphTokens.colorModeLightSurface2)
      surfaceStrong = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightSurface3 : AurelglyphTokens.colorModeLightSurface3)
      border = quiet
        ? Color(aurelglyphCSSColor: AurelglyphTokens.colorAppearanceQuietModeLightBorderSoft)
        : Color(aurelglyphHex: AurelglyphTokens.colorModeLightBorder).opacity(0.55)
      borderStrong = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightBorder : AurelglyphTokens.colorModeLightBorder)
      foreground = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightText : AurelglyphTokens.colorModeLightText)
      muted = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightTextMuted : AurelglyphTokens.colorModeLightTextMuted)
      subtle = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeLightTextSubtle : AurelglyphTokens.colorModeLightTextSubtle)
      overlay = quiet
        ? Color(aurelglyphCSSColor: Self.quietOverlayToken(for: .light))
        : Color(aurelglyphHex: AurelglyphTokens.colorModeLightText).opacity(0.42)
      danger = Color(aurelglyphHex: AurelglyphTokens.colorStatusDangerOnLight)
      success = Color(aurelglyphHex: AurelglyphTokens.colorStatusSuccessOnLight)
      warning = Color(aurelglyphHex: AurelglyphTokens.colorStatusWarningOnLight)
      info = Color(aurelglyphHex: AurelglyphTokens.colorStatusInfoOnLight)
    } else {
      background = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkBackground : AurelglyphTokens.colorModeDarkBackground)
      backgroundElevated = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkBackgroundElevated : AurelglyphTokens.colorModeDarkBackgroundElevated)
      surface = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkSurface : AurelglyphTokens.colorModeDarkSurface)
      surfaceMuted = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkSurface2 : AurelglyphTokens.colorModeDarkSurface2)
      surfaceStrong = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkSurface3 : AurelglyphTokens.colorModeDarkSurface3)
      border = quiet
        ? Color(aurelglyphCSSColor: AurelglyphTokens.colorAppearanceQuietModeDarkBorderSoft)
        : Color(aurelglyphHex: AurelglyphTokens.colorModeDarkText).opacity(0.10)
      borderStrong = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkBorder : AurelglyphTokens.colorModeDarkBorder)
      foreground = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkText : AurelglyphTokens.colorModeDarkText)
      muted = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkTextMuted : AurelglyphTokens.colorModeDarkTextMuted)
      subtle = Color(aurelglyphHex: quiet ? AurelglyphTokens.colorAppearanceQuietModeDarkTextSubtle : AurelglyphTokens.colorModeDarkTextSubtle)
      overlay = quiet
        ? Color(aurelglyphCSSColor: Self.quietOverlayToken(for: .dark))
        : Color(aurelglyphHex: AurelglyphTokens.colorModeDarkBackground).opacity(0.72)
      danger = Color(aurelglyphHex: AurelglyphTokens.colorStatusDanger)
      success = Color(aurelglyphHex: AurelglyphTokens.colorStatusSuccess)
      warning = Color(aurelglyphHex: AurelglyphTokens.colorStatusWarning)
      info = Color(aurelglyphHex: AurelglyphTokens.colorStatusInfo)
    }
  }

  static func quietOverlayToken(for mode: AurelglyphColorMode) -> String {
    mode == .light
      ? AurelglyphTokens.colorAppearanceQuietModeLightOverlay
      : AurelglyphTokens.colorAppearanceQuietModeDarkOverlay
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

struct AurelglyphPanelBackgroundModifier: ViewModifier {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  let cornerRadius: CGFloat
  let bordered: Bool

  func body(content: Content) -> some View {
    let palette = theme.palette(for: colorScheme)
    let resolvedRadius = theme.resolvedPanelCornerRadius(cornerRadius)
    let shape = RoundedRectangle(cornerRadius: resolvedRadius, style: .continuous)
    let fill = theme.appearance == .quiet
      ? AnyShapeStyle(palette.surface)
      : AnyShapeStyle(.thinMaterial)
    let stroke = theme.appearance == .quiet
      ? AnyShapeStyle(palette.border)
      : AnyShapeStyle(.quaternary)

    content
      .background(fill, in: shape)
      .overlay {
        if bordered {
          shape.stroke(stroke, lineWidth: 1)
        }
      }
  }
}

extension View {
  func aurelglyphPanelBackground(cornerRadius: CGFloat = 0, bordered: Bool = false) -> some View {
    modifier(AurelglyphPanelBackgroundModifier(cornerRadius: cornerRadius, bordered: bordered))
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

  init(aurelglyphCSSColor color: String) {
    if color.hasPrefix("#") {
      self.init(aurelglyphHex: color)
      return
    }

    let components = color
      .replacingOccurrences(of: "rgba(", with: "")
      .replacingOccurrences(of: ")", with: "")
      .split(separator: ",")
      .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
    guard components.count == 4 else {
      self.init(aurelglyphHex: "#000000")
      return
    }
    self.init(
      .sRGB,
      red: components[0] / 255,
      green: components[1] / 255,
      blue: components[2] / 255,
      opacity: components[3]
    )
  }
}
