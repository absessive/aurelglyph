# Aurelglyph

Aurelglyph is a token-first UX design language and component system for SwiftUI,
React, React Native, and Ruby on Rails apps.

It provides one shared visual language across platforms: generated design
tokens, CSS variables, React primitives, React Native theme values, Swift token
constants, and Rails-friendly assets.

Current version: `0.8.1` (GitHub/source distribution; npm and RubyGems
publication begins with `1.0.0`)

## Status

This repository is the Aurelglyph workspace. The package-manager examples below
show the current consumer API for npm, RubyGems, Swift Package Manager, Git, and
local workspace paths. Before `1.0.0`, use Git, Swift Package Manager, or a local
workspace; the npm and RubyGems examples document the package contract that will
be published at `1.0.0`.

Version 0.8.0 establishes a production release foundation around the existing
catalog: bidirectional Web and Rails behavior, safer controlled values, React
server rendering, a real SwiftUI accessibility host, cross-browser fallback
coverage, clean-consumer package tests, pinned toolchains, reviewed security
exceptions, and controlled provenance-enabled publication. The simplified
`quiet` appearance and detailed `atelier` appearance remain available in light
and dark modes across every adapter.

The Rails adapter supports maintained Ruby 3.3+; the workspace uses Ruby 3.4.
That floor keeps its Rails dependency graph on patched interpreter and Nokogiri
lines.

The private tooling lock uses shell-quote 1.12.0 and retains all esbuild platform
packages for reproducible clean installs. Dependency regression tests cover
shell quoting and platform lock completeness; reviewed audit exceptions remain
limited to the existing private React Native tooling policy.

The 0.8.1 source tag is a dependency-maintenance patch on the immutable 0.8.0
component baseline. The newer catalog essentials below remain Unreleased on
main and are excluded from that maintenance tag. Full release gates still apply;
npm and RubyGems publication remains deferred until 1.0.0.

For concrete minimum-configuration setup across GitHub Pages, React/CSS, Rails,
and Swift, see [docs/consuming.md](docs/consuming.md).
Supported toolchains, browsers, semantic-versioning guarantees, release gates,
and current pre-1.0 scope limits are documented in
[docs/compatibility.md](docs/compatibility.md).

## What Is Included

- Canonical design tokens
- Generated CSS, TypeScript, React Native, Swift, and Rails-friendly outputs
- Theme support for the detailed `atelier` and simplified `quiet` appearances,
  each with light and dark modes
- Phase 1 mobile foundations: app shell, top bar, tab bar, list rows, cards,
  search, switches, buttons, fields, file upload, icons, and expandable sections
- Phase 2 app controls: navigation stack, toolbar, sheet, segmented control,
  select, alert, empty state, avatar, and badge
- Phase 3 workbench controls: tabs, breadcrumbs, toast, progress, skeleton,
  metrics, data table, pagination, and command palette
- Interaction foundations: dialog, drawer, menu/dropdown, popover, More
  Information, tooltip, icon button, button group, checkbox, radio group, slider, number field,
  combobox/autocomplete, spinner, divider, surface/box, stack, container, and
  responsive grid
- A machine-readable [component manifest](component-manifest.json), generated
  support matrix, and [feature-completeness roadmap](docs/roadmap.md)
- A static preview and a Vite React example app that consume the packages

The current workspace adds eight [catalog essentials](docs/roadmap.md#current-component-gap-audit-2026-10-06):
Link, Password Field, Input Group, Validation Summary, grouped Accordion,
interactive Chip, workflow Stepper, and integer Rating across all five surfaces.
React Native also gains standalone ExpandableSection. These are **Unreleased**
additions, not part of the 0.8.0 baseline or 0.8.1 maintenance tag. The core-control matrix now
includes nine previously omitted five-adapter families and explicitly separates
released evidence from workspace additions. It is not an exhaustive catalog;
older React Native shell, feedback, and data-display parity remains follow-on work.

Use Link for destinations and Button for actions. Unavailable links have no
destination or activation. Standalone Web links retain a minimum 24px target;
inline prose links keep natural text flow. Chip keeps selection and removal as separate controls;
static labels remain Badge. InputGroup owns one labeled input; string addons are
decorative, so provide `addonDescription` for meaningful units and independently
label action addons. Read-only Web input-group values and units retain readable
foreground paint. PasswordField starts masked and preserves the native input
when revealing. ValidationSummary accepts application-owned issues and explicit
once-per-submission focus/announcement requests; reused keys do not repeat while
mounted. It does not validate forms. Web Chip and Rating restore uncontrolled
defaults on a native form reset without firing change callbacks; controlled
values remain application-owned.
Accordion coordinates disclosures, Stepper describes workflow status, and Rating
selects whole-number values. Disclosure icons use mode-aware semantic accent
paint for visibility on light and dark surfaces. Package-owned labels and native announcements are
localizable; see each adapter guide for its copy contract.

Verification for this Unreleased batch (2026-10-06): local unit, lint/type,
three-browser, full Web UX/accessibility, and clean-consumer checks pass.
Hosted CI passed the SwiftUI host and Android APK build, but exposed React Native
password text loss on editing and a Chromium Rating reset assertion failure.
Local native keyboard readiness remains incomplete. These findings block release
of the new catalog; the strict native gates remain required. The 0.8.1
maintenance branch excludes this Unreleased batch.

## Install

Install only the packages your app needs.

The npm commands below document the `1.0.0` package contract. For `0.8.1`, use
this Git repository or a local workspace; npm and RubyGems publication is
intentionally deferred until `1.0.0`.

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
  MoreInformation,
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
  const [layout, setLayout] = useState("grid");
  const [section, setSection] = useState("overview");

  return (
    <AppShell
      topBar={<TopBar title="Workbench" subtitle="Systems" />}
      footer={<TabBar activeId="systems" items={[{ id: "systems", label: "Systems", href: "#systems", icon: "settings" }]} />}
    >
      <SearchField label="Search systems" name="query" />
      <MoreInformation label="Search information">Search covers active systems and archived releases.</MoreInformation>
      <Card eyebrow="Live" title="Status">Systems operational</Card>
      <ListSection title="Settings">
        <ListRow icon="bell" selected title="Quiet mode" description="Enabled" trailing="On" />
      </ListSection>
      <Switch label="Quiet mode" name="quiet" />
      <NavigationStack title="Workbench">
        <NavigationPage actions={<Toolbar><Button icon="save">Save</Button></Toolbar>} title="Systems">
          <SegmentedControl activeId={layout} items={[{ id: "grid", label: "Grid" }, { id: "list", label: "List" }]} onValueChange={setLayout} />
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
      <Tabs activeId={section} items={[{ id: "overview", label: "Overview" }, { id: "activity", label: "Activity" }]} onValueChange={setSection}>Review generated package status.</Tabs>
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
surrounding heading hierarchy. Its optional navigation rail responds to the
shell's own container width, so narrow split views and embedded shells keep a
single content column even on a wide page. Omitting an optional top bar or
footer does not displace the shell's flexible content row.

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
const [layout, setLayout] = useState("grid");

<NavigationStack title="Workbench">
  <NavigationPage actions={<Toolbar><Button icon="save">Save</Button></Toolbar>} title="Systems">
    <SegmentedControl activeId={layout} items={[{ id: "grid", label: "Grid" }, { id: "list", label: "List" }]} onValueChange={setLayout} />
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
const [section, setSection] = useState("overview");

<Breadcrumbs items={[{ href: "#workbench", label: "Workbench" }, { current: true, label: "Systems" }]} />
<Tabs activeId={section} items={[{ id: "overview", label: "Overview" }, { id: "activity", label: "Activity" }]} onValueChange={setSection}>Review generated package status.</Tabs>
<Metric label="Latency" value="42ms" delta="Stable" />
<Progress value={72} />
<Skeleton />
<DataTable columns={[{ header: "System", key: "system", render: (row: { system: string }) => row.system }]} getRowId={(row) => row.system} rows={[{ system: "Pages" }]} />
<Pagination currentPage={2} totalPages={3} />
<Toast title="Settings saved" tone="success">The toast reports a non-blocking outcome.</Toast>
<CommandPalette items={[{ icon: "search", id: "search", label: "Search systems", shortcut: "Cmd-K" }]} />
```

#### Interaction Foundations

Use the interaction controls for modal work, anchored actions, complete choice and
numeric input, loading feedback, and responsive composition. Interactive
controls are controlled or uncontrolled where that distinction is meaningful;
modal components always report dismissal so application state stays canonical.
A controlled `Combobox` selection remains searchable with its internal query;
control `inputValue` separately only when the application also owns search text.

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

The canonical [component manifest](component-manifest.json) records all 19
cross-platform interaction-foundation families. `npm run check:components`
validates the manifest schema and verifies all 95 implementation-evidence claims
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

Set appearance, mode, and accent theme on the root element:

```html
<html data-appearance="quiet" data-mode="light" data-theme="royal-purple">
```

Available appearances:

- `atelier` — the original layered, textured Aurelglyph treatment and all six
  selectable accents; this remains the compatibility default when the
  attribute is omitted
- `quiet` — flatter near-white or charcoal surfaces, smaller radii, lighter
  elevation, and one restrained violet signal palette

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
npm install @aurelglyph/react-native react-native-safe-area-context
```

The adapter targets React Native 0.86 or newer and React 19.2.3 or newer. Wrap
the app once for mode/accent resolution, then compose the same component
vocabulary used by the web, SwiftUI, and Rails adapters.

React Native 0.87 iOS consumers must currently set
`ENV['RCT_USE_PREBUILT_RNCORE'] = '0'` before
`prepare_react_native_project!` in their Podfile so generated community Fabric
components can import the public `<React/...>` headers. React Native 0.86 does
not require this workaround.

For example:

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
import { SafeAreaProvider } from "react-native-safe-area-context";

export function Settings() {
  return (
    <SafeAreaProvider>
      <AurelglyphProvider appearance="quiet" accent="royal-purple" mode="system">
        <Surface elevation="raised">
          <Stack gap={4}>
            <Combobox label="Operating mode" options={modes} value={mode} onValueChange={setMode} />
            <Checkbox checked={verify} label="Automated verification" onCheckedChange={setVerify} />
            <Grid columns={{ base: 1, md: 2 }} minItemWidth={240}>
              <Button onPress={save}>Save changes</Button>
            </Grid>
          </Stack>
        </Surface>
      </AurelglyphProvider>
    </SafeAreaProvider>
  );
}
```

`aurelglyphTheme` remains available for direct token access, while
`resolveAurelglyphTheme(mode, accent, appearance)` returns mode- and
appearance-aware native values. In `quiet`, the selected accent is retained so
switching back to `atelier` is lossless while rendered controls use the reduced
violet signal palette. `AurelglyphControlCopyProvider` replaces package-owned
visible and accessibility copy for localized subtrees; explicit component copy
props remain the final override.
Overlays use React Native `Modal` inside bounded safe-area and keyboard-aware
shells backed by `react-native-safe-area-context`; tooltip behavior combines
`accessibilityHint` with the provider's
non-modal, safe-bound overlay host; and the dependency-free slider exposes
native `adjustable` actions. Actionable menu and selection rows expose native
button semantics while retaining disabled and selected state, and searchable
selection and command lists deliver option taps while the native keyboard is
focused. Native `Select` leaves optional search unfocused for immediate choice,
while `Combobox` focuses search by default; `autoFocusSearch` overrides either
behavior. Application-owned ancestor `ScrollView` instances around searchable
controls must also set `keyboardShouldPersistTaps="always"`. Autofocus is
requested when the native search input mounts and reinforced after modal
presentation. The native smoke host independently
verifies browse-first Select and keyboard-focused Combobox and Command Palette
activation without retry recovery, waiting for software-keyboard readiness and
re-targeting the already-focused native input before verifying controlled filter
results after each accepted search keystroke. On fresh simulators the host
dismisses only iOS's identified first-use keyboard tutorial before requiring
the same interactive search and software-keyboard autofocus checks. Its remote
Continue control is located across accessibility types/application scopes, with
one separate 30-second system-dismissal budget; the 15-second search-readiness
budget starts fresh afterward. Failed readiness retains both accessibility
hierarchies for diagnosis. After confirmed tutorial dismissal, readiness polls
only the product field and keyboard, requiring a tappable key as well as the
interactive search without repeating remote system-UI queries. Responsive grids
measure their actual container for split-view and nested-panel layouts, while
compact controls preserve real 44-point touch bounds.
The private host's full renderer integration smoke has a bounded 15-second
budget for loaded macOS CI runners; its interaction and styling assertions are
unchanged.
Failed native iOS attempts retain their original assertion details even when a
retry passes. CI and release runs keep the Xcode log and result bundle as a
seven-day diagnostic artifact; local failures retain them in the host's ignored
`build/ios-smoke-*` directory.
Development tooling locks the patched `source-map-js` 1.2.2 and makes the
tested Istanbul coverage loader an explicit development dependency with a
scoped `js-yaml` 4.3.2 override, removing its obsolete `sprintf-js` dependency.
YAML inheritance, configuration normalization, and npm dependency integrity
are regression-tested; published runtime dependencies are unchanged.
The overlay host reserves an elevated, non-blocking root
layer so regular application panels do not cover active tooltips. Set
`overlayHost={false}` when the application supplies its own hosts, and place an
`AurelglyphOverlayHost` inside any consumer-owned native `Modal` that contains
tooltips. Hosts supply their preferred document picker to
`FileUpload` through `onRequestFiles`.

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

The private `examples/react-native-smoke` workspace is a real React Native 0.87
iOS and Android host for adapter integration work. Its native iOS UI contract
opens a consumer-owned `Modal` and verifies overlay-host layering,
remeasurement, viewport clamping, touch pass-through, themed selection
surfaces, More Information, and the light/dark atelier/quiet controls against a
release Hermes bundle. Autofocus regressions synchronize each native XCTest
keystroke with the committed React Native input value before exercising the
filtered action, avoiding simulator-dependent burst input loss without masking
focus failures. Clean-consumer package checks also create minified iOS bundles
with both React Native 0.86 and 0.87.

### SwiftUI

The workspace root exposes a Swift Package named `AurelglyphUI`. Its target
source lives in `packages/swift/Sources/AurelglyphUI`.

Add the repository as a Swift Package dependency, or use a local package path
to the workspace root during development:

```swift
.package(url: "https://github.com/absessive/aurelglyph.git", from: "0.8.1")
.product(name: "AurelglyphUI", package: "aurelglyph")
```

Then import the module:

```swift
import AurelglyphUI

let background = AurelglyphTokens.colorModeDarkBackground
let accent = AurelglyphTokens.colorAccentRoyalPurple300
```

Install the shared semantic theme near the application root. `.system` follows
the device appearance. Use `.quiet` for near-white light surfaces and compact
charcoal dark surfaces, or omit `appearance` to retain the original `.atelier`
treatment:

```swift
WorkbenchView()
  .aurelglyphTheme(
    AurelglyphTheme(mode: .system, accent: .royalPurple, appearance: .quiet)
  )
```

The interaction components use native bindings and presentations while keeping the
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

Responsive SwiftUI containers can separate scroll ownership, supply a
regular-width navigation rail, and opt horizontal stacks into a compact or
large-text fallback without maintaining a second screen hierarchy:

```swift
AurelglyphAppShell(
  scrollsContent: false,
  regularNavigationWidth: 248
) {
  WorkbenchTopBar()
} regularNavigation: {
  SystemsRail()
} content: {
  List(systems) { SystemRow(system: $0) }
} tabBar: {
  WorkbenchTabBar()
}

AurelglyphStack(axis: .horizontal, compactAxis: .vertical) {
  PrimaryAction()
  SecondaryAction()
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

Packaged custom faces preserve the requested baseline while scaling relative to
the supplied Dynamic Type role. If a face is unavailable, its native fallback
preserves the Dynamic Type role. The generic `font` factory uses role-specific
defaults: large title for display, title 3 for editorial serif, body for
UI/body, and caption for mono.

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

Aurelglyph uses `data-appearance`, `data-mode`, and `data-theme` attributes for
runtime theming:

```html
<html data-appearance="quiet" data-mode="light" data-theme="royal-purple">
```

`atelier` is the original detailed appearance and remains the default when
`data-appearance` is omitted. `quiet` keeps Aurelglyph's typography, semantic
roles, precise borders, and accessible focus language while using a reduced
neutral palette, one violet signal scale, smaller radii, and flatter elevation.
Both appearances independently support `light` and `dark`; semantic success,
warning, danger, and info colors remain distinct from the active signal color.
Forced modes also set the browser `color-scheme`, so native fields, menus, and
scrollbars follow the same light or dark contract. Quiet control boundaries and
selected-state rails meet the 3:1 non-text contrast target across its surfaces.
`Menu` and `Combobox` always render tokenized Aurelglyph popup surfaces. Rich
React menu labels can supply `textValue` so keyboard typeahead follows the
visible label. Native web and Rails `Select` controls progressively use the
customizable-select
picker for the same surfaces, focus rail, option states, radius, and elevation;
browsers without that capability keep accessible platform behavior with
mode-aware option paint. SwiftUI `AurelglyphMenu` and `AurelglyphSelect`, plus
the React Native equivalents, use tokenized package-owned popup content rather
than an unstyled system list. SwiftUI dropdowns skip disabled rows during
Arrow/Home/End navigation, restore trigger focus after Escape or selection, and
expose their placeholders, state values, hints, empty states, and generated
option labels through `AurelglyphControlCopy` for localization.
The React gallery persists appearance, mode, and atelier accent choices before
rendering, exposes branded keyboard focus on its custom controls, and announces
client-side page changes. React Popover and More Information panels move focus
inside when opened and restore their trigger after Escape dismissal, matching
the Rails interaction contract.

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

Run the React Native smoke host's renderer test, or its native iOS simulator
contract:

```bash
npm test -w @aurelglyph/example-react-native-smoke
npm run test:android -w @aurelglyph/example-react-native-smoke
npm run test:ios -w @aurelglyph/example-react-native-smoke
```

See `examples/react-native-smoke/README.md` for CocoaPods setup and manual iOS
and Android launch commands. Each smoke entry point rebuilds the React Native
package before testing the external-consumer path.

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
npm run lint
npm run build:assets
npm run build
npm run build:pages
npm run check:components
npm test
npm run test:rails
npm run test:react-native-host
npm run test:swift
npm run test:browsers
npm run test:ux
npm run typecheck
npm run security:check
npm run security:ruby
npm run pack:check
npm run pack:gem
npm run version:check
npm run version:release-check
npm run version:sync -- "Describe the changelog item"
npm run verify
```

`npm test` builds publishable outputs before running Vitest, so package-artifact
contracts also work from a clean checkout. CI and `npm run verify` use the
internal `test:unit` command after their explicit build step to avoid rebuilding.

`npm run lint` applies the workspace ESLint flat configuration to JavaScript,
TypeScript, React, and React Native source, including React Hooks correctness,
with zero warnings allowed. Generated artifacts, vendored native outputs, and
build directories are excluded.

`npm run security:check` accepts only time-bounded private-tooling exceptions
whose advisory identity, affected range, severity, and installed dependency
path exactly match the reviewed policy. Changed or stale fingerprints fail.
`npm run security:ruby` updates the Ruby advisory database and rejects known
vulnerabilities in the active Bundler lockfile; both Rails matrix locks run it
in hosted CI.

`npm run pack:check` installs packed adapters into clean strict-peer consumers
and compiles SSR and type contracts against React 19.1/19.2 and React Native
0.86/0.87, so compatibility claims are exercised outside the workspace graph.

Pre-1.0 and prerelease tags create validated GitHub/source releases and
deliberately skip npm and RubyGems publication. Starting with stable `1.0.0`,
tagged releases build every
registry artifact before publication and verify existing exact-version
artifacts by integrity. A retry safely skips matching packages after a partial
registry outage and fails closed on different bytes. At that point, the
protected `release` environment needs `NPM_BOOTSTRAP_TOKEN` for the first
publication of each npm package name and `RUBYGEMS_API_KEY` while the Rails gem
is missing; later npm versions use trusted publishing.

`npm run test:react-native-host` runs the Jest renderer contract, validates the
Android native project by compiling its production bundle and release APK, and
runs the native iOS XCTest contract, including the selected value announced by
native Select and Combobox triggers. Every host gate rebuilds the package first,
preventing ignored local `dist` output from masking source changes. The iOS
check requires Xcode, CocoaPods,
and an installed Simulator runtime; the Android check requires an Android SDK
and JDK 17. The Android host pins Gradle 9.4.1 with checksum verification so the
native gate uses the reviewed toolchain required by React Native 0.87. Its AGP,
Kotlin, SDK, and compatibility settings remain aligned with the 0.87 template,
while its cross-platform Hermes compiler path is resolved from the workspace
root.

`npm run test:ux` builds the React example and drives real headless Chrome. The
responsive matrix covers 320×568 compact portrait, 568×320 phone landscape,
768×1024 tablet, 1024×768 laptop/split view, and 1920×1080 wide layouts. It runs
47 full mode/viewport and accessibility-tree audits, 41 additional responsive
probes, and desktop, compact, and landscape interaction suites. The gate fails
on browser auto-scaling, document overflow, clipped headings, off-screen
controls, undersized web targets, invalid accessibility relationships, or open
overlay surfaces that escape the visual viewport or a clipping scrollport.
Anchored menu keyboard checks also verify that roving focus remains stable after
viewport collision correction. Desktop, compact, and landscape interaction
suites use isolated disposable Chrome processes so each lifecycle is measured
independently from prior interaction, accessibility, and screenshot
instrumentation. CDP transport timeouts receive one recorded fresh-process
retry, while product and accessibility assertions fail immediately.
The lifecycle harness requires POSIX process-group semantics and therefore runs
on Linux, macOS, or WSL2 rather than native Windows. It bounds child-process and
HTTP-server teardown so a completed audit cannot leave CI waiting on inherited
pipes or persistent connections. `AURELGLYPH_UX_OUTPUT` may select an artifact
root inside the workspace or operating-system temporary directory; every run
uses a new child directory and never recursively deletes the caller's path.

## Versioning

Aurelglyph uses one shared version across every platform package. The root
`package.json` version is canonical. Run `npm run version:sync -- "Change
summary"` after changing the root version to update all package versions,
workspace package dependency pins, `package-lock.json`, `CHANGELOG.md`, and
version markers in the React example, Rails adapter, and static preview.

Run `npm run version:check` before publishing or consuming packages from apps.
After promoting the release notes, `npm run version:release-check` additionally
requires an empty `Unreleased` section and a non-empty entry for the canonical
version. CI repeats generated-artifact, package, browser, Rails, SwiftUI, React
Native, security, and clean-consumer checks before publication.
