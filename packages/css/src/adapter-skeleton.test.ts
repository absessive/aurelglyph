import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../../..");

async function read(path: string): Promise<string> {
  return readFile(join(repoRoot, path), "utf8");
}

describe("platform adapter skeletons", () => {
  it("defines the CSS package contract and base stylesheet", async () => {
    const packageJson = JSON.parse(await read("packages/css/package.json")) as Record<string, unknown>;
    const css = await read("packages/css/src/index.css");

    expect(packageJson).toEqual({
      name: "@aurelglyph/css",
      version: "0.1.0",
      private: true,
      type: "module",
      exports: {
        ".": "./src/index.css"
      },
      scripts: {
        build: "npm run build -w @aurelglyph/tokens"
      }
    });
    expect(css).toContain('@import "../../tokens/dist/generated/aurelglyph.css";');
    expect(css).toContain("box-sizing: border-box;");
    expect(css).toContain("background: var(--ag-color-semantic-background);");
    expect(css).toContain("color: var(--ag-color-semantic-foreground);");
    expect(css).toContain("font-family: var(--ag-font-family-body);");
    expect(css).toContain(".ag-focus-ring:focus-visible");
  });

  it("defines the React Native package contract and generated theme export", async () => {
    const packageJson = JSON.parse(await read("packages/react-native/package.json")) as Record<string, unknown>;
    const source = await read("packages/react-native/src/index.ts");

    expect(packageJson).toEqual({
      name: "@aurelglyph/react-native",
      version: "0.1.0",
      private: true,
      type: "module",
      main: "src/index.ts",
      types: "src/index.ts",
      scripts: {
        build: "npm run build -w @aurelglyph/tokens"
      },
      dependencies: {
        "@aurelglyph/tokens": "0.1.0"
      }
    });
    expect(source.trim()).toBe('export { aurelglyphTheme } from "../../tokens/dist/generated/react-native";');
  });

  it("defines the Swift package and copies generated Swift tokens", async () => {
    const packageSwift = await read("packages/swift/Package.swift");
    const generated = await read("packages/tokens/dist/generated/AurelglyphTokens.swift");
    const copied = await read("packages/swift/Sources/AurelglyphUI/AurelglyphTokens.swift");

    expect(packageSwift).toContain('name: "AurelglyphUI"');
    expect(packageSwift).toContain(".iOS(.v17)");
    expect(packageSwift).toContain(".macOS(.v14)");
    expect(packageSwift).toContain('.library(name: "AurelglyphUI", targets: ["AurelglyphUI"])');
    expect(packageSwift).toContain('.target(name: "AurelglyphUI")');
    expect(copied).toBe(generated);
  });

  it("defines the Rails package and copies generated Rails assets", async () => {
    const packageJson = JSON.parse(await read("packages/rails/package.json")) as Record<string, unknown>;
    const generatedCss = await read("packages/tokens/dist/generated/aurelglyph.css");
    const copiedCss = await read("packages/rails/app/assets/stylesheets/aurelglyph.css");
    const generatedRuby = await read("packages/tokens/dist/generated/aurelglyph_tokens.rb");
    const copiedRuby = await read("packages/rails/lib/aurelglyph/tokens.rb");

    expect(packageJson).toEqual({
      name: "aurelglyph-rails",
      version: "0.1.0",
      private: true,
      scripts: {
        build: "npm run build -w @aurelglyph/tokens"
      }
    });
    expect(copiedCss).toBe(generatedCss);
    expect(copiedRuby).toBe(generatedRuby);
  });
});
