import { describe, expect, it } from "vitest";

import { clamp, labelForValue, nextEnabledIndex, normalizeStep, resolveResponsiveColumns, snapValue } from "./foundation.js";

describe("React Native interaction foundations", () => {
  it("clamps and snaps numeric controls to the canonical step grid", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(snapValue(4.26, 0, 10, 0.5)).toBe(4.5);
    expect(snapValue(-5, -10, -3, 2)).toBe(-4);
    expect(snapValue(0, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 2, 0)).toBe(0);
    expect(snapValue(-5, Number.MIN_SAFE_INTEGER, -5, 2, 0)).toBe(-6);
  });

  it("normalizes invalid steps", () => {
    expect(normalizeStep(0)).toBe(1);
    expect(normalizeStep(-2)).toBe(1);
    expect(normalizeStep(Number.NaN)).toBe(1);
  });

  it("resolves responsive grids at native breakpoints", () => {
    const columns = { base: 1, sm: 2, md: 3, lg: 4 };
    expect(resolveResponsiveColumns(columns, 390)).toBe(1);
    expect(resolveResponsiveColumns(columns, 600)).toBe(2);
    expect(resolveResponsiveColumns(columns, 820)).toBe(3);
    expect(resolveResponsiveColumns(columns, 1200)).toBe(4);
    expect(resolveResponsiveColumns(Number.NaN, Number.NaN)).toBe(1);
    expect(resolveResponsiveColumns({ base: Number.POSITIVE_INFINITY, md: Number.NaN }, 820)).toBe(1);
  });

  it("cycles past disabled segmented items", () => {
    const disabled = (index: number) => index === 1 || index === 2;
    expect(nextEnabledIndex(0, 4, disabled, 1)).toBe(3);
    expect(nextEnabledIndex(3, 4, disabled, 1)).toBe(0);
  });

  it("uses option labels without inventing missing values", () => {
    const options = [{ value: "quiet", label: "Quiet mode" }];
    expect(labelForValue(options, "quiet")).toBe("Quiet mode");
    expect(labelForValue(options, "local")).toBe("local");
  });
});
