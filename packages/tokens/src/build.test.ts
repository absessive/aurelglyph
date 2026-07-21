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

type Rgb = [number, number, number];

function colorChannels(color: string): Rgb {
  const channels = color
    .slice(1)
    .match(/.{2}/gu)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${color}`);
  }

  return channels as Rgb;
}

function compositeColor(foreground: string, background: string, alpha: number): Rgb {
  const foregroundChannels = colorChannels(foreground);
  const backgroundChannels = colorChannels(background);

  return foregroundChannels.map(
    (channel, index) => channel * alpha + backgroundChannels[index] * (1 - alpha)
  ) as Rgb;
}

function rgbaAlpha(color: string): number {
  const alpha = color.match(/,\s*(\d*\.?\d+)\)$/u)?.[1];

  if (alpha === undefined) {
    throw new Error(`Expected an rgba color, received ${color}`);
  }

  return Number(alpha);
}

function relativeLuminance(color: string | Rgb): number {
  const [red, green, blue] = (typeof color === "string" ? colorChannels(color) : color).map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string | Rgb, second: string | Rgb): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

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

  it("keeps focus indicators and small semantic text within WCAG contrast targets", () => {
    const accents = tokens.color.accent as Record<string, Record<string, string>>;
    const modes = tokens.color.mode as Record<string, Record<string, string>>;
    const statuses = tokens.color.status as Record<string, string>;
    const surfaceNames = ["background", "background-elevated", "surface", "surface-2", "surface-3"];
    const accentTintOpacity = rgbaAlpha(tokens.color.semantic["accent-muted"]);

    for (const [themeName, accent] of Object.entries(accents)) {
      for (const surfaceName of surfaceNames) {
        expect(
          contrastRatio(accent["300"], modes.dark[surfaceName]),
          `${themeName} dark focus against ${surfaceName}`
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrastRatio(accent["500"], modes.light[surfaceName]),
          `${themeName} light focus against ${surfaceName}`
        ).toBeGreaterThanOrEqual(3);
      }

      const darkBadgeBackground = compositeColor(
        accent["300"],
        modes.dark["surface-2"],
        accentTintOpacity
      );
      const lightBadgeBackground = compositeColor(
        accent["300"],
        modes.light["surface-2"],
        accentTintOpacity
      );

      expect(contrastRatio(accent["200"], darkBadgeBackground), `${themeName} dark accent badge`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(accent["600"], lightBadgeBackground), `${themeName} light accent badge`).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(tokens.color.mode.dark.text, accent["500"]),
        `${themeName} primary control label`
      ).toBeGreaterThanOrEqual(4.5);
    }

    for (const statusName of ["success", "warning", "danger", "info"]) {
      expect(
        contrastRatio(statuses[statusName], modes.dark["surface-2"]),
        `${statusName} dark badge text`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(statuses[`${statusName}-on-light`], modes.light["surface-2"]),
        `${statusName} light badge text`
      ).toBeGreaterThanOrEqual(4.5);
    }

    const chartModes = tokens.color.chart as unknown as Record<string, Record<string, string>>;

    for (const modeName of ["dark", "light"]) {
      for (const surfaceName of surfaceNames) {
        for (const roleName of ["primary", "secondary", "grid", "positive", "warning", "danger"]) {
          expect(
            contrastRatio(resolveTokenValue(chartModes[modeName][roleName], tokens), modes[modeName][surfaceName]),
            `${modeName} chart ${roleName} against ${surfaceName}`
          ).toBeGreaterThanOrEqual(3);
        }
      }
    }

    expect(contrastRatio(statuses["danger-control-foreground"], statuses["danger-control"])).toBeGreaterThanOrEqual(4.5);
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
    const css = await readFile(join(generatedDir, "aurelglyph.css"), "utf8");
    const chartTokenValues = {
      "dark.primary": "#9358e8",
      "dark.secondary": "#b88cff",
      "dark.grid": "#858176",
      "dark.positive": "#8fbe76",
      "dark.warning": "#d89b4c",
      "dark.danger": "#d47a68",
      "light.primary": "#562a93",
      "light.secondary": "#7a3fd1",
      "light.grid": "#64594c",
      "light.positive": "#365a29",
      "light.warning": "#6f4518",
      "light.danger": "#7b352a"
    } as const;

    expect(reactNative).toContain('"color.accent.royal-purple.300": "#9358e8"');
    expect(reactNative).toContain('"color.semantic.accent-control": "#562a93"');
    expect(reactNative).toContain('"color.semantic.accent-control-strong": "#2d174f"');
    expect(reactNative).toContain('"font.family.display": "AurelglyphDisplay"');
    expect(reactNative).toContain('"font.family.body": "AurelglyphUI"');
    expect(reactNative).toContain('"font.family.mono": "AurelglyphMono"');
    expect(swift).toContain('public static let colorAccentRoyalPurple300 = "#9358e8"');
    expect(swift).toContain('public static let colorSemanticAccentControl = "#562a93"');
    expect(swift).toContain(
      'public static let fontFamilyBody = "\\"Atkinson Hyperlegible\\", Inter, system-ui, -apple-system, BlinkMacSystemFont, \\"Segoe UI\\", sans-serif"'
    );
    expect(ruby).toContain('"color.accent.royal-purple.300" => "#9358e8"');
    expect(ruby).toContain('"color.semantic.accent-control" => "#562a93"');
    expect(ruby).toContain(
      '"font.family.body" => "\\"Atkinson Hyperlegible\\", Inter, system-ui, -apple-system, BlinkMacSystemFont, \\"Segoe UI\\", sans-serif"'
    );
    expect(reactNativeJs).toContain("export const aurelglyphTheme = {");
    expect(reactNativeJs).toContain('"font.family.ui": "AurelglyphUI"');
    expect(reactNativeJs).not.toContain("as const");
    expect(reactNativeTypes).toContain("export declare const aurelglyphTheme:");
    expect(reactNativeTypes).toContain('readonly "font.family.mono": "AurelglyphMono";');
    expect(tokenJs).toContain("export const tokens = {");
    expect(tokenJs).not.toContain("as const");
    expect(tokenTypes).toContain("export declare const tokens:");

    for (const [role, value] of Object.entries(chartTokenValues)) {
      const tokenName = `color.chart.${role}`;

      expect(reactNative).toContain(`${JSON.stringify(tokenName)}: ${JSON.stringify(value)}`);
      expect(swift).toContain(`public static let ${toSwiftIdentifier(tokenName)} = ${JSON.stringify(value)}`);
      expect(ruby).toContain(`${JSON.stringify(tokenName)} => ${JSON.stringify(value)}`);
    }

    expect(reactNative).toContain('"color.chart.primary": "#9358e8"');
    expect(css).toContain("--ag-color-semantic-accent: var(--ag-accent-200);");
    expect(css).toContain("--ag-color-semantic-focus: var(--ag-accent-500);");
    expect(css).toContain("--ag-color-semantic-accent: var(--ag-accent-600);");
    expect(css).toContain("--ag-color-semantic-success: var(--ag-color-status-success-on-light);");
    for (const modeName of ["dark", "light"]) {
      for (const roleName of ["primary", "secondary", "grid", "positive", "warning", "danger"]) {
        expect(css).toContain(
          `--ag-color-chart-${roleName}: var(--ag-color-chart-${modeName}-${roleName});`
        );
      }
    }
  });
});
