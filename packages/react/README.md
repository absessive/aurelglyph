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

## Interaction foundations

The interaction layer includes collision-safe IDs, controlled and uncontrolled
state helpers, roving keyboard focus, outside-click and Escape dismissal, focus
restoration, reduced-motion styles, and forced-colors support. Components use
native elements first and add ARIA only where a composite widget requires it.

`Dialog` and `Drawer` share the tested `Sheet` modal lifecycle. Dialogs support
`default`, `compact`, and `wide` variants. `Menu`
(`Dropdown`) and `Popover` support controlled or uncontrolled open state. Menus
support logical `bottom-start`, `bottom-end`, `top-start`, and `top-end`
placement.

```tsx
import { Button, Dialog, Menu } from "@aurelglyph/react";

<Menu
  items={[
    { id: "edit", label: "Edit system", icon: "edit" },
    { id: "archive", label: "Archive", icon: "archive" }
  ]}
  label="Actions"
  onSelect={(id) => runAction(id)}
/>;

<Dialog
  actions={<Button onClick={() => setOpen(false)}>Done</Button>}
  onOpenChange={setOpen}
  open={open}
  title="Calibration details"
>
  Review the current instrument state.
</Dialog>;
```

Composite widgets implement their expected keyboard model:

- `Tabs` and `SegmentedControl`: Arrow keys, Home, and End with disabled-item
  skipping.
- `Menu`: Arrow Up/Down, Home, End, typeahead, Enter/Space opening, Escape
  dismissal, and focus restoration.
- `CommandPalette` and `Combobox`: filtering, active-descendant tracking,
  Arrow Up/Down, Home, End, Enter selection, and Escape dismissal.
- `Tooltip`: focus and pointer activation with Escape dismissal.

## Controls

The form set includes `TextField`, `TextArea`, `Select`, `SearchField`,
`Switch`, `Checkbox`, `RadioGroup`, `Slider`, `NumberField`, `FileUpload`, and
`Combobox` (`Autocomplete`). Help and error content is connected to its input,
and errors are announced politely when they appear.

```tsx
<Combobox
  error={systemError}
  helpText="Search by system name."
  label="System"
  name="systemId"
  onValueChange={setSystemId}
  options={systems.map(({ id, name }) => ({ label: name, value: id }))}
  required
/>;
```

`FileUpload` accepts both picker and drag-and-drop input. Use `onFilesChange`
for a single callback that receives either path as a `FileList`.

Shared control states are exported as `ControlStateProps`: `disabled`,
`loading`, `busy`, `readOnly`, `required`, and `invalid`. Individual components
expose only the states that make sense for their native semantics. A loading
button is disabled and announces `aria-busy`; read-only value controls remain
focusable.

## Layout and feedback

`Surface` (`Box`), `Stack`, `Container`, and `Grid` provide token-driven layout
without a utility-class dependency. `Spinner` and `Divider` complete common
feedback and structural patterns.

```tsx
<Container size="xl">
  <Grid columns={{ base: 1, md: 2, xl: 3 }} gap="var(--ag-space-6)">
    {systems.map((system) => (
      <Surface elevation="raised" key={system.id} padding="md">
        {system.name}
      </Surface>
    ))}
  </Grid>
</Container>
```

Additional controls in this release include `IconButton`, `ButtonGroup`,
`Spinner`, and `Divider`. All component styling remains token-based and supports
light mode, dark mode, and every Aurelglyph accent theme.

`AppShell` owns the page's `main` landmark by default. When demonstrating or
embedding a shell inside an existing `main`, set `contentAs="div"` (or another
appropriate element) to avoid nested landmarks. `TopBar` supplies the header
landmark; set its `titleAs` prop when the bar is embedded below another heading.
`NavigationStack` is deliberately landmark-neutral. Use the `headingLevel` prop
on navigation stacks and pages when the surrounding document outline requires a
different level.
