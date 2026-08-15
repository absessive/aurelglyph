# Aurelglyph React Native smoke host

This private React Native 0.86 app consumes the built
`@aurelglyph/react-native` workspace package through the same package entry
point as an external application. Its focused screen exercises a
consumer-owned native `Modal`, a modal-local `AurelglyphOverlayHost`, tooltip
measurement, viewport clamping, and touch pass-through.

## Workspace checks

From the Aurelglyph workspace root:

```bash
npm run build -w @aurelglyph/example-react-native-smoke
npm test -w @aurelglyph/example-react-native-smoke
npm run lint -w @aurelglyph/example-react-native-smoke
```

The Jest check opens the modal in the React Native renderer and verifies that
the nested overlay host does not intercept the underlying control.

Build the Android production JavaScript bundle and validate the CLI's native
project/autolinking configuration without starting an emulator:

```bash
npm run test:android -w @aurelglyph/example-react-native-smoke
```

## iOS native regression

Install pods after cloning or changing native dependencies:

The checked-in `Gemfile.lock` uses Ruby 3.1 or newer, Bundler 2.6.2, and
CocoaPods 1.16.2 so a fresh clone uses the same native dependency toolchain as
the regression runner.

```bash
cd examples/react-native-smoke
bundle install
bundle exec pod install --project-directory=ios
```

Then run the release-mode simulator contract from the workspace root:

```bash
npm run test:ios -w @aurelglyph/example-react-native-smoke
```

The runner selects an available iPhone simulator, builds a self-contained
Hermes bundle, and uses XCTest to verify that the tooltip stays inside the
native modal window, moves after anchor and viewport changes, and leaves the
underlying action hittable. Xcode and an installed iOS Simulator runtime are
required.

## Manual hosts

Start Metro and launch either native project:

```bash
npm start -w @aurelglyph/example-react-native-smoke
npm run ios -w @aurelglyph/example-react-native-smoke
npm run android -w @aurelglyph/example-react-native-smoke
```

Android requires Android Studio's SDK and a compatible JDK. The iOS project
requires Xcode and CocoaPods.
