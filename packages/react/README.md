# @aurelglyph/react

Accessible React controls that implement the Aurelglyph component contract.

Public npm publication begins with Aurelglyph `1.0.0`; before then, consume this
package from the Git repository or workspace.

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

The package entry declares a React client boundary, so it can be imported from
Next.js and other React Server Component applications without making callers
repeat `"use client"`. Components produce stable server markup and are covered
by a representative hydration contract.

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

## Catalog essentials (Unreleased)

`Link`, `Chip`, `PasswordField`, `InputGroup`, `ValidationSummary`, `Accordion`,
`Stepper`, and `Rating` are workspace additions, not exports in the 0.8.0 tag.
They use existing semantic tokens in both appearances and modes.

```tsx
<Link external externalLabel="Opens in a new tab" href="https://example.com">Guide</Link>
<Chip defaultSelected label="Local" onRemove={removeLocal} removeLabel="Remove Local" />
<PasswordField autoComplete="new-password" label="Password" name="password" />
<InputGroup addonDescription="US dollars" label="Amount" leading="$" name="amount" trailing="USD" />
<ValidationSummary errors={issues} focusKey={submissionCount} />
<Accordion defaultValue={["one"]} items={[{ id: "one", title: "Workspace", content: "Local changes" }]} type="single" />
<Stepper currentId="review" items={steps} onStepChange={navigateToStep} />
<Rating defaultValue={3} label="Experience" name="rating" />
```

Unavailable Link renders a non-focusable placeholder without destination or
event handlers. New-tab destinations get a visible icon and localizable
`externalLabel` notice, including when supplied through `target="_blank"` alone.
Chip supports controlled `selected` or `defaultSelected`;
selection and explicitly labeled removal are sibling buttons. Use
`selectable={false}` for removal-only items and Badge for static labels.

InputGroup owns exactly one input and its label/help/error relationships. String
addons are decorative; describe meaningful units with `addonDescription`. Action
addons must be independently labeled and supplied with their own disabled state.
PasswordField accepts ordinary native input props/ref, `showLabel`/`hideLabel`,
and password-manager `autoComplete`. Read-only permits reveal, not value edits;
disabled/loading prevents both. The server initially renders a masked input.
Reveal retains the same input, selection, value, and prior focus intent, including
controlled inputs and React 19 callback-ref cleanup.

ValidationSummary issues are `{ id, message, fieldId?, onFocus? }`. It renders
nothing when empty; `focusKey` and `announcementKey` are optional once-only
submission request identifiers for the lifetime of the mounted summary, even
when keys cycle. Prefer one request method per submission to
avoid duplicate announcements; announcement text must not contain
field values. `announcementLabel(title, count)` formats the complete phrase,
including localized word order. Inline validation and form state remain application-owned.

Accordion uses array `value`/`defaultValue` and `onValueChange` for either
single or multiple policy; `headingLevel` defaults to 3. Its existing
ExpandableSection primitive remains independently available. Collapsed panels
are hidden and inert. Stepper is an ordered status list; only enabled items
with `href` or a supplied `onStepChange` become controls. Override all generated
phrases with `statusLabels`.

Rating uses `value`/`defaultValue`, `onValueChange`, whole-number `max` (1–20),
and native radios/form values. Zero means unselected; optional fields offer
`clearLabel`, required fields cannot clear. Read-only preserves value without
mutation. `valueLabel(value, max)` supplies localized labels, including zero.
Keyboard arrows follow RTL and Home/End select bounds. No validation engine,
workflow routing, or fractional rating is implied.
Native form reset silently restores uncontrolled Chip/Rating defaults and
resynchronizes their form value and selection paint. Controlled values stay
owner-supplied; a cancelled reset changes nothing.

## Interaction behavior

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
  skipping. Horizontal arrows follow the computed writing direction in RTL.
- `Menu`: Arrow Up/Down, Home, End, typeahead, Enter/Space opening, Escape
  dismissal, and focus restoration. Supply `textValue` when an item's `label`
  is rich React content so typeahead follows the visible label.
- `CommandPalette` and `Combobox`: filtering, active-descendant tracking,
  Arrow Up/Down, Home, End, Enter selection, and Escape dismissal.
- `Tooltip`: focus and pointer activation with Escape dismissal.

`Menu` and `Combobox` own their complete tokenized popup surfaces. `Select`
keeps the real HTML `<select>` for native form submission, validation, keyboard,
and assistive-technology behavior, then progressively opts its picker into the
customizable-select contract. Supporting browsers receive Aurelglyph option,
selected, hover, focus, radius, surface, and elevation styling in both modes and
appearances; other browsers retain a mode-aware native picker.
Controlled Combobox values that no longer exist or become disabled resolve as
unselected for their visible label, hidden form value, selected option, and
native required validation. Supplying `value` and `onValueChange` does not lock
the search text; add `inputValue` and `onInputValueChange` only when the
application also controls the query.

Use `MoreInformation` for optional explanatory copy that would otherwise stay
visible beside a control or panel. It composes the Popover behavior into a
compact, icon-backed trigger with an accessible contextual label. Keep
validation errors and live status messages inline. Opening a Popover moves
keyboard focus to its first interactive child, or to the labeled panel when it
contains only explanatory copy; Escape dismisses it and restores trigger focus.

```tsx
<MoreInformation label="Project name information">
  <p>Use the short operational name shown in system navigation.</p>
</MoreInformation>
```

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
