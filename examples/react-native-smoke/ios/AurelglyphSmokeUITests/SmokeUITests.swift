import XCTest

final class SmokeUITests: XCTestCase {
  private var app: XCUIApplication!

  override func setUpWithError() throws {
    continueAfterFailure = false
    XCUIDevice.shared.orientation = .portrait
    app = XCUIApplication()
    app.launch()
    XCTAssertTrue(
      app.staticTexts["Native overlay test host"].waitForExistence(timeout: 20),
      "The smoke host did not finish launching"
    )
  }

  func testHostedTooltipStaysInNativeModalAndOverlayDoesNotBlockTouches() {
    openNativeModal()
    let tooltip = app.descendants(matching: .any)["Hosted modal signal · bounded precision overlay calibration"].firstMatch
    XCTAssertTrue(tooltip.waitForExistence(timeout: 8), "The hosted tooltip was not exposed in the native modal")
    assertInsideModalHost(tooltip)

    let action = app.buttons["Underlying action"]
    XCTAssertTrue(action.isHittable, "The overlay host intercepted the underlying action")
    action.tap()
    XCTAssertTrue(app.descendants(matching: .any)["Underlying taps: 1"].firstMatch.waitForExistence(timeout: 3), "The underlying action did not receive the tap")
  }

  func testHostedTooltipRemeasuresAfterAnchorAndViewportChanges() {
    openNativeModal()
    let tooltip = app.descendants(matching: .any)["Hosted modal signal · bounded precision overlay calibration"].firstMatch
    XCTAssertTrue(tooltip.waitForExistence(timeout: 8), "The hosted tooltip was not exposed in the native modal")
    let initialFrame = tooltip.frame

    app.buttons["Move tooltip anchor"].tap()
    let moved = NSPredicate { _, _ in tooltip.frame != initialFrame }
    expectation(for: moved, evaluatedWith: tooltip)
    waitForExpectations(timeout: 5)
    let modalHost = visibleModalHost()
    assertInside(tooltip, bounds: modalHost.frame, description: "modal-local overlay host")
    XCTAssertLessThanOrEqual(
      tooltip.frame.minX,
      modalHost.frame.minX + 24,
      "The no-fit tooltip did not clamp to the modal host's leading boundary"
    )
    let movedFrame = tooltip.frame

    XCUIDevice.shared.orientation = .landscapeLeft
    let landscape = NSPredicate { _, _ in
      let window = self.app.windows.firstMatch.frame
      return window.width > window.height && tooltip.frame != movedFrame
    }
    expectation(for: landscape, evaluatedWith: tooltip, handler: nil)
    waitForExpectations(timeout: 5)
    assertInsideModalHost(tooltip)
  }

  func testThemeSelectionAndNativeSelectionSurfaces() {
    let atelier = app.descendants(matching: .any)["Atelier, Surface language"].firstMatch
    XCTAssertTrue(waitUntilHittable(atelier, timeout: 8), "The Atelier appearance option was not interactive")
    atelier.tap()
    XCTAssertTrue(
      app.descendants(matching: .any)["Theme: Dark · Atelier"].firstMatch.waitForExistence(timeout: 5),
      "The dark Atelier theme state was not announced"
    )

    let light = app.descendants(matching: .any)["Light, Color mode"].firstMatch
    XCTAssertTrue(waitUntilHittable(light, timeout: 8), "The Light mode option was not interactive")
    light.tap()
    XCTAssertTrue(
      app.descendants(matching: .any)["Theme: Light · Atelier"].firstMatch.waitForExistence(timeout: 5),
      "The light Atelier theme state was not announced"
    )

    let quiet = app.descendants(matching: .any)["Quiet, Surface language"].firstMatch
    XCTAssertTrue(waitUntilHittable(quiet, timeout: 8), "The Quiet appearance option was not interactive")
    quiet.tap()
    XCTAssertTrue(
      app.descendants(matching: .any)["Theme: Light · Quiet"].firstMatch.waitForExistence(timeout: 5),
      "The light Quiet theme state was not announced"
    )

    let select = app.otherElements["Release channel"].firstMatch
    XCTAssertTrue(scrollUntilHittable(select), "The release-channel select was not reachable")
    select.tap()
    let filter = app.textFields["Filter options"].firstMatch
    XCTAssertTrue(
      waitUntilHittable(filter, timeout: 5),
      "The release-channel filter was not ready for optional search"
    )
    let nightly = app.buttons["Release channel, Nightly"].firstMatch
    XCTAssertTrue(nightly.waitForExistence(timeout: 5), "The disabled Nightly option was not exposed")
    XCTAssertFalse(nightly.isEnabled, "The disabled Nightly option was interactive")
    let beta = app.buttons["Release channel, Beta"].firstMatch
    XCTAssertTrue(waitUntilHittable(beta, timeout: 5), "The Beta option was not interactive")
    beta.tap()
    let selectedReleaseChannel = NSPredicate { _, _ in
      let currentSelect = self.app.otherElements["Release channel"].firstMatch
      return currentSelect.exists && currentSelect.value as? String == "Beta"
    }
    let selectionExpectation = XCTNSPredicateExpectation(
      predicate: selectedReleaseChannel,
      object: app
    )
    let selectionResult = XCTWaiter.wait(for: [selectionExpectation], timeout: 5)
    let currentSelect = app.otherElements["Release channel"].firstMatch
    XCTAssertEqual(
      selectionResult,
      .completed,
      "The release-channel accessibility value did not update to Beta; observed \(String(describing: currentSelect.value))"
    )

    let operations = app.buttons["Operations"]
    XCTAssertTrue(scrollUntilHittable(operations), "The menu trigger was not reachable")
    operations.tap()
    let approval = app.buttons["Operations, Requires approval"].firstMatch
    XCTAssertTrue(approval.waitForExistence(timeout: 5), "The disabled approval action was not exposed")
    XCTAssertFalse(approval.isEnabled, "The disabled approval action was interactive")
    let archive = app.buttons["Operations, Archive draft"].firstMatch
    XCTAssertTrue(waitUntilHittable(archive, timeout: 5), "The archive action was not interactive")
    archive.tap()
    XCTAssertTrue(
      app.descendants(matching: .any)["Last action: Draft archived"].firstMatch.waitForExistence(timeout: 5),
      "The menu action result was not announced"
    )
  }

  func testMoreInformationPresentsAndDismissesNatively() {
    let information = app.buttons["About the native overlay host"]
    XCTAssertTrue(scrollUntilHittable(information, direction: .down), "The More information trigger was not reachable")
    information.tap()
    XCTAssertTrue(app.staticTexts["About the native overlay host"].waitForExistence(timeout: 5))
    let close = app.buttons["Close About the native overlay host"]
    XCTAssertTrue(waitUntilHittable(close, timeout: 5))
    close.tap()
    XCTAssertTrue(waitUntilHittable(information, timeout: 5), "Focus did not return to an interactive trigger")
  }

  func testAutofocusedComboboxAcceptsFirstSelection() {
    let combobox = app.otherElements["Searchable channel"].firstMatch
    XCTAssertTrue(scrollUntilHittable(combobox), "The searchable-channel combobox was not reachable")
    combobox.tap()

    let optionSearch = app.textFields["Search options"].firstMatch
    XCTAssertTrue(
      waitUntilAutofocusedSearchReady(optionSearch, timeout: 15),
      "Combobox autofocus did not present an interactive search and ready software keyboard"
    )
    optionSearch.tap()
    let stable = app.buttons["Searchable channel, Stable"].firstMatch
    let nightly = app.buttons["Searchable channel, Nightly"].firstMatch
    let beta = app.buttons["Searchable channel, Beta"].firstMatch
    XCTAssertTrue(stable.waitForExistence(timeout: 3), "The initial Stable option was not exposed")
    XCTAssertTrue(nightly.waitForExistence(timeout: 3), "The initial Nightly option was not exposed")
    XCTAssertTrue(beta.waitForExistence(timeout: 3), "The initial Beta option was not exposed")
    typeTextSynchronously(
      "Be",
      into: optionSearch,
      description: "Combobox search",
      afterCommittedValue: { value in
        switch value {
        case "B":
          return self.waitUntilAbsent(nightly, timeout: 3) && stable.exists && beta.exists
        case "Be":
          return self.waitUntilAbsent(stable, timeout: 3) && beta.exists
        default:
          return true
        }
      }
    )

    XCTAssertTrue(waitUntilHittable(beta, timeout: 5), "The filtered Combobox option was not interactive")
    beta.tap()
    let selectedSearchableChannel = NSPredicate { _, _ in
      let currentCombobox = self.app.otherElements["Searchable channel"].firstMatch
      return currentCombobox.exists && currentCombobox.value as? String == "Beta"
    }
    let searchableChannelExpectation = XCTNSPredicateExpectation(
      predicate: selectedSearchableChannel,
      object: app
    )
    let searchableChannelResult = XCTWaiter.wait(for: [searchableChannelExpectation], timeout: 5)
    let currentCombobox = app.otherElements["Searchable channel"].firstMatch
    XCTAssertEqual(
      searchableChannelResult,
      .completed,
      "The first Combobox option tap did not commit; observed \(String(describing: currentCombobox.value))"
    )
  }

  func testAutofocusedCommandPaletteAcceptsFirstAction() {
    let commandTrigger = app.buttons["Open command palette"].firstMatch
    XCTAssertTrue(scrollUntilHittable(commandTrigger), "The command-palette trigger was not reachable")
    commandTrigger.tap()

    let commandSearch = app.textFields["Search commands"].firstMatch
    XCTAssertTrue(
      waitUntilAutofocusedSearchReady(commandSearch, timeout: 15),
      "Command Palette autofocus did not present an interactive search and ready software keyboard"
    )
    commandSearch.tap()
    let archive = app.buttons["Command palette, Archive systems"].firstMatch
    let synchronize = app.buttons["Command palette, Synchronize systems"].firstMatch
    let applyChanges = app.buttons["Command palette, Apply changes"].firstMatch
    XCTAssertTrue(archive.waitForExistence(timeout: 3), "The initial Archive systems action was not exposed")
    XCTAssertTrue(synchronize.waitForExistence(timeout: 3), "The initial Synchronize systems action was not exposed")
    XCTAssertTrue(applyChanges.waitForExistence(timeout: 3), "The initial Apply changes action was not exposed")
    typeTextSynchronously(
      "Ar",
      into: commandSearch,
      description: "Command Palette search",
      afterCommittedValue: { value in
        switch value {
        case "A":
          return self.waitUntilAbsent(synchronize, timeout: 3) && archive.exists && applyChanges.exists
        case "Ar":
          return self.waitUntilAbsent(applyChanges, timeout: 3) && archive.exists
        default:
          return true
        }
      }
    )

    XCTAssertTrue(waitUntilHittable(archive, timeout: 5), "The filtered Command Palette action was not interactive")
    archive.tap()
    XCTAssertTrue(
      app.descendants(matching: .any)["Last command: Archive systems"].firstMatch.waitForExistence(timeout: 5),
      "The first Command Palette action tap did not commit"
    )
  }

  override func tearDownWithError() throws {
    app.terminate()
    app = nil
    XCUIDevice.shared.orientation = .portrait
  }

  private func visibleModalHost(
    file: StaticString = #filePath,
    line: UInt = #line
  ) -> XCUIElement {
    let hosts = app.otherElements.matching(identifier: "aurelglyph-overlay-host")
    let visibleHost = hosts.allElementsBoundByIndex.first { $0.frame.width > 0 && $0.frame.height > 0 }
    XCTAssertNotNil(visibleHost, "The modal-local overlay host was not exposed", file: file, line: line)
    return visibleHost ?? hosts.firstMatch
  }

  private func waitUntilHittable(_ element: XCUIElement, timeout: TimeInterval) -> Bool {
    let predicate = NSPredicate { candidate, _ in
      guard let candidate = candidate as? XCUIElement else { return false }
      return candidate.exists && candidate.isHittable
    }
    let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
    return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
  }

  private func waitUntilAbsent(_ element: XCUIElement, timeout: TimeInterval) -> Bool {
    let predicate = NSPredicate { candidate, _ in
      guard let candidate = candidate as? XCUIElement else { return false }
      return !candidate.exists
    }
    let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
    return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
  }

  private func waitUntilAutofocusedSearchReady(_ search: XCUIElement, timeout: TimeInterval) -> Bool {
    let keyboard = app.keyboards.firstMatch
    let tutorialLabel = "Speed up your typing by sliding your finger across the letters to compose a word."
    let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    var deadline = Date().addingTimeInterval(timeout)
    let tutorialScopes = [app!, system]
    var readySince: Date?
    var tutorialScope: XCUIApplication?
    var dismissedTutorial = false

    while deadline.timeIntervalSinceNow > 0 {
      let readiness = NSPredicate { _, _ in
        tutorialScope = tutorialScopes.first { $0.staticTexts[tutorialLabel].firstMatch.exists }
        if tutorialScope != nil {
          readySince = nil
          return true
        }
        guard search.exists && search.isHittable && keyboard.exists && keyboard.keys.firstMatch.exists else {
          readySince = nil
          return false
        }
        if readySince == nil { readySince = Date() }
        // Keep observing while the cold keyboard settles: its tutorial can
        // arrive after the field and keys first become accessible.
        return Date().timeIntervalSince(readySince!) >= 2
      }
      let readinessExpectation = XCTNSPredicateExpectation(predicate: readiness, object: app)
      guard XCTWaiter.wait(
        for: [readinessExpectation],
        timeout: max(0, deadline.timeIntervalSinceNow)
      ) == .completed else { return searchReadinessFailure("Autofocused search did not settle") }
      guard let scope = tutorialScope else { return true }
      guard !dismissedTutorial else { return searchReadinessFailure("The keyboard tutorial reappeared after dismissal") }

      // A fresh simulator can hide the focused field behind iOS's QuickPath
      // tutorial. Dismiss only that identified system UI, never a host action.
      // Its remote Continue control is not consistently classified as a Button
      // or attributed to the same application scope as the explanatory label.
      let tutorialDeadline = Date().addingTimeInterval(30)
      var continueControl: XCUIElement?
      let tutorialReady = NSPredicate { _, _ in
        continueControl = tutorialScopes
          .map { $0.descendants(matching: .any)["Continue"].firstMatch }
          .first { $0.exists && $0.isHittable }
        return continueControl != nil
      }
      let tutorialExpectation = XCTNSPredicateExpectation(predicate: tutorialReady, object: scope)
      guard XCTWaiter.wait(for: [tutorialExpectation], timeout: 30) == .completed,
        let continueControl = continueControl
      else { return searchReadinessFailure("The identified keyboard tutorial's Continue control was not interactive") }
      XCTContext.runActivity(named: "Dismiss iOS first-use keyboard tutorial") { _ in
        continueControl.tap()
      }
      guard waitUntilAbsent(
        scope.staticTexts[tutorialLabel].firstMatch,
        timeout: max(0, tutorialDeadline.timeIntervalSinceNow)
      ) else { return searchReadinessFailure("The identified keyboard tutorial did not dismiss") }
      dismissedTutorial = true
      // System onboarding must not spend the product's readiness budget.
      deadline = Date().addingTimeInterval(timeout)
      readySince = nil
    }
    return searchReadinessFailure("Autofocused search exhausted its readiness budget")
  }

  private func searchReadinessFailure(_ stage: String) -> Bool {
    XCTContext.runActivity(named: stage) { _ in
      let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")
      let hierarchy = XCTAttachment(string: "\(stage)\nHost:\n\(app.debugDescription)\nSystem:\n\(system.debugDescription)")
      hierarchy.name = "Native search readiness hierarchy"
      hierarchy.lifetime = .keepAlways
      add(hierarchy)
    }
    return false
  }

  private func typeTextSynchronously(
    _ text: String,
    into field: XCUIElement,
    description: String,
    afterCommittedValue: ((String) -> Bool)? = nil,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    var expectedValue = ""

    for character in text {
      field.typeText(String(character))
      expectedValue.append(character)
      let settledValue = expectedValue
      let predicate = NSPredicate { candidate, _ in
        guard let candidate = candidate as? XCUIElement else { return false }
        return candidate.value as? String == settledValue
      }
      let expectation = XCTNSPredicateExpectation(predicate: predicate, object: field)
      let result = XCTWaiter.wait(for: [expectation], timeout: 3)

      XCTAssertEqual(
        result,
        .completed,
        "\(description) did not accept \(settledValue); observed \(String(describing: field.value))",
        file: file,
        line: line
      )
      if result != .completed { return }

      if afterCommittedValue?(expectedValue) == false {
        XCTFail(
          "\(description) did not propagate \(expectedValue) through the filtered React Native surface",
          file: file,
          line: line
        )
        return
      }
    }
  }

  private enum ScrollDirection {
    case down
    case up
  }

  private func scrollUntilHittable(
    _ element: XCUIElement,
    direction: ScrollDirection = .up,
    maximumSwipes: Int = 8
  ) -> Bool {
    let scrollView = app.scrollViews.firstMatch
    for _ in 0..<maximumSwipes {
      if element.exists && element.isHittable { return true }
      if scrollView.exists {
        if direction == .up { scrollView.swipeUp() } else { scrollView.swipeDown() }
      } else {
        if direction == .up { app.swipeUp() } else { app.swipeDown() }
      }
    }
    return element.exists && element.isHittable
  }

  private func openNativeModal() {
    let openModal = app.buttons["Open native modal"]
    XCTAssertTrue(scrollUntilHittable(openModal), "The native modal trigger never became interactive")
    openModal.tap()
    XCTAssertTrue(
      app.descendants(matching: .any)["Native modal active"].firstMatch.waitForExistence(timeout: 15),
      "The native modal did not open"
    )
  }

  private func assertInsideModalHost(
    _ element: XCUIElement,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    let host = visibleModalHost(file: file, line: line)
    assertInside(element, bounds: host.frame, description: "modal-local overlay host", file: file, line: line)
  }

  private func assertInside(
    _ element: XCUIElement,
    bounds: CGRect,
    description: String,
    file: StaticString = #filePath,
    line: UInt = #line
  ) {
    XCTAssertTrue(
      bounds.insetBy(dx: -1, dy: -1).contains(element.frame),
      "Element frame \(element.frame) escaped \(description) bounds \(bounds)",
      file: file,
      line: line
    )
  }
}
