import SwiftUI

/// A compact disclosure for optional context that should not compete with the primary task.
///
/// The trigger remains a full-size accessible control while the information surface adapts
/// from a popover to a sheet in compact environments.
public struct AurelglyphMoreInformation<Content: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  @State private var isPresented = false
  @FocusState private var triggerFocused: Bool
  @AccessibilityFocusState private var accessibleTriggerFocused: Bool
  @AccessibilityFocusState private var accessibleInformationFocused: Bool

  private let title: String
  private let triggerLabel: String
  private let closeLabel: String
  private let content: Content

  public init(
    _ title: String,
    triggerLabel: String = "More information",
    closeLabel: String? = nil,
    @ViewBuilder content: () -> Content
  ) {
    self.title = title
    self.triggerLabel = triggerLabel
    self.closeLabel = closeLabel ?? "Close \(title)"
    self.content = content()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    Button {
      isPresented.toggle()
    } label: {
      Label(triggerLabel, systemImage: "info.circle")
        .font(AurelglyphTypography.monoLabel)
        .foregroundStyle(palette.foreground)
        .padding(.horizontal, 10)
        .frame(minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension)
        .background(
          palette.surfaceMuted,
          in: RoundedRectangle(cornerRadius: theme.boxCornerRadius, style: .continuous)
        )
        .overlay {
          RoundedRectangle(cornerRadius: theme.boxCornerRadius, style: .continuous)
            .stroke(palette.borderStrong, lineWidth: 1)
        }
        .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .focused($triggerFocused)
    .accessibilityFocused($accessibleTriggerFocused)
    .accessibilityLabel(triggerLabel)
    .accessibilityValue(isPresented ? controlCopy.expanded : controlCopy.collapsed)
    .popover(isPresented: $isPresented, attachmentAnchor: .rect(.bounds), arrowEdge: .top) {
      informationSurface(palette: palette)
        .presentationBackground(palette.backgroundElevated)
        .presentationCompactAdaptation(.sheet)
    }
    .onChange(of: isPresented) { _, presented in
      restoreFocus(afterPresenting: presented)
    }
  }

  private func informationSurface(palette: AurelglyphPalette) -> some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack(alignment: .top, spacing: 12) {
        Text(title)
          .font(AurelglyphTypography.headline)
          .foregroundStyle(palette.foreground)
          .accessibilityAddTraits(.isHeader)
          .accessibilityFocused($accessibleInformationFocused)

        Spacer(minLength: 12)

        Button {
          isPresented = false
        } label: {
          Image(systemName: "xmark")
            .frame(
              width: AurelglyphResponsiveLayout.minimumInteractiveDimension,
              height: AurelglyphResponsiveLayout.minimumInteractiveDimension
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .foregroundStyle(palette.foreground)
        .background(
          palette.surfaceMuted,
          in: RoundedRectangle(cornerRadius: theme.boxCornerRadius, style: .continuous)
        )
        .accessibilityLabel(closeLabel)
      }

      ViewThatFits(in: .vertical) {
        content
          .font(AurelglyphTypography.body)
          .foregroundStyle(palette.muted)
          .frame(maxWidth: .infinity, alignment: .leading)
          .fixedSize(horizontal: false, vertical: true)

        ScrollView {
          content
            .font(AurelglyphTypography.body)
            .foregroundStyle(palette.muted)
            .frame(maxWidth: .infinity, alignment: .leading)
            .fixedSize(horizontal: false, vertical: true)
        }
        .scrollBounceBehavior(.basedOnSize)
      }
      .frame(maxHeight: 420)
    }
    .padding(16)
    .frame(minWidth: 240, idealWidth: 300, maxWidth: 360, alignment: .leading)
    .background(palette.backgroundElevated)
    .accessibilityElement(children: .contain)
    .accessibilityLabel(title)
  }

  private func restoreFocus(afterPresenting presented: Bool) {
    Task { @MainActor in
      await Task.yield()
      if presented {
        accessibleInformationFocused = true
      } else {
        accessibleInformationFocused = false
        triggerFocused = true
        accessibleTriggerFocused = true
      }
    }
  }
}
