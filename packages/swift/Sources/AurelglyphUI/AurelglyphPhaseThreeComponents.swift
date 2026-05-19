import SwiftUI

public struct AurelglyphBreadcrumbItem: Identifiable, Sendable {
  public let id: String
  public let title: String

  public init(id: String, title: String) {
    self.id = id
    self.title = title
  }
}

public struct AurelglyphCommandItem: Identifiable, Sendable {
  public let id: String
  public let title: String
  public let systemImage: String?
  public let shortcut: String?

  public init(id: String, title: String, systemImage: String? = nil, shortcut: String? = nil) {
    self.id = id
    self.title = title
    self.systemImage = systemImage
    self.shortcut = shortcut
  }
}

public struct AurelglyphTabs<Content: View>: View {
  private let items: [AurelglyphSegmentedItem]
  @Binding private var selection: String
  private let content: Content

  public init(items: [AurelglyphSegmentedItem], selection: Binding<String>, @ViewBuilder content: () -> Content) {
    self.items = items
    self._selection = selection
    self.content = content()
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      AurelglyphSegmentedControl(items: items, selection: $selection)
      content
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
  }
}

public struct AurelglyphBreadcrumbs: View {
  private let items: [AurelglyphBreadcrumbItem]

  public init(items: [AurelglyphBreadcrumbItem]) {
    self.items = items
  }

  public var body: some View {
    HStack(spacing: 6) {
      ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
        if index > 0 {
          Text("/")
            .foregroundStyle(.tertiary)
        }
        Text(item.title)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(index == items.count - 1 ? .primary : .secondary)
      }
    }
  }
}

public struct AurelglyphToast<Content: View>: View {
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
    .padding(14)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
  }
}

public struct AurelglyphProgress: View {
  private let value: Double
  private let total: Double

  public init(value: Double, total: Double = 100) {
    self.value = value
    self.total = total
  }

  public var body: some View {
    ProgressView(value: value, total: total)
      .progressViewStyle(.linear)
  }
}

public struct AurelglyphSkeleton: View {
  public init() {}

  public var body: some View {
    RoundedRectangle(cornerRadius: 8, style: .continuous)
      .fill(Color.secondary.opacity(0.16))
      .frame(height: 16)
      .accessibilityLabel("Loading")
  }
}

public struct AurelglyphMetric: View {
  private let label: String
  private let value: String
  private let delta: String?

  public init(label: String, value: String, delta: String? = nil) {
    self.label = label
    self.value = value
    self.delta = delta
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(label)
        .font(AurelglyphTypography.monoCaption)
        .foregroundStyle(.secondary)
        .textCase(.uppercase)
      Text(value)
        .font(AurelglyphTypography.display(size: 34))
      if let delta {
        Text(delta)
          .font(AurelglyphTypography.monoCaption)
          .foregroundStyle(.secondary)
      }
    }
    .padding(16)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

public struct AurelglyphDataTable: View {
  private let headers: [String]
  private let rows: [[String]]

  public init(headers: [String], rows: [[String]]) {
    self.headers = headers
    self.rows = rows
  }

  public var body: some View {
    Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 10) {
      GridRow {
        ForEach(headers, id: \.self) { header in
          Text(header)
            .font(AurelglyphTypography.monoCaption)
            .foregroundStyle(.secondary)
        }
      }
      ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
        GridRow {
          ForEach(Array(row.enumerated()), id: \.offset) { _, cell in
            Text(cell)
              .font(AurelglyphTypography.caption)
          }
        }
      }
    }
    .padding(16)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

public struct AurelglyphPagination: View {
  private let currentPage: Int
  private let totalPages: Int

  public init(currentPage: Int, totalPages: Int) {
    self.currentPage = currentPage
    self.totalPages = totalPages
  }

  public var body: some View {
    HStack(spacing: 8) {
      Text("Previous")
      ForEach(1...max(totalPages, 1), id: \.self) { page in
        Text("\(page)")
          .font(AurelglyphTypography.monoCaption)
          .padding(8)
          .background(page == currentPage ? Color.accentColor.opacity(0.18) : Color.clear, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
      }
      Text("Next")
    }
    .font(AurelglyphTypography.caption)
  }
}

public struct AurelglyphCommandPalette: View {
  private let items: [AurelglyphCommandItem]

  public init(items: [AurelglyphCommandItem]) {
    self.items = items
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Command palette")
        .font(AurelglyphTypography.monoCaption)
        .foregroundStyle(.secondary)
        .textCase(.uppercase)
      ForEach(items) { item in
        HStack(spacing: 10) {
          if let systemImage = item.systemImage {
            Image(systemName: systemImage)
          }
          Text(item.title)
          Spacer()
          if let shortcut = item.shortcut {
            Text(shortcut)
              .font(AurelglyphTypography.monoCaption)
              .foregroundStyle(.secondary)
          }
        }
        .padding(10)
        .background(Color.accentColor.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
      }
    }
    .padding(16)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
  }
}
