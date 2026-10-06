import { describe, expect, it } from "vitest";
import { retryTelemetry, type TestNode } from "../examples/react-native-smoke/scripts/ios-results.mjs";

function testCase(identifier: string, results: string[]): TestNode {
  return {
    name: "testSearch()",
    nodeIdentifier: identifier,
    nodeType: "Test Case",
    result: results.at(-1),
    children: results.length === 1 ? [] : results.map((result, index) => ({
      name: index === 0 ? "First Run" : `Retry ${index}`,
      nodeIdentifier: String(index + 1),
      nodeType: "Repetition",
      result
    }))
  };
}

describe("native iOS result diagnostics", () => {
  it("preserves the test identifier for every failed and recovered repetition", () => {
    const report = { testNodes: [testCase("SmokeUITests/testSearch()", ["Failed", "Passed"])] };
    const telemetry = retryTelemetry(report, "Retrying tests on failure.\nUnrelated warning.");
    expect(telemetry.recoveredTests).toEqual([
      { identifier: "SmokeUITests/testSearch()", results: ["Failed", "Passed"] }
    ]);
    expect(telemetry.attempts.map(attempt => attempt.identifier)).toEqual([
      "SmokeUITests/testSearch()", "SmokeUITests/testSearch()"
    ]);
    expect(telemetry.retryLog).toEqual(["Retrying tests on failure."]);
  });

  it("does not conflate tests with the same name in different suites", () => {
    const telemetry = retryTelemetry({ testNodes: [
      testCase("ComboboxTests/testSearch()", ["Failed"]),
      testCase("CommandTests/testSearch()", ["Passed"])
    ] }, "");
    expect(telemetry.recoveredTests).toEqual([]);
    expect(telemetry.attempts).toHaveLength(2);
    expect(telemetry.attempts[0].result).toBe("Failed");
  });

  it("retains nested tests and reports a clean single attempt without retry recovery", () => {
    const telemetry = retryTelemetry({ testNodes: [{
      name: "SmokeUITests", nodeType: "Test Suite",
      children: [testCase("SmokeUITests/testSearch()", ["Passed"])]
    }] }, "");
    expect(telemetry.attempts).toEqual([{
      attempt: "Only run", identifier: "SmokeUITests/testSearch()", name: "testSearch()", result: "Passed"
    }]);
    expect(telemetry.recoveredTests).toEqual([]);
  });
});
