# @aurelglyph/css

Aurelglyph tokens, local OFL web fonts, base styles, and shared component
classes for web and Rails-aligned surfaces.

```bash
npm install @aurelglyph/css
```

```css
@import "@aurelglyph/css";
```

Set `data-mode="dark|light"` and an accent such as
`data-theme="royal-purple"` on the document root. The package includes Libre
Baskerville, Atkinson Hyperlegible, and Space Mono WOFF2 files; their complete
license travels with the assets in `dist/fonts/ofl/OFL-1.1.txt`.

The shared class layer includes mode-aware semantic status colors, 2px
high-contrast focus indicators for every accent theme, native `<details>`
disclosure state, and `prefers-reduced-motion` fallbacks for component
transitions and skeleton loading indicators.
