import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import tokens from "./tokens.json";
import {
  buildTokens,
  flattenTokens,
  resolveTokenValue,
  toCssCustomPropertyName,
  toSwiftIdentifier
} from "./build";

describe("token compiler helpers", () => {
  it("flattens nested tokens into stable paths", () => {
    const flat = flattenTokens(tokens);

    expect(flat.find((token) => token.name === "color.semantic.background")).toEqual({
      path: ["color", "semantic", "background"],
      name: "color.semantic.background",
      value: "{color.mode.dark.background}"
    });
  });

  it("resolves token references", () => {
    expect(resolveTokenValue("{color.accent.royal-purple.300}", tokens)).toBe("#9358e8");
  });

  it("creates CSS custom property names", () => {
    expect(toCssCustomPropertyName("color.semantic.surface-muted")).toBe("--ag-color-semantic-surface-muted");
  });

  it("creates Swift-safe identifiers", () => {
    expect(toSwiftIdentifier("color.semantic.surface-muted")).toBe("colorSemanticSurfaceMuted");
  });

  it("escapes generated string literals", async () => {
    await buildTokens();

    const generatedDir = join(import.meta.dirname, "../dist/generated");
    const reactNative = await readFile(join(generatedDir, "react-native.ts"), "utf8");
    const tokenJs = await readFile(join(generatedDir, "tokens.js"), "utf8");
    const tokenTypes = await readFile(join(generatedDir, "tokens.d.ts"), "utf8");
    const reactNativeJs = await readFile(join(generatedDir, "react-native.js"), "utf8");
    const reactNativeTypes = await readFile(join(generatedDir, "react-native.d.ts"), "utf8");
    const swift = await readFile(join(generatedDir, "AurelglyphTokens.swift"), "utf8");
    const ruby = await readFile(join(generatedDir, "aurelglyph_tokens.rb"), "utf8");

    expect(reactNative).toContain('"color.accent.royal-purple.300": "#9358e8"');
    expect(reactNative).toContain('"color.semantic.accent-control": "#562a93"');
    expect(reactNative).toContain('"color.semantic.accent-control-strong": "#2d174f"');
    expect(reactNative).toContain(
      '"font.family.body": "\\"IBM Plex Sans\\", Inter, system-ui, -apple-system, BlinkMacSystemFont, \\"Segoe UI\\", sans-serif"'
    );
    expect(swift).toContain('public static let colorAccentRoyalPurple300 = "#9358e8"');
    expect(swift).toContain('public static let colorSemanticAccentControl = "#562a93"');
    expect(swift).toContain(
      'public static let fontFamilyBody = "\\"IBM Plex Sans\\", Inter, system-ui, -apple-system, BlinkMacSystemFont, \\"Segoe UI\\", sans-serif"'
    );
    expect(ruby).toContain('"color.accent.royal-purple.300" => "#9358e8"');
    expect(ruby).toContain('"color.semantic.accent-control" => "#562a93"');
    expect(ruby).toContain(
      '"font.family.body" => "\\"IBM Plex Sans\\", Inter, system-ui, -apple-system, BlinkMacSystemFont, \\"Segoe UI\\", sans-serif"'
    );
    expect(reactNativeJs).toContain("export const aurelglyphTheme = {");
    expect(reactNativeJs).not.toContain("as const");
    expect(reactNativeTypes).toContain("export declare const aurelglyphTheme:");
    expect(tokenJs).toContain("export const tokens = {");
    expect(tokenJs).not.toContain("as const");
    expect(tokenTypes).toContain("export declare const tokens:");
  });
});
