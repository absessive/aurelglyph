import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("patched development dependencies", () => {
  it("locks shell-quote 1.12.0 and rejects line terminators after a comment", async () => {
    const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8")) as {
      packages: Record<string, { version?: string }>;
    };
    expect(lock.packages["node_modules/shell-quote"]?.version).toBe("1.12.0");
    const { quote, parse } = require("shell-quote") as {
      quote: (tokens: Array<string | { comment: string }>) => string;
      parse: (command: string) => unknown[];
    };
    const tokens = ["echo", "a path with spaces", "it's literal", "$(not-a-command)"];
    expect(parse(quote(tokens))).toEqual(tokens);
    for (const terminator of ["\n", "\r", "\u2028", "\u2029"]) {
      expect(() => quote(["echo", { comment: "local note" }, `value${terminator}command`])).toThrow(TypeError);
    }
  });

  it("retains every esbuild platform dependency required by clean installs", async () => {
    const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8")) as {
      packages: Record<string, { version?: string; optionalDependencies?: Record<string, string> }>;
    };
    const esbuildEntries = Object.entries(lock.packages).filter(([path]) => path.endsWith("/esbuild"));
    expect(esbuildEntries.length).toBeGreaterThan(0);
    for (const [path, entry] of esbuildEntries) {
      expect(Object.keys(entry.optionalDependencies ?? {}).length).toBeGreaterThan(0);
      for (const [name, version] of Object.entries(entry.optionalDependencies ?? {})) {
        const platformPath = `${path.slice(0, -"esbuild".length)}${name}`;
        expect(lock.packages[platformPath]?.version, platformPath).toBe(version);
      }
    }
  });

  it("keeps the scoped Istanbul YAML upgrade compatible with coverage configuration", async () => {
    const { loadNycConfig } = require("@istanbuljs/load-nyc-config") as {
      loadNycConfig: (options: { cwd: string; nycrcPath: string }) => Promise<Record<string, unknown>>;
    };
    const directory = await mkdtemp(join(tmpdir(), "aurelglyph-nyc-config-"));
    try {
      await writeFile(join(directory, "package.json"), JSON.stringify({ private: true }));
      await writeFile(join(directory, "base.yaml"), "all: true\ncheck-coverage: true\nlines: 90\nexclude:\n  - '**/*.test.ts'\n");
      await writeFile(join(directory, "nyc.yaml"), "extends: ./base.yaml\ninclude: src/**/*.ts\nreporter:\n  - text\n  - json\n");

      const configuration = await loadNycConfig({ cwd: directory, nycrcPath: "nyc.yaml" });
      expect(configuration).toMatchObject({
        cwd: directory,
        all: true,
        checkCoverage: true,
        lines: 90,
        exclude: ["**/*.test.ts"],
        include: ["src/**/*.ts"],
        reporter: ["text", "json"]
      });
      expect(configuration).not.toHaveProperty("extends");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("locks the source-map fix and removes the obsolete sprintf dependency", async () => {
    const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8")) as {
      packages: Record<string, { version?: string }>;
    };
    expect(lock.packages["node_modules/source-map-js"]?.version).toBe("1.2.2");
    expect(Object.keys(lock.packages).some((path) => /(?:^|\/)node_modules\/sprintf-js$/u.test(path))).toBe(false);
    const nycRequire = createRequire(require.resolve("@istanbuljs/load-nyc-config"));
    expect((nycRequire("js-yaml/package.json") as { version: string }).version).toBe("4.3.2");
  });

  it("exposes a valid overridden YAML dependency graph to npm tooling", () => {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) throw new Error("Run the unit suite through npm so its CLI path is available.");
    const result = spawnSync(process.execPath, [npmCli, "ls", "js-yaml", "--all", "--json"], {
      cwd: new URL("../", import.meta.url),
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      timeout: 5_000
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(JSON.parse(result.stdout)).not.toHaveProperty("problems");
  });
});
