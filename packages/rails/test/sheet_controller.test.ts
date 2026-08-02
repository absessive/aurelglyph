// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type SheetController = {
  close: (target: string | HTMLDialogElement, reason?: string) => boolean;
  init: (root?: ParentNode) => HTMLDialogElement[];
  open: (target: string | HTMLDialogElement, trigger?: HTMLElement) => boolean;
  sync: (target: string | HTMLDialogElement) => boolean;
};

type DisclosureController = {
  close: (target: string | HTMLElement, reason?: string) => boolean;
  init: (root?: ParentNode) => HTMLElement[];
  open: (target: string | HTMLElement) => boolean;
  sync: (target: string | HTMLElement) => boolean;
};

type ComboboxController = DisclosureController & {
  select: (target: string | HTMLElement, value: string) => boolean;
};

type SelectionController = {
  init: (root?: ParentNode) => HTMLElement[];
  select: (target: string | HTMLElement, value: string) => boolean;
};

type AurelglyphWindow = Window & {
  Aurelglyph?: {
    comboboxes?: ComboboxController;
    destroy?: (root?: ParentNode, reason?: string) => void;
    init?: (root?: ParentNode) => unknown;
    menus?: DisclosureController;
    popovers?: DisclosureController;
    selections?: SelectionController;
    sheets?: SheetController;
    tooltips?: DisclosureController;
  };
};

const packageRoot = process.cwd().endsWith(`${sep}packages${sep}rails`)
  ? process.cwd()
  : resolve(process.cwd(), "packages/rails");
const controllerSource = readFileSync(resolve(packageRoot, "app/assets/javascripts/aurelglyph.js"), "utf8");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");

let closeDialog: ReturnType<typeof vi.fn>;
let showModal: ReturnType<typeof vi.fn>;

function controller(): SheetController {
  const api = (window as AurelglyphWindow).Aurelglyph?.sheets;
  if (!api) throw new Error("Aurelglyph sheet controller was not initialized");
  return api;
}

function aurelglyph(): NonNullable<AurelglyphWindow["Aurelglyph"]> {
  const api = (window as AurelglyphWindow).Aurelglyph;
  if (!api) throw new Error("Aurelglyph controller was not initialized");
  return api;
}

function installDialogMethods(): void {
  showModal = vi.fn(function (this: HTMLDialogElement): void {
    if (this.open) throw new DOMException("The dialog is already open", "InvalidStateError");
    this.setAttribute("open", "");
  });
  closeDialog = vi.fn(function (this: HTMLDialogElement): void {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new window.Event("close"));
  });

  Object.defineProperties(HTMLDialogElement.prototype, {
    close: { configurable: true, value: closeDialog, writable: true },
    showModal: { configurable: true, value: showModal, writable: true }
  });
}

function restoreDialogMethods(): void {
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
}

function renderSheet(open = false): {
  background: HTMLElement;
  dialog: HTMLDialogElement;
  dismiss: HTMLButtonElement;
  lastButton: HTMLButtonElement;
  trigger: HTMLButtonElement;
} {
  document.body.innerHTML = `
    <main id="background" aria-hidden="false" style="pointer-events: auto">
      <button type="button" data-aurelglyph-sheet-trigger="details-sheet">Open details</button>
    </main>
    <div id="sheet-host">
      <dialog
        aria-labelledby="details-title"
        class="ag-sheet"
        data-aurelglyph-sheet=""
        data-open="${open}"
        id="details-sheet"
        tabindex="-1"
      >
        <div class="ag-sheet__surface">
          <h2 class="ag-sheet__title" id="details-title">Details</h2>
          <button type="button" data-aurelglyph-sheet-dismiss>Close</button>
          <button type="button">Continue</button>
        </div>
      </dialog>
    </div>
  `;

  const background = document.querySelector<HTMLElement>("#background");
  const dialog = document.querySelector<HTMLDialogElement>("#details-sheet");
  const dismiss = document.querySelector<HTMLButtonElement>("[data-aurelglyph-sheet-dismiss]");
  const lastButton = dialog?.querySelector<HTMLButtonElement>("button:last-of-type");
  const trigger = document.querySelector<HTMLButtonElement>("[data-aurelglyph-sheet-trigger]");
  if (!background || !dialog || !dismiss || !lastButton || !trigger) throw new Error("Invalid sheet fixture");

  return { background, dialog, dismiss, lastButton, trigger };
}

async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

beforeAll(() => {
  window.eval(controllerSource);
});

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
  installDialogMethods();
});

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");
  restoreDialogMethods();
});

describe("Aurelglyph Rails sheet controller", () => {
  it("opens from a stable trigger, dismisses, synchronizes state, and restores focus", () => {
    const { background, dialog, dismiss, trigger } = renderSheet();
    const closeReasons: string[] = [];
    dialog.addEventListener("aurelglyph:sheet-close", (event) => {
      closeReasons.push((event as CustomEvent<{ reason: string }>).detail.reason);
    });
    trigger.focus();

    controller().init(document);
    expect(trigger.getAttribute("aria-controls")).toBe("details-sheet");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("data-open")).toBe("true");
    expect(dialog.hasAttribute("aria-modal")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(dismiss);
    expect(background.hasAttribute("inert")).toBe(false);

    dismiss.click();
    expect(closeDialog).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(false);
    expect(dialog.getAttribute("data-open")).toBe("false");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    expect(closeReasons).toEqual(["dismiss"]);
  });

  it("honors server-open intent and converts native cancel into an Escape close", () => {
    const { dialog, dismiss, trigger } = renderSheet(true);
    const closeReasons: string[] = [];
    dialog.addEventListener("aurelglyph:sheet-close", (event) => {
      closeReasons.push((event as CustomEvent<{ reason: string }>).detail.reason);
    });
    trigger.focus();

    controller().init(document);
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(dismiss);

    const cancel = new window.Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(dialog.getAttribute("data-open")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    expect(closeReasons).toEqual(["escape"]);
  });

  it("dismisses a geometric backdrop click but not an interior click", () => {
    const { dialog, lastButton, trigger } = renderSheet();
    const closeReasons: string[] = [];
    dialog.addEventListener("aurelglyph:sheet-close", (event) => {
      closeReasons.push((event as CustomEvent<{ reason: string }>).detail.reason);
    });
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

    controller().init(document);
    trigger.click();
    lastButton.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 150, clientY: 150 }));
    expect(dialog.open).toBe(true);

    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 50, clientY: 150 }));
    expect(dialog.open).toBe(false);
    expect(closeReasons).toEqual(["backdrop"]);
  });

  it("observes controlled data-open changes without a mutation feedback loop", async () => {
    const { dialog } = renderSheet();
    controller().init(document);

    dialog.setAttribute("data-open", "true");
    await flushMutations();
    await flushMutations();
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);

    dialog.setAttribute("data-open", "false");
    await flushMutations();
    await flushMutations();
    expect(closeDialog).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(false);
  });

  it("isolates and restores the page when showModal is unavailable", () => {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    const { background, dialog, dismiss, lastButton, trigger } = renderSheet();
    const surface = dialog.querySelector<HTMLElement>(".ag-sheet__surface");
    if (!surface) throw new Error("Invalid fallback sheet fixture");
    const authenticityToken = document.createElement("input");
    authenticityToken.name = "authenticity_token";
    authenticityToken.type = "hidden";
    const programmaticControl = document.createElement("button");
    programmaticControl.tabIndex = -1;
    programmaticControl.textContent = "Programmatic control";
    const closedDetails = document.createElement("details");
    closedDetails.innerHTML = '<summary>Advanced</summary><button autofocus type="button">Hidden action</button>';
    surface.prepend(authenticityToken);
    surface.prepend(closedDetails);
    surface.append(programmaticControl);
    Object.defineProperty(dialog, "open", { configurable: true, get: () => undefined });
    const closeReasons: string[] = [];
    dialog.addEventListener("aurelglyph:sheet-close", (event) => {
      closeReasons.push((event as CustomEvent<{ reason: string }>).detail.reason);
    });
    document.documentElement.style.overflow = "clip";
    document.documentElement.style.overscrollBehavior = "contain";
    document.body.style.overflow = "scroll";
    document.body.style.overscrollBehavior = "auto";
    trigger.focus();

    controller().init(document);
    trigger.click();
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(background.hasAttribute("inert")).toBe(true);
    expect(background.getAttribute("aria-hidden")).toBe("true");
    expect(background.style.pointerEvents).toBe("none");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(dismiss);

    lastButton.focus();
    lastButton.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    expect(document.activeElement).toBe(dismiss);

    dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(dialog.hasAttribute("aria-modal")).toBe(false);
    expect(background.hasAttribute("inert")).toBe(false);
    expect(background.getAttribute("aria-hidden")).toBe("false");
    expect(background.style.pointerEvents).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("clip");
    expect(document.documentElement.style.overscrollBehavior).toBe("contain");
    expect(document.body.style.overflow).toBe("scroll");
    expect(document.body.style.overscrollBehavior).toBe("auto");
    expect(document.activeElement).toBe(trigger);
    expect(closeReasons).toEqual(["escape"]);
  });

  it("dismisses a fallback sheet from a real outside target", () => {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    const { dialog, trigger } = renderSheet();

    controller().init(document);
    trigger.click();
    expect(dialog.hasAttribute("open")).toBe(true);

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(dialog.getAttribute("data-open")).toBe("false");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("unwinds fallback isolation when an open sheet is removed without destroy", () => {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    const { background, dialog, trigger } = renderSheet();

    controller().init(document);
    trigger.click();
    expect(background.hasAttribute("inert")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");

    dialog.remove();
    aurelglyph().init?.(document);
    expect(background.hasAttribute("inert")).toBe(false);
    expect(background.getAttribute("aria-hidden")).toBe("false");
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Aurelglyph Rails interaction controllers", () => {
  it("supports kind-specific dialog triggers and lifecycle events through the sheet kernel", () => {
    document.body.innerHTML = `
      <button data-aurelglyph-dialog-trigger="confirm-dialog" type="button">Confirm</button>
      <dialog data-aurelglyph-dialog="" data-aurelglyph-overlay="dialog" data-aurelglyph-sheet="" data-open="false" id="confirm-dialog" tabindex="-1">
        <button data-aurelglyph-dialog-dismiss="" type="button">Close</button>
      </dialog>
    `;
    const trigger = document.querySelector<HTMLButtonElement>("[data-aurelglyph-dialog-trigger]");
    const dialog = document.querySelector<HTMLDialogElement>("#confirm-dialog");
    const reasons: string[] = [];
    if (!trigger || !dialog) throw new Error("Invalid dialog fixture");
    dialog.addEventListener("aurelglyph:dialog-open", (event) => {
      reasons.push((event as CustomEvent<{ reason: string }>).detail.reason);
    });

    aurelglyph().init?.(document);
    trigger.click();
    expect(dialog.open).toBe(true);
    expect(reasons).toEqual(["trigger"]);
    dialog.querySelector<HTMLButtonElement>("[data-aurelglyph-dialog-dismiss]")?.click();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps non-dismissible dialogs open on Escape and backdrop interaction", () => {
    const { dialog, dismiss, trigger } = renderSheet();
    dialog.setAttribute("data-dismissible", "false");
    Object.defineProperty(dialog, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 300, height: 200, left: 100, right: 300, top: 100, width: 200, x: 100, y: 100 })
    });
    aurelglyph().init?.(document);
    trigger.click();

    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 20, clientY: 20 }));
    expect(dialog.open).toBe(true);
    dismiss.click();
    expect(dialog.open).toBe(true);
    aurelglyph().sheets?.close(dialog, "api");
    expect(dialog.open).toBe(false);
  });

  it("wires a trigger-only Turbo subtree to an existing sheet", () => {
    document.body.innerHTML = `
      <dialog data-aurelglyph-sheet="" data-open="false" id="global-sheet" tabindex="-1">
        <button type="button">Continue</button>
      </dialog>
    `;
    aurelglyph().init?.(document);
    const frame = document.createElement("section");
    frame.innerHTML = '<button data-aurelglyph-sheet-trigger="global-sheet" type="button">Open</button>';
    document.body.append(frame);
    const trigger = frame.querySelector<HTMLButtonElement>("button");
    if (!trigger) throw new Error("Invalid Turbo trigger fixture");
    expect(trigger.hasAttribute("aria-controls")).toBe(false);

    aurelglyph().init?.(frame);
    expect(trigger.getAttribute("aria-controls")).toBe("global-sheet");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("dismisses only the top nested layer for a backdrop click", () => {
    document.body.innerHTML = `
      <button data-aurelglyph-sheet-trigger="layered-sheet" type="button">Open</button>
      <dialog data-aurelglyph-sheet="" data-open="false" id="layered-sheet" tabindex="-1">
        <div data-aurelglyph-menu="" data-open="false" id="nested-menu">
          <button data-aurelglyph-menu-trigger="" type="button">Actions</button>
          <div data-aurelglyph-menu-content="" role="menu" hidden>
            <button data-aurelglyph-menu-item="" role="menuitem">Archive</button>
          </div>
        </div>
      </dialog>
    `;
    const sheet = document.querySelector<HTMLDialogElement>("#layered-sheet");
    const sheetTrigger = document.querySelector<HTMLButtonElement>("[data-aurelglyph-sheet-trigger]");
    const menu = document.querySelector<HTMLElement>("#nested-menu");
    const menuTrigger = menu?.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-trigger]");
    if (!sheet || !sheetTrigger || !menu || !menuTrigger) throw new Error("Invalid layered fixture");
    Object.defineProperty(sheet, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ bottom: 300, height: 200, left: 100, right: 300, top: 100, width: 200, x: 100, y: 100 })
    });

    aurelglyph().init?.(document);
    sheetTrigger.click();
    menuTrigger.click();
    expect(sheet.open).toBe(true);
    expect(menu.getAttribute("data-open")).toBe("true");

    sheet.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 20, clientY: 20 }));
    expect(menu.getAttribute("data-open")).toBe("false");
    expect(sheet.open).toBe(true);
    sheet.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 20, clientY: 20 }));
    expect(sheet.open).toBe(false);
  });

  it("resets descendant interaction state when an ancestor closes", () => {
    document.body.innerHTML = `
      <dialog data-aurelglyph-sheet="" data-open="true" id="parent-sheet" tabindex="-1">
        <div data-aurelglyph-popover="" data-open="true" id="nested-popover">
          <button data-aurelglyph-popover-trigger="" type="button">Details</button>
          <div data-aurelglyph-popover-content="" tabindex="-1">
            <div data-aurelglyph-menu="" data-open="true" id="nested-menu">
              <button data-aurelglyph-menu-trigger="" type="button">Actions</button>
              <div data-aurelglyph-menu-content="" role="menu">
                <button data-aurelglyph-menu-item="" role="menuitem">Archive</button>
              </div>
            </div>
          </div>
        </div>
        <dialog data-aurelglyph-sheet="" data-open="true" id="nested-sheet" tabindex="-1">
          <button type="button">Nested action</button>
        </dialog>
      </dialog>
    `;
    const parent = document.querySelector<HTMLDialogElement>("#parent-sheet");
    const nestedSheet = document.querySelector<HTMLDialogElement>("#nested-sheet");
    const popover = document.querySelector<HTMLElement>("#nested-popover");
    const popoverContent = popover?.querySelector<HTMLElement>("[data-aurelglyph-popover-content]");
    const menu = document.querySelector<HTMLElement>("#nested-menu");
    const menuContent = menu?.querySelector<HTMLElement>("[data-aurelglyph-menu-content]");
    if (!parent || !nestedSheet || !popover || !popoverContent || !menu || !menuContent) {
      throw new Error("Invalid ancestor-close fixture");
    }

    aurelglyph().init?.(document);
    expect(parent.open).toBe(true);
    expect(nestedSheet.open).toBe(true);
    expect(popover.getAttribute("data-open")).toBe("true");
    expect(menu.getAttribute("data-open")).toBe("true");

    parent.close();
    expect(parent.getAttribute("data-open")).toBe("false");
    expect(nestedSheet.open).toBe(false);
    expect(nestedSheet.getAttribute("data-open")).toBe("false");
    expect(popover.getAttribute("data-open")).toBe("false");
    expect(popoverContent.hidden).toBe(true);
    expect(menu.getAttribute("data-open")).toBe("false");
    expect(menuContent.hidden).toBe(true);

    expect(aurelglyph().sheets?.open(parent)).toBe(true);
    expect(nestedSheet.open).toBe(false);
    expect(popoverContent.hidden).toBe(true);
    expect(menuContent.hidden).toBe(true);
  });

  it("normalizes an initially open disclosure inside a closed ancestor", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-popover="" data-open="false" id="closed-popover">
        <button data-aurelglyph-popover-trigger="" type="button">Details</button>
        <div data-aurelglyph-popover-content="" tabindex="-1" hidden>
          <div data-aurelglyph-menu="" data-open="true" id="stale-menu">
            <button data-aurelglyph-menu-trigger="" type="button">Actions</button>
            <div data-aurelglyph-menu-content="" role="menu">
              <button data-aurelglyph-menu-item="" role="menuitem">Archive</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const popover = document.querySelector<HTMLElement>("#closed-popover");
    const menu = document.querySelector<HTMLElement>("#stale-menu");
    const menuContent = menu?.querySelector<HTMLElement>("[data-aurelglyph-menu-content]");
    if (!popover || !menu || !menuContent) throw new Error("Invalid initial ancestor fixture");

    aurelglyph().init?.(document);
    expect(menu.getAttribute("data-open")).toBe("false");
    expect(menuContent.hidden).toBe(true);
    expect(aurelglyph().popovers?.open(popover)).toBe(true);
    expect(menu.getAttribute("data-open")).toBe("false");
    expect(menuContent.hidden).toBe(true);
  });

  it("refuses to open a nested sheet while its ancestor is closed", async () => {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    document.body.innerHTML = `
      <main id="background">Workbench</main>
      <dialog data-aurelglyph-sheet="" data-open="false" id="outer-sheet" tabindex="-1">
        <dialog data-aurelglyph-sheet="" data-open="true" id="orphan-sheet" tabindex="-1">
          <button type="button">Nested action</button>
        </dialog>
      </dialog>
    `;
    const outer = document.querySelector<HTMLDialogElement>("#outer-sheet");
    const orphan = document.querySelector<HTMLDialogElement>("#orphan-sheet");
    const background = document.querySelector<HTMLElement>("#background");
    let opens = 0;
    if (!outer || !orphan || !background) throw new Error("Invalid orphan-sheet fixture");
    orphan.addEventListener("aurelglyph:sheet-open", () => {
      opens += 1;
    });

    aurelglyph().init?.(document);
    expect(opens).toBe(0);
    expect(orphan.hasAttribute("open")).toBe(false);
    expect(orphan.getAttribute("data-open")).toBe("false");
    expect(background.hasAttribute("inert")).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
    expect(aurelglyph().sheets?.open(orphan)).toBe(false);

    orphan.setAttribute("data-open", "true");
    await flushMutations();
    expect(opens).toBe(0);
    expect(orphan.hasAttribute("open")).toBe(false);
    expect(orphan.getAttribute("data-open")).toBe("false");
    expect(background.hasAttribute("inert")).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("refuses to open a detached interaction layer", () => {
    const detached = document.createElement("dialog");
    detached.id = "detached-sheet";
    detached.setAttribute("data-aurelglyph-sheet", "");
    detached.setAttribute("data-open", "false");

    expect(aurelglyph().sheets?.open(detached)).toBe(false);
    expect(detached.hasAttribute("open")).toBe(false);
    expect(detached.getAttribute("data-open")).toBe("false");
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
  });

  it("refuses invisible open intent under closed disclosures and aria-hidden ancestors", () => {
    document.body.innerHTML = `
      <details>
        <summary>Advanced</summary>
        <dialog data-aurelglyph-sheet="" data-open="true" id="details-sheet" tabindex="-1">
          <button type="button">Action</button>
        </dialog>
      </details>
      <div aria-hidden="true">
        <div data-aurelglyph-popover="" data-open="true" id="hidden-popover">
          <button data-aurelglyph-popover-trigger="" type="button">Hidden</button>
          <div data-aurelglyph-popover-content="" tabindex="-1">Content</div>
        </div>
      </div>
    `;
    const sheet = document.querySelector<HTMLDialogElement>("#details-sheet");
    const popover = document.querySelector<HTMLElement>("#hidden-popover");
    let sheetOpens = 0;
    let popoverOpens = 0;
    if (!sheet || !popover) throw new Error("Invalid disclosure gate fixture");
    sheet.addEventListener("aurelglyph:sheet-open", () => {
      sheetOpens += 1;
    });
    popover.addEventListener("aurelglyph:popover-open", () => {
      popoverOpens += 1;
    });

    aurelglyph().init?.(document);
    expect(sheetOpens).toBe(0);
    expect(popoverOpens).toBe(0);
    expect(sheet.open).toBe(false);
    expect(sheet.getAttribute("data-open")).toBe("false");
    expect(popover.getAttribute("data-open")).toBe("false");
  });

  it("provides roving menu focus, typeahead, selection events, and dismissal", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-menu="" data-open="false" id="actions-menu">
        <button data-aurelglyph-menu-trigger="" aria-controls="actions-menu-content" aria-expanded="false">Actions</button>
        <div data-aurelglyph-menu-content="" id="actions-menu-content" role="menu" hidden>
          <button data-aurelglyph-menu-item="" data-value="open" role="menuitem" tabindex="-1">Open</button>
          <button data-aurelglyph-menu-item="" data-value="delete" role="menuitem" tabindex="-1" disabled>Delete</button>
          <button data-aurelglyph-menu-item="" data-value="archive" role="menuitem" tabindex="-1">Archive</button>
        </div>
      </div>
      <button id="outside">Outside</button>
    `;
    const menu = document.querySelector<HTMLElement>("#actions-menu");
    const trigger = menu?.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-trigger]");
    const items = menu?.querySelectorAll<HTMLButtonElement>("[data-aurelglyph-menu-item]");
    const selected: string[] = [];
    if (!menu || !trigger || !items) throw new Error("Invalid menu fixture");
    menu.addEventListener("aurelglyph:menu-select", (event) => {
      selected.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    aurelglyph().init?.(document);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
    expect(menu.getAttribute("data-open")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(items[0]);

    items[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(items[2]);
    aurelglyph().init?.(document);
    aurelglyph().init?.(document);
    expect(document.activeElement).toBe(items[2]);
    expect(menu.getAttribute("data-open")).toBe("true");
    items[2].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "o" }));
    expect(document.activeElement).toBe(items[0]);

    items[0].click();
    expect(selected).toEqual(["open"]);
    expect(menu.getAttribute("data-open")).toBe("false");
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    expect(menu.getAttribute("data-open")).toBe("true");
    document.querySelector<HTMLButtonElement>("#outside")?.click();
    expect(menu.getAttribute("data-open")).toBe("false");
  });

  it("cycles menu typeahead, activates anchors, and escapes disabled focus states", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-menu="" data-open="false" id="keyboard-menu">
        <button data-aurelglyph-menu-trigger="" type="button">Actions</button>
        <div data-aurelglyph-menu-content="" role="menu" hidden>
          <a data-aurelglyph-menu-item="" data-value="alpha" href="#alpha" role="menuitem" tabindex="-1">Alpha</a>
          <button data-aurelglyph-menu-item="" data-value="archive" role="menuitem" tabindex="-1">Archive</button>
          <button data-aurelglyph-menu-item="" data-value="beta" role="menuitem" tabindex="-1">Beta</button>
        </div>
      </div>
      <div data-aurelglyph-menu="" data-open="false" id="empty-menu">
        <button data-aurelglyph-menu-trigger="" type="button">Empty</button>
        <div data-aurelglyph-menu-content="" role="menu" hidden></div>
      </div>
    `;
    const menu = document.querySelector<HTMLElement>("#keyboard-menu");
    const trigger = menu?.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-trigger]");
    const alpha = menu?.querySelector<HTMLAnchorElement>("[data-value='alpha']");
    const archive = menu?.querySelector<HTMLButtonElement>("[data-value='archive']");
    const beta = menu?.querySelector<HTMLButtonElement>("[data-value='beta']");
    const emptyMenu = document.querySelector<HTMLElement>("#empty-menu");
    const emptyTrigger = emptyMenu?.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-trigger]");
    const selected: string[] = [];
    if (!menu || !trigger || !alpha || !archive || !beta || !emptyMenu || !emptyTrigger) {
      throw new Error("Invalid keyboard menu fixture");
    }
    alpha.addEventListener("click", (event) => event.preventDefault());
    menu.addEventListener("aurelglyph:menu-select", (event) => {
      selected.push((event as CustomEvent<{ value: string }>).detail.value);
    });

    aurelglyph().init?.(document);
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(alpha);
    alpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "a" }));
    expect(document.activeElement).toBe(archive);
    archive.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "a" }));
    expect(document.activeElement).toBe(alpha);
    alpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " " }));
    expect(selected).toEqual(["alpha"]);
    expect(menu.getAttribute("data-open")).toBe("false");

    trigger.click();
    alpha.setAttribute("aria-disabled", "true");
    alpha.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(archive);
    expect(archive.tabIndex).toBe(0);

    emptyTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
    expect(emptyMenu.getAttribute("data-open")).toBe("true");
    const escape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
    emptyTrigger.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(emptyMenu.getAttribute("data-open")).toBe("false");
    emptyTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
    const tab = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" });
    emptyTrigger.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(emptyMenu.getAttribute("data-open")).toBe("false");
  });

  it("preserves named menu and command items as successful form submitters", () => {
    document.body.innerHTML = `
      <form id="action-form">
        <div data-aurelglyph-menu="" data-open="false" id="submit-menu">
          <button type="button" data-aurelglyph-menu-trigger="" aria-controls="submit-menu-content">Actions</button>
          <div data-aurelglyph-menu-content="" id="submit-menu-content" role="menu" hidden>
            <button type="submit" name="action" value="archive" data-aurelglyph-menu-item="" role="menuitem">Archive</button>
          </div>
        </div>
        <div data-aurelglyph-command-palette="">
          <input data-aurelglyph-command-input="" />
          <div data-aurelglyph-command-list="">
            <button type="submit" name="command" value="deploy" data-aurelglyph-command-item="" role="option">Deploy</button>
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("#action-form");
    const menuItem = document.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-item]");
    const commandItem = document.querySelector<HTMLButtonElement>("[data-aurelglyph-command-item]");
    if (!form || !menuItem || !commandItem) throw new Error("Invalid submitter fixture");

    const submissions: Array<Record<string, FormDataEntryValue>> = [];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const submitter = (event as SubmitEvent).submitter;
      submissions.push(Object.fromEntries(new FormData(form, submitter).entries()));
    });

    aurelglyph().menus?.open("submit-menu");
    menuItem.click();
    commandItem.click();

    expect(submissions).toEqual([{ action: "archive" }, { command: "deploy" }]);
  });

  it("normalizes unavailable menus and comboboxes and blocks stale selection", async () => {
    document.body.innerHTML = `
      <form id="unavailable-form">
        <div data-aurelglyph-menu="" data-disabled="true" data-open="true" id="disabled-menu">
          <button data-aurelglyph-menu-trigger="" disabled type="button">Actions</button>
          <div data-aurelglyph-menu-content="" role="menu">
            <button data-aurelglyph-menu-item="" data-value="archive" name="action" type="submit" value="archive">Archive</button>
          </div>
        </div>
        <div data-aurelglyph-combobox="" data-disabled="true" data-open="true" id="disabled-combobox">
          <input data-aurelglyph-combobox-input="" disabled />
          <input data-aurelglyph-combobox-value="" name="system" type="hidden" value="alpha" />
          <div data-aurelglyph-combobox-listbox=""><div data-aurelglyph-combobox-option="" data-label="Beta" data-value="beta">Beta</div></div>
        </div>
        <div data-aurelglyph-combobox="" data-open="true" data-readonly="true" id="readonly-combobox">
          <input data-aurelglyph-combobox-input="" readonly />
          <input data-aurelglyph-combobox-value="" name="readonly_system" type="hidden" value="alpha" />
          <div data-aurelglyph-combobox-listbox=""><div data-aurelglyph-combobox-option="" data-label="Beta" data-value="beta">Beta</div></div>
        </div>
      </form>
    `;
    const menu = document.querySelector<HTMLElement>("#disabled-menu");
    const menuContent = menu?.querySelector<HTMLElement>("[data-aurelglyph-menu-content]");
    const menuItem = menu?.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-item]");
    const disabledCombobox = document.querySelector<HTMLElement>("#disabled-combobox");
    const readonlyCombobox = document.querySelector<HTMLElement>("#readonly-combobox");
    const disabledValue = disabledCombobox?.querySelector<HTMLInputElement>("[data-aurelglyph-combobox-value]");
    const readonlyValue = readonlyCombobox?.querySelector<HTMLInputElement>("[data-aurelglyph-combobox-value]");
    const form = document.querySelector<HTMLFormElement>("#unavailable-form");
    if (!menu || !menuContent || !menuItem || !disabledCombobox || !readonlyCombobox || !disabledValue || !readonlyValue || !form) {
      throw new Error("Invalid unavailable fixture");
    }
    const selected: string[] = [];
    let submits = 0;
    menu.addEventListener("aurelglyph:menu-select", () => selected.push("menu"));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submits += 1;
    });

    aurelglyph().init?.(document);
    expect(menu.getAttribute("data-open")).toBe("false");
    expect(menuContent.hidden).toBe(true);
    expect(disabledCombobox.getAttribute("data-open")).toBe("false");
    expect(readonlyCombobox.getAttribute("data-open")).toBe("false");
    menuItem.click();
    disabledCombobox.querySelector<HTMLElement>("[data-aurelglyph-combobox-option]")?.click();
    readonlyCombobox.querySelector<HTMLElement>("[data-aurelglyph-combobox-option]")?.click();
    expect(selected).toEqual([]);
    expect(submits).toBe(0);
    expect(disabledValue.value).toBe("alpha");
    expect(readonlyValue.value).toBe("alpha");
    expect(aurelglyph().comboboxes?.select("disabled-combobox", "beta")).toBe(false);
    expect(aurelglyph().comboboxes?.select("readonly-combobox", "beta")).toBe(false);

    menu.removeAttribute("data-disabled");
    menu.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-trigger]")?.removeAttribute("disabled");
    aurelglyph().menus?.open(menu);
    expect(menu.getAttribute("data-open")).toBe("true");
    menu.setAttribute("data-disabled", "true");
    await flushMutations();
    expect(menu.getAttribute("data-open")).toBe("false");
  });

  it("opens popovers, restores focus on Escape, and closes outside without stealing focus", () => {
    document.body.innerHTML = `
      <span data-aurelglyph-popover="" data-open="false" id="filters-popover">
        <button data-aurelglyph-popover-trigger="" aria-controls="filters-content" aria-expanded="false">Filters</button>
        <div data-aurelglyph-popover-content="" id="filters-content" role="dialog" tabindex="-1" hidden>
          <button type="button" data-aurelglyph-popover-dismiss="">Apply</button>
        </div>
      </span>
      <button id="outside">Outside</button>
    `;
    const popover = document.querySelector<HTMLElement>("#filters-popover");
    const trigger = popover?.querySelector<HTMLButtonElement>("[data-aurelglyph-popover-trigger]");
    const dismiss = popover?.querySelector<HTMLButtonElement>("[data-aurelglyph-popover-dismiss]");
    const outside = document.querySelector<HTMLButtonElement>("#outside");
    if (!popover || !trigger || !dismiss || !outside) throw new Error("Invalid popover fixture");

    aurelglyph().init?.(document);
    trigger.click();
    expect(popover.getAttribute("data-open")).toBe("true");
    expect(document.activeElement).toBe(dismiss);
    aurelglyph().init?.(document);
    expect(document.activeElement).toBe(dismiss);
    dismiss.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(popover.getAttribute("data-open")).toBe("false");
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    outside.focus();
    outside.click();
    expect(popover.getAttribute("data-open")).toBe("false");
    expect(document.activeElement).toBe(outside);
  });

  it("keeps controlled disabled popovers open while gating their trigger", () => {
    document.body.innerHTML = `
      <span data-aurelglyph-popover="" data-open="true" id="controlled-popover">
        <button data-aurelglyph-popover-trigger="" disabled type="button">Filters</button>
        <div data-aurelglyph-popover-content="" role="dialog"><button type="button">Apply</button></div>
      </span>
    `;
    const popover = document.querySelector<HTMLElement>("#controlled-popover");
    const trigger = popover?.querySelector<HTMLButtonElement>("[data-aurelglyph-popover-trigger]");
    const content = popover?.querySelector<HTMLElement>("[data-aurelglyph-popover-content]");
    if (!popover || !trigger || !content) throw new Error("Invalid controlled popover fixture");

    aurelglyph().init?.(document);
    expect(popover.getAttribute("data-open")).toBe("true");
    expect(content.hidden).toBe(false);
    trigger.click();
    expect(popover.getAttribute("data-open")).toBe("true");
    aurelglyph().popovers?.close(popover);
    expect(content.hidden).toBe(true);
  });

  it("defers submit dismissals until validation succeeds", () => {
    document.body.innerHTML = `
      <form id="sheet-form">
        <button data-aurelglyph-sheet-trigger="form-sheet" type="button">Open sheet</button>
        <dialog data-aurelglyph-sheet="" data-open="false" id="form-sheet" tabindex="-1">
          <input name="title" required />
          <button data-aurelglyph-sheet-dismiss="" name="commit" type="submit" value="save">Save</button>
        </dialog>
      </form>
      <form id="popover-form">
        <span data-aurelglyph-popover="" data-open="true" id="form-popover">
          <button data-aurelglyph-popover-trigger="" type="button">Open popover</button>
          <span data-aurelglyph-popover-content="" role="dialog">
            <input name="query" required />
            <button data-aurelglyph-popover-dismiss="" name="apply" type="submit" value="filters">Apply</button>
          </span>
        </span>
      </form>
    `;
    const sheet = document.querySelector<HTMLDialogElement>("#form-sheet");
    const sheetTrigger = document.querySelector<HTMLButtonElement>("[data-aurelglyph-sheet-trigger]");
    const sheetInput = document.querySelector<HTMLInputElement>("#sheet-form input");
    const sheetSubmit = document.querySelector<HTMLButtonElement>("#sheet-form [type='submit']");
    const popover = document.querySelector<HTMLElement>("#form-popover");
    const popoverInput = document.querySelector<HTMLInputElement>("#popover-form input");
    const popoverSubmit = document.querySelector<HTMLButtonElement>("#popover-form [type='submit']");
    const submissions: Array<Record<string, FormDataEntryValue>> = [];
    if (!sheet || !sheetTrigger || !sheetInput || !sheetSubmit || !popover || !popoverInput || !popoverSubmit) {
      throw new Error("Invalid validation fixture");
    }
    document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const submitter = (event as SubmitEvent).submitter;
        submissions.push(Object.fromEntries(new FormData(form, submitter).entries()));
      });
    });

    aurelglyph().init?.(document);
    popoverSubmit.click();
    expect(popover.getAttribute("data-open")).toBe("true");
    expect(submissions).toEqual([]);

    popoverInput.value = "Active";
    popoverSubmit.click();
    expect(popover.getAttribute("data-open")).toBe("false");
    expect(submissions).toEqual([{ query: "Active", apply: "filters" }]);

    sheetTrigger.click();
    sheetSubmit.click();
    expect(sheet.open).toBe(true);
    expect(submissions).toHaveLength(1);

    sheetInput.value = "System";
    sheetSubmit.click();
    expect(sheet.open).toBe(false);
    expect(submissions).toEqual([
      { query: "Active", apply: "filters" },
      { title: "System", commit: "save" }
    ]);
  });

  it("does not retain a dismiss reason from canceled dialog-method submission", async () => {
    document.body.innerHTML = `
      <button data-aurelglyph-sheet-trigger="method-dialog" type="button">Open</button>
      <dialog data-aurelglyph-sheet="" data-open="false" id="method-dialog" tabindex="-1">
        <form method="dialog">
          <input name="title" required />
          <button data-aurelglyph-sheet-dismiss="" type="submit">Save</button>
        </form>
      </dialog>
    `;
    const dialog = document.querySelector<HTMLDialogElement>("#method-dialog");
    const trigger = document.querySelector<HTMLButtonElement>("[data-aurelglyph-sheet-trigger]");
    const form = dialog?.querySelector<HTMLFormElement>("form");
    const input = dialog?.querySelector<HTMLInputElement>("input");
    const submit = dialog?.querySelector<HTMLButtonElement>("button");
    const reasons: string[] = [];
    if (!dialog || !trigger || !form || !input || !submit) throw new Error("Invalid dialog-method fixture");
    dialog.addEventListener("aurelglyph:sheet-close", (event) => {
      reasons.push((event as CustomEvent<{ reason: string }>).detail.reason);
    });

    aurelglyph().init?.(document);
    trigger.click();
    submit.click();
    dialog.close();
    expect(reasons).toEqual(["native-close"]);

    trigger.click();
    input.value = "System";
    form.addEventListener("submit", (event) => event.preventDefault(), { once: true });
    submit.click();
    expect(dialog.open).toBe(true);
    await flushMutations();
    dialog.close();
    expect(reasons).toEqual(["native-close", "native-close"]);
  });

  it("lets a fallback sheet handle the second Escape from a nested command palette", () => {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    document.body.innerHTML = `
      <button data-aurelglyph-sheet-trigger="command-sheet" type="button">Open</button>
      <dialog data-aurelglyph-sheet="" data-open="false" id="command-sheet" tabindex="-1">
        <div data-aurelglyph-command-palette="">
          <input data-aurelglyph-command-input="" value="archive" />
          <div data-aurelglyph-command-list=""><button data-aurelglyph-command-item="" data-label="Archive">Archive</button></div>
        </div>
      </dialog>
    `;
    const dialog = document.querySelector<HTMLDialogElement>("#command-sheet");
    const trigger = document.querySelector<HTMLButtonElement>("[data-aurelglyph-sheet-trigger]");
    const input = dialog?.querySelector<HTMLInputElement>("[data-aurelglyph-command-input]");
    if (!dialog || !trigger || !input) throw new Error("Invalid nested command fixture");

    aurelglyph().init?.(document);
    trigger.click();
    const clearEscape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
    input.dispatchEvent(clearEscape);
    expect(clearEscape.defaultPrevented).toBe(true);
    expect(input.value).toBe("");
    expect(dialog.hasAttribute("open")).toBe(true);

    const closeEscape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
    input.dispatchEvent(closeEscape);
    expect(closeEscape.defaultPrevented).toBe(true);
    expect(dialog.hasAttribute("open")).toBe(false);
  });

  it("dismisses one nested keyboard layer per Escape", () => {
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
    document.body.innerHTML = `
      <dialog data-aurelglyph-sheet="" data-open="true" id="layer-sheet" tabindex="-1">
        <div data-aurelglyph-popover="" data-open="true" id="layer-popover">
          <button data-aurelglyph-popover-trigger="" type="button">Popover</button>
          <div data-aurelglyph-popover-content="" role="dialog" tabindex="-1">
            <div data-aurelglyph-menu="" data-open="true" id="layer-menu">
              <button data-aurelglyph-menu-trigger="" type="button">Menu</button>
              <div data-aurelglyph-menu-content="" role="menu">
                <button data-aurelglyph-menu-item="" role="menuitem">Archive</button>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    `;
    const sheet = document.querySelector<HTMLDialogElement>("#layer-sheet");
    const popover = document.querySelector<HTMLElement>("#layer-popover");
    const menu = document.querySelector<HTMLElement>("#layer-menu");
    const menuItem = menu?.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-item]");
    const menuTrigger = menu?.querySelector<HTMLButtonElement>("[data-aurelglyph-menu-trigger]");
    const popoverTrigger = popover?.querySelector<HTMLButtonElement>("[data-aurelglyph-popover-trigger]");
    if (!sheet || !popover || !menu || !menuItem || !menuTrigger || !popoverTrigger) {
      throw new Error("Invalid nested layer fixture");
    }

    aurelglyph().init?.(document);
    menuItem.focus();
    menuItem.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(menu.getAttribute("data-open")).toBe("false");
    expect(popover.getAttribute("data-open")).toBe("true");
    expect(sheet.hasAttribute("open")).toBe(true);

    menuTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(popover.getAttribute("data-open")).toBe("false");
    expect(sheet.hasAttribute("open")).toBe(true);

    popoverTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(sheet.hasAttribute("open")).toBe(false);
  });

  it("filters combobox options and selects with an active descendant", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-combobox="" data-open="false" id="systems-combobox">
        <input data-aurelglyph-combobox-input="" role="combobox" aria-controls="systems-list" aria-expanded="false" required />
        <button data-aurelglyph-combobox-toggle="" type="button">Toggle</button>
        <input data-aurelglyph-combobox-value="" name="system" type="hidden" />
        <ul data-aurelglyph-combobox-listbox="" id="systems-list" role="listbox" hidden>
          <li data-aurelglyph-combobox-option="" data-label="Alpha" data-value="alpha" id="system-alpha" role="option" aria-selected="false">Alpha</li>
          <li data-aurelglyph-combobox-option="" data-keywords="second system" data-label="Beta" data-value="beta" id="system-beta" role="option" aria-selected="false">Beta</li>
          <li data-aurelglyph-combobox-option="" data-label="Blocked" data-value="blocked" id="system-blocked" role="option" aria-selected="false" aria-disabled="true">Blocked</li>
        </ul>
        <span data-aurelglyph-combobox-empty="" hidden>No results</span>
      </div>
    `;
    const combobox = document.querySelector<HTMLElement>("#systems-combobox");
    const input = combobox?.querySelector<HTMLInputElement>("[data-aurelglyph-combobox-input]");
    const value = combobox?.querySelector<HTMLInputElement>("[data-aurelglyph-combobox-value]");
    const alpha = combobox?.querySelector<HTMLElement>("#system-alpha");
    const beta = combobox?.querySelector<HTMLElement>("#system-beta");
    const selected: Array<{ label: string; value: string }> = [];
    if (!combobox || !input || !value || !alpha || !beta) throw new Error("Invalid combobox fixture");
    combobox.addEventListener("aurelglyph:combobox-select", (event) => {
      selected.push((event as CustomEvent<{ label: string; value: string }>).detail);
    });

    aurelglyph().init?.(document);
    input.value = "second";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(combobox.getAttribute("data-open")).toBe("true");
    expect(alpha.hidden).toBe(true);
    expect(beta.hidden).toBe(false);
    expect(input.validationMessage).toBe("Select an option.");

    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }));
    expect(input.getAttribute("aria-activedescendant")).toBe("system-beta");
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
    expect(value.value).toBe("beta");
    expect(input.validationMessage).toBe("");
    expect(input.value).toBe("Beta");
    expect(beta.getAttribute("aria-selected")).toBe("true");
    expect(combobox.getAttribute("data-open")).toBe("false");
    expect(selected).toMatchObject([{ label: "Beta", value: "beta" }]);

    input.value = "";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(value.value).toBe("");
    expect(beta.getAttribute("aria-selected")).toBe("false");
    expect(beta.classList.contains("is-selected")).toBe(false);
    expect(Array.from(combobox.querySelectorAll("[data-aurelglyph-combobox-option]")).every((option) => {
      return option.getAttribute("aria-selected") === "false" && !option.classList.contains("is-selected");
    })).toBe(true);
    input.focus();
    const optionMouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    alpha.dispatchEvent(optionMouseDown);
    expect(optionMouseDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    alpha.click();
    expect(value.value).toBe("alpha");
    expect(combobox.getAttribute("data-open")).toBe("false");
  });

  it("dismisses a combobox when focus moves outside the widget", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-combobox="" data-open="false" id="focus-combobox">
        <input data-aurelglyph-combobox-input="" role="combobox" aria-controls="focus-options" aria-expanded="false" />
        <button data-aurelglyph-combobox-toggle="" type="button">Toggle</button>
        <input data-aurelglyph-combobox-value="" name="system" type="hidden" />
        <ul data-aurelglyph-combobox-listbox="" id="focus-options" role="listbox" hidden>
          <li data-aurelglyph-combobox-option="" data-label="Alpha" data-value="alpha" role="option">Alpha</li>
        </ul>
      </div>
      <button id="outside" type="button">Outside</button>
    `;
    const combobox = document.querySelector<HTMLElement>("#focus-combobox");
    const input = combobox?.querySelector<HTMLInputElement>("[data-aurelglyph-combobox-input]");
    const list = combobox?.querySelector<HTMLElement>("[data-aurelglyph-combobox-listbox]");
    const outside = document.querySelector<HTMLButtonElement>("#outside");
    if (!combobox || !input || !list || !outside) throw new Error("Invalid focusout fixture");

    aurelglyph().init?.(document);
    input.focus();
    expect(combobox.getAttribute("data-open")).toBe("true");

    outside.focus();
    expect(combobox.getAttribute("data-open")).toBe("false");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(list.hidden).toBe(true);
  });

  it("shows tooltips from focus and wires number-field step controls", () => {
    document.body.innerHTML = `
      <span data-aurelglyph-tooltip="" data-open="false" id="settings-tooltip">
        <button aria-describedby="settings-tip">Settings</button>
        <span data-aurelglyph-tooltip-content="" id="settings-tip" role="tooltip" hidden>Open settings</span>
      </span>
      <div data-aurelglyph-number-field="" id="retries-field">
        <button data-aurelglyph-number-step="-1" type="button">Less</button>
        <input max="3" min="0" step="1" type="number" value="1" />
        <button data-aurelglyph-number-step="1" type="button">More</button>
      </div>
      <div data-aurelglyph-number-field="" id="batch-field">
        <button data-aurelglyph-number-step="-1" type="button">Less</button>
        <input max="10" min="0" step="3" type="number" value="9" />
        <button data-aurelglyph-number-step="1" type="button">More</button>
      </div>
      <div data-aurelglyph-number-field="" id="blank-field">
        <button data-aurelglyph-number-step="-1" type="button">Less</button>
        <input min="5" step="3" type="number" value="" />
        <button data-aurelglyph-number-step="1" type="button">More</button>
      </div>
      <div data-aurelglyph-number-field="" id="negative-blank-field">
        <button data-aurelglyph-number-step="-1" type="button">Less</button>
        <input max="-5" step="1" type="number" value="" />
        <button data-aurelglyph-number-step="1" type="button">More</button>
      </div>
      <div data-aurelglyph-slider="" id="volume-slider">
        <output data-aurelglyph-slider-output="">20</output>
        <input max="100" min="0" type="range" value="20" />
      </div>
    `;
    const tooltip = document.querySelector<HTMLElement>("#settings-tooltip");
    const tooltipTrigger = tooltip?.querySelector<HTMLButtonElement>("button");
    const tooltipContent = tooltip?.querySelector<HTMLElement>("[role='tooltip']");
    const numberInput = document.querySelector<HTMLInputElement>("#retries-field input");
    const increment = document.querySelector<HTMLButtonElement>("[data-aurelglyph-number-step='1']");
    const edgeInput = document.querySelector<HTMLInputElement>("#batch-field input");
    const edgeDecrement = document.querySelector<HTMLButtonElement>("#batch-field [data-aurelglyph-number-step='-1']");
    const edgeIncrement = document.querySelector<HTMLButtonElement>("#batch-field [data-aurelglyph-number-step='1']");
    const blankInput = document.querySelector<HTMLInputElement>("#blank-field input");
    const blankDecrement = document.querySelector<HTMLButtonElement>("#blank-field [data-aurelglyph-number-step='-1']");
    const blankIncrement = document.querySelector<HTMLButtonElement>("#blank-field [data-aurelglyph-number-step='1']");
    const negativeBlankInput = document.querySelector<HTMLInputElement>("#negative-blank-field input");
    const negativeBlankDecrement = document.querySelector<HTMLButtonElement>("#negative-blank-field [data-aurelglyph-number-step='-1']");
    const negativeBlankIncrement = document.querySelector<HTMLButtonElement>("#negative-blank-field [data-aurelglyph-number-step='1']");
    const slider = document.querySelector<HTMLInputElement>("#volume-slider input");
    const sliderOutput = document.querySelector<HTMLOutputElement>("[data-aurelglyph-slider-output]");
    if (!tooltip || !tooltipTrigger || !tooltipContent || !numberInput || !increment || !edgeInput || !edgeDecrement || !edgeIncrement || !blankInput || !blankDecrement || !blankIncrement || !negativeBlankInput || !negativeBlankDecrement || !negativeBlankIncrement || !slider || !sliderOutput) {
      throw new Error("Invalid fixture");
    }

    aurelglyph().init?.(document);
    tooltipTrigger.focus();
    expect(tooltip.getAttribute("data-open")).toBe("true");
    expect(tooltipContent.hidden).toBe(false);
    aurelglyph().init?.(document);
    expect(tooltipContent.hidden).toBe(false);
    tooltipTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(tooltipContent.hidden).toBe(true);

    increment.click();
    expect(numberInput.value).toBe("2");
    increment.click();
    expect(numberInput.value).toBe("3");
    expect(increment.disabled).toBe(true);

    expect(edgeIncrement.disabled).toBe(true);
    let edgeChanges = 0;
    edgeInput.addEventListener("change", () => {
      edgeChanges += 1;
    });
    edgeIncrement.disabled = false;
    edgeIncrement.click();
    expect(edgeInput.value).toBe("9");
    expect(edgeChanges).toBe(0);
    expect(edgeIncrement.disabled).toBe(true);
    edgeInput.value = "8";
    edgeInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(edgeIncrement.disabled).toBe(false);
    edgeIncrement.click();
    expect(edgeInput.value).toBe("9");
    edgeInput.value = "1";
    edgeInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    edgeDecrement.click();
    expect(edgeInput.value).toBe("0");
    expect(edgeChanges).toBe(2);

    blankDecrement.click();
    expect(blankInput.value).toBe("5");
    blankInput.value = "";
    blankInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    blankIncrement.click();
    expect(blankInput.value).toBe("8");

    expect(negativeBlankDecrement.disabled).toBe(false);
    expect(negativeBlankIncrement.disabled).toBe(false);
    negativeBlankDecrement.click();
    expect(negativeBlankInput.value).toBe("-5");
    negativeBlankInput.value = "";
    negativeBlankInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    negativeBlankIncrement.click();
    expect(negativeBlankInput.value).toBe("-5");

    slider.value = "65";
    slider.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(sliderOutput.value).toBe("65");
    expect(slider.style.getPropertyValue("--ag-slider-progress")).toBe("65%");
  });

  it("keeps a tooltip open while either pointer or focus still activates it", () => {
    document.body.innerHTML = `
      <span data-aurelglyph-tooltip="" data-open="false" id="settings-tooltip">
        <button aria-describedby="settings-tip">Settings</button>
        <span data-aurelglyph-tooltip-content="" id="settings-tip" role="tooltip" hidden>Open settings</span>
      </span>
      <button id="outside">Outside</button>
    `;
    const tooltip = document.querySelector<HTMLElement>("#settings-tooltip");
    const trigger = tooltip?.querySelector<HTMLButtonElement>("button");
    const content = tooltip?.querySelector<HTMLElement>("[role='tooltip']");
    const outside = document.querySelector<HTMLButtonElement>("#outside");
    if (!tooltip || !trigger || !content || !outside) throw new Error("Invalid tooltip fixture");

    aurelglyph().init?.(document);

    tooltip.dispatchEvent(new MouseEvent("mouseenter"));
    trigger.focus();
    tooltip.dispatchEvent(new MouseEvent("mouseleave"));
    expect(content.hidden).toBe(false);
    outside.focus();
    expect(content.hidden).toBe(true);

    tooltip.dispatchEvent(new MouseEvent("mouseenter"));
    trigger.focus();
    outside.focus();
    expect(content.hidden).toBe(false);
    tooltip.dispatchEvent(new MouseEvent("mouseleave"));
    expect(content.hidden).toBe(true);

    expect(aurelglyph().tooltips?.open(tooltip)).toBe(true);
    outside.click();
    expect(content.hidden).toBe(true);
  });

  it("initializes and clears an indeterminate checkbox state", () => {
    document.body.innerHTML = `
      <input
        aria-checked="mixed"
        data-aurelglyph-checkbox-input=""
        data-indeterminate="true"
        type="checkbox"
      />
    `;
    const input = document.querySelector<HTMLInputElement>("input");
    if (!input) throw new Error("Invalid checkbox fixture");

    aurelglyph().init?.(document);
    expect(input.indeterminate).toBe(true);
    expect(input.getAttribute("aria-checked")).toBe("mixed");

    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(input.indeterminate).toBe(false);
    expect(input.hasAttribute("data-indeterminate")).toBe(false);
    expect(input.getAttribute("aria-checked")).toBe("true");
  });

  it("keeps a switch ARIA state synchronized after change and form reset", async () => {
    document.body.innerHTML = `
      <form>
        <input
          aria-checked="false"
          data-aurelglyph-switch-input=""
          role="switch"
          type="checkbox"
        />
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("form");
    const input = form?.querySelector<HTMLInputElement>("[role='switch']");
    if (!form || !input) throw new Error("Invalid switch fixture");

    aurelglyph().init?.(document);
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(input.getAttribute("aria-checked")).toBe("true");

    form.reset();
    await flushMutations();
    expect(input.checked).toBe(false);
    expect(input.getAttribute("aria-checked")).toBe("false");
  });

  it("rebinds behavior when Turbo preserves a root and replaces its controls", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-combobox="" data-open="false" id="morphed-combobox">
        <input data-aurelglyph-combobox-input="" role="combobox" aria-expanded="false" />
        <input data-aurelglyph-combobox-value="" type="hidden" />
        <div data-aurelglyph-combobox-listbox="" hidden>
          <div data-aurelglyph-combobox-option="" data-label="Alpha" data-value="alpha" role="option">Alpha</div>
          <div data-aurelglyph-combobox-option="" data-label="Beta" data-value="beta" role="option">Beta</div>
        </div>
      </div>
      <div data-aurelglyph-command-palette="" id="morphed-command">
        <input data-aurelglyph-command-input="" />
        <div><button data-aurelglyph-command-item="" data-label="Archive">Archive</button></div>
      </div>
      <div data-aurelglyph-slider="" id="morphed-slider">
        <output data-aurelglyph-slider-output=""></output>
        <input min="0" max="100" type="range" value="10" />
      </div>
      <div data-aurelglyph-number-field="" id="morphed-number">
        <button data-aurelglyph-number-step="-1" type="button">Less</button>
        <input min="0" max="2" type="number" value="1" />
        <button data-aurelglyph-number-step="1" type="button">More</button>
      </div>
    `;
    const combobox = document.querySelector<HTMLElement>("#morphed-combobox");
    const palette = document.querySelector<HTMLElement>("#morphed-command");
    const slider = document.querySelector<HTMLElement>("#morphed-slider");
    const number = document.querySelector<HTMLElement>("#morphed-number");
    if (!combobox || !palette || !slider || !number) throw new Error("Invalid Turbo morph fixture");

    aurelglyph().init?.(document);

    combobox.querySelector("[data-aurelglyph-combobox-input]")?.replaceWith(
      Object.assign(document.createElement("input"), { value: "be" })
    );
    const comboboxInput = combobox.querySelector<HTMLInputElement>("input:not([type='hidden'])");
    comboboxInput?.setAttribute("data-aurelglyph-combobox-input", "");
    comboboxInput?.setAttribute("role", "combobox");
    aurelglyph().init?.(combobox);
    comboboxInput?.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(combobox.getAttribute("data-open")).toBe("true");
    expect(combobox.querySelector<HTMLElement>("[data-value='alpha']")?.hidden).toBe(true);
    expect(combobox.querySelector<HTMLElement>("[data-value='beta']")?.hidden).toBe(false);

    const commandInput = document.createElement("input");
    commandInput.setAttribute("data-aurelglyph-command-input", "");
    commandInput.value = "missing";
    palette.querySelector("[data-aurelglyph-command-input]")?.replaceWith(commandInput);
    aurelglyph().init?.(palette);
    expect(palette.querySelector<HTMLElement>("[data-aurelglyph-command-item]")?.hidden).toBe(true);
    commandInput.value = "archive";
    commandInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(palette.querySelector<HTMLElement>("[data-aurelglyph-command-item]")?.hidden).toBe(false);

    const sliderInput = document.createElement("input");
    sliderInput.type = "range";
    sliderInput.min = "0";
    sliderInput.max = "100";
    sliderInput.value = "75";
    slider.querySelector("input")?.replaceWith(sliderInput);
    aurelglyph().init?.(slider);
    expect(slider.querySelector<HTMLOutputElement>("output")?.value).toBe("75");
    sliderInput.value = "80";
    sliderInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(slider.querySelector<HTMLOutputElement>("output")?.value).toBe("80");

    const numberInput = document.createElement("input");
    numberInput.type = "number";
    numberInput.min = "0";
    numberInput.max = "2";
    numberInput.value = "2";
    number.querySelector("input")?.replaceWith(numberInput);
    aurelglyph().init?.(number);
    const increment = number.querySelector<HTMLButtonElement>("[data-aurelglyph-number-step='1']");
    expect(increment?.disabled).toBe(true);
    numberInput.value = "1";
    numberInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(increment?.disabled).toBe(false);
  });

  it("updates segmented and tab selection with arrow-key roving focus", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-selection-group="segmented" role="radiogroup">
        <button data-aurelglyph-selection-item="" data-value="grid" role="radio" aria-checked="true" tabindex="0">Grid</button>
        <button data-aurelglyph-selection-item="" data-value="list" role="radio" aria-checked="false" tabindex="-1">List</button>
        <input data-aurelglyph-selection-value="" name="layout" type="hidden" value="grid" />
      </div>
      <div id="settings-tabs">
        <div data-aurelglyph-selection-group="tabs" role="tablist">
          <button aria-controls="general-panel" aria-selected="true" data-aurelglyph-selection-item="" data-value="general" role="tab">General</button>
          <button aria-controls="advanced-panel" aria-selected="false" data-aurelglyph-selection-item="" data-value="advanced" role="tab">Advanced</button>
        </div>
        <div id="general-panel" role="tabpanel">General panel</div>
        <div id="advanced-panel" role="tabpanel" hidden>Advanced panel</div>
      </div>
    `;
    const group = document.querySelector<HTMLElement>("[data-aurelglyph-selection-group]");
    const items = group?.querySelectorAll<HTMLButtonElement>("[data-aurelglyph-selection-item]");
    const value = group?.querySelector<HTMLInputElement>("[data-aurelglyph-selection-value]");
    if (!group || !items || !value) throw new Error("Invalid selection fixture");

    aurelglyph().init?.(document);
    items[0].focus();
    items[0].dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(items[1]);
    expect(items[1].getAttribute("aria-checked")).toBe("true");
    expect(items[0].getAttribute("aria-checked")).toBe("false");
    expect(value.value).toBe("list");
    expect(aurelglyph().selections?.select(group, "grid")).toBe(true);
    expect(value.value).toBe("grid");
    value.value = "missing";
    aurelglyph().selections?.init(group);
    expect(value.value).toBe("grid");
    expect(aurelglyph().selections?.select("settings-tabs", "advanced")).toBe(true);
    expect(document.querySelector<HTMLElement>("#general-panel")?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("#advanced-panel")?.hidden).toBe(false);
    expect(aurelglyph().selections?.select("missing-group", "grid")).toBe(false);
  });

  it("filters and keyboard-selects command palette actions", () => {
    document.body.innerHTML = `
      <div data-aurelglyph-command-palette="" id="commands" role="dialog">
        <input data-aurelglyph-command-input="" role="combobox" aria-controls="command-list" />
        <div id="command-list" role="listbox">
          <button data-aurelglyph-command-item="" data-label="Open" data-value="open" id="command-open" role="option">Open</button>
          <button data-aurelglyph-command-item="" data-keywords="storage legacy" data-label="Archive" data-value="archive" id="command-archive" role="option">Archive</button>
          <p data-aurelglyph-command-empty="" hidden>No commands found.</p>
        </div>
      </div>
    `;
    const palette = document.querySelector<HTMLElement>("#commands");
    const input = palette?.querySelector<HTMLInputElement>("[data-aurelglyph-command-input]");
    const open = palette?.querySelector<HTMLElement>("#command-open");
    const archive = palette?.querySelector<HTMLElement>("#command-archive");
    const empty = palette?.querySelector<HTMLElement>("[data-aurelglyph-command-empty]");
    const selections: string[] = [];
    const dismissals: string[] = [];
    if (!palette || !input || !open || !archive || !empty) throw new Error("Invalid command fixture");
    palette.addEventListener("aurelglyph:command-palette-select", (event) => {
      selections.push((event as CustomEvent<{ value: string }>).detail.value);
    });
    palette.addEventListener("aurelglyph:command-palette-dismiss", () => dismissals.push("escape"));

    aurelglyph().init?.(document);
    input.value = "stor";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(open.hidden).toBe(true);
    expect(archive.hidden).toBe(false);
    expect(input.getAttribute("aria-activedescendant")).toBe("command-archive");
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
    expect(selections).toEqual(["archive"]);
    input.value = "missing";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(empty.hidden).toBe(false);
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(input.value).toBe("");
    expect(open.hidden).toBe(false);
    expect(archive.hidden).toBe(false);
    expect(empty.hidden).toBe(true);
    expect(dismissals).toEqual([]);
    const dismissEscape = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" });
    input.dispatchEvent(dismissEscape);
    expect(dismissals).toEqual(["escape"]);
    expect(dismissEscape.defaultPrevented).toBe(false);
  });

  it("resynchronizes custom form state after a native reset", async () => {
    document.body.innerHTML = `
      <form id="settings-form">
        <input aria-checked="mixed" data-aurelglyph-checkbox-input="" data-indeterminate="true" type="checkbox" />
        <div data-aurelglyph-slider="">
          <output data-aurelglyph-slider-output="">20</output>
          <input min="0" max="100" type="range" value="20" />
        </div>
        <div data-aurelglyph-number-field="">
          <button data-aurelglyph-number-step="-1" type="button">Less</button>
          <input min="0" max="2" type="number" value="2" />
          <button data-aurelglyph-number-step="1" type="button">More</button>
        </div>
        <div data-aurelglyph-combobox="" data-open="false" id="reset-combobox">
          <input data-aurelglyph-combobox-input="" value="Alpha" />
          <input data-aurelglyph-combobox-value="" name="system" type="hidden" value="alpha" />
          <div data-aurelglyph-combobox-listbox="" hidden>
            <div class="is-selected" data-aurelglyph-combobox-option="" data-label="Alpha" data-value="alpha" aria-selected="true">Alpha</div>
            <div data-aurelglyph-combobox-option="" data-label="Beta" data-value="beta" aria-selected="false">Beta</div>
          </div>
        </div>
        <div data-aurelglyph-command-palette="">
          <input data-aurelglyph-command-input="" value="" />
          <button data-aurelglyph-command-item="" data-label="Archive" type="button">Archive</button>
        </div>
        <div data-aurelglyph-selection-group="segmented">
          <button class="is-active" data-aurelglyph-selection-item="" data-value="grid" role="radio" aria-checked="true" type="button">Grid</button>
          <button data-aurelglyph-selection-item="" data-value="list" role="radio" aria-checked="false" type="button">List</button>
          <input data-aurelglyph-selection-value="" type="hidden" value="grid" />
        </div>
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("#settings-form");
    const checkbox = form?.querySelector<HTMLInputElement>("[data-aurelglyph-checkbox-input]");
    const slider = form?.querySelector<HTMLInputElement>("input[type='range']");
    const sliderOutput = form?.querySelector<HTMLOutputElement>("[data-aurelglyph-slider-output]");
    const number = form?.querySelector<HTMLInputElement>("input[type='number']");
    const increment = form?.querySelector<HTMLButtonElement>("[data-aurelglyph-number-step='1']");
    const comboInput = form?.querySelector<HTMLInputElement>("[data-aurelglyph-combobox-input]");
    const comboValue = form?.querySelector<HTMLInputElement>("[data-aurelglyph-combobox-value]");
    const alpha = form?.querySelector<HTMLElement>("[data-value='alpha']");
    const beta = form?.querySelector<HTMLElement>("[data-value='beta']");
    const commandInput = form?.querySelector<HTMLInputElement>("[data-aurelglyph-command-input]");
    const command = form?.querySelector<HTMLElement>("[data-aurelglyph-command-item]");
    const grid = form?.querySelector<HTMLElement>("[data-value='grid']");
    const list = form?.querySelector<HTMLElement>("[data-value='list']");
    if (!form || !checkbox || !slider || !sliderOutput || !number || !increment || !comboInput || !comboValue || !alpha || !beta || !commandInput || !command || !grid || !list) {
      throw new Error("Invalid form reset fixture");
    }

    aurelglyph().init?.(document);
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    slider.value = "80";
    slider.dispatchEvent(new InputEvent("input", { bubbles: true }));
    number.value = "1";
    number.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(aurelglyph().comboboxes?.select("reset-combobox", "beta")).toBe(true);
    commandInput.value = "missing";
    commandInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(aurelglyph().selections?.select(grid.parentElement as HTMLElement, "list")).toBe(true);

    expect(checkbox.indeterminate).toBe(false);
    expect(sliderOutput.value).toBe("80");
    expect(increment.disabled).toBe(false);
    expect(comboValue.value).toBe("beta");
    expect(command.hidden).toBe(true);
    expect(list.classList.contains("is-active")).toBe(true);

    form.reset();
    await flushMutations();

    expect(checkbox.checked).toBe(false);
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox.getAttribute("aria-checked")).toBe("mixed");
    expect(slider.value).toBe("20");
    expect(sliderOutput.value).toBe("20");
    expect(number.value).toBe("2");
    expect(increment.disabled).toBe(true);
    expect(comboInput.value).toBe("Alpha");
    expect(comboValue.value).toBe("alpha");
    expect(alpha.getAttribute("aria-selected")).toBe("true");
    expect(alpha.classList.contains("is-selected")).toBe(true);
    expect(beta.getAttribute("aria-selected")).toBe("false");
    expect(commandInput.value).toBe("");
    expect(command.hidden).toBe(false);
    expect(grid.classList.contains("is-active")).toBe(true);
    expect(list.classList.contains("is-active")).toBe(false);
  });

  it("cleans up every open interaction before Turbo caches the page", () => {
    const { dialog, trigger } = renderSheet();
    const host = document.createElement("div");
    host.innerHTML = `
      <div data-aurelglyph-menu="" data-open="true" id="cache-menu">
        <button data-aurelglyph-menu-trigger="" aria-expanded="true">Menu</button>
        <div data-aurelglyph-menu-content="" role="menu"><button data-aurelglyph-menu-item="" role="menuitem">Item</button></div>
      </div>
    `;
    document.body.append(host);
    aurelglyph().init?.(document);
    trigger.click();
    aurelglyph().menus?.open("cache-menu");
    expect(dialog.open).toBe(true);
    expect(document.querySelector("#cache-menu")?.getAttribute("data-open")).toBe("true");
    const after = document.createElement("button");
    after.textContent = "After";
    document.body.append(after);
    after.focus();

    document.dispatchEvent(new Event("turbo:before-cache"));
    expect(dialog.open).toBe(false);
    expect(document.querySelector("#cache-menu")?.getAttribute("data-open")).toBe("false");
    expect(document.activeElement).toBe(after);
  });
});
