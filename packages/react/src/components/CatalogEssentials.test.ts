// @vitest-environment jsdom
import { act, createElement as h, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Accordion } from "./Accordion";
import { Chip } from "./Chip";
import { InputGroup } from "./InputGroup";
import { Link } from "./Link";
import { PasswordField } from "./PasswordField";
import { Rating } from "./Rating";
import { Stepper } from "./Stepper";
import { ValidationSummary } from "./ValidationSummary";

let container: HTMLDivElement;
let root: Root;
const render = (element: ReactElement): void => { act(() => root.render(element)); };
const fire = (element: Element, event: Event): void => { act(() => { element.dispatchEvent(event); }); };
const click = (element: Element): void => fire(element, new MouseEvent("click", { bubbles: true }));
beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT; });

describe("catalog essentials", () => {
  it("renders actual external navigation with safe relation and localized notice", () => {
    render(h(Link, { external: true, externalLabel: "Nouvel onglet", href: "https://example.com", rel: "author" }, "Guide"));
    const link = container.querySelector("a")!;
    expect(link.target).toBe("_blank"); expect(link.rel).toContain("noopener"); expect(link.rel).toContain("author"); expect(link.textContent).toContain("Nouvel onglet");
  });
  it("announces new-tab targets and describes same-tab external navigation accurately", () => {
    render(h(Link, { href: "/guide", target: "_blank" }, "Guide"));
    expect(container.textContent).toContain("Opens in a new tab"); expect(container.querySelector("a")?.rel).toContain("noopener");
    render(h(Link, { external: true, href: "https://example.com", target: "_self" }, "Guide"));
    expect(container.textContent).toContain("External link"); expect(container.textContent).not.toContain("new tab");
  });
  it("removes every destination, event and focus affordance from unavailable links", () => {
    const activate = vi.fn();
    render(h(Link, { disabled: true, href: "/danger", onClick: activate, onKeyDown: activate, tabIndex: 0 }, "Unavailable"));
    const link = container.querySelector(".ag-link.is-unavailable")!;
    click(link); fire(link, new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(container.querySelector("a, [role=link]")).toBeNull(); expect(link.hasAttribute("href")).toBe(false); expect(link.hasAttribute("tabindex")).toBe(false); expect(activate).not.toHaveBeenCalled(); expect(link.getAttribute("aria-disabled")).toBe("true"); expect(link.textContent).toContain("Unavailable");
  });
  it("selects chips and submits only selected values with sibling removal", () => {
    const remove = vi.fn(); const change = vi.fn();
    render(h("form", {}, h(Chip, { label: "Local", name: "scope", onRemove: remove, onSelectedChange: change, removeLabel: "Remove Local", value: "local" })));
    const select = container.querySelector(".ag-chip__select")!; click(select);
    expect(select.getAttribute("aria-pressed")).toBe("true"); expect(new FormData(container.querySelector("form")!).get("scope")).toBe("local"); expect(change).toHaveBeenCalledWith(true);
    click(container.querySelector(".ag-chip__remove")!); expect(remove).toHaveBeenCalledOnce(); expect(container.querySelector("button button")).toBeNull();
  });
  it("keeps controlled/read-only chips caller-owned", () => {
    const change = vi.fn(); const remove = vi.fn();
    render(h(Chip, { label: "Local", onRemove: remove, onSelectedChange: change, readOnly: true, removeLabel: "Remove Local", selected: true }));
    container.querySelectorAll("button").forEach(click); expect(change).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled(); expect(container.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
  });
  it("silently resets uncontrolled chip/rating form values and paint", async () => {
    const chipChange = vi.fn(); const ratingChange = vi.fn();
    render(h("form", {}, h(Chip, { defaultSelected: true, label: "Local", name: "scope", onSelectedChange: chipChange, value: "local" }), h(Rating, { defaultValue: 3, label: "Experience", name: "rating", onValueChange: ratingChange })));
    click(container.querySelector(".ag-chip__select")!); click(container.querySelector("input[value='5']")!); chipChange.mockClear(); ratingChange.mockClear();
    await act(async () => { container.querySelector("form")!.reset(); await Promise.resolve(); });
    const data = new FormData(container.querySelector("form")!);
    expect(data.get("scope")).toBe("local"); expect(data.get("rating")).toBe("3"); expect(container.querySelector(".ag-chip__select")?.getAttribute("aria-pressed")).toBe("true"); expect(container.querySelectorAll(".ag-rating__option[data-filled]")).toHaveLength(3); expect(chipChange).not.toHaveBeenCalled(); expect(ratingChange).not.toHaveBeenCalled();
  });
  it("retains controlled chip/rating owners and honors cancelled native resets", async () => {
    const change = vi.fn();
    render(h("form", {}, h(Chip, { defaultSelected: false, label: "Local", name: "scope", onSelectedChange: change, selected: true }), h(Rating, { defaultValue: 1, label: "Experience", name: "rating", onValueChange: change, value: 4 })));
    await act(async () => { container.querySelector("form")!.reset(); await Promise.resolve(); });
    expect(new FormData(container.querySelector("form")!).get("rating")).toBe("4"); expect(container.querySelectorAll(".ag-rating__option[data-filled]")).toHaveLength(4); expect(container.querySelector(".ag-chip__select")?.getAttribute("aria-pressed")).toBe("true"); expect(change).not.toHaveBeenCalled();
    render(h("form", { onReset: (event) => event.preventDefault() }, h(Rating, { defaultValue: 3, label: "Experience", name: "rating", key: "uncontrolled" })));
    click(container.querySelector("input[value='5']")!);
    await act(async () => { container.querySelector("form")!.reset(); await Promise.resolve(); });
    expect(new FormData(container.querySelector("form")!).get("rating")).toBe("5");
  });
  it("owns one input and connects addons without changing its accessible label", () => {
    render(h(InputGroup, { addonDescription: "US dollars", error: "Enter an amount", helpText: "Total", id: "amount", label: "Amount", leading: "$", trailing: h("button", { type: "button" }, "Convert") }));
    const input = container.querySelector("input")!;
    expect(container.querySelectorAll("input")).toHaveLength(1); expect(container.querySelector("label")?.htmlFor).toBe(input.id); expect(input.getAttribute("aria-describedby")).toBe("amount-help amount-error amount-addons"); expect(input.getAttribute("aria-invalid")).toBe("true"); expect(container.querySelector(".ag-input-group__addon--leading")?.getAttribute("aria-hidden")).toBe("true"); expect(container.querySelector(".ag-input-group__addon--trailing")?.hasAttribute("aria-hidden")).toBe(false);
  });
  it("reveals a password without replacing its input, value, focus or selection", () => {
    render(h(PasswordField, { defaultValue: "sample-password", hideLabel: "Masquer", label: "Password", showLabel: "Afficher" }));
    const input = container.querySelector("input")!; input.focus(); input.setSelectionRange(2, 5);
    click(container.querySelector("button")!);
    expect(container.querySelector("input")).toBe(input); expect(input.type).toBe("text"); expect(input.value).toBe("sample-password"); expect(input.selectionStart).toBe(2); expect(input.selectionEnd).toBe(5); expect(document.activeElement).toBe(input); expect(input.autocomplete).toBe("current-password"); expect(container.querySelector("button")?.getAttribute("aria-label")).toBe("Masquer");
    click(container.querySelector("button")!); expect(input.type).toBe("password");
  });
  it("masks passwords on the server and disables reveal while loading", () => {
    expect(renderToStaticMarkup(h(PasswordField, { label: "Password" }))).toContain('type="password"');
    render(h(PasswordField, { defaultValue: "sample", label: "Password", loading: true })); click(container.querySelector("button")!); expect(container.querySelector("input")?.type).toBe("password"); expect(container.querySelector("button")?.disabled).toBe(true);
  });
  it("does not overwrite a new selection after a password visibility commit", async () => {
    const change = vi.fn();
    render(h(PasswordField, { defaultValue: "example-password", label: "Password", onChange: change }));
    const input = container.querySelector("input")!;
    input.focus(); input.setSelectionRange(2, 5);
    click(container.querySelector("button")!);
    expect(input.selectionStart).toBe(2); expect(input.selectionEnd).toBe(5);
    click(container.querySelector("button")!);
    await act(async () => { await Promise.resolve(); });
    input.select();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(input.selectionStart).toBe(0); expect(input.selectionEnd).toBe(input.value.length);
    expect(input.type).toBe("password"); expect(change).not.toHaveBeenCalled();
  });
  it.each(["beforeinput", "keydown", "pointerdown"])("cancels password restoration on %s before a new collapsed caret", async (event) => {
    render(h(PasswordField, { defaultValue: "example-password", label: "Password" }));
    const input = container.querySelector("input")!;
    input.focus(); input.setSelectionRange(2, 5);
    click(container.querySelector("button")!);
    await act(async () => { await Promise.resolve(); });
    fire(input, new Event(event, { bubbles: true }));
    input.setSelectionRange(7, 7);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect([input.selectionStart, input.selectionEnd]).toEqual([7, 7]);
    expect(input.value).toBe("example-password"); expect(document.activeElement).toBe(input);
  });
  it("preserves controlled password state and keyboard toggle focus", () => {
    render(h(PasswordField, { label: "Password", onChange: () => {}, value: "sample-password" }));
    const input = container.querySelector("input")!; const button = container.querySelector("button")!;
    input.setSelectionRange(2, 5, "backward"); button.focus(); click(button);
    expect(container.querySelector("input")).toBe(input); expect(input.value).toBe("sample-password"); expect(input.selectionStart).toBe(2); expect(input.selectionEnd).toBe(5); expect(input.selectionDirection).toBe("backward"); expect(document.activeElement).toBe(button);
  });
  it("allows read-only visibility while preventing edits", () => {
    render(h(PasswordField, { label: "Password", readOnly: true })); click(container.querySelector("button")!); expect(container.querySelector("input")?.type).toBe("text"); expect(container.querySelector("input")?.readOnly).toBe(true);
  });
  it("forwards modern callback-ref cleanup without leaking the field", () => {
    const cleanup = vi.fn(); const ref = vi.fn((input: HTMLInputElement | null) => input ? cleanup : undefined);
    render(h(PasswordField, { label: "Password", ref }));
    expect(ref).toHaveBeenCalledOnce(); render(h("div")); expect(cleanup).toHaveBeenCalledOnce(); expect(ref).toHaveBeenCalledOnce();
  });
  it("renders no empty summary and focuses/announces only explicit requests once", () => {
    render(h(ValidationSummary, { errors: [] })); expect(container.textContent).toBe("");
    const errors = [{ id: "amount-error", fieldId: "summary-amount", message: "Enter an amount" }];
    const input = document.createElement("input"); input.id = "summary-amount"; document.body.append(input);
    render(h(ValidationSummary, { announcementKey: "submit-1", announcementLabel: () => "Un champ", errors, focusKey: "submit-1" }));
    const summary = container.querySelector("section")!; const focus = vi.spyOn(summary, "focus");
    expect(document.activeElement).toBe(summary); expect(container.querySelector("[aria-live]")?.textContent).toBe("Un champ"); expect(container.querySelector("[role=alert]")).toBeNull();
    render(h(ValidationSummary, { announcementKey: "submit-1", errors: [...errors], focusKey: "submit-1" })); expect(focus).not.toHaveBeenCalled();
    click(container.querySelector("a")!); expect(document.activeElement).toBe(input);
    render(h(ValidationSummary, { errors, focusKey: "submit-2" })); expect(focus).toHaveBeenCalledOnce(); input.remove();
  });
  it("supports single/multiple accordions with real headings and hidden inert content", () => {
    const items = [{ id: "one", title: "One", content: h("a", { href: "#one" }, "Inside") }, { id: "two", title: "Two", content: "Second" }, { id: "three", title: "Three", content: "Locked", disabled: true }];
    render(h(Accordion, { defaultValue: ["one"], headingLevel: 2, items }));
    const buttons = container.querySelectorAll("button"); expect(container.querySelectorAll("h2 button")).toHaveLength(3); expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");
    click(buttons[1]!); expect(buttons[0]?.getAttribute("aria-expanded")).toBe("false"); expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true"); expect(container.querySelector(".ag-disclosure__panel")?.hasAttribute("inert")).toBe(true); click(buttons[2]!); expect(buttons[2]?.getAttribute("aria-expanded")).toBe("false");
    render(h(Accordion, { defaultValue: ["one"], items, type: "multiple", key: "multiple" })); click(container.querySelectorAll("button")[1]!); expect(container.querySelectorAll("button[aria-expanded=true]")).toHaveLength(2);
  });
  it("does not repeat focus or announcements when explicit request keys cycle", () => {
    const errors = [{ id: "one", message: "Check amount" }]; const announcementLabel = vi.fn((title: string, count: number) => `${title}: ${count}`);
    const summary = (key: number) => h(ValidationSummary, { errors, focusKey: key, announcementKey: key, announcementLabel });
    render(summary(1)); const focus = vi.spyOn(container.querySelector("section")!, "focus");
    render(summary(2)); render(summary(1));
    expect(focus).toHaveBeenCalledOnce(); expect(announcementLabel).toHaveBeenCalledTimes(2);
    render(h(ValidationSummary, { errors: [] })); render(summary(2));
    expect(announcementLabel).toHaveBeenCalledTimes(2); expect(container.querySelector("[aria-live]")?.textContent).toBe("");
  });
  it("keeps accordion controlled state unchanged until the owner updates it", () => {
    const change = vi.fn(); render(h(Accordion, { items: [{ id: "one", title: "One", content: "Panel" }], onValueChange: change, value: [] })); click(container.querySelector("button")!); expect(change).toHaveBeenCalledWith(["one"]); expect(container.querySelector("button")?.getAttribute("aria-expanded")).toBe("false");
  });
  it("renders ordered workflow status and only navigable enabled steps as controls", () => {
    const change = vi.fn(); render(h(Stepper, { currentId: "review", items: [{ id: "details", label: "Details" }, { id: "review", label: "Review" }, { id: "publish", label: "Publish", disabled: true, href: "/publish", status: "error" }], onStepChange: change, statusLabels: { current: "Actuel" } }));
    expect(container.querySelector("ol")).not.toBeNull(); expect(container.querySelectorAll("[aria-current=step]")).toHaveLength(1); expect(container.querySelector(".is-current")?.textContent).toContain("Actuel"); expect(container.querySelector(".is-completed [data-icon=check]")).not.toBeNull(); expect(container.querySelector(".is-error [data-icon=warning]")).not.toBeNull(); expect(container.querySelector(".is-disabled button, .is-disabled a")).toBeNull(); click(container.querySelector("button")!); expect(change).toHaveBeenCalledWith("details");
  });
  it("uses real rating radios with RTL keyboard navigation, form value and clearing", () => {
    const change = vi.fn(); render(h("form", { dir: "rtl" }, h(Rating, { defaultValue: 3, label: "Experience", name: "rating", onValueChange: change, valueLabel: (value, max) => `${value} sur ${max}` })));
    const radio = container.querySelector<HTMLInputElement>("input[value='3']")!;
    fire(radio, new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })); expect(change).toHaveBeenCalledWith(2); expect(new FormData(container.querySelector("form")!).get("rating")).toBe("2"); expect(document.activeElement).toBe(container.querySelector("input[value='2']")); expect(container.querySelector("input[value='2']")?.getAttribute("aria-label")).toBe("2 sur 5");
    click(container.querySelector("button")!); expect(new FormData(container.querySelector("form")!).get("rating")).toBe("0"); expect(container.querySelector("input:checked")).toBeNull();
  });
  it("keeps required/readonly/disabled rating contracts and bounded integer values", () => {
    const change = vi.fn(); render(h(Rating, { defaultValue: 0, label: "Experience", onValueChange: change, required: true })); expect(container.querySelector("button")).toBeNull(); expect(container.querySelector<HTMLInputElement>("input[type=radio]")?.required).toBe(true); expect(container.querySelector("fieldset")?.getAttribute("aria-required")).toBe("true");
    render(h(Rating, { label: "Experience", onValueChange: change, readOnly: true, value: 3.6 })); const input = container.querySelector<HTMLInputElement>("input[value='2']")!; click(input); fire(input, new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })); expect(change).not.toHaveBeenCalled(); expect(container.querySelector<HTMLInputElement>("input[value='4']")?.checked).toBe(true);
    render(h(Rating, { disabled: true, label: "Experience", name: "rating", value: 99 })); expect(container.querySelector("fieldset")?.disabled).toBe(true); expect(container.querySelector<HTMLInputElement>("input[value='5']")?.checked).toBe(true);
  });
  it("keeps one current step while preserving an error marker on that step", () => {
    render(h(Stepper, { currentId: "two", items: [{ id: "one", label: "One", status: "current" }, { id: "two", label: "Two", status: "error" }] }));
    expect(container.querySelectorAll("[aria-current=step]")).toHaveLength(1); expect(container.querySelector("[aria-current=step] [data-icon=warning]")).not.toBeNull(); expect(container.querySelector("[aria-current=step]")?.textContent).toContain("Current");
  });
  it("uses previous/next radio semantics for vertical rating keys", () => {
    render(h(Rating, { defaultValue: 3, label: "Experience" }));
    fire(container.querySelector("input[value='3']")!, new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" })); expect(container.querySelector<HTMLInputElement>("input[value='2']")?.checked).toBe(true);
    fire(container.querySelector("input[value='2']")!, new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })); expect(container.querySelector<HTMLInputElement>("input[value='3']")?.checked).toBe(true);
  });
  it("localizes the complete summary announcement without forced word order", () => {
    render(h(ValidationSummary, { announcementKey: 1, announcementLabel: (title, count) => `${count} champs : ${title}`, errors: [{ id: "one", message: "Check amount" }], title: "Vérifiez" }));
    expect(container.querySelector("[aria-live]")?.textContent).toBe("1 champs : Vérifiez");
  });
  it("shows a non-color invalid cue even without an error message", () => {
    render(h(Rating, { invalid: true, label: "Experience", value: 3 }));
    expect(container.querySelector("fieldset")?.getAttribute("aria-invalid")).toBe("true"); expect(container.querySelector("legend [data-icon=warning]")).not.toBeNull(); expect(container.querySelector("fieldset")?.hasAttribute("data-invalid")).toBe(true);
  });
  it("server-renders all essentials without client-only globals", () => {
    const markup = renderToStaticMarkup(h("div", {}, h(Link, { href: "#guide" }, "Guide"), h(Chip, { label: "Local" }), h(InputGroup, { label: "Amount", leading: "$" }), h(PasswordField, { label: "Password" }), h(ValidationSummary, { errors: [{ id: "one", message: "Check value" }] }), h(Accordion, { items: [{ id: "one", title: "One", content: "Panel" }] }), h(Stepper, { items: [{ id: "one", label: "One" }] }), h(Rating, { label: "Experience" })));
    expect(markup).toContain('type="password"'); expect(markup).toContain('type="radio"'); expect(markup).not.toContain('role="alert"');
  });
});
