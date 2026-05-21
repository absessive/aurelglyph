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
      version: "0.4.0",
      license: "MIT",
      type: "module",
      style: "dist/index.css",
      sideEffects: ["*.css", "dist/*.css", "src/*.css"],
      files: ["dist", "src/index.css", "README.md", "LICENSE.md"],
      exports: {
        ".": "./dist/index.css"
      },
      scripts: {
        build: "npm run build -w @aurelglyph/tokens && node scripts/build.mjs",
        prepare: "npm run build"
      },
      dependencies: {
        "@aurelglyph/tokens": "0.4.0"
      }
    });
    expect(css).toContain('font-family: "Newsreader";');
    expect(css).toContain('url("./fonts/ofl/ibm-plex-sans-400.woff2")');
    expect(css).toContain('url("./fonts/ofl/jetbrains-mono-400.woff2")');
    expect(css).toContain('@import "@aurelglyph/tokens/generated.css";');
    expect(css).toContain("box-sizing: border-box;");
    expect(css).toContain("background: var(--ag-color-semantic-background);");
    expect(css).toContain("color: var(--ag-color-semantic-foreground);");
    expect(css).toContain("font-family: var(--ag-font-family-body);");
    expect(css).toContain(".ag-focus-ring:focus-visible");
  });

  it("publishes built CSS with base and shared component classes", async () => {
    const source = await read("packages/css/src/index.css");
    const built = await read("packages/css/dist/index.css");
    const font = await read("packages/css/dist/fonts/ofl/jetbrains-mono-400.woff2");

    expect(built).toContain(source.trim());
    expect(built).toContain("Shared component classes used by the React and Rails adapters.");
    expect(built).toContain(".ag-app-shell");
    expect(built).toContain(".ag-card");
    expect(built).toContain(".ag-list-row");
    expect(built).toContain(".ag-tab-bar");
    expect(built).toContain(".ag-nav-stack");
    expect(built).toContain(".ag-sheet");
    expect(built).toContain(".ag-segmented");
    expect(built).toContain(".ag-command-palette");
    expect(built).toContain(".ag-table");
    expect(built).toContain(".ag-glyph-match");
    expect(built).toContain(".ag-glyph-transition");
    expect(font.length).toBeGreaterThan(0);
  });

  it("defines the React Native package contract and generated theme export", async () => {
    const packageJson = JSON.parse(await read("packages/react-native/package.json")) as Record<string, unknown>;
    const source = await read("packages/react-native/src/index.ts");

    expect(packageJson).toEqual({
      name: "@aurelglyph/react-native",
      version: "0.4.0",
      license: "MIT",
      type: "module",
      main: "src/index.ts",
      types: "src/index.ts",
      files: ["src", "README.md"],
      scripts: {
        build: "npm run build -w @aurelglyph/tokens",
        prepare: "npm run build"
      },
      dependencies: {
        "@aurelglyph/tokens": "0.4.0"
      }
    });
    expect(source.trim()).toBe('export { aurelglyphTheme } from "@aurelglyph/tokens/react-native";');
  });

  it("defines the Swift package and copies generated Swift tokens", async () => {
    const packageJson = JSON.parse(await read("packages/swift/package.json")) as Record<string, unknown>;
    const packageSwift = await read("packages/swift/Package.swift");
    const generated = await read("packages/tokens/dist/generated/AurelglyphTokens.swift");
    const copied = await read("packages/swift/Sources/AurelglyphUI/AurelglyphTokens.swift");
    const fontRegistry = await read("packages/swift/Sources/AurelglyphUI/AurelglyphFontRegistry.swift");
    const font = await read("packages/swift/Sources/AurelglyphUI/Resources/Fonts/Newsreader-Medium.ttf");

    expect(packageJson).toMatchObject({
      name: "@aurelglyph/swift",
      version: "0.4.0",
      scripts: {
        build: "npm run build -w @aurelglyph/tokens && node scripts/sync-generated.mjs"
      },
      dependencies: {
        "@aurelglyph/tokens": "0.4.0"
      }
    });
    expect(packageSwift).toContain('name: "AurelglyphUI"');
    expect(packageSwift).toContain(".iOS(.v17)");
    expect(packageSwift).toContain(".macOS(.v14)");
    expect(packageSwift).toContain('.library(name: "AurelglyphUI", targets: ["AurelglyphUI"])');
    expect(packageSwift).toContain('name: "AurelglyphUI"');
    expect(packageSwift).toContain('.process("Resources")');
    expect(fontRegistry).toContain("AurelglyphFontRegistry");
    expect(font.length).toBeGreaterThan(0);
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
      version: "0.4.0",
      license: "MIT",
      files: ["app", "lib", "*.gemspec", "README.md"],
      scripts: {
        build: "npm run build -w @aurelglyph/tokens && node scripts/sync-generated.mjs",
        prepare: "npm run build",
        test: "ruby -I lib test/aurelglyph_rails_test.rb && ruby test/gemspec_test.rb"
      },
      dependencies: {
        "@aurelglyph/tokens": "0.4.0"
      }
    });
    expect(copiedCss).toContain(generatedCss.trim());
    expect(copiedCss).toContain("Shared component classes used by the React and Rails adapters.");
    expect(copiedCss).toContain(".ag-app-shell");
    expect(copiedCss).toContain(".ag-card");
    expect(copiedCss).toContain(".ag-list-row");
    expect(copiedCss).toContain(".ag-tab-bar");
    expect(copiedCss).toContain(".ag-nav-stack");
    expect(copiedCss).toContain(".ag-sheet");
    expect(copiedCss).toContain(".ag-segmented");
    expect(copiedCss).toContain(".ag-command-palette");
    expect(copiedCss).toContain(".ag-table");
    expect(copiedCss).toContain(".ag-glyph-match");
    expect(copiedCss).toContain(".ag-glyph-transition");
    expect(copiedRuby).toBe(generatedRuby);
  });
});
