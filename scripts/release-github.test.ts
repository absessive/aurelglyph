import { describe, expect, it } from "vitest";

import { isPrereleaseTag, planGitHubRelease } from "./release-github";

const expected = {
  draft: false,
  name: "Aurelglyph v0.8.0",
  prerelease: false,
  tag_name: "v0.8.0"
};

describe("GitHub release publication", () => {
  it("creates a missing release and skips an exact published release", () => {
    expect(planGitHubRelease("v0.8.0", "Aurelglyph v0.8.0", false, null)).toBe("create");
    expect(planGitHubRelease("v0.8.0", "Aurelglyph v0.8.0", false, expected)).toBe("skip");
  });

  it("recognizes prerelease identifiers without treating build metadata as a prerelease", () => {
    expect(isPrereleaseTag("v1.0.0-rc.1")).toBe(true);
    expect(isPrereleaseTag("v1.0.0-rc.1+build.2")).toBe(true);
    expect(isPrereleaseTag("v1.0.0+build.2")).toBe(false);
  });

  it("skips an exact existing prerelease", () => {
    const prerelease = {
      ...expected,
      name: "Aurelglyph v1.0.0-rc.1",
      prerelease: true,
      tag_name: "v1.0.0-rc.1"
    };
    expect(planGitHubRelease("v1.0.0-rc.1", prerelease.name, true, prerelease)).toBe("skip");
  });

  it.each([
    { ...expected, draft: true },
    { ...expected, name: "Unexpected title" },
    { ...expected, prerelease: true },
    { ...expected, tag_name: "v0.8.1" }
  ])("rejects conflicting existing release metadata", (release) => {
    expect(() => planGitHubRelease("v0.8.0", "Aurelglyph v0.8.0", false, release)).toThrow(/unexpected metadata/u);
  });
});
