import SwiftUI

#if canImport(UIKit) && !os(watchOS)
import UIKit

/// A persistent UIKit field avoids losing selection when secure entry changes.
struct AurelglyphNativeTextEntry: UIViewRepresentable {
  @Binding var text: String
  let configuration: AurelglyphEntryConfiguration

  func makeCoordinator() -> Coordinator { Coordinator(self) }

  func makeUIView(context: Context) -> UITextField {
    let field = UITextField()
    field.borderStyle = .none
    field.delegate = context.coordinator
    field.addTarget(context.coordinator, action: #selector(Coordinator.changed(_:)), for: .editingChanged)
    field.setContentHuggingPriority(.defaultLow, for: .horizontal)
    field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    field.adjustsFontForContentSizeCategory = true
    field.returnKeyType = .done
    field.clearsOnBeginEditing = false
    return field
  }

  func updateUIView(_ field: UITextField, context: Context) {
    context.coordinator.parent = self
    let selection = field.selectedTextRange.map {
      NSRange(location: field.offset(from: field.beginningOfDocument, to: $0.start),
        length: field.offset(from: $0.start, to: $0.end))
    }
    let wasFocused = field.isFirstResponder
    let secureChanged = field.isSecureTextEntry != configuration.isSecure
    let textChanged = field.text != text
    field.placeholder = configuration.placeholder
    field.isEnabled = !configuration.isDisabled
    field.textColor = UIColor(configuration.palette.foreground)
    field.tintColor = UIColor(configuration.palette.focus)
    let baseFont = UIFont(name: "AtkinsonHyperlegible-Regular", size: 17) ?? UIFont.systemFont(ofSize: 17)
    field.font = UIFontMetrics(forTextStyle: .body).scaledFont(for: baseFont)
    field.attributedPlaceholder = NSAttributedString(string: configuration.placeholder,
      attributes: [.foregroundColor: UIColor(configuration.palette.muted)])
    field.accessibilityLabel = configuration.label
    field.accessibilityHint = configuration.hint
    field.autocorrectionType = configuration.purpose == nil ? .default : .no
    field.autocapitalizationType = configuration.purpose == nil ? .sentences : .none
    field.spellCheckingType = configuration.purpose == nil ? .default : .no
    if configuration.isReadOnly && field.inputView == nil {
      field.inputView = UIView(frame: .zero)
      if field.isFirstResponder { field.reloadInputViews() }
    } else if !configuration.isReadOnly && field.inputView != nil {
      field.inputView = nil
      if field.isFirstResponder { field.reloadInputViews() }
    }
    switch configuration.purpose {
    case .password: field.textContentType = .password
    case .newPassword: field.textContentType = .newPassword
    case nil: field.textContentType = nil
    }
    if secureChanged || textChanged { context.coordinator.restorationGeneration += 1 }
    if secureChanged {
      field.isSecureTextEntry = configuration.isSecure
      context.coordinator.restoreTextStorage(in: field, value: text, selection: wasFocused ? selection : nil)
      if wasFocused {
        let expectedValue = text
        let expectedSecure = configuration.isSecure
        let generation = context.coordinator.restorationGeneration
        // Secure UIKit editors can retain a stale insertion buffer even when
        // the visible value, selection, and public clear flag are correct.
        // Rebuild native editing storage once after the trait transition settles.
        DispatchQueue.main.async { [weak field, weak coordinator = context.coordinator] in
          guard let field, let coordinator,
            coordinator.restorationGeneration == generation,
            field.isFirstResponder, field.isSecureTextEntry == expectedSecure,
            !coordinator.parent.configuration.isDisabled,
            coordinator.parent.text == expectedValue, field.text == expectedValue else { return }
          coordinator.restoreTextStorage(in: field, value: expectedValue, selection: selection)
        }
      }
    } else if textChanged {
      field.text = text
      if wasFocused { Coordinator.restoreSelection(in: field, range: selection, value: text) }
    }
    // UIKit can enable replacement-on-insertion when secure entry is toggled
    // while editing. Keep typing at the restored caret instead of erasing value.
    field.clearsOnInsertion = false
    if let request = configuration.focusRequest, request != context.coordinator.lastFocusRequest,
       !configuration.isDisabled {
      context.coordinator.lastFocusRequest = request
      DispatchQueue.main.async { [weak field] in field?.becomeFirstResponder() }
    }
  }

  func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextField, context: Context) -> CGSize? {
    CGSize(width: proposal.width ?? 160,
      height: max(44, (uiView.font?.lineHeight ?? 20) + 12))
  }

  final class Coordinator: NSObject, UITextFieldDelegate {
    var parent: AurelglyphNativeTextEntry
    var lastFocusRequest: Int?
    var restorationGeneration = 0
    private var isRestoringTextStorage = false
    init(_ parent: AurelglyphNativeTextEntry) { self.parent = parent }
    @objc func changed(_ field: UITextField) {
      guard !isRestoringTextStorage else { return }
      restorationGeneration += 1
      guard !parent.configuration.isReadOnly, !parent.configuration.isDisabled else {
        field.text = parent.text
        return
      }
      parent.text = field.text ?? ""
    }
    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
      isRestoringTextStorage || (!parent.configuration.isReadOnly && !parent.configuration.isDisabled)
    }
    func textFieldDidBeginEditing(_ textField: UITextField) {
      DispatchQueue.main.async { self.parent.configuration.onFocusChange(true) }
    }
    func textFieldDidEndEditing(_ textField: UITextField) {
      restorationGeneration += 1
      DispatchQueue.main.async { self.parent.configuration.onFocusChange(false) }
    }
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
      textField.resignFirstResponder()
      return true
    }

    func restoreTextStorage(in field: UITextField, value: String, selection: NSRange?) {
      isRestoringTextStorage = true
      defer { isRestoringTextStorage = false }
      if field.isFirstResponder, field.isSecureTextEntry {
        let undoManager = field.undoManager
        let restoresUndoRegistration = undoManager?.isUndoRegistrationEnabled == true
        if restoresUndoRegistration { undoManager?.disableUndoRegistration() }
        defer {
          // UIKit may itself reenable its manager during a trait transition.
          if restoresUndoRegistration, undoManager?.isUndoRegistrationEnabled == false {
            undoManager?.enableUndoRegistration()
          }
        }
        // Native insertion initializes UIKit's secure editing buffer; property
        // setters alone can leave it empty while showing the retained value.
        // Use native replacement to avoid property setters clearing undo state.
        if let entireValue = field.textRange(from: field.beginningOfDocument, to: field.endOfDocument) {
          field.replace(entireValue, withText: "")
        }
        field.clearsOnInsertion = false
        if !value.isEmpty { field.insertText(value) }
      } else if field.text != value {
        field.text = value
      }
      field.clearsOnInsertion = false
      Self.restoreSelection(in: field, range: selection, value: value)
    }

    static func restoreSelection(in field: UITextField, range: NSRange?, value: String) {
      guard let range else { return }
      let bounded = aurelglyphClampedSelection(range, text: value)
      if let start = field.position(from: field.beginningOfDocument, offset: bounded.location),
         let end = field.position(from: start, offset: bounded.length) {
        field.selectedTextRange = field.textRange(from: start, to: end)
      }
    }
  }

  static func dismantleUIView(_ field: UITextField, coordinator: Coordinator) {
    coordinator.restorationGeneration += 1
  }
}

#elseif canImport(AppKit)
import AppKit

/// Native secure/plain editors share the binding and transfer their caret range.
struct AurelglyphNativeTextEntry: NSViewRepresentable {
  @Binding var text: String
  let configuration: AurelglyphEntryConfiguration

  func makeCoordinator() -> Coordinator { Coordinator(self) }

  func makeNSView(context: Context) -> EntryView {
    let view = EntryView()
    view.plain.delegate = context.coordinator
    view.secure.delegate = context.coordinator
    return view
  }

  func updateNSView(_ view: EntryView, context: Context) {
    context.coordinator.parent = self
    let previous = view.current
    let next: NSTextField = configuration.isSecure ? view.secure : view.plain
    let editor = previous.currentEditor() as? NSTextView
    let wasFocused = editor != nil
    let textChanged = previous.stringValue != text
    let selection = editor?.selectedRange() ?? context.coordinator.lastSelection
    if previous !== next, wasFocused {
      view.window?.makeFirstResponder(nil)
    }
    for field in [view.plain, view.secure] {
      if field.stringValue != text { field.stringValue = text }
      field.isEnabled = !configuration.isDisabled
      field.isEditable = !configuration.isDisabled && !configuration.isReadOnly
      field.isSelectable = !configuration.isDisabled
      field.placeholderString = configuration.placeholder
      field.textColor = NSColor(configuration.palette.foreground)
      field.font = NSFont(name: "AtkinsonHyperlegible-Regular", size: 17) ?? NSFont.systemFont(ofSize: 17)
      field.placeholderAttributedString = NSAttributedString(string: configuration.placeholder,
        attributes: [.foregroundColor: NSColor(configuration.palette.muted)])
      field.setAccessibilityLabel(configuration.label)
      field.setAccessibilityHelp(configuration.hint)
      switch configuration.purpose {
      case .password: field.contentType = .password
      case .newPassword: field.contentType = .newPassword
      case nil: field.contentType = nil
      }
      field.isHidden = field !== next
    }
    view.current = next
    if previous !== next, wasFocused, !configuration.isDisabled {
      view.window?.makeFirstResponder(next)
      (next.currentEditor() as? NSTextView)?.setSelectedRange(aurelglyphClampedSelection(selection, text: text))
    } else if wasFocused, previous === next, textChanged {
      (next.currentEditor() as? NSTextView)?.setSelectedRange(aurelglyphClampedSelection(selection, text: text))
    }
    if let request = configuration.focusRequest, request != context.coordinator.lastFocusRequest,
       !configuration.isDisabled {
      context.coordinator.lastFocusRequest = request
      DispatchQueue.main.async { [weak next] in
        guard let next else { return }
        next.window?.makeFirstResponder(next)
      }
    }
  }

  func sizeThatFits(_ proposal: ProposedViewSize, nsView: EntryView, context: Context) -> CGSize? {
    CGSize(width: proposal.width ?? 160,
      height: max(44, nsView.current.intrinsicContentSize.height + 12))
  }

  final class EntryView: NSView {
    let plain = NSTextField()
    let secure = NSSecureTextField()
    var current: NSTextField
    override init(frame frameRect: NSRect) {
      current = plain
      super.init(frame: frameRect)
      for field in [plain, secure] {
        field.isBordered = false
        field.drawsBackground = false
        field.focusRingType = .none
        field.translatesAutoresizingMaskIntoConstraints = false
        field.setContentHuggingPriority(.defaultLow, for: .horizontal)
        field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        addSubview(field)
        NSLayoutConstraint.activate([
          field.leadingAnchor.constraint(equalTo: leadingAnchor),
          field.trailingAnchor.constraint(equalTo: trailingAnchor),
          field.centerYAnchor.constraint(equalTo: centerYAnchor)
        ])
      }
      secure.isHidden = true
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) is unavailable") }
  }

  final class Coordinator: NSObject, NSTextFieldDelegate {
    var parent: AurelglyphNativeTextEntry
    var lastFocusRequest: Int?
    var lastSelection = NSRange(location: 0, length: 0)
    init(_ parent: AurelglyphNativeTextEntry) { self.parent = parent }
    func controlTextDidChange(_ notification: Notification) {
      guard let field = notification.object as? NSTextField,
        !parent.configuration.isReadOnly, !parent.configuration.isDisabled else { return }
      parent.text = field.stringValue
      if let editor = field.currentEditor() as? NSTextView { lastSelection = editor.selectedRange() }
    }
    func controlTextDidBeginEditing(_ notification: Notification) {
      DispatchQueue.main.async { self.parent.configuration.onFocusChange(true) }
    }
    func controlTextDidEndEditing(_ notification: Notification) {
      if let field = notification.object as? NSTextField, let editor = field.currentEditor() as? NSTextView {
        lastSelection = editor.selectedRange()
      }
      DispatchQueue.main.async { self.parent.configuration.onFocusChange(false) }
    }
  }
}

#else
// watchOS has no selectable UIKit/AppKit editor. Keep native secure entry and binding.
struct AurelglyphNativeTextEntry: View {
  @Binding var text: String
  let configuration: AurelglyphEntryConfiguration
  @FocusState private var focused: Bool

  var body: some View {
    Group {
      if configuration.isSecure { SecureField(configuration.placeholder, text: guardedText) }
      else { TextField(configuration.placeholder, text: guardedText) }
    }
    .font(AurelglyphTypography.body)
    .foregroundStyle(configuration.palette.foreground)
    .focused($focused)
    .disabled(configuration.isDisabled || configuration.isReadOnly)
    .accessibilityLabel(configuration.label)
    .accessibilityHint(configuration.hint)
    .onChange(of: focused) { _, next in configuration.onFocusChange(next) }
    .onChange(of: configuration.focusRequest) { _, request in
      if request != nil && !configuration.isDisabled { focused = true }
    }
  }

  private var guardedText: Binding<String> {
    Binding(get: { text }, set: {
      if !configuration.isDisabled && !configuration.isReadOnly { text = $0 }
    })
  }
}
#endif
