import SwiftUI

public struct AurelglyphAppShell<Content: View, TopBar: View, TabBar: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.horizontalSizeClass) private var horizontalSizeClass
  private let scrollsContent: Bool
  private let regularNavigation: AnyView?
  private let regularNavigationWidth: CGFloat
  private let topBar: TopBar
  private let content: Content
  private let tabBar: TabBar

  public init(
    scrollsContent: Bool = true,
    @ViewBuilder topBar: () -> TopBar,
    @ViewBuilder content: () -> Content,
    @ViewBuilder tabBar: () -> TabBar
  ) {
    self.scrollsContent = scrollsContent
    self.regularNavigation = nil
    self.regularNavigationWidth = AurelglyphResponsiveLayout.defaultNavigationWidth
    self.topBar = topBar()
    self.content = content()
    self.tabBar = tabBar()
  }

  public init<RegularNavigation: View>(
    scrollsContent: Bool = true,
    regularNavigationWidth: CGFloat = 260,
    @ViewBuilder topBar: () -> TopBar,
    @ViewBuilder regularNavigation: () -> RegularNavigation,
    @ViewBuilder content: () -> Content,
    @ViewBuilder tabBar: () -> TabBar
  ) {
    self.scrollsContent = scrollsContent
    self.regularNavigation = AnyView(regularNavigation())
    self.regularNavigationWidth = AurelglyphResponsiveLayout.navigationWidth(regularNavigationWidth)
    self.topBar = topBar()
    self.content = content()
    self.tabBar = tabBar()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    Group {
      if let regularNavigation {
        adaptiveLayout(navigation: regularNavigation)
      } else {
        compactLayout
      }
    }
    .foregroundStyle(palette.foreground)
    .background(palette.background.ignoresSafeArea())
    .tint(palette.accent)
  }

  private func adaptiveLayout(navigation: AnyView) -> some View {
    GeometryReader { geometry in
      let usesRegularNavigation = AurelglyphResponsiveLayout.usesRegularNavigation(
        availableWidth: geometry.size.width,
        navigationWidth: regularNavigationWidth,
        isCompactWidth: horizontalSizeClass == .compact
      )

      HStack(spacing: 0) {
        navigation
          .frame(width: usesRegularNavigation ? regularNavigationWidth : 0)
          .frame(maxHeight: .infinity, alignment: .topLeading)
          .aurelglyphPanelBackground()
          .clipped()
          .opacity(usesRegularNavigation ? 1 : 0)
          .allowsHitTesting(usesRegularNavigation)
          .accessibilityHidden(!usesRegularNavigation)
          .disabled(!usesRegularNavigation)

        Divider()
          .frame(
            width: usesRegularNavigation
              ? AurelglyphResponsiveLayout.navigationDividerWidth
              : 0
          )
          .opacity(usesRegularNavigation ? 1 : 0)
          .accessibilityHidden(true)

        VStack(spacing: 0) {
          topBar
          shellContent
          tabBar
            .frame(height: usesRegularNavigation ? 0 : nil)
            .clipped()
            .opacity(usesRegularNavigation ? 0 : 1)
            .allowsHitTesting(!usesRegularNavigation)
            .accessibilityHidden(usesRegularNavigation)
            .disabled(usesRegularNavigation)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    }
  }

  private var compactLayout: some View {
    VStack(spacing: 0) {
      topBar
      shellContent
      tabBar
    }
  }

  @ViewBuilder private var shellContent: some View {
    if scrollsContent {
      ScrollView {
        paddedContent
      }
    } else {
      paddedContent
        .frame(maxHeight: .infinity, alignment: .topLeading)
    }
  }

  private var paddedContent: some View {
    content
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(16)
  }
}

public struct AurelglyphTopBar<Leading: View, Actions: View>: View {
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @Environment(\.layoutDirection) private var layoutDirection
  private let title: String
  private let subtitle: String?
  private let leading: Leading
  private let actions: Actions

  public init(
    _ title: String,
    subtitle: String? = nil,
    @ViewBuilder leading: () -> Leading,
    @ViewBuilder actions: () -> Actions
  ) {
    self.title = title
    self.subtitle = subtitle
    self.leading = leading()
    self.actions = actions()
  }

  public var body: some View {
    adaptiveHeaderLayout {
      HStack(spacing: 0) {
        leading
      }
      titleBlock
      actions
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
    .aurelglyphPanelBackground()
  }

  private var adaptiveHeaderLayout: AurelglyphAdaptiveHeaderLayout {
    AurelglyphAdaptiveHeaderLayout(
      leadingItemCount: 2,
      primarySpacing: 12,
      trailingSpacing: 8,
      fallbackSpacing: 10,
      forceFallback: AurelglyphResponsiveLayout.prefersStackedLayout(for: dynamicTypeSize),
      layoutDirection: layoutDirection
    )
  }

  private var titleBlock: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(title)
        .font(AurelglyphTypography.title)
      if let subtitle {
        Text(subtitle)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(.secondary)
      }
    }
  }
}

public struct AurelglyphTabItem: Identifiable, Sendable {
  public let id: String
  public let title: String
  public let systemImage: String

  public init(id: String, title: String, systemImage: String) {
    self.id = id
    self.title = title
    self.systemImage = systemImage
  }
}

public struct AurelglyphTabBar: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  private let items: [AurelglyphTabItem]
  @Binding private var selection: String

  public init(items: [AurelglyphTabItem], selection: Binding<String>) {
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
          HStack(spacing: 8) {
            ForEach(items) { item in
              tabButton(item, palette: palette, scrollable: false)
            }
          }
          scrollableItems(palette: palette)
        }
      }
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .aurelglyphPanelBackground()
  }

  private func scrollableItems(palette: AurelglyphPalette) -> some View {
    ScrollView(.horizontal) {
      HStack(spacing: 8) {
        ForEach(items) { item in
          tabButton(item, palette: palette, scrollable: true)
        }
      }
    }
    .scrollIndicators(.hidden)
  }

  private func tabButton(
    _ item: AurelglyphTabItem,
    palette: AurelglyphPalette,
    scrollable: Bool
  ) -> some View {
    Button {
      selection = item.id
    } label: {
      VStack(spacing: 4) {
        Image(systemName: item.systemImage)
          .font(AurelglyphTypography.label)
        Text(item.title)
          .font(AurelglyphTypography.monoCaption)
          .textCase(.uppercase)
          .lineLimit(1)
          .fixedSize(horizontal: true, vertical: false)
      }
      .frame(
        minWidth: AurelglyphResponsiveLayout.minimumInteractiveDimension,
        maxWidth: scrollable ? nil : .infinity,
        minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension
      )
      .padding(.vertical, 4)
      .foregroundStyle(palette.foreground)
      .background(selection == item.id ? palette.accent.opacity(0.16) : Color.clear)
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
    .accessibilityAddTraits(selection == item.id ? .isSelected : [])
  }
}

public struct AurelglyphCard<Content: View>: View {
  private let title: String?
  private let eyebrow: String?
  private let content: Content

  public init(title: String? = nil, eyebrow: String? = nil, @ViewBuilder content: () -> Content) {
    self.title = title
    self.eyebrow = eyebrow
    self.content = content()
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      if eyebrow != nil || title != nil {
        VStack(alignment: .leading, spacing: 4) {
          if let eyebrow {
            Text(eyebrow)
              .font(AurelglyphTypography.monoCaption)
              .foregroundStyle(.secondary)
              .textCase(.uppercase)
          }
          if let title {
            Text(title)
              .font(AurelglyphTypography.headline)
          }
        }
      }
      content
    }
    .padding(16)
    .aurelglyphPanelBackground(cornerRadius: 18, bordered: true)
  }
}

public struct AurelglyphListSection<Content: View>: View {
  private let title: String?
  private let content: Content

  public init(_ title: String? = nil, @ViewBuilder content: () -> Content) {
    self.title = title
    self.content = content()
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      if let title {
        Text(title)
          .font(AurelglyphTypography.monoLabel)
          .foregroundStyle(.secondary)
          .textCase(.uppercase)
          .padding([.horizontal, .top], 16)
          .padding(.bottom, 8)
      }
      content
    }
    .aurelglyphPanelBackground(cornerRadius: 18, bordered: true)
  }
}

public struct AurelglyphListRow<Trailing: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @Environment(\.layoutDirection) private var layoutDirection
  private let title: String
  private let subtitle: String?
  private let systemImage: String?
  private let isSelected: Bool
  private let trailing: Trailing

  public init(
    _ title: String,
    subtitle: String? = nil,
    systemImage: String? = nil,
    isSelected: Bool = false,
    @ViewBuilder trailing: () -> Trailing
  ) {
    self.title = title
    self.subtitle = subtitle
    self.systemImage = systemImage
    self.isSelected = isSelected
    self.trailing = trailing()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    adaptiveRowLayout {
      rowIdentity
      trailing
    }
    .padding(16)
    .background(isSelected ? palette.accent.opacity(0.12) : Color.clear)
    .overlay(alignment: .leading) {
      if isSelected {
        Rectangle()
          .fill(palette.focus)
          .frame(width: 3)
      }
    }
  }

  private var adaptiveRowLayout: AurelglyphAdaptiveHeaderLayout {
    AurelglyphAdaptiveHeaderLayout(
      leadingItemCount: 1,
      primarySpacing: 12,
      trailingSpacing: 8,
      fallbackSpacing: 10,
      forceFallback: AurelglyphResponsiveLayout.prefersStackedLayout(for: dynamicTypeSize),
      layoutDirection: layoutDirection
    )
  }

  private var rowIdentity: some View {
    HStack(alignment: .top, spacing: 12) {
      if let systemImage {
        Image(systemName: systemImage)
          .frame(width: 32, height: 32)
          .foregroundStyle(.tint)
          .background(
            Color.accentColor.opacity(0.12),
            in: RoundedRectangle(cornerRadius: 8, style: .continuous)
          )
      }
      VStack(alignment: .leading, spacing: 3) {
        Text(title)
          .font(AurelglyphTypography.body)
        if let subtitle {
          Text(subtitle)
            .font(AurelglyphTypography.caption)
            .foregroundStyle(.secondary)
        }
      }
    }
  }
}

public struct AurelglyphSearchField: View {
  private let title: String
  @Binding private var text: String

  public init(_ title: String = "Search", text: Binding<String>) {
    self.title = title
    self._text = text
  }

  public var body: some View {
    HStack(spacing: 8) {
      Image(systemName: "magnifyingglass")
        .foregroundStyle(.secondary)
      TextField(title, text: $text)
        .font(AurelglyphTypography.body)
        .frame(minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension)
    }
    .padding(.horizontal, 12)
    .aurelglyphPanelBackground(cornerRadius: 12, bordered: true)
  }
}

public struct AurelglyphSwitch: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  private let title: String
  private let subtitle: String?
  @Binding private var isOn: Bool
  private let isDisabled: Bool
  private let isLoading: Bool
  private let isReadOnly: Bool
  private let error: String?

  public init(
    _ title: String,
    subtitle: String? = nil,
    isOn: Binding<Bool>,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    isReadOnly: Bool = false,
    error: String? = nil
  ) {
    self.title = title
    self.subtitle = subtitle
    self._isOn = isOn
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.isReadOnly = isReadOnly
    self.error = error
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    VStack(alignment: .leading, spacing: 5) {
      HStack(spacing: 8) {
        Toggle(isOn: $isOn) {
          VStack(alignment: .leading, spacing: 3) {
            Text(title)
              .font(AurelglyphTypography.body)
            if let subtitle {
              Text(subtitle)
                .font(AurelglyphTypography.caption)
                .foregroundStyle(palette.muted)
            }
          }
        }
        .toggleStyle(.switch)
        .tint(palette.accentControl)
        .frame(minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension)
        .contentShape(Rectangle())
        .disabled(isDisabled || isLoading || isReadOnly)
        .accessibilityValue(isLoading ? controlCopy.loading : (isOn ? controlCopy.on : controlCopy.off))
        .accessibilityHint(
          aurelglyphControlHint(
            isReadOnly: isReadOnly,
            error: error,
            readOnlyLabel: controlCopy.readOnly
          )
        )
        if isLoading {
          ProgressView().controlSize(.mini)
            .accessibilityLabel(controlCopy.loadingLabel(title))
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
