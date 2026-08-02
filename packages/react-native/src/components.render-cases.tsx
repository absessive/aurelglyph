import { act, useState, type ReactElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
      "data-accessibility-value": value ? JSON.stringify(value) : undefined,
      "data-accessible": props.accessible === false ? "false" : props.accessible === true ? "true" : undefined,
      "data-testid": props.testID as string | undefined,
      role: (props.role ?? props.accessibilityRole) as string | undefined
    };
  };

  const View = ({
    children,
    onAccessibilityAction,
    onLayout,
    onResponderGrant,
    onStartShouldSetResponder,
    style,
    ...props
  }: Record<string, unknown> & { children?: ReactNode }) => {
    React.useEffect(() => {
      (onLayout as ((event: unknown) => void) | undefined)?.({ nativeEvent: { layout: { height: 44, width: 100, x: 0, y: 0 } } });
    }, [onLayout]);
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
  };

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

  const Modal = ({ animationType, children, onRequestClose, visible }: { animationType?: string; children?: ReactNode; onRequestClose?: () => void; visible?: boolean }) => visible
    ? React.createElement("div", { "data-animation": animationType, "data-rn": "Modal", onKeyDown: (event: KeyboardEvent) => event.key === "Escape" && onRequestClose?.() }, children)
    : null;

  const Switch = ({ disabled, onValueChange, value, ...props }: Record<string, unknown>) => React.createElement("button", {
    ...accessibilityProps(props),
    "aria-checked": Boolean(value),
    "data-rn": "Switch",
    disabled: Boolean(disabled),
    onClick: disabled ? undefined : () => (onValueChange as ((value: boolean) => void) | undefined)?.(!value),
    role: "switch",
    type: "button"
  });

  const ScrollView = ({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) => React.createElement(
    "div",
    { ...accessibilityProps(props), "data-rn": "ScrollView" },
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
    Modal,
    Pressable,
    ScrollView,
    StyleSheet: {
      absoluteFill: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
      create: <T,>(styles: T) => styles,
      hairlineWidth: 1
    },
    Switch,
    Text,
    TextInput,
    View,
    useColorScheme: () => "dark",
    useWindowDimensions: () => ({ height: 844, scale: 3, width: 390 })
  };
});

import {
  Button,
  ButtonGroup,
  Container,
  Divider,
  IconButton,
  Progress,
  Spinner
} from "./primitives.js";
import { Combobox, CommandPalette, Menu } from "./selection.js";
import { Dialog, Drawer, Popover, Tooltip } from "./overlays.js";
import { FileUpload, NumberField, RadioGroup, SearchField, Slider, TextField } from "./forms.js";
import { Pagination, SegmentedControl, TabBar, Tabs } from "./navigation.js";
import { Icon } from "./icons.js";
import { AurelglyphProvider, resolveAurelglyphTheme } from "./theme.js";
import { Text } from "react-native";

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

afterEach(() => {
  while (mounted.length) {
    const item = mounted.pop()!;
    act(() => item.root.unmount());
    item.container.remove();
  }
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
});
