import SwiftUI

public enum AurelglyphSurfaceLevel: Sendable {
  case flat
  case base
  case muted
  case strong
  case elevated
}

/// A token-backed panel surface shared by cards, overlays, and layout modules.
public struct AurelglyphSurface<Content: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  private let level: AurelglyphSurfaceLevel
  private let padding: CGFloat
  private let cornerRadius: CGFloat
  private let content: Content

  public init(
    level: AurelglyphSurfaceLevel = .base,
    padding: CGFloat = 16,
    cornerRadius: CGFloat = 18,
    @ViewBuilder content: () -> Content
  ) {
    self.level = level
    self.padding = padding
    self.cornerRadius = cornerRadius
    self.content = content()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    content
      .padding(padding)
      .frame(maxWidth: .infinity, alignment: .leading)
      .foregroundStyle(palette.foreground)
      .background(background(palette), in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
      .overlay {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
          .stroke(palette.border, lineWidth: 1)
      }
  }

  private func background(_ palette: AurelglyphPalette) -> Color {
    switch level {
    case .flat: .clear
    case .base: palette.surface
    case .muted: palette.surfaceMuted
    case .strong: palette.surfaceStrong
    case .elevated: palette.backgroundElevated
    }
  }
}

/// A lightweight bordered layout box. Unlike `AurelglyphSurface`, its default
/// background is transparent so grouping content does not imply elevation.
public struct AurelglyphBox<Content: View>: View {
  private let level: AurelglyphSurfaceLevel
  private let padding: CGFloat
  private let cornerRadius: CGFloat
  private let content: Content

  public init(
    level: AurelglyphSurfaceLevel = .flat,
    padding: CGFloat = 16,
    cornerRadius: CGFloat = 12,
    @ViewBuilder content: () -> Content
  ) {
    self.level = level
    self.padding = padding
    self.cornerRadius = cornerRadius
    self.content = content()
  }

  public var body: some View {
    AurelglyphSurface(level: level, padding: padding, cornerRadius: cornerRadius) {
      content
    }
  }
}

public enum AurelglyphStackAlignment: Sendable {
  case start
  case center
  case end
}

/// A token-friendly stack that can switch axes without changing its content API.
public struct AurelglyphStack<Content: View>: View {
  private let axis: AurelglyphAxis
  private let alignment: AurelglyphStackAlignment
  private let spacing: CGFloat
  private let content: Content

  public init(
    axis: AurelglyphAxis = .vertical,
    alignment: AurelglyphStackAlignment = .start,
    spacing: CGFloat = 16,
    @ViewBuilder content: () -> Content
  ) {
    self.axis = axis
    self.alignment = alignment
    self.spacing = spacing
    self.content = content()
  }

  public var body: some View {
    layout {
      content
    }
  }

  private var layout: AnyLayout {
    switch axis {
    case .horizontal:
      AnyLayout(HStackLayout(alignment: verticalAlignment, spacing: spacing))
    case .vertical:
      AnyLayout(VStackLayout(alignment: horizontalAlignment, spacing: spacing))
    }
  }

  private var horizontalAlignment: HorizontalAlignment {
    switch alignment {
    case .start: .leading
    case .center: .center
    case .end: .trailing
    }
  }

  private var verticalAlignment: VerticalAlignment {
    switch alignment {
    case .start: .top
    case .center: .center
    case .end: .bottom
    }
  }
}

/// Centers content at a readable maximum width while retaining compact-device padding.
public struct AurelglyphContainer<Content: View>: View {
  private let maxWidth: CGFloat
  private let horizontalPadding: CGFloat
  private let content: Content

  public init(
    maxWidth: CGFloat = 1120,
    horizontalPadding: CGFloat = 20,
    @ViewBuilder content: () -> Content
  ) {
    self.maxWidth = maxWidth
    self.horizontalPadding = horizontalPadding
    self.content = content()
  }

  public var body: some View {
    HStack(spacing: 0) {
      Spacer(minLength: 0)
      content
        .frame(maxWidth: maxWidth, alignment: .leading)
      Spacer(minLength: 0)
    }
    .padding(.horizontal, horizontalPadding)
  }
}

/// A responsive, adaptive grid that keeps Aurelglyph panels on a consistent spacing rhythm.
public struct AurelglyphGrid<Content: View>: View {
  private let minimumColumnWidth: CGFloat
  private let maximumColumnWidth: CGFloat
  private let spacing: CGFloat
  private let alignment: HorizontalAlignment
  private let content: Content

  public init(
    minimumColumnWidth: CGFloat = 240,
    maximumColumnWidth: CGFloat = .infinity,
    spacing: CGFloat = 16,
    alignment: HorizontalAlignment = .leading,
    @ViewBuilder content: () -> Content
  ) {
    self.minimumColumnWidth = max(minimumColumnWidth, 1)
    self.maximumColumnWidth = max(maximumColumnWidth, minimumColumnWidth)
    self.spacing = max(spacing, 0)
    self.alignment = alignment
    self.content = content()
  }

  public var body: some View {
    LazyVGrid(
      columns: [
        GridItem(
          .adaptive(minimum: minimumColumnWidth, maximum: maximumColumnWidth),
          spacing: spacing,
          alignment: .top
        )
      ],
      alignment: alignment,
      spacing: spacing
    ) {
      content
    }
  }
}
