# Aurelglyph

Aurelglyph is a token-first UX design language and component system for SwiftUI,
React, React Native, and Ruby on Rails apps.

## Phase 1

- Canonical design tokens
- Generated CSS, TypeScript, React Native, Swift, and Rails-friendly outputs
- Starter React components
- A Vite React example app that consumes the packages

## Commands

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

## Packages

- `@aurelglyph/tokens`: canonical tokens and generator
- `@aurelglyph/css`: CSS variables and base styles
- `@aurelglyph/react`: starter React components
- `@aurelglyph/react-native`: React Native theme export
- `AurelglyphUI`: SwiftUI package skeleton
- `aurelglyph-rails`: Rails-facing styles and token helper skeleton

## Example

Run the React example:

```bash
npm run dev -w @aurelglyph/example-react-vite
```

## Versioning

Aurelglyph uses one shared version across every platform package. The root
`package.json` version is canonical. Run `npm run version:sync -- "Change
summary"` after changing the root version to update all package versions,
workspace package dependency pins, `package-lock.json`, and `CHANGELOG.md`.

Run `npm run version:check` before publishing or consuming packages from apps.
