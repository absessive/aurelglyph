import SwiftUI

public struct AurelglyphSegmentedItem: Identifiable, Hashable, Sendable {
  public let id: String
  public let title: String
  public let isDisabled: Bool

  public init(id: String, title: String, isDisabled: Bool = false) {
    self.id = id
    self.title = title
    self.isDisabled = isDisabled
  }
}

public struct AurelglyphNavigationStack<Content: View>: View {
  private let title: String?
  private let content: Content

  public init(_ title: String? = nil, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      if let title {
        Text(title)
          .font(AurelglyphTypography.title)
      }
      content
    }
    .padding(16)
  }
}

public struct AurelglyphToolbar<Content: View>: View {
  private let content: Content

  public init(@ViewBuilder content: () -> Content) {
    self.content = content()
  }

  public var body: some View {
    HStack(spacing: 8) {
      content
    }
    .padding(8)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
  }
}

public struct AurelglyphSheet<Content: View, Actions: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  private let title: String
  private let content: Content
  private let actions: Actions

  public init(_ title: String, @ViewBuilder content: () -> Content, @ViewBuilder actions: () -> Actions) {
    self.title = title
    self.content = content()
    self.actions = actions()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    VStack(alignment: .leading, spacing: 16) {
      HStack {
        Text(title)
          .font(AurelglyphTypography.title)
        Spacer()
        actions
      }
      content
    }
    .padding(20)
    .foregroundStyle(palette.foreground)
    .background(palette.backgroundElevated, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .stroke(palette.border, lineWidth: 1)
    }
  }
}

private struct AurelglyphSheetPresenter<SheetContent: View, Actions: View>: ViewModifier {
  @Binding var isPresented: Bool
  let title: String
  let allowsInteractiveDismiss: Bool
  let sheetContent: SheetContent
  let actions: Actions

  func body(content: Content) -> some View {
    content.sheet(isPresented: $isPresented) {
      AurelglyphSheet(title) {
        sheetContent
      } actions: {
        actions
      }
      .padding(20)
      .interactiveDismissDisabled(!allowsInteractiveDismiss)
    }
  }
}

public extension View {
  /// Presents the existing Aurelglyph sheet surface with native SwiftUI sheet behavior.
  func aurelglyphSheet<SheetContent: View, Actions: View>(
    isPresented: Binding<Bool>,
    title: String,
    allowsInteractiveDismiss: Bool = true,
    @ViewBuilder content: () -> SheetContent,
    @ViewBuilder actions: () -> Actions
  ) -> some View {
    modifier(
      AurelglyphSheetPresenter(
        isPresented: isPresented,
        title: title,
        allowsInteractiveDismiss: allowsInteractiveDismiss,
        sheetContent: content(),
        actions: actions()
      )
    )
  }
}

public struct AurelglyphSegmentedControl: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  private let items: [AurelglyphSegmentedItem]
  @Binding private var selection: String

  public init(items: [AurelglyphSegmentedItem], selection: Binding<String>) {
    self.items = items
    self._selection = selection
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    HStack(spacing: 4) {
      ForEach(items) { item in
        Button {
          selection = item.id
        } label: {
          Text(item.title)
            .font(AurelglyphTypography.label)
            .foregroundStyle(palette.foreground)
            .padding(.horizontal, 12)
            .frame(maxWidth: .infinity, minHeight: 44)
            .background(selection == item.id ? palette.accent.opacity(0.18) : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(item.isDisabled)
        .opacity(item.isDisabled ? 0.52 : 1)
        .accessibilityAddTraits(selection == item.id ? .isSelected : [])
      }
    }
    .padding(4)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    .onAppear(perform: normalizeSelection)
    .onChange(of: items) { _, _ in normalizeSelection() }
    .onChange(of: selection) { _, _ in normalizeSelection() }
  }

  private func normalizeSelection() {
    guard !items.contains(where: { $0.id == selection && !$0.isDisabled }),
          let firstEnabled = items.first(where: { !$0.isDisabled }) else {
      return
    }
    selection = firstEnabled.id
  }
}

public struct AurelglyphSelect: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  private let title: String
  private let items: [AurelglyphSegmentedItem]
  @Binding private var selection: String
  private let isDisabled: Bool
  private let isLoading: Bool
  private let isReadOnly: Bool
  private let error: String?

  public init(
    _ title: String,
    items: [AurelglyphSegmentedItem],
    selection: Binding<String>,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    isReadOnly: Bool = false,
    error: String? = nil
  ) {
    self.title = title
    self.items = items
    self._selection = selection
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.isReadOnly = isReadOnly
    self.error = error
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    VStack(alignment: .leading, spacing: 5) {
      HStack(spacing: 8) {
        Picker(title, selection: $selection) {
          ForEach(items) { item in
            Text(item.title)
              .tag(item.id)
              .disabled(item.isDisabled)
          }
        }
        .pickerStyle(.menu)
        .foregroundStyle(palette.foreground)
        .tint(palette.accent)
        .disabled(isDisabled || isLoading || isReadOnly)
        .accessibilityValue(
          isLoading
            ? controlCopy.loading
            : (items.first(where: { $0.id == selection })?.title ?? "")
        )
        .accessibilityHint(
          aurelglyphControlHint(
            isReadOnly: isReadOnly,
            error: error,
            readOnlyLabel: controlCopy.readOnly
          )
        )
        if isLoading {
          ProgressView().controlSize(.mini)
            .accessibilityLabel(controlCopy.loadingLabel("\(title) options"))
        }
      }
      .opacity(isDisabled ? 0.52 : 1)

      if let error {
        Text(error)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(palette.danger)
          .accessibilityLabel(error)
      }
    }
  }
}

public struct AurelglyphAlert<Content: View>: View {
  private let title: String
  private let content: Content

  public init(_ title: String, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  public var body: some View {
    HStack(alignment: .top, spacing: 12) {
      Circle()
        .fill(Color.accentColor)
        .frame(width: 10, height: 10)
        .padding(.top, 5)
      VStack(alignment: .leading, spacing: 4) {
        Text(title)
          .font(AurelglyphTypography.label)
        content
          .font(AurelglyphTypography.caption)
          .foregroundStyle(.secondary)
      }
    }
    .padding(16)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

public struct AurelglyphEmptyState<Actions: View>: View {
  private let title: String
  private let message: String?
  private let systemImage: String
  private let actions: Actions

  public init(_ title: String, message: String? = nil, systemImage: String = "archivebox", @ViewBuilder actions: () -> Actions) {
    self.title = title
    self.message = message
    self.systemImage = systemImage
    self.actions = actions()
  }

  public var body: some View {
    VStack(spacing: 12) {
      Image(systemName: systemImage)
        .font(AurelglyphTypography.title)
        .foregroundStyle(.tint)
      Text(title)
        .font(AurelglyphTypography.headline)
      if let message {
        Text(message)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(.secondary)
      }
      actions
    }
    .frame(maxWidth: .infinity, minHeight: 220)
    .padding(24)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
  }
}

public struct AurelglyphAvatar: View {
  private let name: String
  private let initials: String

  public init(_ name: String, initials: String? = nil) {
    self.name = name
    self.initials = initials ?? name.split(separator: " ").prefix(2).compactMap(\.first).map { String($0).uppercased() }.joined()
  }

  public var body: some View {
    Text(initials)
      .font(AurelglyphTypography.monoCaption)
      .frame(width: 36, height: 36)
      .background(Color.accentColor.opacity(0.18), in: Circle())
      .accessibilityLabel(name)
  }
}

public struct AurelglyphBadge: View {
  private let label: String

  public init(_ label: String) {
    self.label = label
  }

  public var body: some View {
    Text(label)
      .font(AurelglyphTypography.monoCaption)
      .textCase(.uppercase)
      .padding(.horizontal, 8)
      .padding(.vertical, 4)
      .background(Color.accentColor.opacity(0.16), in: Capsule())
  }
}
