# Aurelglyph

Aurelglyph is a token-first UX design language and component system for SwiftUI,
React, React Native, and Ruby on Rails apps.

It provides one shared visual language across platforms: generated design
tokens, CSS variables, React primitives, React Native theme values, Swift token
constants, and Rails-friendly assets.

Current version: `0.1.0`

## Status

This repository is a first-pass workspace. The package-manager examples below
show the intended consumer API for npm, RubyGems, Swift Package Manager, Git,
and local workspace paths.

For concrete minimum-configuration setup across GitHub Pages, React/CSS, Rails,
and Swift, see [docs/consuming.md](docs/consuming.md).

## What Is Included

- Canonical design tokens
- Generated CSS, TypeScript, React Native, Swift, and Rails-friendly outputs
- Theme support for dark mode, light mode, and multiple accent themes
- Starter React components for buttons, fields, text areas, file upload, and
  icons
- A static preview and a Vite React example app that consume the packages

## Install

Install only the packages your app needs.

### React

```bash
npm install @aurelglyph/css @aurelglyph/react
```

Import the base CSS once near your app entry point, then import React component
styles:

```tsx
import "@aurelglyph/css";
import "@aurelglyph/react/styles.css";
```

`@aurelglyph/css` packages the Aurelglyph web fonts locally. Newsreader is used
for display text, IBM Plex Sans for UI/body copy, IBM Plex Serif as the
editorial serif fallback, and JetBrains Mono for code, token names, technical
labels, and metadata. The bundled font files are distributed under the SIL Open
Font License 1.1, while Aurelglyph code remains MIT. No Google Fonts runtime
request is required.

Use the components in app code:

```tsx
import { Button, ExpandableSection, FileUpload, Icon, TextArea, TextField } from "@aurelglyph/react";

export function DesignSystemSetup() {
  return (
    <form>
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
    </form>
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

Use CSS variables in app styles:

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
import AurelglyphUI

let background = AurelglyphTokens.colorModeDarkBackground
let accent = AurelglyphTokens.colorAccentRoyalPurple300
```

The package currently supports iOS 17 and macOS 14.

### Rails

Rails apps can consume the `aurelglyph-rails` gem from a local path, from this
Git repository, or from RubyGems once published. The package ships a Rails
engine, generated CSS, generated token helpers, and an `aurelglyph_token` view
helper.

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
- `@aurelglyph/css`: CSS variables and base styles
- `@aurelglyph/react`: React components and component styles
- `@aurelglyph/react-native`: React Native theme export
- `AurelglyphUI`: Swift Package exposing generated token constants
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
