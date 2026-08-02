# Aurelglyph

Aurelglyph is a token-first UX design language and component system for SwiftUI,
React, React Native, and Ruby on Rails apps.

It provides one shared visual language across platforms: generated design
tokens, CSS variables, React primitives, React Native theme values, Swift token
constants, and Rails-friendly assets.

Current version: `0.5.0`

## Status

This repository is the Aurelglyph workspace. The package-manager examples below
show the current consumer API for npm, RubyGems, Swift Package Manager, Git, and
local workspace paths.

Version 0.5.0 is the interaction-foundations release: overlays, complete choice
and numeric inputs, loading feedback, and responsive layout primitives now share
one declared contract across CSS/Web, React, React Native, SwiftUI, and Rails.
Adapter and browser suites exercise applicable disabled, loading, read-only,
invalid, keyboard, dismissal, focus, accessibility, and reduced-motion behavior.

For concrete minimum-configuration setup across GitHub Pages, React/CSS, Rails,
and Swift, see [docs/consuming.md](docs/consuming.md).

## What Is Included

- Canonical design tokens
- Generated CSS, TypeScript, React Native, Swift, and Rails-friendly outputs
- Theme support for dark mode, light mode, and multiple accent themes
- Phase 1 mobile foundations: app shell, top bar, tab bar, list rows, cards,
  search, switches, buttons, fields, file upload, icons, and expandable sections
- Phase 2 app controls: navigation stack, toolbar, sheet, segmented control,
  select, alert, empty state, avatar, and badge
- Phase 3 workbench controls: tabs, breadcrumbs, toast, progress, skeleton,
  metrics, data table, pagination, and command palette
- Interaction foundations: dialog, drawer, menu/dropdown, popover, tooltip,
  icon button, button group, checkbox, radio group, slider, number field,
  combobox/autocomplete, spinner, divider, surface/box, stack, container, and
  responsive grid
- A machine-readable [component manifest](component-manifest.json), generated
  support matrix, and [feature-completeness roadmap](docs/roadmap.md)
- A static preview and a Vite React example app that consume the packages

## Install

Install only the packages your app needs.

### React

```bash
npm install @aurelglyph/css @aurelglyph/react
```

Import the CSS package once near your app entry point. It includes generated
tokens, packaged fonts, base styles, and the shared component class layer used
by React and Rails:

```tsx
import "@aurelglyph/css";
```

`@aurelglyph/react/styles.css` is also available for React-only adopters that
want just the component class layer.

`@aurelglyph/css` packages the Aurelglyph web fonts locally as WOFF2 files.
Libre Baskerville is used for display and editorial text, Atkinson Hyperlegible
for UI/body copy, and Space Mono for code, token names, technical labels, and
metadata. The bundled font files are distributed
under the SIL Open Font License 1.1, while Aurelglyph code remains MIT. No
Google Fonts runtime request is required. SwiftUI consumers receive native TTF
assets in the Swift package and should use `AurelglyphFontRegistry` plus
`AurelglyphTypography` for registered custom fonts with system fallbacks.
`npm run build:assets` verifies locked SHA-256 checksums and synchronizes the
canonical web/native assets into docs, preview, Rails, and React Native outputs.
Every distributed font directory includes the upstream notices and full OFL.

Use the components in app code:

```tsx
import { useState } from "react";
import {
  AppShell,
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  Combobox,
  CommandPalette,
  Container,
  DataTable,
  Dialog,
  Divider,
  Drawer,
  EmptyState,
  ExpandableSection,
  FileUpload,
  Grid,
  Icon,
  IconButton,
  ListRow,
  ListSection,
  Menu,
  Metric,
  NavigationPage,
  NavigationStack,
  NumberField,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  SearchField,
  SegmentedControl,
  Select,
  Sheet,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Surface,
  Switch,
  Tabs,
  TabBar,
  TextArea,
  TextField,
  Toast,
  Tooltip,
  Toolbar,
  TopBar
} from "@aurelglyph/react";

export function DesignSystemSetup() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <AppShell
      topBar={<TopBar title="Workbench" subtitle="Systems" />}
      footer={<TabBar activeId="systems" items={[{ id: "systems", label: "Systems", href: "#systems", icon: "settings" }]} />}
    >
      <SearchField label="Search systems" name="query" />
      <Card eyebrow="Live" title="Status">Systems operational</Card>
      <ListSection title="Settings">
        <ListRow icon="bell" selected title="Quiet mode" description="Enabled" trailing="On" />
      </ListSection>
      <Switch label="Quiet mode" name="quiet" />
      <NavigationStack title="Workbench">
        <NavigationPage actions={<Toolbar><Button icon="save">Save</Button></Toolbar>} title="Systems">
          <SegmentedControl activeId="grid" items={[{ id: "grid", label: "Grid" }, { id: "list", label: "List" }]} />
          <Select label="Theme" name="theme" options={[{ label: "Royal purple", value: "royal-purple" }]} />
          <Alert title="Package ready" tone="success">Design tokens and native controls are ready to use.</Alert>
          <Avatar name="Ajit Chakrapani" />
          <Badge tone="accent">Live</Badge>
          <EmptyState title="No archived releases">Use this state when a filtered list has no records.</EmptyState>
          <Button onClick={() => setDetailsOpen(true)} variant="secondary">Open sheet</Button>
          <Sheet onOpenChange={setDetailsOpen} open={detailsOpen} title="Details">Use sheets for focused edits without leaving the current page.</Sheet>
        </NavigationPage>
      </NavigationStack>
      <Breadcrumbs items={[{ href: "#workbench", label: "Workbench" }, { current: true, label: "Systems" }]} />
      <Tabs activeId="overview" items={[{ id: "overview", label: "Overview" }]}>Review generated package status.</Tabs>
      <Metric label="Latency" value="42ms" delta="Stable" />
      <Progress value={72} />
      <Skeleton />
      <DataTable columns={[{ header: "System", key: "system", render: (row: { system: string }) => row.system }]} getRowId={(row) => row.system} rows={[{ system: "Pages" }]} />
      <Pagination currentPage={2} totalPages={3} />
      <Toast title="Settings saved" tone="success">The toast reports a non-blocking outcome.</Toast>
      <CommandPalette items={[{ icon: "search", id: "search", label: "Search systems", shortcut: "Cmd-K" }]} />
      <TextField
        label="Install"
        name="install"
        placeholder="npm install @aurelglyph/css @aurelglyph/react"
        helpText="Use the CSS package plus the adapter for your app framework."
      />
      <TextArea
        label="Usage"
        name="usage"
        placeholder="Import @aurelglyph/css, set data-mode and data-theme, then compose React controls."
      />
      <FileUpload
        accept=".json,.css,.ts,.tsx,.swift,.rb"
        label="Generated outputs"
        name="outputs"
      />
      <Button icon="send" type="submit">
        Use in app
      </Button>
      <ExpandableSection eyebrow="System" title="Advanced settings">
        <p>Animated content with accessible disclosure semantics.</p>
      </ExpandableSection>
      <Icon name="credit-card" title="Billing" />
    </AppShell>
  );
}
```

### Component Usage

#### Icon

Aurelglyph ships a curated icon catalog for common web and iOS app
surfaces. Use `title` for standalone meaningful icons and `decorative` when
adjacent text already describes the action.

```tsx
import { Button, Icon } from "@aurelglyph/react";

<Icon name="dashboard" title="Dashboard" />
<Icon name="credit-card" title="Billing" />
<Icon name="thumbs-up" title="Approve" />
<Icon decorative name="sync" />
<Button icon="external-link">Open</Button>
```

#### Button

Use `Button` for primary actions, secondary controls, destructive actions, and
quiet toolbar commands. The `icon` prop accepts any Aurelglyph icon name.

```tsx
<Button icon="save" type="submit">Save</Button>
<Button icon="settings" variant="secondary">Settings</Button>
<Button icon="delete" variant="danger">Delete</Button>
<Button icon="search" variant="ghost">Search</Button>
```

#### ExpandableSection

Use `ExpandableSection` for animated disclosure panels. It supports uncontrolled
usage with `defaultOpen` and controlled usage with `open` plus `onOpenChange`.

```tsx
import { ExpandableSection } from "@aurelglyph/react";

<ExpandableSection defaultOpen eyebrow="System" title="Advanced settings">
  <p>Animated content with accessible disclosure semantics.</p>
</ExpandableSection>
```

#### Phase 1 Mobile Foundations

Use the mobile foundation components for app chrome, navigable sections,
settings lists, status cards, search, and binary controls.

`AppShell` renders its content as the page's `main` landmark by default. For an
embedded preview inside an existing `main`, pass `contentAs="div"` to preserve a
valid landmark structure, and set `TopBar`'s `titleAs` prop to match the
surrounding heading hierarchy.

```tsx
<AppShell
  topBar={<TopBar title="Workbench" subtitle="Systems" />}
  footer={<TabBar activeId="systems" items={[{ id: "systems", label: "Systems", href: "#systems", icon: "settings" }]} />}
>
  <SearchField label="Search systems" name="query" />
  <Card eyebrow="Live" title="Status">Systems operational</Card>
  <ListSection title="Settings">
    <ListRow icon="bell" selected title="Quiet mode" description="Enabled" trailing="On" />
  </ListSection>
  <Switch label="Quiet mode" name="quiet" />
</AppShell>
```

#### Phase 2 App Controls

Use Phase 2 controls for application structure and immediate feedback.
`NavigationStack` and `NavigationPage` define nested app surfaces, `Toolbar`
holds page actions, `Sheet` handles focused secondary tasks, and
`SegmentedControl` plus `Select` switch between bounded choices. `Alert`,
`EmptyState`, `Avatar`, and `Badge` cover status, identity, and compact state
labels without requiring custom markup.

`Sheet` is controlled. Pass `onOpenChange` so Escape, backdrop clicks, and
native dialog close requests can update application state. Opening moves focus
into the modal; closing restores focus to the invoking control.

```tsx
<NavigationStack title="Workbench">
  <NavigationPage actions={<Toolbar><Button icon="save">Save</Button></Toolbar>} title="Systems">
    <SegmentedControl activeId="grid" items={[{ id: "grid", label: "Grid" }, { id: "list", label: "List" }]} />
    <Select label="Theme" name="theme" options={[{ label: "Royal purple", value: "royal-purple" }]} />
    <Alert title="Package ready" tone="success">Design tokens and native controls are ready to use.</Alert>
    <Avatar name="Ajit Chakrapani" />
    <Badge tone="accent">Live</Badge>
    <EmptyState title="No archived releases">Use this state when a filtered list has no records.</EmptyState>
    <Button onClick={() => setDetailsOpen(true)} variant="secondary">Open sheet</Button>
    <Sheet onOpenChange={setDetailsOpen} open={detailsOpen} title="Details">Use sheets for focused edits without leaving the current page.</Sheet>
  </NavigationPage>
</NavigationStack>
```

#### Phase 3 Workbench Controls

Use Phase 3 controls for workbench and data-heavy product surfaces. `Tabs` and
`Breadcrumbs` organize location, `Toast` reports non-blocking outcomes,
`Progress` and `Skeleton` show loading state, `Metric` summarizes a measured
value, `DataTable` and `Pagination` handle bounded result sets, and
`CommandPalette` exposes keyboard-first actions.

```tsx
<Breadcrumbs items={[{ href: "#workbench", label: "Workbench" }, { current: true, label: "Systems" }]} />
<Tabs activeId="overview" items={[{ id: "overview", label: "Overview" }]}>Review generated package status.</Tabs>
<Metric label="Latency" value="42ms" delta="Stable" />
<Progress value={72} />
<Skeleton />
<DataTable columns={[{ header: "System", key: "system", render: (row: { system: string }) => row.system }]} getRowId={(row) => row.system} rows={[{ system: "Pages" }]} />
<Pagination currentPage={2} totalPages={3} />
<Toast title="Settings saved" tone="success">The toast reports a non-blocking outcome.</Toast>
<CommandPalette items={[{ icon: "search", id: "search", label: "Search systems", shortcut: "Cmd-K" }]} />
```

#### Interaction Foundations

Use the 0.5 controls for modal work, anchored actions, complete choice and
numeric input, loading feedback, and responsive composition. Interactive
controls are controlled or uncontrolled where that distinction is meaningful;
modal components always report dismissal so application state stays canonical.

```tsx
<ButtonGroup label="Release actions">
  <Button onClick={() => setDialogOpen(true)}>Publish</Button>
  <Menu
    label="More actions"
    items={[{ id: "archive", label: "Archive", icon: "archive" }]}
  />
</ButtonGroup>

<Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Publish release?">
  Run the verified package gate before publishing.
</Dialog>

<Combobox
  label="Accent theme"
  options={[{ label: "Royal purple", value: "royal-purple" }]}
  value={theme}
  onValueChange={setTheme}
/>
<Checkbox label="Automated verification" checked={verify} onChange={handleVerify} />
<RadioGroup label="Density" options={densityOptions} value={density} onValueChange={setDensity} />
<Slider label="Signal strength" value={signal} onValueChange={setSignal} />
<NumberField label="Retention days" min={1} max={90} value={days} onValueChange={setDays} />

<Grid columns={{ base: 1, md: 2, lg: 3 }} minItemWidth="12rem">
  <Surface>Primary system</Surface>
  <Surface elevation="floating">Live inspection</Surface>
</Grid>
```

The canonical [component manifest](component-manifest.json) records all 18
cross-platform interaction-foundation families. `npm run check:components`
validates the manifest schema and verifies all 90 implementation-evidence claims
against shipped adapter source. Platform and browser suites test behavior and
accessibility separately.

#### TextField

Use `TextField` for one-line values. Labels are required, while helper and error
text are optional and wired into accessible descriptions.

```tsx
<TextField
  label="Project name"
  name="projectName"
  placeholder="Smart home dashboard"
  helpText="Use a short, scannable name."
/>
<TextField label="Version" name="version" error="Use a supported package version." />
```

#### TextArea

Use `TextArea` for longer notes and descriptions. It follows the same label,
helper, and error contract as `TextField`.

```tsx
<TextArea
  label="Notes"
  name="notes"
  placeholder="Describe the app surface."
  helpText="Keep implementation notes concrete."
/>
```

#### FileUpload

Use `FileUpload` for file inputs. Pass native input props such as `accept`,
`multiple`, and `required` directly.

```tsx
<FileUpload
  accept=".json,.css,.ts,.tsx,.swift,.rb"
  label="Generated outputs"
  name="outputs"
  helpText="Choose generated package artifacts."
/>
```

Rails apps can use the helper exposed by the engine:

```erb
<%= aurelglyph_icon("dashboard", title: "Dashboard") %>
<%= aurelglyph_icon("sync", decorative: true, class: "toolbar-icon") %>
<%= aurelglyph_expandable_section("Advanced settings", eyebrow: "System", open: true) do %>
  <p>Server-rendered disclosure content.</p>
<% end %>
<%= aurelglyph_search_field(name: "query", label: "Search systems") %>
<%= aurelglyph_card(title: "Status", eyebrow: "Live") { "Systems operational" } %>
<%= aurelglyph_list_section(title: "Settings") do %>
  <%= aurelglyph_list_row("Quiet mode", description: "Enabled", icon: "bell", selected: true, trailing: "On") %>
<% end %>
<%= aurelglyph_switch(name: "quiet", label: "Quiet mode", checked: true) %>
<%= aurelglyph_alert("Package ready", tone: "success") { "Design tokens and native controls are ready to use." } %>
<%= aurelglyph_segmented_control([{ id: "grid", label: "Grid" }, { id: "list", label: "List" }], active: "grid") %>
<%= aurelglyph_badge("Live", tone: "accent") %>
<%= aurelglyph_metric(label: "Latency", value: "42ms", delta: "Stable") %>
<%= aurelglyph_progress(value: 72) %>
<%= aurelglyph_command_palette([{ id: "search", label: "Search systems", icon: "search", shortcut: "Cmd-K" }]) %>
<%= aurelglyph_dialog("Edit system", id: "edit-system") do %>
  <%= aurelglyph_number_field(name: "system[retries]", label: "Retries", min: 0, max: 10) %>
<% end %>
<%= aurelglyph_menu(label: "System actions", items: [{ label: "Archive", value: "archive", icon: "archive" }]) %>
<%= aurelglyph_combobox(name: "system_id", label: "System", options: @systems.map { |system| { label: system.name, value: system.id } }) %>
<%= aurelglyph_grid(columns: { base: 1, md: 2, lg: 3 }, min_item_width: "16rem") do %>
  <%= render @systems %>
<% end %>
```

Swift apps can use the typed icon contract when mapping to SwiftUI rendering or
platform image assets:

```swift
import AurelglyphUI

let icon = AurelglyphIcon.creditCard
let assetName = icon.rawValue
let label = icon.accessibilityLabel

@State private var expanded = true

AurelglyphExpandableSection("Advanced settings", eyebrow: "System", isExpanded: $expanded) {
  Text("Advanced settings stay visible while details expand.")
}

AurelglyphAppShell {
  AurelglyphTopBar("Workbench", subtitle: "Systems") { EmptyView() } actions: { Text("Edit") }
} content: {
  AurelglyphSearchField(text: $query)
  AurelglyphCard(title: "Status", eyebrow: "Live") { Text("Systems operational") }
  AurelglyphListSection("Settings") {
    AurelglyphListRow("Quiet mode", subtitle: "Enabled", systemImage: "bell", isSelected: true) { Text("On") }
  }
  AurelglyphSwitch("Quiet mode", isOn: $quiet)
} tabBar: {
  AurelglyphTabBar(items: tabs, selection: $selectedTab)
}

AurelglyphNavigationStack("Workbench") {
  AurelglyphSegmentedControl(items: [AurelglyphSegmentedItem(id: "grid", title: "Grid")], selection: $viewMode)
  AurelglyphAlert("Package ready") { Text("Design tokens and native controls are ready to use.") }
  AurelglyphBadge("Live")
  AurelglyphMetric(label: "Latency", value: "42ms", delta: "Stable")
  AurelglyphProgress(value: 72)
  AurelglyphCommandPalette(items: [AurelglyphCommandItem(id: "search", title: "Search", systemImage: "magnifyingglass", shortcut: "Cmd-K")])
}
```

### CSS-Only Apps

```bash
npm install @aurelglyph/css
```

Import the stylesheet:

```css
@import "@aurelglyph/css";
```

Set mode and accent theme on the root element:

```html
<html data-mode="dark" data-theme="royal-purple">
```

Available modes:

- `dark`
- `light`

Available themes:

- `royal-purple`
- `amber`
- `forest`
- `deep-blue`
- `cyan`
- `steel`

Use CSS variables in app styles, or compose with the shared `ag-*` component
classes shipped in the package:

```css
.panel {
  color: var(--ag-color-semantic-foreground);
  background: var(--ag-color-semantic-surface);
  border: 1px solid var(--ag-color-semantic-border);
  border-radius: var(--ag-radius-lg);
  box-shadow: var(--ag-shadow-inset);
}

.panel:focus-within {
  outline: 1px solid rgba(var(--ag-accent-rgb), 0.75);
  box-shadow: 0 0 0 4px rgba(var(--ag-accent-rgb), 0.12);
}
```

```html
<section class="ag-card">
  <div class="ag-card__body">Systems operational</div>
</section>
```

### Design Tokens

```bash
npm install @aurelglyph/tokens
```

Use flattened token values from JavaScript or TypeScript:

```ts
import { tokens } from "@aurelglyph/tokens/tokens";

const background = tokens["color.mode.dark.background"];
const accent = tokens["color.accent.royal-purple.300"];
```

Use generated CSS variables directly:

```css
@import "@aurelglyph/tokens/generated.css";
```

### React Native

```bash
npm install @aurelglyph/react-native
```

The adapter targets React Native 0.86 or newer and React 19.2.3 or newer. Wrap
the app once for mode/accent resolution, then compose the same component
vocabulary used by the web, SwiftUI, and Rails adapters:

```tsx
import {
  AurelglyphProvider,
  Button,
  Checkbox,
  Combobox,
  Grid,
  Stack,
  Surface
} from "@aurelglyph/react-native";

export function Settings() {
  return (
    <AurelglyphProvider accent="royal-purple" mode="system">
      <Surface elevation="raised">
        <Stack gap={4}>
          <Combobox label="Operating mode" options={modes} value={mode} onValueChange={setMode} />
          <Checkbox checked={verify} label="Automated verification" onCheckedChange={setVerify} />
          <Grid columns={{ base: 1, md: 2 }}>
            <Button onPress={save}>Save changes</Button>
          </Grid>
        </Stack>
      </Surface>
    </AurelglyphProvider>
  );
}
```

`aurelglyphTheme` remains available for direct token access, while
`resolveAurelglyphTheme(mode, accent)` returns mode-aware native values.
Overlays use React Native `Modal`; tooltip behavior combines
`accessibilityHint` with a press/long-press visual treatment; and the dependency-
free slider exposes native `adjustable` actions. Hosts supply their preferred
document picker to `FileUpload` through `onRequestFiles`.

React Native font-family tokens resolve to native-safe Aurelglyph aliases, not
CSS stacks. The optional font subpath exposes Metro-compatible static requires
for the packaged TTF files:

```tsx
import { useFonts } from "expo-font";
import {
  aurelglyphFontAssets,
  aurelglyphFontFamilies
} from "@aurelglyph/react-native/fonts";

const [fontsLoaded] = useFonts(aurelglyphFontAssets);
const strongLabel = { fontFamily: aurelglyphFontFamilies.uiBold };
```

Bare React Native apps can link the same files from the package's
`assets/fonts` directory.

### SwiftUI

The workspace root exposes a Swift Package named `AurelglyphUI`. Its target
source lives in `packages/swift/Sources/AurelglyphUI`.

Add the repository as a Swift Package dependency, or use a local package path
to the workspace root during development:

```swift
.package(url: "https://github.com/absessive/aurelglyph.git", from: "0.5.0")
.product(name: "AurelglyphUI", package: "aurelglyph")
```

Then import the module:

```swift
import AurelglyphUI

let background = AurelglyphTokens.colorModeDarkBackground
let accent = AurelglyphTokens.colorAccentRoyalPurple300
```

Install the shared semantic theme near the application root. `.system` follows
the device appearance while preserving Aurelglyph's warm light and graphite
dark palettes:

```swift
WorkbenchView()
  .aurelglyphTheme(
    AurelglyphTheme(mode: .system, accent: .royalPurple)
  )
```

The 0.5 components use native bindings and presentations while keeping the
cross-platform names. Dialogs and drawers also provide view modifiers for
native presentation:

```swift
AurelglyphContainer {
  AurelglyphStack(spacing: 16) {
    AurelglyphNumberField("Retries", value: $retries, in: 0...10, step: 1)
    AurelglyphCombobox("Destination", options: destinations, query: $query, selection: $destination)
    AurelglyphCheckbox("Automated verification", isChecked: $verify)
  }
}
.aurelglyphDialog(
  isPresented: $showingArchive,
  title: "Archive system",
  message: "This can be restored later."
) {
  Text("The current system will move to Archive.")
} actions: {
  Button("Cancel", role: .cancel) { showingArchive = false }
  Button("Archive", role: .destructive) { archive() }
}
```

Use the native typography adapter for SwiftUI font roles:

```swift
AurelglyphFontRegistry.registerFonts()

Text("Aurelglyph")
  .font(AurelglyphTypography.displayLarge)

Text("System status")
  .font(AurelglyphTypography.body)

Text("color.accent.royal-purple.300")
  .font(AurelglyphTypography.monoLabel)

Text("Calibrated systems")
  .font(AurelglyphTypography.display(size: 48, relativeTo: .largeTitle))
```

Custom typography methods preserve the requested baseline while scaling
relative to the supplied Dynamic Type role. The generic `font` factory uses
role-specific defaults: large title for display, title 3 for editorial serif,
body for UI/body, and caption for mono.

The Swift package does not bundle the web `.woff2` font assets. It keeps the
font-family token strings available for reference, and bundles Apple-platform
`.ttf` files for Libre Baskerville, Atkinson Hyperlegible, and Space Mono.
`AurelglyphTypography` registers and uses those fonts when available, with
native SwiftUI serif, sans, and monospaced fallbacks.

The package currently supports iOS 17 and macOS 14.

### Rails

Rails apps can consume the `aurelglyph-rails` gem from a local path, from this
Git repository, or from RubyGems once published. The package ships a Rails
engine, generated CSS with tokens plus shared component classes, generated token
helpers, and ActionView-safe helpers for the full shared component contract.
It also packages a dependency-free interaction controller for sheets, dialogs,
drawers, menus, popovers, tooltips, comboboxes, command palettes, and selection
groups, plus the same WOFF2 font set and `@font-face` declarations as the CSS
adapter.

After `npm run build -w aurelglyph-rails`, the generated Rails-facing files are:

- `packages/rails/app/assets/stylesheets/aurelglyph.css`
- `packages/rails/app/assets/javascripts/aurelglyph.js`
- `packages/rails/app/assets/fonts/aurelglyph/`
- `packages/rails/lib/aurelglyph/tokens.rb`

For gem consumption, point Bundler at the package gemspec:

```ruby
gem "aurelglyph-rails",
  git: "https://github.com/absessive/aurelglyph",
  glob: "packages/rails/aurelglyph-rails.gemspec"
```

Use the stylesheet through the asset pipeline. Keep the bundled
`app/assets/fonts/aurelglyph` directory on the same asset path so the relative
font URLs resolve:

```css
/*
 *= require aurelglyph
 */
```

Load `aurelglyph.js` through the asset pipeline for interactive helpers. The
controller progressively enhances server-rendered markup with modal isolation,
roving focus, typeahead, filtering, layered dismissal, form-reset support, and
Turbo-safe lifecycle cleanup. See `packages/rails/README.md` for the complete
markup and event contract.

Use Ruby token values where server-rendered components need shared constants:

```ruby
Aurelglyph::TOKENS["color.mode.dark.background"]
```

Rails views can also use the helper installed by the engine:

```erb
<%= aurelglyph_token("color.accent.royal-purple.300") %>
```

## Theme Contract

Aurelglyph uses `data-mode` and `data-theme` attributes for runtime theming:

```html
<html data-mode="dark" data-theme="royal-purple">
```

Components should use semantic variables like
`--ag-color-semantic-background`, `--ag-color-semantic-surface`,
`--ag-color-semantic-foreground`, `--ag-color-semantic-border`, and
`--ag-color-semantic-accent` instead of hardcoded color values.

Focus indicators use `--ag-color-semantic-focus`; status text uses the
mode-aware success, warning, danger, and info semantic tokens. Shared component
motion becomes static when `prefers-reduced-motion: reduce` is active.

## Package Map

- `@aurelglyph/tokens`: canonical tokens and generator
- `@aurelglyph/css`: CSS variables, packaged fonts, base styles, and shared component classes
- `@aurelglyph/react`: React components and component styles
- `@aurelglyph/react-native`: React Native themes, native components, and optional packaged-font adapter
- `AurelglyphUI`: Swift Package exposing generated token constants, typography, and components
- `aurelglyph-rails`: Rails engine, stylesheet, token helper, and view helper

## Examples

Run the React example:

```bash
npm run dev -w @aurelglyph/example-react-vite
```

Open the static preview:

```bash
python3 -m http.server 8099 --bind 127.0.0.1 --directory preview
```

Then visit:

```text
http://127.0.0.1:8099/
```

### GitHub Pages

Build the raw GitHub Pages files:

```bash
npm run build:pages
```

This writes `docs/index.html`, `docs/usage.html`, `docs/components.html`, the
machine-readable `docs/component-manifest.json` and schema,
`docs/changelog.html`, `docs/CNAME`, and `docs/assets/fonts/ofl/`. The font
directory includes `OFL-1.1.txt` with upstream notices and the complete license.
The generated pages can be published with GitHub Pages configured to deploy
from the `docs/` directory on the selected branch.

For this repository, configure GitHub Pages in GitHub with:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`
- Custom domain: `aurelglyph.absessive.com`

In Cloudflare DNS, point the subdomain at GitHub Pages:

```text
Type: CNAME
Name: aurelglyph
Target: absessive.github.io
Proxy status: DNS only
TTL: Auto
```

After GitHub publishes the site, the static page is available at:

```text
https://aurelglyph.absessive.com/
```

The HTML changelog is available at:

```text
https://absessive.github.io/aurelglyph/changelog.html
```

Usage and component catalog pages are available at:

```text
https://absessive.github.io/aurelglyph/usage.html
https://absessive.github.io/aurelglyph/components.html
```

Other publishable artifacts are:

- `preview/` for the static preview.
- `examples/react-vite/dist/` for the Vite React example after
  `npm run build -w @aurelglyph/example-react-vite`.

The Vite example build uses root-relative asset URLs by default. That works for
a root-domain Pages site or custom domain. For a project Pages URL like
`https://OWNER.github.io/aurelglyph/`, build the example with a matching Vite
base path before uploading `examples/react-vite/dist/`.

## Development

### Commands

```bash
npm install
npm run build:assets
npm run build
npm run build:pages
npm run check:components
npm test
npm run test:rails
npm run test:swift
npm run typecheck
npm run version:check
npm run version:sync -- "Describe the changelog item"
npm run verify
```

No lint script exists yet. Add one before introducing lintable source rules.

## Versioning

Aurelglyph uses one shared version across every platform package. The root
`package.json` version is canonical. Run `npm run version:sync -- "Change
summary"` after changing the root version to update all package versions,
workspace package dependency pins, `package-lock.json`, `CHANGELOG.md`, and
version markers in the React example, Rails adapter, and static preview.

Run `npm run version:check` before publishing or consuming packages from apps.
