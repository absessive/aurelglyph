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
      "UICTContentSizeCategoryAccessibilityXXXL",
      "-aurelglyph-long-information"
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
    tapWhenHittable(
      app.buttons["form.more-information"],
      message: "The information trigger was not reachable at an accessibility content size"
    )
    XCTAssertTrue(
      scrollUntilVisible(app.staticTexts["form.more-information.last"], maximumSwipes: 12),
      "Long More information content was not scrollable at an accessibility content size"
    )
  }

  func testCatalogChipDisclosureAndRatingContracts() {
    launch(arguments: ["-aurelglyph-catalog"])

    XCTAssertTrue(app.staticTexts["Unavailable destination"].exists)
    XCTAssertFalse(app.links["Unavailable destination"].exists)
    let chip = app.buttons["Local"]
    XCTAssertTrue(chip.isSelected)
    chip.tap()
    waitForLabel("Local not selected", on: app.staticTexts["catalog.chip.value"])
    tapWhenHittable(app.buttons["Remove Local"], message: "The sibling chip removal control was not reachable")
    waitForLabel("Chip removed", on: app.staticTexts["catalog.chip.value"])
    XCTAssertFalse(app.buttons["Local"].exists)

    let storage = app.buttons["Storage"]
    XCTAssertTrue(scrollUntilVisible(storage), "The accordion header was not reachable")
    tapWhenHittable(storage, message: "Storage was not ready to expand")
    XCTAssertTrue(app.staticTexts["catalog.storage.content"].exists)
    XCTAssertFalse(app.staticTexts["catalog.network.content"].exists, "Single-open accordion left the previous panel exposed")
    XCTAssertFalse(app.buttons["Locked section"].isEnabled)
    tapWhenHittable(storage, message: "Storage was not ready to collapse")
    XCTAssertFalse(app.staticTexts["catalog.storage.content"].exists)

    let verify = app.buttons["Step 3 of 4, Verify, Needs attention"]
    XCTAssertTrue(scrollUntilVisible(verify), "The enabled workflow step was not reachable")
    tapWhenHittable(verify, message: "The verification step was not ready")
    let currentError = app.buttons["Step 3 of 4, Verify, Current · Needs attention"]
    XCTAssertTrue(currentError.waitForExistence(timeout: 5))
    XCTAssertTrue(currentError.isSelected, "The error step lost its current status")
    XCTAssertFalse(app.buttons["Step 2 of 4, Review, Upcoming"].isSelected)
    XCTAssertFalse(app.buttons["Step 4 of 4, Publish, Unavailable"].exists, "The disabled workflow step exposed navigation")

    let readiness = app.otherElements["Readiness"]
    XCTAssertTrue(scrollUntilVisible(readiness), "The rating was not reachable")
    XCTAssertEqual(readiness.value as? String, "3 of 5")
    let starFour = readiness.coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.5))
    starFour.tap()
    waitForLabel("Rating: 4", on: app.staticTexts["catalog.rating.value"])
    let clear = app.buttons.matching(identifier: "Clear rating").firstMatch
    tapWhenHittable(clear, message: "The rating clear control was not reachable")
    waitForLabel("Rating: 0", on: app.staticTexts["catalog.rating.value"])
    XCTAssertFalse(clear.isEnabled)
    XCTAssertTrue(scrollUntilVisible(app.otherElements["Required readiness"]))
    XCTAssertEqual(app.buttons.matching(identifier: "Clear rating").count, 1, "Required rating exposed a Clear action")
    XCTAssertTrue(scrollUntilVisible(app.otherElements["Read-only readiness"]))
    XCTAssertEqual(app.buttons.matching(identifier: "Clear rating").count, 1, "Read-only rating exposed a Clear action")
  }

  func testCatalogPasswordPreservesFocusValueAndMasksAgain() {
    launch(arguments: ["-aurelglyph-catalog"])
    let password = app.secureTextFields["Access key"]
    XCTAssertTrue(scrollUntilVisible(password), "The native password field was not reachable")
    tapWhenHittable(password, message: "The concealed password field was not ready")
    app.typeText("ab")
    tapWhenHittable(app.buttons["Show password"], message: "The password reveal control was not ready")
    let revealed = app.textFields["Access key"]
    XCTAssertTrue(revealed.waitForExistence(timeout: 5))
    app.typeText("cd") // No refocus: revealing must keep the native first responder.
    XCTAssertEqual(revealed.value as? String, "abcd")
    tapWhenHittable(app.buttons["Hide password"], message: "The password conceal control was not ready")
    XCTAssertTrue(password.waitForExistence(timeout: 5))
    app.typeText("ef")
    XCTAssertNotEqual(password.value as? String, "abcdef", "The concealed field exposed its secret value")
    tapWhenHittable(app.buttons["Show password"], message: "The password reveal control did not recover")
    XCTAssertEqual(revealed.value as? String, "abcdef")
    tapWhenHittable(app.keyboards.buttons["Done"], message: "The native text-entry Done control was not reachable")

    let validate = app.buttons["Validate"]
    XCTAssertTrue(scrollUntilVisible(validate))
    validate.tap()
    let summary = app.staticTexts["Check the form"]
    XCTAssertTrue(summary.waitForExistence(timeout: 5))
    XCTAssertEqual(summary.value as? String, "2 errors")
    tapWhenHittable(app.buttons["Review the budget"], message: "The validation field-focus action was not reachable")
    XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
    app.typeText("0")
    XCTAssertEqual(app.textFields["Budget"].value as? String, "2400")
  }

  func testCatalogLocalizedCopyAndAccessibleTextReachability() {
    launch(arguments: ["-aurelglyph-catalog", "-aurelglyph-localized-control-copy",
      "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"])
    XCTAssertTrue(scrollCatalogUntilVisible(app.buttons["Afficher le mot de passe"]), "Localized password visibility was unreachable: \(app.debugDescription)")
    XCTAssertTrue(scrollCatalogUntilVisible(app.buttons["Storage"]), "Accordion was unreachable at accessibility text size")
    XCTAssertTrue(scrollCatalogUntilVisible(app.otherElements["Readiness"], maximumSwipes: 12), "Rating was unreachable at accessibility text size")
    XCTAssertEqual(app.otherElements["Readiness"].value as? String, "3/5")
    XCTAssertTrue(app.buttons.matching(identifier: "Effacer la note").firstMatch.exists)
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

  // The AX-sized catalog can span six pages. Keep targets within the actual
  // scroll viewport instead of overshooting them with one-way app gestures.
  private func scrollCatalogUntilVisible(_ element: XCUIElement, maximumSwipes: Int = 8) -> Bool {
    let scrollView = app.scrollViews.firstMatch
    for _ in 0..<maximumSwipes {
      if element.exists && element.isHittable { return true }
      let viewport = scrollView.frame
      guard !viewport.isEmpty else { return false }
      let targetOffset = element.exists ? (element.frame.midY - viewport.midY) / viewport.height : 1
      let distance = min(0.35, max(0.15, abs(targetOffset)))
      // Full swipes can alternate between either side of a 44pt control at AX
      // text sizes. Use a bounded viewport-local drag toward the actual target.
      let startY = targetOffset < 0 ? 0.3 : 0.7
      let endY = startY + (targetOffset < 0 ? distance : -distance)
      scrollView.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: startY))
        .press(forDuration: 0.05, thenDragTo: scrollView.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: endY)))
    }
    return element.exists && element.isHittable
  }

  private func tapWhenHittable(
    _ element: XCUIElement,
    timeout: TimeInterval = 8,
    message: String
  ) {
    let isReady = waitForHittable(element, timeout: timeout)
    if !isReady {
      print("[swiftui-smoke] Unhittable element: \(element)\n\(app.debugDescription)")
    }
    XCTAssertTrue(isReady, message)
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
