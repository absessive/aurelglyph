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

Set `data-appearance="quiet"` on the document root for the simplified
Aurelglyph treatment: near-white or charcoal semantic surfaces, smaller radii,
flatter elevation, and one restrained violet signal palette. It works with
both `data-mode="light"` and `data-mode="dark"`. Omit the appearance attribute
to retain the detailed `atelier` styling and selectable accent themes. Quiet
controls retain explicit hover and pressed feedback, and tabs, segments,
selected rows, and active-descendant lists add a 3:1 signal outline or rail.

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
placement. Menu, popover, tooltip, and combobox surfaces measure the visual
viewport and clipping ancestors on open and on viewport or ancestor-scroll
changes, then shift and scroll within constrained portrait, landscape, or
embedded-shell windows instead of clipping. They dismiss when their anchor
leaves those visible bounds. Menu roving focus does not scroll the corrected
surface away from its anchor. Tooltip surfaces do not intercept the trigger's
hover target when edge correction places them over it.

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
quiet and atelier appearances in light and dark mode. Atelier exposes every
Aurelglyph accent theme; quiet intentionally reduces those choices to one
signal palette.

Responsive shells keep the top bar and footer in view while the main region
owns available height. Pagination wraps bounded page sets, data tables retain
horizontal scrolling, and anchored surfaces are constrained to the intersection
of the visual viewport and any clipping scrollports. The optional AppShell rail
responds to the shell's own container width and does not reserve space when it
is absent. Optional top bars and footers can be omitted without displacing the
flexible body row. These contracts are exercised at compact portrait, phone
landscape, tablet, laptop, and wide breakpoints by the workspace UX gate.
`AppShell` fills `100dvh` by default; embedded previews or bounded workspaces
can set `--ag-app-shell-height` on the shell without changing its internal
scroll ownership.

`AppShell` owns the page's `main` landmark by default. When demonstrating or
embedding a shell inside an existing `main`, set `contentAs="div"` (or another
appropriate element) to avoid nested landmarks. `TopBar` supplies the header
landmark; set its `titleAs` prop when the bar is embedded below another heading.
`NavigationStack` is deliberately landmark-neutral. Use the `headingLevel` prop
on navigation stacks and pages when the surrounding document outline requires a
different level.
