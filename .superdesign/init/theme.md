# Aurelglyph theme context

## Compact canonical token summary

- Source of truth: `packages/tokens/src/tokens.json`; adapters consume generated values.
- Appearances: quiet (default for the new specimen board) and atelier; both light/dark. Accent selection defaults royal-purple. Quiet retains preference but renders a reduced violet signal palette.
- Quiet light: background #fafaf9, surface #ffffff, surface-2 #f2f2ef, surface-3 #e8e8e4, border #77766f, soft border #85847e, ink #292927, muted #666560, primary-control #7967cf, focus #7967cf.
- Quiet dark: background #131314, surface #1d1d1e, surface-2 #252526, surface-3 #2b2b2d, border #85847e, soft border #7b7975, foreground #f2f0ed, muted #b1afa9, primary-control #7967cf, focus #a99aef.
- Atelier dark: background #0d0d0b, surface #171714, elevated #12120f, foreground #e7dfd1. Atelier light: background #ece4d8, surface #e2d8ca, elevated #f3ecdf, foreground #2a241e.
- Atelier accents: amber, forest, royal-purple, deep-blue, cyan, steel. Royal-purple scales #efe4ff/#d8c0ff/#b88cff/#9358e8/#7a3fd1/#562a93/#2d174f.
- Semantic colors stay separate from accents: dark success #8fbe76, warning #d89b4c, danger #d47a68, info #78a0a8; light #365a29/#6f4518/#7b352a/#35585f. Danger filled control #9f4e3d with white foreground.
- Fonts: Libre Baskerville display; Atkinson Hyperlegible body/UI; Space Mono metadata. Packaged, open-source fonts; no runtime font-service dependency.
- Type scale: .72/.875/1/1.125/1.35/1.75/2.4rem, display clamp(3rem,7vw,6rem). Normal line-height1.5.
- Space: 0/4/8/12/16/20/24/32/40/48/64px.
- Atelier radii: 4/8/12/18/24/28px. Quiet: xs4/sm6/md8/lg12/xl14/panel16px. Avoid pill controls except a deliberate compact chip.
- Quiet panel shadow0 1px 2px; floating0 8px 24px. Atelier panel0 18px 60px; floating0 28px 90px. Shadow colors resolved per mode.
- Motion140/220/420ms, cubic-bezier(.2,.8,.2,1); reduced motion removes non-essential animation.
- Shared CSS variables use `--ag-` prefix. Modes/appearance/theme are document data attributes.
- Layout: responsive wrapping/stacking with no horizontal overflow; touch targets44pt where interactive; logical geometry for RTL. Example breakpoints are CSS rules, not canonical design-token breakpoints.
- Existing Button, IconButton, TextField, RadioGroup, Badge and ExpandableSection are the visual anchors; no new palette or font required.

## Raw canonical sources

### `packages/tokens/src/tokens.json`

```json
{
  "color": {
    "mode": {
      "dark": {
        "background": "#0d0d0b",
        "background-elevated": "#12120f",
        "surface": "#171714",
        "surface-2": "#1f1e1a",
        "surface-3": "#282620",
        "border": "#34312b",
        "border-soft": "rgba(231, 223, 209, 0.10)",
        "text": "#e7dfd1",
        "text-muted": "#a59b8b",
        "text-subtle": "#6e685e",
        "shadow": "rgba(0, 0, 0, 0.55)",
        "highlight": "rgba(255, 255, 255, 0.06)"
      },
      "light": {
        "background": "#ece4d8",
        "background-elevated": "#f3ecdf",
        "surface": "#e2d8ca",
        "surface-2": "#d8ccb9",
        "surface-3": "#cdbda8",
        "border": "#b9a993",
        "border-soft": "rgba(42, 36, 30, 0.14)",
        "text": "#2a241e",
        "text-muted": "#64594c",
        "text-subtle": "#8c7e6c",
        "shadow": "rgba(42, 36, 30, 0.18)",
        "highlight": "rgba(255, 255, 255, 0.45)"
      }
    },
    "appearance": {
      "quiet": {
        "mode": {
          "dark": {
            "background": "#131314",
            "background-elevated": "#1a1a1b",
            "surface": "#1d1d1e",
            "surface-2": "#252526",
            "surface-3": "#2b2b2d",
            "border": "#85847e",
            "border-soft": "#7b7975",
            "text": "#f2f0ed",
            "text-muted": "#b1afa9",
            "text-subtle": "#96948f",
            "chart-grid": "#7b7975",
            "shadow": "rgba(0, 0, 0, 0.32)",
            "highlight": "rgba(255, 255, 255, 0.04)",
            "overlay": "rgba(19, 19, 20, 0.64)"
          },
          "light": {
            "background": "#fafaf9",
            "background-elevated": "#ffffff",
            "surface": "#ffffff",
            "surface-2": "#f2f2ef",
            "surface-3": "#e8e8e4",
            "border": "#77766f",
            "border-soft": "#85847e",
            "text": "#292927",
            "text-muted": "#666560",
            "text-subtle": "#666560",
            "chart-grid": "#85847e",
            "shadow": "rgba(38, 38, 35, 0.12)",
            "highlight": "rgba(255, 255, 255, 0.72)",
            "overlay": "rgba(29, 29, 27, 0.32)"
          }
        },
        "accent": {
          "50": "#f1efff",
          "100": "#e1dcff",
          "200": "#c8bef4",
          "300": "#a99aef",
          "400": "#8271d4",
          "500": "#7967cf",
          "600": "#493a91",
          "rgb": "121, 103, 207"
        }
      }
    },
    "accent": {
      "amber": {
        "50": "#f7ead5",
        "100": "#ecd1a7",
        "200": "#d9ad6a",
        "300": "#c88a3d",
        "400": "#a86f2c",
        "500": "#7a4d1d",
        "600": "#4d3015",
        "rgb": "200, 138, 61"
      },
      "forest": {
        "50": "#e6eedf",
        "100": "#c8d7b7",
        "200": "#9ab676",
        "300": "#6f9a45",
        "400": "#557733",
        "500": "#334b24",
        "600": "#1d2f19",
        "rgb": "111, 154, 69"
      },
      "royal-purple": {
        "50": "#efe4ff",
        "100": "#d8c0ff",
        "200": "#b88cff",
        "300": "#9358e8",
        "400": "#7a3fd1",
        "500": "#562a93",
        "600": "#2d174f",
        "rgb": "147, 88, 232"
      },
      "deep-blue": {
        "50": "#e1ecff",
        "100": "#b6cdf7",
        "200": "#7ea4e8",
        "300": "#4d7fd0",
        "400": "#355da8",
        "500": "#243d72",
        "600": "#162544",
        "rgb": "77, 127, 208"
      },
      "cyan": {
        "50": "#ddf6f8",
        "100": "#aee2e8",
        "200": "#75c7d0",
        "300": "#4aa7b3",
        "400": "#367f89",
        "500": "#24555c",
        "600": "#18363a",
        "rgb": "74, 167, 179"
      },
      "steel": {
        "50": "#eeeeea",
        "100": "#d1d0ca",
        "200": "#aaa79f",
        "300": "#858176",
        "400": "#625e55",
        "500": "#424038",
        "600": "#25241f",
        "rgb": "133, 129, 118"
      }
    },
    "status": {
      "success": "#8fbe76",
      "warning": "#d89b4c",
      "danger": "#d47a68",
      "info": "#78a0a8",
      "success-on-light": "#365a29",
      "warning-on-light": "#6f4518",
      "danger-on-light": "#7b352a",
      "info-on-light": "#35585f",
      "danger-control": "#9f4e3d",
      "danger-control-foreground": "#ffffff"
    },
    "semantic": {
      "background": "{color.mode.dark.background}",
      "background-elevated": "{color.mode.dark.background-elevated}",
      "foreground": "{color.mode.dark.text}",
      "surface": "{color.mode.dark.surface}",
      "surface-muted": "{color.mode.dark.surface-2}",
      "surface-strong": "{color.mode.dark.surface-3}",
      "border": "{color.mode.dark.border-soft}",
      "border-strong": "{color.mode.dark.border}",
      "accent": "{color.accent.royal-purple.300}",
      "accent-foreground": "{color.mode.dark.text}",
      "accent-control": "{color.accent.royal-purple.500}",
      "accent-control-strong": "{color.accent.royal-purple.600}",
      "accent-muted": "rgba(147, 88, 232, 0.14)",
      "focus": "{color.accent.royal-purple.300}",
      "danger": "{color.status.danger}",
      "danger-control": "{color.status.danger-control}",
      "danger-control-foreground": "{color.status.danger-control-foreground}",
      "success": "{color.status.success}",
      "warning": "{color.status.warning}",
      "info": "{color.status.info}",
      "muted": "{color.mode.dark.text-muted}",
      "subtle": "{color.mode.dark.text-subtle}",
      "disabled": "{color.mode.dark.text-subtle}",
      "overlay": "rgba(13, 13, 11, 0.72)",
      "highlight": "{color.mode.dark.highlight}",
      "shadow": "{color.mode.dark.shadow}"
    },
    "chart": {
      "dark": {
        "primary": "{color.accent.royal-purple.300}",
        "secondary": "{color.accent.royal-purple.200}",
        "grid": "{color.accent.steel.300}",
        "positive": "{color.status.success}",
        "warning": "{color.status.warning}",
        "danger": "{color.status.danger}"
      },
      "light": {
        "primary": "{color.accent.royal-purple.500}",
        "secondary": "{color.accent.royal-purple.400}",
        "grid": "{color.mode.light.text-muted}",
        "positive": "{color.status.success-on-light}",
        "warning": "{color.status.warning-on-light}",
        "danger": "{color.status.danger-on-light}"
      },
      "primary": "{color.chart.dark.primary}",
      "secondary": "{color.chart.dark.secondary}",
      "grid": "{color.chart.dark.grid}",
      "positive": "{color.chart.dark.positive}",
      "warning": "{color.chart.dark.warning}",
      "danger": "{color.chart.dark.danger}"
    }
  },
  "space": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem"
  },
  "radius": {
    "none": "0",
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "18px",
    "xl": "24px",
    "panel": "28px",
    "pill": "999px"
  },
  "appearance": {
    "quiet": {
      "radius": {
        "sm": "6px",
        "md": "8px",
        "lg": "12px",
        "xl": "14px",
        "panel": "16px"
      },
      "shadow": {
        "panel": "0 1px 2px var(--ag-color-semantic-shadow)",
        "float": "0 8px 24px var(--ag-color-semantic-shadow)",
        "inset": "none"
      },
      "elevation": {
        "raised-offset-y": "1",
        "raised-opacity": "0.12",
        "raised-radius": "3",
        "raised-native": "1",
        "floating-offset-y": "8",
        "floating-opacity": "0.18",
        "floating-radius": "20",
        "floating-native": "6"
      }
    }
  },
  "font": {
    "family": {
      "display": "\"Libre Baskerville\", Georgia, serif",
      "ui": "\"Atkinson Hyperlegible\", Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      "body": "\"Atkinson Hyperlegible\", Inter, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
      "mono": "\"Space Mono\", \"SFMono-Regular\", Consolas, monospace"
    },
    "size": {
      "xs": "0.72rem",
      "sm": "0.875rem",
      "base": "1rem",
      "md": "1.125rem",
      "lg": "1.35rem",
      "xl": "1.75rem",
      "2xl": "2.4rem",
      "3xl": "clamp(3rem, 7vw, 6rem)"
    },
    "lineHeight": {
      "tight": "1.05",
      "normal": "1.5",
      "loose": "1.7"
    },
    "weight": {
      "regular": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    },
    "tracking": {
      "label": "0.12em",
      "mono": "0.04em",
      "tight": "-0.035em"
    }
  },
  "shadow": {
    "panel": "0 18px 60px var(--ag-color-semantic-shadow)",
    "float": "0 28px 90px var(--ag-color-semantic-shadow)",
    "inset": "inset 0 1px 0 var(--ag-color-semantic-highlight)"
  },
  "motion": {
    "duration": {
      "fast": "140ms",
      "normal": "220ms",
      "base": "220ms",
      "slow": "420ms"
    },
    "easing": {
      "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "emphasized": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    }
  }
}
```

### `packages/css/src/index.css`

```css
@import "@aurelglyph/tokens/generated.css";

@font-face {
  font-family: "Libre Baskerville";
  src: url("./fonts/ofl/libre-baskerville-400.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Libre Baskerville";
  src: url("./fonts/ofl/libre-baskerville-700.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: "Atkinson Hyperlegible";
  src: url("./fonts/ofl/atkinson-hyperlegible-400.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Atkinson Hyperlegible";
  src: url("./fonts/ofl/atkinson-hyperlegible-700.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: "Space Mono";
  src: url("./fonts/ofl/space-mono-400.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Space Mono";
  src: url("./fonts/ofl/space-mono-700.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  background: var(--ag-color-semantic-background);
  color: var(--ag-color-semantic-foreground);
  font-family: var(--ag-font-family-body);
}

body {
  background:
    radial-gradient(circle at top left, rgba(var(--ag-accent-rgb), 0.12), transparent 32rem),
    linear-gradient(180deg, var(--ag-color-semantic-background), var(--ag-color-semantic-background-elevated));
}

:root[data-appearance="quiet"] body {
  background: var(--ag-color-semantic-background);
}

.ag-focus-ring:focus-visible {
  outline: 2px solid var(--ag-color-semantic-focus);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(var(--ag-accent-rgb), 0.12);
}
```

### `packages/react-native/src/theme.tsx`

```tsx
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
```
