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
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  private let content: Content

  public init(@ViewBuilder content: () -> Content) {
    self.content = content()
  }

  public var body: some View {
    adaptiveLayout {
      content
    }
    .padding(8)
    .aurelglyphPanelBackground(cornerRadius: 12)
  }

  private var adaptiveLayout: AurelglyphAdaptiveLayout {
    AurelglyphAdaptiveLayout(
      primary: AnyLayout(HStackLayout(spacing: 8)),
      fallback: AnyLayout(VStackLayout(alignment: .leading, spacing: 8)),
      fittingAxis: .horizontal,
      forceFallback: AurelglyphResponsiveLayout.prefersStackedLayout(for: dynamicTypeSize)
    )
  }
}

public struct AurelglyphSheet<Content: View, Actions: View>: View {
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @Environment(\.layoutDirection) private var layoutDirection
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  private let title: String
  private let scrollsContent: Bool
  private let content: Content
  private let actions: Actions

  public init(
    _ title: String,
    scrollsContent: Bool = true,
    @ViewBuilder content: () -> Content,
    @ViewBuilder actions: () -> Actions
  ) {
    self.title = title
    self.scrollsContent = scrollsContent
    self.content = content()
    self.actions = actions()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    let cornerRadius = theme.resolvedPanelCornerRadius(24)

    VStack(alignment: .leading, spacing: 16) {
      sheetHeader
      sheetContent
    }
    .padding(20)
    .foregroundStyle(palette.foreground)
    .background(palette.backgroundElevated, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        .stroke(palette.border, lineWidth: 1)
    }
  }

  private var sheetHeader: some View {
    adaptiveHeaderLayout {
      Text(title)
        .font(AurelglyphTypography.title)
      actions
    }
  }

  private var adaptiveHeaderLayout: AurelglyphAdaptiveHeaderLayout {
    AurelglyphAdaptiveHeaderLayout(
      leadingItemCount: 1,
      primarySpacing: 12,
      trailingSpacing: 8,
      fallbackSpacing: 10,
      forceFallback: AurelglyphResponsiveLayout.prefersStackedLayout(for: dynamicTypeSize),
      layoutDirection: layoutDirection
    )
  }

  @ViewBuilder private var sheetContent: some View {
    if scrollsContent {
      ScrollView {
        content
          .frame(maxWidth: .infinity, alignment: .leading)
      }
      .frame(maxHeight: 480)
      .scrollIndicators(.visible)
    } else {
      content
        .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

private struct AurelglyphSheetPresenter<SheetContent: View, Actions: View>: ViewModifier {
  @Binding var isPresented: Bool
  let title: String
  let allowsInteractiveDismiss: Bool
  let scrollsContent: Bool
  let sheetContent: SheetContent
  let actions: Actions

  func body(content: Content) -> some View {
    content.sheet(isPresented: $isPresented) {
      AurelglyphSheet(title, scrollsContent: scrollsContent) {
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
    scrollsContent: Bool = true,
    @ViewBuilder content: () -> SheetContent,
    @ViewBuilder actions: () -> Actions
  ) -> some View {
    modifier(
      AurelglyphSheetPresenter(
        isPresented: isPresented,
        title: title,
        allowsInteractiveDismiss: allowsInteractiveDismiss,
        scrollsContent: scrollsContent,
        sheetContent: content(),
        actions: actions()
      )
    )
  }
}

public struct AurelglyphSegmentedControl: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  private let items: [AurelglyphSegmentedItem]
  @Binding private var selection: String

  public init(items: [AurelglyphSegmentedItem], selection: Binding<String>) {
    self.items = items
    self._selection = selection
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    Group {
      if AurelglyphResponsiveLayout.prefersStackedLayout(for: dynamicTypeSize) {
        scrollableItems(palette: palette)
      } else {
        ViewThatFits(in: .horizontal) {
          HStack(spacing: 4) {
            ForEach(items) { item in
              segmentButton(item, palette: palette, scrollable: false)
            }
          }
          .padding(4)

          scrollableItems(palette: palette)
        }
      }
    }
    .aurelglyphPanelBackground(cornerRadius: 12)
    .onAppear(perform: normalizeSelection)
    .onChange(of: items) { _, _ in normalizeSelection() }
    .onChange(of: selection) { _, _ in normalizeSelection() }
  }

  private func scrollableItems(palette: AurelglyphPalette) -> some View {
    ScrollView(.horizontal) {
      HStack(spacing: 4) {
        ForEach(items) { item in
          segmentButton(item, palette: palette, scrollable: true)
        }
      }
      .padding(4)
    }
    .scrollIndicators(.hidden)
  }

  private func segmentButton(
    _ item: AurelglyphSegmentedItem,
    palette: AurelglyphPalette,
    scrollable: Bool
  ) -> some View {
    Button {
      selection = item.id
    } label: {
      Text(item.title)
        .font(AurelglyphTypography.label)
        .foregroundStyle(palette.foreground)
        .lineLimit(1)
        .fixedSize(horizontal: true, vertical: false)
        .padding(.horizontal, 12)
        .frame(
          minWidth: AurelglyphResponsiveLayout.minimumInteractiveDimension,
          maxWidth: scrollable ? nil : .infinity,
          minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension
        )
        .background(selection == item.id ? palette.accent.opacity(0.18) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .overlay {
          if selection == item.id {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
              .stroke(palette.focus, lineWidth: 2)
          }
        }
        .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .disabled(item.isDisabled)
    .opacity(item.isDisabled ? 0.52 : 1)
    .accessibilityAddTraits(selection == item.id ? .isSelected : [])
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
  @State private var isPresented = false
  @FocusState private var triggerFocused: Bool
  @FocusState private var focusedItemID: String?
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
    let selectedItem = items.first { $0.id == selection }
    let unavailable = isUnavailable
    let displayValue = isLoading ? controlCopy.loading : (selectedItem?.title ?? controlCopy.selectPlaceholder)
    let displayColor = selectedItem == nil ? palette.muted : palette.foreground

    VStack(alignment: .leading, spacing: 7) {
      Text(title)
        .font(AurelglyphTypography.monoLabel)
        .textCase(.uppercase)
        .foregroundStyle(palette.muted)

      Button {
        guard !unavailable else { return }
        if isPresented {
          isPresented = false
        } else {
          presentOptions()
        }
      } label: {
        HStack(spacing: 10) {
          Text(displayValue)
            .font(AurelglyphTypography.body)
            .foregroundStyle(displayColor)
            .lineLimit(1)
          Spacer(minLength: 12)
          if isLoading {
            ProgressView()
              .controlSize(.mini)
              .accessibilityHidden(true)
          } else {
            Image(systemName: isPresented ? "chevron.up" : "chevron.down")
              .foregroundStyle(palette.muted)
              .accessibilityHidden(true)
          }
        }
        .padding(.horizontal, 12)
        .frame(maxWidth: .infinity, minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension)
        .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: theme.boxCornerRadius, style: .continuous))
        .overlay {
          RoundedRectangle(cornerRadius: theme.boxCornerRadius, style: .continuous)
            .stroke(error == nil ? palette.borderStrong : palette.danger, lineWidth: 1)
        }
        .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .focused($triggerFocused)
      .disabled(unavailable)
      .opacity(isDisabled ? 0.52 : 1)
      .accessibilityLabel(title)
      .accessibilityValue(
        [
          isLoading ? controlCopy.loading : selectedItem?.title,
          isPresented && !unavailable ? controlCopy.expanded : controlCopy.collapsed
        ]
        .compactMap { $0 }
        .joined(separator: ", ")
      )
      .accessibilityHint(
        aurelglyphControlHint(
          isReadOnly: isReadOnly,
          error: error,
          instruction: isPresented ? controlCopy.chooseOption : controlCopy.showOptions,
          readOnlyLabel: controlCopy.readOnly
        )
      )
      .popover(isPresented: $isPresented, attachmentAnchor: .rect(.bounds), arrowEdge: .top) {
        selectSurface(palette: palette)
          .presentationBackground(palette.backgroundElevated)
      }
      .onKeyPress(.downArrow) {
        guard !unavailable, items.contains(where: { !$0.isDisabled }) else { return .ignored }
        presentOptions()
        return .handled
      }
      .onKeyPress(.upArrow) {
        guard !unavailable, items.contains(where: { !$0.isDisabled }) else { return .ignored }
        presentOptions(edge: .last)
        return .handled
      }
      .onKeyPress(.escape) {
        guard isPresented else { return .ignored }
        isPresented = false
        return .handled
      }

      if let error {
        Text(error)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(palette.danger)
          .accessibilityLabel(error)
      }
    }
    .onChange(of: unavailable) { _, value in
      if value { isPresented = false }
    }
    .onChange(of: isPresented) { _, presented in
      if !presented {
        focusedItemID = nil
        restoreTriggerFocus()
      }
    }
  }

  private func selectSurface(palette: AurelglyphPalette) -> some View {
    ScrollView {
      LazyVStack(alignment: .leading, spacing: 2) {
        if items.isEmpty {
          Text(controlCopy.noOptions)
            .font(AurelglyphTypography.caption)
            .foregroundStyle(palette.muted)
            .padding(10)
            .frame(maxWidth: .infinity, minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension, alignment: .leading)
        } else {
          ForEach(items) { item in
            Button {
              guard !item.isDisabled else { return }
              selection = item.id
              isPresented = false
            } label: {
              HStack(spacing: 10) {
                Text(item.title)
                  .font(AurelglyphTypography.body)
                  .foregroundStyle(palette.foreground)
                Spacer(minLength: 12)
                if selection == item.id {
                  Image(systemName: "checkmark")
                    .foregroundStyle(palette.focus)
                    .accessibilityHidden(true)
                }
              }
              .padding(.horizontal, 10)
              .frame(maxWidth: .infinity, minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension, alignment: .leading)
              .overlay(alignment: .leading) {
                if selection == item.id {
                  Rectangle()
                    .fill(palette.focus)
                    .frame(width: 3)
                    .accessibilityHidden(true)
                }
              }
              .contentShape(Rectangle())
            }
            .focused($focusedItemID, equals: item.id)
            .onKeyPress(.downArrow) {
              moveOptionFocus(1)
              return .handled
            }
            .onKeyPress(.upArrow) {
              moveOptionFocus(-1)
              return .handled
            }
            .onKeyPress(.home) {
              focusOption(at: .first)
              return .handled
            }
            .onKeyPress(.end) {
              focusOption(at: .last)
              return .handled
            }
            .onKeyPress(.escape) {
              isPresented = false
              return .handled
            }
            .buttonStyle(
              AurelglyphSelectOptionButtonStyle(
                palette: palette,
                cornerRadius: theme.boxCornerRadius,
                isSelected: selection == item.id,
                isFocused: focusedItemID == item.id
              )
            )
            .disabled(item.isDisabled)
            .opacity(item.isDisabled ? 0.52 : 1)
            .accessibilityAddTraits(selection == item.id ? .isSelected : [])
          }
        }
      }
    }
    .scrollIndicators(.visible)
    .frame(minWidth: 220, idealWidth: 280, maxWidth: 360, maxHeight: 320)
    .padding(5)
    .background(palette.backgroundElevated)
    .accessibilityElement(children: .contain)
    .accessibilityLabel(controlCopy.optionsLabel(title))
  }

  private var isUnavailable: Bool {
    isDisabled || isLoading || isReadOnly
  }

  private func presentOptions(edge: AurelglyphFocusEdge? = nil) {
    guard !isUnavailable else { return }
    let target: String?
    if let edge {
      target = aurelglyphEdgeEnabledID(
        in: items,
        edge: edge,
        id: { $0.id },
        isDisabled: { $0.isDisabled }
      )
    } else if items.contains(where: { $0.id == selection && !$0.isDisabled }) {
      target = selection
    } else {
      target = aurelglyphEdgeEnabledID(
        in: items,
        edge: .first,
        id: { $0.id },
        isDisabled: { $0.isDisabled }
      )
    }
    isPresented = true
    guard let target else { return }
    Task { @MainActor in
      await Task.yield()
      focusedItemID = target
    }
  }

  private func moveOptionFocus(_ direction: Int) {
    focusedItemID = aurelglyphNextEnabledID(
      in: items,
      currentID: focusedItemID,
      direction: direction,
      id: { $0.id },
      isDisabled: { $0.isDisabled }
    )
  }

  private func focusOption(at edge: AurelglyphFocusEdge) {
    focusedItemID = aurelglyphEdgeEnabledID(
      in: items,
      edge: edge,
      id: { $0.id },
      isDisabled: { $0.isDisabled }
    )
  }

  private func restoreTriggerFocus() {
    Task { @MainActor in
      await Task.yield()
      triggerFocused = true
    }
  }
}

private struct AurelglyphSelectOptionButtonStyle: ButtonStyle {
  let palette: AurelglyphPalette
  let cornerRadius: CGFloat
  let isSelected: Bool
  let isFocused: Bool

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .background(
        isSelected
          ? palette.accent.opacity(0.2)
          : (isFocused || configuration.isPressed ? palette.surfaceMuted : Color.clear),
        in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
      )
      .overlay {
        if isFocused {
          RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .stroke(palette.focus, lineWidth: 2)
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
    .aurelglyphPanelBackground(cornerRadius: 18)
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
    .aurelglyphPanelBackground(cornerRadius: 24)
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
