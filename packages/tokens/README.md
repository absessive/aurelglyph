# @aurelglyph/tokens

Canonical, generated Aurelglyph design tokens for CSS, TypeScript, React
Native, SwiftUI, and Rails adapters.

```bash
npm install @aurelglyph/tokens
```

```ts
import { tokens } from "@aurelglyph/tokens/tokens";

const background = tokens["color.mode.dark.background"];
```

Use `@aurelglyph/tokens/react-native` for the generated native theme and
`@aurelglyph/tokens/generated.css` for raw CSS variables.

The canonical source is `src/tokens.json`; generated files are rebuilt during
package preparation.

Status inks include dark/default and `-on-light` variants. Generated CSS maps
those values, accent text, control foregrounds, and focus indicators to
mode-aware semantic variables so adapters do not need to choose raw palette
steps inside individual components.

Chart colors expose an explicit appearance contract for every adapter:

```ts
const mode = "light";
const primary = tokens[`color.chart.${mode}.primary`];
const grid = tokens[`color.chart.${mode}.grid`];
```

Each `color.chart.dark.*` and `color.chart.light.*` group provides `primary`,
`secondary`, `grid`, `positive`, `warning`, and `danger` roles with at least
3:1 contrast against the corresponding Aurelglyph chart surfaces. SwiftUI,
React Native, and Rails consumers should select the group matching the active
appearance. Generated CSS performs that selection automatically from
`data-mode`.

The flat `color.chart.primary`, `secondary`, `grid`, `positive`, `warning`, and
`danger` names remain as compatibility aliases to the dark group. They are
deprecated for native use because they cannot react to an appearance change;
prefer the explicit mode-qualified roles in new code.
