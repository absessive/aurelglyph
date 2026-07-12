import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  checkWorkspaceVersions,
  syncWorkspaceVersions,
  versionedArtifactPaths,
  workspacePackagePaths
} from "./versioning";

let tempRoots: string[] = [];

async function createWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "aurelglyph-versioning-"));
  tempRoots.push(root);
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ name: "aurelglyph", version: "1.2.3", private: true }, null, 2)
  );
  await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n\n## 1.2.3\n\n- Existing entry\n");
  await writeFile(
    join(root, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 3, packages: { "": { name: "aurelglyph", version: "0.0.1" } } }, null, 2)
  );

  for (const path of workspacePackagePaths) {
    const directory = join(root, path);
    await import("node:fs/promises").then(({ mkdir }) => mkdir(directory, { recursive: true }));
    await writeFile(
      join(directory, "package.json"),
      JSON.stringify({ name: path.replace("/", "-"), version: "0.0.1", private: true }, null, 2)
    );
  }

  const artifactContents: Record<string, string> = {
    "preview/index.html": "<p>Aurelglyph Static Preview · v0.0.1</p>",
    "examples/react-vite/index.html": "<p>Aurelglyph React · v0.0.1</p>",
    "examples/react-vite/src/App.tsx": 'const packageVersion = "0.0.1";',
    "packages/rails/lib/aurelglyph/rails/version.rb": 'VERSION = "0.0.1"'
  };

  for (const [path, contents] of Object.entries(artifactContents)) {
    const fullPath = join(root, path);
    await import("node:fs/promises").then(({ mkdir }) => mkdir(dirname(fullPath), { recursive: true }));
    await writeFile(fullPath, contents);
  }

  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })));
  tempRoots = [];
});

describe("workspace versioning", () => {
  it("reports packages that do not match the root version", async () => {
    const root = await createWorkspace();

    const result = await checkWorkspaceVersions(root);

    expect(result.version).toBe("1.2.3");
    expect(result.ok).toBe(false);
    expect(result.mismatches).toHaveLength(workspacePackagePaths.length + versionedArtifactPaths.length);
    expect(result.mismatches[0]).toMatchObject({ actual: "0.0.1", expected: "1.2.3" });
  });

  it("syncs every platform package to the root version", async () => {
    const root = await createWorkspace();

    await syncWorkspaceVersions(root);
    const result = await checkWorkspaceVersions(root);
    const packageLock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8")) as {
      version: string;
      packages: { "": { version: string } };
    };

    expect(result.ok).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(packageLock.version).toBe("1.2.3");
    expect(packageLock.packages[""].version).toBe("1.2.3");
    await expect(readFile(join(root, "preview/index.html"), "utf8")).resolves.toContain("v1.2.3");
    await expect(readFile(join(root, "examples/react-vite/src/App.tsx"), "utf8")).resolves.toContain('"1.2.3"');
  });

  it("requires a changelog section for the shared version", async () => {
    const root = await createWorkspace();
    await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n");

    const result = await checkWorkspaceVersions(root);

    expect(result.ok).toBe(false);
    expect(result.hasChangelogEntry).toBe(false);
  });

  it("can prepend a changelog entry for the shared version", async () => {
    const root = await createWorkspace();
    await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n");

    await syncWorkspaceVersions(root, ["Add cross-platform versioning support."]);
    const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");

    expect(changelog).toContain("## 1.2.3");
    expect(changelog).toContain("- Add cross-platform versioning support.");
    expect(changelog).toContain("# Changelog\n\n## 1.2.3");
  });

  it("prepends new changelog entries above existing versions", async () => {
    const root = await createWorkspace();
    await writeFile(join(root, "package.json"), JSON.stringify({ name: "aurelglyph", version: "2.0.0" }, null, 2));
    await writeFile(join(root, "CHANGELOG.md"), "# Changelog\n\n## 1.2.3\n\n- Existing entry\n");

    await syncWorkspaceVersions(root, ["Add the next release."]);
    const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");

    expect(changelog.indexOf("## 2.0.0")).toBeLessThan(changelog.indexOf("## 1.2.3"));
    expect(changelog).toContain("- Add the next release.");
  });
});
