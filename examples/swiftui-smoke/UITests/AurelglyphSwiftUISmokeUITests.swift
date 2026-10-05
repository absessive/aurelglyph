import XCTest

@MainActor
final class AurelglyphSwiftUISmokeUITests: XCTestCase {
  private var app: XCUIApplication!

  override func setUpWithError() throws {
    continueAfterFailure = false
    XCUIDevice.shared.orientation = .portrait
    app = XCUIApplication()
  }

  override func tearDownWithError() throws {
    app.terminate()
    app = nil
    XCUIDevice.shared.orientation = .portrait
  }

  func testLaunchesRootPackageShowcase() {
    launch()

    XCTAssertTrue(app.staticTexts["Appearance"].exists)
    XCTAssertTrue(app.staticTexts["Release controls"].exists)
    XCTAssertTrue(app.staticTexts["Color mode"].exists)
    XCTAssertTrue(app.buttons["Release channel"].exists)
    XCTAssertTrue(app.buttons["Review release"].exists)
    XCTAssertEqual(app.staticTexts["theme.current"].label, "Light · Quiet")
  }

  func testDisabledRowsAndPresentationRecovery() {
    launch()

    let select = app.buttons["Release channel"]
    tapWhenHittable(select, message: "The release-channel trigger was not ready for interaction")

    let stable = app.buttons["Stable"]
    let nightly = app.buttons["Nightly"]
    let beta = app.buttons["Beta"]
    XCTAssertTrue(stable.waitForExistence(timeout: 5), "The current select option was not presented")
    XCTAssertTrue(nightly.exists)
    XCTAssertFalse(nightly.isEnabled)

    tapWhenHittable(beta, message: "The enabled Beta option was not ready for interaction")
    waitForLabel("Channel: Beta", on: app.staticTexts["release.channel.value"])

    XCTAssertTrue(waitForHittable(select), "The select trigger did not recover after choosing an option")
    select.tap()
    XCTAssertTrue(stable.waitForExistence(timeout: 5), "The recovered select trigger did not reopen its options")
    tapWhenHittable(stable, message: "The enabled Stable option was not ready for interaction")
    waitForLabel("Channel: Stable", on: app.staticTexts["release.channel.value"])

    let menu = app.buttons["Operations"]
    XCTAssertTrue(scrollUntilVisible(menu), "The Operations trigger was not reachable")
    tapWhenHittable(menu, message: "The Operations trigger was not ready for interaction")

    let sync = app.buttons["Sync now"]
    let requiresApproval = app.buttons["Requires approval"]
    let archive = app.buttons["Archive draft"]
    XCTAssertTrue(sync.waitForExistence(timeout: 5), "The first enabled menu action was not presented")
    XCTAssertTrue(requiresApproval.exists)
    XCTAssertFalse(requiresApproval.isEnabled)

    tapWhenHittable(archive, message: "The enabled Archive action was not ready for interaction")
    waitForLabel("Last action: Draft archived", on: app.staticTexts["operations.value"])

    XCTAssertTrue(waitForHittable(menu), "The menu trigger did not recover after running an action")
    menu.tap()
    XCTAssertTrue(sync.waitForExistence(timeout: 5), "The recovered menu trigger did not reopen its actions")
    tapWhenHittable(sync, message: "The enabled Sync action was not ready for interaction")
    waitForLabel("Last action: Sync requested", on: app.staticTexts["operations.value"])
  }

  func testDialogAndMoreInformationPresentation() {
    launch(arguments: ["-aurelglyph-show-dialog"])

    let dialogTitle = app.staticTexts["Publish release?"]
    XCTAssertTrue(dialogTitle.waitForExistence(timeout: 8))
    tapWhenHittable(
      app.buttons["Close Publish release?"],
      message: "The dialog close control was not ready for interaction"
    )
    XCTAssertTrue(waitForHittable(app.buttons["dialog.open"]), "The dialog trigger did not become available after dismissal")

    let informationTrigger = app.buttons["form.more-information"]
    XCTAssertTrue(scrollUntilVisible(informationTrigger), "The compact More information control was not reachable")
    tapWhenHittable(informationTrigger, message: "The More information trigger was not ready for interaction")
    let informationTitle = app.staticTexts["Form details"]
    XCTAssertTrue(informationTitle.waitForExistence(timeout: 5))
    XCTAssertTrue(
      app.staticTexts["Telemetry is optional. Local runs on-device; Staging targets the shared release candidate."].exists
    )

    tapWhenHittable(
      app.buttons["Close Form details"],
      message: "The information close control was not ready for interaction"
    )
    XCTAssertTrue(informationTitle.waitForNonExistence(timeout: 5))
    tapWhenHittable(informationTrigger, message: "The restored information trigger was not ready")
    XCTAssertTrue(
      app.staticTexts["Form details"].waitForExistence(timeout: 5),
      "The restored More information trigger did not reopen its surface"
    )
    tapWhenHittable(app.buttons["Close Form details"], message: "The information close control was not ready")
  }

  func testLocalizedControlCopy() {
    launch(arguments: ["-aurelglyph-localized-control-copy"])

    let select = app.buttons["Release channel"]
    XCTAssertTrue(select.waitForExistence(timeout: 5))
    XCTAssertEqual(select.value as? String, "Stable, Replié")

    tapWhenHittable(select, message: "The localized select trigger was not ready")
    XCTAssertTrue(app.buttons["Stable"].waitForExistence(timeout: 5))
    XCTAssertEqual(select.value as? String, "Stable, Déplié")
    tapWhenHittable(app.buttons["Stable"], message: "The localized select option was not ready")
    waitForValue("Stable, Replié", on: select)

    let menu = app.buttons["Operations"]
    XCTAssertTrue(scrollUntilVisible(menu), "The localized menu trigger was not reachable")
    XCTAssertEqual(menu.value as? String, "Replié")

    let information = app.buttons["form.more-information"]
    XCTAssertTrue(scrollUntilVisible(information), "The localized information trigger was not reachable")
    XCTAssertEqual(information.value as? String, "Replié")
    tapWhenHittable(information, message: "The localized information trigger was not ready")
    tapWhenHittable(app.buttons["Close Form details"], message: "The information close control was not ready")
    waitForValue("Replié", on: information)
  }

  func testAppearanceMatrix() {
    let configurations = [
      (mode: "light", appearance: "quiet", label: "Light · Quiet", scheme: "Light color scheme"),
      (mode: "light", appearance: "atelier", label: "Light · Atelier", scheme: "Light color scheme"),
      (mode: "dark", appearance: "quiet", label: "Dark · Quiet", scheme: "Dark color scheme"),
      (mode: "dark", appearance: "atelier", label: "Dark · Atelier", scheme: "Dark color scheme")
    ]
    var renderings: [Data] = []

    for configuration in configurations {
      launch(arguments: [
        "-aurelglyph-mode", configuration.mode,
        "-aurelglyph-appearance", configuration.appearance
      ])

      let status = app.staticTexts["theme.current"]
      XCTAssertTrue(status.waitForExistence(timeout: 8))
      XCTAssertEqual(status.label, configuration.label)
      XCTAssertEqual(status.value as? String, configuration.scheme)
      XCTAssertTrue(app.buttons[configuration.mode == "dark" ? "Dark" : "Light"].isSelected)
      XCTAssertTrue(app.buttons[configuration.appearance == "atelier" ? "Atelier" : "Quiet"].isSelected)

      let screenshot = XCUIScreen.main.screenshot()
      renderings.append(screenshot.pngRepresentation)
      let attachment = XCTAttachment(screenshot: screenshot)
      attachment.name = "Aurelglyph \(configuration.label)"
      attachment.lifetime = .keepAlways
      add(attachment)

      app.terminate()
    }

    XCTAssertEqual(renderings.count, 4)
    XCTAssertEqual(Set(renderings).count, 4, "Each mode and appearance pair should render a distinct surface")
  }

  func testAccessibilityCoverage() throws {
    launch()
    let standardTitleHeight = app.staticTexts["Native workbench"].frame.height

    if #available(iOS 17.0, *) {
      XCTAssertTrue(scrollUntilVisible(app.staticTexts["Form contract"]))
      let reliableAudits: XCUIAccessibilityAuditType = [
        .contrast,
        .elementDetection,
        .hitRegion,
        .sufficientElementDescription,
        .textClipped,
        .trait
      ]
      try app.performAccessibilityAudit(for: reliableAudits) { issue in
        let report = "\(issue.compactDescription): \(issue.detailedDescription)\n\(String(describing: issue.element))"
        print("[swiftui-smoke] Accessibility audit issue: \(report)")
        let attachment = XCTAttachment(string: report)
        attachment.name = "Accessibility audit issue"
        attachment.lifetime = .keepAlways
        self.add(attachment)
        if issue.auditType == .hitRegion && issue.element == nil {
          print("[swiftui-smoke] Ignoring XCTest hit-region issue without an associated application element.")
          return true
        }
        return false
      }
    }

    app.terminate()
    launch(arguments: [
      "-UIPreferredContentSizeCategoryName",
      "UICTContentSizeCategoryAccessibilityXXXL"
    ])

    let title = app.staticTexts["Native workbench"]
    XCTAssertGreaterThan(
      title.frame.height,
      standardTitleHeight,
      "The title did not scale at the requested accessibility content size"
    )
    XCTAssertTrue(app.buttons["dialog.open"].isHittable)
    XCTAssertTrue(
      scrollUntilVisible(app.buttons["form.more-information"]),
      "The form remained unreachable at an accessibility content size"
    )
  }

  private func launch(arguments: [String] = []) {
    if app.state != .notRunning {
      app.terminate()
    }
    app.launchArguments = ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"] + arguments
    app.launch()
    XCTAssertTrue(
      app.staticTexts["Native workbench"].waitForExistence(timeout: 20),
      "The SwiftUI smoke host did not finish launching"
    )
  }

  private func scrollUntilVisible(_ element: XCUIElement, maximumSwipes: Int = 8) -> Bool {
    for _ in 0..<maximumSwipes {
      if element.exists && element.isHittable {
        return true
      }
      app.swipeUp()
    }
    return element.exists && element.isHittable
  }

  private func tapWhenHittable(
    _ element: XCUIElement,
    timeout: TimeInterval = 8,
    message: String
  ) {
    XCTAssertTrue(waitForHittable(element, timeout: timeout), message)
    if element.exists && element.isHittable {
      element.tap()
    }
  }

  private func waitForHittable(_ element: XCUIElement, timeout: TimeInterval = 8) -> Bool {
    XCTWaiter.wait(
      for: [
        XCTNSPredicateExpectation(
          predicate: NSPredicate(format: "exists == true AND hittable == true"),
          object: element
        )
      ],
      timeout: timeout
    ) == .completed
  }

  private func waitForLabel(_ label: String, on element: XCUIElement, timeout: TimeInterval = 5) {
    let result = XCTWaiter.wait(
      for: [
        XCTNSPredicateExpectation(
          predicate: NSPredicate(format: "label == %@", label),
          object: element
        )
      ],
      timeout: timeout
    )
    XCTAssertEqual(result, .completed, "Expected \(element) to have label \(label)")
  }

  private func waitForValue(_ value: String, on element: XCUIElement, timeout: TimeInterval = 5) {
    let result = XCTWaiter.wait(
      for: [
        XCTNSPredicateExpectation(
          predicate: NSPredicate(format: "value == %@", value),
          object: element
        )
      ],
      timeout: timeout
    )
    XCTAssertEqual(result, .completed, "Expected \(element) to have value \(value)")
  }
}
