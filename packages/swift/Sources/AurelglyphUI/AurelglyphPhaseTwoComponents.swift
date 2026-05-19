import SwiftUI

public struct AurelglyphSegmentedItem: Identifiable, Sendable {
  public let id: String
  public let title: String

  public init(id: String, title: String) {
    self.id = id
    self.title = title
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
  private let title: String
  private let content: Content
  private let actions: Actions

  public init(_ title: String, @ViewBuilder content: () -> Content, @ViewBuilder actions: () -> Actions) {
    self.title = title
    self.content = content()
    self.actions = actions()
  }

  public var body: some View {
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
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .stroke(.quaternary, lineWidth: 1)
    }
  }
}

public struct AurelglyphSegmentedControl: View {
  private let items: [AurelglyphSegmentedItem]
  @Binding private var selection: String

  public init(items: [AurelglyphSegmentedItem], selection: Binding<String>) {
    self.items = items
    self._selection = selection
  }

  public var body: some View {
    HStack(spacing: 4) {
      ForEach(items) { item in
        Button {
          selection = item.id
        } label: {
          Text(item.title)
            .font(AurelglyphTypography.label)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(selection == item.id ? Color.accentColor.opacity(0.18) : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selection == item.id ? .isSelected : [])
      }
    }
    .padding(4)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
  }
}

public struct AurelglyphSelect: View {
  private let title: String
  private let items: [AurelglyphSegmentedItem]
  @Binding private var selection: String

  public init(_ title: String, items: [AurelglyphSegmentedItem], selection: Binding<String>) {
    self.title = title
    self.items = items
    self._selection = selection
  }

  public var body: some View {
    Picker(title, selection: $selection) {
      ForEach(items) { item in
        Text(item.title).tag(item.id)
      }
    }
    .pickerStyle(.menu)
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
