# Aurelglyph Rails

Rails asset and helper package for Aurelglyph design tokens.

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

## Enable Interactive Sheets

The sheet helper uses the native `<dialog>` element and ships a small,
framework-neutral controller at `aurelglyph.js`. Link the controller from a
Sprockets manifest when necessary:

```js
//= link aurelglyph.js
```

Then load it with the application layout:

```erb
<%= javascript_include_tag "aurelglyph", defer: true, data: { turbo_track: "reload" } %>
```

The controller initializes on `DOMContentLoaded`, `turbo:load`, and
`turbo:frame-load`. For markup inserted by another client-side framework, call
`window.Aurelglyph.sheets.init(rootElement)` after insertion.

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
