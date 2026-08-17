import SwiftUI

public enum AurelglyphDialogSize: Sendable {
  case compact
  case standard
  case wide

  var maxWidth: CGFloat {
    switch self {
    case .compact: 420
    case .standard: 560
    case .wide: 760
    }
  }
}

/// Dialog content intended for presentation with ``View/aurelglyphDialog``.
public struct AurelglyphDialog<Content: View, Actions: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Binding private var isPresented: Bool
  private let title: String
  private let message: String?
  private let size: AurelglyphDialogSize
  private let showsCloseButton: Bool
  private let closeLabel: String
  private let content: Content
  private let actions: Actions

  public init(
    _ title: String,
    message: String? = nil,
    isPresented: Binding<Bool>,
    size: AurelglyphDialogSize = .standard,
    showsCloseButton: Bool = true,
    closeLabel: String? = nil,
    @ViewBuilder content: () -> Content,
    @ViewBuilder actions: () -> Actions
  ) {
    self.title = title
    self.message = message
    self._isPresented = isPresented
    self.size = size
    self.showsCloseButton = showsCloseButton
    self.closeLabel = closeLabel ?? "Close \(title)"
    self.content = content()
    self.actions = actions()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    let cornerRadius = theme.resolvedPanelCornerRadius(24)

    if isPresented {
      VStack(alignment: .leading, spacing: 20) {
      HStack(alignment: .top, spacing: 16) {
        VStack(alignment: .leading, spacing: 6) {
          Text(title)
            .font(AurelglyphTypography.title)
            .accessibilityAddTraits(.isHeader)
          if let message {
            Text(message)
              .font(AurelglyphTypography.body)
              .foregroundStyle(palette.muted)
          }
        }
        Spacer(minLength: 12)
        if showsCloseButton {
          Button {
            isPresented = false
          } label: {
            Image(systemName: "xmark")
              .frame(width: 44, height: 44)
          }
          .buttonStyle(.plain)
          .accessibilityLabel(closeLabel)
        }
      }

      ScrollView {
        content
          .frame(maxWidth: .infinity, alignment: .leading)
      }
      .frame(maxHeight: 480)

      dialogActionsLayout {
        actions
      }
      .controlSize(.large)
      .frame(maxWidth: .infinity, alignment: .trailing)
      }
      .padding(24)
      .frame(maxWidth: size.maxWidth)
      .foregroundStyle(palette.foreground)
      .background(palette.backgroundElevated)
      .overlay {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
          .stroke(palette.border, lineWidth: 1)
      }
      .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
      .accessibilityElement(children: .contain)
      .accessibilityAddTraits(.isModal)
    }
  }

  private var dialogActionsLayout: AurelglyphAdaptiveLayout {
    AurelglyphAdaptiveLayout(
      primary: AnyLayout(HStackLayout(spacing: 10)),
      fallback: AnyLayout(VStackLayout(alignment: .trailing, spacing: 10)),
      fittingAxis: .horizontal,
      forceFallback: false
    )
  }
}

private struct AurelglyphDialogPresenter<DialogContent: View, Actions: View>: ViewModifier {
  @Binding var isPresented: Bool
  let title: String
  let message: String?
  let size: AurelglyphDialogSize
  let allowsInteractiveDismiss: Bool
  let closeLabel: String?
  let dialogContent: DialogContent
  let actions: Actions

  func body(content: Content) -> some View {
    content.sheet(isPresented: $isPresented) {
      AurelglyphDialog(
        title,
        message: message,
        isPresented: $isPresented,
        size: size,
        closeLabel: closeLabel
      ) {
        dialogContent
      } actions: {
        actions
      }
      .padding(20)
      .presentationBackground(.clear)
      .interactiveDismissDisabled(!allowsInteractiveDismiss)
    }
  }
}

public extension View {
  /// Presents a native modal sheet containing an Aurelglyph dialog surface.
  func aurelglyphDialog<DialogContent: View, Actions: View>(
    isPresented: Binding<Bool>,
    title: String,
    message: String? = nil,
    size: AurelglyphDialogSize = .standard,
    allowsInteractiveDismiss: Bool = true,
    closeLabel: String? = nil,
    @ViewBuilder content: () -> DialogContent,
    @ViewBuilder actions: () -> Actions
  ) -> some View {
    modifier(
      AurelglyphDialogPresenter(
        isPresented: isPresented,
        title: title,
        message: message,
        size: size,
        allowsInteractiveDismiss: allowsInteractiveDismiss,
        closeLabel: closeLabel,
        dialogContent: content(),
        actions: actions()
      )
    )
  }
}

public enum AurelglyphDrawerEdge: Sendable {
  case start
  case end
  case top
  case bottom

  var isHorizontal: Bool {
    self == .start || self == .end
  }
}

/// An overlay drawer with an accessible dismissal target and reduced-motion support.
public struct AurelglyphDrawer<Content: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.accessibilityReduceMotion) private var reduceMotion
  @FocusState private var closeControlFocused: Bool
  @AccessibilityFocusState private var accessibleCloseControlFocused: Bool
  @Binding private var isPresented: Bool
  private let title: String
  private let edge: AurelglyphDrawerEdge
  private let dismissOnBackdropTap: Bool
  private let scrollsContent: Bool
  private let closeLabel: String
  private let dismissLabel: String
  private let content: Content

  public init(
    _ title: String,
    isPresented: Binding<Bool>,
    edge: AurelglyphDrawerEdge = .end,
    dismissOnBackdropTap: Bool = true,
    scrollsContent: Bool = true,
    closeLabel: String? = nil,
    dismissLabel: String? = nil,
    @ViewBuilder content: () -> Content
  ) {
    self.title = title
    self._isPresented = isPresented
    self.edge = edge
    self.dismissOnBackdropTap = dismissOnBackdropTap
    self.scrollsContent = scrollsContent
    self.closeLabel = closeLabel ?? "Close \(title)"
    self.dismissLabel = dismissLabel ?? "Dismiss \(title)"
    self.content = content()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    ZStack(alignment: alignment) {
      if isPresented {
        if dismissOnBackdropTap {
          Button(action: dismiss) {
            palette.overlay
              .ignoresSafeArea()
          }
          .buttonStyle(.plain)
          .accessibilityLabel(dismissLabel)
          .accessibilitySortPriority(-1)
        } else {
          palette.overlay
            .ignoresSafeArea()
            .accessibilityHidden(true)
        }

        VStack(alignment: .leading, spacing: 16) {
          HStack(spacing: 12) {
            Text(title)
              .font(AurelglyphTypography.title)
              .accessibilityAddTraits(.isHeader)
            Spacer(minLength: 12)
            Button(action: dismiss) {
              Image(systemName: "xmark")
                .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
            .focused($closeControlFocused)
            .accessibilityFocused($accessibleCloseControlFocused)
            .accessibilityLabel(closeLabel)
          }
          drawerBody
        }
        .padding(20)
        .frame(
          maxWidth: edge.isHorizontal ? 420 : .infinity,
          maxHeight: edge.isHorizontal ? .infinity : 420,
          alignment: .topLeading
        )
        .background(palette.backgroundElevated)
        .overlay(alignment: borderAlignment) {
          Rectangle()
            .fill(palette.borderStrong)
            .frame(
              width: edge.isHorizontal ? 1 : nil,
              height: edge.isHorizontal ? nil : 1
            )
        }
        .foregroundStyle(palette.foreground)
        .transition(transition)
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isModal)
        .accessibilitySortPriority(1)
      }
    }
    .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: isPresented)
    .aurelglyphDrawerExitHandler(isPresented: isPresented, dismiss: dismiss)
    .onAppear {
      if isPresented { moveFocusIntoDrawer() }
    }
    .onChange(of: isPresented) { _, presented in
      if presented {
        moveFocusIntoDrawer()
      } else {
        closeControlFocused = false
        accessibleCloseControlFocused = false
      }
    }
  }

  private var alignment: Alignment {
    switch edge {
    case .start: .leading
    case .end: .trailing
    case .top: .top
    case .bottom: .bottom
    }
  }

  private var borderAlignment: Alignment {
    switch edge {
    case .start: .trailing
    case .end: .leading
    case .top: .bottom
    case .bottom: .top
    }
  }

  private var transition: AnyTransition {
    switch edge {
    case .start: .move(edge: .leading).combined(with: .opacity)
    case .end: .move(edge: .trailing).combined(with: .opacity)
    case .top: .move(edge: .top).combined(with: .opacity)
    case .bottom: .move(edge: .bottom).combined(with: .opacity)
    }
  }

  private func dismiss() {
    isPresented = false
  }

  private func moveFocusIntoDrawer() {
    Task { @MainActor in
      closeControlFocused = true
      accessibleCloseControlFocused = true
    }
  }

  @ViewBuilder private var drawerBody: some View {
    if scrollsContent {
      ScrollView {
        content
          .frame(maxWidth: .infinity, alignment: .topLeading)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .scrollIndicators(.visible)
    } else {
      content
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
  }
}

private extension View {
  @ViewBuilder
  func aurelglyphDrawerExitHandler(
    isPresented: Bool,
    dismiss: @escaping () -> Void
  ) -> some View {
    #if os(macOS)
    onExitCommand {
      if isPresented { dismiss() }
    }
    #else
    onKeyPress(.escape) {
      guard isPresented else { return .ignored }
      dismiss()
      return .handled
    }
    #endif
  }
}

private struct AurelglyphDrawerPresenter<DrawerContent: View>: ViewModifier {
  @Binding var isPresented: Bool
  let title: String
  let edge: AurelglyphDrawerEdge
  let dismissOnBackdropTap: Bool
  let scrollsContent: Bool
  let closeLabel: String?
  let dismissLabel: String?
  let drawerContent: DrawerContent

  func body(content: Content) -> some View {
    ZStack {
      content
        .disabled(isPresented)
        .accessibilityHidden(isPresented)

      AurelglyphDrawer(
        title,
        isPresented: $isPresented,
        edge: edge,
        dismissOnBackdropTap: dismissOnBackdropTap,
        scrollsContent: scrollsContent,
        closeLabel: closeLabel,
        dismissLabel: dismissLabel
      ) {
        drawerContent
      }
    }
  }
}

public extension View {
  /// Presents an Aurelglyph drawer over the receiving view.
  func aurelglyphDrawer<DrawerContent: View>(
    isPresented: Binding<Bool>,
    title: String,
    edge: AurelglyphDrawerEdge = .end,
    dismissOnBackdropTap: Bool = true,
    scrollsContent: Bool = true,
    closeLabel: String? = nil,
    dismissLabel: String? = nil,
    @ViewBuilder content: () -> DrawerContent
  ) -> some View {
    modifier(
      AurelglyphDrawerPresenter(
        isPresented: isPresented,
        title: title,
        edge: edge,
        dismissOnBackdropTap: dismissOnBackdropTap,
        scrollsContent: scrollsContent,
        closeLabel: closeLabel,
        dismissLabel: dismissLabel,
        drawerContent: content()
      )
    )
  }
}

public struct AurelglyphMenuItem: Identifiable {
  public let id: String
  public let title: String
  public let systemImage: String?
  public let isDisabled: Bool
  public let isDestructive: Bool
  public let action: () -> Void

  public init(
    id: String,
    title: String,
    systemImage: String? = nil,
    isDisabled: Bool = false,
    isDestructive: Bool = false,
    action: @escaping () -> Void
  ) {
    self.id = id
    self.title = title
    self.systemImage = systemImage
    self.isDisabled = isDisabled
    self.isDestructive = isDestructive
    self.action = action
  }
}

/// A native menu that preserves the shared menu/dropdown item contract.
public struct AurelglyphMenu: View {
  private let label: String
  private let systemImage: String?
  private let items: [AurelglyphMenuItem]
  private let isDisabled: Bool

  public init(
    _ label: String,
    systemImage: String? = "ellipsis",
    items: [AurelglyphMenuItem],
    isDisabled: Bool = false
  ) {
    self.label = label
    self.systemImage = systemImage
    self.items = items
    self.isDisabled = isDisabled
  }

  public var body: some View {
    Menu {
      ForEach(items) { item in
        Button(role: item.isDestructive ? .destructive : nil, action: item.action) {
          if let systemImage = item.systemImage {
            Label(item.title, systemImage: systemImage)
          } else {
            Text(item.title)
          }
        }
        .disabled(item.isDisabled)
      }
    } label: {
      Group {
        if let systemImage {
          Label(label, systemImage: systemImage)
        } else {
          Text(label)
        }
      }
      .frame(
        minWidth: AurelglyphResponsiveLayout.minimumInteractiveDimension,
        minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension
      )
      .contentShape(Rectangle())
    }
    .disabled(isDisabled)
    .accessibilityLabel(label)
  }
}

public typealias AurelglyphDropdown = AurelglyphMenu

public struct AurelglyphPopover<Label: View, Content: View>: View {
  @Binding private var isPresented: Bool
  private let attachmentAnchor: PopoverAttachmentAnchor
  private let arrowEdge: Edge
  private let label: Label
  private let content: Content

  public init(
    isPresented: Binding<Bool>,
    attachmentAnchor: PopoverAttachmentAnchor = .rect(.bounds),
    arrowEdge: Edge = .top,
    @ViewBuilder label: () -> Label,
    @ViewBuilder content: () -> Content
  ) {
    self._isPresented = isPresented
    self.attachmentAnchor = attachmentAnchor
    self.arrowEdge = arrowEdge
    self.label = label()
    self.content = content()
  }

  public var body: some View {
    Button {
      isPresented.toggle()
    } label: {
      label
        .frame(minWidth: 44, minHeight: 44)
        .contentShape(Rectangle())
    }
    .popover(isPresented: $isPresented, attachmentAnchor: attachmentAnchor, arrowEdge: arrowEdge) {
      AurelglyphSurface {
        content
      }
      .padding(12)
    }
  }
}

/// Adds native help text and an accessibility hint to arbitrary content.
public struct AurelglyphTooltip<Content: View>: View {
  private let message: String
  private let content: Content

  public init(_ message: String, @ViewBuilder content: () -> Content) {
    self.message = message
    self.content = content()
  }

  public var body: some View {
    content
      .help(message)
      .accessibilityHint(message)
  }
}
