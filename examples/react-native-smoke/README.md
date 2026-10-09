# Aurelglyph React Native smoke host

This private React Native 0.87 app consumes the built
`@aurelglyph/react-native` workspace package through the same package entry
point as an external application. Its focused screen exercises a
consumer-owned native `Modal`, a modal-local `AurelglyphOverlayHost`, tooltip
measurement, viewport clamping, and touch pass-through. The host uses the
`quiet` dark appearance so the native consumer path also verifies its reduced
palette, radius, and elevation contract. Focused native checks also switch
between light/dark and atelier/quiet, operate themed Select and Menu surfaces,
verify disabled rows and the Select trigger's announced value, exercise
keyboard-focused Combobox and Command Palette actions, and present and dismiss
More Information. Its application-owned `ScrollView` sets
`keyboardShouldPersistTaps="always"`, matching React Native's requirement for
keyboard-era descendant activation.

The Component essentials section independently exercises Link, removable/selectable
Chip, PasswordField, one-input InputGroup, explicit-request ValidationSummary,
Accordion, ordered Stepper, and whole-number Rating. The second Jest case drives
their consumer state without opening a modal. Native cases verify chip/disclosure/
step contracts, actual password typing across reveal/mask without field retargeting,
input ownership, rating values and touch choices, and summary-requested field focus.
The iOS gate requires all nine cases and retains its first-attempt/no-recovery rule.

## Workspace checks

From the Aurelglyph workspace root:

```bash
npm run build -w @aurelglyph/example-react-native-smoke
npm test -w @aurelglyph/example-react-native-smoke
npm run lint -w @aurelglyph/example-react-native-smoke
```

The Jest check opens the modal in the React Native renderer and verifies that
the nested overlay host does not intercept the underlying control. Each Jest,
Android, and iOS test command first rebuilds `@aurelglyph/react-native`, so a
standalone host check cannot consume stale ignored `dist` output.

Build the Android production JavaScript bundle and release APK, including the
Gradle, Kotlin, autolinking, safe-area-context, and native scaffold paths,
without starting an emulator:

```bash
npm run test:android -w @aurelglyph/example-react-native-smoke
```

The checked-in wrapper pins Gradle 9.4.1 and verifies the distribution checksum
before the React Native 0.87 Android release build runs. The native scaffold
tracks the 0.87 template's Build Tools 37, compile SDK 37, Kotlin 2.2, and
temporary AGP 9 built-in-Kotlin/new-DSL opt-outs. Its explicit Hermes compiler
path accounts for this monorepo's workspace-hoisted dependencies and selects
the correct executable on macOS, Linux, and Windows.

## iOS native regression

Install pods after cloning or changing native dependencies:

The checked-in `Gemfile.lock` uses Ruby 3.1 or newer, Bundler 2.6.2, and
CocoaPods 1.16.2 so a fresh clone uses the same native dependency toolchain as
the regression runner.

The host sets `RCT_USE_PREBUILT_RNCORE=0` before
`prepare_react_native_project!`. React Native 0.87's default prebuilt framework
currently nests Fabric headers below a submodule while generated community
component registration imports them through `<React/...>`.

```bash
cd examples/react-native-smoke
bundle install
bundle exec pod install --project-directory=ios
```

Then run the release-mode simulator contract from the workspace root:

```bash
npm run test:ios -w @aurelglyph/example-react-native-smoke
```

To isolate the check from unrelated booted applications, select an installed,
available iPhone explicitly (find its UDID with `xcrun simctl list devices available`):

```bash
AURELGLYPH_IOS_DEVICE_ID=<simulator-udid> npm run test:ios -w @aurelglyph/example-react-native-smoke
```

Invalid, unavailable, non-iPhone, or non-iOS destinations fail before building.
Without this override, selection remains booted iPhone, then iPhone 16 Pro,
then the first available iPhone. The override does not change test cases,
assertions, repetitions, retry rejection, or keyboard preferences.

The runner selects an available iPhone simulator, builds a self-contained
Hermes bundle, and uses XCTest to verify that the tooltip stays inside the
native modal window, moves after anchor and viewport changes, and leaves the
underlying action hittable. It also covers the theme controls, Select/Menu
interaction, disabled rows, single-tap Combobox and Command Palette actions
after post-presentation autofocus accepts input, and More Information
presentation. Autofocus must first expose a ready software keyboard, and each
native input is re-targeted only after that autofocus assertion. Each search
keystroke is then synchronized with both its committed native value and the
resulting controlled filter state so a cold keyboard or bridge cannot hide or
manufacture a focus failure. Fresh simulators may present iOS's first-use
QuickPath keyboard tutorial; the host dismisses only that identified system
tutorial, then requires the same interactive search and ready keyboard without
manually focusing the field. The remote Continue control can appear under
different accessibility types or application scopes; its one 30-second
dismissal budget is separate from the 15-second search-readiness budget, which
starts fresh afterward. Readiness failures attach both host and system
accessibility hierarchies. After confirmed tutorial dismissal, readiness polls
only the product field and keyboard, requiring a tappable key as well as the
interactive search without repeating remote system-UI queries. The gate rejects
retry-recovered tests as flaky.
Xcode and an installed iOS Simulator runtime are required. Native keyboard
checks also require an on-screen software keyboard with hittable keys; an
off-screen keyboard is a prerequisite failure, not a successful focus proof.
The runner does not change the Simulator application's keyboard preferences.

The runner reports the original failed attempt even when Xcode's final summary
shows a recovered pass. Failures retain the Xcode log and result bundle in a
fresh `build/ios-smoke-*` directory. CI and release workflows upload those
diagnostics for seven days. Successful runs remove their temporary build data.

The full renderer integration smoke retains its interaction and styling
assertions with an explicit 15-second ceiling for loaded macOS CI runners.

## Manual hosts

Start Metro and launch either native project:

```bash
npm start -w @aurelglyph/example-react-native-smoke
npm run ios -w @aurelglyph/example-react-native-smoke
npm run android -w @aurelglyph/example-react-native-smoke
```

The Android smoke gate requires Android Studio's SDK and JDK 17. The iOS project
requires Xcode and CocoaPods.
