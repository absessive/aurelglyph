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

    let select = app.descendants(matching: .any)["Release channel"].firstMatch
    XCTAssertTrue(scrollUntilHittable(select), "The release-channel select was not reachable")
    select.tap()
    let nightly = app.descendants(matching: .any)["Release channel, Nightly"].firstMatch
    XCTAssertTrue(nightly.waitForExistence(timeout: 5), "The disabled Nightly option was not exposed")
    XCTAssertFalse(nightly.isEnabled, "The disabled Nightly option was interactive")
    let beta = app.descendants(matching: .any)["Release channel, Beta"].firstMatch
    XCTAssertTrue(waitUntilHittable(beta, timeout: 5), "The Beta option was not interactive")
    beta.tap()
    let selectedReleaseChannel = NSPredicate { _, _ in
      select.exists && select.value as? String == "Beta"
    }
    expectation(for: selectedReleaseChannel, evaluatedWith: select)
    waitForExpectations(timeout: 5)

    let operations = app.buttons["Operations"]
    XCTAssertTrue(scrollUntilHittable(operations), "The menu trigger was not reachable")
    operations.tap()
    let approval = app.descendants(matching: .any)["Operations, Requires approval"].firstMatch
    XCTAssertTrue(approval.waitForExistence(timeout: 5), "The disabled approval action was not exposed")
    XCTAssertFalse(approval.isEnabled, "The disabled approval action was interactive")
    let archive = app.descendants(matching: .any)["Operations, Archive draft"].firstMatch
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
