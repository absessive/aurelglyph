import SwiftUI

/// Overrideable copy used by shared control states and generated action labels.
public struct AurelglyphControlCopy {
  public var loading: String
  public var readOnly: String
  public var mixed: String
  public var checked: String
  public var unchecked: String
  public var selected: String
  public var unselected: String
  public var on: String
  public var off: String
  public var loadingOptions: String
  public var loadingLabel: (String) -> String
  public var decreaseLabel: (String) -> String
  public var increaseLabel: (String) -> String

  public init(
    loading: String = "Loading",
    readOnly: String = "Read only",
    mixed: String = "Mixed",
    checked: String = "Checked",
    unchecked: String = "Not checked",
    selected: String = "Selected",
    unselected: String = "Not selected",
    on: String = "On",
    off: String = "Off",
    loadingOptions: String = "Loading options",
    loadingLabel: @escaping (String) -> String = { "Loading \($0)" },
    decreaseLabel: @escaping (String) -> String = { "Decrease \($0)" },
    increaseLabel: @escaping (String) -> String = { "Increase \($0)" }
  ) {
    self.loading = loading
    self.readOnly = readOnly
    self.mixed = mixed
    self.checked = checked
    self.unchecked = unchecked
    self.selected = selected
    self.unselected = unselected
    self.on = on
    self.off = off
    self.loadingOptions = loadingOptions
    self.loadingLabel = loadingLabel
    self.decreaseLabel = decreaseLabel
    self.increaseLabel = increaseLabel
  }

  public static let standard = AurelglyphControlCopy()
}

private struct AurelglyphControlCopyKey: EnvironmentKey {
  static let defaultValue = AurelglyphControlCopy.standard
}

public extension EnvironmentValues {
  var aurelglyphControlCopy: AurelglyphControlCopy {
    get { self[AurelglyphControlCopyKey.self] }
    set { self[AurelglyphControlCopyKey.self] = newValue }
  }
}

public extension View {
  /// Overrides built-in control-state copy for this view hierarchy.
  func aurelglyphControlCopy(_ copy: AurelglyphControlCopy) -> some View {
    environment(\.aurelglyphControlCopy, copy)
  }
}

func aurelglyphControlHint(
  isReadOnly: Bool = false,
  error: String? = nil,
  instruction: String? = nil,
  readOnlyLabel: String = "Read only"
) -> String {
  var parts: [String] = []
  if let error { parts.append(error) }
  if isReadOnly {
    parts.append(readOnlyLabel)
  } else if let instruction {
    parts.append(instruction)
  }
  return parts.joined(separator: ". ")
}

public struct AurelglyphIconButton: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  private let label: String
  private let systemImage: String
  private let isDisabled: Bool
  private let isLoading: Bool
  private let action: () -> Void

  public init(
    _ label: String,
    systemImage: String,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    action: @escaping () -> Void
  ) {
    self.label = label
    self.systemImage = systemImage
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.action = action
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    Button(action: action) {
      Group {
        if isLoading {
          ProgressView()
            .controlSize(.small)
        } else {
          Image(systemName: systemImage)
        }
      }
      .frame(width: 44, height: 44)
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .foregroundStyle(palette.foreground)
    .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
    .overlay {
      RoundedRectangle(cornerRadius: 8, style: .continuous)
        .stroke(palette.border, lineWidth: 1)
    }
    .disabled(isDisabled || isLoading)
    .opacity(isDisabled ? 0.52 : 1)
    .accessibilityLabel(label)
    .accessibilityValue(isLoading ? controlCopy.loading : "")
  }
}

public enum AurelglyphAxis: Sendable {
  case horizontal
  case vertical
}

public struct AurelglyphButtonGroup<Content: View>: View {
  private let axis: AurelglyphAxis
  private let spacing: CGFloat
  private let label: String
  private let content: Content

  public init(
    _ label: String = "Actions",
    axis: AurelglyphAxis = .horizontal,
    spacing: CGFloat = 8,
    @ViewBuilder content: () -> Content
  ) {
    self.axis = axis
    self.spacing = spacing
    self.label = label
    self.content = content()
  }

  public var body: some View {
    let layout = axis == .horizontal
      ? AnyLayout(HStackLayout(spacing: spacing))
      : AnyLayout(VStackLayout(alignment: .leading, spacing: spacing))

    layout {
      content
    }
    .accessibilityElement(children: .contain)
    .accessibilityLabel(label)
  }
}

public struct AurelglyphCheckbox: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  private let title: String
  private let message: String?
  @Binding private var isChecked: Bool
  private let isIndeterminate: Bool
  private let isDisabled: Bool
  private let isLoading: Bool
  private let isReadOnly: Bool
  private let error: String?

  public init(
    _ title: String,
    message: String? = nil,
    isChecked: Binding<Bool>,
    isIndeterminate: Bool = false,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    isReadOnly: Bool = false,
    error: String? = nil
  ) {
    self.title = title
    self.message = message
    self._isChecked = isChecked
    self.isIndeterminate = isIndeterminate
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.isReadOnly = isReadOnly
    self.error = error
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    VStack(alignment: .leading, spacing: 5) {
      Button {
        isChecked = isIndeterminate ? true : !isChecked
      } label: {
        HStack(alignment: .top, spacing: 10) {
          ZStack {
            RoundedRectangle(cornerRadius: 4, style: .continuous)
              .fill((isChecked || isIndeterminate) ? palette.accentControl : palette.surfaceMuted)
              .frame(width: 20, height: 20)
            RoundedRectangle(cornerRadius: 4, style: .continuous)
              .stroke((isChecked || isIndeterminate) ? palette.focus : palette.borderStrong, lineWidth: 1)
              .frame(width: 20, height: 20)

            if isLoading {
              ProgressView()
                .controlSize(.mini)
                .tint((isChecked || isIndeterminate) ? palette.accentForeground : palette.focus)
            } else if isIndeterminate {
              Image(systemName: "minus")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(palette.accentForeground)
            } else if isChecked {
              Image(systemName: "checkmark")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(palette.accentForeground)
            }
          }
          .accessibilityHidden(true)

          VStack(alignment: .leading, spacing: 2) {
            Text(title)
              .font(AurelglyphTypography.body)
              .foregroundStyle(palette.foreground)
            if let message {
              Text(message)
                .font(AurelglyphTypography.caption)
                .foregroundStyle(palette.muted)
            }
          }
        }
        .frame(minHeight: 44, alignment: .leading)
        .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
      .disabled(isDisabled || isLoading || isReadOnly)
      .opacity(isDisabled ? 0.52 : 1)
      .accessibilityLabel([title, message].compactMap { $0 }.joined(separator: ", "))
      .accessibilityValue(accessibilityValue)
      .accessibilityHint(
        aurelglyphControlHint(
          isReadOnly: isReadOnly,
          error: error,
          readOnlyLabel: controlCopy.readOnly
        )
      )

      if let error {
        Text(error)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(palette.danger)
          .accessibilityLabel(error)
      }
    }
  }

  private var accessibilityValue: String {
    if isLoading { return controlCopy.loading }
    if isIndeterminate { return controlCopy.mixed }
    return isChecked ? controlCopy.checked : controlCopy.unchecked
  }
}

public struct AurelglyphRadioItem: Identifiable, Sendable {
  public let id: String
  public let title: String
  public let message: String?
  public let isDisabled: Bool

  public init(id: String, title: String, message: String? = nil, isDisabled: Bool = false) {
    self.id = id
    self.title = title
    self.message = message
    self.isDisabled = isDisabled
  }
}

public struct AurelglyphRadioGroup: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  private let label: String
  private let items: [AurelglyphRadioItem]
  @Binding private var selection: String
  private let isDisabled: Bool
  private let isLoading: Bool
  private let isReadOnly: Bool
  private let error: String?

  public init(
    _ label: String,
    items: [AurelglyphRadioItem],
    selection: Binding<String>,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    isReadOnly: Bool = false,
    error: String? = nil
  ) {
    self.label = label
    self.items = items
    self._selection = selection
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.isReadOnly = isReadOnly
    self.error = error
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)

    VStack(alignment: .leading, spacing: 9) {
      Text(label)
        .font(AurelglyphTypography.monoLabel)
        .textCase(.uppercase)
        .foregroundStyle(palette.muted)

      ForEach(items) { item in
        let isSelected = selection == item.id
        Button {
          selection = item.id
        } label: {
          HStack(alignment: .top, spacing: 10) {
            ZStack {
              Circle()
                .stroke(isSelected ? palette.focus : palette.borderStrong, lineWidth: isSelected ? 2 : 1)
                .frame(width: 20, height: 20)
              if isSelected {
                Circle()
                  .fill(palette.accentControl)
                  .frame(width: 10, height: 10)
              }
            }
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
              Text(item.title)
                .font(AurelglyphTypography.body)
                .foregroundStyle(palette.foreground)
              if let message = item.message {
                Text(message)
                  .font(AurelglyphTypography.caption)
                  .foregroundStyle(palette.muted)
              }
            }
          }
          .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
          .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(isDisabled || isLoading || isReadOnly || item.isDisabled)
        .opacity((isDisabled || item.isDisabled) ? 0.52 : 1)
        .accessibilityLabel([item.title, item.message].compactMap { $0 }.joined(separator: ", "))
        .accessibilityValue(isSelected ? controlCopy.selected : controlCopy.unselected)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .accessibilityHint(
          aurelglyphControlHint(
            isReadOnly: isReadOnly,
            error: error,
            readOnlyLabel: controlCopy.readOnly
          )
        )
      }

      if isLoading {
        AurelglyphSpinner(controlCopy.loadingOptions, size: .small)
      }

      if let error {
        Text(error)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(palette.danger)
          .accessibilityLabel(error)
      }
    }
    .accessibilityElement(children: .contain)
    .accessibilityLabel(label)
    .accessibilityHint(
      aurelglyphControlHint(
        isReadOnly: isReadOnly,
        error: error,
        readOnlyLabel: controlCopy.readOnly
      )
    )
  }
}

public struct AurelglyphSlider: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  private let label: String
  @Binding private var value: Double
  private let range: ClosedRange<Double>
  private let step: Double
  private let isDisabled: Bool
  private let isLoading: Bool
  private let isReadOnly: Bool
  private let error: String?
  private let valueFormatter: (Double) -> String

  public init(
    _ label: String,
    value: Binding<Double>,
    in range: ClosedRange<Double> = 0...100,
    step: Double = 1,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    isReadOnly: Bool = false,
    error: String? = nil,
    valueFormatter: @escaping (Double) -> String = { String(format: "%.0f", $0) }
  ) {
    self.label = label
    self._value = value
    self.range = range
    self.step = Self.normalizedStep(step)
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.isReadOnly = isReadOnly
    self.error = error
    self.valueFormatter = valueFormatter
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    let resolvedValue = Self.clampedValue(value, range: range)

    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text(label)
          .font(AurelglyphTypography.monoLabel)
          .textCase(.uppercase)
          .foregroundStyle(palette.muted)
        Spacer()
        if isLoading {
          ProgressView()
            .controlSize(.mini)
            .accessibilityLabel(controlCopy.loadingLabel(label))
        } else {
          Text(valueFormatter(resolvedValue))
            .font(AurelglyphTypography.monoCaption)
            .foregroundStyle(palette.foreground)
        }
      }

      Slider(value: boundedValue, in: range, step: step)
        .tint(palette.accentControl)
        .disabled(isDisabled || isLoading || isReadOnly)
        .accessibilityLabel(label)
        .accessibilityValue(valueFormatter(resolvedValue))
        .accessibilityHint(
          aurelglyphControlHint(
            isReadOnly: isReadOnly,
            error: error,
            readOnlyLabel: controlCopy.readOnly
          )
        )

      if let error {
        Text(error)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(palette.danger)
          .accessibilityLabel(error)
      }
    }
    .opacity(isDisabled ? 0.52 : 1)
  }

  private var boundedValue: Binding<Double> {
    Binding(
      get: { Self.clampedValue(value, range: range) },
      set: { value = Self.clampedValue($0, range: range) }
    )
  }

  static func clampedValue(_ value: Double, range: ClosedRange<Double>) -> Double {
    if value.isNaN { return range.lowerBound }
    return min(max(value, range.lowerBound), range.upperBound)
  }

  static func normalizedStep(_ step: Double) -> Double {
    step.isFinite && step > 0 ? step : 1
  }
}

public struct AurelglyphNumberField: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  @FocusState private var fieldIsFocused: Bool
  private let label: String
  @Binding private var value: Double
  private let range: ClosedRange<Double>
  private let step: Double
  private let isDisabled: Bool
  private let isLoading: Bool
  private let isReadOnly: Bool
  private let error: String?

  public init(
    _ label: String,
    value: Binding<Double>,
    in range: ClosedRange<Double> = 0...100,
    step: Double = 1,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    isReadOnly: Bool = false,
    error: String? = nil
  ) {
    self.label = label
    self._value = value
    self.range = range
    self.step = AurelglyphSlider.normalizedStep(step)
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.isReadOnly = isReadOnly
    self.error = error
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    let controlsDisabled = isDisabled || isLoading || isReadOnly
    let resolvedValue = Self.normalizedValue(value, range: range)

    VStack(alignment: .leading, spacing: 7) {
      Text(label)
        .font(AurelglyphTypography.monoLabel)
        .textCase(.uppercase)
        .foregroundStyle(palette.muted)

      HStack(spacing: 6) {
        AurelglyphIconButton(
          controlCopy.decreaseLabel(label),
          systemImage: "minus",
          isDisabled: controlsDisabled || !Self.canStep(value: value, direction: -1, range: range, step: step),
          action: { value = Self.adjusted(value: value, direction: -1, range: range, step: step) }
        )

        TextField(label, value: normalizedValue, format: .number)
          .textFieldStyle(.plain)
          .foregroundStyle(palette.foreground)
          .focused($fieldIsFocused)
          .multilineTextAlignment(.center)
          .font(AurelglyphTypography.mono(size: 14))
          .padding(.horizontal, 10)
          .frame(minWidth: 72, minHeight: 44)
          .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
          .overlay {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
              .stroke(error != nil ? palette.danger : (fieldIsFocused ? palette.focus : palette.border), lineWidth: 1)
          }
          .disabled(controlsDisabled)
          .accessibilityLabel(label)
          .accessibilityValue(String(resolvedValue))
          .accessibilityHint(
            aurelglyphControlHint(
              isReadOnly: isReadOnly,
              error: error,
              readOnlyLabel: controlCopy.readOnly
            )
          )

        AurelglyphIconButton(
          controlCopy.increaseLabel(label),
          systemImage: "plus",
          isDisabled: controlsDisabled || !Self.canStep(value: value, direction: 1, range: range, step: step),
          isLoading: isLoading,
          action: { value = Self.adjusted(value: value, direction: 1, range: range, step: step) }
        )
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

  private var normalizedValue: Binding<Double> {
    Binding(
      get: { Self.normalizedValue(value, range: range) },
      set: { value = Self.normalizedValue($0, range: range) }
    )
  }

  static func normalizedValue(_ value: Double, range: ClosedRange<Double>) -> Double {
    AurelglyphSlider.clampedValue(value, range: range)
  }

  static func adjusted(
    value: Double,
    direction: Int,
    range: ClosedRange<Double>,
    step: Double
  ) -> Double {
    let normalizedStep = AurelglyphSlider.normalizedStep(step)
    let boundedValue = normalizedValue(value, range: range)
    guard value.isFinite, value == boundedValue else { return boundedValue }
    let offset = (boundedValue - range.lowerBound) / normalizedStep
    let index = direction > 0 ? floor(offset + 1e-9) + 1 : ceil(offset - 1e-9) - 1
    let candidate = range.lowerBound + index * normalizedStep
    guard candidate >= range.lowerBound, candidate <= range.upperBound else {
      return boundedValue
    }
    return candidate
  }

  static func canStep(
    value: Double,
    direction: Int,
    range: ClosedRange<Double>,
    step: Double
  ) -> Bool {
    if value.isNaN || value == -.infinity { return direction > 0 }
    if value == .infinity { return direction < 0 }
    if value < range.lowerBound { return direction > 0 }
    if value > range.upperBound { return direction < 0 }
    let adjustedValue = adjusted(value: value, direction: direction, range: range, step: step)
    return direction > 0 ? adjustedValue > value : adjustedValue < value
  }
}

public struct AurelglyphOption: Identifiable, Hashable, Sendable {
  public let id: String
  public let label: String
  public let detail: String?
  public let isDisabled: Bool

  public init(id: String, label: String, detail: String? = nil, isDisabled: Bool = false) {
    self.id = id
    self.label = label
    self.detail = detail
    self.isDisabled = isDisabled
  }
}

public struct AurelglyphCombobox: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var controlCopy
  @FocusState private var isFocused: Bool
  @State private var isExpanded = false
  @State private var activeIndex = 0
  private let label: String
  private let options: [AurelglyphOption]
  @Binding private var query: String
  @Binding private var selection: String?
  private let placeholder: String
  private let maxResults: Int
  private let isDisabled: Bool
  private let isLoading: Bool
  private let isReadOnly: Bool
  private let error: String?
  private let emptyMessage: String
  private let showOptionsLabel: String
  private let hideOptionsLabel: String
  private let loadingLabel: String
  private let optionsLabel: String
  private let selectedLabel: String
  private let instruction: String
  private let activeOptionLabel: (String) -> String
  private let optionAccessibilityLabel: (AurelglyphOption) -> String

  public init(
    _ label: String,
    options: [AurelglyphOption],
    query: Binding<String>,
    selection: Binding<String?>,
    placeholder: String = "Search options",
    maxResults: Int = 8,
    isDisabled: Bool = false,
    isLoading: Bool = false,
    isReadOnly: Bool = false,
    error: String? = nil,
    emptyMessage: String = "No matching options",
    showOptionsLabel: String = "Show options",
    hideOptionsLabel: String = "Hide options",
    loadingLabel: String? = nil,
    optionsLabel: String? = nil,
    selectedLabel: String = "Selected",
    instruction: String = "Type to filter options",
    activeOptionLabel: @escaping (String) -> String = { "Active option: \($0)" },
    optionAccessibilityLabel: @escaping (AurelglyphOption) -> String = {
      [$0.label, $0.detail].compactMap { $0 }.joined(separator: ", ")
    }
  ) {
    self.label = label
    self.options = options
    self._query = query
    self._selection = selection
    self.placeholder = placeholder
    self.maxResults = max(maxResults, 1)
    self.isDisabled = isDisabled
    self.isLoading = isLoading
    self.isReadOnly = isReadOnly
    self.error = error
    self.emptyMessage = emptyMessage
    self.showOptionsLabel = showOptionsLabel
    self.hideOptionsLabel = hideOptionsLabel
    self.loadingLabel = loadingLabel ?? "Loading \(label) options"
    self.optionsLabel = optionsLabel ?? "\(label) options"
    self.selectedLabel = selectedLabel
    self.instruction = instruction
    self.activeOptionLabel = activeOptionLabel
    self.optionAccessibilityLabel = optionAccessibilityLabel
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    let results = Self.filteredOptions(options, query: query, limit: maxResults)
    let activeOption = results.indices.contains(activeIndex) && !results[activeIndex].isDisabled
      ? results[activeIndex]
      : nil
    let resolvedSelection = selectedOption?.label == query ? selectedOption : nil
    let accessibilityValue = [
      isLoading ? loadingLabel : (resolvedSelection?.label ?? (query.isEmpty ? nil : query)),
      isExpanded ? activeOption.map { activeOptionLabel($0.label) } : nil
    ]
      .compactMap { $0 }
      .joined(separator: ", ")

    VStack(alignment: .leading, spacing: 7) {
      Text(label)
        .font(AurelglyphTypography.monoLabel)
        .textCase(.uppercase)
        .foregroundStyle(palette.muted)

      HStack(spacing: 8) {
        Image(systemName: "magnifyingglass")
          .foregroundStyle(palette.muted)
          .accessibilityHidden(true)
        TextField(placeholder, text: $query)
          .textFieldStyle(.plain)
          .foregroundStyle(palette.foreground)
          .frame(minHeight: 44)
          .focused($isFocused)
          .disabled(isDisabled || isLoading || isReadOnly)
          .accessibilityLabel(label)
          .accessibilityValue(accessibilityValue)
          .accessibilityHint(
            aurelglyphControlHint(
              isReadOnly: isReadOnly,
              error: error,
              instruction: instruction,
              readOnlyLabel: controlCopy.readOnly
            )
          )
          .onSubmit {
            guard !isDisabled, !isLoading, !isReadOnly else { return }
            if results.indices.contains(activeIndex), !results[activeIndex].isDisabled {
              select(results[activeIndex])
            } else if let first = results.first(where: { !$0.isDisabled }) {
              select(first)
            }
          }
          .onKeyPress(.downArrow) {
            guard !isDisabled, !isLoading, !isReadOnly, !results.isEmpty else { return .ignored }
            isExpanded = true
            activeIndex = Self.nextEnabledIndex(
              in: results,
              from: activeIndex,
              direction: 1
            )
            return .handled
          }
          .onKeyPress(.upArrow) {
            guard !isDisabled, !isLoading, !isReadOnly, !results.isEmpty else { return .ignored }
            isExpanded = true
            activeIndex = Self.nextEnabledIndex(
              in: results,
              from: activeIndex,
              direction: -1
            )
            return .handled
          }
          .onKeyPress(.escape) {
            guard isExpanded else { return .ignored }
            isExpanded = false
            return .handled
          }
        if isLoading {
          ProgressView()
            .controlSize(.small)
            .accessibilityLabel(loadingLabel)
        } else {
          Button {
            isExpanded.toggle()
            isFocused = isExpanded
          } label: {
            Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
              .frame(width: 44, height: 44)
          }
          .buttonStyle(.plain)
          .foregroundStyle(palette.foreground)
          .disabled(isDisabled || isReadOnly)
          .accessibilityLabel(isExpanded ? hideOptionsLabel : showOptionsLabel)
        }
      }
      .padding(.horizontal, 12)
      .frame(minHeight: 44)
      .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
      .overlay {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
          .stroke(error != nil ? palette.danger : (isFocused ? palette.focus : palette.border), lineWidth: 1)
      }
      .opacity(isDisabled ? 0.52 : 1)
      .onChange(of: isFocused) { _, focused in
        if focused {
          isExpanded = true
          activeIndex = Self.firstEnabledIndex(in: results)
        } else {
          Task { @MainActor in
            if !isFocused { isExpanded = false }
          }
        }
      }
      .onChange(of: query) { _, _ in
        activeIndex = Self.firstEnabledIndex(in: results)
        if let selectedOption, selectedOption.label != query {
          selection = nil
        }
        if isFocused { isExpanded = true }
      }
      .onChange(of: isReadOnly) { _, readOnly in
        if readOnly {
          isExpanded = false
          isFocused = false
        }
      }
      .onChange(of: isDisabled) { _, disabled in
        if disabled {
          isExpanded = false
          isFocused = false
        }
      }
      .onChange(of: isLoading) { _, loading in
        if loading { isExpanded = false }
      }
      .onChange(of: options) { _, newOptions in
        activeIndex = Self.firstEnabledIndex(in: results)
        if let selection {
          if let selected = newOptions.first(where: { $0.id == selection }) {
            query = selected.label
          } else {
            self.selection = nil
          }
        }
      }
      .onChange(of: selection) { _, selectedID in
        if let selectedID, let selected = options.first(where: { $0.id == selectedID }) {
          query = selected.label
        }
      }

      if isExpanded && !isDisabled && !isLoading && !isReadOnly {
        VStack(alignment: .leading, spacing: 2) {
          if results.isEmpty {
            Text(emptyMessage)
              .font(AurelglyphTypography.caption)
              .foregroundStyle(palette.muted)
              .padding(10)
              .accessibilityLabel(emptyMessage)
          } else {
            ScrollView {
              LazyVStack(alignment: .leading, spacing: 2) {
                ForEach(Array(results.enumerated()), id: \.element.id) { index, option in
                  Button {
                    select(option)
                  } label: {
                    HStack(spacing: 10) {
                      VStack(alignment: .leading, spacing: 2) {
                        Text(option.label)
                          .foregroundStyle(palette.foreground)
                        if let detail = option.detail {
                          Text(detail)
                            .font(AurelglyphTypography.caption)
                            .foregroundStyle(palette.muted)
                        }
                      }
                      Spacer()
                      if selection == option.id {
                        Image(systemName: "checkmark")
                          .foregroundStyle(palette.accent)
                      }
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                    .background(
                      (selection == option.id || activeIndex == index)
                        ? palette.accent.opacity(selection == option.id ? 0.14 : 0.08)
                        : Color.clear,
                      in: RoundedRectangle(cornerRadius: 6, style: .continuous)
                    )
                  }
                  .buttonStyle(.plain)
                  .disabled(option.isDisabled)
                  .opacity(option.isDisabled ? 0.52 : 1)
                  .accessibilityLabel(optionAccessibilityLabel(option))
                  .accessibilityValue(selection == option.id ? selectedLabel : "")
                  .accessibilityAddTraits(selection == option.id ? .isSelected : [])
                  .onHover { hovering in
                    if hovering && !option.isDisabled { activeIndex = index }
                  }
                }
              }
            }
            .frame(maxHeight: 280)
            .scrollIndicators(.visible)
          }
        }
        .padding(5)
        .background(palette.backgroundElevated, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay {
          RoundedRectangle(cornerRadius: 10, style: .continuous)
            .stroke(palette.border, lineWidth: 1)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(optionsLabel)
      }

      if let error {
        Text(error)
          .font(AurelglyphTypography.caption)
          .foregroundStyle(palette.danger)
          .accessibilityLabel(error)
      }
    }
    .onAppear(perform: reconcileInitialSelection)
  }

  private var selectedOption: AurelglyphOption? {
    options.first { $0.id == selection }
  }

  private func select(_ option: AurelglyphOption) {
    guard !option.isDisabled else { return }
    selection = option.id
    query = option.label
    isExpanded = false
    isFocused = false
  }

  private func reconcileInitialSelection() {
    activeIndex = Self.firstEnabledIndex(
      in: Self.filteredOptions(options, query: query, limit: maxResults)
    )
    guard let selection else { return }
    guard let selected = options.first(where: { $0.id == selection }) else {
      self.selection = nil
      return
    }
    if query.isEmpty {
      query = selected.label
    } else if query != selected.label {
      self.selection = nil
    }
  }

  static func filteredOptions(
    _ options: [AurelglyphOption],
    query: String,
    limit: Int
  ) -> [AurelglyphOption] {
    let normalizedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
    let matches = normalizedQuery.isEmpty
      ? options
      : options.filter {
          $0.label.localizedCaseInsensitiveContains(normalizedQuery)
            || ($0.detail?.localizedCaseInsensitiveContains(normalizedQuery) ?? false)
        }
    return Array(matches.prefix(max(limit, 1)))
  }

  static func firstEnabledIndex(in options: [AurelglyphOption]) -> Int {
    options.firstIndex(where: { !$0.isDisabled }) ?? 0
  }

  static func nextEnabledIndex(
    in options: [AurelglyphOption],
    from currentIndex: Int,
    direction: Int
  ) -> Int {
    guard !options.isEmpty, options.contains(where: { !$0.isDisabled }) else { return 0 }
    var candidate = options.indices.contains(currentIndex) ? currentIndex : 0
    for _ in options.indices {
      candidate = (candidate + (direction >= 0 ? 1 : -1) + options.count) % options.count
      if !options[candidate].isDisabled { return candidate }
    }
    return firstEnabledIndex(in: options)
  }
}

public typealias AurelglyphAutocomplete = AurelglyphCombobox

public enum AurelglyphSpinnerSize: Sendable {
  case small
  case regular
  case large
}

public struct AurelglyphSpinner: View {
  private let label: String
  private let size: AurelglyphSpinnerSize

  public init(_ label: String = "Loading", size: AurelglyphSpinnerSize = .regular) {
    self.label = label
    self.size = size
  }

  public var body: some View {
    HStack(spacing: 8) {
      ProgressView()
        .controlSize(controlSize)
      Text(label)
        .font(AurelglyphTypography.caption)
        .foregroundStyle(.secondary)
    }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(label)
  }

  private var controlSize: ControlSize {
    switch size {
    case .small: .mini
    case .regular: .regular
    case .large: .large
    }
  }
}

public enum AurelglyphDividerOrientation: Sendable {
  case horizontal
  case vertical
}

public struct AurelglyphDivider: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  private let orientation: AurelglyphDividerOrientation

  public init(_ orientation: AurelglyphDividerOrientation = .horizontal) {
    self.orientation = orientation
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    Rectangle()
      .fill(palette.border)
      .frame(
        width: orientation == .vertical ? 1 : nil,
        height: orientation == .horizontal ? 1 : nil
      )
      .accessibilityHidden(true)
  }
}
