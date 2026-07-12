# @aurelglyph/react

Accessible React controls that implement the Aurelglyph component contract.

```bash
npm install @aurelglyph/css @aurelglyph/react
```

```tsx
import "@aurelglyph/css";
import { Button, Card, TextField } from "@aurelglyph/react";

<Card eyebrow="Live" title="Status">
  <TextField label="System name" name="systemName" />
  <Button icon="save">Save</Button>
</Card>;
```

Import `@aurelglyph/react/styles.css` only when another package already
provides the tokens and base layer.
