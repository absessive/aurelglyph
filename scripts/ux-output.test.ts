import { dirname, join, parse } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveUxOutputRoot } from "./ux-output.mjs";

const fixtureRoot = parse(process.cwd()).root;
const options = {
  home: join(fixtureRoot, "Users", "example"),
  temporaryRoot: join(fixtureRoot, "private", "tmp"),
  workspace: join(fixtureRoot, "work", "aurelglyph")
};

describe("UX output safety", () => {
  it("accepts only workspace and temporary-directory descendants", () => {
    const temporaryOutput = join(options.temporaryRoot, "aurelglyph-artifacts");
    const workspaceOutput = join(options.workspace, "artifacts", "ux");
    expect(resolveUxOutputRoot(temporaryOutput, options)).toBe(temporaryOutput);
    expect(resolveUxOutputRoot(workspaceOutput, options)).toBe(workspaceOutput);
    expect(resolveUxOutputRoot(undefined, options)).toBe(join(options.temporaryRoot, "aurelglyph-ux-regression"));
  });

  it.each([
    fixtureRoot,
    options.temporaryRoot,
    options.home,
    dirname(options.workspace),
    options.workspace,
    join(options.home, "Documents"),
    join(fixtureRoot, "var", "build-output")
  ])("rejects unsafe output root %s", (candidate) => {
    expect(() => resolveUxOutputRoot(candidate, options)).toThrow(/Refusing unsafe|must be inside/u);
  });
});
