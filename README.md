# Aurelglyph

Aurelglyph is a token-first UX design language and component system for SwiftUI,
React, React Native, and Ruby on Rails apps.

It provides one shared visual language across platforms: generated design
tokens, CSS variables, React primitives, React Native theme values, Swift token
constants, and Rails-friendly assets.

Current version: `0.4.0`

## Status

This repository is the Aurelglyph workspace. The package-manager examples below
show the current consumer API for npm, RubyGems, Swift Package Manager, Git, and
local workspace paths.

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
- GlyphMotion shared transition tokens, React adapters, SwiftUI modifiers, and
  CSS/Rails motion classes for matched elements, bloom, drift, collapse, glass,
  thread, tilt, and arc transitions
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

Pin exact versions in production apps when you need repeatable releases:

```bash
npm install @aurelglyph/css@0.4.0 @aurelglyph/react@0.4.0
```

`@aurelglyph/react/styles.css` is also available for React-only adopters that
want just the component class layer.

`@aurelglyph/css` packages the Aurelglyph web fonts locally as WOFF2 files.
Newsreader is used for display text, IBM Plex Sans for UI/body copy, IBM Plex
Serif as the editorial serif fallback, and JetBrains Mono for code, token
names, technical labels, and metadata. The bundled font files are distributed
under the SIL Open Font License 1.1, while Aurelglyph code remains MIT. No
Google Fonts runtime request is required. SwiftUI consumers receive native TTF
assets in the Swift package and should use `AurelglyphFontRegistry` plus
`AurelglyphTypography` for registered custom fonts with system fallbacks.

Use the components in app code:

```tsx
import {
  AppShell,
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CommandPalette,
  DataTable,
  EmptyState,
  ExpandableSection,
  FileUpload,
  GlyphMatch,
  GlyphMotionProvider,
  GlyphTransition,
  Icon,
  ListRow,
  ListSection,
  Metric,
  NavigationPage,
  NavigationStack,
  Pagination,
  Progress,
  SearchField,
  SegmentedControl,
  Select,
  Sheet,
  Skeleton,
  Switch,
  Tabs,
  TabBar,
  TextArea,
  TextField,
  Toast,
  Toolbar,
  TopBar
} from "@aurelglyph/react";

export function DesignSystemSetup() {
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
          <Alert title="Build complete" tone="success">Tokens and component styles compiled without errors.</Alert>
          <Avatar name="Ajit Chakrapani" />
          <Badge tone="accent">Live</Badge>
          <EmptyState title="No archived releases">Use this state when a filtered list has no records.</EmptyState>
          <Button onClick={() => setDetailsOpen(true)} variant="secondary">Open sheet</Button>
          <Sheet open={detailsOpen} title="Details">Use sheets for focused edits without leaving the current page.</Sheet>
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
      <GlyphMotionProvider spring="standard">
        <GlyphTransition name="bloom" direction="forward">
          <GlyphMatch id="event-card-image">Shared element content</GlyphMatch>
        </GlyphTransition>
      </GlyphMotionProvider>
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

#### GlyphMotion

Use `GlyphMotionProvider`, `GlyphMatch`, and `GlyphTransition` for shared
element continuity, card expansion, tab drift, glass/depth transitions, and
gesture-driven progress state. The API uses Aurelglyph-native names and does
not copy another transition library's names or implementation.

```tsx
import {
  createGlyphInteractiveState,
  GlyphMatch,
  GlyphMotionProvider,
  GlyphTransition
} from "@aurelglyph/react";

const drag = createGlyphInteractiveState(0.42);

<GlyphMotionProvider spring="standard">
  <GlyphTransition name="bloom" direction="forward" spring="expressive">
    <GlyphMatch id="event-card-image" snapshot="optimized">
      <img alt="" src="/event.jpg" />
    </GlyphMatch>
  </GlyphTransition>
  <GlyphTransition name="thread" threadIndex={1}>Details</GlyphTransition>
</GlyphMotionProvider>
```

CSS-only and Rails consumers receive the same `.ag-glyph-match` and
`.ag-glyph-transition` class contract through `@aurelglyph/css` and the Rails
stylesheet. Use those classes for static or progressively enhanced surfaces.

#### Phase 1 Mobile Foundations

Use the mobile foundation components for app chrome, navigable sections,
settings lists, status cards, search, and binary controls.

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

```tsx
<NavigationStack title="Workbench">
  <NavigationPage actions={<Toolbar><Button icon="save">Save</Button></Toolbar>} title="Systems">
    <SegmentedControl activeId="grid" items={[{ id: "grid", label: "Grid" }, { id: "list", label: "List" }]} />
    <Select label="Theme" name="theme" options={[{ label: "Royal purple", value: "royal-purple" }]} />
    <Alert title="Build complete" tone="success">Tokens and component styles compiled without errors.</Alert>
    <Avatar name="Ajit Chakrapani" />
    <Badge tone="accent">Live</Badge>
    <EmptyState title="No archived releases">Use this state when a filtered list has no records.</EmptyState>
    <Button onClick={() => setDetailsOpen(true)} variant="secondary">Open sheet</Button>
    <Sheet open={detailsOpen} title="Details">Use sheets for focused edits without leaving the current page.</Sheet>
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
<%= aurelglyph_alert("Build complete", tone: "success") { "Tokens and component styles compiled without errors." } %>
<%= aurelglyph_segmented_control([{ id: "grid", label: "Grid" }, { id: "list", label: "List" }], active: "grid") %>
<%= aurelglyph_badge("Live", tone: "accent") %>
<%= aurelglyph_metric(label: "Latency", value: "42ms", delta: "Stable") %>
<%= aurelglyph_progress(value: 72) %>
<%= aurelglyph_command_palette([{ id: "search", label: "Search systems", icon: "search", shortcut: "Cmd-K" }]) %>
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
  Text("Animated SwiftUI content")
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
  AurelglyphAlert("Build complete") { Text("Tokens and component styles compiled without errors.") }
  AurelglyphBadge("Live")
  AurelglyphMetric(label: "Latency", value: "42ms", delta: "Stable")
  AurelglyphProgress(value: 72)
  AurelglyphCommandPalette(items: [AurelglyphCommandItem(id: "search", title: "Search", systemImage: "magnifyingglass", shortcut: "Cmd-K")])
}
```

Use GlyphMotion for SwiftUI matched elements and original Aurelglyph transition
names:

```swift
@Namespace private var glyphNamespace

Image("event")
  .glyphMatch("event-card-image", in: glyphNamespace)
  .glyphTransition(.bloom)
  .glyphSpring(.standard)

Text("Details")
  .glyphTransition(.thread, direction: .forward)
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

Use the generated theme values as the source for platform styles:

```ts
import { aurelglyphTheme } from "@aurelglyph/react-native";

export const screen = {
  backgroundColor: aurelglyphTheme["color.mode.dark.background"],
  color: aurelglyphTheme["color.mode.dark.text"]
};
```

### SwiftUI

The workspace root exposes a Swift Package named `AurelglyphUI`. Its target
source lives in `packages/swift/Sources/AurelglyphUI`.

Add the repository as a Swift Package dependency, or use a local package path
to the workspace root during development. Then import the module:

```swift
.package(url: "https://github.com/absessive/aurelglyph.git", from: "0.4.0")
```

```swift
import AurelglyphUI

let background = AurelglyphTokens.colorModeDarkBackground
let accent = AurelglyphTokens.colorAccentRoyalPurple300
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
```

The Swift package does not bundle the web `.woff2` font assets. It keeps the
font-family token strings available for reference, and bundles iOS-compatible
`.ttf` files for Newsreader, IBM Plex Sans, IBM Plex Serif, and JetBrains Mono.
`AurelglyphTypography` registers and uses those fonts when available, with
native SwiftUI serif, sans, and monospaced fallbacks.

The package currently supports iOS 17 and macOS 14.

### Rails

Rails apps can consume the `aurelglyph-rails` gem from a local path, from this
Git repository, or from RubyGems once published. The package ships a Rails
engine, generated CSS with tokens plus shared component classes, generated token
helpers, and view helpers for tokens, icons, disclosure, cards, lists, tabs,
search, and switches.

After `npm run build -w aurelglyph-rails`, the generated Rails-facing files are:

- `packages/rails/app/assets/stylesheets/aurelglyph.css`
- `packages/rails/lib/aurelglyph/tokens.rb`

For gem consumption, point Bundler at the package gemspec:

```ruby
gem "aurelglyph-rails",
  git: "https://github.com/absessive/aurelglyph",
  glob: "packages/rails/aurelglyph-rails.gemspec"
```

Use the stylesheet through the asset pipeline:

```css
/*
 *= require aurelglyph
 */
```

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

## Package Map

- `@aurelglyph/tokens`: canonical tokens and generator
- `@aurelglyph/css`: CSS variables, packaged fonts, base styles, and shared component classes
- `@aurelglyph/react`: React components and component styles
- `@aurelglyph/react-native`: React Native theme export
- `AurelglyphUI`: Swift Package exposing generated token constants, typography, components, and GlyphMotion modifiers
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

This writes `docs/index.html`, `docs/usage.html`, `docs/components.html`,
`docs/changelog.html`, `docs/CNAME`, and `docs/assets/fonts/ofl/`. The
generated pages can be published with GitHub Pages configured to deploy from
the `docs/` directory on the selected branch.

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
npm run build
npm run build:pages
npm test
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
workspace package dependency pins, `package-lock.json`, and `CHANGELOG.md`.

Run `npm run version:check` before publishing or consuming packages from apps.
