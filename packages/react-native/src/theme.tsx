import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from "react";
import { useColorScheme, type Insets } from "react-native";
import { aurelglyphTheme } from "@aurelglyph/tokens/react-native";

import { AurelglyphOverlayHost } from "./overlay-host.js";

export type AurelglyphMode = "dark" | "light";
export type AurelglyphModePreference = AurelglyphMode | "system";
export type AurelglyphAccent = "amber" | "forest" | "royal-purple" | "deep-blue" | "cyan" | "steel";
export type AurelglyphAppearance = "atelier" | "quiet";

export type AurelglyphNativeTheme = {
  mode: AurelglyphMode;
  accent: AurelglyphAccent;
  appearance?: AurelglyphAppearance;
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
  effects?: {
    raised: { elevation: number; offsetY: number; opacity: number; radius: number };
    floating: { elevation: number; offsetY: number; opacity: number; radius: number };
  };
};

export type ResolvedAurelglyphNativeTheme = Omit<AurelglyphNativeTheme, "appearance" | "effects"> & {
  appearance: AurelglyphAppearance;
  effects: NonNullable<AurelglyphNativeTheme["effects"]>;
};

function token(key: keyof typeof aurelglyphTheme): string {
  return aurelglyphTheme[key];
}

function numericToken(key: keyof typeof aurelglyphTheme): number {
  return Number.parseFloat(token(key));
}

export function resolveAurelglyphTheme(
  mode: AurelglyphMode = "dark",
  accent: AurelglyphAccent = "royal-purple",
  appearance: AurelglyphAppearance = "atelier"
): ResolvedAurelglyphNativeTheme {
  const modeKey = appearance === "quiet" ? `color.appearance.quiet.mode.${mode}` : `color.mode.${mode}`;
  const accentKey = appearance === "quiet" ? "color.appearance.quiet.accent" : `color.accent.${accent}`;
  const accentControl = "500";
  const accentStrong = appearance === "quiet" ? "600" : mode === "dark" ? "400" : "600";
  const foreground = token(`${modeKey}.text` as keyof typeof aurelglyphTheme);
  const quiet = appearance === "quiet";
  return {
    mode,
    accent,
    appearance,
    colors: {
      background: token(`${modeKey}.background` as keyof typeof aurelglyphTheme),
      backgroundElevated: token(`${modeKey}.background-elevated` as keyof typeof aurelglyphTheme),
      surface: token(`${modeKey}.surface` as keyof typeof aurelglyphTheme),
      surfaceMuted: token(`${modeKey}.surface-2` as keyof typeof aurelglyphTheme),
      surfaceStrong: token(`${modeKey}.surface-3` as keyof typeof aurelglyphTheme),
      border: token(`${modeKey}.border-soft` as keyof typeof aurelglyphTheme),
      borderStrong: token(`${modeKey}.border` as keyof typeof aurelglyphTheme),
      text: foreground,
      muted: token(`${modeKey}.text-muted` as keyof typeof aurelglyphTheme),
      subtle: token(`${modeKey}.text-subtle` as keyof typeof aurelglyphTheme),
      accent: token(`${accentKey}.${accentControl}` as keyof typeof aurelglyphTheme),
      accentStrong: token(`${accentKey}.${accentStrong}` as keyof typeof aurelglyphTheme),
      accentForeground: quiet ? "#ffffff" : mode === "dark" ? token(`${accentKey}.50` as keyof typeof aurelglyphTheme) : token("color.mode.dark.text"),
      accentMuted: `rgba(${token(`${accentKey}.rgb` as keyof typeof aurelglyphTheme)}, ${quiet ? 0.10 : mode === "dark" ? 0.20 : 0.12})`,
      focus: token(`${accentKey}.${mode === "light" ? "500" : "300"}` as keyof typeof aurelglyphTheme),
      danger: token(mode === "dark" ? "color.status.danger" : "color.status.danger-on-light"),
      dangerControl: token("color.status.danger-control"),
      dangerForeground: token("color.status.danger-control-foreground"),
      success: token(mode === "dark" ? "color.status.success" : "color.status.success-on-light"),
      warning: token(mode === "dark" ? "color.status.warning" : "color.status.warning-on-light"),
      info: token(mode === "dark" ? "color.status.info" : "color.status.info-on-light"),
      disabled: token(`${modeKey}.text-subtle` as keyof typeof aurelglyphTheme),
      overlay: quiet ? token(`${modeKey}.overlay` as keyof typeof aurelglyphTheme) : token("color.semantic.overlay"),
      highlight: token(`${modeKey}.highlight` as keyof typeof aurelglyphTheme),
      shadow: token(`${modeKey}.shadow` as keyof typeof aurelglyphTheme)
    },
    fonts: {
      display: token("font.family.display"),
      ui: token("font.family.ui"),
      mono: token("font.family.mono")
    },
    space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 },
    radii: quiet
      ? {
          none: 0,
          xs: 4,
          sm: numericToken("appearance.quiet.radius.sm"),
          md: numericToken("appearance.quiet.radius.md"),
          lg: numericToken("appearance.quiet.radius.lg"),
          xl: numericToken("appearance.quiet.radius.xl"),
          panel: numericToken("appearance.quiet.radius.panel"),
          pill: 999
        }
      : { none: 0, xs: 4, sm: 8, md: 12, lg: 18, xl: 24, panel: 28, pill: 999 },
    effects: quiet
      ? {
          raised: {
            elevation: numericToken("appearance.quiet.elevation.raised-native"),
            offsetY: numericToken("appearance.quiet.elevation.raised-offset-y"),
            opacity: numericToken("appearance.quiet.elevation.raised-opacity"),
            radius: numericToken("appearance.quiet.elevation.raised-radius")
          },
          floating: {
            elevation: numericToken("appearance.quiet.elevation.floating-native"),
            offsetY: numericToken("appearance.quiet.elevation.floating-offset-y"),
            opacity: numericToken("appearance.quiet.elevation.floating-opacity"),
            radius: numericToken("appearance.quiet.elevation.floating-radius")
          }
        }
      : {
          raised: { elevation: 4, offsetY: 6, opacity: 0.22, radius: 12 },
          floating: { elevation: 12, offsetY: 12, opacity: 0.38, radius: 24 }
        }
  };
}

const defaultTheme = resolveAurelglyphTheme();
const AurelglyphThemeContext = createContext(defaultTheme);

export type AurelglyphProviderProps = {
  children: ReactNode;
  mode?: AurelglyphModePreference;
  accent?: AurelglyphAccent;
  appearance?: AurelglyphAppearance;
  overlayHost?: boolean;
  overlayInsets?: Partial<Insets>;
};

export function AurelglyphProvider({
  accent = "royal-purple",
  appearance = "atelier",
  children,
  mode = "system",
  overlayHost = true,
  overlayInsets
}: AurelglyphProviderProps): ReactElement {
  const systemMode = useColorScheme();
  const resolvedMode: AurelglyphMode = mode === "system" ? (systemMode === "light" ? "light" : "dark") : mode;
  const value = useMemo(() => resolveAurelglyphTheme(resolvedMode, accent, appearance), [accent, appearance, resolvedMode]);
  return (
    <AurelglyphThemeContext.Provider value={value}>
      {overlayHost ? <AurelglyphOverlayHost insets={overlayInsets}>{children}</AurelglyphOverlayHost> : children}
    </AurelglyphThemeContext.Provider>
  );
}

export function useAurelglyphTheme(): ResolvedAurelglyphNativeTheme {
  return useContext(AurelglyphThemeContext);
}

export { aurelglyphTheme };
