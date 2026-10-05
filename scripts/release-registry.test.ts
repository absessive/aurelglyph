import { describe, expect, it } from "vitest";

import { planGemArtifact, planNpmArtifact } from "./release-registry";

describe("npm release recovery planning", () => {
  it("skips an exact version only when its integrity matches", () => {
    expect(planNpmArtifact(
      "@aurelglyph/tokens@1.2.3",
      "sha512-local",
      { integrity: "sha512-local", kind: "published" },
      false
    )).toBe("skip");
  });

  it("fails closed when an existing exact version has different bytes", () => {
    expect(() => planNpmArtifact(
      "@aurelglyph/tokens@1.2.3",
      "sha512-local",
      { integrity: "sha512-remote", kind: "published" },
      true
    )).toThrow(/does not match the local tarball/u);
  });

  it("publishes a missing version through trusted publishing without a bootstrap token", () => {
    expect(planNpmArtifact(
      "@aurelglyph/tokens@1.2.3",
      "sha512-local",
      { kind: "missing-version" },
      false
    )).toBe("publish");
  });

  it("requires a bootstrap token before publishing a new package name", () => {
    expect(() => planNpmArtifact(
      "@aurelglyph/react@1.2.3",
      "sha512-local",
      { kind: "missing-package" },
      false
    )).toThrow(/NPM_BOOTSTRAP_TOKEN/u);
    expect(planNpmArtifact(
      "@aurelglyph/react@1.2.3",
      "sha512-local",
      { kind: "missing-package" },
      true
    )).toBe("publish");
  });
});

describe("RubyGems release recovery planning", () => {
  it("skips an exact version only when its artifact integrity matches", () => {
    expect(planGemArtifact(
      "aurelglyph-rails 1.2.3",
      "local-integrity",
      { integrity: "local-integrity", kind: "published" },
      false
    )).toBe("skip");
  });

  it("fails closed when the existing exact version differs", () => {
    expect(() => planGemArtifact(
      "aurelglyph-rails 1.2.3",
      "local-integrity",
      { integrity: "remote-integrity", kind: "published" },
      true
    )).toThrow(/does not match the local gem/u);
  });

  it("requires the RubyGems credential only for a missing version", () => {
    expect(() => planGemArtifact(
      "aurelglyph-rails 1.2.3",
      "local-integrity",
      { kind: "missing-version" },
      false
    )).toThrow(/GEM_HOST_API_KEY/u);
    expect(planGemArtifact(
      "aurelglyph-rails 1.2.3",
      "local-integrity",
      { kind: "missing-version" },
      true
    )).toBe("publish");
  });
});
