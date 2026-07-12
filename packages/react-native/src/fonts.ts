declare const require: (path: string) => number;

/**
 * Font aliases that work consistently when the matching assets are registered
 * with Expo Font or another React Native asset loader.
 */
export const aurelglyphFontFamilies = {
  display: "AurelglyphDisplay",
  ui: "AurelglyphUI",
  uiBold: "AurelglyphUIBold",
  body: "AurelglyphUI",
  mono: "AurelglyphMono",
  monoBold: "AurelglyphMonoBold"
} as const;

/** Static requires let Metro include the packaged TTF files in an app bundle. */
export const aurelglyphFontAssets = {
  [aurelglyphFontFamilies.display]: require("../assets/fonts/LibreBaskerville-Regular.ttf"),
  [aurelglyphFontFamilies.ui]: require("../assets/fonts/AtkinsonHyperlegible-Regular.ttf"),
  [aurelglyphFontFamilies.uiBold]: require("../assets/fonts/AtkinsonHyperlegible-Bold.ttf"),
  [aurelglyphFontFamilies.mono]: require("../assets/fonts/SpaceMono-Regular.ttf"),
  [aurelglyphFontFamilies.monoBold]: require("../assets/fonts/SpaceMono-Bold.ttf")
} as const;
