import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type PackageJson = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

type PackageLock = {
  version?: string;
  packages?: Record<string, PackageJson>;
};

export type VersionMismatch = {
  actual: string | undefined;
  expected: string;
  packagePath: string;
};

export type VersionCheckResult = {
  hasChangelogEntry: boolean;
  mismatches: VersionMismatch[];
  ok: boolean;
  version: string;
};

export type ReleaseCheckResult = VersionCheckResult & {
  releaseNotesArePromoted: boolean;
  unreleasedBody: string;
};

export const workspacePackagePaths = [
  "packages/tokens",
  "packages/css",
  "packages/react",
  "packages/react-native",
  "packages/swift",
  "packages/rails",
  "examples/react-vite",
  "examples/react-native-smoke",
  "examples/swiftui-smoke"
] as const;

const versionedArtifacts = [
  {
    path: "component-manifest.json",
    pattern: /"release": "([^"]+)"/u,
    replacement: (version: string) => `"release": "${version}"`
  },
  {
    path: "README.md",
    pattern: /Current version: `([^`]+)`/u,
    replacement: (version: string) => `Current version: \`${version}\``
  },
  {
    path: "README.md",
    pattern: /\.package\(url: "https:\/\/github\.com\/absessive\/aurelglyph\.git", from: "([^"]+)"\)/u,
    replacement: (version: string) => `.package(url: "https://github.com/absessive/aurelglyph.git", from: "${version}")`
  },
  {
    path: "preview/index.html",
    pattern: /Aurelglyph Static Preview · v([^<]+)/u,
    replacement: (version: string) => `Aurelglyph Static Preview · v${version}`
  },
  {
    path: "examples/react-vite/index.html",
    pattern: /Aurelglyph React · v([^<]+)/u,
    replacement: (version: string) => `Aurelglyph React · v${version}`
  },
  {
    path: "examples/react-vite/src/App.tsx",
    pattern: /const packageVersion = "([^"]+)";/u,
    replacement: (version: string) => `const packageVersion = "${version}";`
  },
  {
    path: "packages/rails/lib/aurelglyph/rails/version.rb",
    pattern: /VERSION = "([^"]+)"/u,
    replacement: (version: string) => `VERSION = "${version}"`
  },
  {
    path: "packages/swift/README.md",
    pattern: /\.package\(url: "https:\/\/github\.com\/absessive\/aurelglyph\.git", from: "([^"]+)"\)/u,
    replacement: (version: string) => `.package(url: "https://github.com/absessive/aurelglyph.git", from: "${version}")`
  },
  {
    path: "docs/consuming.md",
    pattern: /\.package\(url: "https:\/\/github\.com\/absessive\/aurelglyph\.git", from: "([^"]+)"\)/u,
    replacement: (version: string) => `.package(url: "https://github.com/absessive/aurelglyph.git", from: "${version}")`
  },
  {
    path: "docs/roadmap.md",
    pattern: /Current version: `([^`]+)`/u,
    replacement: (version: string) => `Current version: \`${version}\``
  },
  ...["Gemfile.lock", "gemfiles/rails-7.gemfile.lock", "gemfiles/rails-8.gemfile.lock"].map((path) => ({
    path,
    pattern: /^PATH\r?\n  remote: [^\r\n]+\r?\n  specs:\r?\n    aurelglyph-rails \(([^)\r\n]+)\)/mu,
    replacement: (version: string, match: string) => match.replace(/aurelglyph-rails \([^)]+\)$/u, `aurelglyph-rails (${version})`)
  })),
  {
    path: "docs/index.html",
    pattern: /Current release<strong>Version ([^<]+)<\/strong>/u,
    replacement: (version: string) => `Current release<strong>Version ${version}</strong>`
  },
  {
    path: "docs/components.html",
    pattern: /Version ([0-9]+\.[0-9]+\.[0-9]+) declares/u,
    replacement: (version: string) => `Version ${version} declares`
  },
  {
    path: "docs/component-manifest.json",
    pattern: /"release": "([^"]+)"/u,
    replacement: (version: string) => `"release": "${version}"`
  }
] as const;

export const versionedArtifactPaths = versionedArtifacts.map(({ path }) => path);

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceDependencyNames = new Set([
  "@aurelglyph/tokens",
  "@aurelglyph/css",
  "@aurelglyph/react",
  "@aurelglyph/react-native",
  "@aurelglyph/swift",
  "aurelglyph-rails",
  "@aurelglyph/example-react-vite"
]);

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function changelogHasVersion(changelog: string, version: string): boolean {
  return new RegExp(`^##\\s+\\[?${version.replace(/\./g, "\\.")}\\]?\\s*$`, "m").test(changelog);
}

function syncDependencySet(dependencies: Record<string, string> | undefined, version: string): void {
  if (!dependencies) return;
  for (const name of Object.keys(dependencies)) {
    if (workspaceDependencyNames.has(name)) {
      dependencies[name] = version;
    }
  }
}

function checkDependencySet(
  dependencies: Record<string, string> | undefined,
  version: string,
  packagePath: string,
  field: string,
  mismatches: VersionMismatch[]
): void {
  if (!dependencies) return;
  for (const [name, actual] of Object.entries(dependencies)) {
    if (workspaceDependencyNames.has(name) && actual !== version) {
      mismatches.push({ actual, expected: version, packagePath: `${packagePath}#${field}.${name}` });
    }
  }
}

function sectionBody(markdown: string, heading: string): string | undefined {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const headingMatch = new RegExp(`^##\\s+${escaped}\\s*$`, "mu").exec(markdown);
  if (!headingMatch) return undefined;
  const bodyStart = headingMatch.index + headingMatch[0].length;
  const remainder = markdown.slice(bodyStart).replace(/^\r?\n/u, "");
  const nextHeading = /^##\s/mu.exec(remainder);
  return remainder.slice(0, nextHeading?.index ?? remainder.length).trim();
}

async function readRootVersion(root: string): Promise<string> {
  const rootPackage = await readJson<PackageJson>(join(root, "package.json"));
  if (!rootPackage.version) {
    throw new Error("Root package.json must define a version.");
  }
  return rootPackage.version;
}

export async function checkWorkspaceVersions(root = repoRoot): Promise<VersionCheckResult> {
  const version = await readRootVersion(root);
  const mismatches: VersionMismatch[] = [];

  for (const packagePath of workspacePackagePaths) {
    const packageJson = await readJson<PackageJson>(join(root, packagePath, "package.json"));
    if (packageJson.version !== version) {
      mismatches.push({ actual: packageJson.version, expected: version, packagePath });
    }
    checkDependencySet(packageJson.dependencies, version, `${packagePath}/package.json`, "dependencies", mismatches);
    checkDependencySet(packageJson.devDependencies, version, `${packagePath}/package.json`, "devDependencies", mismatches);
    checkDependencySet(packageJson.peerDependencies, version, `${packagePath}/package.json`, "peerDependencies", mismatches);
  }

  const lock = await readJson<PackageLock>(join(root, "package-lock.json")).catch(() => undefined);
  if (!lock) {
    mismatches.push({ actual: undefined, expected: version, packagePath: "package-lock.json" });
  } else {
    if (lock.version !== version) {
      mismatches.push({ actual: lock.version, expected: version, packagePath: "package-lock.json#version" });
    }
    const lockPackages = lock.packages ?? {};
    const rootLockPackage = lockPackages[""];
    if (rootLockPackage?.version !== version) {
      mismatches.push({ actual: rootLockPackage?.version, expected: version, packagePath: "package-lock.json#packages[''].version" });
    }
    for (const packagePath of workspacePackagePaths) {
      const packageInfo = lockPackages[packagePath];
      if (packageInfo?.version !== version) {
        mismatches.push({ actual: packageInfo?.version, expected: version, packagePath: `package-lock.json#packages['${packagePath}'].version` });
      }
    }
    for (const [lockPath, packageInfo] of Object.entries(lockPackages)) {
      checkDependencySet(packageInfo.dependencies, version, `package-lock.json#packages['${lockPath}']`, "dependencies", mismatches);
      checkDependencySet(packageInfo.devDependencies, version, `package-lock.json#packages['${lockPath}']`, "devDependencies", mismatches);
      checkDependencySet(packageInfo.peerDependencies, version, `package-lock.json#packages['${lockPath}']`, "peerDependencies", mismatches);
    }
  }

  for (const artifact of versionedArtifacts) {
    const content = await readFile(join(root, artifact.path), "utf8").catch(() => undefined);
    const actual = content ? artifact.pattern.exec(content)?.[1] : undefined;
    if (actual !== version) {
      mismatches.push({ actual, expected: version, packagePath: artifact.path });
    }
  }

  const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8").catch(() => "");
  const hasChangelogEntry = changelogHasVersion(changelog, version);

  return {
    hasChangelogEntry,
    mismatches,
    ok: mismatches.length === 0 && hasChangelogEntry,
    version
  };
}

export async function checkReleaseReadiness(root = repoRoot): Promise<ReleaseCheckResult> {
  const result = await checkWorkspaceVersions(root);
  const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8").catch(() => "");
  const unresolvedSection = sectionBody(changelog, "Unreleased");
  const unreleasedBody = unresolvedSection ?? "";
  const releaseBody = sectionBody(changelog, result.version) ?? "";
  const releaseNotesArePromoted = unresolvedSection !== undefined && unreleasedBody.length === 0 && releaseBody.length > 0;
  return {
    ...result,
    ok: result.ok && releaseNotesArePromoted,
    releaseNotesArePromoted,
    unreleasedBody
  };
}

export async function syncWorkspaceVersions(root = repoRoot, changelogItems: string[] = []): Promise<void> {
  const version = await readRootVersion(root);

  for (const packagePath of workspacePackagePaths) {
    const path = join(root, packagePath, "package.json");
    const packageJson = await readJson<PackageJson>(path);
    packageJson.version = version;
    syncDependencySet(packageJson.dependencies, version);
    syncDependencySet(packageJson.devDependencies, version);
    syncDependencySet(packageJson.peerDependencies, version);
    await writeJson(path, packageJson);
  }

  await syncPackageLock(root, version);
  await syncVersionedArtifacts(root, version);
  await syncChangelog(root, version, changelogItems);
}

async function syncVersionedArtifacts(root: string, version: string): Promise<void> {
  for (const artifact of versionedArtifacts) {
    const path = join(root, artifact.path);
    const content = await readFile(path, "utf8");
    if (!artifact.pattern.test(content)) {
      throw new Error(`Unable to locate version marker in ${artifact.path}.`);
    }
    await writeFile(path, content.replace(artifact.pattern, (match) => artifact.replacement(version, match)));
  }
}

async function syncPackageLock(root: string, version: string): Promise<void> {
  const path = join(root, "package-lock.json");
  const lock = await readJson<PackageLock>(path).catch(() => undefined);
  if (!lock?.packages) return;

  lock.version = version;

  if (lock.packages[""]) {
    lock.packages[""].version = version;
  }

  for (const packagePath of workspacePackagePaths) {
    if (lock.packages[packagePath]) {
      lock.packages[packagePath].version = version;
    }
  }

  for (const packageInfo of Object.values(lock.packages)) {
    syncDependencySet(packageInfo.dependencies, version);
    syncDependencySet(packageInfo.devDependencies, version);
    syncDependencySet(packageInfo.peerDependencies, version);
  }

  await writeJson(path, lock);
}

async function syncChangelog(root: string, version: string, changelogItems: string[]): Promise<void> {
  const path = join(root, "CHANGELOG.md");
  const current = await readFile(path, "utf8").catch(() => "# Changelog\n");
  if (changelogHasVersion(current, version)) return;

  const unreleasedBody = sectionBody(current, "Unreleased") ?? "";
  const explicitItems = changelogItems.map((item) => `- ${item}`).join("\n");
  const releaseBody = [unreleasedBody, explicitItems].filter(Boolean).join("\n");
  const resolvedBody = releaseBody || "- Synchronize cross-platform package versions.";
  const entry = [`## ${version}`, "", resolvedBody, ""].join("\n");
  const normalized = current.trimEnd();

  if (normalized === "# Changelog") {
    await writeFile(path, `${normalized}\n\n${entry}\n`);
    return;
  }

  const withoutPromotedUnreleased = normalized.replace(
    /^##\s+Unreleased\s*$\n[\s\S]*?(?=^##\s)/mu,
    ""
  );
  await writeFile(
    path,
    `${withoutPromotedUnreleased.replace(/^# Changelog\n*/u, `# Changelog\n\n## Unreleased\n\n${entry}\n`)}\n`
  );
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "check";
  const changelogItems = process.argv.slice(3);

  if (command === "check") {
    const result = await checkWorkspaceVersions();
    if (!result.ok) {
      for (const mismatch of result.mismatches) {
        console.error(`${mismatch.packagePath}: ${mismatch.actual ?? "missing"} !== ${mismatch.expected}`);
      }
      if (!result.hasChangelogEntry) {
        console.error(`CHANGELOG.md is missing an entry for ${result.version}`);
      }
      process.exitCode = 1;
      return;
    }
    console.log(`Aurelglyph workspace version ${result.version} is synchronized.`);
    return;
  }

  if (command === "release-check") {
    const result = await checkReleaseReadiness();
    if (!result.ok) {
      for (const mismatch of result.mismatches) {
        console.error(`${mismatch.packagePath}: ${mismatch.actual ?? "missing"} !== ${mismatch.expected}`);
      }
      if (!result.hasChangelogEntry) {
        console.error(`CHANGELOG.md is missing an entry for ${result.version}`);
      }
      if (!result.releaseNotesArePromoted) {
        console.error("CHANGELOG.md must have an empty Unreleased section and non-empty notes for the release version.");
      }
      process.exitCode = 1;
      return;
    }
    console.log(`Aurelglyph release metadata ${result.version} is synchronized and promoted.`);
    return;
  }

  if (command === "sync") {
    await syncWorkspaceVersions(repoRoot, changelogItems);
    const result = await checkWorkspaceVersions();
    if (!result.ok) {
      throw new Error("Version sync completed but check still failed.");
    }
    console.log(`Synchronized Aurelglyph workspace version ${result.version}.`);
    return;
  }

  throw new Error(`Unknown versioning command: ${command}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
