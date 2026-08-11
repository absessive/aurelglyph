import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  SafeAreaView: () => null,
  StyleSheet: { absoluteFill: {}, create: <T,>(styles: T) => styles },
  View: () => null,
  useColorScheme: () => "dark"
}));

import { resolveAurelglyphTheme } from "./theme.js";

function contrast(first: string, second: string): number {
  const luminance = (hex: string): number => {
    const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  };
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("React Native theme resolution", () => {
  it("uses royal purple and dark mode by default", () => {
    const theme = resolveAurelglyphTheme();
    expect(theme.mode).toBe("dark");
    expect(theme.accent).toBe("royal-purple");
    expect(theme.colors.background).toBe("#0d0d0b");
    expect(theme.colors.accent).toBe("#562a93");
  });

  it("maps light mode and alternate accents from canonical tokens", () => {
    const theme = resolveAurelglyphTheme("light", "forest");
    expect(theme.colors.background).toBe("#ece4d8");
    expect(theme.colors.accent).toBe("#334b24");
    expect(theme.colors.text).toBe("#2a241e");
    expect(theme.colors.danger).toBe("#7b352a");
  });

  it("keeps primary control labels at WCAG AA contrast in every mode and accent", () => {
    const accents = ["amber", "forest", "royal-purple", "deep-blue", "cyan", "steel"] as const;
    for (const mode of ["dark", "light"] as const) {
      for (const accent of accents) {
        const theme = resolveAurelglyphTheme(mode, accent);
        expect(contrast(theme.colors.accent, theme.colors.accentForeground), `${mode}/${accent}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("provides an AA interactive foreground for light inset surfaces", () => {
    const theme = resolveAurelglyphTheme("light");
    const interactiveContrast = contrast(theme.colors.text, theme.colors.surfaceMuted);
    const supportingContrast = contrast(theme.colors.muted, theme.colors.surfaceMuted);

    expect(interactiveContrast).toBeGreaterThanOrEqual(4.5);
    expect(interactiveContrast).toBeGreaterThan(supportingContrast);
  });
});
