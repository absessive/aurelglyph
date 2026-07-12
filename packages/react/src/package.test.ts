import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const packageRoot = join(import.meta.dirname, "..");

async function read(path: string): Promise<string> {
  return readFile(join(packageRoot, path), "utf8");
}

describe("React package contract", () => {
  it("exports built JavaScript, declarations, and component styles", async () => {
    const packageJson = JSON.parse(await read("package.json")) as Record<string, unknown>;

    expect(packageJson).toEqual({
      name: "@aurelglyph/react",
      version: "0.4.0",
      license: "MIT",
      type: "module",
      main: "dist/index.js",
      types: "dist/index.d.ts",
      style: "dist/styles.css",
      sideEffects: ["*.css", "dist/*.css", "src/*.css"],
      files: ["dist", "src/styles.css", "README.md", "LICENSE.md"],
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          default: "./dist/index.js"
        },
        "./styles.css": "./dist/styles.css"
      },
      scripts: {
        build: "node scripts/clean.mjs && tsc -p tsconfig.json && node scripts/build.mjs",
        prepare: "npm run build",
        test: "vitest run src/**/*.test.ts"
      },
      peerDependencies: {
        react: "^19.1.0"
      },
      dependencies: {
        "@aurelglyph/tokens": "0.4.0"
      }
    });
  });

  it("publishes built component CSS that matches the source stylesheet", async () => {
    const source = await read("src/styles.css");
    const built = await read("dist/styles.css");

    expect(built).toBe(source);
  });

  it("exports the expandable section component contract", async () => {
    const source = await read("src/index.ts");

    expect(source).toContain('export { ExpandableSection } from "./components/ExpandableSection.js";');
    expect(source).toContain('export type { ExpandableSectionProps } from "./components/ExpandableSection.js";');
  });
});
