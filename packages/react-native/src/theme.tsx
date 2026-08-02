import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { aurelglyphTheme } from "@aurelglyph/tokens/react-native";

export type AurelglyphMode = "dark" | "light";
export type AurelglyphModePreference = AurelglyphMode | "system";
export type AurelglyphAccent = "amber" | "forest" | "royal-purple" | "deep-blue" | "cyan" | "steel";

export type AurelglyphNativeTheme = {
  mode: AurelglyphMode;
  accent: AurelglyphAccent;
  colors: {
    background: string;
    backgroundElevated: string;
    surface: string;
    surfaceMuted: string;
    surfaceStrong: string;
    border: string;
    borderStrong: string;
    text: string;
    muted: string;
    subtle: string;
    accent: string;
    accentStrong: string;
    accentForeground: string;
    accentMuted: string;
    focus: string;
    danger: string;
    dangerControl: string;
    dangerForeground: string;
    success: string;
    warning: string;
    info: string;
    disabled: string;
    overlay: string;
    highlight: string;
    shadow: string;
  };
  fonts: { display: string; ui: string; mono: string };
  space: { 0: number; 1: number; 2: number; 3: number; 4: number; 5: number; 6: number; 8: number; 10: number; 12: number; 16: number };
  radii: { none: number; xs: number; sm: number; md: number; lg: number; xl: number; panel: number; pill: number };
};

function token(key: keyof typeof aurelglyphTheme): string {
  return aurelglyphTheme[key];
}

export function resolveAurelglyphTheme(
  mode: AurelglyphMode = "dark",
  accent: AurelglyphAccent = "royal-purple"
): AurelglyphNativeTheme {
  const accentKey = `color.accent.${accent}` as const;
  const accentControl = "500";
  const accentStrong = mode === "dark" ? "400" : "600";
  const foreground = token(`color.mode.${mode}.text`);
  return {
    mode,
    accent,
    colors: {
      background: token(`color.mode.${mode}.background`),
      backgroundElevated: token(`color.mode.${mode}.background-elevated`),
      surface: token(`color.mode.${mode}.surface`),
      surfaceMuted: token(`color.mode.${mode}.surface-2`),
      surfaceStrong: token(`color.mode.${mode}.surface-3`),
      border: token(`color.mode.${mode}.border-soft`),
      borderStrong: token(`color.mode.${mode}.border`),
      text: foreground,
      muted: token(`color.mode.${mode}.text-muted`),
      subtle: token(`color.mode.${mode}.text-subtle`),
      accent: token(`${accentKey}.${accentControl}`),
      accentStrong: token(`${accentKey}.${accentStrong}`),
      accentForeground: mode === "dark" ? token(`${accentKey}.50`) : token("color.mode.dark.text"),
      accentMuted: `rgba(${token(`${accentKey}.rgb`)}, ${mode === "dark" ? 0.20 : 0.12})`,
      focus: token(`${accentKey}.300`),
      danger: token(mode === "dark" ? "color.status.danger" : "color.status.danger-on-light"),
      dangerControl: token("color.status.danger-control"),
      dangerForeground: token("color.status.danger-control-foreground"),
      success: token(mode === "dark" ? "color.status.success" : "color.status.success-on-light"),
      warning: token(mode === "dark" ? "color.status.warning" : "color.status.warning-on-light"),
      info: token(mode === "dark" ? "color.status.info" : "color.status.info-on-light"),
      disabled: token(`color.mode.${mode}.text-subtle`),
      overlay: token("color.semantic.overlay"),
      highlight: token(`color.mode.${mode}.highlight`),
      shadow: token(`color.mode.${mode}.shadow`)
    },
    fonts: {
      display: token("font.family.display"),
      ui: token("font.family.ui"),
      mono: token("font.family.mono")
    },
    space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
    radii: { none: 0, xs: 4, sm: 8, md: 12, lg: 18, xl: 24, panel: 28, pill: 999 }
  };
}

const defaultTheme = resolveAurelglyphTheme();
const AurelglyphThemeContext = createContext(defaultTheme);

export type AurelglyphProviderProps = {
  children: ReactNode;
  mode?: AurelglyphModePreference;
  accent?: AurelglyphAccent;
};

export function AurelglyphProvider({
  accent = "royal-purple",
  children,
  mode = "system"
}: AurelglyphProviderProps): ReactElement {
  const systemMode = useColorScheme();
  const resolvedMode: AurelglyphMode = mode === "system" ? (systemMode === "light" ? "light" : "dark") : mode;
  const value = useMemo(() => resolveAurelglyphTheme(resolvedMode, accent), [accent, resolvedMode]);
  return <AurelglyphThemeContext.Provider value={value}>{children}</AurelglyphThemeContext.Provider>;
}

export function useAurelglyphTheme(): AurelglyphNativeTheme {
  return useContext(AurelglyphThemeContext);
}

export { aurelglyphTheme };
