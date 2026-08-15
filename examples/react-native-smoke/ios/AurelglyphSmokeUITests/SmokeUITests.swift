import XCTest

final class SmokeUITests: XCTestCase {
  private var app: XCUIApplication!

  override func setUpWithError() throws {
    continueAfterFailure = false
    XCUIDevice.shared.orientation = .portrait
    app = XCUIApplication()
    app.launch()
    XCTAssertTrue(app.buttons["Open native modal"].waitForExistence(timeout: 20), "The smoke host did not finish launching")
    app.buttons["Open native modal"].tap()
    XCTAssertTrue(app.descendants(matching: .any)["Native modal active"].firstMatch.waitForExistence(timeout: 8), "The native modal did not open")
  }

  func testHostedTooltipStaysInNativeModalAndOverlayDoesNotBlockTouches() {
    let tooltip = app.descendants(matching: .any)["Hosted modal signal · bounded precision overlay calibration"].firstMatch
    XCTAssertTrue(tooltip.waitForExistence(timeout: 8), "The hosted tooltip was not exposed in the native modal")
    assertInsideModalHost(tooltip)

    let action = app.buttons["Underlying action"]
    XCTAssertTrue(action.isHittable, "The overlay host intercepted the underlying action")
    action.tap()
    XCTAssertTrue(app.descendants(matching: .any)["Underlying taps: 1"].firstMatch.waitForExistence(timeout: 3), "The underlying action did not receive the tap")
  }

  func testHostedTooltipRemeasuresAfterAnchorAndViewportChanges() {
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
