import XCTest

final class SmokeUITests: XCTestCase {
  private var app: XCUIApplication!

  override func setUpWithError() throws {
    continueAfterFailure = false
    XCUIDevice.shared.orientation = .portrait
    app = XCUIApplication()
    if name.contains("testEssentialPasswordPreservesFocusValueAndMasksAgain") {
      app.launchArguments.append("--aurelglyph-native-undo")
    }
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

  func testEssentialChipAccordionAndStepperContracts() {
    let remove = app.buttons["Remove Local"].firstMatch
    XCTAssertTrue(scrollUntilHittable(remove), "The sibling chip removal control was unreachable")
    XCTAssertGreaterThanOrEqual(remove.frame.width, 44)
    XCTAssertGreaterThanOrEqual(remove.frame.height, 44)
    remove.tap()
    let restore = app.buttons["Restore local filter"].firstMatch
    XCTAssertTrue(restore.waitForExistence(timeout: 3), "Chip removal did not update the consumer state")
    XCTAssertFalse(remove.exists, "The removed chip action remained in the native accessibility tree")
    restore.tap()
    XCTAssertTrue(remove.waitForExistence(timeout: 3), "Restoring the chip did not restore its independent removal action")

    let limits = app.buttons["Limits"].firstMatch
    XCTAssertTrue(scrollUntilHittable(limits), "The accordion header was unreachable")
    let details = app.buttons["Details"].firstMatch
    XCTAssertTrue((details.value as? String ?? "").contains("expanded"), "The initially open disclosure did not expose native expanded state")
    XCTAssertFalse((limits.value as? String ?? "").contains("expanded"), "The initially collapsed disclosure exposed expanded state")
    limits.tap()
    XCTAssertTrue(app.staticTexts["Standard limits"].waitForExistence(timeout: 3))
    XCTAssertTrue((limits.value as? String ?? "").contains("expanded"), "Opening the disclosure did not update native expanded state")
    XCTAssertFalse((details.value as? String ?? "").contains("expanded"), "Single accordion policy retained the previous expanded state")
    XCTAssertFalse(app.staticTexts["Local workspace"].exists, "Single accordion policy left the previous panel accessible")
    let archive = app.buttons["Archive"].firstMatch
    XCTAssertTrue(archive.exists)
    XCTAssertFalse(archive.isEnabled, "The disabled accordion item became actionable")

    let configure = app.buttons["Configure, step 1 of 4, Completed"].firstMatch
    XCTAssertTrue(scrollUntilHittable(configure), "Ordered step navigation was unreachable")
    configure.tap()
    XCTAssertTrue(app.buttons["Configure, step 1 of 4, Current"].firstMatch.waitForExistence(timeout: 3))
    XCTAssertFalse(app.buttons["Publish, step 4 of 4, Upcoming"].firstMatch.isEnabled)
  }

  func testEssentialPasswordPreservesFocusValueAndMasksAgain() {
    let masked = app.secureTextFields["Access password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(masked), "The secure password input was unreachable")
    masked.tap()
    XCTAssertTrue(waitUntilAutofocusedSearchReady(masked, timeout: 15), "The deliberately focused password field did not expose a ready keyboard")
    app.typeText("!")

    let reveal = app.buttons["Show Access password"].firstMatch
    XCTAssertTrue(waitUntilHittable(reveal, timeout: 5))
    reveal.tap()
    let visible = app.textFields["Access password"].firstMatch
    XCTAssertTrue(visible.waitForExistence(timeout: 3))
    XCTAssertEqual(visible.value as? String, "sample-passphrase!", "Reveal changed the native password value or caret")
    XCTAssertTrue(app.keyboards.firstMatch.exists, "Reveal lost the focused software keyboard")
    // Deliberately type through the app, not through a field that XCTest might
    // retarget. The existing focus and end selection must survive the toggle.
    app.typeText("?")
    XCTAssertTrue(waitUntilValue(visible, equals: "sample-passphrase!?", timeout: 3))
    app.buttons["Hide Access password"].firstMatch.tap()
    XCTAssertTrue(masked.waitForExistence(timeout: 3), "Hide did not restore secure native entry")
    app.typeText("#")
    app.buttons["Show Access password"].firstMatch.tap()
    XCTAssertTrue(waitUntilValue(visible, equals: "sample-passphrase!?#", timeout: 3), "Masking changed focus, value, or the native insertion point")

    let retained = app.secureTextFields["Retained password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(retained), "The controlled-rejection password was unreachable")
    retained.tap()
    // The keyboard is already ready: type immediately, without a JS-focus wait.
    app.typeText("x")
    XCTAssertTrue(app.staticTexts["Retained edits: 1"].waitForExistence(timeout: 3))
    // Exercise command-only rollback without a reveal/mask mount in between.
    app.typeText("y")
    let showRetained = app.buttons["Show Retained password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(showRetained), "The retained-password reveal was covered")
    showRetained.tap()
    let retainedVisible = app.textFields["Retained password"].firstMatch
    XCTAssertTrue(waitUntilValue(retainedVisible, equals: "retained-passphrasey", timeout: 3), "Controlled rejection corrupted a consecutive masked edit; observed \(String(describing: retainedVisible.value))")
    XCTAssertTrue(app.staticTexts["Retained edits: 2"].waitForExistence(timeout: 3), "Native repair emitted an extra rejected-edit callback")
    app.buttons["Hide Retained password"].firstMatch.tap()
    app.typeText("w")
    app.buttons["Show Retained password"].firstMatch.tap()
    XCTAssertTrue(waitUntilValue(retainedVisible, equals: "retained-passphraseyw", timeout: 3), "Remasking corrupted the next native insertion; observed \(String(describing: retainedVisible.value))")
    XCTAssertTrue(app.staticTexts["Retained edits: 3"].waitForExistence(timeout: 3), "Native repair emitted an extra accepted-edit callback")

    let formatted = app.secureTextFields["Formatted password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(formatted), "The controlled-formatter password was unreachable")
    formatted.tap()
    app.typeText("Q")
    XCTAssertTrue(app.staticTexts["Formatted edits: 1"].waitForExistence(timeout: 3))
    app.typeText("R")
    let showFormatted = app.buttons["Show Formatted password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(showFormatted), "The formatter reveal was covered")
    showFormatted.tap()
    let formattedVisible = app.textFields["Formatted password"].firstMatch
    XCTAssertTrue(waitUntilValue(formattedVisible, equals: "calibrationqr", timeout: 3), "Consecutive owner-formatted edits were not retained; observed \(String(describing: formattedVisible.value))")
    XCTAssertTrue(app.staticTexts["Formatted edits: 2"].waitForExistence(timeout: 3), "Native repair emitted an extra formatted-edit callback")
    app.buttons["Hide Formatted password"].firstMatch.tap()
    app.typeText("S")
    app.buttons["Show Formatted password"].firstMatch.tap()
    XCTAssertTrue(waitUntilValue(formattedVisible, equals: "calibrationqrs", timeout: 3), "Formatting corrupted the next masked insertion")
    XCTAssertTrue(app.staticTexts["Formatted edits: 3"].waitForExistence(timeout: 3), "Remasking emitted an extra formatted-edit callback")

    let mountAutofocus = app.buttons["Mount autofocus password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(mountAutofocus))
    mountAutofocus.tap()
    // Mount-triggered autoFocus must prepare secure entry without another tap
    // or the keyboard-settling delay used for the original cold launch.
    app.typeText("z")
    XCTAssertTrue(app.staticTexts["Autofocus length: 21"].waitForExistence(timeout: 3), "The first autofocus edit did not retain the masked prefix")
    XCTAssertTrue(app.staticTexts["Autofocus edits: 1"].waitForExistence(timeout: 3))
    let showAutofocus = app.buttons["Show Autofocus password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(showAutofocus), "The autofocus reveal was covered")
    showAutofocus.tap()
    let autofocusedVisible = app.textFields["Autofocus password"].firstMatch
    XCTAssertTrue(waitUntilValue(autofocusedVisible, equals: "autofocus-passphrasez", timeout: 3), "The first autoFocus edit replaced the prefilled value")
    app.buttons["Hide Autofocus password"].firstMatch.tap()
    // RN's secure trait setter clears history at a reveal/mask boundary.
    // Verify native undo/redo within a secure editing session, before toggling.
    app.typeText("q")
    XCTAssertTrue(app.staticTexts["Autofocus length: 22"].waitForExistence(timeout: 3), "Remasking lost the prefix before native undo")
    XCTAssertTrue(app.staticTexts["Autofocus edits: 2"].waitForExistence(timeout: 3))
    performNativeEditingAction("Undo")
    XCTAssertTrue(app.staticTexts["Autofocus length: 21"].waitForExistence(timeout: 3), "Native undo did not restore the masked edit")
    XCTAssertTrue(app.staticTexts["Autofocus edits: 3"].waitForExistence(timeout: 3))
    app.buttons["Show Autofocus password"].firstMatch.tap()
    XCTAssertTrue(waitUntilValue(autofocusedVisible, equals: "autofocus-passphrasez", timeout: 3), "Secure-entry repair changed native undo within an editing session; observed \(String(describing: autofocusedVisible.value))")
    app.buttons["Hide Autofocus password"].firstMatch.tap()
    app.typeText("q")
    XCTAssertTrue(app.staticTexts["Autofocus length: 22"].waitForExistence(timeout: 3))
    XCTAssertTrue(app.staticTexts["Autofocus edits: 4"].waitForExistence(timeout: 3))
    performNativeEditingAction("Undo")
    XCTAssertTrue(app.staticTexts["Autofocus length: 21"].waitForExistence(timeout: 3))
    XCTAssertTrue(app.staticTexts["Autofocus edits: 5"].waitForExistence(timeout: 3))
    performNativeEditingAction("Redo")
    XCTAssertTrue(app.staticTexts["Autofocus length: 22"].waitForExistence(timeout: 3))
    XCTAssertTrue(app.staticTexts["Autofocus edits: 6"].waitForExistence(timeout: 3))
    app.buttons["Show Autofocus password"].firstMatch.tap()
    XCTAssertTrue(waitUntilValue(autofocusedVisible, equals: "autofocus-passphrasezq", timeout: 3), "Secure-entry repair changed native redo within an editing session; observed \(String(describing: autofocusedVisible.value))")

    let mountSelected = app.buttons["Mount selected password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(mountSelected))
    mountSelected.tap()
    app.typeText("K")
    let showSelected = app.buttons["Show Selected password"].firstMatch
    XCTAssertTrue(scrollUntilHittable(showSelected))
    showSelected.tap()
    XCTAssertTrue(waitUntilValue(app.textFields["Selected password"].firstMatch, equals: "caKration", timeout: 3), "First focus did not retain the explicit native replacement range")
  }

  func testEssentialRatingInputAndSummaryContracts() {
    let unavailable = app.descendants(matching: .any)["Unavailable destination"].firstMatch
    XCTAssertTrue(scrollUntilHittable(unavailable), "The unavailable link placeholder was not reachable for inspection")
    XCTAssertFalse(unavailable.isEnabled, "An unavailable link exposed enabled navigation")

    let amount = app.textFields["Amount"].firstMatch
    XCTAssertTrue(scrollUntilHittable(amount), "The owned input-group field was unreachable")
    XCTAssertEqual(app.textFields.matching(identifier: "Amount").count, 1, "The input group duplicated field ownership")
    XCTAssertEqual(amount.value as? String, "12.50")

    // The visible label is a StaticText with the same label. Inspect the native
    // adjustable Other element, not that non-adjustable text label.
    let rating = app.otherElements["Interface quality"].firstMatch
    XCTAssertTrue(scrollUntilHittable(rating), "The native adjustable rating was unreachable")
    XCTAssertEqual(app.otherElements.matching(identifier: "Interface quality").count, 1, "Rating did not expose one owned native adjustable group")
    XCTAssertEqual(rating.value as? String, "3 of 5")
    let clear = app.buttons["Clear rating"].firstMatch
    XCTAssertTrue(scrollUntilHittable(clear))
    clear.tap()
    XCTAssertTrue(waitUntilValue(rating, equals: "0 of 5", timeout: 3))
    XCTAssertGreaterThanOrEqual(rating.frame.height, 44)
    rating.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: 22, dy: 22)).tap()
    XCTAssertTrue(waitUntilValue(rating, equals: "1 of 5", timeout: 3), "The first whole-number touch choice did not update the native rating value")

    let review = app.buttons["Review fields"].firstMatch
    XCTAssertTrue(scrollUntilHittable(review, direction: .down))
    review.tap()
    XCTAssertTrue(app.staticTexts["Check these fields"].waitForExistence(timeout: 3), "The supplied-error summary did not render after submission")
    XCTAssertTrue(app.buttons["Review access password"].firstMatch.exists)
    let reviewAmount = app.buttons["Review amount"].firstMatch
    XCTAssertTrue(waitUntilHittable(reviewAmount, timeout: 5))
    reviewAmount.tap()
    XCTAssertTrue(waitUntilHittable(amount, timeout: 5), "The summary's field action did not return to the owned input")
    XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5), "The requested field-focus action did not focus native input")
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

  private func waitUntilValue(_ element: XCUIElement, equals value: String, timeout: TimeInterval) -> Bool {
    let predicate = NSPredicate { candidate, _ in
      guard let candidate = candidate as? XCUIElement else { return false }
      return candidate.exists && candidate.value as? String == value
    }
    let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
    if XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed { return true }
    let hierarchy = XCTAttachment(string: app.debugDescription)
    hierarchy.name = "Native value assertion failure"
    hierarchy.lifetime = .keepAlways
    add(hierarchy)
    return false
  }

  private func performNativeEditingAction(_ action: String, file: StaticString = #filePath, line: UInt = #line) {
    // Exercise UIKit's existing Undo manager with the software keyboard still focused,
    // without revealing or retargeting the field to inspect its masked value.
    let control = app.buttons["Native \(action)"].firstMatch
    XCTAssertTrue(waitUntilHittable(control, timeout: 5), "The native \(action) control was not interactive", file: file, line: line)
    XCTAssertTrue(control.isEnabled, "The native \(action) control was disabled", file: file, line: line)
    control.tap()
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
        // Once onboarding is gone, do not spend the product readiness budget
        // taking remote snapshots of system UI that was already dismissed.
        tutorialScope = dismissedTutorial ? nil : tutorialScopes.first { $0.staticTexts[tutorialLabel].firstMatch.exists }
        if tutorialScope != nil {
          readySince = nil
          return true
        }
        // Recent iOS accessibility trees expose zero-size Padding-Left/Right
        // elements as Keys. Prove a real software key is tappable, not padding.
        guard search.exists && search.isHittable && keyboard.exists,
          let firstKey = keyboard.keys.allElementsBoundByIndex.first(where: { !$0.frame.isEmpty }),
          firstKey.exists && firstKey.isHittable
        else {
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
    // Password AutoFill exposes its own ScrollView above the keyboard; never
    // let its position in the accessibility tree choose the scrolling owner.
    // Fabric exposes the ScrollView's testID on its accessibility container,
    // which need not have XCTest's ScrollView element type.
    let scrollView = app.descendants(matching: .any)["aurelglyph-workbench-scroll"].firstMatch
    guard scrollView.exists else { return false }
    var frameTrace: [String] = []
    func exposedViewport() -> CGRect {
      var viewport = scrollView.frame
      let toolbar = app.descendants(matching: .any)["aurelglyph-native-editing-toolbar"].firstMatch
      if toolbar.exists && viewport.intersects(toolbar.frame) {
        let bottom = viewport.maxY
        viewport.origin.y = max(viewport.minY, toolbar.frame.maxY)
        viewport.size.height = max(0, bottom - viewport.minY)
      }
      let keyboard = app.keyboards.firstMatch
      if keyboard.exists && !keyboard.frame.isEmpty && viewport.intersects(keyboard.frame) {
        viewport.size.height = max(0, keyboard.frame.minY - viewport.minY)
      }
      let assistant = app.descendants(matching: .any)["SystemInputAssistantView"].firstMatch
      if assistant.exists && !assistant.frame.isEmpty && viewport.intersects(assistant.frame) {
        viewport.size.height = max(0, assistant.frame.minY - viewport.minY)
      }
      return viewport
    }
    func reachable(in viewport: CGRect) -> Bool {
      guard element.exists && element.isHittable else { return false }
      return viewport.contains(element.frame)
    }
    for _ in 0..<maximumSwipes {
      let viewport = exposedViewport()
      if reachable(in: viewport) { return true }
      let targetFrame = element.exists ? String(describing: element.frame) : "absent"
      frameTrace.append("viewport=\(viewport), target=\(targetFrame), hittable=\(element.exists && element.isHittable)")
      guard !viewport.isEmpty else { return false }
      if app.keyboards.firstMatch.exists {
        // A full ScrollView swipe can start on the software keyboard. Its
        // accessibility tree may also report a covered field as hittable.
        // Drag only inside exposed content and require the whole target there.
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let scrollUp = element.exists ? element.frame.midY > viewport.midY : direction == .up
        let targetDistance = element.exists ? abs(element.frame.midY - viewport.midY) : viewport.height * 0.35
        let distance = min(viewport.height * 0.35, max(viewport.height * 0.15, targetDistance))
        let startY = viewport.minY + viewport.height * (scrollUp ? 0.7 : 0.3)
        let endY = startY + (scrollUp ? -distance : distance)
        // The host has a 24-point content gutter. A center drag can select
        // text in the focused input instead of scrolling its ancestor.
        let gutterX = viewport.maxX - 8
        origin.withOffset(CGVector(dx: gutterX, dy: startY))
          .press(forDuration: 0.05, thenDragTo: origin.withOffset(CGVector(dx: gutterX, dy: endY)))
        continue
      }
      if direction == .up { scrollView.swipeUp() } else { scrollView.swipeDown() }
    }
    let viewport = exposedViewport()
    if reachable(in: viewport) { return true }
    let targetFrame = element.exists ? String(describing: element.frame) : "absent"
    frameTrace.append("final viewport=\(viewport), target=\(targetFrame), hittable=\(element.exists && element.isHittable)")
    let trace = XCTAttachment(string: frameTrace.joined(separator: "\n") + "\n" + app.debugDescription)
    trace.name = "Workbench reachability failure"
    trace.lifetime = .keepAlways
    add(trace)
    return false
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
