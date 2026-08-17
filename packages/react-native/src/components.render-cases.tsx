import { act, useState, type ReactElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const nativeMock = vi.hoisted(() => ({
  anchor: { height: 44, width: 44, x: 24, y: 24 },
  defaultLayout: { height: 44, width: 100, x: 0, y: 0 },
  host: { height: 844, width: 390, x: 0, y: 0 },
  layouts: {} as Record<string, { height: number; width: number; x: number; y: number }>,
  tooltip: { height: 40, width: 160, x: 0, y: 0 },
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
      "data-accessibility-value": value ? JSON.stringify(value) : undefined,
      "data-accessible": props.accessible === false ? "false" : props.accessible === true ? "true" : undefined,
      "data-testid": props.testID as string | undefined,
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

  const Text = ({ children, style, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
    "span",
    { ...accessibilityProps(props), "data-rn": "Text", "data-style": JSON.stringify(flattenStyle(style)) },
    children
  );

  const Pressable = ({
    children,
    disabled,
    onLongPress,
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
      onContextMenu: disabled ? undefined : (event: Event) => {
        event.preventDefault();
        (onLongPress as ((event: unknown) => void) | undefined)?.({ nativeEvent: {} });
      },
      onMouseUp: disabled ? undefined : () => (onPressOut as ((event: unknown) => void) | undefined)?.({ nativeEvent: {} }),
      type: "button"
    },
    children
  );

  const TextInput = ({
    defaultValue,
    editable = true,
    onBlur,
    onChangeText,
    placeholder,
    style,
    value,
    ...props
  }: Record<string, unknown>) => React.createElement("input", {
    ...accessibilityProps(props),
    "data-rn": "TextInput",
    "data-style": JSON.stringify(flattenStyle(style)),
    defaultValue: defaultValue as string | undefined,
    disabled: editable === false,
    onBlur: onBlur as ((event: unknown) => void) | undefined,
    onChange: (event: { currentTarget: { value: string } }) => (onChangeText as ((value: string) => void) | undefined)?.(event.currentTarget.value),
    placeholder: placeholder as string | undefined,
    value: value as string | undefined
  });

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

  const ScrollView = ({ children, contentContainerStyle, style, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
    "div",
    {
      ...accessibilityProps(props),
      "data-content-style": JSON.stringify(flattenStyle(contentContainerStyle)),
      "data-horizontal": String(Boolean(props.horizontal)),
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
      addEventListener: () => ({ remove: () => undefined }),
      isReduceMotionEnabled: () => new Promise<boolean>(() => undefined)
    },
    ActivityIndicator,
    I18nManager: { isRTL: false },
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
import { Combobox, CommandPalette, Menu } from "./selection.js";
import { Dialog, Drawer, Popover, Tooltip } from "./overlays.js";
import { FileUpload, NumberField, RadioGroup, SearchField, Slider, TextField } from "./forms.js";
import { Pagination, SegmentedControl, TabBar, Tabs } from "./navigation.js";
import { Icon } from "./icons.js";
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
    expect(rendered.container.querySelector('[role="menuitem"]')?.getAttribute("aria-label")).toBe("System actions, Sync");
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
    expect(rendered.container.querySelector('[role="option"]')?.getAttribute("aria-label")).toBe("Mode, Quiet");
    expect(rendered.container.querySelector('[data-accessible="false"][role]')).toBeNull();
    rendered.rerender(<Combobox disabled label="Mode" options={options} />);
    expect(rendered.container.querySelector('[data-rn="Modal"]')).toBeNull();
    expect(rendered.container.querySelector('[role="combobox"]')?.getAttribute("aria-disabled")).toBe("true");
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
    const commandTitle = rendered.container.querySelector('[role="dialog"]');
    expect(styleOf(commandTitle?.parentElement?.parentElement?.parentElement).maxHeight).toBe("82%");

    rendered.rerender(<Combobox label="Operating mode" options={items} />);
    click(rendered.container.querySelector('[role="combobox"]')!);
    const comboList = rendered.container.querySelector('[data-rn="ScrollView"]');
    expect(styleOf(comboList)).toMatchObject({ flexShrink: 1, minHeight: 0 });
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
