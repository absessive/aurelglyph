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

`Sheet` uses the native modal dialog lifecycle and is controlled by the
consumer. Pass `onOpenChange` so Escape, backdrop, and native-close requests
update state while Aurelglyph manages focus entry and restoration:

```tsx
<Sheet
  onOpenChange={setDetailsOpen}
  open={detailsOpen}
  title="System details"
>
  Review the calibrated system state.
</Sheet>
```

Environments without native `showModal()` receive the same focus containment,
background isolation, pointer blocking, and scroll locking through the tested
fallback path.
