# @aurelglyph/css

Aurelglyph tokens, local OFL web fonts, base styles, and shared component
classes for web and Rails-aligned surfaces.

Public npm publication begins with Aurelglyph `1.0.0`; before then, consume this
package from the Git repository or workspace.

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

Directional geometry uses logical properties for rails, selected markers,
menus, grouped controls, number steppers, breadcrumbs, tables, and Combobox
positioning. The same stylesheet therefore mirrors with `dir="rtl"` without a
second direction-specific theme.

It also themes the full `Menu` and `Combobox` popup surfaces and progressively
enhances `.ag-select__input` with the native customizable-select picker. This
preserves HTML form and accessibility semantics while styling picker surfaces,
options, selection rails, focus, radii, and elevation. Unsupported browsers
retain their native picker with forced-mode browser chrome and explicit option
foreground/background colors.
