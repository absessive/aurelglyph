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
