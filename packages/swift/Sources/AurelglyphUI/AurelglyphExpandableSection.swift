import SwiftUI

public struct AurelglyphExpandableSection<Content: View>: View {
  @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Binding private var isExpanded: Bool
  private let title: String
  private let eyebrow: String?
  private let content: Content
  private let isDisabled: Bool
  private let isHeading: Bool
  private let headingLevel: AccessibilityHeadingLevel

  public init(
    _ title: String,
    eyebrow: String? = nil,
    isExpanded: Binding<Bool>,
    isDisabled: Bool = false,
    isHeading: Bool = false,
    headingLevel: AccessibilityHeadingLevel = .h3,
    @ViewBuilder content: () -> Content
  ) {
    self.title = title
    self.eyebrow = eyebrow
    self._isExpanded = isExpanded
    self.content = content()
    self.isDisabled = isDisabled
    self.isHeading = isHeading
    self.headingLevel = headingLevel
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    VStack(alignment: .leading, spacing: 0) {
      Button {
        guard !isDisabled else { return }
        withAnimation(Self.animation(reduceMotion: accessibilityReduceMotion)) {
          isExpanded.toggle()
        }
      } label: {
        HStack(spacing: 12) {
          VStack(alignment: .leading, spacing: 3) {
            if let eyebrow {
              Text(eyebrow)
                .font(AurelglyphTypography.monoCaption)
                .textCase(.uppercase)
                .foregroundStyle(palette.muted)
            }

            Text(title)
              .font(AurelglyphTypography.headline)
              .foregroundStyle(palette.foreground)
          }

          Spacer(minLength: 12)

          Image(systemName: "chevron.forward")
            .font(AurelglyphTypography.label)
            .rotationEffect(.degrees(isExpanded ? 90 : 0))
            .foregroundStyle(palette.accent)
            .accessibilityHidden(true)
        }
        .frame(
          maxWidth: .infinity,
          minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension,
          alignment: .leading
        )
        .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .disabled(isDisabled)
      .opacity(isDisabled ? 0.52 : 1)
      .accessibilityAddTraits(isHeading ? [.isButton, .isHeader] : .isButton)
      .modifier(AurelglyphDisclosureHeading(level: isHeading ? headingLevel : nil))
      .accessibilityValue(Self.stateLabel(isExpanded: isExpanded, copy: controlCopy))

      if isExpanded {
        content
          .padding(.top, 12)
          .transition(.opacity.combined(with: .move(edge: .top)))
      }
    }
    .padding(16)
    .aurelglyphPanelBackground(cornerRadius: 18, bordered: true)
  }

  static func animation(reduceMotion: Bool) -> Animation? {
    reduceMotion ? nil : .easeInOut(duration: 0.22)
  }

  static func stateLabel(isExpanded: Bool, copy: AurelglyphControlCopy) -> String {
    isExpanded ? copy.expanded : copy.collapsed
  }
}

private struct AurelglyphDisclosureHeading: ViewModifier {
  let level: AccessibilityHeadingLevel?
  @ViewBuilder func body(content: Content) -> some View {
    if let level { content.accessibilityHeading(level) } else { content }
  }
}
