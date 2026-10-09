import { act, StrictMode, useState, type ReactElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const nativeMock = vi.hoisted(() => ({
  anchor: { height: 44, width: 44, x: 24, y: 24 },
  defaultLayout: { height: 44, width: 100, x: 0, y: 0 },
  host: { height: 844, width: 390, x: 0, y: 0 },
  layouts: {} as Record<string, { height: number; width: number; x: number; y: number }>,
  tooltip: { height: 40, width: 160, x: 0, y: 0 },
  announce: vi.fn(),
  accessibilityFocus: vi.fn(),
  passwordSelection: vi.fn(),
  prepareSecureInput: vi.fn(),
  registerSecureInput: vi.fn(),
  unregisterSecureInput: vi.fn(),
  platform: "ios",
  openURL: vi.fn(() => Promise.resolve()),
  window: { fontScale: 1, height: 844, scale: 3, width: 390 }
}));

vi.mock("react-native", async () => {
  const React = await import("react");

  const flattenStyle = (style: unknown): Record<string, unknown> => {
    if (!style) return {};
    if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
    return typeof style === "object" ? style as Record<string, unknown> : {};
  };

  const accessibilityProps = (props: Record<string, unknown>) => {
    const state = (props.accessibilityState ?? {}) as Record<string, unknown>;
    const value = props.accessibilityValue as Record<string, unknown> | undefined;
    return {
      "aria-busy": state.busy === true || undefined,
      "aria-checked": state.checked as boolean | "mixed" | undefined,
      "aria-disabled": state.disabled === true || undefined,
      "aria-expanded": state.expanded as boolean | undefined,
      "aria-invalid": props["aria-invalid"] as boolean | undefined,
      "aria-label": props.accessibilityLabel as string | undefined,
      "aria-description": props.accessibilityHint as string | undefined,
      "aria-readonly": props["aria-readonly"] as boolean | undefined,
      "aria-required": props["aria-required"] as boolean | undefined,
      "aria-selected": state.selected as boolean | undefined,
      "data-live-region": props.accessibilityLiveRegion as string | undefined,
      "data-native-id": props.nativeID as string | undefined,
      "data-labelled-by": props.accessibilityLabelledBy as string | undefined,
      "data-focusable": props.focusable === false ? "false" : props.focusable === true ? "true" : undefined,
      "data-accessibility-hidden": props.accessibilityElementsHidden ? "true" : undefined,
      "data-important-for-accessibility": props.importantForAccessibility as string | undefined,
      "data-accessibility-value": value ? JSON.stringify(value) : undefined,
      "data-accessible": props.accessible === false ? "false" : props.accessible === true ? "true" : undefined,
      "data-testid": props.testID as string | undefined,
      tabIndex: props.tabIndex as number | undefined,
      role: (props.role ?? props.accessibilityRole) as string | undefined
    };
  };

  const View = React.forwardRef(({
    children,
    onAccessibilityAction,
    onLayout,
    onResponderGrant,
    onStartShouldSetResponder,
    style,
    ...props
  }: Record<string, unknown> & { children?: ReactNode }, ref) => {
    const testID = props.testID as string | undefined;
    const layout = testID && nativeMock.layouts[testID]
      ? nativeMock.layouts[testID]
      : testID === "aurelglyph-overlay-host"
        ? { height: nativeMock.host.height, width: nativeMock.host.width, x: 0, y: 0 }
        : props.role === "tooltip"
          ? nativeMock.tooltip
          : nativeMock.defaultLayout;
    React.useImperativeHandle(ref, () => ({
      measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => {
        const { height, width, x, y } = testID === "aurelglyph-overlay-host" ? nativeMock.host : nativeMock.anchor;
        callback(x, y, width, height);
      }
    }));
    React.useEffect(() => {
      (onLayout as ((event: unknown) => void) | undefined)?.({ nativeEvent: { layout } });
      // The scalar dependencies deliberately model native geometry changes; the mock layout object is recreated on every render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout.height, layout.width, layout.x, layout.y, onLayout]);
    return React.createElement("div", {
      ...accessibilityProps(props),
      "data-rn": "View",
      "data-style": JSON.stringify(flattenStyle(style)),
      onBlur: props.onBlur as (() => void) | undefined,
      onFocus: props.onFocus as (() => void) | undefined,
      onMouseEnter: props.onHoverIn as (() => void) | undefined,
      onMouseLeave: props.onHoverOut as (() => void) | undefined,
      onContextMenu: props.onContextMenu as (() => void) | undefined,
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowUp") (onAccessibilityAction as ((event: unknown) => void) | undefined)?.({ nativeEvent: { actionName: "increment" } });
        if (event.key === "ArrowDown") (onAccessibilityAction as ((event: unknown) => void) | undefined)?.({ nativeEvent: { actionName: "decrement" } });
      },
      onMouseDown: () => {
        if ((onStartShouldSetResponder as (() => boolean) | undefined)?.()) {
          (onResponderGrant as ((event: unknown) => void) | undefined)?.({ nativeEvent: { locationX: 50 } });
        }
      }
    }, children);
  });
  View.displayName = "MockView";

  const SafeAreaView = ({ children, style, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
    "div",
    { ...accessibilityProps(props), "data-rn": "SafeAreaView", "data-style": JSON.stringify(flattenStyle(style)) },
    children
  );

  const KeyboardAvoidingView = ({ behavior, children, keyboardVerticalOffset, style, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
    "div",
    {
      ...accessibilityProps(props),
      "data-behavior": behavior as string | undefined,
      "data-keyboard-offset": String(keyboardVerticalOffset ?? 0),
      "data-rn": "KeyboardAvoidingView",
      "data-style": JSON.stringify(flattenStyle(style))
    },
    children
  );

  const Text = React.forwardRef<HTMLSpanElement, Record<string, unknown> & { children?: ReactNode }>(({ children, style, ...props }, ref) => React.createElement(
    "span",
    { ...accessibilityProps(props), "data-rn": "Text", "data-style": JSON.stringify(flattenStyle(style)), ref },
    children as ReactNode
  ));
  Text.displayName = "MockText";

  const Pressable = ({
    children,
    disabled,
    onLongPress,
    onBlur,
    onFocus,
    onPress,
    onPressOut,
    style,
    ...props
  }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
    "button",
    {
      ...accessibilityProps(props),
      "data-hit-slop": props.hitSlop ? JSON.stringify(props.hitSlop) : undefined,
      "data-rn": "Pressable",
      "data-style": JSON.stringify(flattenStyle(typeof style === "function" ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false }) : style)),
      disabled: Boolean(disabled),
      onClick: disabled ? undefined : onPress as (() => void) | undefined,
      onBlur: onBlur as (() => void) | undefined,
      onFocus: onFocus as (() => void) | undefined,
      onContextMenu: disabled ? undefined : (event: Event) => {
        event.preventDefault();
        (onLongPress as ((event: unknown) => void) | undefined)?.({ nativeEvent: {} });
      },
      onMouseUp: disabled ? undefined : () => (onPressOut as ((event: unknown) => void) | undefined)?.({ nativeEvent: {} }),
      type: "button"
    },
    children
  );

  const TextInput = React.forwardRef<{ focus: () => void }, Record<string, unknown>>(({
    autoFocus,
    defaultValue,
    editable = true,
    onBlur,
    onChangeText,
    onSelectionChange,
    placeholder,
    style,
    value,
    ...props
  }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [nativeEditCount, recordNativeEdit] = React.useState(0);
    // RN's setLocalRef depends on its event count but returns the same native
    // input. A testID change models an actual underlying-input replacement.
    // These dependencies intentionally simulate RN ref churn/view replacement,
    // not a change in the imperative methods themselves.
    const instance = React.useMemo(() => ({
      testID: props.testID,
      focus: () => { inputRef.current?.focus(); },
      isFocused: () => document.activeElement === inputRef.current,
      setSelection: (start: number, end: number) => { nativeMock.passwordSelection(start, end); inputRef.current?.setSelectionRange(start, end); },
      setNativeProps: ({ selection }: { selection?: { start: number; end?: number } }) => {
        if (selection) inputRef.current?.setSelectionRange(selection.start, selection.end ?? selection.start);
      }
    }), [props.testID]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useImperativeHandle(ref, () => instance, [instance, nativeEditCount]);
    return React.createElement("input", {
      ...accessibilityProps(props),
      autoFocus: Boolean(autoFocus),
      "data-auto-focus": String(Boolean(autoFocus)),
      "data-auto-complete": props.autoComplete as string | undefined,
      "data-content-type": props.textContentType as string | undefined,
      "data-selection": props.selection ? JSON.stringify(props.selection) : undefined,
      "data-secure": String(Boolean(props.secureTextEntry)),
      "data-rn": "TextInput",
      "data-style": JSON.stringify(flattenStyle(style)),
      defaultValue: defaultValue as string | undefined,
      disabled: editable === false,
      onBlur: onBlur as ((event: unknown) => void) | undefined,
      onFocus: props.onFocus as ((event: unknown) => void) | undefined,
      onChange: (event: { currentTarget: { value: string } }) => {
        recordNativeEdit(count => count + 1);
        (onChangeText as ((value: string) => void) | undefined)?.(event.currentTarget.value);
      },
      onSelect: (event: { currentTarget: HTMLInputElement }) => (onSelectionChange as ((event: unknown) => void) | undefined)?.({ nativeEvent: { selection: { start: event.currentTarget.selectionStart ?? 0, end: event.currentTarget.selectionEnd ?? 0 } } }),
      placeholder: placeholder as string | undefined,
      ref: inputRef,
      type: props.secureTextEntry ? "password" : "text",
      value: value as string | undefined
    });
  });
  TextInput.displayName = "MockTextInput";

  const Modal = ({
    animationType,
    children,
    onRequestClose,
    onShow,
    statusBarTranslucent,
    supportedOrientations,
    transparent,
    visible
  }: {
    animationType?: string;
    children?: ReactNode;
    onRequestClose?: () => void;
    onShow?: () => void;
    statusBarTranslucent?: boolean;
    supportedOrientations?: readonly string[];
    transparent?: boolean;
    visible?: boolean;
  }) => {
    React.useEffect(() => {
      if (visible) onShow?.();
    }, [onShow, visible]);
    return visible
      ? React.createElement("div", {
        "data-animation": animationType,
        "data-rn": "Modal",
        "data-status-bar-translucent": String(Boolean(statusBarTranslucent)),
        "data-supported-orientations": supportedOrientations?.join(","),
        "data-transparent": String(Boolean(transparent)),
        onKeyDown: (event: KeyboardEvent) => event.key === "Escape" && onRequestClose?.()
      }, children)
      : null;
  };

  const Switch = ({ disabled, onValueChange, value, ...props }: Record<string, unknown>) => React.createElement("button", {
    ...accessibilityProps(props),
    "aria-checked": Boolean(value),
    "data-rn": "Switch",
    disabled: Boolean(disabled),
    onClick: disabled ? undefined : () => (onValueChange as ((value: boolean) => void) | undefined)?.(!value),
    role: "switch",
    type: "button"
  });

  const ScrollView = ({ children, contentContainerStyle, keyboardShouldPersistTaps, style, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
    "div",
    {
      ...accessibilityProps(props),
      "data-content-style": JSON.stringify(flattenStyle(contentContainerStyle)),
      "data-horizontal": String(Boolean(props.horizontal)),
      "data-keyboard-should-persist-taps": keyboardShouldPersistTaps as string | undefined,
      "data-rn": "ScrollView",
      "data-style": JSON.stringify(flattenStyle(style))
    },
    children
  );

  const ActivityIndicator = ({ color, size }: { color?: string; size?: number | string }) => React.createElement("div", {
    "data-color": color,
    "data-rn": "ActivityIndicator",
    "data-size": String(size)
  });

  return {
    AccessibilityInfo: {
      announceForAccessibility: nativeMock.announce,
      setAccessibilityFocus: nativeMock.accessibilityFocus,
      addEventListener: () => ({ remove: () => undefined }),
      isReduceMotionEnabled: () => new Promise<boolean>(() => undefined)
    },
    ActivityIndicator,
    I18nManager: { isRTL: false },
    Linking: { openURL: nativeMock.openURL },
    findNodeHandle: () => 17,
    Platform: { get OS() { return nativeMock.platform; } },
    NativeModules: { AurelglyphSecureEntry: {
      prepareSecureInput: nativeMock.prepareSecureInput,
      registerSecureInput: nativeMock.registerSecureInput,
      unregisterSecureInput: nativeMock.unregisterSecureInput
    } },
    KeyboardAvoidingView,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet: {
      absoluteFill: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
      create: <T,>(styles: T) => styles,
      flatten: flattenStyle,
      hairlineWidth: 1
    },
    Switch,
    Text,
    TextInput,
    View,
    useColorScheme: () => "dark",
    useWindowDimensions: () => ({ ...nativeMock.window })
  };
});

describe("React Native component expansion", () => {
  it("opens enabled links and makes unavailable destinations inert across all activation paths", () => {
    const onPress = vi.fn();
    const onLongPress = vi.fn();
    const onAccessibilityTap = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onHoverIn = vi.fn();
    const onHoverOut = vi.fn();
    const onContextMenu = vi.fn();
    const rendered = render(<Link external href="https://example.com">Documentation</Link>);
    const enabled = rendered.container.querySelector('[role="link"]')!;
    expect(enabled.getAttribute("aria-description")).toContain("Opens an external link");
    expect(styleOf(enabled).minHeight).toBe(44);
    click(enabled);
    expect(nativeMock.openURL).toHaveBeenCalledWith("https://example.com");
    act(() => (enabled as HTMLElement).focus());
    expect(styleOf(enabled).borderColor).toBe(resolveAurelglyphTheme().colors.focus);
    rendered.rerender(<Link disabled external href="https://example.com" onAccessibilityTap={onAccessibilityTap} onBlur={onBlur} onFocus={onFocus} onHoverIn={onHoverIn} onHoverOut={onHoverOut} onPress={onPress} {...{ onContextMenu, onLongPress, tabIndex: 0 }}>Documentation</Link>);
    const placeholder = rendered.container.querySelector('[aria-label="Documentation"]')!;
    expect(placeholder.getAttribute("data-rn")).toBe("View");
    expect(placeholder.getAttribute("data-focusable")).toBe("false");
    expect(placeholder.getAttribute("aria-disabled")).toBe("true");
    expect(placeholder.hasAttribute("href")).toBe(false);
    expect(placeholder.hasAttribute("role")).toBe(false);
    expect(placeholder.hasAttribute("tabindex")).toBe(false);
    expect(placeholder.querySelector('[data-rn="View"]')).toBeNull();
    expect(styleOf(placeholder.querySelector('[data-rn="Text"]')).textDecorationLine).toBe("none");
    expect(styleOf(placeholder).borderColor).toBe("transparent");
    expect(placeholder.getAttribute("aria-description")).not.toContain("external");
    expect(rendered.container.querySelector("button")).toBeNull();
    click(placeholder);
    act(() => {
      placeholder.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
      placeholder.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      placeholder.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      placeholder.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      placeholder.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(nativeMock.openURL).toHaveBeenCalledOnce();
    expect(onPress).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onAccessibilityTap).not.toHaveBeenCalled();
    expect(onFocus).not.toHaveBeenCalled();
    expect(onBlur).not.toHaveBeenCalled();
    expect(onHoverIn).not.toHaveBeenCalled();
    expect(onHoverOut).not.toHaveBeenCalled();
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  it("handles URI errors and supports a consumer native navigation callback", async () => {
    const onOpenError = vi.fn();
    nativeMock.openURL.mockRejectedValueOnce(new Error("Cannot open destination"));
    const rendered = render(<Link href="custom://route" onOpenError={onOpenError}>Route</Link>);
    await act(async () => click(rendered.container.querySelector('[role="link"]')!));
    expect(onOpenError).toHaveBeenCalledWith(expect.any(Error));
    const onPress = vi.fn();
    rendered.rerender(<Link onPress={onPress}>Native route</Link>);
    click(rendered.container.querySelector('[role="link"]')!);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("keeps chip selection and removal as siblings and honors controlled/unavailable state", () => {
    const onSelectedChange = vi.fn();
    const onRemove = vi.fn();
    const rendered = render(<Chip defaultSelected label="Local" onRemove={onRemove} onSelectedChange={onSelectedChange} />);
    const selection = rendered.container.querySelector('[role="checkbox"]')!;
    const remove = rendered.container.querySelector('button[aria-label="Remove Local"]')!;
    expect(selection.contains(remove)).toBe(false);
    expect(remove.contains(selection)).toBe(false);
    expect(selection.getAttribute("aria-checked")).toBe("true");
    click(selection);
    expect(selection.getAttribute("aria-checked")).toBe("false");
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);
    click(remove);
    expect(onRemove).toHaveBeenCalledOnce();
    rendered.rerender(<Chip label="Local" onRemove={onRemove} onSelectedChange={onSelectedChange} selected />);
    click(rendered.container.querySelector('[role="checkbox"]')!);
    expect(rendered.container.querySelector('[role="checkbox"]')?.getAttribute("aria-checked")).toBe("true");
    rendered.rerender(<Chip label="Local" onRemove={onRemove} readOnly selected />);
    expect(Array.from(rendered.container.querySelectorAll("button")).every((button) => button.disabled)).toBe(true);
  });

  it("reveals password without losing value, selection, focus, or native password-manager metadata", () => {
    const onChangeText = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const rendered = render(<PasswordField defaultValue="calibration" label="Password" onBlur={onBlur} onChangeText={onChangeText} onFocus={onFocus} />);
    const input = rendered.container.querySelector("input")!;
    expect(input.type).toBe("password");
    expect(input.getAttribute("data-auto-complete")).toBe("current-password");
    expect(input.getAttribute("data-content-type")).toBe("password");
    act(() => { input.focus(); input.setSelectionRange(1, 4); input.dispatchEvent(new Event("select", { bubbles: true })); });
    expect(styleOf(input.parentElement).borderColor).toBe(resolveAurelglyphTheme().colors.focus);
    expect(onFocus).toHaveBeenCalledOnce();
    click(rendered.container.querySelector('button[aria-label="Show Password"]')!);
    expect(input.type).toBe("text");
    expect(input.value).toBe("calibration");
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(4);
    expect(onChangeText).not.toHaveBeenCalled();
    click(rendered.container.querySelector('button[aria-label="Hide Password"]')!);
    expect(input.type).toBe("password");
    expect(input.value).toBe("calibration");
    type(input, "revised");
    expect(onChangeText).toHaveBeenLastCalledWith("revised");
    expect(input.value).toBe("revised");
    act(() => input.blur());
    expect(styleOf(input.parentElement).borderColor).toBe(resolveAurelglyphTheme().colors.borderStrong);
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("registers synchronous native focus preparation without an async JS focus repair", () => {
    const onChangeText = vi.fn();
    const rendered = render(<PasswordField defaultValue="calibration" label="Password" onChangeText={onChangeText} />);
    act(() => rendered.container.querySelector<HTMLInputElement>("input")!.focus());
    expect(nativeMock.registerSecureInput).toHaveBeenCalledExactlyOnceWith(17);
    expect(nativeMock.prepareSecureInput).not.toHaveBeenCalled();
    expect(onChangeText).not.toHaveBeenCalled();
  });

  it("forwards explicit selection and leaves blurred updates for native focus preparation", () => {
    const onSelectionChange = vi.fn();
    const rendered = render(<PasswordField label="Password" onSelectionChange={onSelectionChange} selection={{ start: 1, end: 4 }} value="calibration" />);
    const input = rendered.container.querySelector<HTMLInputElement>("input")!;
    act(() => input.focus());
    expect(input.getAttribute("data-selection")).toBe(JSON.stringify({ start: 1, end: 4 }));
    rendered.rerender(<PasswordField label="Password" onSelectionChange={onSelectionChange} value="calibration" />);
    act(() => { input.setSelectionRange(9, 11); input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true })); });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ nativeEvent: { selection: { start: 9, end: 11 } } });
    act(() => input.blur());
    rendered.rerender(<PasswordField label="Password" value="ab" />);
    act(() => input.focus());
    expect(nativeMock.prepareSecureInput).not.toHaveBeenCalled();
    expect(input.value).toBe("ab");
  });

  it("retains native ownership through accepted-edit ref churn and detaches only on replacement or unmount", () => {
    const cleanup = vi.fn();
    const inputRef = vi.fn(() => cleanup);
    const rendered = render(<PasswordField defaultValue="saved" inputRef={inputRef} label="Password" testID="original" />);
    const input = rendered.container.querySelector<HTMLInputElement>("input")!;
    act(() => input.focus());
    type(input, "savedx");
    expect(input.value).toBe("savedx");
    expect(cleanup).toHaveBeenCalledOnce();
    expect(inputRef).toHaveBeenCalledTimes(2);
    expect(nativeMock.registerSecureInput).toHaveBeenCalledOnce();
    expect(nativeMock.unregisterSecureInput).not.toHaveBeenCalled();
    expect(nativeMock.prepareSecureInput).not.toHaveBeenCalled();
    rendered.rerender(<PasswordField defaultValue="saved" inputRef={inputRef} label="Password" testID="replacement" />);
    expect(nativeMock.unregisterSecureInput).toHaveBeenCalledExactlyOnceWith(17);
    expect(nativeMock.registerSecureInput).toHaveBeenCalledTimes(2);
    rendered.rerender(<></>);
    expect(nativeMock.unregisterSecureInput).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(3);
  });

  it("retains exactly one native owner through StrictMode lifecycles", () => {
    const rendered = render(<StrictMode><PasswordField defaultValue="saved" label="Password" /></StrictMode>);
    expect(nativeMock.registerSecureInput.mock.calls.length - nativeMock.unregisterSecureInput.mock.calls.length).toBe(1);
    const input = rendered.container.querySelector<HTMLInputElement>("input")!;
    act(() => input.focus());
    type(input, "savedx");
    expect(nativeMock.registerSecureInput.mock.calls.length - nativeMock.unregisterSecureInput.mock.calls.length).toBe(1);
    expect(nativeMock.prepareSecureInput).not.toHaveBeenCalled();
    rendered.rerender(<></>);
    expect(nativeMock.registerSecureInput.mock.calls.length).toBe(nativeMock.unregisterSecureInput.mock.calls.length);
  });

  it("does not dispatch the iOS focus caret command on Android or a revealed field", () => {
    nativeMock.platform = "android";
    const rendered = render(<PasswordField defaultValue="calibration" label="Password" />);
    const input = rendered.container.querySelector<HTMLInputElement>("input")!;
    act(() => { input.focus(); input.blur(); });
    nativeMock.platform = "ios";
    click(rendered.container.querySelector('button[aria-label="Show Password"]')!);
    act(() => input.focus());
    expect(nativeMock.prepareSecureInput).not.toHaveBeenCalled();
  });

  it("repairs controlled rejection and formatting without manufacturing change callbacks", () => {
    const onChangeText = vi.fn();
    const rendered = render(<PasswordField label="Password" onChangeText={onChangeText} value="saved" />);
    const input = rendered.container.querySelector<HTMLInputElement>("input")!;
    act(() => input.focus());
    nativeMock.prepareSecureInput.mockClear();
    type(input, "savedx");
    expect(onChangeText).toHaveBeenCalledOnce();
    expect(nativeMock.prepareSecureInput).toHaveBeenLastCalledWith(17, "saved", null);
    expect(input.value).toBe("saved");
    function Formatted(): ReactElement {
      const [value, setValue] = useState("calibration");
      return <PasswordField label="Formatted" onChangeText={next => { onChangeText(next); setValue(next.toLowerCase()); }} value={value} />;
    }
    rendered.rerender(<Formatted />);
    const formatted = rendered.container.querySelector<HTMLInputElement>("input")!;
    act(() => formatted.focus());
    nativeMock.prepareSecureInput.mockClear(); onChangeText.mockClear();
    type(formatted, "calibrationQ");
    expect(onChangeText).toHaveBeenCalledOnce();
    expect(nativeMock.prepareSecureInput).toHaveBeenLastCalledWith(17, "calibrationq", null);
    expect(formatted.value).toBe("calibrationq");
  });

  it("permits read-only password reveal while disabling edits, and blocks disabled/loading reveal", () => {
    const rendered = render(<PasswordField label="New password" purpose="new" readOnly value="saved" />);
    const input = rendered.container.querySelector("input")!;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute("data-auto-complete")).toBe("new-password");
    click(rendered.container.querySelector('button[aria-label="Show New password"]')!);
    expect(input.type).toBe("text");
    rendered.rerender(<PasswordField disabled label="New password" value="saved" />);
    expect(rendered.container.querySelector("button")?.disabled).toBe(true);
    rendered.rerender(<PasswordField label="New password" loading value="saved" />);
    expect(rendered.container.querySelector("button")?.disabled).toBe(true);
  });

  it("preserves React 19 password callback-ref cleanup and ordinary null cleanup", () => {
    const cleanup = vi.fn();
    const inputRef = vi.fn((input: unknown) => input ? cleanup : undefined);
    const rendered = render(<PasswordField inputRef={inputRef} label="Password" />);
    expect(inputRef).toHaveBeenCalledOnce();
    expect(inputRef.mock.calls[0][0]).toMatchObject({ focus: expect.any(Function) });
    click(rendered.container.querySelector('button[aria-label="Show Password"]')!);
    expect(inputRef).toHaveBeenCalledOnce();
    expect(cleanup).not.toHaveBeenCalled();
    rendered.rerender(<></>);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(inputRef).toHaveBeenCalledOnce();

    const ordinaryRef = vi.fn();
    const ordinary = render(<PasswordField inputRef={ordinaryRef} label="Ordinary" />);
    ordinary.rerender(<></>);
    expect(ordinaryRef).toHaveBeenLastCalledWith(null);
    const objectRef = { current: null };
    const object = render(<PasswordField inputRef={objectRef} label="Object" />);
    expect(objectRef.current).toMatchObject({ focus: expect.any(Function) });
    object.rerender(<></>);
    expect(objectRef.current).toBeNull();
  });

  it("owns one labeled input group and keeps addon actions independently accessible", () => {
    const action = vi.fn();
    const rendered = render(<InputGroup addonDescription="US dollars" error="Amount is required" label="Amount" prefix="$" required suffix={<IconButton icon={<Icon name="plus" />} label="Add amount" onPress={action} />} />);
    expect(rendered.container.querySelectorAll("input")).toHaveLength(1);
    const input = rendered.container.querySelector("input")!;
    expect(input.getAttribute("aria-label")).toBe("Amount, required, invalid");
    expect(input.getAttribute("aria-description")).toBe("US dollars. Amount is required");
    const prefix = Array.from(rendered.container.querySelectorAll("span")).find((node) => node.textContent === "$")!;
    expect(prefix.getAttribute("data-accessible")).toBe("false");
    expect(prefix.getAttribute("data-accessibility-hidden")).toBe("true");
    expect(prefix.getAttribute("data-important-for-accessibility")).toBe("no");
    expect(input.getAttribute("data-labelled-by")).toContain("ag-input-group");
    click(rendered.container.querySelector('button[aria-label="Add amount"]')!);
    expect(action).toHaveBeenCalledOnce();
    expect(styleOf(input.parentElement).flexWrap).toBe("wrap");
    expect(styleOf(input).minHeight).toBe(44);
    act(() => input.focus());
    expect(styleOf(input.parentElement).borderColor).toBe(resolveAurelglyphTheme().colors.focus);
    act(() => input.blur());
    expect(styleOf(input.parentElement).borderColor).toBe(resolveAurelglyphTheme().colors.danger);
    rendered.rerender(<InputGroup label="Amount" prefix="$" readOnly value="12" />);
    expect(rendered.container.querySelector("input")?.disabled).toBe(true);
  });

  it("renders only supplied errors and requests summary focus/announcement once per explicit key", () => {
    const focusField = vi.fn();
    const errors = [{ id: "name", message: "Enter a name", onPress: focusField }, { id: "region", message: "Choose a region" }];
    const rendered = render(<ValidationSummary errors={errors} />);
    expect(nativeMock.announce).not.toHaveBeenCalled();
    expect(nativeMock.accessibilityFocus).not.toHaveBeenCalled();
    expect(rendered.container.querySelector('[data-live-region="polite"]')).toBeNull();
    rendered.rerender(<ValidationSummary announcementKey={1} errors={errors} focusKey={1} />);
    expect(nativeMock.announce).toHaveBeenCalledExactlyOnceWith("Check these fields. 2 errors.");
    expect(nativeMock.accessibilityFocus).toHaveBeenCalledExactlyOnceWith(17);
    expect(nativeMock.announce.mock.calls[0][0]).not.toContain("Enter a name");
    rendered.rerender(<ValidationSummary announcementKey={1} errors={[...errors]} focusKey={1} />);
    expect(nativeMock.announce).toHaveBeenCalledOnce();
    expect(nativeMock.accessibilityFocus).toHaveBeenCalledOnce();
    click(rendered.container.querySelector('button[aria-label="Enter a name"]')!);
    expect(focusField).toHaveBeenCalledOnce();
    rendered.rerender(<ValidationSummary announcementKey={2} errors={[]} focusKey={2} />);
    expect(rendered.container.textContent).toBe("");
    expect(nativeMock.announce).toHaveBeenCalledOnce();
    rendered.rerender(<ValidationSummary announcementKey={2} errors={errors} focusKey={2} />);
    expect(nativeMock.announce).toHaveBeenCalledTimes(2);
    expect(nativeMock.accessibilityFocus).toHaveBeenCalledTimes(2);
    rendered.rerender(<ValidationSummary announcementKey={1} errors={errors} focusKey={1} />);
    rendered.rerender(<ValidationSummary announcementKey={2} errors={[...errors]} focusKey={2} />);
    expect(nativeMock.announce).toHaveBeenCalledTimes(2);
    expect(nativeMock.accessibilityFocus).toHaveBeenCalledTimes(2);
  });

  it("keeps standalone disclosure controlled and removes collapsed descendants", () => {
    const onOpenChange = vi.fn();
    const rendered = render(<ExpandableSection onOpenChange={onOpenChange} title="Details"><Button>Nested action</Button></ExpandableSection>);
    const trigger = rendered.container.querySelector('button[aria-label="Details"]')!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(rendered.container.textContent).not.toContain("Nested action");
    click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(rendered.container.querySelector('[data-labelled-by]')?.getAttribute("data-labelled-by")).toBe(trigger.getAttribute("data-native-id"));
    rendered.rerender(<ExpandableSection onOpenChange={onOpenChange} open={false} title="Details"><Button>Nested action</Button></ExpandableSection>);
    click(rendered.container.querySelector('button[aria-label="Details"]')!);
    expect(rendered.container.textContent).not.toContain("Nested action");
  });

  it("coordinates single and multiple accordion state and ignores disabled item activation", () => {
    const onValueChange = vi.fn();
    const items = [{ content: <Text>First body</Text>, id: "first", title: "First" }, { content: <Text>Second body</Text>, id: "second", title: "Second" }, { content: <Text>Third body</Text>, disabled: true, id: "third", title: "Third" }];
    const rendered = render(<Accordion defaultValue={["first"]} items={items} onValueChange={onValueChange} />);
    click(rendered.container.querySelector('button[aria-label="Second"]')!);
    expect(rendered.container.textContent).not.toContain("First body");
    expect(rendered.container.textContent).toContain("Second body");
    expect(onValueChange).toHaveBeenLastCalledWith(["second"]);
    click(rendered.container.querySelector('button[aria-label="Third"]')!);
    expect(onValueChange).toHaveBeenCalledOnce();
    rendered.rerender(<Accordion items={items} onValueChange={onValueChange} type="multiple" value={["first", "second"]} />);
    expect(rendered.container.textContent).toContain("First body");
    expect(rendered.container.textContent).toContain("Second body");
    click(rendered.container.querySelector('button[aria-label="First"]')!);
    expect(onValueChange).toHaveBeenLastCalledWith(["second"]);
    expect(rendered.container.textContent).toContain("First body");
  });

  it("renders ordered native step state without making static steps navigable", () => {
    const items = [{ id: "configure", label: "Configure" }, { id: "review", label: "Review" }, { id: "publish", label: "Publish", status: "error" as const }];
    const rendered = render(<Stepper currentId="review" items={items} />);
    expect(rendered.container.querySelectorAll("button")).toHaveLength(0);
    expect(rendered.container.querySelector('[aria-label="Configure, step 1 of 3, Completed"]')).not.toBeNull();
    expect(rendered.container.querySelector('[aria-label="Review, step 2 of 3, Current"]')).not.toBeNull();
    expect(rendered.container.querySelector('[aria-label="Publish, step 3 of 3, Needs attention"]')).not.toBeNull();
    const onStepChange = vi.fn();
    rendered.rerender(<Stepper currentId="review" items={[...items, { disabled: true, id: "locked", label: "Locked" }]} onStepChange={onStepChange} />);
    click(rendered.container.querySelector('button[aria-label="Configure, step 1 of 4, Completed"]')!);
    expect(onStepChange).toHaveBeenLastCalledWith("configure");
    const locked = rendered.container.querySelector('button[aria-label="Locked, step 4 of 4, Upcoming"]') as HTMLButtonElement;
    expect(locked.disabled).toBe(true);
    expect(styleOf(locked).minHeight).toBe(44);
  });

  it("provides whole-number rating, native adjustment, a separate clear action, and unavailable state", () => {
    const onValueChange = vi.fn();
    const rendered = render(<Rating defaultValue={2.6} label="Quality" onValueChange={onValueChange} />);
    const adjustable = rendered.container.querySelector('[role="adjustable"]')!;
    expect(JSON.parse(adjustable.getAttribute("data-accessibility-value")!).now).toBe(3);
    act(() => adjustable.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" })));
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    click(rendered.container.querySelector('button[aria-label="2 of 5"]')!);
    expect(onValueChange).toHaveBeenLastCalledWith(2);
    click(rendered.container.querySelector('button[aria-label="Clear rating"]')!);
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    rendered.rerender(<Rating label="Quality" onValueChange={onValueChange} readOnly value={3} />);
    expect(rendered.container.querySelectorAll('[role="radio"]')).toHaveLength(0);
    expect(rendered.container.querySelector('button[aria-label="Clear rating"]')).toBeNull();
    expect(rendered.container.querySelector('[role="adjustable"]')?.getAttribute("aria-label")).toBe("Quality, read only");
  });

  it("keeps zero visibly invalid when required and prevents required rating clear/decrement to zero", () => {
    const onValueChange = vi.fn();
    const rendered = render(<Rating label="Quality" onValueChange={onValueChange} required value={0} />);
    expect(rendered.container.querySelector('[role="adjustable"]')?.getAttribute("aria-label")).toBe("Quality, required, invalid");
    rendered.rerender(<Rating label="Quality" onValueChange={onValueChange} required value={1} />);
    act(() => rendered.container.querySelector('[role="adjustable"]')!.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })));
    expect(rendered.container.querySelector('button[aria-label="Clear rating"]')).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("visibly marks invalid-only ratings and mutes unavailable stars without removing their filled geometry", () => {
    const theme = resolveAurelglyphTheme();
    const rendered = render(<Rating invalid label="Quality" value={3} />);
    const adjustable = () => rendered.container.querySelector('[role="adjustable"]')!;
    expect(styleOf(rendered.container.firstElementChild).borderColor).toBe(theme.colors.danger);
    const warning = rendered.container.querySelector('[data-testid="aurelglyph-rating-invalid"]')!;
    expect(warning.getAttribute("data-accessibility-hidden")).toBe("true");
    expect(warning.getAttribute("data-important-for-accessibility")).toBe("no-hide-descendants");
    expect(adjustable().getAttribute("aria-label")).toBe("Quality, invalid");
    for (const state of [{ disabled: true }, { readOnly: true }, { loading: true }]) {
      rendered.rerender(<Rating label="Quality" value={3} {...state} />);
      const painted = Array.from(adjustable().querySelectorAll('[data-rn="View"]')).filter((node) => typeof styleOf(node).backgroundColor === "string");
      expect(painted.length).toBeGreaterThan(0);
      expect(painted.every((node) => styleOf(node).backgroundColor === theme.colors.muted)).toBe(true);
      expect(painted.some((node) => styleOf(node).height === 0.7)).toBe(true);
      expect(rendered.container.querySelector('[data-testid="aurelglyph-rating-invalid"]')).toBeNull();
      expect(adjustable().getAttribute("data-accessibility-value")).toContain('"now":3');
    }
  });

  it("localizes expansion-owned labels without leaking English fragments", () => {
    const rendered = render(<AurelglyphControlCopyProvider value={{ clear: "Effacer", clearRating: "Effacer la note", externalLink: "Lien externe", removeChipLabel: (label) => `Retirer ${label}`, showPasswordLabel: (label) => `Afficher ${label}`, hidePasswordLabel: (label) => `Masquer ${label}`, ratingValueLabel: (value, max) => `${value} sur ${max}`, ratingOptionLabel: (value, max) => `${value} sur ${max}`, validationSummary: "Vérifier les champs", validationSummaryAnnouncement: (title, count) => `${title}: ${count} erreurs` }}>
      <Link external href="https://example.com">Documentation</Link><Chip label="Local" onRemove={vi.fn()} /><PasswordField label="Mot de passe" /><Rating defaultValue={3} /><ValidationSummary announcementKey="submission" errors={[{ id: "name", message: "Saisir un nom" }]} />
    </AurelglyphControlCopyProvider>);
    expect(rendered.container.querySelector('[role="link"]')?.getAttribute("aria-description")).toBe("Lien externe");
    expect(rendered.container.querySelector('button[aria-label="Retirer Local"]')).not.toBeNull();
    expect(rendered.container.querySelector('button[aria-label="Afficher Mot de passe"]')).not.toBeNull();
    expect(rendered.container.querySelector('[role="adjustable"]')?.getAttribute("data-accessibility-value")).toContain("3 sur 5");
    expect(nativeMock.announce).toHaveBeenCalledExactlyOnceWith("Vérifier les champs: 1 erreurs");
  });

  it("renders all expansion icons from finite curated vector geometry", () => {
    const names = ["star", "eye", "eye-off", "external-link", "warning", "expand", "contract"] as const;
    const { container } = render(<>{names.map((name) => <Icon key={name} label={name} name={name} />)}</>);
    for (const name of names) {
      const icon = container.querySelector(`[role="image"][aria-label="${name}"]`)!;
      expect(icon.querySelectorAll('[data-rn="View"]').length).toBeGreaterThan(3);
      for (const segment of icon.querySelectorAll('[data-rn="View"]')) {
        const paint = styleOf(segment);
        expect(Number.isFinite(paint.width)).toBe(true);
        expect(Number.isFinite(paint.left)).toBe(true);
        expect(Number.isFinite(paint.top)).toBe(true);
      }
    }
  });

  it("defaults chips to selectable and gives keyboard focus a visible tokenized boundary", () => {
    const rendered = render(<Chip label="Local" />);
    const selection = rendered.container.querySelector('[role="checkbox"]') as HTMLButtonElement;
    expect(selection.getAttribute("aria-checked")).toBe("false");
    click(selection);
    expect(selection.getAttribute("aria-checked")).toBe("true");
    act(() => selection.focus());
    expect(styleOf(selection).borderColor).toBe(resolveAurelglyphTheme().colors.focus);
    rendered.rerender(<Chip label="Local" selectable={false} />);
    expect(rendered.container.querySelector('[role="checkbox"]')).toBeNull();
  });

  it("normalizes accordion IDs to item order and uses one authoritative current step", () => {
    const items = [{ content: <Text>First panel</Text>, id: "first", title: "First" }, { content: <Text>Second panel</Text>, id: "second", title: "Second" }];
    const rendered = render(<Accordion defaultValue={["second", "first"]} items={items} />);
    expect(rendered.container.textContent).toContain("First panel");
    expect(rendered.container.textContent).not.toContain("Second panel");
    rendered.rerender(<Stepper currentId="review" items={[{ id: "first", label: "First", status: "current" }, { id: "review", label: "Review", status: "upcoming" }, { id: "last", label: "Last", status: "current" }]} />);
    expect(rendered.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
    expect(rendered.container.querySelector('[aria-label="Review, step 2 of 3, Current"]')).not.toBeNull();
    expect(rendered.container.querySelector('[aria-label="First, step 1 of 3, Upcoming"]')).not.toBeNull();
    expect(rendered.container.querySelector('[aria-label="Last, step 3 of 3, Upcoming"]')).not.toBeNull();
    rendered.rerender(<Stepper currentId="review" items={[{ id: "first", label: "First", status: "current" }, { id: "review", label: "Review", status: "error" }, { id: "last", label: "Last" }]} />);
    const currentError = rendered.container.querySelector('[aria-label="Review, step 2 of 3, Current, Needs attention"]')!;
    expect(currentError.getAttribute("aria-selected")).toBe("true");
    expect(currentError.textContent).toContain("Current, Needs attention");
    expect(styleOf(Array.from(currentError.querySelectorAll('[data-rn="Text"]')).find((text) => text.textContent === "Review")!).fontWeight).toBe("600");
    expect(rendered.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
  });

  it("normalizes rating maxima safely and fills selected stars independently of color", () => {
    const rendered = render(<Rating max={0} value={99} />);
    const ratingValue = () => JSON.parse(rendered.container.querySelector('[role="adjustable"]')!.getAttribute("data-accessibility-value")!);
    expect(ratingValue()).toMatchObject({ max: 1, now: 1 });
    rendered.rerender(<Rating max={-4} />);
    expect(ratingValue().max).toBe(1);
    rendered.rerender(<Rating max={Number.NaN} />);
    expect(ratingValue().max).toBe(5);
    rendered.rerender(<Rating max={100} value={50} />);
    expect(ratingValue()).toMatchObject({ max: 20, now: 20 });
    rendered.rerender(<Rating value={3} />);
    const filled = rendered.container.querySelector('button[aria-label="1 of 5"]')!;
    const outline = rendered.container.querySelector('button[aria-label="5 of 5"]')!;
    expect(filled.querySelectorAll('[data-rn="View"]').length).toBeGreaterThan(outline.querySelectorAll('[data-rn="View"]').length);
    expect(Array.from(filled.querySelectorAll('[data-rn="View"]')).some((node) => styleOf(node).height === 0.7)).toBe(true);
  });
});

vi.mock("react-native-safe-area-context", async () => {
  const React = await import("react");
  return {
    SafeAreaView: ({ children, style, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
      "div",
      { ...props, "data-rn": "SafeAreaView", "data-style": JSON.stringify(style) },
      children
    )
  };
});

import {
  Button,
  ButtonGroup,
  Container,
  Divider,
  Grid,
  IconButton,
  Progress,
  Spinner
} from "./primitives.js";
import { AurelglyphControlCopyProvider } from "./control-copy.js";
import { Combobox, CommandPalette, Menu, Select } from "./selection.js";
import { Dialog, Drawer, MoreInformation, Popover, Tooltip } from "./overlays.js";
import { FileUpload, NumberField, RadioGroup, SearchField, Slider, Switch as AurelglyphSwitch, TextField } from "./forms.js";
import { Pagination, SegmentedControl, TabBar, Tabs } from "./navigation.js";
import { Icon } from "./icons.js";
import { Accordion, Chip, ExpandableSection, InputGroup, Link, PasswordField, Rating, Stepper, ValidationSummary } from "./components-expansion.js";
import { AurelglyphOverlayHost } from "./overlay-host.js";
import { AurelglyphProvider, resolveAurelglyphTheme } from "./theme.js";
import { Modal, Text } from "react-native";

type Rendered = { container: HTMLDivElement; rerender: (ui: ReactElement) => void; root: Root };
const mounted: Rendered[] = [];

function render(ui: ReactElement): Rendered {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(ui));
  const rendered = {
    container,
    rerender: (next: ReactElement) => act(() => root.render(next)),
    root
  };
  mounted.push(rendered);
  return rendered;
}

function click(element: Element): void {
  act(() => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

function type(input: HTMLInputElement, value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function styleOf(element: Element | null | undefined): Record<string, unknown> {
  return JSON.parse(element?.getAttribute("data-style") ?? "{}");
}

afterEach(() => {
  while (mounted.length) {
    const item = mounted.pop()!;
    act(() => item.root.unmount());
    item.container.remove();
  }
  nativeMock.anchor = { height: 44, width: 44, x: 24, y: 24 };
  nativeMock.defaultLayout = { height: 44, width: 100, x: 0, y: 0 };
  nativeMock.host = { height: 844, width: 390, x: 0, y: 0 };
  nativeMock.layouts = {};
  nativeMock.tooltip = { height: 40, width: 160, x: 0, y: 0 };
  nativeMock.window = { fontScale: 1, height: 844, scale: 3, width: 390 };
  nativeMock.announce.mockClear();
  nativeMock.accessibilityFocus.mockClear();
  nativeMock.passwordSelection.mockClear();
  nativeMock.prepareSecureInput.mockClear();
  nativeMock.registerSecureInput.mockClear();
  nativeMock.unregisterSecureInput.mockClear();
  nativeMock.platform = "ios";
  nativeMock.openURL.mockClear();
  vi.restoreAllMocks();
});

describe("React Native rendered interaction contracts", () => {
  it("keeps modal headings, body, close action, and controls independently accessible", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog description="Calibrated controls" onOpenChange={onOpenChange} open title="System settings">
        <TextField label="System name" value="Workbench" />
      </Dialog>
    );

    const dialogTitle = container.querySelector('[role="dialog"]');
    expect(container.querySelector('[data-rn="Modal"]')?.getAttribute("data-animation")).toBe("none");
    expect(dialogTitle?.getAttribute("data-rn")).toBe("Text");
    expect(dialogTitle?.getAttribute("data-accessible")).toBe("true");
    expect(dialogTitle?.textContent).toBe("System settings");
    expect(container.querySelector('[data-accessible="false"][role="dialog"]')).toBeNull();
    expect(container.textContent).toContain("Calibrated controls");
    expect(container.querySelector('input[aria-label="System name"]')).not.toBeNull();
    click(container.querySelector('button[aria-label="Close System settings"]')!);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "close" });
  });

  it("reduces dialog elevation only for the quiet appearance", () => {
    const atelier = render(<Dialog onOpenChange={vi.fn()} open title="Atelier dialog"><Text>Body</Text></Dialog>);
    const quiet = render(
      <AurelglyphProvider appearance="quiet" overlayHost={false}>
        <Dialog onOpenChange={vi.fn()} open title="Quiet dialog"><Text>Body</Text></Dialog>
      </AurelglyphProvider>
    );
    const dialogPaint = (container: HTMLDivElement) =>
      Array.from(container.querySelectorAll('[data-rn="View"]'))
        .map(styleOf)
        .find((style) => style.maxHeight === "100%" && style.width === "100%");

    expect(dialogPaint(atelier.container)).toMatchObject({
      shadowOffset: { height: 18, width: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 40
    });
    expect(dialogPaint(atelier.container)).not.toHaveProperty("elevation");
    expect(dialogPaint(quiet.container)).toMatchObject({
      elevation: 6,
      shadowOffset: { height: 8, width: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 20
    });
  });

  it("preserves dialog descendants through drawer, popover, and menu specializations", () => {
    const onOpenChange = vi.fn();
    const rendered = render(
      <Menu accessibilityLabel="System actions" items={[{ label: "Sync", value: "sync" }]} onOpenChange={onOpenChange} open />
    );
    expect(rendered.container.querySelector('[role="dialog"]')?.getAttribute("data-accessible")).toBe("true");
    expect(rendered.container.querySelector('[role="menu"]')).toBeNull();
    expect(rendered.container.querySelector('button[aria-label="System actions, Sync"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-accessible="false"][role]')).toBeNull();

    rendered.rerender(<Drawer onOpenChange={onOpenChange} open title="Drawer"><Button>Apply</Button></Drawer>);
    expect(Array.from(rendered.container.querySelectorAll("button")).some((button) => button.textContent === "Apply")).toBe(true);

    rendered.rerender(<Popover accessibilityLabel="Details" onOpenChange={onOpenChange} open><Button>Inspect</Button></Popover>);
    expect(Array.from(rendered.container.querySelectorAll("button")).some((button) => button.textContent === "Inspect")).toBe(true);

    rendered.rerender(
      <Dialog onOpenChange={onOpenChange} open title="Nested overlay">
        <Tooltip label="Nested tooltip" visible><IconButton icon={<Text>i</Text>} label="Nested information" /></Tooltip>
      </Dialog>
    );
    const nestedTooltip = rendered.container.querySelector('[role="tooltip"]');
    expect(nestedTooltip?.closest('[data-rn="Modal"]')).not.toBeNull();
    expect(rendered.container.querySelectorAll('[data-rn="Modal"]')).toHaveLength(1);
  });

  it("keeps optional information behind a compact accessible popover trigger", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <MoreInformation label="Signal information" onOpenChange={onOpenChange}>
        <Text>Supporting context</Text>
      </MoreInformation>
    );
    const trigger = container.querySelector('button[aria-label="Signal information"]')!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(JSON.parse(trigger.getAttribute("data-style")!).minHeight).toBe(44);
    expect(container.querySelector('[data-rn="Modal"]')).toBeNull();

    click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(container.querySelector('[data-rn="Modal"]')?.textContent).toContain("Supporting context");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    click(container.querySelector('button[aria-label="Close Signal information"]')!);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("augments the real tooltip trigger without nesting another control", () => {
    const originalLongPress = vi.fn();
    const { container } = render(
      <Tooltip label="Inspect signal">
        <IconButton icon={<Text>i</Text>} label="Information" onLongPress={originalLongPress} />
      </Tooltip>
    );

    expect(container.querySelectorAll("button")).toHaveLength(1);
    const trigger = container.querySelector('button[aria-label="Information"]')!;
    expect(trigger.getAttribute("aria-description")).toContain("Inspect signal");
    act(() => trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })));
    expect(originalLongPress).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="tooltip"]')?.textContent).toBe("Inspect signal");
  });

  it("announces unsupported form states through native labels and hints", () => {
    const { container } = render(
      <TextField error="Name is unavailable" invalid label="Name" readOnly required value="Ajit" />
    );
    const input = container.querySelector("input")!;
    expect(input.getAttribute("aria-label")).toBe("Name, required, invalid, read only");
    expect(input.getAttribute("aria-description")).toContain("Name is unavailable");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.disabled).toBe(true);
  });

  it("associates switch descriptions and read-only state with the native control", () => {
    const { container } = render(
      <AurelglyphSwitch
        description="Keeps release telemetry on this device"
        label="Release telemetry"
        readOnly
        value
      />
    );
    const control = container.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(control.getAttribute("aria-label")).toBe("Release telemetry");
    expect(control.getAttribute("aria-description")).toBe("Keeps release telemetry on this device. read only");
    expect(control.disabled).toBe(true);
  });

  it("localizes generated native control copy from one provider", () => {
    const { container } = render(
      <AurelglyphControlCopyProvider
        value={{
          clear: "Effacer",
          clearSearch: "Effacer la recherche",
          close: "Fermer",
          closeLabel: (title) => `Fermer ${title}`,
          filterOptions: "Filtrer les options",
          invalid: "non valide",
          readOnly: "lecture seule",
          required: "obligatoire"
        }}
      >
        <Dialog onOpenChange={vi.fn()} open title="Réglages"><Text>Contenu</Text></Dialog>
        <SearchField defaultValue="systèmes" />
        <Select invalid label="Mode" options={[{ label: "Calme", value: "quiet" }]} readOnly required />
      </AurelglyphControlCopyProvider>
    );

    const close = container.querySelector('button[aria-label="Fermer Réglages"]');
    expect(close?.textContent).toBe("Fermer");
    expect(container.querySelector('button[aria-label="Effacer la recherche"]')?.textContent).toBe("Effacer");
    const select = container.querySelector('[role="combobox"]')!;
    expect(select.getAttribute("aria-label")).toBe("Mode, obligatoire, non valide, lecture seule");

    const rendered = render(
      <AurelglyphControlCopyProvider value={{ filterOptions: "Filtrer les options" }}>
        <Select label="Mode" options={[{ label: "Calme", value: "quiet" }]} />
      </AurelglyphControlCopyProvider>
    );
    click(rendered.container.querySelector('[role="combobox"]')!);
    expect(rendered.container.querySelector("input")?.getAttribute("placeholder")).toBe("Filtrer les options");
  });

  it("announces invalid helper text even when no explicit error is supplied", () => {
    const { container } = render(
      <TextField helperText="Use a unique system name" invalid label="Name" value="Ajit" />
    );
    const helper = Array.from(container.querySelectorAll('[data-rn="Text"]'))
      .find((element) => element.textContent === "Use a unique system name");
    expect(helper?.getAttribute("data-live-region")).toBe("polite");
    expect(container.querySelector("input")?.getAttribute("aria-description")).toContain("Use a unique system name");
  });

  it("resets uncontrolled and controlled command queries across external close", () => {
    const items = [{ id: "sync", label: "Sync systems", onSelect: vi.fn() }];
    const rendered = render(<CommandPalette items={items} onOpenChange={vi.fn()} open />);
    expect(rendered.container.querySelector("input")?.getAttribute("data-auto-focus")).toBe("true");
    expect(document.activeElement).toBe(rendered.container.querySelector("input"));
    expect(rendered.container.querySelector('button[aria-label="Command palette, Sync systems"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-accessible="false"][role]')).toBeNull();
    type(rendered.container.querySelector("input")!, "sync");
    expect(rendered.container.querySelector("input")?.value).toBe("sync");
    rendered.rerender(<CommandPalette items={items} onOpenChange={vi.fn()} open={false} />);
    rendered.rerender(<CommandPalette items={items} onOpenChange={vi.fn()} open />);
    expect(rendered.container.querySelector("input")?.value).toBe("");

    function Controlled({ open }: { open: boolean }): ReactElement {
      const [query, setQuery] = useState("systems");
      return <CommandPalette items={items} onOpenChange={vi.fn()} onQueryChange={setQuery} open={open} query={query} />;
    }
    rendered.rerender(<Controlled open />);
    rendered.rerender(<Controlled open={false} />);
    rendered.rerender(<Controlled open />);
    expect(rendered.container.querySelector("input")?.value).toBe("");
  });

  it("closes an open combobox immediately when it becomes unavailable", () => {
    const options = [{ label: "Quiet", value: "quiet" }];
    const rendered = render(<Combobox label="Mode" options={options} />);
    click(rendered.container.querySelector('[role="combobox"]')!);
    expect(rendered.container.querySelector('[data-rn="Modal"]')).not.toBeNull();
    expect(rendered.container.querySelector('button[aria-label="Mode, Quiet"]')).not.toBeNull();
    expect(rendered.container.querySelector("input")?.getAttribute("data-auto-focus")).toBe("true");
    expect(document.activeElement).toBe(rendered.container.querySelector("input"));
    expect(rendered.container.querySelector('[data-accessible="false"][role]')).toBeNull();
    const unfocused = render(<Combobox autoFocusSearch={false} label="Mode" options={options} />);
    click(unfocused.container.querySelector('[role="combobox"]')!);
    expect(unfocused.container.querySelector("input")?.getAttribute("data-auto-focus")).toBe("false");
    expect(document.activeElement).not.toBe(unfocused.container.querySelector("input"));
    rendered.rerender(<Combobox disabled label="Mode" options={options} />);
    expect(rendered.container.querySelector('[data-rn="Modal"]')).toBeNull();
    expect(rendered.container.querySelector('[role="combobox"]')?.getAttribute("aria-disabled")).toBe("true");
  });

  it("exposes the current combobox selection through its native accessibility value", () => {
    const onValueChange = vi.fn();
    const options = [
      { label: "Stable", value: "stable" },
      { label: "Beta", value: "beta" }
    ];
    const empty = render(<Select label="Release channel" options={options} />);
    expect(JSON.parse(empty.container.querySelector('[role="combobox"]')?.getAttribute("data-accessibility-value") ?? "{}"))
      .toEqual({ text: "Select an option" });
    empty.rerender(<Select label="Release channel" loading options={options} />);
    expect(JSON.parse(empty.container.querySelector('[role="combobox"]')?.getAttribute("data-accessibility-value") ?? "{}"))
      .toEqual({ text: "Loading…" });

    const { container } = render(
      <Select defaultValue="stable" label="Release channel" onValueChange={onValueChange} options={options} />
    );

    expect(JSON.parse(container.querySelector('[role="combobox"]')?.getAttribute("data-accessibility-value") ?? "{}"))
      .toEqual({ text: "Stable" });
    click(container.querySelector('[role="combobox"]')!);
    expect(document.activeElement).not.toBe(container.querySelector("input"));
    click(container.querySelector('button[aria-label="Release channel, Beta"]')!);
    expect(onValueChange).toHaveBeenLastCalledWith("beta");
    expect(JSON.parse(container.querySelector('[role="combobox"]')?.getAttribute("data-accessibility-value") ?? "{}"))
      .toEqual({ text: "Beta" });

    const focusedSelect = render(<Select autoFocusSearch label="Focused channel" options={options} />);
    click(focusedSelect.container.querySelector('[role="combobox"]')!);
    expect(document.activeElement).toBe(focusedSelect.container.querySelector("input"));
  });

  it("composes NumberField blur with internal numeric commit", () => {
    const onBlur = vi.fn();
    const onValueChange = vi.fn();
    const { container } = render(<NumberField defaultValue={2} label="Replicas" onBlur={onBlur} onValueChange={onValueChange} />);
    const input = container.querySelector("input")!;
    type(input, "4");
    act(() => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("forwards FileUpload root props and disables removal with the field", () => {
    const onRemoveFile = vi.fn();
    const { container } = render(
      <FileUpload
        disabled
        files={[{ name: "tokens.json" }]}
        label="Token source"
        onRemoveFile={onRemoveFile}
        onRequestFiles={vi.fn()}
        testID="upload-root"
      />
    );
    expect(container.querySelector('[data-testid="upload-root"]')).not.toBeNull();
    const remove = container.querySelector('button[aria-label="Remove tokens.json"]') as HTMLButtonElement;
    expect(remove.disabled).toBe(true);
    click(remove);
    expect(onRemoveFile).not.toHaveBeenCalled();
  });

  it("forwards Slider props and exposes a 44pt adjustable responder target", () => {
    const onValueChange = vi.fn();
    const { container } = render(<Slider label="Intensity" max={Number.POSITIVE_INFINITY} min={Number.NaN} onValueChange={onValueChange} testID="slider-root" value={Number.POSITIVE_INFINITY} />);
    expect(container.querySelector('[data-testid="slider-root"]')).not.toBeNull();
    const target = container.querySelector('[role="adjustable"]')!;
    expect(JSON.parse(target.getAttribute("data-style")!).minHeight).toBe(44);
    expect(JSON.parse(target.getAttribute("data-accessibility-value")!)).toMatchObject({ max: 100, min: 0, now: 0 });
    act(() => target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(onValueChange).toHaveBeenCalledWith(50);
  });

  it("implements TabBar as tab navigation rather than a radio group alias", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <TabBar items={[{ id: "work", label: "Work" }, { id: "systems", label: "Systems" }]} onValueChange={onValueChange} />
    );
    expect(container.querySelector('[role="navigation"]')).toBeNull();
    expect(container.querySelector('[role="radiogroup"]')).toBeNull();
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute("aria-label")).toBe("Primary navigation, Work");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
    click(tabs[1]!);
    expect(onValueChange).toHaveBeenCalledWith("systems");
  });

  it("announces the same clamped Progress value that it renders", () => {
    const { container } = render(<Progress max={100} min={0} showValue value={150} />);
    const progress = container.querySelector('[role="progressbar"]')!;
    expect(JSON.parse(progress.getAttribute("data-accessibility-value")!)).toEqual({ max: 100, min: 0, now: 100, text: "100%" });
    expect(container.textContent).toContain("100%");
  });

  it("provides native search semantics and a working clear affordance", () => {
    const onChangeText = vi.fn();
    const onClear = vi.fn();
    const { container } = render(<SearchField defaultValue="systems" onChangeText={onChangeText} onClear={onClear} />);
    expect(container.querySelector('[role="searchbox"]')?.getAttribute("placeholder")).toBe("Search");
    click(container.querySelector('button[aria-label="Clear search"]')!);
    expect(onChangeText).toHaveBeenLastCalledWith("");
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("uses canonical group, separator, spinner, and xl container contracts", () => {
    const { container } = render(
      <Container size="xl" testID="xl">
        <ButtonGroup label="Actions"><Button>Save</Button></ButtonGroup>
        <Divider />
        <Spinner size="lg" />
        <Icon label="Information" name="info" />
      </Container>
    );
    expect(container.querySelector('[role="toolbar"]')).toBeNull();
    expect(container.querySelector("button")?.getAttribute("aria-description")).toContain("Actions");
    expect(container.querySelector('[role="separator"]')).not.toBeNull();
    expect(container.querySelector('[data-rn="ActivityIndicator"]')?.getAttribute("data-size")).toBe("32");
    expect(container.querySelector('[role="image"]')?.getAttribute("aria-label")).toBe("Information");
    expect(JSON.parse(container.querySelector('[data-testid="xl"]')?.getAttribute("data-style") ?? "{}").maxWidth).toBe(1320);
  });

  it("keeps native structural wrappers transparent while naming every reachable control", () => {
    const { container } = render(
      <>
        <Tabs
          items={[{ content: <Text>Workbench panel</Text>, id: "workbench", label: "Workbench" }]}
          label="Workspace tabs"
        />
        <SegmentedControl items={[{ label: "Quiet", value: "quiet" }]} label="Operating mode" />
        <Pagination label="Results" onPageChange={vi.fn()} page={1} pageCount={2} />
        <RadioGroup label="Theme" options={[{ label: "Royal purple", value: "purple" }]} />
        <ButtonGroup label="Editing actions"><Button>Save</Button></ButtonGroup>
      </>
    );

    expect(container.querySelector('[data-accessible="false"][role]')).toBeNull();
    expect(container.querySelector('button[aria-label="Workspace tabs, Workbench"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Quiet, Operating mode"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Results, page 1"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Royal purple, Theme"]')).not.toBeNull();
    expect(Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Save")?.getAttribute("aria-description")).toContain("Editing actions");
  });

  it("bounds dialogs and drawers in compact portrait and landscape while forwarding modal policy", () => {
    nativeMock.window = { fontScale: 2, height: 568, scale: 2, width: 320 };
    const rendered = render(
      <Dialog
        description="A deliberately long description that must remain reachable when text is enlarged."
        footer={<><Button>Save calibrated settings</Button><Button variant="secondary">Cancel operation</Button></>}
        onOpenChange={vi.fn()}
        open
        statusBarTranslucent
        supportedOrientations={["landscape-left"]}
        title="Responsive system settings"
        transparent={false}
      >
        <Text>Scrollable dialog body</Text>
      </Dialog>
    );

    const modal = rendered.container.querySelector('[data-rn="Modal"]');
    const title = rendered.container.querySelector('[role="dialog"]');
    const panel = title?.parentElement?.parentElement?.parentElement;
    const body = panel?.querySelector('[data-rn="ScrollView"]');
    const footer = panel?.lastElementChild;
    expect(modal?.getAttribute("data-status-bar-translucent")).toBe("true");
    expect(modal?.getAttribute("data-supported-orientations")).toBe("landscape-left");
    expect(modal?.getAttribute("data-transparent")).toBe("false");
    expect(rendered.container.querySelector('[data-rn="SafeAreaView"]')).not.toBeNull();
    expect(rendered.container.querySelector('[data-rn="KeyboardAvoidingView"]')?.getAttribute("data-behavior")).toBe("padding");
    expect(styleOf(panel)).toMatchObject({ flexShrink: 1, maxHeight: "100%", width: "100%" });
    expect(styleOf(panel?.parentElement).padding).toBe(16);
    expect(styleOf(body)).toMatchObject({ flexShrink: 1, minHeight: 0 });
    expect(styleOf(footer).flexWrap).toBe("wrap");

    nativeMock.window = { fontScale: 2, height: 320, scale: 2, width: 568 };
    rendered.rerender(<Drawer onOpenChange={vi.fn()} open side="end" title="Landscape drawer"><Text>Reachable drawer body</Text></Drawer>);
    const drawerTitle = rendered.container.querySelector('[role="dialog"]');
    const drawerPanel = drawerTitle?.parentElement?.parentElement?.parentElement;
    expect(styleOf(drawerPanel)).toMatchObject({ flexShrink: 1, height: "100%", maxHeight: "100%", width: "86%" });
    expect(styleOf(drawerPanel?.parentElement).padding).toBe(0);
    expect(styleOf(drawerPanel?.querySelector('[data-rn="ScrollView"]'))).toMatchObject({ flexShrink: 1, minHeight: 0 });
  });

  it("keeps menu, combobox, and command results inside bounded shrinking scroll regions", () => {
    const items = Array.from({ length: 40 }, (_, index) => ({ label: `Action ${index + 1}`, value: String(index + 1) }));
    const rendered = render(<Menu accessibilityLabel="Actions" items={items} onOpenChange={vi.fn()} open />);
    const menuList = rendered.container.querySelector('[data-rn="ScrollView"]');
    expect(styleOf(menuList)).toMatchObject({ flexShrink: 1, minHeight: 0 });

    rendered.rerender(
      <CommandPalette
        items={items.map((item) => ({ id: item.value, label: item.label, onSelect: vi.fn() }))}
        onOpenChange={vi.fn()}
        open
      />
    );
    const commandList = rendered.container.querySelector('[data-rn="ScrollView"]');
    expect(styleOf(commandList)).toMatchObject({ flexShrink: 1, minHeight: 0 });
    expect(commandList?.getAttribute("data-keyboard-should-persist-taps")).toBe("always");
    const commandTitle = rendered.container.querySelector('[role="dialog"]');
    expect(styleOf(commandTitle?.parentElement?.parentElement?.parentElement).maxHeight).toBe("82%");

    rendered.rerender(<Combobox label="Operating mode" options={items} />);
    click(rendered.container.querySelector('[role="combobox"]')!);
    const comboList = rendered.container.querySelector('[data-rn="ScrollView"]');
    expect(styleOf(comboList)).toMatchObject({ flexShrink: 1, minHeight: 0 });
    expect(comboList?.getAttribute("data-keyboard-should-persist-taps")).toBe("always");
  });

  it("preserves compact visuals with 44pt touch areas and full-size navigation targets", () => {
    const { container } = render(
      <>
        <Button accessibilityLabel="Compact action" size="sm">Compact</Button>
        <IconButton icon={<Text>i</Text>} label="Compact icon" size="sm" />
        <ButtonGroup attached label="Attached actions">
          <Button accessibilityLabel="Attached compact action" size="sm">One</Button>
          <Button size="sm">Two</Button>
        </ButtonGroup>
        <SegmentedControl items={[{ label: "Quiet", value: "quiet" }, { label: "Active", value: "active" }]} label="Mode" />
        <Pagination label="Results" onPageChange={vi.fn()} page={1} pageCount={2} />
      </>
    );

    for (const label of ["Compact action", "Compact icon", "Results, previous page", "Results, next page"]) {
      const control = container.querySelector(`button[aria-label="${label}"]`);
      expect(styleOf(control)).toMatchObject({ minHeight: 44, minWidth: 44 });
      expect(control?.hasAttribute("data-hit-slop")).toBe(false);
      expect(styleOf(control?.querySelector('[data-rn="View"]'))).toMatchObject({ bottom: 4, left: 4, right: 4, top: 4 });
    }
    const attached = container.querySelector('button[aria-label="Attached compact action"]');
    expect(styleOf(attached)).toMatchObject({ minHeight: 44, minWidth: 44 });
    expect(attached?.hasAttribute("data-hit-slop")).toBe(false);
    expect(styleOf(attached?.querySelector('[data-rn="View"]'))).toMatchObject({ bottom: 4, left: 0, right: 0, top: 4 });
    expect(styleOf(container.querySelector('button[aria-label="Quiet, Mode"]'))).toMatchObject({ minHeight: 44, minWidth: 44 });
    expect(styleOf(container.querySelector('button[aria-label="Results, page 1"]'))).toMatchObject({ minHeight: 44, minWidth: 44 });
  });

  it("resolves responsive Grid columns from its measured split-container width", () => {
    nativeMock.window = { fontScale: 1, height: 768, scale: 2, width: 1024 };
    nativeMock.layouts["split-grid"] = { height: 568, width: 320, x: 0, y: 0 };
    const onLayout = vi.fn();
    const grid = () => (
      <Grid
        columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
        minItemWidth={240}
        onLayout={onLayout}
        testID="split-grid"
      >
        <Text>One</Text><Text>Two</Text><Text>Three</Text><Text>Four</Text>
      </Grid>
    );
    const rendered = render(grid());
    const root = rendered.container.querySelector('[data-testid="split-grid"]')!;
    expect(styleOf(root.children[0]).flexBasis).toBe("100%");
    expect(onLayout).toHaveBeenCalled();

    nativeMock.layouts["split-grid"] = { height: 320, width: 568, x: 0, y: 0 };
    rendered.rerender(grid());
    expect(styleOf(root.children[0]).flexBasis).toBe("50%");
  });

  it("wraps or scrolls long controls without collapsing large-text labels", () => {
    nativeMock.window = { fontScale: 2, height: 568, scale: 2, width: 320 };
    const { container } = render(
      <>
        <ButtonGroup label="Long actions" testID="long-actions">
          <Button accessibilityLabel="First long action">Save all calibrated system settings</Button>
          <Button accessibilityLabel="Second long action">Cancel the current automation operation</Button>
        </ButtonGroup>
        <SegmentedControl
          items={[
            { label: "Drafting workspace overview", value: "drafting" },
            { label: "Infrastructure calibration history", value: "history" },
            { label: "Archived automation systems", value: "archive" }
          ]}
          label="Long mode labels"
          testID="long-segments"
        />
        <TabBar
          items={Array.from({ length: 7 }, (_, index) => ({ id: String(index), label: `Long destination ${index + 1}` }))}
          testID="long-tab-bar"
        />
      </>
    );

    expect(styleOf(container.querySelector('[data-testid="long-actions"]')).flexWrap).toBe("wrap");
    expect(styleOf(container.querySelector('button[aria-label="First long action"]'))).toMatchObject({ flexShrink: 1, maxWidth: "100%", minWidth: 44 });
    expect(styleOf(container.querySelector('button[aria-label="First long action"] span'))).toMatchObject({ flexShrink: 1, minWidth: 0, textAlign: "center" });
    expect(styleOf(container.querySelector('[data-testid="long-segments"]')).flexWrap).toBe("wrap");
    expect(styleOf(container.querySelector('button[aria-label="Drafting workspace overview, Long mode labels"]'))).toMatchObject({ flexBasis: 192, minHeight: 44, minWidth: 44 });
    const tabScroller = container.querySelector('[data-testid="long-tab-bar"] [data-rn="ScrollView"]');
    expect(tabScroller?.getAttribute("data-horizontal")).toBe("true");
    expect(JSON.parse(tabScroller?.getAttribute("data-content-style") ?? "{}").flexGrow).toBe(1);
    expect(styleOf(container.querySelector('button[aria-label="Primary navigation, Long destination 1"]'))).toMatchObject({ flexBasis: 128, flexShrink: 0, minHeight: 56, minWidth: 128 });
  });

  it("portals, remeasures, flips, and clamps tooltips without blocking underlying controls", async () => {
    nativeMock.window = { fontScale: 2, height: 568, scale: 2, width: 320 };
    nativeMock.host = { height: 524, width: 304, x: 8, y: 24 };
    nativeMock.anchor = { height: 44, width: 20, x: 292, y: 28 };
    nativeMock.tooltip = { height: 40, width: 160, x: 0, y: 0 };
    const onUnderlyingPress = vi.fn();
    const tooltip = (overlayInsets: { bottom: number; left: number; right: number; top: number }) => (
      <AurelglyphProvider overlayInsets={overlayInsets}>
        <Tooltip label="A long calibrated tooltip" placement="right" visible>
          <IconButton icon={<Text>i</Text>} label="Edge information" />
        </Tooltip>
        <Button accessibilityLabel="Underlying action" onPress={onUnderlyingPress}>Underlying action</Button>
      </AurelglyphProvider>
    );
    const rendered = render(tooltip({ bottom: 20, left: 8, right: 8, top: 24 }));
    let tip = rendered.container.querySelector('[role="tooltip"]');
    const portraitHost = tip?.closest('[data-testid="aurelglyph-overlay-host"]');
    expect(portraitHost).not.toBeNull();
    expect(styleOf(portraitHost?.parentElement)).toMatchObject({
      elevation: 1000,
      paddingBottom: 20,
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 24,
      zIndex: 1000
    });
    expect(tip?.closest('[data-rn="Modal"]')).toBeNull();
    expect(styleOf(tip)).toMatchObject({ left: 116, opacity: 1, top: 8 });
    click(rendered.container.querySelector('button[aria-label="Underlying action"]')!);
    expect(onUnderlyingPress).toHaveBeenCalledOnce();

    nativeMock.anchor = { height: 44, width: 20, x: 20, y: 100 };
    await act(async () => new Promise((resolve) => setTimeout(resolve, 120)));
    tip = rendered.container.querySelector('[role="tooltip"]');
    expect(styleOf(tip)).toMatchObject({ left: 40, opacity: 1, top: 78 });

    nativeMock.window = { fontScale: 2, height: 320, scale: 2, width: 568 };
    nativeMock.host = { height: 308, width: 528, x: 20, y: 0 };
    nativeMock.anchor = { height: 44, width: 20, x: 520, y: 260 };
    rendered.rerender(tooltip({ bottom: 12, left: 20, right: 20, top: 0 }));
    tip = rendered.container.querySelector('[role="tooltip"]');
    expect(styleOf(tip)).toMatchObject({ left: 332, opacity: 1, top: 260 });
  });

  it("supports explicit tooltip hosts inside consumer-owned native modals", () => {
    const rendered = render(
      <AurelglyphProvider>
        <Modal visible>
          <AurelglyphOverlayHost insets={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <Tooltip label="Modal signal" visible>
              <IconButton icon={<Text>i</Text>} label="Modal information" />
            </Tooltip>
          </AurelglyphOverlayHost>
        </Modal>
      </AurelglyphProvider>
    );

    const tip = rendered.container.querySelector('[role="tooltip"]');
    expect(tip?.closest('[data-rn="Modal"]')).not.toBeNull();
    expect(rendered.container.querySelectorAll('[data-testid="aurelglyph-overlay-host"]')).toHaveLength(2);

    rendered.rerender(
      <AurelglyphProvider overlayHost={false}>
        <Text>Host supplied by the application</Text>
      </AurelglyphProvider>
    );
    expect(rendered.container.querySelector('[data-testid="aurelglyph-overlay-host"]')).toBeNull();
  });

  it("keeps consumer button paint on the compact visual control", () => {
    const { container } = render(
      <Button
        accessibilityLabel="Custom compact action"
        size="sm"
        style={{
          backgroundColor: "tomato",
          borderColor: "navy",
          borderRadius: 7,
          borderWidth: 3,
          elevation: 6,
          marginTop: 12,
          shadowColor: "black",
          shadowOpacity: 0.4
        }}
      >
        Apply
      </Button>
    );
    const target = container.querySelector('button[aria-label="Custom compact action"]');
    const backdrop = target?.querySelector('[data-rn="View"]');
    expect(styleOf(target)).toMatchObject({ elevation: 6, marginTop: 12, minHeight: 44, minWidth: 44 });
    expect(styleOf(target)).not.toHaveProperty("backgroundColor", "tomato");
    expect(styleOf(backdrop)).toMatchObject({
      backgroundColor: "tomato",
      borderColor: "navy",
      borderRadius: 7,
      borderWidth: 3,
      bottom: 4,
      left: 4,
      right: 4,
      shadowColor: "black",
      shadowOpacity: 0.4,
      top: 4
    });
    expect(styleOf(backdrop)).not.toHaveProperty("elevation");
  });

  it("uses the foreground token for light-mode interactive labels on muted surfaces", () => {
    const light = resolveAurelglyphTheme("light");
    const { container } = render(
      <AurelglyphProvider mode="light">
        <Tabs
          items={[
            { content: <Text>Workbench panel</Text>, id: "workbench", label: "Workbench" },
            { content: <Text>Systems panel</Text>, id: "systems", label: "Systems" }
          ]}
          label="Workspace tabs"
          tabListStyle={{ backgroundColor: light.colors.surfaceMuted }}
        />
        <SegmentedControl
          items={[
            { label: "Quiet", value: "quiet" },
            { label: "Active", value: "active" }
          ]}
          label="Operating mode"
        />
        <TabBar
          items={[
            { id: "work", label: "Work" },
            { id: "systems", label: "Systems" }
          ]}
          label="Primary navigation"
        />
        <Button accessibilityLabel="Dismiss" variant="ghost">Dismiss</Button>
        <Dialog onOpenChange={vi.fn()} open title="System settings">
          <Text>Dialog body</Text>
        </Dialog>
        <Combobox helperText="Choose one operating mode." label="Mode" options={[]} />
      </AurelglyphProvider>
    );

    const inactiveTab = container.querySelector('button[aria-label="Workspace tabs, Systems"]');
    const inactiveSegment = container.querySelector('button[aria-label="Active, Operating mode"]');
    const inactiveTabBarItem = container.querySelector('button[aria-label="Primary navigation, Systems"]');
    const ghost = container.querySelector('button[aria-label="Dismiss"]');
    const close = container.querySelector('button[aria-label="Close System settings"]');
    const inactiveTabStyle = JSON.parse(inactiveTab?.querySelector("span")?.getAttribute("data-style") ?? "{}");
    const inactiveSegmentStyle = JSON.parse(inactiveSegment?.querySelector("span")?.getAttribute("data-style") ?? "{}");
    const inactiveTabBarStyle = JSON.parse(inactiveTabBarItem?.querySelector("span")?.getAttribute("data-style") ?? "{}");
    const ghostStyle = JSON.parse(ghost?.querySelector("span")?.getAttribute("data-style") ?? "{}");
    const closeStyle = JSON.parse(close?.querySelector("span")?.getAttribute("data-style") ?? "{}");
    const tabSurfaceStyle = JSON.parse(inactiveTab?.parentElement?.getAttribute("data-style") ?? "{}");
    const segmentedSurfaceStyle = JSON.parse(inactiveSegment?.parentElement?.getAttribute("data-style") ?? "{}");
    const ghostControlStyle = JSON.parse(ghost?.getAttribute("data-style") ?? "{}");
    const helper = Array.from(container.querySelectorAll('span[data-rn="Text"]')).find((node) => node.textContent === "Choose one operating mode.");
    const helperStyle = JSON.parse(helper?.getAttribute("data-style") ?? "{}");

    expect(tabSurfaceStyle.backgroundColor).toBe(light.colors.surfaceMuted);
    expect(segmentedSurfaceStyle.backgroundColor).toBe(light.colors.surfaceMuted);
    expect(ghostControlStyle.backgroundColor).toBe("transparent");
    expect(inactiveTabStyle.color).toBe(light.colors.text);
    expect(inactiveSegmentStyle.color).toBe(light.colors.text);
    expect(inactiveTabBarStyle.color).toBe(light.colors.text);
    expect(ghostStyle.color).toBe(light.colors.text);
    expect(closeStyle.color).toBe(light.colors.text);
    expect(helperStyle.color).toBe(light.colors.muted);
  });

  it("uses contrast-safe quiet paint for selected controls and compact accent text", () => {
    const quiet = resolveAurelglyphTheme("dark", "royal-purple", "quiet");
    const { container } = render(
      <AurelglyphProvider accent="royal-purple" appearance="quiet" mode="dark">
        <Tabs
          defaultValue="workbench"
          items={[
            { badge: "LIVE", content: <Text>Workbench panel</Text>, id: "workbench", label: "Workbench" },
            { content: <Text>Systems panel</Text>, id: "systems", label: "Systems" }
          ]}
          label="Quiet tabs"
        />
        <SegmentedControl
          defaultValue="quiet"
          items={[{ label: "Quiet", value: "quiet" }, { label: "Active", value: "active" }]}
          label="Quiet mode"
        />
        <TabBar
          defaultValue="work"
          items={[{ badge: "NOW", id: "work", label: "Work" }, { id: "systems", label: "Systems" }]}
          label="Quiet navigation"
        />
        <Button accessibilityLabel="Quiet primary">Publish</Button>
      </AurelglyphProvider>
    );

    const selectedTab = container.querySelector('button[aria-label="Quiet tabs, Workbench"]');
    const selectedSegment = container.querySelector('button[aria-label="Quiet, Quiet mode"]');
    const selectedTabBar = container.querySelector('button[aria-label="Quiet navigation, Work"]');
    const primary = container.querySelector('button[aria-label="Quiet primary"]');
    const badge = Array.from(selectedTab?.querySelectorAll('span[data-rn="Text"]') ?? []).find((node) => node.textContent === "LIVE");
    const tabBarBadge = Array.from(selectedTabBar?.querySelectorAll('span[data-rn="Text"]') ?? []).find((node) => node.textContent === "NOW");
    const tabBarIndicator = Array.from(selectedTabBar?.querySelectorAll('[data-rn="View"]') ?? []).at(-1);
    const primaryBackdrop = primary?.querySelector('[data-rn="View"]');

    expect(styleOf(selectedTab).borderBottomColor).toBe(quiet.colors.focus);
    expect(styleOf(selectedSegment).borderColor).toBe(quiet.colors.focus);
    expect(styleOf(badge).color).toBe(quiet.colors.focus);
    expect(styleOf(tabBarBadge).color).toBe(quiet.colors.focus);
    expect(styleOf(tabBarIndicator).backgroundColor).toBe(quiet.colors.focus);
    expect(styleOf(primaryBackdrop)).toMatchObject({
      backgroundColor: quiet.colors.accent,
      borderColor: quiet.colors.accent,
    });
  });
});
