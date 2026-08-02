// @vitest-environment jsdom

import { act, createElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ButtonGroup } from "./ButtonGroup";
import { Checkbox } from "./Checkbox";
import { Combobox } from "./Combobox";
import { CommandPalette } from "./CommandPalette";
import { Divider } from "./Divider";
import { Dialog } from "./Dialog";
import { Drawer } from "./Drawer";
import { ExpandableSection } from "./ExpandableSection";
import { FileUpload } from "./FileUpload";
import { Grid, Stack, Surface } from "./Layout";
import { Menu } from "./Menu";
import { NumberField } from "./NumberField";
import { Pagination } from "./Pagination";
import { Popover } from "./Popover";
import { Progress } from "./Progress";
import { RadioGroup } from "./RadioGroup";
import { SegmentedControl } from "./SegmentedControl";
import { Select } from "./Select";
import { Slider } from "./Slider";
import { Spinner } from "./Spinner";
import { Switch } from "./Switch";
import { Tabs } from "./Tabs";
import { Tooltip } from "./Tooltip";

type ActEnvironment = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

let container: HTMLDivElement;
let root: Root;

function render(element: ReactElement): void {
  act(() => root.render(element));
}

function fire(target: EventTarget, event: Event): void {
  act(() => target.dispatchEvent(event));
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  fire(input, new Event("input", { bubbles: true }));
}

beforeEach(() => {
  (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.replaceChildren();
  delete (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT;
});

describe("roving selection controls", () => {
  it("gives tabs collision-safe relationships and skips disabled tabs with arrow keys", () => {
    const onValueChange = vi.fn();
    render(
      createElement(Tabs, {
        activeId: "overview",
        children: "Panel",
        items: [
          { id: "overview", label: "Overview" },
          { disabled: true, id: "private", label: "Private" },
          { id: "logs", label: "Logs" }
        ],
        onValueChange
      })
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs[0]?.focus();
    fire(tabs[0] as HTMLButtonElement, new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(onValueChange).toHaveBeenCalledWith("logs");
    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[0]?.id).not.toBe("overview-tab");
    expect(tabs[0]?.getAttribute("aria-controls")).toContain("overview");
    expect(container.querySelector("[role='tabpanel']")?.getAttribute("aria-labelledby")).toBe(tabs[0]?.id);
    expect([...tabs].every((tab) => Boolean(document.getElementById(tab.getAttribute("aria-controls") ?? "")))).toBe(true);
    expect(container.querySelectorAll("[role='tabpanel'][hidden]")).toHaveLength(2);
  });

  it("supports Home and End in segmented controls", () => {
    const onValueChange = vi.fn();
    render(
      createElement(SegmentedControl, {
        activeId: "middle",
        items: [
          { id: "first", label: "First" },
          { id: "middle", label: "Middle" },
          { id: "last", label: "Last" }
        ],
        onValueChange
      })
    );
    const options = container.querySelectorAll<HTMLButtonElement>("[role='radio']");
    options[1]?.focus();
    fire(options[1] as HTMLButtonElement, new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(onValueChange).toHaveBeenCalledWith("last");
    expect(document.activeElement).toBe(options[2]);
    expect(options[0]?.tabIndex).toBe(-1);
    expect(options[1]?.tabIndex).toBe(0);
  });

  it("resolves disabled and unknown segmented values to the first enabled option", () => {
    const items = [
      { id: "first", label: "First" },
      { disabled: true, id: "disabled", label: "Disabled" },
      { id: "last", label: "Last" }
    ];
    render(createElement(SegmentedControl, { activeId: "disabled", items }));
    let options = container.querySelectorAll<HTMLButtonElement>("[role='radio']");

    expect(options[0]?.getAttribute("aria-checked")).toBe("true");
    expect(options[0]?.classList.contains("is-active")).toBe(true);
    expect(options[0]?.tabIndex).toBe(0);
    expect(options[1]?.getAttribute("aria-checked")).toBe("false");

    render(createElement(SegmentedControl, { activeId: "missing", items }));
    options = container.querySelectorAll<HTMLButtonElement>("[role='radio']");
    expect(options[0]?.getAttribute("aria-checked")).toBe("true");
    expect(options[2]?.getAttribute("aria-checked")).toBe("false");
  });
});

describe("existing component completion", () => {
  it("filters and selects commands with an active descendant", () => {
    const onDismiss = vi.fn();
    const onSelect = vi.fn();
    render(
      createElement(CommandPalette, {
        items: [
          { id: "open", label: "Open file" },
          { id: "sync", keywords: ["refresh"], label: "Synchronize" }
        ],
        onDismiss,
        onSelect
      })
    );
    const input = container.querySelector<HTMLInputElement>("[role='combobox']") as HTMLInputElement;
    setInputValue(input, "refresh");
    expect(container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();

    fire(input, new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(onSelect).toHaveBeenCalledWith("sync");
    expect(onDismiss).toHaveBeenCalledOnce();

    const clearEscape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
    fire(input, clearEscape);
    expect(clearEscape.defaultPrevented).toBe(true);
    expect(input.value).toBe("");
    expect(onDismiss).toHaveBeenCalledOnce();

    const dismissEscape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
    fire(input, dismissEscape);
    expect(dismissEscape.defaultPrevented).toBe(true);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("lets an empty command Escape bubble without a dismiss handler and owns empty results as options", () => {
    render(createElement(CommandPalette, { items: [{ id: "open", label: "Open file" }] }));
    const input = container.querySelector<HTMLInputElement>("[role='combobox']") as HTMLInputElement;
    const listener = vi.fn();
    document.addEventListener("keydown", listener);
    const escape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
    fire(input, escape);
    document.removeEventListener("keydown", listener);

    expect(escape.defaultPrevented).toBe(false);
    expect(listener).toHaveBeenCalledOnce();

    setInputValue(input, "missing");
    const listbox = container.querySelector("[role='listbox']") as HTMLElement;
    const empty = listbox.querySelector(".ag-command-palette__empty") as HTMLElement;
    expect(empty.getAttribute("role")).toBe("option");
    expect(empty.getAttribute("aria-disabled")).toBe("true");
    expect(listbox.querySelector("[role='status']")).toBeNull();
  });

  it("removes closed disclosure content from focus and hit testing", () => {
    render(createElement(ExpandableSection, { children: createElement("button", null, "Hidden action"), title: "Details" }));
    const panel = container.querySelector<HTMLElement>(".ag-disclosure__panel") as HTMLElement;
    expect(panel.hidden).toBe(true);
    expect(panel.hasAttribute("inert")).toBe(true);

    act(() => (container.querySelector(".ag-disclosure__trigger") as HTMLButtonElement).click());
    expect(panel.hidden).toBe(false);
    expect(panel.hasAttribute("inert")).toBe(false);
  });

  it("connects select and switch descriptions, errors, and generated ids", () => {
    render(
      createElement(
        "div",
        null,
        createElement(Select, {
          error: "Required",
          helpText: "Choose one",
          label: "Theme",
          options: [{ label: "Purple", value: "purple" }],
          required: true
        }),
        createElement(Switch, { description: "Notify on completion", label: "Notifications" })
      )
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    const switchInput = container.querySelector("[role='switch']") as HTMLInputElement;
    expect(select.id).toBeTruthy();
    expect(select.required).toBe(true);
    expect(select.getAttribute("aria-invalid")).toBe("true");
    expect(select.getAttribute("aria-describedby")?.split(" ")).toHaveLength(2);
    expect(switchInput.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("clamps pagination requests and progress accessibility values", () => {
    const onPageChange = vi.fn();
    render(
      createElement(
        "div",
        null,
        createElement(Pagination, { currentPage: 99, onPageChange, totalPages: 3 }),
        createElement(Progress, { max: 10, value: 40 })
      )
    );
    const buttons = container.querySelectorAll<HTMLButtonElement>(".ag-pagination__button");
    expect(buttons[1]?.disabled).toBe(true);
    act(() => buttons[0]?.click());
    expect(onPageChange).toHaveBeenCalledWith(2);
    const progress = container.querySelector("[role='progressbar']");
    expect(progress?.getAttribute("aria-valuemax")).toBe("10");
    expect(progress?.getAttribute("aria-valuenow")).toBe("10");
  });

  it("bounds pagination rendering for very large result sets", () => {
    const onPageChange = vi.fn();
    render(createElement(Pagination, { currentPage: 250_000, onPageChange, totalPages: 500_000 }));

    const pageButtons = [...container.querySelectorAll<HTMLButtonElement>(".ag-pagination__page")];
    expect(pageButtons.length).toBeLessThanOrEqual(7);
    expect(pageButtons.map((button) => button.textContent)).toEqual(["1", "249999", "250000", "250001", "500000"]);
    expect(container.querySelectorAll(".ag-pagination__ellipsis")).toHaveLength(2);
    act(() => pageButtons.find((button) => button.textContent === "250001")?.click());
    expect(onPageChange).toHaveBeenCalledWith(250_001);
  });

  it("accepts dropped files through the explicit file-list callback", () => {
    const onFilesChange = vi.fn();
    render(createElement(FileUpload, { label: "Attachment", onFilesChange }));
    const upload = container.querySelector(".ag-upload") as HTMLDivElement;
    const file = new File(["draft"], "draft.txt", { type: "text/plain" });
    const files = { 0: file, item: () => file, length: 1 } as unknown as FileList;
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: { files, types: ["Files"] } });
    fire(upload, drop);

    expect(drop.defaultPrevented).toBe(true);
    expect(onFilesChange).toHaveBeenCalledWith(files);
  });
});

describe("overlay foundations", () => {
  it("navigates menu items and restores trigger focus on Escape", async () => {
    const onOpenChange = vi.fn();
    render(
      createElement(Menu, {
        defaultOpen: true,
        items: [
          { id: "edit", label: "Edit" },
          { disabled: true, id: "archive", label: "Archive" },
          { id: "delete", label: "Delete" }
        ],
        label: "Actions",
        onOpenChange,
        placement: "top-end"
      })
    );
    await act(async () => undefined);
    const trigger = container.querySelector(".ag-menu__trigger") as HTMLButtonElement;
    expect(container.querySelector(".ag-menu")?.getAttribute("data-placement")).toBe("top-end");
    const items = container.querySelectorAll<HTMLButtonElement>("[role='menuitem']");
    expect(document.activeElement).toBe(items[0]);

    fire(items[0] as HTMLButtonElement, new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(items[2]);
    fire(items[2] as HTMLButtonElement, new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));
    fire(items[0] as HTMLButtonElement, new KeyboardEvent("keydown", { bubbles: true, key: "d" }));
    expect(document.activeElement).toBe(items[2]);
    fire(items[2] as HTMLButtonElement, new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await act(async () => undefined);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("dismisses popovers on outside pointer interaction", () => {
    const onOpenChange = vi.fn();
    render(createElement(Popover, { children: "Panel", label: "Details", onOpenChange, trigger: "Open" }));
    act(() => (container.querySelector(".ag-popover__trigger") as HTMLButtonElement).click());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    fire(document.body, new Event("pointerdown", { bubbles: true }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("tracks tooltip hover and focus independently and dismisses both with Escape", () => {
    render(createElement(Tooltip, { children: createElement("button", null, "Inspect"), content: "System details" }));
    const trigger = container.querySelector("button") as HTMLButtonElement;
    const tooltip = container.querySelector("[role='tooltip']") as HTMLElement;
    const wrapper = container.querySelector(".ag-tooltip") as HTMLElement;

    fire(trigger, new FocusEvent("focusin", { bubbles: true }));
    expect(tooltip.hidden).toBe(false);
    fire(trigger, new MouseEvent("mouseover", { bubbles: true }));
    fire(trigger, new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
    expect(wrapper.getAttribute("data-focused")).toBeNull();
    expect(wrapper.getAttribute("data-hovered")).toBe("true");
    expect(tooltip.hidden).toBe(false);
    fire(trigger, new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    expect(tooltip.hidden).toBe(true);

    fire(trigger, new MouseEvent("mouseover", { bubbles: true }));
    fire(trigger, new FocusEvent("focusin", { bubbles: true }));
    fire(trigger, new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
    expect(wrapper.getAttribute("data-focused")).toBe("true");
    expect(wrapper.getAttribute("data-hovered")).toBeNull();
    expect(tooltip.hidden).toBe(false);
    fire(document, new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(tooltip.hidden).toBe(true);
    expect(wrapper.getAttribute("data-focused")).toBeNull();
    expect(wrapper.getAttribute("data-hovered")).toBeNull();
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("reuses the modal lifecycle for drawers", () => {
    const dialog = Dialog({ children: "Body", open: false, title: "Calibration", variant: "wide" }) as ReactElement<
      Record<string, unknown>
    >;
    const element = Drawer({ children: "Body", open: false, side: "start", title: "Navigation" }) as ReactElement<
      Record<string, unknown>
    >;
    expect(dialog.props.className).toContain("ag-dialog--wide");
    expect(dialog.props["data-variant"]).toBe("wide");
    expect(element.props.className).toContain("ag-drawer");
    expect(element.props["data-side"]).toBe("start");
  });
});

describe("new form and layout primitives", () => {
  it("supports indeterminate checkboxes and controlled radio selection", () => {
    const onValueChange = vi.fn();
    render(
      createElement(
        "div",
        null,
        createElement(Checkbox, { indeterminate: true, label: "Partial" }),
        createElement(RadioGroup, {
          defaultValue: "quiet",
          label: "Mode",
          onValueChange,
          options: [
            { label: "Quiet", value: "quiet" },
            { label: "Active", value: "active" }
          ]
        })
      )
    );
    const checkbox = container.querySelector("[type='checkbox']") as HTMLInputElement;
    const radios = container.querySelectorAll<HTMLInputElement>("[type='radio']");
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox.getAttribute("data-indeterminate")).toBe("true");
    act(() => radios[1]?.click());
    expect(onValueChange).toHaveBeenCalledWith("active");
    expect(radios[1]?.checked).toBe(true);
  });

  it("serializes mixed checkboxes for first-paint styling", () => {
    const markup = renderToStaticMarkup(createElement(Checkbox, { indeterminate: true, label: "Partial" }));

    expect(markup).toContain('aria-checked="mixed"');
    expect(markup.match(/data-indeterminate="true"/g)).toHaveLength(2);
  });

  it("updates native slider and number-field values", () => {
    const onSliderChange = vi.fn();
    const onNumberChange = vi.fn();
    render(
      createElement(
        "div",
        null,
        createElement(Slider, { defaultValue: 2, label: "Volume", max: 10, onValueChange: onSliderChange }),
        createElement(NumberField, { defaultValue: 4, label: "Retries", onValueChange: onNumberChange })
      )
    );
    const slider = container.querySelector("[type='range']") as HTMLInputElement;
    setInputValue(slider, "7");
    expect(onSliderChange).toHaveBeenCalledWith(7);
    const increment = container.querySelectorAll<HTMLButtonElement>(".ag-number-field__step")[1];
    act(() => increment?.click());
    expect(onNumberChange).toHaveBeenCalledWith(5);
  });

  it("clamps typed number-field values before updating controlled state", () => {
    const onValueChange = vi.fn();
    render(createElement(NumberField, { defaultValue: 4, label: "Retries", max: 10, min: 1, onValueChange }));
    const input = container.querySelector(".ag-number-field__input") as HTMLInputElement;

    setInputValue(input, "100");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    expect(input.value).toBe("10");
    setInputValue(input, "-5");
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    expect(input.value).toBe("1");
  });

  it("normalizes number steps and disables steppers when the next valid value exceeds the range", () => {
    render(
      createElement(
        "div",
        null,
        createElement(NumberField, { defaultValue: 9, id: "at-maximum-step", label: "At maximum step", max: 10, min: 0, step: 3 }),
        createElement(NumberField, { defaultValue: 8, id: "off-step", label: "Off step", max: 10, min: 0, step: 3 }),
        createElement(NumberField, { id: "zero-step", label: "Zero step", step: 0 }),
        createElement(NumberField, { id: "negative-step", label: "Negative step", step: -3 })
      )
    );

    const atMaximumStep = container.querySelector("#at-maximum-step") as HTMLInputElement;
    const atMaximumButtons = atMaximumStep.closest(".ag-number-field")?.querySelectorAll<HTMLButtonElement>("button");
    expect(atMaximumButtons?.[1]?.disabled).toBe(true);

    const offStep = container.querySelector("#off-step") as HTMLInputElement;
    const offStepButtons = offStep.closest(".ag-number-field")?.querySelectorAll<HTMLButtonElement>("button");
    act(() => offStepButtons?.[1]?.click());
    expect(offStep.value).toBe("9");
    expect((container.querySelector("#zero-step") as HTMLInputElement).step).toBe("1");
    expect((container.querySelector("#negative-step") as HTMLInputElement).step).toBe("3");
  });

  it("steps blank number fields from positive minimums and negative-only ranges", () => {
    render(
      createElement(
        "div",
        null,
        createElement(NumberField, { id: "minimum-down", label: "Minimum down", min: 5, step: 3 }),
        createElement(NumberField, { id: "minimum-up", label: "Minimum up", min: 5, step: 3 }),
        createElement(NumberField, { id: "negative-down", label: "Negative down", max: -5 }),
        createElement(NumberField, { id: "negative-up", label: "Negative up", max: -5 })
      )
    );

    const clickStep = (id: string, index: number): HTMLInputElement => {
      const input = container.querySelector(`#${id}`) as HTMLInputElement;
      const buttons = input.closest(".ag-number-field")?.querySelectorAll<HTMLButtonElement>("button");
      act(() => buttons?.[index]?.click());
      return input;
    };

    expect(clickStep("minimum-down", 0).value).toBe("5");
    expect(clickStep("minimum-up", 1).value).toBe("8");
    expect(clickStep("negative-down", 0).value).toBe("-5");
    expect(clickStep("negative-up", 1).value).toBe("-5");
  });

  it("filters and selects combobox options by keyboard", () => {
    const onValueChange = vi.fn();
    render(
      createElement(Combobox, {
        label: "System",
        onValueChange,
        options: [
          { label: "Atlas", value: "atlas" },
          { label: "Beacon", value: "beacon" }
        ]
      })
    );
    const input = container.querySelector("[role='combobox']") as HTMLInputElement;
    fire(input, new FocusEvent("focusin", { bubbles: true }));
    fire(input, new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    fire(input, new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(onValueChange).toHaveBeenCalledWith("beacon");
    expect(input.value).toBe("Beacon");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("disables combobox submission values while unavailable and owns empty results as options", () => {
    render(
      createElement(
        "div",
        null,
        createElement(Combobox, { disabled: true, label: "Disabled system", name: "disabled-system", options: [] }),
        createElement(Combobox, { label: "Loading system", loading: true, name: "loading-system", options: [] }),
        createElement(Combobox, {
          id: "search-system",
          label: "Search system",
          options: [{ label: "Atlas", value: "atlas" }]
        })
      )
    );

    expect((container.querySelector("input[name='disabled-system']") as HTMLInputElement).disabled).toBe(true);
    expect((container.querySelector("input[name='loading-system']") as HTMLInputElement).disabled).toBe(true);

    const input = container.querySelector<HTMLInputElement>("#search-system-input") as HTMLInputElement;
    fire(input, new FocusEvent("focusin", { bubbles: true }));
    setInputValue(input, "missing");
    const listbox = container.querySelector("#search-system-list") as HTMLElement;
    const empty = listbox.querySelector(".ag-combobox__empty") as HTMLElement;
    expect(empty.getAttribute("role")).toBe("option");
    expect(empty.getAttribute("aria-disabled")).toBe("true");
    expect(listbox.querySelector("[role='status']")).toBeNull();
  });

  it.each(["disabled", "loading", "readOnly"] as const)("closes and guards an open combobox when %s", (state) => {
    const onValueChange = vi.fn();
    const options = [{ label: "Atlas", value: "atlas" }];
    const renderState = (unavailable: boolean): void => {
      render(createElement(Combobox, {
        [state]: unavailable,
        id: `transition-${state}`,
        label: "System",
        onValueChange,
        options
      }));
    };

    renderState(false);
    const input = container.querySelector(`#transition-${state}-input`) as HTMLInputElement;
    fire(input, new FocusEvent("focusin", { bubbles: true }));
    expect(input.getAttribute("aria-expanded")).toBe("true");
    renderState(true);
    const transitionedInput = container.querySelector(`#transition-${state}-input`) as HTMLInputElement;
    const listbox = container.querySelector(`#transition-${state}-list`) as HTMLElement;
    expect(transitionedInput.getAttribute("aria-expanded")).toBe("false");
    expect(listbox.hidden).toBe(true);
    fire(listbox.querySelector("[role='option']") as HTMLElement, new MouseEvent("click", { bubbles: true }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps group metadata valid for button and read-only radio groups", () => {
    render(
      createElement(
        "div",
        null,
        createElement(
          ButtonGroup,
          {
            children: createElement("button", { type: "button" }, "Start"),
            label: "Alignment",
            orientation: "vertical"
          }
        ),
        createElement(RadioGroup, {
          label: "Mode",
          options: [{ label: "Quiet", value: "quiet" }],
          readOnly: true
        })
      )
    );

    const buttonGroup = container.querySelector("[role='group']") as HTMLElement;
    const radioGroup = container.querySelector("fieldset") as HTMLFieldSetElement;
    expect(buttonGroup.getAttribute("data-orientation")).toBe("vertical");
    expect(buttonGroup.hasAttribute("aria-orientation")).toBe(false);
    expect(radioGroup.getAttribute("data-readonly")).toBe("true");
    expect(radioGroup.hasAttribute("aria-readonly")).toBe(false);
  });

  it("renders feedback and token-driven layout contracts", () => {
    render(
      createElement(
        Surface,
        { elevation: "floating", padding: "lg" },
        createElement(Stack, { direction: "row", gap: "sm" }, createElement(Spinner, { size: "sm" }), createElement(Divider)),
        createElement(Grid, { columns: { base: 1, md: 3 }, minItemWidth: "12rem" }, "Grid")
      )
    );
    expect(container.querySelector(".ag-surface")?.getAttribute("data-elevation")).toBe("floating");
    expect(container.querySelector(".ag-stack")?.getAttribute("data-direction")).toBe("row");
    expect(container.querySelector("[role='status']")?.getAttribute("aria-label")).toBe("Loading");
    const grid = container.querySelector(".ag-grid") as HTMLElement;
    expect(grid.style.getPropertyValue("--ag-grid-columns")).toBe("1");
    expect(grid.style.getPropertyValue("--ag-grid-columns-md")).toBe("3");
    expect(grid.style.getPropertyValue("--ag-grid-min-item-width")).toBe("12rem");
    expect(grid.style.getPropertyValue("--ag-grid-target-width")).toBe("100%");
    expect(grid.style.getPropertyValue("--ag-grid-target-width-md")).toBe(`${100 / 3}%`);
  });
});
