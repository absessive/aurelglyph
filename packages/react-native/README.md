# @aurelglyph/react-native

Native Aurelglyph components, themes, tokens, and packaged fonts for iOS and Android.

```bash
npm install @aurelglyph/react-native react react-native
```

The 0.6 responsive interaction layer targets the verified React Native 0.86.x line and
React 19.2.3 or newer within React 19. It has no runtime UI dependency beyond
React Native itself.

## Theme provider

Wrap the app once. `system` follows the device appearance; dark mode and the
`royal-purple` accent remain the Aurelglyph showcase defaults.

```tsx
import {
  AurelglyphProvider,
  Button,
  Stack,
  Surface,
  TextField
} from "@aurelglyph/react-native";

export function Settings() {
  return (
    <AurelglyphProvider mode="system" accent="royal-purple">
      <Surface elevation="raised">
        <Stack gap={4}>
          <TextField label="System name" value="Workbench" />
          <Button onPress={() => {}}>Save changes</Button>
        </Stack>
      </Surface>
    </AurelglyphProvider>
  );
}
```

The generated `aurelglyphTheme` object is still exported for direct token
access. `resolveAurelglyphTheme(mode, accent)` returns native numeric spacing
and radius values plus mode-aware semantic colors. Components never hardcode
their own palette.

## Components

The adapter shares the public Aurelglyph vocabulary used by React and Rails:

- Actions: `Button`, `Icon`, `IconButton`, `ButtonGroup`
- Fields: `TextField`, `SearchField`, `TextArea`, `Switch`, `Checkbox`,
  `RadioGroup`, `Slider`, `NumberField`, `Select`, `Combobox`, `Autocomplete`,
  `FileUpload`
- Overlays: `Dialog`, `Drawer`, `Popover`, `Tooltip`, `Menu`, `Dropdown`,
  `CommandPalette`
- Navigation: `Tabs`, `SegmentedControl`, `TabBar`, `Pagination`
- Feedback: `Spinner`, `Progress`
- Layout: `Surface`, `Box`, `Stack`, `Container`, responsive `Grid`, `Divider`

Value-selection controls use `value` plus `onValueChange`, with `defaultValue`
for local state. Text and search fields follow React Native's native
`value`/`onChangeText` contract; checkboxes use `checked`/`onCheckedChange`;
overlays use controlled `open`/`onOpenChange`. Command-palette search text may
be controlled separately with `query`/`onQueryChange`.

```tsx
const options = [
  { value: "quiet", label: "Quiet", description: "Signal over noise." },
  { value: "active", label: "Active" }
];

<Combobox
  label="Operating mode"
  options={options}
  value={mode}
  onValueChange={setMode}
/>
```

`disabled`, `loading`, `readOnly`, `required`, and `invalid` are consistently
reflected in interaction behavior and supported native accessibility states,
labels, values, and hints. Adjustable controls implement VoiceOver and TalkBack
increment/decrement actions; individual tabs, radios, checkboxes, menu items,
dialog titles, progress indicators, and selection controls expose their
corresponding native roles and values. Every dialog has a labeled close control
in addition to back and optional scrim dismissal.
Interactive labels always use the high-contrast foreground token; the muted
token is used for ordinary helper text, descriptions, placeholders, and
metadata. Invalid helper text uses the danger token and a polite live-region
announcement even when the field does not provide a separate error string.
Modal transitions automatically disable themselves when the operating system's
Reduce Motion setting is enabled.

## Responsive and constrained layouts

`Dialog`, `Drawer`, and selection overlays stay inside a safe-area-aware,
keyboard-avoiding shell in compact portrait and landscape windows. Dialog
bodies scroll by default, while headers and wrapping action footers remain
reachable. Set `scrollable={false}` when the child already owns scrolling, such
as a `FlatList`. `screenInset`, `contentContainerStyle`,
`keyboardAvoidingBehavior`, and `keyboardVerticalOffset` tune the shell without
replacing it. Standard `Modal` options such as `statusBarTranslucent`,
`supportedOrientations`, and `transparent` are forwarded and remain
consumer-overridable.

`AurelglyphProvider` also installs the non-modal root overlay host used by
tooltips. It uses the native safe area by default; pass `overlayInsets` from the
host application's safe-area source when explicit cross-platform inset values
are available. `AurelglyphOverlayHost` is exported for apps that need to place
the host separately from the theme provider; set `overlayHost={false}` when the
application owns every host. The host reserves an elevated, non-blocking root
layer so application panels do not cover active tooltips. Because a native
`Modal` is presented above the application's root native hierarchy, wrap
tooltip-bearing content in an `AurelglyphOverlayHost` inside any consumer-owned
`Modal`. Aurelglyph `Dialog`, `Drawer`, and `Popover` do this automatically.

```tsx
<Modal visible={open} onRequestClose={close}>
  <AurelglyphOverlayHost>
    <ModalContentWithTooltips />
  </AurelglyphOverlayHost>
</Modal>
```

`Grid` resolves breakpoints from its measured container rather than the full
device window, so it behaves correctly in drawers, tablet split views, and
nested panels. `minItemWidth` can reduce the requested column count when a cell
would otherwise become too narrow.

```tsx
<Grid
  columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
  minItemWidth={240}
>
  {systems.map((system) => <SystemCard key={system.id} system={system} />)}
</Grid>
```

Horizontal `ButtonGroup` instances wrap by default unless attached;
`SegmentedControl` wraps and gives enlarged labels more width, while `TabBar`
expands and scrolls when its destinations no longer fit. Small buttons keep
their compact 36-point visual height while exposing a 44-point touch area.
Pagination and segmented targets are at least 44 points in both dimensions.

## Native behavior

Modal surfaces are backed by React Native `Modal` for reliable z-order, touch,
and screen-reader isolation on both platforms. `Tooltip` accepts one Pressable-like
trigger element, composes its existing long-press handlers, and adds an
`accessibilityHint` without nesting another accessible control. It supports
top, bottom, left, and right placement because touch devices do not have a
universal hover contract. Visible tooltips render through the provider's
non-blocking root overlay host, measure and remeasure their trigger, flip away
from constrained edges, and clamp to the host's safe bounds. `Slider` uses a
44-point core responder target and
the `adjustable` APIs, so it does not require a native slider dependency.

React Native only exposes a `View` role when that view is itself accessible;
making a structural wrapper accessible groups its descendants and can prevent
VoiceOver or TalkBack from reaching each control independently. Aurelglyph
therefore keeps group wrappers non-accessible, exposes the `dialog` role on the
visible dialog title, and repeats group context in the labels or hints of tabs,
radios, menu items, pagination controls, segmented controls, and grouped
buttons. It does not claim web-style `navigation`, `tablist`, `radiogroup`,
`toolbar`, or `list` landmarks on wrappers that native assistive technology
cannot discover.

`Spinner` uses the canonical `sm`, `md`, and `lg` sizes. `Container` supports
`sm`, `md`, `lg`, `xl`, and full-width layouts. `ButtonGroup` supports
horizontal and vertical orientation plus an explicit `wrap` override, and
`Divider` is a semantic separator unless `decorative` is explicitly enabled.

`Icon` provides stable dependency-free names for core controls: `search`,
`check`, `close`, `plus`, `minus`, `info`, and directional chevrons. Pass a
`label` only when the icon itself conveys meaning; otherwise it stays
decorative.

React Native core does not provide a document picker. `FileUpload` owns the
accessible presentation, selected-file list, loading/error states, and removal
actions, while the host supplies `onRequestFiles` using Expo DocumentPicker or
its preferred native picker.

## Fonts

The optional font subpath exposes static Metro requires for the five packaged
TTF assets. With Expo Font:

```tsx
import { useFonts } from "expo-font";
import {
  aurelglyphFontAssets,
  aurelglyphFontFamilies
} from "@aurelglyph/react-native/fonts";

const [fontsLoaded] = useFonts(aurelglyphFontAssets);
```

Bare React Native projects can link the files from `assets/fonts` through their
normal asset pipeline. Use the bold aliases for 600–700 weight text.
