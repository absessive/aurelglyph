import SwiftUI

public struct AurelglyphExpandableSection<Content: View>: View {
  @Binding private var isExpanded: Bool
  private let title: String
  private let eyebrow: String?
  private let content: Content

  public init(
    _ title: String,
    eyebrow: String? = nil,
    isExpanded: Binding<Bool>,
    @ViewBuilder content: () -> Content
  ) {
    self.title = title
    self.eyebrow = eyebrow
    self._isExpanded = isExpanded
    self.content = content()
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      Button {
        withAnimation(.easeInOut(duration: 0.22)) {
          isExpanded.toggle()
        }
      } label: {
        HStack(spacing: 12) {
          VStack(alignment: .leading, spacing: 3) {
            if let eyebrow {
              Text(eyebrow)
                .font(.caption2.monospaced())
                .textCase(.uppercase)
                .foregroundStyle(.secondary)
            }

            Text(title)
              .font(.headline)
              .foregroundStyle(.primary)
          }

          Spacer(minLength: 12)

          Image(systemName: "chevron.right")
            .font(.caption.weight(.semibold))
            .rotationEffect(.degrees(isExpanded ? 90 : 0))
            .foregroundStyle(.tint)
            .accessibilityHidden(true)
        }
        .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .accessibilityAddTraits(.isButton)
      .accessibilityValue(isExpanded ? "Expanded" : "Collapsed")

      if isExpanded {
        content
          .padding(.top, 12)
          .transition(.opacity.combined(with: .move(edge: .top)))
      }
    }
    .padding(16)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .stroke(.quaternary, lineWidth: 1)
    }
  }
}
