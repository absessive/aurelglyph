import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const npmRegistry = "https://registry.npmjs.org";
const rubyGemsRegistry = "https://rubygems.org";
const repoRoot = fileURLToPath(new URL("../", import.meta.url));

const npmPackageDirectories = [
  "packages/tokens",
  "packages/css",
  "packages/react",
  "packages/react-native"
] as const;

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

function environmentWithoutReleaseSecrets(): NodeJS.ProcessEnv {
  const environment = { ...process.env };
  delete environment.NODE_AUTH_TOKEN;
  delete environment.GEM_HOST_API_KEY;
  return environment;
}

type NpmPackOutput = {
  filename?: string;
  integrity?: string;
  name?: string;
  version?: string;
};

type NpmArtifact = {
  integrity: string;
  name: string;
  path: string;
  version: string;
};

type NpmRemoteState =
  | { kind: "missing-package" }
  | { kind: "missing-version" }
  | { integrity: string; kind: "published" };

type GemArtifact = {
  integrity: string;
  name: string;
  path: string;
  version: string;
};

type GemRemoteState =
  | { kind: "missing-version" }
  | { integrity: string; kind: "published" };

export type ReleaseAction = "publish" | "skip";

function redact(value: string): string {
  let redacted = value;
  for (const secretName of ["NODE_AUTH_TOKEN", "GEM_HOST_API_KEY"]) {
    const secret = process.env[secretName];
    if (secret) redacted = redacted.replaceAll(secret, "[redacted]");
  }
  return redacted;
}

function run(command: string, args: string[], options: CommandOptions = {}): string {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    env: options.env ?? environmentWithoutReleaseSecrets(),
    maxBuffer: 20 * 1024 * 1024
  });

  if (result.error) {
    throw new Error(`${command} could not be started: ${redact(result.error.message)}`);
  }
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr]
      .filter((part): part is string => Boolean(part?.trim()))
      .map((part) => redact(part.trim()))
      .join("\n");
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}.${details ? `\n${details}` : ""}`);
  }
  return result.stdout;
}

function requireSecret(name: "GEM_HOST_API_KEY" | "NODE_AUTH_TOKEN"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for this release operation.`);
  return value;
}

function sha512Integrity(contents: Buffer): string {
  return `sha512-${createHash("sha512").update(contents).digest("base64")}`;
}

function sha256(contents: string | Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

async function fetchResponse(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json", "cache-control": "no-cache" },
      signal: AbortSignal.timeout(30_000)
    });
  } catch (error) {
    throw new Error(`Registry request failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const response = await fetchResponse(url);
  if (!response.ok) throw new Error(`Registry request for ${url} returned HTTP ${response.status}.`);
  return Buffer.from(await response.arrayBuffer());
}

async function rootVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8")) as { version?: string };
  if (!packageJson.version) throw new Error("Root package.json does not define a release version.");
  return packageJson.version;
}

export function planNpmArtifact(
  name: string,
  localIntegrity: string,
  remote: NpmRemoteState,
  hasBootstrapToken: boolean
): ReleaseAction {
  if (remote.kind === "published") {
    if (remote.integrity !== localIntegrity) {
      throw new Error(
        `${name} is already published at this version, but its registry integrity does not match the local tarball.`
      );
    }
    return "skip";
  }
  if (remote.kind === "missing-package" && !hasBootstrapToken) {
    throw new Error(
      `${name} does not exist on npm. Configure the protected NPM_BOOTSTRAP_TOKEN secret for its first publication.`
    );
  }
  return "publish";
}

export function planGemArtifact(
  name: string,
  localIntegrity: string,
  remote: GemRemoteState,
  hasApiKey: boolean
): ReleaseAction {
  if (remote.kind === "published") {
    if (remote.integrity !== localIntegrity) {
      throw new Error(
        `${name} is already published at this version, but its registry artifact does not match the local gem.`
      );
    }
    return "skip";
  }
  if (!hasApiKey) throw new Error("GEM_HOST_API_KEY is required to publish a missing RubyGems version.");
  return "publish";
}

async function packNpmArtifacts(directory: string, version: string): Promise<NpmArtifact[]> {
  const artifacts: NpmArtifact[] = [];

  for (const packageDirectory of npmPackageDirectories) {
    const absolutePackageDirectory = join(repoRoot, packageDirectory);
    const packageJson = JSON.parse(
      await readFile(join(absolutePackageDirectory, "package.json"), "utf8")
    ) as { name?: string; version?: string };
    if (!packageJson.name || packageJson.version !== version) {
      throw new Error(
        `${packageDirectory}/package.json must have a name and the root release version ${version}.`
      );
    }

    const output = JSON.parse(
      run("npm", ["pack", ".", "--ignore-scripts", "--json", "--pack-destination", directory], {
        cwd: absolutePackageDirectory
      })
    ) as NpmPackOutput[];
    const packed = output[0];
    if (!packed?.filename || packed.name !== packageJson.name || packed.version !== version) {
      throw new Error(`npm pack returned unexpected metadata for ${packageJson.name}.`);
    }

    const archivePath = resolve(directory, packed.filename);
    if (dirname(archivePath) !== resolve(directory)) {
      throw new Error(`npm pack returned an unsafe archive path for ${packageJson.name}.`);
    }
    const integrity = sha512Integrity(await readFile(archivePath));
    if (packed.integrity && packed.integrity !== integrity) {
      throw new Error(`npm pack reported the wrong integrity for ${packageJson.name}.`);
    }
    artifacts.push({ integrity, name: packageJson.name, path: archivePath, version });
  }

  return artifacts;
}

type NpmPackument = {
  versions?: Record<string, { dist?: { integrity?: string } }>;
};

async function npmRemoteState(artifact: NpmArtifact): Promise<NpmRemoteState> {
  const response = await fetchResponse(`${npmRegistry}/${encodeURIComponent(artifact.name)}?release=${Date.now()}`);
  if (response.status === 404) return { kind: "missing-package" };
  if (!response.ok) {
    throw new Error(`npm returned HTTP ${response.status} while checking ${artifact.name}@${artifact.version}.`);
  }
  const packument = await response.json() as NpmPackument;
  const publishedVersion = packument.versions?.[artifact.version];
  if (!publishedVersion) return { kind: "missing-version" };
  const integrity = publishedVersion.dist?.integrity;
  if (!integrity) {
    throw new Error(`npm did not provide integrity metadata for ${artifact.name}@${artifact.version}.`);
  }
  return { integrity, kind: "published" };
}

async function packGem(directory: string, version: string): Promise<GemArtifact> {
  const name = "aurelglyph-rails";
  const path = join(directory, `${name}-${version}.gem`);
  const commitTimestamp = run("git", ["show", "-s", "--format=%ct", "HEAD"]).trim();
  run("gem", ["build", "aurelglyph-rails.gemspec", "--output", path], {
    cwd: join(repoRoot, "packages/rails"),
    env: { ...environmentWithoutReleaseSecrets(), SOURCE_DATE_EPOCH: commitTimestamp }
  });
  run("ruby", [
    "-rrubygems/package",
    "-e",
    "package = Gem::Package.new(ARGV.fetch(0)); abort 'wrong gem identity' unless package.spec.name == ARGV.fetch(1) && package.spec.version.to_s == ARGV.fetch(2)",
    path,
    name,
    version
  ]);
  return { integrity: sha256(await readFile(path)), name, path, version };
}

async function gemRemoteState(artifact: GemArtifact): Promise<GemRemoteState> {
  const metadataUrl = `${rubyGemsRegistry}/api/v2/rubygems/${artifact.name}/versions/${artifact.version}.json`;
  const response = await fetchResponse(`${metadataUrl}?release=${Date.now()}`);
  if (response.status === 404) return { kind: "missing-version" };
  if (!response.ok) {
    throw new Error(`RubyGems returned HTTP ${response.status} while checking ${artifact.name} ${artifact.version}.`);
  }

  const remoteGem = await fetchBuffer(
    `${rubyGemsRegistry}/downloads/${artifact.name}-${artifact.version}.gem?release=${Date.now()}`
  );
  return { integrity: sha256(remoteGem), kind: "published" };
}

async function waitForNpmArtifact(artifact: NpmArtifact): Promise<void> {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const remote = await npmRemoteState(artifact);
    if (remote.kind === "published") {
      planNpmArtifact(`${artifact.name}@${artifact.version}`, artifact.integrity, remote, true);
      return;
    }
    if (attempt < 12) await new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000));
  }
  throw new Error(`npm did not expose ${artifact.name}@${artifact.version} within 60 seconds.`);
}

async function waitForGemArtifact(artifact: GemArtifact): Promise<void> {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const remote = await gemRemoteState(artifact);
    if (remote.kind === "published") {
      planGemArtifact(`${artifact.name} ${artifact.version}`, artifact.integrity, remote, true);
      return;
    }
    if (attempt < 12) await new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000));
  }
  throw new Error(`RubyGems did not expose ${artifact.name} ${artifact.version} within 60 seconds.`);
}

async function publishNpmArtifact(artifact: NpmArtifact, env: NodeJS.ProcessEnv): Promise<void> {
  try {
    run("npm", ["publish", artifact.path, "--access", "public", "--provenance", "--registry", npmRegistry], { env });
  } catch (publishError) {
    const remote = await npmRemoteState(artifact);
    if (remote.kind !== "published" || remote.integrity !== artifact.integrity) throw publishError;
  }
  await waitForNpmArtifact(artifact);
}

async function publishGemArtifact(artifact: GemArtifact): Promise<void> {
  try {
    run("gem", ["push", artifact.path], {
      env: { ...environmentWithoutReleaseSecrets(), GEM_HOST_API_KEY: requireSecret("GEM_HOST_API_KEY") }
    });
  } catch (publishError) {
    const remote = await gemRemoteState(artifact);
    if (remote.kind !== "published" || remote.integrity !== artifact.integrity) throw publishError;
  }
  await waitForGemArtifact(artifact);
}

async function release(mode: "all" | "gem" | "npm"): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "aurelglyph-release-"));
  try {
    const version = await rootVersion();
    const npmArtifacts = mode === "all" || mode === "npm"
      ? await packNpmArtifacts(directory, version)
      : [];
    const gemArtifact = mode === "all" || mode === "gem"
      ? await packGem(directory, version)
      : undefined;

    // Resolve and validate every registry state before publishing anything.
    const npmStates = await Promise.all(npmArtifacts.map((artifact) => npmRemoteState(artifact)));
    const gemState = gemArtifact ? await gemRemoteState(gemArtifact) : undefined;
    const hasBootstrapToken = Boolean(process.env.NODE_AUTH_TOKEN?.trim());
    const hasGemApiKey = Boolean(process.env.GEM_HOST_API_KEY?.trim());
    const npmActions = npmArtifacts.map((artifact, index) =>
      planNpmArtifact(`${artifact.name}@${artifact.version}`, artifact.integrity, npmStates[index], hasBootstrapToken)
    );
    const gemAction = gemArtifact && gemState
      ? planGemArtifact(`${gemArtifact.name} ${gemArtifact.version}`, gemArtifact.integrity, gemState, hasGemApiKey)
      : undefined;

    if (npmStates.some((state) => state.kind === "missing-package")) {
      const bootstrapToken = requireSecret("NODE_AUTH_TOKEN");
      const bootstrapConfig = join(directory, "npm-bootstrap.npmrc");
      await writeFile(bootstrapConfig, "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n", { mode: 0o600 });
      // Capture the identity instead of echoing it; this validates the bootstrap
      // credential without exposing either the token or account name in logs.
      run("npm", ["whoami", "--registry", npmRegistry], {
        env: {
          ...environmentWithoutReleaseSecrets(),
          NODE_AUTH_TOKEN: bootstrapToken,
          NPM_CONFIG_USERCONFIG: bootstrapConfig
        }
      });
    }
    if (gemAction === "publish") requireSecret("GEM_HOST_API_KEY");

    for (const [index, artifact] of npmArtifacts.entries()) {
      if (npmActions[index] === "skip") {
        console.log(`Verified existing ${artifact.name}@${artifact.version}.`);
      } else {
        const bootstrapPublication = npmStates[index]?.kind === "missing-package";
        const npmEnvironment = environmentWithoutReleaseSecrets();
        if (bootstrapPublication) {
          npmEnvironment.NODE_AUTH_TOKEN = requireSecret("NODE_AUTH_TOKEN");
          npmEnvironment.NPM_CONFIG_USERCONFIG = join(directory, "npm-bootstrap.npmrc");
        }
        await publishNpmArtifact(artifact, npmEnvironment);
        console.log(`Published and verified ${artifact.name}@${artifact.version}.`);
      }
    }

    if (gemArtifact && gemAction === "skip") {
      console.log(`Verified existing ${gemArtifact.name} ${gemArtifact.version}.`);
    } else if (gemArtifact && gemAction === "publish") {
      await publishGemArtifact(gemArtifact);
      console.log(`Published and verified ${gemArtifact.name} ${gemArtifact.version}.`);
    }
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (entryPath === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode !== "all" && mode !== "npm" && mode !== "gem") {
    console.error("Usage: release-registry.ts <all|npm|gem>");
    process.exitCode = 2;
  } else {
    release(mode).catch((error: unknown) => {
      console.error(redact(error instanceof Error ? error.message : String(error)));
      process.exitCode = 1;
    });
  }
}
