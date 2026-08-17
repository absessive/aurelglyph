# @aurelglyph/css

Aurelglyph tokens, local OFL web fonts, base styles, and shared component
classes for web and Rails-aligned surfaces.

```bash
npm install @aurelglyph/css
```

```css
@import "@aurelglyph/css";
```

Set `data-appearance="quiet|atelier"`, `data-mode="dark|light"`, and an accent
such as `data-theme="royal-purple"` on the document root. `atelier` remains the
default when appearance is omitted. `quiet` provides flatter near-white and
charcoal surfaces, smaller radii, low elevation, and one restrained violet
signal palette while preserving semantic status colors and accessible focus.
Each forced `data-mode` also sets the matching browser `color-scheme`, and
quiet boundaries remain visible at 3:1 across the neutral surface stack.
The package includes Libre Baskerville, Atkinson Hyperlegible, and Space Mono
WOFF2 files; their complete license travels with the assets in
`dist/fonts/ofl/OFL-1.1.txt`.

The shared class layer includes mode-aware semantic status colors, 2px
high-contrast focus indicators for every accent theme, native `<details>`
disclosure state, and `prefers-reduced-motion` fallbacks for component
transitions and skeleton loading indicators.
