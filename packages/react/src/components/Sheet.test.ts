// @vitest-environment jsdom

import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sheet, type SheetProps } from "./Sheet";

type ActEnvironment = typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

let container: HTMLDivElement;
let root: Root;
let showModal: ReturnType<typeof vi.fn>;
let close: ReturnType<typeof vi.fn>;

function installDialogMethods(): void {
  showModal = vi.fn(function (this: HTMLDialogElement): void {
    if (this.open) throw new DOMException("The dialog is already open", "InvalidStateError");
    this.setAttribute("open", "");
  });
  close = vi.fn(function (this: HTMLDialogElement): void {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });

  Object.defineProperties(HTMLDialogElement.prototype, {
    close: { configurable: true, value: close, writable: true },
    showModal: { configurable: true, value: showModal, writable: true }
  });
}

function renderSheet(overrides: Partial<SheetProps> = {}): HTMLDialogElement {
  const props: SheetProps = {
    actions: createElement("button", { type: "button" }, "Close"),
    children: createElement("button", { type: "button" }, "Continue"),
    open: true,
    title: "Details",
    ...overrides
  };

  act(() => root.render(createElement(Sheet, props)));
  const dialog = container.querySelector("dialog");
  if (!(dialog instanceof HTMLDialogElement)) throw new Error("Sheet did not render a dialog");
  return dialog;
}

beforeEach(() => {
  (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT = true;
  installDialogMethods();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
  delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  delete (globalThis as ActEnvironment).IS_REACT_ACT_ENVIRONMENT;
  document.body.replaceChildren();
});

describe("Sheet", () => {
  it("opens with showModal, associates its title, enters focus, and restores focus", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open details";
    document.body.prepend(trigger);
    trigger.focus();

    const dialog = renderSheet();
    const title = dialog.querySelector(".ag-sheet__title");
    const closeButton = dialog.querySelector("button");

    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(dialog.hasAttribute("aria-modal")).toBe(false);
    expect(title?.id).toBeTruthy();
    expect(dialog.getAttribute("aria-labelledby")).toBe(title?.id);
    expect(document.activeElement).toBe(closeButton);

    renderSheet({ open: true });
    expect(showModal).toHaveBeenCalledOnce();

    renderSheet({ open: false });
    expect(close).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps the dialog modal and focused under Strict Mode", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open details";
    document.body.prepend(trigger);
    trigger.focus();

    act(() =>
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(Sheet, {
            actions: createElement("button", { type: "button" }, "Close"),
            children: "Sheet body",
            open: true,
            title: "Details"
          })
        )
      )
    );
    const dialog = container.querySelector("dialog");

    expect(dialog?.open).toBe(true);
    expect(showModal).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
    expect(dialog?.contains(document.activeElement)).toBe(true);
  });

  it("turns native cancellation into a controlled Escape dismissal", () => {
    const onOpenChange = vi.fn();
    const dialog = renderSheet({ onOpenChange });
    const cancelEvent = new Event("cancel", { cancelable: true });

    act(() => dialog.dispatchEvent(cancelEvent));

    expect(cancelEvent.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape" });
    expect(dialog.open).toBe(true);
  });

  it("lets consumers veto Escape dismissal through onCancel", () => {
    const onOpenChange = vi.fn();
    const dialog = renderSheet({
      onCancel: (event) => event.preventDefault(),
      onOpenChange
    });

    act(() => dialog.dispatchEvent(new Event("cancel", { cancelable: true })));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
  });

  it("dismisses only clicks geometrically outside the sheet surface", () => {
    const onOpenChange = vi.fn();
    const dialog = renderSheet({ onOpenChange });
    const surface = dialog.querySelector(".ag-sheet__surface");
    Object.defineProperty(dialog, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 300,
        height: 200,
        left: 100,
        right: 300,
        toJSON: () => ({}),
        top: 100,
        width: 200,
        x: 100,
        y: 100
      })
    });

    act(() => surface?.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 150, clientY: 150 })));
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 50, clientY: 150 })));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "backdrop" });
  });

  it("reports a native close that occurs while controlled open", () => {
    const onOpenChange = vi.fn();
    const dialog = renderSheet({ onOpenChange });

    act(() => dialog.close());

    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "native-close" });
  });

  it("provides focus containment and Escape dismissal when showModal is unavailable", () => {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    const background = document.createElement("main");
    background.textContent = "Background content";
    document.body.prepend(background);
    const trigger = document.createElement("button");
    trigger.textContent = "Open details";
    document.body.prepend(trigger);
    trigger.focus();
    const onOpenChange = vi.fn();
    const dialog = renderSheet({ onOpenChange });
    const scrim = dialog.querySelector(".ag-sheet__fallback-scrim") as HTMLElement;
    const buttons = dialog.querySelectorAll("button");
    const first = buttons.item(0);
    const last = buttons.item(buttons.length - 1);

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(scrim.getAttribute("aria-hidden")).toBe("true");
    expect(document.activeElement).toBe(first);
    expect(trigger.hasAttribute("inert")).toBe(true);
    expect(trigger.getAttribute("aria-hidden")).toBe("true");
    expect(background.hasAttribute("inert")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");

    last.focus();
    act(() => last.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" })));
    expect(document.activeElement).toBe(first);

    act(() => scrim.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "backdrop" });

    act(() => dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })));
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "escape" });

    renderSheet({ onOpenChange, open: false });
    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute("aria-modal")).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(trigger.hasAttribute("inert")).toBe(false);
    expect(trigger.hasAttribute("aria-hidden")).toBe(false);
    expect(background.hasAttribute("inert")).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
  });
});
