import Foundation
import SwiftUI

/// Navigation text. An unavailable link has no destination or activation action.
public struct AurelglyphLink: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var copy
  private let title: String
  private let destination: URL?
  private let isExternal: Bool

  public init(_ title: String, destination: URL?, isDisabled: Bool = false, isExternal: Bool = false) {
    self.title = title
    self.destination = Self.availableDestination(destination, isDisabled: isDisabled)
    self.isExternal = isExternal
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    if let destination {
      Link(destination: destination) {
        HStack(spacing: 6) {
          Text(title).underline()
          if isExternal {
            Image(systemName: "arrow.up.right").accessibilityHidden(true)
          }
        }
        .frame(minWidth: AurelglyphResponsiveLayout.minimumInteractiveDimension,
          minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension)
        .contentShape(Rectangle())
      }
      .font(AurelglyphTypography.body)
      .foregroundStyle(palette.accent)
      .accessibilityLabel(title)
      .accessibilityHint(isExternal ? copy.externalLink : "")
    } else {
      Text(title)
        .font(AurelglyphTypography.body)
        .foregroundStyle(palette.muted)
        .accessibilityValue(copy.unavailable)
        .allowsHitTesting(false)
    }
  }

  static func availableDestination(_ destination: URL?, isDisabled: Bool) -> URL? {
    isDisabled ? nil : destination
  }
}

/// Interactive selection and removal; use Badge for a static label.
public struct AurelglyphChip: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var copy
  @State private var localSelected: Bool
  private let title: String
  private let selected: Binding<Bool>?
  private let isSelectable: Bool
  private let isDisabled: Bool
  private let isReadOnly: Bool
  private let isLoading: Bool
  private let removeLabel: String?
  private let onSelectionChange: ((Bool) -> Void)?
  private let onRemove: (() -> Void)?

  public init(
    _ title: String,
    isSelected: Binding<Bool>? = nil,
    defaultSelected: Bool = false,
    isSelectable: Bool = true,
    isDisabled: Bool = false,
    isReadOnly: Bool = false,
    isLoading: Bool = false,
    removeLabel: String? = nil,
    onSelectionChange: ((Bool) -> Void)? = nil,
    onRemove: (() -> Void)? = nil
  ) {
    precondition(isSelectable || onRemove != nil, "Use AurelglyphBadge for a non-interactive label")
    self.title = title
    self.selected = isSelected
    self._localSelected = State(initialValue: defaultSelected)
    self.isSelectable = isSelectable
    self.isDisabled = isDisabled
    self.isReadOnly = isReadOnly
    self.isLoading = isLoading
    self.removeLabel = removeLabel
    self.onSelectionChange = onSelectionChange
    self.onRemove = onRemove
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    HStack(spacing: 0) {
      if isSelectable {
        Button {
          guard !locked else { return }
          let next = !resolvedSelected
          if let selected { selected.wrappedValue = next } else { localSelected = next }
          onSelectionChange?(next)
        } label: {
          chipLabel
            .padding(.horizontal, 12)
            .frame(minWidth: AurelglyphResponsiveLayout.minimumInteractiveDimension,
              minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(locked)
        .accessibilityLabel(title)
        .accessibilityValue(resolvedSelected ? copy.selected : copy.unselected)
        .accessibilityAddTraits(resolvedSelected ? .isSelected : [])
        .accessibilityHint(isReadOnly ? copy.readOnly : (isLoading ? copy.loading : ""))
      } else {
        chipLabel.padding(.horizontal, 12)
      }
      if let onRemove {
        Button {
          guard !locked else { return }
          onRemove()
        } label: {
          Image(systemName: "xmark")
            .font(AurelglyphTypography.label)
            .frame(width: 44, height: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(locked)
        .accessibilityLabel(removeLabel ?? copy.removeLabel(title))
        .accessibilityHint(isReadOnly ? copy.readOnly : (isLoading ? copy.loading : ""))
      }
    }
    .font(AurelglyphTypography.body)
    .foregroundStyle(palette.foreground)
    .background(resolvedSelected ? palette.accent.opacity(0.12) : palette.surfaceMuted,
                in: RoundedRectangle(cornerRadius: theme.boxCornerRadius))
    .overlay {
      RoundedRectangle(cornerRadius: theme.boxCornerRadius)
        .stroke(resolvedSelected ? palette.focus : palette.borderStrong, lineWidth: 1)
    }
    .opacity(isDisabled ? 0.52 : 1)
    .accessibilityElement(children: .contain)
  }

  private var resolvedSelected: Bool { selected?.wrappedValue ?? localSelected }
  private var locked: Bool { isDisabled || isReadOnly || isLoading }
  private var chipLabel: some View {
    HStack(spacing: 6) {
      if resolvedSelected {
        Image(systemName: "checkmark").font(AurelglyphTypography.label).accessibilityHidden(true)
      }
      Text(title)
    }
  }
}

public enum AurelglyphPasswordPurpose: Sendable {
  case password
  case newPassword
}

/// Secure by default. Visibility changes retain the same value and native selection.
public struct AurelglyphPasswordField: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var copy
  @State private var revealed = false
  @State private var focused = false
  @Binding private var text: String
  private let title: String
  private let placeholder: String
  private let purpose: AurelglyphPasswordPurpose
  private let isDisabled: Bool
  private let isReadOnly: Bool
  private let isLoading: Bool
  private let isRequired: Bool
  private let isInvalid: Bool
  private let helpText: String?
  private let error: String?
  private let focusRequest: Int?

  public init(
    _ title: String,
    text: Binding<String>,
    placeholder: String = "",
    purpose: AurelglyphPasswordPurpose = .password,
    isDisabled: Bool = false,
    isReadOnly: Bool = false,
    isLoading: Bool = false,
    isRequired: Bool = false,
    isInvalid: Bool = false,
    helpText: String? = nil,
    error: String? = nil,
    focusRequest: Int? = nil
  ) {
    self.title = title
    self._text = text
    self.placeholder = placeholder
    self.purpose = purpose
    self.isDisabled = isDisabled
    self.isReadOnly = isReadOnly
    self.isLoading = isLoading
    self.isRequired = isRequired
    self.isInvalid = isInvalid
    self.helpText = helpText
    self.error = error
    self.focusRequest = focusRequest
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    VStack(alignment: .leading, spacing: 7) {
      AurelglyphFieldLabel(title: title, palette: palette)
      HStack(spacing: 0) {
        AurelglyphNativeTextEntry(
          text: $text,
          configuration: .init(
            label: title, placeholder: placeholder, isSecure: !revealed, purpose: purpose,
            isDisabled: isDisabled || isLoading, isReadOnly: isReadOnly, palette: palette,
            hint: aurelglyphFieldHint(isReadOnly: isReadOnly, isRequired: isRequired,
              isInvalid: isInvalid || error != nil, isLoading: isLoading,
              helpText: helpText, error: error, unitDescription: nil, copy: copy),
            focusRequest: focusRequest, onFocusChange: { focused = $0 }
          )
        )
        .padding(.horizontal, 12)
        Button { revealed.toggle() } label: {
          Group {
            if isLoading { ProgressView().controlSize(.small) }
            else { Image(systemName: revealed ? "eye.slash" : "eye").font(.system(size: 17)) }
          }
          .frame(width: 44, height: 44)
          .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .foregroundStyle(palette.foreground)
        .disabled(isDisabled || isLoading)
        .accessibilityLabel(revealed ? copy.hidePassword : copy.showPassword)
      }
      .frame(minHeight: AurelglyphResponsiveLayout.minimumInteractiveDimension)
      .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: theme.boxCornerRadius))
      .overlay {
        RoundedRectangle(cornerRadius: theme.boxCornerRadius)
          .stroke(isInvalid || error != nil ? palette.danger : (focused ? palette.focus : palette.borderStrong), lineWidth: 1)
      }
      .opacity(isDisabled ? 0.52 : 1)
      AurelglyphFieldMessage(helpText: helpText, error: error, palette: palette)
    }
  }
}

/// Owns exactly one labeled text field. Add-on actions remain sibling controls.
public struct AurelglyphInputGroup<Leading: View, Trailing: View>: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var copy
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @State private var focused = false
  @Binding private var text: String
  private let title: String
  private let placeholder: String
  private let leading: Leading
  private let trailing: Trailing
  private let isDisabled: Bool
  private let isReadOnly: Bool
  private let isLoading: Bool
  private let isRequired: Bool
  private let isInvalid: Bool
  private let helpText: String?
  private let error: String?
  private let unitDescription: String?
  private let focusRequest: Int?

  public init(
    _ title: String,
    text: Binding<String>,
    placeholder: String = "",
    isDisabled: Bool = false,
    isReadOnly: Bool = false,
    isLoading: Bool = false,
    isRequired: Bool = false,
    isInvalid: Bool = false,
    helpText: String? = nil,
    error: String? = nil,
    unitDescription: String? = nil,
    focusRequest: Int? = nil,
    @ViewBuilder leading: () -> Leading,
    @ViewBuilder trailing: () -> Trailing
  ) {
    self.title = title
    self._text = text
    self.placeholder = placeholder
    self.isDisabled = isDisabled
    self.isReadOnly = isReadOnly
    self.isLoading = isLoading
    self.isRequired = isRequired
    self.isInvalid = isInvalid
    self.helpText = helpText
    self.error = error
    self.unitDescription = unitDescription
    self.focusRequest = focusRequest
    self.leading = leading()
    self.trailing = trailing()
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    VStack(alignment: .leading, spacing: 7) {
      AurelglyphFieldLabel(title: title, palette: palette)
      AurelglyphAdaptiveLayout(
        primary: AnyLayout(HStackLayout(spacing: 8)),
        fallback: AnyLayout(VStackLayout(alignment: .leading, spacing: 8)),
        fittingAxis: .horizontal,
        forceFallback: AurelglyphResponsiveLayout.prefersStackedLayout(for: dynamicTypeSize)
      ) {
        leading
        AurelglyphNativeTextEntry(
          text: $text,
          configuration: .init(
            label: title, placeholder: placeholder, isSecure: false, purpose: nil,
            isDisabled: isDisabled || isLoading, isReadOnly: isReadOnly, palette: palette,
            hint: aurelglyphFieldHint(isReadOnly: isReadOnly, isRequired: isRequired,
              isInvalid: isInvalid || error != nil, isLoading: isLoading,
              helpText: helpText, error: error, unitDescription: unitDescription, copy: copy),
            focusRequest: focusRequest, onFocusChange: { focused = $0 }
          )
        )
        .frame(minWidth: 72, minHeight: 44)
        .layoutPriority(1)
        trailing
      }
      .font(AurelglyphTypography.body)
      .foregroundStyle(palette.foreground)
      .padding(.horizontal, 12)
      .background(palette.surfaceMuted, in: RoundedRectangle(cornerRadius: theme.boxCornerRadius))
      .overlay {
        RoundedRectangle(cornerRadius: theme.boxCornerRadius)
          .stroke(isInvalid || error != nil ? palette.danger : (focused ? palette.focus : palette.borderStrong), lineWidth: 1)
      }
      .opacity(isDisabled ? 0.52 : 1)
      AurelglyphFieldMessage(helpText: helpText, error: error, palette: palette)
    }
  }
}

public extension AurelglyphInputGroup where Leading == AnyView, Trailing == AnyView {
  init(
    _ title: String,
    text: Binding<String>,
    prefix: String = "",
    suffix: String = "",
    placeholder: String = "",
    isDisabled: Bool = false,
    isReadOnly: Bool = false,
    isLoading: Bool = false,
    isRequired: Bool = false,
    isInvalid: Bool = false,
    helpText: String? = nil,
    error: String? = nil,
    unitDescription: String? = nil,
    focusRequest: Int? = nil
  ) {
    self.init(title, text: text, placeholder: placeholder, isDisabled: isDisabled,
      isReadOnly: isReadOnly, isLoading: isLoading, isRequired: isRequired,
      isInvalid: isInvalid, helpText: helpText, error: error,
      unitDescription: unitDescription, focusRequest: focusRequest,
      leading: { AnyView(Text(prefix).accessibilityHidden(true)) },
      trailing: { AnyView(Text(suffix).accessibilityHidden(true)) })
  }
}

public struct AurelglyphValidationIssue: Identifiable {
  public let id: String
  public let message: String
  public let onActivate: (() -> Void)?

  public init(id: String, message: String, onActivate: (() -> Void)? = nil) {
    self.id = id
    self.message = message
    self.onActivate = onActivate
  }
}

/// Declarative errors. Increment focusRequest after a failed submit to focus once.
public struct AurelglyphValidationSummary: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var copy
  @AccessibilityFocusState private var headingFocused: Bool
  @State private var lastFocusRequest: Int?
  private let title: String?
  private let issues: [AurelglyphValidationIssue]
  private let focusRequest: Int?

  public init(_ title: String? = nil, issues: [AurelglyphValidationIssue], focusRequest: Int? = nil) {
    precondition(Set(issues.map(\.id)).count == issues.count, "Validation issue IDs must be unique")
    self.title = title
    self.issues = issues
    self.focusRequest = focusRequest
  }

  public var body: some View {
    if !issues.isEmpty {
      let palette = theme.palette(for: colorScheme)
      VStack(alignment: .leading, spacing: 8) {
        Text(title ?? copy.validationSummary)
          .font(AurelglyphTypography.headline)
          .foregroundStyle(palette.danger)
          .accessibilityAddTraits(.isHeader)
          .accessibilityValue(copy.validationCount(issues.count))
          .accessibilityFocused($headingFocused)
        ForEach(issues) { issue in
          if let activate = issue.onActivate {
            Button(action: activate) {
              Text(issue.message).underline()
                .frame(minWidth: 44, minHeight: 44, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .foregroundStyle(palette.foreground)
          } else {
            Text(issue.message).foregroundStyle(palette.foreground)
          }
        }
      }
      .font(AurelglyphTypography.body)
      .padding(16)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(palette.surface, in: RoundedRectangle(cornerRadius: theme.surfaceCornerRadius))
      .overlay {
        RoundedRectangle(cornerRadius: theme.surfaceCornerRadius).stroke(palette.danger, lineWidth: 1)
      }
      .accessibilityElement(children: .contain)
      .task(id: focusRequest) {
        guard let focusRequest, focusRequest != lastFocusRequest else { return }
        lastFocusRequest = focusRequest
        headingFocused = false
        await Task.yield()
        guard !Task.isCancelled else { return }
        headingFocused = true
      }
    }
  }
}

public enum AurelglyphAccordionMode: Sendable {
  case single
  case multiple
}

public struct AurelglyphAccordionItem: Identifiable {
  public let id: String
  public let title: String
  public let isDisabled: Bool
  let content: AnyView

  public init<Content: View>(id: String, title: String, isDisabled: Bool = false, @ViewBuilder content: () -> Content) {
    self.id = id
    self.title = title
    self.isDisabled = isDisabled
    self.content = AnyView(content())
  }
}

/// Grouped disclosures with optional caller-owned expansion state.
public struct AurelglyphAccordion: View {
  @State private var localOpenIDs: Set<String>
  private let items: [AurelglyphAccordionItem]
  private let openIDs: Binding<Set<String>>?
  private let mode: AurelglyphAccordionMode
  private let headingLevel: AccessibilityHeadingLevel
  private let onOpenChange: ((Set<String>) -> Void)?

  public init(
    items: [AurelglyphAccordionItem],
    openIDs: Binding<Set<String>>? = nil,
    defaultOpenIDs: Set<String> = [],
    mode: AurelglyphAccordionMode = .single,
    headingLevel: AccessibilityHeadingLevel = .h3,
    onOpenChange: ((Set<String>) -> Void)? = nil
  ) {
    precondition(Set(items.map(\.id)).count == items.count, "Accordion item IDs must be unique")
    self.items = items
    self.openIDs = openIDs
    self._localOpenIDs = State(initialValue: defaultOpenIDs)
    self.mode = mode
    self.headingLevel = headingLevel
    self.onOpenChange = onOpenChange
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      ForEach(items) { item in
        AurelglyphExpandableSection(item.title, isExpanded: expansion(for: item),
          isDisabled: item.isDisabled, isHeading: true, headingLevel: headingLevel) { item.content }
      }
    }
  }

  private var resolvedOpenIDs: Set<String> {
    Self.normalizedOpenIDs(openIDs?.wrappedValue ?? localOpenIDs, items: items, mode: mode)
  }

  private func expansion(for item: AurelglyphAccordionItem) -> Binding<Bool> {
    Binding(get: { resolvedOpenIDs.contains(item.id) }, set: { expanded in
      guard !item.isDisabled else { return }
      let next = Self.changingOpenIDs(resolvedOpenIDs, id: item.id, expanded: expanded, mode: mode)
      guard next != resolvedOpenIDs else { return }
      if let openIDs { openIDs.wrappedValue = next } else { localOpenIDs = next }
      onOpenChange?(next)
    })
  }

  static func normalizedOpenIDs(_ proposed: Set<String>, items: [AurelglyphAccordionItem], mode: AurelglyphAccordionMode) -> Set<String> {
    let ordered = items.map(\.id).filter { proposed.contains($0) }
    return mode == .single ? Set(ordered.prefix(1)) : Set(ordered)
  }

  static func changingOpenIDs(_ current: Set<String>, id: String, expanded: Bool, mode: AurelglyphAccordionMode) -> Set<String> {
    if expanded { return mode == .single ? [id] : current.union([id]) }
    return current.subtracting([id])
  }
}

public enum AurelglyphStepStatus: String, Sendable {
  case current
  case completed
  case upcoming
  case error
  case disabled

  func label(copy: AurelglyphControlCopy) -> String {
    switch self {
    case .current: copy.currentStep
    case .completed: copy.completedStep
    case .upcoming: copy.upcomingStep
    case .error: copy.errorStep
    case .disabled: copy.disabledStep
    }
  }
}

public struct AurelglyphStep: Identifiable {
  public let id: String
  public let title: String
  public let status: AurelglyphStepStatus?
  public let isDisabled: Bool

  public init(id: String, title: String, status: AurelglyphStepStatus? = nil, isDisabled: Bool = false) {
    self.id = id
    self.title = title
    self.status = status
    self.isDisabled = isDisabled
  }
}

/// An ordered status display, not a router or workflow engine.
public struct AurelglyphStepper: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var copy
  @Environment(\.dynamicTypeSize) private var dynamicTypeSize
  @ScaledMetric(relativeTo: .subheadline) private var indicatorSize: CGFloat = 28
  private let title: String
  private let items: [AurelglyphStep]
  private let currentID: String?
  private let onStepChange: ((String) -> Void)?

  public init(_ title: String, items: [AurelglyphStep], currentID: String? = nil, onStepChange: ((String) -> Void)? = nil) {
    precondition(Set(items.map(\.id)).count == items.count, "Stepper item IDs must be unique")
    self.title = title
    self.items = items
    self.currentID = currentID
    self.onStepChange = onStepChange
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    AurelglyphAdaptiveLayout(
      primary: AnyLayout(HStackLayout(alignment: .top, spacing: 12)),
      fallback: AnyLayout(VStackLayout(alignment: .leading, spacing: 8)),
      fittingAxis: .horizontal,
      forceFallback: AurelglyphResponsiveLayout.prefersStackedLayout(for: dynamicTypeSize)
    ) {
      ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
        let status = Self.status(for: item, items: items, currentID: currentID)
        let isCurrent = Self.isCurrent(item, items: items, currentID: currentID)
        let state = [isCurrent && status != .current ? copy.currentStep : nil,
          status.label(copy: copy), item.isDisabled ? copy.disabledStep : nil]
          .compactMap { $0 }.joined(separator: " · ")
        let value = copy.stepValue(index + 1, items.count, item.title, state)
        if let onStepChange, !item.isDisabled, status != .disabled {
          Button { onStepChange(item.id) } label: { row(item, index: index, status: status, isCurrent: isCurrent, state: state, palette: palette) }
            .buttonStyle(.plain)
            .accessibilityLabel(value)
            .accessibilityAddTraits(isCurrent ? .isSelected : [])
        } else {
          row(item, index: index, status: status, isCurrent: isCurrent, state: state, palette: palette)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(value)
            .accessibilityValue(item.isDisabled ? copy.unavailable : "")
            .accessibilityAddTraits(isCurrent ? .isSelected : [])
            .disabled(item.isDisabled || status == .disabled)
        }
      }
    }
    .accessibilityElement(children: .contain)
    .accessibilityLabel(title)
  }

  private func row(_ item: AurelglyphStep, index: Int, status: AurelglyphStepStatus, isCurrent: Bool, state: String, palette: AurelglyphPalette) -> some View {
    HStack(spacing: 8) {
      Group {
        switch status {
        case .completed: Image(systemName: "checkmark")
        case .error: Image(systemName: "exclamationmark")
        case .disabled: Image(systemName: "minus")
        default: Text(String(index + 1))
        }
      }
      .font(AurelglyphTypography.label)
      .frame(width: indicatorSize, height: indicatorSize)
      .foregroundStyle(status == .error ? palette.danger : palette.foreground)
      .background(isCurrent ? palette.accent.opacity(0.12) : palette.surfaceMuted,
        in: RoundedRectangle(cornerRadius: theme.boxCornerRadius))
      .overlay {
        RoundedRectangle(cornerRadius: theme.boxCornerRadius)
          .stroke(status == .error ? palette.danger : (isCurrent ? palette.focus : palette.borderStrong), lineWidth: 1)
      }
      .accessibilityHidden(true)
      VStack(alignment: .leading, spacing: 2) {
        Text(item.title).font(AurelglyphTypography.body).foregroundStyle(palette.foreground)
        Text(state).font(AurelglyphTypography.caption).foregroundStyle(palette.muted)
      }
    }
    .frame(minHeight: 44, alignment: .leading)
    .contentShape(Rectangle())
    .opacity(item.isDisabled || status == .disabled ? 0.52 : 1)
  }

  static func status(for item: AurelglyphStep, items: [AurelglyphStep], currentID: String?) -> AurelglyphStepStatus {
    if let status = item.status {
      return status == .current && !isCurrent(item, items: items, currentID: currentID) ? .upcoming : status
    }
    if isCurrent(item, items: items, currentID: currentID) { return .current }
    let resolvedCurrent = currentID ?? items.first(where: { $0.status == .current })?.id
    if let currentIndex = items.firstIndex(where: { $0.id == resolvedCurrent }),
       let itemIndex = items.firstIndex(where: { $0.id == item.id }), itemIndex < currentIndex { return .completed }
    return .upcoming
  }

  static func isCurrent(_ item: AurelglyphStep, items: [AurelglyphStep], currentID: String?) -> Bool {
    item.id == (currentID ?? items.first(where: { $0.status == .current })?.id)
  }
}

/// Whole-number choice with direct touch, keyboard, and adjustable accessibility.
public struct AurelglyphRating: View {
  @Environment(\.aurelglyphTheme) private var theme
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.aurelglyphControlCopy) private var copy
  @Environment(\.layoutDirection) private var layoutDirection
  @ScaledMetric(relativeTo: .body) private var scaledStarSize: CGFloat = 22
  @FocusState private var keyboardFocused: Bool
  @State private var localValue: Int
  private let title: String
  private let value: Binding<Int>?
  private let maximum: Int
  private let isDisabled: Bool
  private let isReadOnly: Bool
  private let isLoading: Bool
  private let isRequired: Bool
  private let isInvalid: Bool
  private let error: String?
  private let allowsClear: Bool
  private let onValueChange: ((Int) -> Void)?

  public init(
    _ title: String,
    value: Binding<Int>? = nil,
    defaultValue: Int = 0,
    maximum: Int = 5,
    isDisabled: Bool = false,
    isReadOnly: Bool = false,
    isLoading: Bool = false,
    isRequired: Bool = false,
    isInvalid: Bool = false,
    error: String? = nil,
    allowsClear: Bool = true,
    onValueChange: ((Int) -> Void)? = nil
  ) {
    self.title = title
    self.value = value
    self._localValue = State(initialValue: defaultValue)
    self.maximum = Self.normalizedMaximum(maximum)
    self.isDisabled = isDisabled
    self.isReadOnly = isReadOnly
    self.isLoading = isLoading
    self.isRequired = isRequired
    self.isInvalid = isInvalid
    self.error = error
    self.allowsClear = allowsClear
    self.onValueChange = onValueChange
  }

  public var body: some View {
    let palette = theme.palette(for: colorScheme)
    VStack(alignment: .leading, spacing: 7) {
      Text(title).font(AurelglyphTypography.label).foregroundStyle(palette.foreground)
        .accessibilityHidden(true)
      if locked {
        stars(palette: palette)
          .accessibilityElement(children: .ignore)
          .accessibilityLabel(title)
          .accessibilityValue(copy.ratingValue(resolvedValue, maximum))
          .accessibilityHint(hint)
      } else {
        stars(palette: palette)
          .accessibilityElement(children: .ignore)
          .accessibilityLabel(title)
          .accessibilityValue(copy.ratingValue(resolvedValue, maximum))
          .accessibilityHint(hint)
          .focusable()
          .focused($keyboardFocused)
          .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: change(Self.adjusted(resolvedValue, direction: 1, maximum: maximum, isRequired: isRequired))
            case .decrement: change(Self.adjusted(resolvedValue, direction: -1, maximum: maximum, isRequired: isRequired))
            @unknown default: break
            }
          }
          .onKeyPress(.rightArrow) { change(Self.adjusted(resolvedValue, direction: layoutDirection == .rightToLeft ? -1 : 1,
            maximum: maximum, isRequired: isRequired)); return .handled }
          .onKeyPress(.leftArrow) { change(Self.adjusted(resolvedValue, direction: layoutDirection == .rightToLeft ? 1 : -1,
            maximum: maximum, isRequired: isRequired)); return .handled }
          .onKeyPress(.upArrow) { change(Self.adjusted(resolvedValue, direction: -1, maximum: maximum, isRequired: isRequired)); return .handled }
          .onKeyPress(.downArrow) { change(Self.adjusted(resolvedValue, direction: 1, maximum: maximum, isRequired: isRequired)); return .handled }
          .onKeyPress(.home) { change(1); return .handled }
          .onKeyPress(.end) { change(maximum); return .handled }
      }
      if allowsClear && !isRequired && !isReadOnly {
        Button(copy.clearRating) { change(0) }
          .font(AurelglyphTypography.body)
          .frame(minWidth: 44, minHeight: 44)
          .buttonStyle(.plain)
          .foregroundStyle(palette.foreground)
          .disabled(locked || resolvedValue == 0)
      }
      if isInvalid || error != nil {
        HStack(spacing: 6) {
          Image(systemName: "exclamationmark.triangle").accessibilityHidden(true)
          Text(error ?? copy.invalid)
        }
        .font(AurelglyphTypography.caption)
        .foregroundStyle(palette.danger)
        .accessibilityHidden(true) // The adjustable/native field reads its hint once.
      }
    }
    .disabled(isDisabled || isLoading)
    .opacity(isDisabled ? 0.52 : 1)
  }

  private func stars(palette: AurelglyphPalette) -> some View {
    ViewThatFits(in: .horizontal) {
      HStack(spacing: 0) { starButtons(palette: palette) }
      LazyVGrid(columns: [GridItem(.adaptive(minimum: starDimension), spacing: 0)], alignment: .leading, spacing: 0) {
        starButtons(palette: palette)
      }
    }
    .overlay {
      RoundedRectangle(cornerRadius: theme.boxCornerRadius)
        .stroke(isInvalid || error != nil ? palette.danger : Color.clear, lineWidth: 1)
    }
    .overlay {
      RoundedRectangle(cornerRadius: theme.boxCornerRadius + 2)
        .stroke(keyboardFocused ? palette.focus : Color.clear, lineWidth: 2)
        .padding(-2)
    }
  }

  @ViewBuilder private func starButtons(palette: AurelglyphPalette) -> some View {
    ForEach(1...maximum, id: \.self) { score in
      if locked {
        star(score: score, palette: palette)
      } else {
        Button { change(score) } label: { star(score: score, palette: palette) }
          .buttonStyle(.plain)
          .focusable(false)
          .accessibilityLabel(copy.ratingChoice(score, maximum))
          .accessibilityAddTraits(score == resolvedValue ? .isSelected : [])
      }
    }
  }

  private func star(score: Int, palette: AurelglyphPalette) -> some View {
    Image(systemName: score <= resolvedValue ? "star.fill" : "star")
      .font(AurelglyphTypography.ui(size: 22))
      .foregroundStyle(locked ? palette.muted : (score <= resolvedValue ? palette.accent : palette.foreground))
      .frame(width: starDimension, height: starDimension)
      .contentShape(Rectangle())
  }

  private var resolvedValue: Int { Self.normalizedValue(value?.wrappedValue ?? localValue, maximum: maximum) }
  private var starDimension: CGFloat { max(44, scaledStarSize + 8) }
  private var locked: Bool { isDisabled || isReadOnly || isLoading }
  private var hint: String {
    aurelglyphFieldHint(isReadOnly: isReadOnly, isRequired: isRequired, isInvalid: isInvalid || error != nil,
      isLoading: isLoading, helpText: nil, error: error, unitDescription: nil, copy: copy)
  }
  private func change(_ proposed: Int) {
    let next = Self.normalizedValue(proposed, maximum: maximum)
    guard !locked, (!isRequired || next > 0), next != resolvedValue else { return }
    if let value { value.wrappedValue = next } else { localValue = next }
    onValueChange?(next)
  }
  static func normalizedMaximum(_ proposed: Int) -> Int { min(max(proposed, 1), 20) }
  static func normalizedValue(_ proposed: Int, maximum: Int) -> Int { min(max(proposed, 0), normalizedMaximum(maximum)) }
  static func adjusted(_ proposed: Int, direction: Int, maximum: Int, isRequired: Bool) -> Int {
    let value = normalizedValue(proposed, maximum: maximum)
    if isRequired && value == 0 && direction < 0 { return 0 }
    return min(max(value + (direction < 0 ? -1 : 1), isRequired ? 1 : 0), normalizedMaximum(maximum))
  }
}

private struct AurelglyphFieldLabel: View {
  let title: String
  let palette: AurelglyphPalette
  var body: some View {
    Text(title).font(AurelglyphTypography.label).foregroundStyle(palette.foreground).accessibilityHidden(true)
  }
}

private struct AurelglyphFieldMessage: View {
  let helpText: String?
  let error: String?
  let palette: AurelglyphPalette
  var body: some View {
    if let message = error ?? helpText {
      Text(message).font(AurelglyphTypography.caption)
        .foregroundStyle(error != nil ? palette.danger : palette.muted)
        .accessibilityHidden(true) // The owned field reads this once as its hint.
    }
  }
}

func aurelglyphFieldHint(
  isReadOnly: Bool, isRequired: Bool, isInvalid: Bool, isLoading: Bool,
  helpText: String?, error: String?, unitDescription: String?, copy: AurelglyphControlCopy
) -> String {
  var parts: [String] = []
  if isReadOnly { parts.append(copy.readOnly) }
  if isRequired { parts.append(copy.required) }
  if isInvalid { parts.append(copy.invalid) }
  if isLoading { parts.append(copy.loading) }
  if let unitDescription, !unitDescription.isEmpty { parts.append(unitDescription) }
  if let message = error ?? helpText, !message.isEmpty { parts.append(message) }
  return parts.joined(separator: ". ")
}

struct AurelglyphEntryConfiguration {
  let label: String
  let placeholder: String
  let isSecure: Bool
  let purpose: AurelglyphPasswordPurpose?
  let isDisabled: Bool
  let isReadOnly: Bool
  let palette: AurelglyphPalette
  let hint: String
  let focusRequest: Int?
  let onFocusChange: (Bool) -> Void
}

func aurelglyphClampedSelection(_ range: NSRange, text: String) -> NSRange {
  let count = text.utf16.count
  let location = min(max(range.location == NSNotFound ? count : range.location, 0), count)
  return NSRange(location: location, length: min(max(range.length, 0), count - location))
}
