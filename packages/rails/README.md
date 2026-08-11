# Aurelglyph Rails

ActionView-safe Aurelglyph component helpers, generated design tokens and CSS,
and dependency-free interaction controllers for Rails applications.

## Install from Git

```ruby
gem "aurelglyph-rails",
  git: "https://github.com/absessive/aurelglyph",
  glob: "packages/rails/aurelglyph-rails.gemspec"
```

## Use the Stylesheet

Add the packaged stylesheet to your layout:

```erb
<%= stylesheet_link_tag "aurelglyph", "data-turbo-track": "reload" %>
```

Sprockets apps may also require the asset from an application stylesheet:

```css
/*
 *= require aurelglyph
 */
```

## Enable Interaction Controllers

The package ships a small framework-neutral controller at `aurelglyph.js` for
modal overlays, menus, popovers, comboboxes, tabs, and segmented controls. Link
the controller from a Sprockets manifest when necessary:

```js
//= link aurelglyph.js
```

Then load it with the application layout:

```erb
<%= javascript_include_tag "aurelglyph", defer: true, data: { turbo_track: "reload" } %>
```

The controller initializes on `DOMContentLoaded`, `turbo:load`, and
`turbo:frame-load`, and closes open interactions on `turbo:before-cache`. For
markup inserted by a Turbo Stream or another client-side framework, call
`window.Aurelglyph.init(rootElement)` after insertion. Initialization is
idempotent. A trigger-only inserted subtree is also synchronized when its sheet
lives elsewhere in the document. Re-initializing a Turbo-morphed root rebinds
replacement combobox, command, slider, and number-field controls and
resynchronizes their rendered state. Native form resets also resynchronize
checkbox and switch state, slider output, number-step boundaries, combobox
selection, command filtering, and segmented selection.

The public controller namespaces are:

```js
window.Aurelglyph.sheets       // also .dialogs and .drawers
window.Aurelglyph.menus
window.Aurelglyph.popovers
window.Aurelglyph.comboboxes
window.Aurelglyph.commands
window.Aurelglyph.tooltips
window.Aurelglyph.selections
```

Sheet, dialog, drawer, menu, popover, and combobox controllers expose `init`,
`open`, `close`, and `sync`. Comboboxes additionally expose `select(id, value)`.
Selection groups expose `init` and `select(id, value)`.
Use `window.Aurelglyph.destroy(rootElement)` before manually caching or removing
a subtree with an open interaction.

While open, menu, popover, tooltip, and combobox surfaces stay within the
intersection of the visual viewport and any clipping scrollport ancestors; the
controller remeasures on viewport changes and ancestor scrolling, and dismisses
a surface when its anchor leaves those visible bounds. For shared AppShell
markup, keep `.ag-app-shell__nav` as a direct child of
`.ag-app-shell__body`. The stylesheet detects that relationship and switches
the rail from the shell's own container width rather than the page viewport.
The body remains in the flexible shell row when the top bar, footer, or both
are omitted.

## Sheets, Dialogs, and Drawers

Give a sheet a stable `id`, point opening controls at it with
`data-aurelglyph-sheet-trigger`, and mark controls inside the sheet with
`data-aurelglyph-sheet-dismiss`:

```erb
<%= button_tag "Open details",
  type: "button",
  data: { aurelglyph_sheet_trigger: "system-details" } %>

<%= aurelglyph_sheet(
  "System details",
  id: "system-details",
  actions: button_tag(
    "Close",
    type: "button",
    data: { aurelglyph_sheet_dismiss: true }
  )
) do %>
  Systems operational.
<% end %>
```

`open: true` records server-rendered intent as `data-open="true"`; the helper
does not emit a non-modal `open` attribute or a false static `aria-modal` claim.
The controller observes `data-open`, calls `showModal()` or `close()`, handles
Escape and backdrop dismissal, and restores focus to the opening control. Code
that owns sheet state can set `sheet.dataset.open` to `"true"` or `"false"`, or
call `window.Aurelglyph.sheets.open(id)` and `.close(id)`. Open and close changes
also dispatch bubbling `aurelglyph:sheet-open` and `aurelglyph:sheet-close`
events with a `detail.reason` value.

Dialogs and drawers use the same native modal controller and trigger contract.
They also dispatch kind-specific `aurelglyph:dialog-open`,
`aurelglyph:dialog-close`, `aurelglyph:drawer-open`, and
`aurelglyph:drawer-close` events. Kind-specific
`data-aurelglyph-dialog-trigger` / `-dismiss` and
`data-aurelglyph-drawer-trigger` / `-dismiss` hooks are supported as aliases
for the shared sheet hooks.

```erb
<%= button_tag "Edit system",
  type: "button",
  data: { aurelglyph_sheet_trigger: "edit-system" } %>

<%= aurelglyph_dialog("Edit system", id: "edit-system") do %>
  <%= form_with model: @system do |form| %>
    <%= aurelglyph_number_field(
      name: "system[retries]",
      label: "Retries",
      value: @system.retries,
      min: 0,
      max: 10
    ) %>
  <% end %>
<% end %>

<%= aurelglyph_drawer("Inspector", id: "system-inspector", side: "end") do %>
  Systems operational.
<% end %>
```

Native `showModal()` is preferred. The fallback traps focus, isolates the rest
of the page with `inert`, locks scrolling, restores prior attributes on close,
and returns focus to the opening control. Set `dismissible: false` to block
Escape, backdrop, and declarative dismiss hooks while retaining programmatic
`close`. Nested layers dismiss one at a time, and Turbo cache cleanup does not
steal focus. Closing a parent resets all descendant disclosures and nested
sheets. Open requests for detached controls or controls inside a closed parent
are normalized closed, preventing invisible modal locks and stale dismissal
layers.

Dismiss hooks on ordinary buttons close immediately. A dismiss hook on a form
submitter waits for native constraint validation and the form `submit` event,
so an invalid Save or Apply action leaves its sheet or popover open. Native
`method="dialog"` forms retain their browser behavior.

## Menus, Popovers, Tooltips, and Comboboxes

Menus and dropdowns use roving focus, Arrow/Home/End navigation, wrapping and
repeated-letter typeahead, Enter/Space activation, Escape and outside-click
dismissal, and a bubbling `aurelglyph:menu-select` event whose detail contains
`value`.

```erb
<%= aurelglyph_menu(
  label: "System actions",
  id: "system-actions",
  items: [
    { label: "Open", href: system_path(@system), icon: "external-link" },
    { separator: true },
    { label: "Archive", value: "archive", icon: "archive" }
  ]
) %>
```

An item without `href` is a real button and dispatches the selection event. An
item that provides `name` and `form_value` defaults to `type="submit"`, making it
a successful form submitter; `attributes: { type: "button" }` explicitly opts
out. `disabled: true` is enforced for both links and buttons.
`aurelglyph_dropdown` is an alias with the additional `ag-dropdown` class.
Menu and popover triggers always render as non-submitting `type="button"`
controls. A disabled menu is normalized closed; a disabled popover trigger may
still accompany a programmatically controlled open panel.

```erb
<%= aurelglyph_popover(
  trigger: "Filters",
  label: "Filter systems",
  id: "system-filters"
) do %>
  <%= aurelglyph_checkbox(name: "active", label: "Active only") %>
  <%= button_tag "Apply", type: "button", data: { aurelglyph_popover_dismiss: true } %>
<% end %>

<%= aurelglyph_tooltip("Open system settings", label: "Settings") %>

<%= aurelglyph_combobox(
  name: "system_id",
  label: "System",
  options: @systems.map { |system| { label: system.name, value: system.id } },
  value: params[:system_id],
  help_text: "Type to filter systems"
) %>
```

Comboboxes use a visible text input plus a hidden submitted value. They filter
labels, values, and optional option `keywords` without a dependency, maintain
`aria-activedescendant`, skip disabled options,
support Arrow/Home/End/Enter/Escape, and emit `aurelglyph:combobox-input` and
`aurelglyph:combobox-select`. Focus leaving the widget closes its list. Disabled,
loading, and read-only comboboxes cannot open or mutate selection; disabled and
loading hidden values are omitted from form submission. Values that do not
match an enabled option normalize to an empty selection instead of submitting
stale or disabled data. Typing after a selection clears both the submitted
value and stale selected-option styling.
`aurelglyph_autocomplete` is an alias.

Tooltip hover and focus activation compose: leaving with the pointer does not
hide a still-focused tooltip, and blurring does not hide one that remains
hovered. Programmatically opened tooltips also participate in outside-click
dismissal and nested layer ordering.

Command palettes filter labels and each item’s `keywords`, maintain an active
descendant, render a polite `empty_text` status when no command matches, and
support Arrow/Home/End/Enter/Escape. They dispatch
`aurelglyph:command-palette-input`, `aurelglyph:command-palette-select`, and
`aurelglyph:command-palette-dismiss`; Escape clears a nonempty query, while an
empty-query Escape remains available to an enclosing dialog. Named commands
use the same `name`/`form_value` submitter contract and explicit `attributes`
override as menu items.

The gem packages Libre Baskerville, Atkinson Hyperlegible, and Space Mono
WOFF2 files under `app/assets/fonts/aurelglyph`. Keep that directory on the
same asset path as the stylesheet so its relative `@font-face` URLs resolve.
The full OFL and upstream notices ship beside the font files.

## Use Tokens in Views

```erb
<%= aurelglyph_token("color.accent.royal-purple.300") %>
```

## Use View Helpers

Helpers return `ActiveSupport::SafeBuffer` values built with ActionView tag
builders. Consumer text and attributes remain escaped, while helper markup
renders directly through ordinary `<%= ... %>` output.

```erb
<%= aurelglyph_icon("settings", title: "Settings") %>
<%= aurelglyph_card(title: "Status", eyebrow: "Live") do %>
  Systems operational.
<% end %>
```

The icon helper emits the same curated 105 SVG glyphs as the React adapter.
Expandable sections use native `<details open>` state and require no script for
their disclosure behavior. Their visible chevron uses the same curated SVG icon
contract and rotates with native open state.

### Controls and feedback

The interaction helper set includes:

- `aurelglyph_icon_button` and `aurelglyph_button_group`
- `aurelglyph_checkbox`, `aurelglyph_radio_group`, `aurelglyph_slider`,
  `aurelglyph_number_field`, `aurelglyph_select`, and `aurelglyph_switch`
- `aurelglyph_spinner`, `aurelglyph_divider`, progress, alerts, toasts, badges,
  skeletons, metrics, tables, and pagination

Icon buttons default to non-submitting `type: "button"`; pass `type: "submit"`
or `type: "reset"` explicitly when they participate in a form.

Native inputs receive native `disabled`, `readonly`, and `required` attributes
where the platform supports them. Helpers compose descriptions and errors into
`aria-describedby`, apply `aria-invalid` and `aria-busy`, and expose consistent
`data-disabled`, `data-invalid`, and `data-loading` states. Errors use polite
live regions.

Checkboxes support `indeterminate: true`; the controller applies the native
indeterminate property and clears the mixed state after a user change.
Switches keep their explicit `aria-checked` state synchronized after changes
and native form resets.

Read-only controls preserve the same successful form value as their editable
counterpart. A read-only radio group whose requested value is missing or
disabled omits its key; a read-only select with no enabled explicit selection
resolves to the first enabled option. Switch
`value:` defaults to `"1"` and is shared by both visible and read-only hidden
inputs. Sliders clamp and align the rendered, displayed, and submitted value to
their finite min/max/step contract. Number fields clamp to finite bounds and
their step buttons move along the same positive step grid used for boundary
states; invalid numeric steps normalize to `1` and negative steps to their
absolute value. A blank negative-only range enters the nearest valid boundary
instead of disabling both step controls.

Named segmented controls submit only when they resolve an active option; an
empty or entirely disabled group does not emit a successful empty value. Menu
checkboxes accept `true`, `false`, or `mixed`, while menu radio items accept
only `true` or `false`, keeping `aria-checked` valid for each role.

Computed structural, state, and accessibility attributes are reserved. Caller
attributes are escaped and preserved where supported, but cannot spoof helper
IDs, roles, controller hooks, or computed ARIA/data state.

Pagination only renders links when URLs are supplied; it no longer emits
interactive-looking no-op buttons:

```erb
<%= aurelglyph_pagination(
  current_page: @systems.current_page,
  total_pages: @systems.total_pages,
  page_url: ->(page) { systems_path(page: page) }
) %>
```

### Layout primitives

Use `aurelglyph_surface`, `aurelglyph_box`, `aurelglyph_stack`,
`aurelglyph_container`, and `aurelglyph_grid` to preserve the shared Aurelglyph
layout contract without utility-class coupling. `aurelglyph_surface` defaults
to a semantic-neutral `<div>`; pass `as: :section` or `as: :article` only when
the content is a real document section.

```erb
<%= aurelglyph_container(size: "xl") do %>
  <%= aurelglyph_grid(
    columns: { base: 1, md: 2, lg: 3 },
    gap: 4,
    min_item_width: "16rem"
  ) do %>
    <%= render @systems %>
  <% end %>
<% end %>
```

Layout tags, enum values, column counts, spacing, and CSS dimensions are
validated before rendering. Arbitrary consumer text and attributes still flow
through ActionView escaping; none of the helpers use blanket `html_safe`.
