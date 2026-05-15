# Aurelglyph

Aurelglyph is a token-first UX design language and component system for SwiftUI,
React, React Native, and Ruby on Rails apps.

It provides one shared visual language across platforms: generated design
tokens, CSS variables, React primitives, React Native theme values, Swift token
constants, and Rails-friendly assets.

Current version: `0.1.0`

## Status

This repository is a first-pass workspace. The packages are marked `private`
until they are published, but the examples below show the intended consumer API
once Aurelglyph is available from npm or a similar package registry.

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

Use the components in app code:

```tsx
import { Button, FileUpload, TextArea, TextField } from "@aurelglyph/react";

export function PromptForm() {
  return (
    <form>
      <TextField
        label="Project title"
        name="title"
        placeholder="Launch storyboard"
        helpText="A compact name for routing and review."
      />
      <TextArea
        label="Prompt"
        name="prompt"
        placeholder="Create a concise walkthrough brief..."
      />
      <FileUpload
        accept="image/*,video/*,audio/*,.pdf"
        label="Drop files for the prompt"
        name="assets"
      />
      <Button icon="send" type="submit">
        Generate draft
      </Button>
    </form>
  );
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

The Swift package is intended to expose generated token constants through the
`AurelglyphUI` package.

If consuming from a GitHub release, add the repository as a Swift Package
dependency and import the module:

```swift
import AurelglyphUI

let background = AurelglyphTokens.colorModeDarkBackground
let accent = AurelglyphTokens.colorAccentRoyalPurple300
```

### Rails

Rails apps can consume the Rails-facing package assets once published, or copy
the generated CSS and Ruby token helper from the release.

Use the generated stylesheet in the asset pipeline:

```css
@import "aurelglyph";
```

Use Ruby token values where server-rendered components need shared constants:

```ruby
Aurelglyph::TOKENS["color.mode.dark.background"]
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
- `AurelglyphUI`: SwiftUI package skeleton and generated token constants
- `aurelglyph-rails`: Rails-facing stylesheet and token helper skeleton

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

## Development

### Commands

```bash
npm install
npm run build
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
