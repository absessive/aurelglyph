import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  private var undoControl: UIBarButtonItem?
  private var redoControl: UIBarButtonItem?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "AurelglyphSmoke",
      in: window,
      launchOptions: launchOptions
    )

    if ProcessInfo.processInfo.arguments.contains("--aurelglyph-native-undo") {
      installNativeEditingControls()
    }

    return true
  }

  // Private test instrumentation, not a package bridge or application feature.
  // Invoke the existing UIKit history without retargeting the focused input,
  // manufacturing history, directly setting text/selection, or changing traits.
  private func focusedTextField(in view: UIView) -> UITextField? {
    if let field = view as? UITextField, field.isFirstResponder { return field }
    for child in view.subviews {
      if let field = focusedTextField(in: child) { return field }
    }
    return nil
  }

  private func installNativeEditingControls() {
    guard let window else { return }
    let toolbar = UIToolbar()
    toolbar.accessibilityIdentifier = "aurelglyph-native-editing-toolbar"
    toolbar.translatesAutoresizingMaskIntoConstraints = false
    let undo = UIBarButtonItem(title: "Undo", style: .plain, target: self, action: #selector(undoNativeEdit))
    undo.accessibilityLabel = "Native Undo"
    undo.accessibilityIdentifier = "aurelglyph-native-undo"
    let redo = UIBarButtonItem(title: "Redo", style: .plain, target: self, action: #selector(redoNativeEdit))
    redo.accessibilityLabel = "Native Redo"
    redo.accessibilityIdentifier = "aurelglyph-native-redo"
    undoControl = undo
    redoControl = redo
    toolbar.items = [undo, .flexibleSpace(), redo]
    window.addSubview(toolbar)
    NSLayoutConstraint.activate([
      toolbar.topAnchor.constraint(equalTo: window.safeAreaLayoutGuide.topAnchor, constant: 8),
      toolbar.trailingAnchor.constraint(equalTo: window.safeAreaLayoutGuide.trailingAnchor, constant: -16),
      toolbar.widthAnchor.constraint(equalToConstant: 160),
      toolbar.heightAnchor.constraint(equalToConstant: 44),
    ])
    for name in [UITextField.textDidBeginEditingNotification, UITextField.textDidEndEditingNotification, UITextField.textDidChangeNotification] {
      NotificationCenter.default.addObserver(self, selector: #selector(nativeEditingChanged), name: name, object: nil)
    }
    updateNativeEditingControls()
  }

  private func updateNativeEditingControls() {
    let manager = window.flatMap { focusedTextField(in: $0)?.undoManager }
    undoControl?.isEnabled = manager?.canUndo == true
    redoControl?.isEnabled = manager?.canRedo == true
  }

  @objc private func nativeEditingChanged(_ notification: Notification) {
    updateNativeEditingControls()
  }

  @objc private func undoNativeEdit() {
    if let manager = window.flatMap({ focusedTextField(in: $0)?.undoManager }), manager.canUndo { manager.undo() }
    updateNativeEditingControls()
  }

  @objc private func redoNativeEdit() {
    if let manager = window.flatMap({ focusedTextField(in: $0)?.undoManager }), manager.canRedo { manager.redo() }
    updateNativeEditingControls()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
