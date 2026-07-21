(function initializeAurelglyph(global) {
  "use strict";

  const document = global.document;
  if (!document) return;

  const sheetSelector = "dialog[data-aurelglyph-sheet]";
  const triggerSelector = "[data-aurelglyph-sheet-trigger]";
  const dismissSelector = "[data-aurelglyph-sheet-dismiss]";
  const focusableSelector = [
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  const states = new WeakMap();
  const initializedDocuments = new WeakSet();
  const branchLocks = new WeakMap();
  const scrollLocks = new WeakMap();

  function isSheet(element) {
    return Boolean(element && element.nodeType === 1 && element.matches(sheetSelector));
  }

  function resolveSheet(target, ownerDocument) {
    if (isSheet(target)) return target;
    if (typeof target !== "string") return null;

    const id = target.trim().replace(/^#/, "");
    if (!id) return null;

    const candidate = ownerDocument.getElementById(id);
    return isSheet(candidate) ? candidate : null;
  }

  function sheetTriggers(dialog) {
    return Array.from(dialog.ownerDocument.querySelectorAll(triggerSelector)).filter((trigger) => {
      const target = trigger.getAttribute("data-aurelglyph-sheet-trigger") || "";
      return target.trim().replace(/^#/, "") === dialog.id;
    });
  }

  function synchronizeTriggers(dialog, open) {
    sheetTriggers(dialog).forEach((trigger) => {
      trigger.setAttribute("aria-controls", dialog.id);
      trigger.setAttribute("aria-expanded", String(open));
      trigger.setAttribute("aria-haspopup", "dialog");
    });
  }

  function writeOpenState(dialog, open) {
    const value = String(open);
    if (dialog.getAttribute("data-open") !== value) dialog.setAttribute("data-open", value);
    synchronizeTriggers(dialog, open);
  }

  function focusableElements(dialog) {
    return Array.from(dialog.querySelectorAll(focusableSelector)).filter(
      (element) => !element.hidden && !element.closest("[hidden]") && element.getAttribute("aria-hidden") !== "true"
    );
  }

  function focusSheet(dialog) {
    if (dialog.contains(dialog.ownerDocument.activeElement)) return;

    const autofocusTarget = dialog.querySelector("[autofocus]");
    const firstFocusable = focusableElements(dialog)[0];
    const target = autofocusTarget || firstFocusable || dialog;
    if (typeof target.focus === "function") target.focus();
  }

  function dispatchSheetEvent(dialog, type, reason) {
    const EventConstructor = dialog.ownerDocument.defaultView.CustomEvent;
    dialog.dispatchEvent(
      new EventConstructor(`aurelglyph:sheet-${type}`, {
        bubbles: true,
        detail: { reason }
      })
    );
  }

  function lockBranch(element) {
    const existing = branchLocks.get(element);
    if (existing) {
      existing.count += 1;
      return;
    }

    branchLocks.set(element, {
      ariaHidden: element.getAttribute("aria-hidden"),
      count: 1,
      inert: element.getAttribute("inert"),
      pointerEvents: element.style.pointerEvents
    });
    element.setAttribute("inert", "");
    element.setAttribute("aria-hidden", "true");
    element.style.pointerEvents = "none";
  }

  function unlockBranch(element) {
    const lock = branchLocks.get(element);
    if (!lock) return;

    lock.count -= 1;
    if (lock.count > 0) return;

    if (lock.inert === null) element.removeAttribute("inert");
    else element.setAttribute("inert", lock.inert);
    if (lock.ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", lock.ariaHidden);
    element.style.pointerEvents = lock.pointerEvents;
    branchLocks.delete(element);
  }

  function lockScroll(ownerDocument) {
    const existing = scrollLocks.get(ownerDocument);
    if (existing) {
      existing.count += 1;
      return;
    }

    const roots = [ownerDocument.documentElement, ownerDocument.body].filter(Boolean);
    scrollLocks.set(ownerDocument, {
      count: 1,
      roots: roots.map((element) => ({
        element,
        overflow: element.style.overflow,
        overscrollBehavior: element.style.overscrollBehavior
      }))
    });
    roots.forEach((element) => {
      element.style.overflow = "hidden";
      element.style.overscrollBehavior = "none";
    });
  }

  function unlockScroll(ownerDocument) {
    const lock = scrollLocks.get(ownerDocument);
    if (!lock) return;

    lock.count -= 1;
    if (lock.count > 0) return;

    lock.roots.forEach(({ element, overflow, overscrollBehavior }) => {
      element.style.overflow = overflow;
      element.style.overscrollBehavior = overscrollBehavior;
    });
    scrollLocks.delete(ownerDocument);
  }

  function isolateFallbackDialog(dialog, state) {
    if (state.scrollLocked) return;

    let branch = dialog;
    while (branch.parentElement && branch !== dialog.ownerDocument.body) {
      const parent = branch.parentElement;
      Array.from(parent.children).forEach((sibling) => {
        if (sibling === branch) return;
        lockBranch(sibling);
        state.isolatedBranches.push(sibling);
      });
      branch = parent;
    }

    lockScroll(dialog.ownerDocument);
    state.scrollLocked = true;
  }

  function restoreFallbackDialog(dialog, state) {
    state.isolatedBranches.reverse().forEach(unlockBranch);
    state.isolatedBranches = [];
    if (state.scrollLocked) unlockScroll(dialog.ownerDocument);
    state.scrollLocked = false;
  }

  function finishClose(dialog, reason) {
    const state = states.get(dialog);
    if (!state) return;

    const wasOpen = state.isOpen;
    restoreFallbackDialog(dialog, state);
    state.isOpen = false;
    state.fallback = false;
    dialog.removeAttribute("aria-modal");
    writeOpenState(dialog, false);

    if (!wasOpen) return;

    const returnFocus = state.returnFocus;
    state.returnFocus = null;
    if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === "function") {
      returnFocus.focus();
    }
    dispatchSheetEvent(dialog, "close", reason);
  }

  function closeSheet(dialog, reason) {
    const state = attachSheet(dialog);
    if (!state.isOpen && !dialog.open) {
      writeOpenState(dialog, false);
      return false;
    }

    state.pendingCloseReason = reason;
    if (dialog.open) {
      if (typeof dialog.close === "function") {
        try {
          dialog.close();
        } catch (_error) {
          dialog.removeAttribute("open");
        }
      } else {
        dialog.removeAttribute("open");
      }
    }

    finishClose(dialog, reason);
    state.pendingCloseReason = null;
    return true;
  }

  function openSheet(dialog, trigger) {
    const state = attachSheet(dialog);
    if (state.isOpen && dialog.open) {
      writeOpenState(dialog, true);
      focusSheet(dialog);
      return false;
    }

    state.returnFocus = trigger || dialog.ownerDocument.activeElement;
    if (state.returnFocus === dialog.ownerDocument.body) state.returnFocus = null;
    state.fallback = false;
    dialog.removeAttribute("aria-modal");

    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
      } catch (_error) {
        state.fallback = true;
        dialog.setAttribute("open", "");
        dialog.setAttribute("aria-modal", "true");
      }
    } else {
      state.fallback = true;
      dialog.setAttribute("open", "");
      dialog.setAttribute("aria-modal", "true");
    }

    if (state.fallback) isolateFallbackDialog(dialog, state);

    state.isOpen = true;
    writeOpenState(dialog, true);
    focusSheet(dialog);
    dispatchSheetEvent(dialog, "open", "state");
    return true;
  }

  function isBackdropClick(dialog, event) {
    if (event.target !== dialog) return false;

    const bounds = dialog.getBoundingClientRect();
    return (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    );
  }

  function trapFallbackFocus(dialog, event) {
    const state = states.get(dialog);
    if (!state || !state.fallback || event.key !== "Tab") return;

    const focusable = focusableElements(dialog);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = dialog.ownerDocument.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function synchronizeSheet(dialog) {
    const requestedOpen = dialog.getAttribute("data-open") === "true";
    if (requestedOpen) {
      openSheet(dialog, null);
    } else {
      closeSheet(dialog, "state");
    }
  }

  function attachSheet(dialog) {
    const existing = states.get(dialog);
    if (existing) return existing;

    const state = {
      fallback: false,
      isOpen: false,
      isolatedBranches: [],
      observer: null,
      pendingCloseReason: null,
      returnFocus: null,
      scrollLocked: false
    };
    states.set(dialog, state);

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeSheet(dialog, "escape");
    });
    dialog.addEventListener("click", (event) => {
      if (isBackdropClick(dialog, event)) closeSheet(dialog, "backdrop");
    });
    dialog.addEventListener("close", () => {
      finishClose(dialog, state.pendingCloseReason || "native-close");
    });
    dialog.addEventListener("keydown", (event) => {
      if (state.fallback && event.key === "Escape") {
        event.preventDefault();
        closeSheet(dialog, "escape");
        return;
      }
      trapFallbackFocus(dialog, event);
    });

    state.observer = new global.MutationObserver(() => synchronizeSheet(dialog));
    state.observer.observe(dialog, { attributeFilter: ["data-open"], attributes: true });
    return state;
  }

  function handleDocumentClick(event) {
    if (!(event.target instanceof global.Element)) return;

    const dismiss = event.target.closest(dismissSelector);
    if (dismiss && !dismiss.matches(":disabled")) {
      const dialog = dismiss.closest(sheetSelector);
      if (dialog) {
        event.preventDefault();
        closeSheet(dialog, "dismiss");
        return;
      }
    }

    const trigger = event.target.closest(triggerSelector);
    if (!trigger || trigger.matches(":disabled")) return;

    const dialog = resolveSheet(trigger.getAttribute("data-aurelglyph-sheet-trigger"), trigger.ownerDocument);
    if (!dialog) return;

    event.preventDefault();
    openSheet(dialog, trigger);
  }

  function installDocumentController(ownerDocument) {
    if (initializedDocuments.has(ownerDocument)) return;

    initializedDocuments.add(ownerDocument);
    ownerDocument.addEventListener("click", handleDocumentClick);
  }

  function sheetsWithin(root) {
    const sheets = [];
    if (isSheet(root)) sheets.push(root);
    if (typeof root.querySelectorAll === "function") sheets.push(...root.querySelectorAll(sheetSelector));
    return sheets;
  }

  function initialize(root) {
    const scope = root || document;
    const ownerDocument = scope.ownerDocument || scope;
    installDocumentController(ownerDocument);

    const sheets = sheetsWithin(scope);
    sheets.forEach((dialog) => {
      attachSheet(dialog);
      synchronizeSheet(dialog);
    });
    return sheets;
  }

  const api = {
    close(target, reason) {
      const dialog = resolveSheet(target, document);
      return dialog ? closeSheet(dialog, reason || "api") : false;
    },
    init: initialize,
    open(target, trigger) {
      const dialog = resolveSheet(target, document);
      return dialog ? openSheet(dialog, trigger || null) : false;
    },
    sync(target) {
      const dialog = resolveSheet(target, document);
      if (!dialog) return false;
      attachSheet(dialog);
      synchronizeSheet(dialog);
      return true;
    }
  };

  global.Aurelglyph = global.Aurelglyph || {};
  global.Aurelglyph.sheets = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initialize(document), { once: true });
  } else {
    initialize(document);
  }
  document.addEventListener("turbo:load", () => initialize(document));
  document.addEventListener("turbo:frame-load", (event) => initialize(event.target));
})(typeof window === "undefined" ? globalThis : window);
