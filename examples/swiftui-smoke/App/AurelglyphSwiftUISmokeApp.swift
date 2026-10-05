import AurelglyphUI
import Foundation
import SwiftUI

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
  private let controlCopy: AurelglyphControlCopy

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
    controlCopy = configuration.usesLocalizedControlCopy
      ? AurelglyphControlCopy(
          collapsed: "Replié",
          expanded: "Déplié",
          showOptions: "Afficher les options",
          chooseOption: "Choisir une option",
          noOptions: "Aucune option disponible",
          noActions: "Aucune action disponible",
          optionsLabel: { "Options : \($0)" }
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
        themeControls
        releaseControls
        formControls
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
          Text("Telemetry is optional. Local runs on-device; Staging targets the shared release candidate.")
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

  private var modeTitle: String {
    colorMode == "dark" ? "Dark" : "Light"
  }

  private var appearanceTitle: String {
    appearance == "atelier" ? "Atelier" : "Quiet"
  }
}

private struct SwiftUISmokeLaunchConfiguration {
  let colorMode: String
  let appearance: String
  let showsDialog: Bool
  let usesLocalizedControlCopy: Bool

  static var current: SwiftUISmokeLaunchConfiguration {
    let arguments = ProcessInfo.processInfo.arguments
    return SwiftUISmokeLaunchConfiguration(
      colorMode: value(after: "-aurelglyph-mode", in: arguments, allowed: ["light", "dark"]) ?? "light",
      appearance: value(after: "-aurelglyph-appearance", in: arguments, allowed: ["quiet", "atelier"]) ?? "quiet",
      showsDialog: arguments.contains("-aurelglyph-show-dialog"),
      usesLocalizedControlCopy: arguments.contains("-aurelglyph-localized-control-copy")
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
