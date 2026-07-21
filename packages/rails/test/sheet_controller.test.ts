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

type AurelglyphWindow = Window & {
  Aurelglyph?: {
    sheets?: SheetController;
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
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(background.hasAttribute("inert")).toBe(true);
    expect(background.getAttribute("aria-hidden")).toBe("true");
    expect(background.style.pointerEvents).toBe("none");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");

    lastButton.focus();
    lastButton.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    expect(document.activeElement).toBe(dismiss);

    dialog.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }));
    expect(dialog.open).toBe(false);
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
});
