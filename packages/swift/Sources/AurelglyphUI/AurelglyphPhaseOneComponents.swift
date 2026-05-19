import SwiftUI

public struct AurelglyphAppShell<Content: View, TopBar: View, TabBar: View>: View {
  private let topBar: TopBar
  private let content: Content
  private let tabBar: TabBar

  public init(
    @ViewBuilder topBar: () -> TopBar,
    @ViewBuilder content: () -> Content,
    @ViewBuilder tabBar: () -> TabBar
  ) {
    self.topBar = topBar()
    self.content = content()
    self.tabBar = tabBar()
  }

  public var body: some View {
    VStack(spacing: 0) {
      topBar
      ScrollView {
        content
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(16)
      }
      tabBar
    }
    .background(Color.aurelglyphBackground)
  }
}

public struct AurelglyphTopBar<Leading: View, Actions: View>: View {
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
    HStack(spacing: 12) {
      leading
      VStack(alignment: .leading, spacing: 2) {
        Text(title)
          .font(AurelglyphTypography.title)
          .lineLimit(1)
        if let subtitle {
          Text(subtitle)
            .font(AurelglyphTypography.caption)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
      }
      Spacer(minLength: 12)
      actions
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
    .background(.thinMaterial)
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
  private let items: [AurelglyphTabItem]
  @Binding private var selection: String

  public init(items: [AurelglyphTabItem], selection: Binding<String>) {
    self.items = items
    self._selection = selection
  }

  public var body: some View {
    HStack(spacing: 8) {
      ForEach(items) { item in
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
          }
          .frame(maxWidth: .infinity)
          .padding(.vertical, 8)
          .foregroundStyle(selection == item.id ? .primary : .secondary)
          .background(selection == item.id ? Color.accentColor.opacity(0.16) : Color.clear)
          .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selection == item.id ? .isSelected : [])
      }
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .background(.thinMaterial)
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
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .stroke(.quaternary, lineWidth: 1)
    }
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
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 18, style: .continuous)
        .stroke(.quaternary, lineWidth: 1)
    }
  }
}

public struct AurelglyphListRow<Trailing: View>: View {
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
    HStack(spacing: 12) {
      if let systemImage {
        Image(systemName: systemImage)
          .frame(width: 32, height: 32)
          .foregroundStyle(.tint)
          .background(Color.accentColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
      }
      VStack(alignment: .leading, spacing: 3) {
        Text(title)
          .font(AurelglyphTypography.body)
          .lineLimit(1)
        if let subtitle {
          Text(subtitle)
            .font(AurelglyphTypography.caption)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
      }
      Spacer(minLength: 12)
      trailing
    }
    .padding(16)
    .background(isSelected ? Color.accentColor.opacity(0.12) : Color.clear)
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
    }
    .padding(12)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(.quaternary, lineWidth: 1)
    }
  }
}

private extension Color {
  static let aurelglyphBackground = Color(red: 13 / 255, green: 13 / 255, blue: 11 / 255)
}

public struct AurelglyphSwitch: View {
  private let title: String
  private let subtitle: String?
  @Binding private var isOn: Bool

  public init(_ title: String, subtitle: String? = nil, isOn: Binding<Bool>) {
    self.title = title
    self.subtitle = subtitle
    self._isOn = isOn
  }

  public var body: some View {
    Toggle(isOn: $isOn) {
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
    .toggleStyle(.switch)
  }
}
