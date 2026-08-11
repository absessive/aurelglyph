import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "../../..");

async function read(path: string): Promise<string> {
  return readFile(join(repoRoot, path), "utf8");
}

async function currentVersion(): Promise<string> {
  return (JSON.parse(await read("package.json")) as { version: string }).version;
}

describe("platform adapter skeletons", () => {
  it("defines the CSS package contract and base stylesheet", async () => {
    const packageJson = JSON.parse(await read("packages/css/package.json")) as Record<string, unknown>;
    const css = await read("packages/css/src/index.css");
    const version = await currentVersion();

    expect(packageJson).toEqual({
      name: "@aurelglyph/css",
      version,
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
        "@aurelglyph/tokens": version
      }
    });
    expect(css).toContain('font-family: "Libre Baskerville";');
    expect(css).toContain('url("./fonts/ofl/atkinson-hyperlegible-400.woff2")');
    expect(css).toContain('url("./fonts/ofl/space-mono-400.woff2")');
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
    const fontFiles = [
      "libre-baskerville-400.woff2",
      "libre-baskerville-700.woff2",
      "atkinson-hyperlegible-400.woff2",
      "atkinson-hyperlegible-700.woff2",
      "space-mono-400.woff2",
      "space-mono-700.woff2"
    ];

    expect(built).toContain(source.trim());
    expect(built).toContain("Shared component classes used by the React and Rails adapters.");
    expect(built).toContain(".ag-app-shell");
    expect(built).toContain(".ag-app-shell__body:has(> .ag-app-shell__nav)");
    expect(built).toContain(".ag-card");
    expect(built).toContain(".ag-list-row");
    expect(built).toContain(".ag-tab-bar");
    expect(built).toContain(".ag-nav-stack");
    expect(built).toContain(".ag-sheet");
    expect(built).toContain(".ag-segmented");
    expect(built).toContain(".ag-command-palette");
    expect(built).toContain('.ag-command-palette__item[aria-disabled="true"]');
    expect(built).toContain('.ag-command-palette__empty');
    expect(built).toContain('.ag-sheet[aria-modal="true"] > .ag-sheet__fallback-scrim');
    expect(built).toContain('.ag-checkbox__input[data-indeterminate="true"] + .ag-checkbox__box');
    expect(built).toContain(".ag-table");
    expect(built).toContain('.ag-disclosure[open] .ag-disclosure__panel');
    expect(built).toContain("@media (prefers-reduced-motion: reduce)");
    expect(built).toContain("animation: none;");
    expect(built).toContain("outline: 2px solid var(--ag-color-semantic-focus);");
    expect(built).toMatch(
      /\.ag-badge--accent\s*\{[^}]*color: var\(--ag-color-semantic-accent\);[^}]*background: var\(--ag-color-semantic-accent-muted\);/u
    );
    for (const fontFile of fontFiles) {
      await expect(read(`packages/css/dist/fonts/ofl/${fontFile}`)).resolves.not.toHaveLength(0);
    }
    await expect(read("packages/css/dist/fonts/ofl/OFL-1.1.txt")).resolves.toContain("SIL OPEN FONT LICENSE Version 1.1");
  });

  it("defines the React Native component package and generated theme contract", async () => {
    const packageJson = JSON.parse(await read("packages/react-native/package.json")) as Record<string, unknown>;
    const source = await read("packages/react-native/src/index.ts");
    const version = await currentVersion();

    expect(packageJson).toMatchObject({
      name: "@aurelglyph/react-native",
      version,
      license: "MIT",
      type: "module",
      main: "dist/index.js",
      types: "dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          "react-native": "./dist/index.js",
          default: "./dist/index.js"
        },
        "./fonts": {
          types: "./dist/fonts.d.ts",
          "react-native": "./dist/fonts.js",
          default: "./dist/fonts.js"
        }
      },
      files: ["dist", "assets/fonts", "README.md", "LICENSE.md"],
      scripts: {
        build:
          "npm run build -w @aurelglyph/tokens && node --experimental-strip-types ../../scripts/font-assets.ts && tsc -p tsconfig.json",
        test: "vitest run --root ../.. packages/react-native/src",
        prepare: "npm run build"
      },
      dependencies: {
        "@aurelglyph/tokens": version
      },
      peerDependencies: {
        react: ">=19.2.3 <20",
        "react-native": "^0.86.0"
      }
    });
    expect(source).toContain("AurelglyphProvider");
    expect(source).toContain("export { Dialog, Drawer, Popover, Tooltip }");
    expect(source).toContain("export { Menu, Dropdown, Combobox, Autocomplete, Select, CommandPalette }");
    expect(source).toContain("export { TextField, SearchField, TextArea, Switch, Checkbox, RadioGroup, Slider, NumberField, FileUpload }");
    expect(source).toContain("export { Button, IconButton, ButtonGroup, Spinner, Divider, Surface, Box, Stack, Container, Grid, Progress }");
    const fontAdapter = await read("packages/react-native/src/fonts.ts");
    expect(fontAdapter).toContain("aurelglyphFontAssets");
    expect(fontAdapter).toContain("AurelglyphDisplay");
    await expect(read("packages/react-native/assets/fonts/LibreBaskerville-Regular.ttf")).resolves.not.toHaveLength(0);
    await expect(read("packages/react-native/assets/fonts/OFL-1.1.txt")).resolves.toContain("Braille Institute of America");
  });

  it("defines the Swift package and copies generated Swift tokens", async () => {
    const packageJson = JSON.parse(await read("packages/swift/package.json")) as Record<string, unknown>;
    const packageSwift = await read("packages/swift/Package.swift");
    const generated = await read("packages/tokens/dist/generated/AurelglyphTokens.swift");
    const copied = await read("packages/swift/Sources/AurelglyphUI/AurelglyphTokens.swift");
    const fontRegistry = await read("packages/swift/Sources/AurelglyphUI/AurelglyphFontRegistry.swift");
    const font = await read("packages/swift/Sources/AurelglyphUI/Resources/Fonts/LibreBaskerville-Regular.ttf");
    const version = await currentVersion();

    expect(packageJson).toMatchObject({
      name: "@aurelglyph/swift",
      version,
      private: true,
      files: ["Package.swift", "Sources", "README.md", "LICENSE.md"],
      scripts: {
        build: "npm run build -w @aurelglyph/tokens && node scripts/sync-generated.mjs"
      },
      dependencies: {
        "@aurelglyph/tokens": version
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
    const sheetController = await read("packages/rails/app/assets/javascripts/aurelglyph.js");
    const version = await currentVersion();

    expect(packageJson).toEqual({
      name: "aurelglyph-rails",
      version,
      private: true,
      license: "MIT",
      files: ["app", "lib", "*.gemspec", "README.md"],
      scripts: {
        build: "npm run build -w @aurelglyph/tokens && node scripts/sync-generated.mjs",
        prepare: "npm run build",
        test:
          "ruby -I lib test/aurelglyph_rails_test.rb && ruby test/gemspec_test.rb && vitest run --root ../.. packages/rails/test/sheet_controller.test.ts"
      },
      dependencies: {
        "@aurelglyph/tokens": version
      }
    });
    expect(copiedCss).toContain(generatedCss.trim());
    expect(copiedCss).toContain('font-family: "Libre Baskerville";');
    expect(copiedCss).toContain('url("aurelglyph/atkinson-hyperlegible-400.woff2")');
    expect(copiedCss).toContain("Shared component classes used by the React and Rails adapters.");
    expect(copiedCss).toContain(".ag-app-shell");
    expect(copiedCss).toContain(".ag-app-shell__body:has(> .ag-app-shell__nav)");
    expect(copiedCss).toContain(".ag-card");
    expect(copiedCss).toContain(".ag-list-row");
    expect(copiedCss).toContain(".ag-tab-bar");
    expect(copiedCss).toContain(".ag-nav-stack");
    expect(copiedCss).toContain(".ag-sheet");
    expect(copiedCss).toContain(".ag-segmented");
    expect(copiedCss).toContain(".ag-command-palette");
    expect(copiedCss).toContain(".ag-table");
    expect(copiedRuby).toBe(generatedRuby);
    expect(sheetController).toContain('const sheetSelector = "dialog[data-aurelglyph-sheet]";');
    expect(sheetController).toContain("dialog.showModal();");
    await expect(read("packages/rails/app/assets/fonts/aurelglyph/space-mono-700.woff2")).resolves.not.toHaveLength(0);
    await expect(read("packages/rails/app/assets/fonts/aurelglyph/OFL-1.1.txt")).resolves.toContain("Space Mono Project Authors");
  });

  it("ships package documentation and license files", async () => {
    for (const packagePath of ["tokens", "css", "react", "react-native", "swift", "rails"]) {
      await expect(read(`packages/${packagePath}/README.md`)).resolves.toContain("Aurelglyph");
      await expect(read(`packages/${packagePath}/LICENSE.md`)).resolves.toContain("MIT License");
    }
  });
});
