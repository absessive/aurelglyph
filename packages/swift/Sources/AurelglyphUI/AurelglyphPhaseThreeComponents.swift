import SwiftUI

public struct AurelglyphBreadcrumbItem: Identifiable, Sendable {
  public let id: String
  public let title: String

  public init(id: String, title: String) {
    self.id = id
    self.title = title
  }
}

public struct AurelglyphCommandItem: Identifiable, Hashable, Sendable {
  public let id: String
  public let title: String
  public let systemImage: String?
  public let shortcut: String?
  public let keywords: [String]
  public let isDisabled: Bool

  public init(
    id: String,
    title: String,
    systemImage: String? = nil,
    shortcut: String? = nil,
    keywords: [String] = [],
    isDisabled: Bool = false
  ) {
    self.id = id
    self.title = title
    self.systemImage = systemImage
    self.shortcut = shortcut
    self.keywords = keywords
    self.isDisabled = isDisabled
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
  private let label: String
  private let value: Double?
  private let total: Double
  private let showsValue: Bool

  public init(_ label: String = "Progress", value: Double, total: Double = 100, showsValue: Bool = false) {
    self.label = label
    self.value = value
    self.total = Self.normalizedTotal(total)
    self.showsValue = showsValue
  }

  public init(_ label: String = "Loading") {
    self.label = label
    self.value = nil
    self.total = 1
    self.showsValue = false
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      if let value {
        if showsValue {
          HStack {
            Text(label)
            Spacer()
            Text(Self.percentageLabel(value: value, total: total))
              .font(AurelglyphTypography.monoCaption)
          }
          .font(AurelglyphTypography.caption)
        }
        ProgressView(value: Self.clampedValue(value, total: total), total: total)
          .progressViewStyle(.linear)
          .accessibilityLabel(label)
          .accessibilityValue(Self.percentageLabel(value: value, total: total))
      } else {
        ProgressView(label)
          .accessibilityLabel(label)
      }
    }
  }

  static func normalizedTotal(_ total: Double) -> Double {
    total.isFinite && total > 0 ? total : 1
  }

  static func clampedValue(_ value: Double, total: Double) -> Double {
    guard value.isFinite else { return 0 }
    return min(max(value, 0), normalizedTotal(total))
  }

  static func percentageLabel(value: Double, total: Double) -> String {
    let normalizedTotal = normalizedTotal(total)
    let percentage = Int((clampedValue(value, total: normalizedTotal) / normalizedTotal * 100).rounded())
    return "\(percentage)%"
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
    ScrollView(.horizontal) {
      Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 10) {
        GridRow {
          ForEach(Array(headers.enumerated()), id: \.offset) { _, header in
            Text(header)
              .font(AurelglyphTypography.monoCaption)
              .foregroundStyle(.secondary)
              .fixedSize(horizontal: true, vertical: false)
          }
        }
        ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
          GridRow {
            ForEach(Array(row.enumerated()), id: \.offset) { _, cell in
              Text(cell)
                .font(AurelglyphTypography.caption)
                .fixedSize(horizontal: true, vertical: false)
            }
          }
        }
      }
      .padding(16)
    }
    .scrollIndicators(.visible)
    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
  }
}

public struct AurelglyphPagination: View {
  enum VisibleItem: Hashable {
    case page(Int)
    case gap(Int)
  }

  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @State private var internalPage: Int
  private let externalPage: Binding<Int>?
  private let totalPages: Int
  private let isDisabled: Bool
  private let label: String
  private let previousLabel: String
  private let nextLabel: String
  private let emptyLabel: String
  private let pageLabel: (Int) -> String
  private let currentPageLabel: String
  private let onPageChange: (Int) -> Void

  public init(
    currentPage: Binding<Int>,
    totalPages: Int,
    isDisabled: Bool = false,
    label: String = "Pagination",
    previousLabel: String = "Previous page",
    nextLabel: String = "Next page",
    emptyLabel: String = "No pages",
    currentPageLabel: String = "Current page",
    pageLabel: @escaping (Int) -> String = { "Page \($0)" },
    onPageChange: @escaping (Int) -> Void = { _ in }
  ) {
    self.externalPage = currentPage
    self._internalPage = State(initialValue: currentPage.wrappedValue)
    self.totalPages = max(totalPages, 0)
    self.isDisabled = isDisabled
    self.label = label
    self.previousLabel = previousLabel
    self.nextLabel = nextLabel
    self.emptyLabel = emptyLabel
    self.currentPageLabel = currentPageLabel
    self.pageLabel = pageLabel
    self.onPageChange = onPageChange
  }

  public init(
    currentPage: Int,
    totalPages: Int,
    isDisabled: Bool = false,
    label: String = "Pagination",
    previousLabel: String = "Previous page",
    nextLabel: String = "Next page",
    emptyLabel: String = "No pages",
    currentPageLabel: String = "Current page",
    pageLabel: @escaping (Int) -> String = { "Page \($0)" },
    onPageChange: @escaping (Int) -> Void = { _ in }
  ) {
    self.externalPage = nil
    self._internalPage = State(initialValue: currentPage)
    self.totalPages = max(totalPages, 0)
    self.isDisabled = isDisabled
    self.label = label
    self.previousLabel = previousLabel
    self.nextLabel = nextLabel
    self.emptyLabel = emptyLabel
    self.currentPageLabel = currentPageLabel
    self.pageLabel = pageLabel
    self.onPageChange = onPageChange
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    HStack(spacing: 4) {
      Button {
        select(normalizedPage - 1)
      } label: {
        Image(systemName: "chevron.backward")
          .frame(width: 44, height: 44)
      }
      .buttonStyle(.plain)
      .disabled(isDisabled || normalizedPage <= 1 || totalPages == 0)
      .accessibilityLabel(previousLabel)

      ScrollView(.horizontal) {
        HStack(spacing: 4) {
          if totalPages == 0 {
            Text(emptyLabel)
              .foregroundStyle(.secondary)
              .frame(minHeight: 44)
          } else {
            ForEach(Self.visibleItems(currentPage: normalizedPage, totalPages: totalPages), id: \.self) { item in
              switch item {
              case let .page(page):
                Button {
                  select(page)
                } label: {
                  Text("\(page)")
                    .font(AurelglyphTypography.monoCaption)
                    .frame(minWidth: 44, minHeight: 44)
                    .background(
                      page == normalizedPage ? palette.accent.opacity(0.18) : Color.clear,
                      in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                    )
                }
                .buttonStyle(.plain)
                .disabled(isDisabled)
                .accessibilityLabel(pageLabel(page))
                .accessibilityValue(page == normalizedPage ? currentPageLabel : "")
                .accessibilityAddTraits(page == normalizedPage ? .isSelected : [])
              case .gap:
                Text("…")
                  .font(AurelglyphTypography.monoCaption)
                  .frame(minWidth: 20, minHeight: 44)
                  .accessibilityHidden(true)
              }
            }
          }
        }
      }
      .scrollIndicators(.hidden)

      Button {
        select(normalizedPage + 1)
      } label: {
        Image(systemName: "chevron.forward")
          .frame(width: 44, height: 44)
      }
      .buttonStyle(.plain)
      .disabled(isDisabled || normalizedPage >= totalPages || totalPages == 0)
      .accessibilityLabel(nextLabel)
    }
    .font(AurelglyphTypography.caption)
    .foregroundStyle(palette.foreground)
    .accessibilityElement(children: .contain)
    .accessibilityLabel(label)
  }

  private var normalizedPage: Int {
    Self.normalizedPage(pageBinding.wrappedValue, totalPages: totalPages)
  }

  private var pageBinding: Binding<Int> {
    externalPage ?? $internalPage
  }

  private func select(_ page: Int) {
    let next = Self.normalizedPage(page, totalPages: totalPages)
    guard totalPages > 0, next != normalizedPage else { return }
    pageBinding.wrappedValue = next
    onPageChange(next)
  }

  static func normalizedPage(_ page: Int, totalPages: Int) -> Int {
    guard totalPages > 0 else { return 0 }
    return min(max(page, 1), totalPages)
  }

  static func visibleItems(currentPage: Int, totalPages: Int) -> [VisibleItem] {
    guard totalPages > 0 else { return [] }
    if totalPages <= 5 {
      return (1...totalPages).map(VisibleItem.page)
    }

    let current = normalizedPage(currentPage, totalPages: totalPages)
    if current <= 3 {
      return [.page(1), .page(2), .page(3), .gap(1), .page(totalPages)]
    }
    if current >= totalPages - 2 {
      return [
        .page(1), .gap(-1), .page(totalPages - 2), .page(totalPages - 1), .page(totalPages)
      ]
    }
    return [.page(1), .gap(-1), .page(current), .gap(1), .page(totalPages)]
  }
}

public struct AurelglyphCommandPalette: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @FocusState private var searchIsFocused: Bool
  @State private var activeIndex = 0
  @State private var internalQuery: String
  @State private var hasAutoFocused = false
  private let items: [AurelglyphCommandItem]
  private let externalQuery: Binding<String>?
  private let isLoading: Bool
  private let isDisabled: Bool
  private let title: String
  private let searchLabel: String
  private let searchPlaceholder: String
  private let emptyMessage: String
  private let closeLabel: String
  private let clearLabel: String
  private let loadingLabel: String
  private let activeItemLabel: (String) -> String
  private let shortcutLabel: (String) -> String
  private let onSelect: (AurelglyphCommandItem) -> Void
  private let onDismiss: (() -> Void)?

  public init(
    items: [AurelglyphCommandItem],
    query: Binding<String>? = nil,
    isLoading: Bool = false,
    isDisabled: Bool = false,
    title: String = "Command palette",
    searchLabel: String = "Search commands",
    searchPlaceholder: String = "Search commands",
    emptyMessage: String = "No matching commands",
    closeLabel: String = "Close command palette",
    clearLabel: String = "Clear command search",
    loadingLabel: String = "Loading commands",
    activeItemLabel: @escaping (String) -> String = { "Active command: \($0)" },
    shortcutLabel: @escaping (String) -> String = { "Shortcut \($0)" },
    onSelect: @escaping (AurelglyphCommandItem) -> Void = { _ in },
    onDismiss: (() -> Void)? = nil
  ) {
    self.items = items
    self.externalQuery = query
    self._internalQuery = State(initialValue: query?.wrappedValue ?? "")
    self.isLoading = isLoading
    self.isDisabled = isDisabled
    self.title = title
    self.searchLabel = searchLabel
    self.searchPlaceholder = searchPlaceholder
    self.emptyMessage = emptyMessage
    self.closeLabel = closeLabel
    self.clearLabel = clearLabel
    self.loadingLabel = loadingLabel
    self.activeItemLabel = activeItemLabel
    self.shortcutLabel = shortcutLabel
    self.onSelect = onSelect
    self.onDismiss = onDismiss
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    let currentQuery = queryBinding.wrappedValue
    let results = Self.filteredItems(items, query: currentQuery)
    let activeItem = results.indices.contains(activeIndex) && !results[activeIndex].isDisabled
      ? results[activeIndex]
      : nil
    let searchAccessibilityValue = [
      currentQuery.isEmpty ? nil : currentQuery,
      activeItem.map { activeItemLabel($0.title) }
    ]
      .compactMap { $0 }
      .joined(separator: ", ")

    VStack(alignment: .leading, spacing: 12) {
      HStack(spacing: 10) {
        Text(title)
          .font(AurelglyphTypography.monoCaption)
          .foregroundStyle(palette.muted)
          .textCase(.uppercase)
          .accessibilityAddTraits(.isHeader)
        Spacer()
        if let onDismiss {
          AurelglyphIconButton(closeLabel, systemImage: "xmark", action: onDismiss)
        }
      }

      HStack(spacing: 8) {
        Image(systemName: "magnifyingglass")
          .foregroundStyle(palette.muted)
          .accessibilityHidden(true)
        TextField(searchPlaceholder, text: queryBinding)
          .textFieldStyle(.plain)
          .frame(minHeight: 44)
          .focused($searchIsFocused)
          .disabled(isDisabled || isLoading)
          .accessibilityLabel(searchLabel)
          .accessibilityValue(searchAccessibilityValue)
          .onSubmit {
            guard !isDisabled, !isLoading else { return }
            if results.indices.contains(activeIndex), !results[activeIndex].isDisabled {
              onSelect(results[activeIndex])
            } else if let first = results.first(where: { !$0.isDisabled }) {
              onSelect(first)
            }
          }
          .onKeyPress(.downArrow) {
            guard !isDisabled, !isLoading, !results.isEmpty else { return .ignored }
            activeIndex = Self.nextEnabledIndex(in: results, from: activeIndex, direction: 1)
            return .handled
          }
          .onKeyPress(.upArrow) {
            guard !isDisabled, !isLoading, !results.isEmpty else { return .ignored }
            activeIndex = Self.nextEnabledIndex(in: results, from: activeIndex, direction: -1)
            return .handled
          }
          .onKeyPress(.escape) {
            if !currentQuery.isEmpty {
              queryBinding.wrappedValue = ""
              return .handled
            }
            if let onDismiss {
              onDismiss()
              return .handled
            }
            return .ignored
          }
        if isLoading {
          ProgressView().controlSize(.small)
            .accessibilityLabel(loadingLabel)
        } else if !currentQuery.isEmpty {
          Button {
            queryBinding.wrappedValue = ""
          } label: {
            Image(systemName: "xmark.circle.fill")
              .frame(width: 44, height: 44)
          }
          .buttonStyle(.plain)
          .disabled(isDisabled)
          .accessibilityLabel(clearLabel)
        }
      }
      .padding(.horizontal, 10)
      .frame(minHeight: 44)
      .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
      .overlay {
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .stroke(searchIsFocused ? palette.focus : palette.border, lineWidth: 1)
      }
      .accessibilityElement(children: .contain)
      .accessibilityLabel(searchLabel)

      if !isLoading {
        if results.isEmpty {
          Text(emptyMessage)
            .font(AurelglyphTypography.caption)
            .foregroundStyle(palette.muted)
            .padding(10)
            .accessibilityLabel(emptyMessage)
        } else {
          ScrollView {
            LazyVStack(spacing: 4) {
              ForEach(Array(results.enumerated()), id: \.element.id) { index, item in
                Button {
                  onSelect(item)
                } label: {
                  HStack(spacing: 10) {
                    if let systemImage = item.systemImage {
                      Image(systemName: systemImage)
                    }
                    Text(item.title)
                    Spacer()
                    if let shortcut = item.shortcut {
                      Text(shortcut)
                        .font(AurelglyphTypography.monoCaption)
                        .foregroundStyle(palette.muted)
                    }
                  }
                  .padding(.horizontal, 10)
                  .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                  .background(
                    palette.accent.opacity(activeIndex == index ? 0.14 : 0.08),
                    in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                  )
                }
                .buttonStyle(.plain)
                .disabled(isDisabled || item.isDisabled)
                .opacity((isDisabled || item.isDisabled) ? 0.52 : 1)
                .accessibilityLabel(item.title)
                .accessibilityHint(item.shortcut.map(shortcutLabel) ?? "")
                .onHover { hovering in
                  if hovering && !item.isDisabled { activeIndex = index }
                }
              }
            }
          }
          .frame(maxHeight: 320)
          .scrollIndicators(.visible)
        }
      }
    }
    .padding(16)
    .foregroundStyle(palette.foreground)
    .background(palette.backgroundElevated, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .stroke(palette.border, lineWidth: 1)
    }
    .onAppear {
      normalizeActiveIndex()
      focusSearchIfNeeded()
    }
    .onChange(of: currentQuery) { _, _ in
      activeIndex = Self.firstEnabledIndex(in: results)
    }
    .onChange(of: items) { _, _ in normalizeActiveIndex() }
    .onChange(of: isLoading) { _, _ in
      normalizeActiveIndex()
      focusSearchIfNeeded()
    }
    .onChange(of: isDisabled) { _, _ in focusSearchIfNeeded() }
    .accessibilityElement(children: .contain)
    .accessibilityLabel(title)
  }

  private var queryBinding: Binding<String> {
    externalQuery ?? $internalQuery
  }

  private func normalizeActiveIndex() {
    let results = Self.filteredItems(items, query: queryBinding.wrappedValue)
    activeIndex = Self.firstEnabledIndex(in: results)
  }

  private func focusSearchIfNeeded() {
    guard !hasAutoFocused, !isLoading, !isDisabled else { return }
    hasAutoFocused = true
    Task { @MainActor in searchIsFocused = true }
  }

  static func filteredItems(
    _ items: [AurelglyphCommandItem],
    query: String
  ) -> [AurelglyphCommandItem] {
    let normalizedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedQuery.isEmpty else { return items }
    return items.filter { item in
      item.title.localizedCaseInsensitiveContains(normalizedQuery)
        || item.keywords.contains { $0.localizedCaseInsensitiveContains(normalizedQuery) }
    }
  }

  static func firstEnabledIndex(in items: [AurelglyphCommandItem]) -> Int {
    items.firstIndex(where: { !$0.isDisabled }) ?? 0
  }

  static func nextEnabledIndex(
    in items: [AurelglyphCommandItem],
    from currentIndex: Int,
    direction: Int
  ) -> Int {
    guard !items.isEmpty, items.contains(where: { !$0.isDisabled }) else { return 0 }
    var candidate = items.indices.contains(currentIndex) ? currentIndex : 0
    for _ in items.indices {
      candidate = (candidate + (direction >= 0 ? 1 : -1) + items.count) % items.count
      if !items[candidate].isDisabled { return candidate }
    }
    return firstEnabledIndex(in: items)
  }
}
