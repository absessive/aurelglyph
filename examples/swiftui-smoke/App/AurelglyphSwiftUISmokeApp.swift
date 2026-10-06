import AurelglyphUI
import Foundation
import SwiftUI
import UIKit

@main
struct AurelglyphSwiftUISmokeApp: App {
  init() {
    AurelglyphFontRegistry.registerFonts()
  }

  var body: some Scene {
    WindowGroup {
      NativeWorkbench()
    }
  }
}

private struct NativeWorkbench: View {
  @Environment(\.colorScheme) private var systemColorScheme
  @State private var colorMode: String
  @State private var appearance: String
  @State private var releaseChannel = "stable"
  @State private var showingDialog: Bool
  @State private var telemetryEnabled = true
  @State private var deploymentRegion = "local"
  @State private var signalStrength = 72.0
  @State private var retryCount = 2.0
  @State private var lastAction = "None"
  @State private var accessKey = ""
  @State private var amount = "240"
  @State private var localSelected = true
  @State private var chipRemoved = false
  @State private var openSections: Set<String> = ["network"]
  @State private var readiness = 3
  @State private var workflowCurrent = "review"
  @State private var summaryRequest: Int?
  @State private var passwordFocusRequest: Int?
  @State private var amountFocusRequest: Int?
  @State private var showsErrors = false
  @State private var entrySnapshot = "Not inspected"
  @State private var entryProbe = NativeEntryProbe()
  private let controlCopy: AurelglyphControlCopy
  private let usesLongInformation: Bool
  private let showsCatalogOnly: Bool

  private let modes = [
    AurelglyphSegmentedItem(id: "light", title: "Light"),
    AurelglyphSegmentedItem(id: "dark", title: "Dark")
  ]
  private let appearances = [
    AurelglyphSegmentedItem(id: "quiet", title: "Quiet"),
    AurelglyphSegmentedItem(id: "atelier", title: "Atelier")
  ]
  private let channels = [
    AurelglyphSegmentedItem(id: "stable", title: "Stable"),
    AurelglyphSegmentedItem(id: "nightly", title: "Nightly", isDisabled: true),
    AurelglyphSegmentedItem(id: "beta", title: "Beta")
  ]
  private let regions = [
    AurelglyphRadioItem(id: "local", title: "Local"),
    AurelglyphRadioItem(id: "staging", title: "Staging")
  ]

  init() {
    let configuration = SwiftUISmokeLaunchConfiguration.current
    _colorMode = State(initialValue: configuration.colorMode)
    _appearance = State(initialValue: configuration.appearance)
    _showingDialog = State(initialValue: configuration.showsDialog)
    usesLongInformation = configuration.usesLongInformation
    showsCatalogOnly = configuration.showsCatalogOnly
    controlCopy = configuration.usesLocalizedControlCopy
      ? AurelglyphControlCopy(
          collapsed: "Replié",
          expanded: "Déplié",
          showOptions: "Afficher les options",
          chooseOption: "Choisir une option",
          noOptions: "Aucune option disponible",
          noActions: "Aucune action disponible",
          optionsLabel: { "Options : \($0)" },
          showPassword: "Afficher le mot de passe",
          hidePassword: "Masquer le mot de passe",
          validationSummary: "Vérifier le formulaire",
          clearRating: "Effacer la note",
          removeLabel: { "Retirer : \($0)" },
          validationCount: { "Erreurs : \($0)" },
          ratingValue: { "\($0)/\($1)" },
          ratingChoice: { "Choisir \($0)/\($1)" }
        )
      : .standard
  }

  var body: some View {
    AurelglyphAppShell {
      AurelglyphTopBar("Native workbench") {
        AurelglyphAvatar("Ajit Chakrapani", initials: "AG")
      } actions: {
        Button("Review release") {
          showingDialog = true
        }
        .accessibilityIdentifier("dialog.open")
      }
    } content: {
      LazyVStack(alignment: .leading, spacing: 16) {
        if showsCatalogOnly {
          catalogControls
        } else {
          themeControls
          releaseControls
          formControls
          catalogControls
        }
      }
    } tabBar: {
      EmptyView()
    }
    .aurelglyphTheme(
      AurelglyphTheme(
        mode: colorMode == "dark" ? .dark : .light,
        accent: .royalPurple,
        appearance: appearance == "atelier" ? .atelier : .quiet
      )
    )
    .aurelglyphControlCopy(controlCopy)
    .aurelglyphDialog(
      isPresented: $showingDialog,
      title: "Publish release?",
      message: "Confirm the native package contract before distribution."
    ) {
      Text("The smoke host exercises a real application target linked to the root Swift package.")
    } actions: {
      Button("Cancel", role: .cancel) {
        showingDialog = false
      }
      Button("Publish") {
        lastAction = "Release approved"
        showingDialog = false
      }
    }
  }

  private var themeControls: some View {
    AurelglyphCard(title: "Appearance") {
      VStack(alignment: .leading, spacing: 12) {
        Text("Color mode")
          .font(AurelglyphTypography.monoLabel)
          .accessibilityAddTraits(.isHeader)
        AurelglyphSegmentedControl(items: modes, selection: $colorMode)

        Text("Surface language")
          .font(AurelglyphTypography.monoLabel)
          .accessibilityAddTraits(.isHeader)
        AurelglyphSegmentedControl(items: appearances, selection: $appearance)

        Text("\(modeTitle) · \(appearanceTitle)")
          .font(AurelglyphTypography.caption)
          .accessibilityIdentifier("theme.current")
          .accessibilityValue(systemColorScheme == .dark ? "Dark color scheme" : "Light color scheme")
      }
    }
  }

  private var releaseControls: some View {
    AurelglyphCard(title: "Release controls") {
      VStack(alignment: .leading, spacing: 12) {
        AurelglyphSelect(
          "Release channel",
          items: channels,
          selection: $releaseChannel
        )

        Text("Channel: \(channelTitle)")
          .font(AurelglyphTypography.caption)
          .accessibilityIdentifier("release.channel.value")

        AurelglyphMenu(
          "Operations",
          systemImage: "wrench.and.screwdriver",
          items: [
            AurelglyphMenuItem(id: "sync", title: "Sync now", systemImage: "arrow.triangle.2.circlepath") {
              lastAction = "Sync requested"
            },
            AurelglyphMenuItem(
              id: "approval",
              title: "Requires approval",
              systemImage: "lock",
              isDisabled: true
            ) {},
            AurelglyphMenuItem(id: "archive", title: "Archive draft", systemImage: "archivebox", isDestructive: true) {
              lastAction = "Draft archived"
            }
          ]
        )

        Text("Last action: \(lastAction)")
          .font(AurelglyphTypography.caption)
          .accessibilityIdentifier("operations.value")
      }
    }
  }

  private var formControls: some View {
    AurelglyphCard(title: "Form contract") {
      VStack(alignment: .leading, spacing: 14) {
        AurelglyphCheckbox(
          "Send anonymous telemetry",
          isChecked: $telemetryEnabled
        )
        AurelglyphRadioGroup(
          "Deployment region",
          items: regions,
          selection: $deploymentRegion
        )
        AurelglyphMoreInformation("Form details") {
          if usesLongInformation {
            VStack(alignment: .leading, spacing: 12) {
              ForEach(1...12, id: \.self) { step in
                Text("Release detail \(step): verify the calibrated native contract before distribution.")
                  .accessibilityIdentifier(step == 12 ? "form.more-information.last" : "form.more-information.detail.\(step)")
              }
            }
          } else {
            Text("Telemetry is optional. Local runs on-device; Staging targets the shared release candidate.")
          }
        }
        .accessibilityIdentifier("form.more-information")
        AurelglyphSlider(
          "Signal strength",
          value: $signalStrength,
          in: 0...100,
          step: 1,
          valueFormatter: { "\(Int($0)) percent" }
        )
        AurelglyphNumberField(
          "Retry count",
          value: $retryCount,
          in: 0...5,
          step: 1
        )
      }
    }
  }

  private var channelTitle: String {
    channels.first(where: { $0.id == releaseChannel })?.title ?? "Unknown"
  }

  private var catalogControls: some View {
    AurelglyphCard(title: "Catalog essentials") {
      VStack(alignment: .leading, spacing: 16) {
        AurelglyphLink("Documentation", destination: URL(string: "https://example.com"), isExternal: true)
        AurelglyphLink("Unavailable destination", destination: URL(string: "https://example.com"), isDisabled: true)
        if !chipRemoved {
          AurelglyphChip("Local", isSelected: $localSelected, onRemove: { chipRemoved = true })
        }
        Text(chipRemoved ? "Chip removed" : (localSelected ? "Local selected" : "Local not selected"))
          .font(AurelglyphTypography.caption)
          .accessibilityIdentifier("catalog.chip.value")
        AurelglyphPasswordField("Access key", text: $accessKey, purpose: .newPassword,
          isRequired: true, error: showsErrors ? "Enter an access key" : nil, focusRequest: passwordFocusRequest)
        if ProcessInfo.processInfo.arguments.contains("-aurelglyph-entry-diagnostics") {
          Button("Inspect entry") {
            if let field = nativeEntry() {
              entrySnapshot = NativeEntryProbe.snapshot(field)
              entryProbe.observeFirstEdit(in: field) { entrySnapshot = $0 }
            } else {
              entrySnapshot = "No native field"
            }
          }
            .frame(minHeight: 44)
            .accessibilityIdentifier("catalog.entry.inspect")
            .accessibilityValue(entrySnapshot)
        }
        AurelglyphInputGroup("Budget", text: $amount, prefix: "$", suffix: "USD",
          unitDescription: "US dollars", focusRequest: amountFocusRequest)
        Button("Validate") {
          showsErrors = true
          summaryRequest = (summaryRequest ?? 0) + 1
        }
        .frame(minHeight: 44)
        AurelglyphValidationSummary(issues: showsErrors ? [
          .init(id: "access-key", message: "Enter an access key", onActivate: {
            passwordFocusRequest = (passwordFocusRequest ?? 0) + 1
          }),
          .init(id: "budget", message: "Review the budget", onActivate: {
            amountFocusRequest = (amountFocusRequest ?? 0) + 1
          })
        ] : [], focusRequest: summaryRequest)
        AurelglyphAccordion(items: [
          .init(id: "network", title: "Network") { Text("Network settings").accessibilityIdentifier("catalog.network.content") },
          .init(id: "storage", title: "Storage") { Text("Storage settings").accessibilityIdentifier("catalog.storage.content") },
          .init(id: "locked", title: "Locked section", isDisabled: true) { Text("Locked settings") }
        ], openIDs: $openSections)
        AurelglyphStepper("Release workflow", items: [
          .init(id: "draft", title: "Draft", status: .completed),
          .init(id: "review", title: "Review", status: .current),
          .init(id: "verify", title: "Verify", status: .error),
          .init(id: "publish", title: "Publish", status: .disabled)
        ], currentID: workflowCurrent, onStepChange: { workflowCurrent = $0 })
        AurelglyphRating("Readiness", value: $readiness)
        Text("Rating: \(readiness)").font(AurelglyphTypography.caption).accessibilityIdentifier("catalog.rating.value")
        AurelglyphRating("Required readiness", defaultValue: 1, isRequired: true)
        AurelglyphRating("Read-only readiness", defaultValue: 3, isReadOnly: true)
      }
    }
  }

  private var modeTitle: String {
    colorMode == "dark" ? "Dark" : "Light"
  }

  private var appearanceTitle: String {
    appearance == "atelier" ? "Atelier" : "Quiet"
  }

  // Test-only public UIKit diagnostics. Never expose or log a password value.
  private func nativeEntry() -> UITextField? {
    func entry(in view: UIView) -> UITextField? {
      if let field = view as? UITextField, field.accessibilityLabel == "Access key" { return field }
      return view.subviews.lazy.compactMap { entry(in: $0) }.first
    }
    let windows = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap(\.windows)
    return windows.lazy.compactMap({ entry(in: $0) }).first
  }
}

/// Installed only by the diagnostic fixture; forwards the first edit unchanged.
private final class NativeEntryProbe: NSObject, UITextFieldDelegate {
  private weak var original: (any UITextFieldDelegate)?
  private var report: ((String) -> Void)?

  func observeFirstEdit(in field: UITextField, report: @escaping (String) -> Void) {
    original = field.delegate
    self.report = report
    field.delegate = self
  }

  static func snapshot(_ field: UITextField) -> String {
    let start = field.selectedTextRange.map { field.offset(from: field.beginningOfDocument, to: $0.start) } ?? -1
    let length = field.selectedTextRange.map { field.offset(from: $0.start, to: $0.end) } ?? -1
    return "length=\((field.text ?? "").utf16.count) selection=\(start):\(length) clears=\(field.clearsOnInsertion) focused=\(field.isFirstResponder) secure=\(field.isSecureTextEntry)"
  }

  func textField(_ field: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
    let diagnostic = "range=\(range.location):\(range.length) \(Self.snapshot(field))"
    let result = original?.textField?(field, shouldChangeCharactersIn: range, replacementString: string) ?? true
    field.delegate = original
    report?(diagnostic)
    report = nil
    return result
  }
}

private struct SwiftUISmokeLaunchConfiguration {
  let colorMode: String
  let appearance: String
  let showsDialog: Bool
  let usesLocalizedControlCopy: Bool
  let usesLongInformation: Bool
  let showsCatalogOnly: Bool

  static var current: SwiftUISmokeLaunchConfiguration {
    let arguments = ProcessInfo.processInfo.arguments
    return SwiftUISmokeLaunchConfiguration(
      colorMode: value(after: "-aurelglyph-mode", in: arguments, allowed: ["light", "dark"]) ?? "light",
      appearance: value(after: "-aurelglyph-appearance", in: arguments, allowed: ["quiet", "atelier"]) ?? "quiet",
      showsDialog: arguments.contains("-aurelglyph-show-dialog"),
      usesLocalizedControlCopy: arguments.contains("-aurelglyph-localized-control-copy"),
      usesLongInformation: arguments.contains("-aurelglyph-long-information"),
      showsCatalogOnly: arguments.contains("-aurelglyph-catalog")
    )
  }

  private static func value(after flag: String, in arguments: [String], allowed: Set<String>) -> String? {
    guard let index = arguments.firstIndex(of: flag), arguments.indices.contains(index + 1) else {
      return nil
    }
    let value = arguments[index + 1]
    return allowed.contains(value) ? value : nil
  }
}
