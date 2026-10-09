# @aurelglyph/react-native

Native Aurelglyph components, themes, tokens, and packaged fonts for iOS and Android.

Public npm publication begins with Aurelglyph `1.0.0`; before then, consume this
package from the Git repository or workspace.

```bash
npm install @aurelglyph/react-native react react-native react-native-safe-area-context
```

The responsive interaction layer supports the verified React Native 0.86 and
0.87 lines with React 19.2.3 or newer within React 19. The release host runs on
React Native 0.87.1 and retains the 0.86 public compatibility range. Safe-area
handling uses the maintained `react-native-safe-area-context` package instead
of React Native's deprecated core `SafeAreaView`.

React Native 0.87 enables prebuilt RNCore by default, but that release's
framework layout does not expose the Fabric headers imported by generated
third-party component registration for `react-native-safe-area-context`. Until
that upstream header contract is corrected, place this line before
`prepare_react_native_project!` in the application's `ios/Podfile`, then run
`pod install` again:

```ruby
ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
```

This builds RNCore from source and restores the public `<React/...>` header
layout. Aurelglyph's RN 0.87 native host enforces this ordering before its iOS
UI contract runs. React Native 0.86 consumers do not need the override.

## Theme provider

Wrap the app once. `system` follows the device appearance. The default
`atelier` appearance retains the layered Aurelglyph surfaces and selected
accent; `quiet` uses flatter near-white/charcoal surfaces, smaller radii, lower
elevation, and one restrained violet signal palette.

Place `SafeAreaProvider` from `react-native-safe-area-context` above the
Aurelglyph provider so modal and hosted overlays resolve device insets.

```tsx
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AurelglyphProvider,
  Button,
  Stack,
  Surface,
  TextField
} from "@aurelglyph/react-native";

export function Settings() {
  return (
    <SafeAreaProvider>
      <AurelglyphProvider appearance="quiet" mode="system" accent="royal-purple">
        <Surface elevation="raised">
          <Stack gap={4}>
            <TextField label="System name" value="Workbench" />
            <Button onPress={() => {}}>Save changes</Button>
          </Stack>
        </Surface>
      </AurelglyphProvider>
    </SafeAreaProvider>
  );
}
```

The generated `aurelglyphTheme` object is still exported for direct token
access. `resolveAurelglyphTheme(mode, accent, appearance)` returns native
numeric spacing, radius, and elevation values plus mode-aware semantic colors.
In quiet mode, filled controls use the contrast-verified control accent while
compact badge text and selection indicators use the lighter/darker focus signal
appropriate to the resolved mode; consumer components should preserve that
role distinction instead of using `accentStrong` as small text.
The appearance argument defaults to `atelier`; in `quiet`, the accent selection
is retained for lossless switching but rendered controls use the reduced signal
palette. Components never hardcode their own palette.

## Components

The adapter shares the public Aurelglyph vocabulary used by React and Rails:

- Actions: `Button`, `Icon`, `IconButton`, `ButtonGroup`, `Link`, `Chip`
- Fields: `TextField`, `SearchField`, `TextArea`, `Switch`, `Checkbox`,
  `RadioGroup`, `Slider`, `NumberField`, `Select`, `Combobox`, `Autocomplete`,
  `FileUpload`, `PasswordField`, `InputGroup`, `Rating`
- Overlays: `Dialog`, `Drawer`, `Popover`, `MoreInformation`, `Tooltip`, `Menu`, `Dropdown`,
  `CommandPalette`
- Navigation: `Tabs`, `SegmentedControl`, `TabBar`, `Pagination`, `Stepper`
- Feedback: `Spinner`, `Progress`, `ValidationSummary`
- Layout: `Surface`, `Box`, `Stack`, `Container`, responsive `Grid`, `Divider`
- Disclosure: `ExpandableSection`, `Accordion`

Value-selection controls use `value` plus `onValueChange`, with `defaultValue`
for local state. Text and search fields follow React Native's native
`value`/`onChangeText` contract; checkboxes use `checked`/`onCheckedChange`;
overlays use controlled `open`/`onOpenChange`. Command-palette search text may
be controlled separately with `query`/`onQueryChange`.

`Select` and `Combobox` theme both their trigger and expanded list.
`Menu`/`Dropdown` theme the controlled expanded list; pair them with an
Aurelglyph `Button` or `IconButton` when the library should also own the trigger
paint. All option surfaces use tokenized Aurelglyph dialogs rather than
browser-style defaults. Actionable menu and selection rows expose native button
semantics while retaining disabled and selected state. Searchable option lists
preserve option taps while the native keyboard is focused. `Select` leaves its
optional search field unfocused so the expanded list is immediately ready for a
choice without forcing the keyboard; `Combobox` focuses search by default. Set
`autoFocusSearch` explicitly to override either behavior. When a searchable
control is nested inside an application-owned `ScrollView`, set that ancestor's
`keyboardShouldPersistTaps="always"` as well; React Native ancestor responders
run before the modal's internal option list. Autofocus is applied after native
input mount and reinforced after modal presentation so its first settled option
action remains available.

Use `MoreInformation` for optional supporting copy that should not occupy the
primary working surface. It provides a 44-point accessible trigger and a
safe-area-aware popover. Keep validation errors and live status inline.

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
Select and Combobox triggers expose their current option as a native
accessibility value, so the selection is announced with the control itself.
Interactive labels always use the high-contrast foreground token; the muted
token is used for ordinary helper text, descriptions, placeholders, and
metadata. Invalid helper text uses the danger token and a polite live-region
announcement even when the field does not provide a separate error string.
Modal transitions automatically disable themselves when the operating system's
Reduce Motion setting is enabled.

## Component essentials

`Link` opens `href` through React Native Linking, or calls `onPress` for
application-owned native navigation. Set `external` for the curated external
indicator and localized hint; `onOpenError` receives URI-opening failures.
Disabled/loading links and links without any destination render an unavailable,
non-focusable placeholder, with no URI or activation/context/accessibility
handler, native link role, underline, or external-arrow affordance. Navigation is
never simulated with an action button.

`Chip` uses `selected`/`onSelectedChange` or `defaultSelected`; `selectable`
can explicitly disable selection; selection is enabled by default. Its optional `onRemove` action is a separately
labeled sibling control, never a nested button. Disabled/loading/read-only
chips cannot select or remove. Static status copy still belongs in a Badge
where that adapter provides one.

`PasswordField` owns one native TextInput and preserves its value, focused
selection, and password-manager metadata while revealing/masking. It uses
the current controlled value when bounding retained iOS focus selection; an
explicit `selection` takes precedence. The iOS focus-caret change is under native
CI verification: passing renderer tests alone does not establish the secure
editing-buffer contract. Android and revealed fields do not use that command.
It follows
native `value`/`onChangeText` or `defaultValue`, supports controlled
`visible`/`onVisibleChange` or `defaultVisible`, and accepts `inputRef`.
`purpose="current"` is the default; `purpose="new"` selects new-password
autofill/content type. Native `autoComplete`, `textContentType`, password rules,
and input props remain consumer-overridable. Read-only prevents value edits but
allows inspection; disabled/loading also block reveal. `showLabel`/`hideLabel`
override generated accessibility copy. `inputRef` preserves React 19 callback-ref
cleanup as well as object refs and ordinary null-on-unmount callbacks.

`InputGroup` owns exactly one labeled native TextInput with the same field
state/error contract. `prefix`/`suffix` accept text or independently accessible
action nodes. Addons wrap at constrained widths instead of replacing or nesting
the input. Text addons are decorative; put essential unit/currency
context into `addonDescription` (appended to the input hint) or the field label. The application
owns addon action state. `inputRef` supports application-requested field focus.
Both owned fields use the focus token for their focused border and preserve
consumer `onFocus`/`onBlur` callbacks.

`ValidationSummary` accepts only supplied `errors` with stable `id`, `message`,
and optional field-focus `onPress`. It renders nothing when empty and never
validates the form itself. Change `announcementKey` or `focusKey` after a failed
submission to request one announcement or accessibility focus per key during the
mounted lifetime; cycling back to a handled key does not repeat it. Ordinary
error updates do neither. The announcement contains the title and localized
count only, avoiding repeated inline-error announcements and field values.

`ExpandableSection` is the independent controlled/uncontrolled
`open`/`onOpenChange`/`defaultOpen` disclosure. It exposes native expanded state,
a disabled/busy button state, and an Android labeled-panel relationship;
collapsed content is removed from interaction and accessibility. `headingLevel`
expresses header intent, but React Native core does not guarantee native heading
levels or separate heading traversal inside an accessible button on every
platform. `Accordion` composes that same primitive,
using `value`/`onValueChange` or `defaultValue` as a readonly array of item IDs.
`type="single"` opens at most one item; `type="multiple"` permits several.
Items supply `id`, `title`, `content`, and optional `disabled`/`eyebrow`; open
IDs normalize in item order under both policies.

`Stepper` presents ordered `items` with current/completed/upcoming/error status.
`currentId`/`defaultCurrentId` select the current step; optional `onStepChange`
makes enabled steps native buttons. The current ID is authoritative; explicit
error state retains current emphasis, status, and selected metadata alongside
its warning. Other explicit item status overrides inferred progress. Without the callback it remains non-navigable status, not a workflow
or routing engine. `orientation` selects horizontal wrapping or vertical layout.

`Rating` accepts whole-number `value`/`onValueChange` or `defaultValue` from
zero to `max` (default five; finite maxima normalize to 1–20). Non-integer values normalize to the closest whole
choice; non-finite values normalize to zero. It offers native adjustable
increment/decrement, 44-point touch choices, an explicit value label, and a
separate clear action. Required ratings can start at zero with invalid state,
but cannot be cleared or decremented to zero. Required/read-only ratings omit
clear; `clearable={false}` also hides it. Read-only/disabled/loading cannot
change the value and use muted stars while retaining selected fill geometry.
Invalid ratings show a semantic danger boundary and a decorative warning marker,
even without an error message. Existing semantic tokens carry invalid and helper
states through light/dark and quiet/atelier.

The real native smoke host contains all eight essentials and controlled
examples. Renderer tests exercise unavailable links, sibling chip removal,
password-manager/focus/value contracts, input ownership, once-only summary
requests, disclosure/accordion state, ordered steps, rating accessibility, and
localized copy. The icon adapter adds canonical `star`, `eye`, `eye-off`,
`external-link`, `warning`, `expand`, and `contract` geometry without a new
dependency. This expansion does not imply parity for older shell/data/feedback
families absent from this native adapter.

## Localized control copy

Wrap a subtree in `AurelglyphControlCopyProvider` to replace generated visible
copy and accessibility phrases once. Explicit component props still win; for
example, `Dialog` accepts `closeText` and `closeLabel`, `SearchField` accepts
`clearText` and `clearLabel`, and `Select` accepts `searchPlaceholder`.

```tsx
<AurelglyphControlCopyProvider
  value={{
    close: "Fermer",
    closeLabel: (title) => `Fermer ${title}`,
    filterOptions: "Filtrer les options",
    readOnly: "lecture seule"
  }}
>
  <Settings />
</AurelglyphControlCopyProvider>
```

The standard copy object is exported as `aurelglyphControlCopy`; spread it when
building a complete locale catalog. Descriptions and read-only state remain
attached to the focused native `Switch`, so VoiceOver and TalkBack do not lose
that context.

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
`check`, `close`, `plus`, `minus`, `info`, directional chevrons, and the component
essentials glyphs listed above. `filled` adds canonical polygon fill to `star`
without changing its outline; other icons remain line icons. Pass a
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
