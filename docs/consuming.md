# Consuming Aurelglyph

This guide documents the minimum configuration needed to consume the current
Aurelglyph workspace outputs. It covers local workspace usage, Git consumption,
and the package shape used by published npm, RubyGems, and SwiftPM consumers.

## GitHub Pages

The repository includes a raw Pages generator:

```bash
npm run build:pages
```

The command writes:

- `docs/index.html`
- `docs/usage.html`
- `docs/components.html`
- `docs/changelog.html`
- `docs/CNAME`

Minimum branch-based GitHub Pages setup:

1. Run `npm run build:pages` before publishing.
2. Commit the generated `docs/*.html` files if you are using branch-based Pages.
3. In GitHub Pages settings, choose the selected branch and `/docs` as the
   source directory.

Use GitHub Actions if you prefer generated Pages artifacts without committing
the generated HTML.

Minimum workflow shape for raw docs Pages:

```yaml
name: pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build:pages
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Static Preview

`preview/` is also static and can be uploaded directly as a Pages artifact. It
includes its own copied font files under `preview/assets/fonts`.

Minimum alternate upload step:

```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: preview
```

### React Vite Example

Build the React example before uploading `examples/react-vite/dist`:

```bash
npm ci
npm run build -w @aurelglyph/example-react-vite
```

The default Vite output uses root-relative assets such as `/assets/...`. That
is correct for a root-domain Pages site or custom domain. For a project Pages
URL such as `https://OWNER.github.io/aurelglyph/`, build the Vite app with a
matching base path, then upload `examples/react-vite/dist`:

```bash
npm run build:tokens
npm run build -w @aurelglyph/react
npm exec -w @aurelglyph/example-react-vite vite -- build --base /aurelglyph/
```

Replace `/aurelglyph/` with the repository name used in the Pages URL.

## React And CSS

Install the CSS package for tokens, locally packaged OFL fonts, reset/base
styles, semantic CSS variables, and the shared component class layer. Add the
React package when you need typed React components.

```bash
npm install @aurelglyph/css @aurelglyph/react
```

Import the CSS once at the application entry point:

```tsx
import "@aurelglyph/css";
```

`@aurelglyph/react/styles.css` is also exported for React-only adopters that
want just the component class layer.

Set the theme contract on the root element before rendering or during early app
startup:

```html
<html data-mode="dark" data-theme="royal-purple">
```

Use React mobile foundations, controls, and icons from `@aurelglyph/react`:

```tsx
import { AppShell, Button, Card, Icon, ListRow, ListSection, SearchField, Switch, TabBar, TextField, TopBar } from "@aurelglyph/react";

export function SettingsForm() {
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
      <TextField label="System name" name="systemName" />
      <Button icon="save" type="submit">Save</Button>
      <Icon name="dashboard" title="Dashboard" />
    </AppShell>
  );
}
```

The icon contract currently includes supported app icons. Use `title` for
standalone meaningful icons, and `decorative` when the adjacent text already
names the action:

```tsx
<Icon name="credit-card" title="Billing" />
<Icon name="thumbs-down" title="Reject" />
<Icon decorative name="sync" />
<Button icon="external-link">Open</Button>
```

Use the starter React components with their native element props:

```tsx
<Button icon="save" type="submit">Save</Button>
<Button icon="delete" variant="danger">Delete</Button>

<TextField label="Project name" name="projectName" helpText="Use a short name." />
<TextField label="Version" name="version" error="Use a supported version." />

<TextArea label="Notes" name="notes" placeholder="Describe the app surface." />

<FileUpload
  accept=".json,.css,.ts,.tsx,.swift,.rb"
  label="Generated outputs"
  name="outputs"
/>
```

For expandable sections, use the animated disclosure component. It wires
`aria-expanded`, `aria-controls`, and the expand/contract icons for you:

```tsx
<ExpandableSection defaultOpen eyebrow="System" title="Advanced settings">
  <p>Animated content with accessible disclosure semantics.</p>
</ExpandableSection>
```

Use Phase 1 mobile foundations for app chrome, search, grouped settings, and
binary controls. Use Phase 2 controls for structured app surfaces, page actions,
bounded choice inputs, alerts, identity, and compact status labels. Use Phase 3
controls for workbench navigation, non-blocking feedback, loading state,
measured values, bounded result sets, and keyboard-first commands:

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
  <NavigationStack title="Workbench">
    <NavigationPage actions={<Toolbar><Button icon="save">Save</Button></Toolbar>} title="Systems">
      <SegmentedControl activeId="grid" items={[{ id: "grid", label: "Grid" }, { id: "list", label: "List" }]} />
      <Alert title="Build complete" tone="success">Tokens and component styles compiled without errors.</Alert>
      <Badge tone="accent">Live</Badge>
    </NavigationPage>
  </NavigationStack>
  <Tabs activeId="overview" items={[{ id: "overview", label: "Overview" }]}>Review generated package status.</Tabs>
  <Metric label="Latency" value="42ms" delta="Stable" />
  <Progress value={72} />
  <CommandPalette items={[{ icon: "search", id: "search", label: "Search systems", shortcut: "Cmd-K" }]} />
</AppShell>
```

For CSS-only apps, install only `@aurelglyph/css`, import it once, and build
with semantic variables or the shared `ag-*` component classes:

```css
@import "@aurelglyph/css";

.panel {
  background: var(--ag-color-semantic-surface);
  border: 1px solid var(--ag-color-semantic-border);
  border-radius: var(--ag-radius-lg);
  color: var(--ag-color-semantic-foreground);
}

.settings-grid {
  display: grid;
  gap: var(--ag-space-4);
}
```

```html
<section class="ag-card">
  <div class="ag-card__body">Systems operational</div>
</section>
```

Supported `data-mode` values are `dark` and `light`. Supported `data-theme`
values are `royal-purple`, `amber`, `forest`, `deep-blue`, `cyan`, and `steel`.

## Rails

The current Rails-facing package is a gem skeleton named `aurelglyph-rails`.
It ships the generated stylesheet with tokens plus shared component classes,
the token helper, a Rails engine, and view helpers for tokens, icons, disclosure,
cards, lists, tabs, search, and switches.

From this workspace, generate the Rails-facing files:

```bash
npm run build -w aurelglyph-rails
```

That creates or refreshes:

- `packages/rails/app/assets/stylesheets/aurelglyph.css`
- `packages/rails/lib/aurelglyph/tokens.rb`

Minimum Git-based Gemfile setup:

```ruby
gem "aurelglyph-rails",
  git: "https://github.com/absessive/aurelglyph",
  glob: "packages/rails/aurelglyph-rails.gemspec"
```

Minimum local Gemfile setup:

```ruby
gem "aurelglyph-rails",
  path: "../aurelglyph/packages/rails"
```

Minimum Rails asset-pipeline setup after the gem is installed:

1. Copy or vendor `aurelglyph.css` into your Rails app's
   `app/assets/stylesheets/`.
2. Require it from your application stylesheet:

```css
/*
 *= require aurelglyph
 */
```

3. Set `data-mode` and `data-theme` on the HTML root in your layout:

```erb
<html data-mode="dark" data-theme="royal-purple">
```

4. Use semantic CSS variables in server-rendered views and components.

Minimum token-helper usage:

Read tokens directly from Ruby:

```ruby
Aurelglyph::TOKENS["color.mode.dark.background"]
```

Use the Rails view helpers installed by the engine:

```erb
<%= aurelglyph_token("color.accent.royal-purple.300") %>
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

## Swift

The Swift Package is available from the workspace root. It points the
`AurelglyphUI` target at `packages/swift/Sources/AurelglyphUI`, supports iOS 17
and macOS 14, and exposes the `AurelglyphUI` library product.

Minimum local Swift Package Manager dependency:

```swift
.package(path: "../aurelglyph")
```

Add the product to your app target:

```swift
.product(name: "AurelglyphUI", package: "AurelglyphUI")
```

Then import and use generated token constants:

```swift
import AurelglyphUI

let background = AurelglyphTokens.colorModeDarkBackground
let accent = AurelglyphTokens.colorAccentRoyalPurple300
```

Use the native SwiftUI typography adapter for Aurelglyph roles:

```swift
AurelglyphFontRegistry.registerFonts()

Text("Aurelglyph")
  .font(AurelglyphTypography.displayLarge)

Text("System status")
  .font(AurelglyphTypography.body)

Text("color.accent.royal-purple.300")
  .font(AurelglyphTypography.monoLabel)
```

The Swift package does not bundle the web `.woff2` files from `@aurelglyph/css`.
It bundles iOS-compatible `.ttf` files for Newsreader, IBM Plex Sans, IBM Plex
Serif, and JetBrains Mono. `AurelglyphTypography` registers and uses those
fonts when available, with native SwiftUI serif, sans, and monospaced fallbacks.

Use the typed icon contract when mapping Aurelglyph names to SwiftUI rendering,
asset catalogs, or platform symbols:

```swift
let icon = AurelglyphIcon.creditCard
let assetName = icon.rawValue
let label = icon.accessibilityLabel
```

Use `AurelglyphExpandableSection` for animated SwiftUI disclosure panels:

```swift
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

Minimum Git-based Swift Package Manager dependency once the repository is
reachable from the app:

```swift
.package(url: "https://github.com/absessive/aurelglyph.git", from: "0.3.0")
```
