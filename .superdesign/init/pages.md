# Complete local dependency trees

These are candidate context sets, not unconditional payloads. Local imports and re-exports were traced recursively; external React/React DOM/React Native/SwiftUI/SafeArea dependencies are excluded. Repeated local nodes are referenced after their first expansion. Workspace package imports are mapped to source adapters rather than dumping compiled output. Generated token dependencies are explicit leaves; canonical generation relationships are noted separately.

## React Vite /#components (also /#overview, /#usage, /#changelog)

All four page functions share one App source and therefore the same import tree. The barrel's full export graph is shown once, including unused-by-a-page exports, so no local dependencies are omitted.

```text
- examples/react-vite/src/main.tsx
  - packages/css/src/index.css
    - packages/tokens/dist/generated/aurelglyph.css
  - examples/react-vite/src/app.css
  - examples/react-vite/src/App.tsx
    - packages/react/src/index.ts
      - packages/react/src/components/AppShell.tsx
      - packages/react/src/components/Alert.tsx
      - packages/react/src/components/Avatar.tsx
      - packages/react/src/components/Badge.tsx
      - packages/react/src/components/Breadcrumbs.tsx
      - packages/react/src/components/Button.tsx
        - packages/react/src/components/Icon.tsx
        - packages/react/src/components/foundation.ts
      - packages/react/src/components/ButtonGroup.tsx
      - packages/react/src/components/Card.tsx
      - packages/react/src/components/CommandPalette.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Combobox.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Checkbox.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Table.tsx
      - packages/react/src/components/EmptyState.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
      - packages/react/src/components/ExpandableSection.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
      - packages/react/src/components/FileUpload.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Icon.tsx [shared; expanded above]
      - packages/react/src/components/IconButton.tsx
        - packages/react/src/components/Button.tsx [shared; expanded above]
        - packages/react/src/components/Icon.tsx [shared; expanded above]
      - packages/react/src/components/Dialog.tsx
        - packages/react/src/components/Sheet.tsx
      - packages/react/src/components/Drawer.tsx
        - packages/react/src/components/Sheet.tsx [shared; expanded above]
      - packages/react/src/components/Divider.tsx
      - packages/react/src/components/List.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
      - packages/react/src/components/Metric.tsx
      - packages/react/src/components/NavigationStack.tsx
      - packages/react/src/components/Pagination.tsx
      - packages/react/src/components/Progress.tsx
      - packages/react/src/components/SearchField.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
      - packages/react/src/components/SegmentedControl.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Select.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Sheet.tsx [shared; expanded above]
      - packages/react/src/components/Skeleton.tsx
      - packages/react/src/components/Switch.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Tabs.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/TextArea.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/TextField.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Menu.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Popover.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/MoreInformation.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
        - packages/react/src/components/Popover.tsx [shared; expanded above]
      - packages/react/src/components/Tooltip.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/RadioGroup.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Slider.tsx
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/NumberField.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
        - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/Spinner.tsx
      - packages/react/src/components/Layout.tsx
      - packages/react/src/components/foundation.ts [shared; expanded above]
      - packages/react/src/components/TabBar.tsx
        - packages/react/src/components/Icon.tsx [shared; expanded above]
      - packages/react/src/components/Toast.tsx
      - packages/react/src/components/Toolbar.tsx
      - packages/react/src/components/TopBar.tsx
```

CSS build relationship (not a TypeScript import): `packages/css/scripts/build.mjs` reads `packages/css/src/index.css` and appends `packages/react/src/styles.css` into `packages/css/dist/index.css`; both use generated token CSS. Fonts are copied from `packages/css/src/fonts`. React package style export separately copies the same component CSS. Canonical tokens: `packages/tokens/src/tokens.json` → `packages/tokens/src/build.ts` → `packages/tokens/dist/generated/*`. App-shell/rail layout styles are in `examples/react-vite/src/app.css`.

## React Native iOS / Android smoke host

The native registration entry's recursive local imports:

```text
- examples/react-native-smoke/index.js
  - examples/react-native-smoke/App.tsx
    - packages/react-native/src/index.ts [workspace adapter; expanded below]
  - examples/react-native-smoke/app.json
```

The App's `@aurelglyph/react-native` workspace package is expanded separately to keep the complete adapter export graph deduplicated:

```text
- packages/react-native/src/index.ts
  - packages/react-native/src/theme.tsx
    - packages/tokens/dist/generated/react-native.js
    - packages/react-native/src/overlay-host.tsx
  - packages/react-native/src/foundation.ts
  - packages/react-native/src/control-copy.tsx
  - packages/react-native/src/overlay-host.tsx [shared; expanded above]
  - packages/react-native/src/icons.tsx
    - packages/react-native/src/theme.tsx [shared; expanded above]
  - packages/react-native/src/primitives.tsx
    - packages/react-native/src/control-copy.tsx [shared; expanded above]
    - packages/react-native/src/foundation.ts [shared; expanded above]
    - packages/react-native/src/theme.tsx [shared; expanded above]
  - packages/react-native/src/forms.tsx
    - packages/react-native/src/control-copy.tsx [shared; expanded above]
    - packages/react-native/src/foundation.ts [shared; expanded above]
    - packages/react-native/src/icons.tsx [shared; expanded above]
    - packages/react-native/src/primitives.tsx [shared; expanded above]
    - packages/react-native/src/theme.tsx [shared; expanded above]
  - packages/react-native/src/overlays.tsx
    - packages/react-native/src/control-copy.tsx [shared; expanded above]
    - packages/react-native/src/foundation.ts [shared; expanded above]
    - packages/react-native/src/icons.tsx [shared; expanded above]
    - packages/react-native/src/overlay-host.tsx [shared; expanded above]
    - packages/react-native/src/theme.tsx [shared; expanded above]
  - packages/react-native/src/selection.tsx
    - packages/react-native/src/control-copy.tsx [shared; expanded above]
    - packages/react-native/src/foundation.ts [shared; expanded above]
    - packages/react-native/src/icons.tsx [shared; expanded above]
    - packages/react-native/src/overlays.tsx [shared; expanded above]
    - packages/react-native/src/theme.tsx [shared; expanded above]
  - packages/react-native/src/navigation.tsx
    - packages/react-native/src/control-copy.tsx [shared; expanded above]
    - packages/react-native/src/foundation.ts [shared; expanded above]
    - packages/react-native/src/primitives.tsx [shared; expanded above]
    - packages/react-native/src/theme.tsx [shared; expanded above]
```

Native launchers: `examples/react-native-smoke/ios/AurelglyphSmoke/AppDelegate.swift` and `android/app/src/main/java/com/absessive/aurelglyphsmoke/MainActivity.kt` + `MainApplication.kt`. All import only external native frameworks, and launch the same registered JS module. `metro.config.js` watches the workspace. `fonts.ts` is a separate optional package subpath, not imported by this App; its local TTF requires are not part of the page's import tree.

## SwiftUI smoke host

Swift imports modules, not individual local Swift files. The root Package.swift compiles every listed Swift source into AurelglyphUI, with no local module dependencies. Consequently this complete module membership tree is more accurate than invented per-file Swift import edges:

```text
- examples/swiftui-smoke/App/AurelglyphSwiftUISmokeApp.swift
  - Package.swift [AurelglyphUI product / target]
    - packages/swift/Sources/AurelglyphUI/AurelglyphExpandableSection.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphFontRegistry.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphIcon.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphInteractionControls.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphLayoutComponents.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphMoreInformation.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphPhaseOneComponents.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphPhaseThreeComponents.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphPhaseTwoComponents.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphPresentationComponents.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphResponsiveLayout.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphTheme.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphTokens.swift
    - packages/swift/Sources/AurelglyphUI/AurelglyphTypography.swift
    - packages/swift/Sources/AurelglyphUI/Resources/Fonts [five bundled TTF faces + OFL license]
```

The app uses AppShell/TopBar/Card/Avatar from PhaseOne/PhaseTwo, segmented controls + Select from PhaseTwo, Checkbox/RadioGroup/Slider/NumberField + ControlCopy from InteractionControls, MoreInformation and Dialog from their dedicated files, and shared Theme/Typography/FontRegistry. Other module members remain compile-time local dependencies. `packages/swift/Package.swift` provides the package-local verification entry to the same sources.

## Generated public documentation

`scripts/pages.ts` has only Node built-in imports. Its full file-read dependency tree is:

```text
- scripts/pages.ts
  - package.json [version / description]
  - CHANGELOG.md
  - component-manifest.json
  - schemas/component-manifest.schema.json
  - packages/react/src/components/Icon.tsx [glyph source; no runtime React dependency]
  - packages/css/src/fonts/ofl [copied documentation fonts / licenses]
  - docs/{index,usage,components,changelog}.html [generated outputs; common pageShell]
  - docs/component-manifest.json + docs/schemas/component-manifest.schema.json [generated copies]
  - docs/CNAME [generated domain]
```

## Standalone static preview

`preview/index.html` contains its layout, controls, CSS tokens, and DOM behavior inline; it has no local JS/CSS imports. Six font-face references resolve under `preview/assets/fonts` (Libre Baskerville, Atkinson Hyperlegible, Space Mono regular/bold WOFF2). This is not an alternate generator source.
