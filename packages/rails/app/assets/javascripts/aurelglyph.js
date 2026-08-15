(function initializeAurelglyph(global) {
  "use strict";

  const document = global.document;
  if (!document) return;

  global.Aurelglyph = global.Aurelglyph || {};
  if (global.Aurelglyph.__railsControllerInstalled) return;

  const sheetSelector = "dialog[data-aurelglyph-sheet]";
  const triggerSelector = [
    "[data-aurelglyph-sheet-trigger]",
    "[data-aurelglyph-dialog-trigger]",
    "[data-aurelglyph-drawer-trigger]"
  ].join(",");
  const dismissSelector = [
    "[data-aurelglyph-sheet-dismiss]",
    "[data-aurelglyph-dialog-dismiss]",
    "[data-aurelglyph-drawer-dismiss]"
  ].join(",");
  const focusableSelector = [
    "button:not([disabled]):not([tabindex='-1'])",
    "[href]:not([tabindex='-1'])",
    "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
    "select:not([disabled]):not([tabindex='-1'])",
    "textarea:not([disabled]):not([tabindex='-1'])",
    "[contenteditable='true']:not([tabindex='-1'])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  const states = new WeakMap();
  const initializedDocuments = new WeakSet();
  const branchLocks = new WeakMap();
  const scrollLocks = new WeakMap();
  const pendingFormDismissals = new WeakMap();
  const interactionLayers = [];
  const layerHandled = Symbol("aurelglyphLayerHandled");

  function pruneInteractionLayers() {
    for (let index = interactionLayers.length - 1; index >= 0; index -= 1) {
      const entry = interactionLayers[index];
      if (entry.element.isConnected) continue;
      interactionLayers.splice(index, 1);
      stopAnchoredSurface(entry.element);
      if (entry.kind !== "sheet") continue;
      const state = states.get(entry.element);
      if (!state) continue;
      restoreFallbackDialog(entry.element, state);
      state.fallback = false;
      state.isOpen = false;
      state.pendingCloseReason = null;
      state.restoreFocusOnClose = true;
      state.returnFocus = null;
      entry.element.removeAttribute("aria-modal");
      entry.element.removeAttribute("open");
      writeOpenState(entry.element, false);
    }
  }

  function pushInteractionLayer(element, kind) {
    pruneInteractionLayers();
    const existing = interactionLayers.findIndex((entry) => entry.element === element);
    if (existing >= 0) interactionLayers.splice(existing, 1);
    const nestedIndex = interactionLayers.findIndex((entry) => element.contains(entry.element));
    if (nestedIndex >= 0) interactionLayers.splice(nestedIndex, 0, { element, kind });
    else interactionLayers.push({ element, kind });
  }

  function removeInteractionLayer(element) {
    const index = interactionLayers.findIndex((entry) => entry.element === element);
    if (index >= 0) interactionLayers.splice(index, 1);
  }

  function topInteractionLayer(ownerDocument, predicate) {
    pruneInteractionLayers();
    for (let index = interactionLayers.length - 1; index >= 0; index -= 1) {
      const entry = interactionLayers[index];
      if (entry.element.ownerDocument !== ownerDocument) continue;
      if (!predicate || predicate(entry)) return entry;
    }
    return null;
  }

  function closeInteractionLayer(entry, reason, restoreFocus) {
    if (!entry) return false;
    if (entry.kind === "menu") return closeMenu(entry.element, reason || "outside", restoreFocus === true);
    if (entry.kind === "popover") return closePopover(entry.element, reason || "outside", restoreFocus === true);
    if (entry.kind === "combobox") return closeCombobox(entry.element, reason || "outside");
    if (entry.kind === "tooltip") return closeTooltip(entry.element, reason || "outside", true);
    if (entry.kind === "sheet") return closeSheet(entry.element, reason || "outside", restoreFocus !== false);
    return false;
  }

  function closeDescendantInteractions(container, reason) {
    const descendants = interactionLayers
      .filter((entry) => entry.element !== container && container.contains(entry.element))
      .reverse();
    descendants.forEach((entry) => closeInteractionLayer(entry, reason || "ancestor-close", false));
    Array.from(container.querySelectorAll(tooltipSelector)).forEach((tooltip) => {
      closeTooltip(tooltip, reason || "ancestor-close", true);
    });
  }

  function isDisabledControl(element) {
    return Boolean(
      !element ||
      element.matches(":disabled") ||
      element.getAttribute("aria-disabled") === "true" ||
      element.closest("[inert]")
    );
  }

  function isInsideClosedDetailsContent(element) {
    let details = element && element.closest("details:not([open])");
    while (details) {
      const summary = Array.from(details.children).find((child) => child.tagName === "SUMMARY");
      if (!summary || !summary.contains(element)) return true;
      details = details.parentElement && details.parentElement.closest("details:not([open])");
    }
    return false;
  }

  function isDisclosedElement(element) {
    return Boolean(
      element &&
      !element.closest("[hidden], [inert], [aria-hidden='true']") &&
      !isInsideClosedDetailsContent(element)
    );
  }

  function isVisibleElement(element) {
    return Boolean(
      element &&
      !element.hidden &&
      isDisclosedElement(element)
    );
  }

  function canOpenInteraction(element) {
    if (!element || !element.isConnected || !isDisclosedElement(element)) return false;

    let ancestor = element.parentElement && element.parentElement.closest([
      sheetSelector,
      "[data-aurelglyph-menu]",
      "[data-aurelglyph-popover]",
      "[data-aurelglyph-combobox]"
    ].join(","));
    while (ancestor) {
      if (ancestor.matches(sheetSelector)) {
        const state = states.get(ancestor);
        const renderedOpen = Boolean(ancestor.open || ancestor.hasAttribute("open"));
        if (ancestor.getAttribute("data-open") !== "true" || !(renderedOpen || (state && state.isOpen))) {
          return false;
        }
      } else if (ancestor.getAttribute("data-open") !== "true") {
        return false;
      }
      ancestor = ancestor.parentElement && ancestor.parentElement.closest([
        sheetSelector,
        "[data-aurelglyph-menu]",
        "[data-aurelglyph-popover]",
        "[data-aurelglyph-combobox]"
      ].join(","));
    }
    return true;
  }

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
      const target =
        trigger.getAttribute("data-aurelglyph-sheet-trigger") ||
        trigger.getAttribute("data-aurelglyph-dialog-trigger") ||
        trigger.getAttribute("data-aurelglyph-drawer-trigger") ||
        "";
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
      (element) =>
        !element.matches("input[type='hidden']") &&
        element.tabIndex >= 0 &&
        isVisibleElement(element) &&
        !isDisabledControl(element)
    );
  }

  function focusSheet(dialog) {
    if (dialog.contains(dialog.ownerDocument.activeElement)) return;

    const focusable = focusableElements(dialog);
    const autofocusTarget = focusable.find((element) => element.hasAttribute("autofocus"));
    const firstFocusable = focusable[0];
    const target = autofocusTarget || firstFocusable || dialog;
    if (typeof target.focus === "function") target.focus();
  }

  function dispatchSheetEvent(dialog, type, reason) {
    const EventConstructor = dialog.ownerDocument.defaultView.CustomEvent;
    const detail = { reason };
    dialog.dispatchEvent(new EventConstructor(`aurelglyph:sheet-${type}`, { bubbles: true, detail }));
    const overlayKind = dialog.getAttribute("data-aurelglyph-overlay");
    if (overlayKind) {
      dialog.dispatchEvent(
        new EventConstructor(`aurelglyph:${overlayKind}-${type}`, {
        bubbles: true,
          detail
        })
      );
    }
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

  function finishClose(dialog, reason, restoreFocus) {
    const state = states.get(dialog);
    if (!state) return;

    const wasOpen = state.isOpen;
    closeDescendantInteractions(dialog, "ancestor-close");
    restoreFallbackDialog(dialog, state);
    state.isOpen = false;
    state.fallback = false;
    state.pendingCloseReason = null;
    state.restoreFocusOnClose = true;
    removeInteractionLayer(dialog);
    dialog.removeAttribute("aria-modal");
    writeOpenState(dialog, false);

    if (!wasOpen) return;

    const returnFocus = restoreFocus === false ? null : state.returnFocus;
    state.returnFocus = null;
    if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === "function") {
      returnFocus.focus();
    }
    dispatchSheetEvent(dialog, "close", reason);
  }

  function closeSheet(dialog, reason, restoreFocus) {
    const state = attachSheet(dialog);
    const renderedOpen = Boolean(dialog.open || dialog.hasAttribute("open"));
    if (!state.isOpen && !renderedOpen) {
      closeDescendantInteractions(dialog, "ancestor-close");
      writeOpenState(dialog, false);
      return false;
    }

    state.pendingCloseReason = reason;
    state.restoreFocusOnClose = restoreFocus !== false;
    if (renderedOpen) {
      if (typeof dialog.close === "function") {
        try {
          dialog.close();
        } catch {
          dialog.removeAttribute("open");
        }
      } else {
        dialog.removeAttribute("open");
      }
    }

    finishClose(dialog, reason, state.restoreFocusOnClose);
    state.pendingCloseReason = null;
    return true;
  }

  function openSheet(dialog, trigger, reason) {
    const state = attachSheet(dialog);
    if (!canOpenInteraction(dialog)) {
      closeSheet(dialog, "ancestor-unavailable", false);
      return false;
    }
    if (state.isOpen && (dialog.open || dialog.hasAttribute("open"))) {
      writeOpenState(dialog, true);
      return false;
    }

    state.returnFocus = trigger || dialog.ownerDocument.activeElement;
    state.restoreFocusOnClose = true;
    if (state.returnFocus === dialog.ownerDocument.body) state.returnFocus = null;
    state.fallback = false;
    dialog.removeAttribute("aria-modal");

    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
      } catch {
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
    pushInteractionLayer(dialog, "sheet");
    writeOpenState(dialog, true);
    focusSheet(dialog);
    dispatchSheetEvent(dialog, "open", reason || "state");
    return true;
  }

  function isBackdropClick(dialog, event) {
    return event.target === dialog;
  }

  function isSheetDismissible(dialog) {
    return dialog.getAttribute("data-dismissible") !== "false";
  }

  function formSubmitter(element) {
    const submitter = element.closest("button, input[type='submit'], input[type='image']");
    if (!submitter) return null;
    const isSubmitter =
      (submitter instanceof global.HTMLButtonElement && submitter.type === "submit") ||
      (submitter instanceof global.HTMLInputElement && ["submit", "image"].includes(submitter.type));
    return isSubmitter && submitter.form ? submitter : null;
  }

  function isDialogMethodSubmitter(element) {
    const submitter = formSubmitter(element);
    if (!submitter) return false;
    const form = submitter.form;
    const method = submitter.getAttribute("formmethod") || (form && form.getAttribute("method")) || "";
    return method.toLocaleLowerCase() === "dialog";
  }

  function deferDismissUntilSubmit(element, callback) {
    const submitter = formSubmitter(element);
    if (!submitter) return false;
    const form = submitter.form;
    const previous = pendingFormDismissals.get(form);
    if (previous) form.removeEventListener("submit", previous);
    const handleSubmit = (event) => {
      if (event.submitter && event.submitter !== submitter) return;
      form.removeEventListener("submit", handleSubmit);
      pendingFormDismissals.delete(form);
      callback();
    };
    pendingFormDismissals.set(form, handleSubmit);
    form.addEventListener("submit", handleSubmit);
    global.setTimeout(() => {
      if (pendingFormDismissals.get(form) !== handleSubmit) return;
      form.removeEventListener("submit", handleSubmit);
      pendingFormDismissals.delete(form);
    }, 0);
    return true;
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
      openSheet(dialog, null, "state");
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
      restoreFocusOnClose: true,
      returnFocus: null,
      scrollLocked: false
    };
    states.set(dialog, state);

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (isSheetDismissible(dialog)) closeSheet(dialog, "escape");
    });
    dialog.addEventListener("click", (event) => {
      if (!isSheetDismissible(dialog) || !isBackdropClick(dialog, event)) return;
      const nestedLayer = topInteractionLayer(dialog.ownerDocument, (entry) => {
        return entry.element !== dialog && dialog.contains(entry.element);
      });
      event[layerHandled] = true;
      if (nestedLayer) closeInteractionLayer(nestedLayer, "backdrop");
      else closeSheet(dialog, "backdrop");
    });
    dialog.addEventListener("close", () => {
      finishClose(dialog, state.pendingCloseReason || "native-close", state.restoreFocusOnClose);
    });
    dialog.addEventListener("keydown", (event) => {
      if (state.fallback && event.key === "Escape") {
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (isSheetDismissible(dialog)) closeSheet(dialog, "escape");
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
    if (dismiss && !isDisabledControl(dismiss)) {
      const dialog = dismiss.closest(sheetSelector);
      if (dialog) {
        if (isSheetDismissible(dialog)) {
          if (isDialogMethodSubmitter(dismiss)) {
            deferDismissUntilSubmit(dismiss, () => {
              const state = attachSheet(dialog);
              state.pendingCloseReason = "dismiss";
              global.setTimeout(() => {
                if (
                  state.pendingCloseReason === "dismiss" &&
                  (dialog.open || dialog.hasAttribute("open"))
                ) {
                  state.pendingCloseReason = null;
                }
              }, 0);
            });
          } else if (!deferDismissUntilSubmit(dismiss, () => closeSheet(dialog, "dismiss"))) {
            closeSheet(dialog, "dismiss");
          }
        }
        return;
      }
    }

    const trigger = event.target.closest(triggerSelector);
    if (!trigger || isDisabledControl(trigger)) {
      if (event[layerHandled]) return;
      const fallbackLayer = topInteractionLayer(event.target.ownerDocument, (entry) => {
        const state = entry.kind === "sheet" ? states.get(entry.element) : null;
        return Boolean(state && state.fallback && state.isOpen);
      });
      if (!fallbackLayer || fallbackLayer.element.contains(event.target) || !isSheetDismissible(fallbackLayer.element)) {
        return;
      }
      const nestedLayer = topInteractionLayer(event.target.ownerDocument, (entry) => {
        return entry.element !== fallbackLayer.element && fallbackLayer.element.contains(entry.element);
      });
      event[layerHandled] = true;
      if (nestedLayer) closeInteractionLayer(nestedLayer, "backdrop", false);
      else closeSheet(fallbackLayer.element, "backdrop");
      return;
    }

    const target =
      trigger.getAttribute("data-aurelglyph-sheet-trigger") ||
      trigger.getAttribute("data-aurelglyph-dialog-trigger") ||
      trigger.getAttribute("data-aurelglyph-drawer-trigger");
    const dialog = resolveSheet(target, trigger.ownerDocument);
    if (!dialog) return;

    event.preventDefault();
    openSheet(dialog, trigger, "trigger");
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

    const synchronizedSheets = new Set(sheetsWithin(scope));
    synchronizedSheets.forEach((dialog) => {
      attachSheet(dialog);
      synchronizeSheet(dialog);
    });
    elementsWithin(scope, triggerSelector).forEach((trigger) => {
      const target =
        trigger.getAttribute("data-aurelglyph-sheet-trigger") ||
        trigger.getAttribute("data-aurelglyph-dialog-trigger") ||
        trigger.getAttribute("data-aurelglyph-drawer-trigger");
      const dialog = resolveSheet(target, ownerDocument);
      if (!dialog || synchronizedSheets.has(dialog)) return;
      attachSheet(dialog);
      synchronizeSheet(dialog);
      synchronizedSheets.add(dialog);
    });
    Array.from(synchronizedSheets)
      .filter((dialog) => dialog.getAttribute("data-open") !== "true")
      .forEach((dialog) => closeSheet(dialog, "state", false));
    return Array.from(synchronizedSheets);
  }

  const api = {
    close(target, reason) {
      const dialog = resolveSheet(target, document);
      return dialog ? closeSheet(dialog, reason || "api") : false;
    },
    init: initialize,
    open(target, trigger) {
      const dialog = resolveSheet(target, document);
      return dialog ? openSheet(dialog, trigger || null, "api") : false;
    },
    sync(target) {
      const dialog = resolveSheet(target, document);
      if (!dialog) return false;
      attachSheet(dialog);
      synchronizeSheet(dialog);
      return true;
    }
  };

  const menuSelector = "[data-aurelglyph-menu]";
  const menuTriggerSelector = "[data-aurelglyph-menu-trigger]";
  const menuContentSelector = "[data-aurelglyph-menu-content]";
  const menuItemSelector = "[data-aurelglyph-menu-item]";
  const menuStates = new WeakMap();

  function elementsWithin(root, selector) {
    const elements = [];
    if (root && root.nodeType === 1 && root.matches(selector)) elements.push(root);
    if (root && typeof root.querySelectorAll === "function") elements.push(...root.querySelectorAll(selector));
    return elements;
  }

  function resolveComponent(target, selector, ownerDocument) {
    if (target && target.nodeType === 1 && target.matches(selector)) return target;
    if (typeof target !== "string") return null;
    const id = target.trim().replace(/^#/, "");
    if (!id) return null;
    const candidate = ownerDocument.getElementById(id);
    return candidate && candidate.matches(selector) ? candidate : null;
  }

  function dispatchComponentEvent(element, component, type, detail) {
    const EventConstructor = element.ownerDocument.defaultView.CustomEvent;
    element.dispatchEvent(
      new EventConstructor(`aurelglyph:${component}-${type}`, {
        bubbles: true,
        detail: detail || {}
      })
    );
  }

  const anchoredSurfaceStates = new WeakMap();
  const clippingOverflowValues = ["auto", "clip", "hidden", "overlay", "scroll"];

  function clearAnchoredSurfaceStyles(surface) {
    if (!surface) return;
    surface.style.removeProperty("--ag-floating-visibility");
    surface.style.removeProperty("--ag-floating-available-width");
    surface.style.removeProperty("--ag-floating-available-height");
    surface.style.removeProperty("--ag-floating-shift-x");
    surface.style.removeProperty("--ag-floating-shift-y");
  }

  function stopAnchoredSurface(owner) {
    const state = anchoredSurfaceStates.get(owner);
    if (!state) return;
    state.stopped = true;
    if (state.animationFrame !== null) state.cancelFrame(state.animationFrame);
    state.stabilizationTimers.forEach((timer) => state.view.clearTimeout(timer));
    state.resizeObserver?.disconnect();
    state.disconnectObserver?.disconnect();
    state.visibilityObserver?.disconnect();
    state.view.removeEventListener("resize", state.schedule);
    state.view.removeEventListener("scroll", state.schedule, true);
    state.visualViewport?.removeEventListener("resize", state.schedule);
    state.visualViewport?.removeEventListener("scroll", state.schedule);
    clearAnchoredSurfaceStyles(state.surface);
    anchoredSurfaceStates.delete(owner);
  }

  function startAnchoredSurface(owner, surface, margin, anchor, onAnchorHidden) {
    if (!surface) {
      stopAnchoredSurface(owner);
      return;
    }

    const nextAnchor = anchor || owner;
    const existing = anchoredSurfaceStates.get(owner);
    if (existing?.surface === surface && existing.anchor === nextAnchor) {
      existing.onAnchorHidden = onAnchorHidden;
      existing.update();
      existing.schedule();
      return;
    }
    stopAnchoredSurface(owner);

    const view = surface.ownerDocument.defaultView || global;
    const requestFrame =
      typeof view.requestAnimationFrame === "function"
        ? view.requestAnimationFrame.bind(view)
        : (callback) => view.setTimeout(callback, 0);
    const cancelFrame =
      typeof view.cancelAnimationFrame === "function"
        ? view.cancelAnimationFrame.bind(view)
        : view.clearTimeout.bind(view);
    const collectAncestors = (element) => {
      const collected = [];
      for (
        let ancestor = element?.parentElement;
        ancestor && ancestor !== surface.ownerDocument.documentElement;
        ancestor = ancestor.parentElement
      ) {
        collected.push(ancestor);
      }
      return collected;
    };
    const surfaceAncestors = collectAncestors(surface);
    const observedAncestors = Array.from(new Set([...surfaceAncestors, ...collectAncestors(nextAnchor)]));
    const edgeMargin = Number.isFinite(margin) ? margin : 8;
    const state = {
      anchor: nextAnchor,
      anchorWasVisible: false,
      animationFrame: null,
      cancelFrame,
      disconnectObserver: null,
      onAnchorHidden,
      resizeObserver: null,
      schedule: null,
      stabilizationTimers: [],
      stopped: false,
      surface,
      update: null,
      view,
      visibilityObserver: null,
      visualViewport: view.visualViewport || null
    };

    const update = () => {
      if (state.stopped) return;
      if (!owner.isConnected || !surface.isConnected || surface.hidden) {
        stopAnchoredSurface(owner);
        return;
      }

      surface.style.removeProperty("--ag-floating-visibility");
      surface.style.setProperty("--ag-floating-shift-x", "0px");
      surface.style.setProperty("--ag-floating-shift-y", "0px");
      const visualViewport = state.visualViewport;
      let viewportLeft = visualViewport?.offsetLeft ?? 0;
      let viewportTop = visualViewport?.offsetTop ?? 0;
      let viewportRight = viewportLeft + (visualViewport?.width ?? view.innerWidth);
      let viewportBottom = viewportTop + (visualViewport?.height ?? view.innerHeight);

      surfaceAncestors.forEach((ancestor) => {
        if (!ancestor.isConnected) return;
        const style = view.getComputedStyle(ancestor);
        const clipsX = clippingOverflowValues.includes(style.overflowX);
        const clipsY = clippingOverflowValues.includes(style.overflowY);
        if (!clipsX && !clipsY) return;
        const rect = ancestor.getBoundingClientRect();
        const clientLeft = rect.left + ancestor.clientLeft;
        const clientTop = rect.top + ancestor.clientTop;
        const clientRight = clientLeft + ancestor.clientWidth;
        const clientBottom = clientTop + ancestor.clientHeight;
        if (clipsX) {
          viewportLeft = Math.max(viewportLeft, clientLeft);
          viewportRight = Math.min(viewportRight, clientRight);
        }
        if (clipsY) {
          viewportTop = Math.max(viewportTop, clientTop);
          viewportBottom = Math.min(viewportBottom, clientBottom);
        }
      });

      const anchorRect = state.anchor?.getBoundingClientRect();
      if (anchorRect) {
        const measurableAnchor = anchorRect.width > 0 || anchorRect.height > 0;
        let anchorHiddenByStyle = !state.anchor.isConnected;
        for (
          let element = state.anchor;
          element && !anchorHiddenByStyle;
          element = element.parentElement
        ) {
          const style = view.getComputedStyle(element);
          anchorHiddenByStyle = style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse";
        }
        const anchorVisible = anchorRect.right > viewportLeft
          && anchorRect.left < viewportRight
          && anchorRect.bottom > viewportTop
          && anchorRect.top < viewportBottom;
        if (anchorHiddenByStyle || (measurableAnchor && !anchorVisible) || (state.anchorWasVisible && !measurableAnchor)) {
          surface.style.setProperty("--ag-floating-visibility", "hidden");
          state.onAnchorHidden?.();
          return;
        }
        if (measurableAnchor && anchorVisible) state.anchorWasVisible = true;
      }

      surface.style.setProperty(
        "--ag-floating-available-width",
        `${Math.max(0, Math.floor(viewportRight - viewportLeft - edgeMargin * 2))}px`
      );
      surface.style.setProperty(
        "--ag-floating-available-height",
        `${Math.max(0, Math.floor(viewportBottom - viewportTop - edgeMargin * 2))}px`
      );
      const rect = surface.getBoundingClientRect();
      let shiftX = 0;
      let shiftY = 0;
      if (rect.left < viewportLeft + edgeMargin) shiftX = viewportLeft + edgeMargin - rect.left;
      else if (rect.right > viewportRight - edgeMargin) shiftX = viewportRight - edgeMargin - rect.right;
      if (rect.top < viewportTop + edgeMargin) shiftY = viewportTop + edgeMargin - rect.top;
      else if (rect.bottom > viewportBottom - edgeMargin) shiftY = viewportBottom - edgeMargin - rect.bottom;
      surface.style.setProperty("--ag-floating-shift-x", `${Math.round(shiftX)}px`);
      surface.style.setProperty("--ag-floating-shift-y", `${Math.round(shiftY)}px`);
    };
    const schedule = () => {
      if (state.stopped) return;
      if (state.animationFrame !== null) state.cancelFrame(state.animationFrame);
      state.animationFrame = requestFrame(() => {
        state.animationFrame = null;
        update();
      });
    };
    state.schedule = schedule;
    state.update = update;
    anchoredSurfaceStates.set(owner, state);

    update();
    if (state.stopped) return;
    schedule();
    state.stabilizationTimers.push(view.setTimeout(update, 0), view.setTimeout(update, 120));
    view.addEventListener("resize", schedule);
    view.addEventListener("scroll", schedule, true);
    state.visualViewport?.addEventListener("resize", schedule);
    state.visualViewport?.addEventListener("scroll", schedule);
    if (typeof view.ResizeObserver === "function") {
      state.resizeObserver = new view.ResizeObserver(schedule);
      state.resizeObserver.observe(surface);
      state.resizeObserver.observe(state.anchor);
      observedAncestors.forEach((ancestor) => state.resizeObserver.observe(ancestor));
    }
    if (typeof view.MutationObserver === "function" && surface.ownerDocument.documentElement) {
      state.disconnectObserver = new view.MutationObserver(() => {
        if (!owner.isConnected || !surface.isConnected) stopAnchoredSurface(owner);
        else if (!state.anchor.isConnected) {
          surface.style.setProperty("--ag-floating-visibility", "hidden");
          state.onAnchorHidden?.();
        }
      });
      state.disconnectObserver.observe(surface.ownerDocument.documentElement, { childList: true, subtree: true });
      state.visibilityObserver = new view.MutationObserver(schedule);
      const mutationTargets = new Set([...observedAncestors, surface.ownerDocument.documentElement, state.anchor]);
      mutationTargets.forEach((target) => state.visibilityObserver.observe(target, {
        attributeFilter: ["class", "hidden", "style"],
        attributes: true
      }));
    }
  }

  function menuParts(menu) {
    return {
      content: menu.querySelector(menuContentSelector),
      trigger: menu.querySelector(menuTriggerSelector)
    };
  }

  function isMenuUnavailable(menu) {
    const { trigger } = menuParts(menu);
    return menu.getAttribute("data-disabled") === "true" || !trigger || isDisabledControl(trigger);
  }

  function availableMenuItems(menu) {
    return Array.from(menu.querySelectorAll(menuItemSelector)).filter(
      (item) => isVisibleElement(item) && !isDisabledControl(item)
    );
  }

  function setMenuRoving(menu, activeItem) {
    Array.from(menu.querySelectorAll(menuItemSelector)).forEach((item) => {
      item.tabIndex = item === activeItem ? 0 : -1;
    });
  }

  function writeMenuState(menu, open) {
    const { content, trigger } = menuParts(menu);
    if (!content) return;
    const value = String(open);
    if (menu.getAttribute("data-open") !== value) menu.setAttribute("data-open", value);
    menu.classList.toggle("is-open", open);
    trigger?.setAttribute("aria-expanded", value);
    content.hidden = !open;
    if (!open) setMenuRoving(menu, null);
  }

  function openMenu(menu, reason, focusLast) {
    const state = attachMenu(menu);
    if (!canOpenInteraction(menu) || isMenuUnavailable(menu)) {
      state.isOpen = false;
      removeInteractionLayer(menu);
      stopAnchoredSurface(menu);
      writeMenuState(menu, false);
      return false;
    }
    const wasOpen = state.isOpen;
    state.isOpen = true;
    if (!wasOpen) pushInteractionLayer(menu, "menu");
    writeMenuState(menu, true);
    if (!wasOpen) {
      const items = availableMenuItems(menu);
      const target = focusLast ? items[items.length - 1] : items[0];
      if (target) {
        setMenuRoving(menu, target);
        target.focus();
      }
    }
    const { content, trigger } = menuParts(menu);
    startAnchoredSurface(menu, content, 8, trigger, () => closeMenu(menu, "anchor-hidden", false));
    if (!wasOpen) dispatchComponentEvent(menu, "menu", "open", { reason: reason || "api" });
    return !wasOpen;
  }

  function closeMenu(menu, reason, restoreFocus) {
    const state = attachMenu(menu);
    const wasOpen = state.isOpen;
    closeDescendantInteractions(menu, "ancestor-close");
    state.isOpen = false;
    removeInteractionLayer(menu);
    stopAnchoredSurface(menu);
    writeMenuState(menu, false);
    if (restoreFocus) {
      const { trigger } = menuParts(menu);
      if (trigger && typeof trigger.focus === "function") trigger.focus();
    }
    if (wasOpen) dispatchComponentEvent(menu, "menu", "close", { reason: reason || "api" });
    return wasOpen;
  }

  function moveMenuFocus(menu, current, offset) {
    const items = availableMenuItems(menu);
    if (!items.length) return;
    const currentIndex = items.indexOf(current);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + offset + items.length) % items.length;
    setMenuRoving(menu, items[nextIndex]);
    items[nextIndex].focus();
  }

  function matchMenuTypeahead(menu, state, key, current) {
    global.clearTimeout(state.typeaheadTimer);
    const normalizedKey = key.toLocaleLowerCase();
    state.typeahead = `${state.typeahead}${normalizedKey}`;
    state.typeaheadTimer = global.setTimeout(() => {
      state.typeahead = "";
    }, 500);
    const search = new Set(state.typeahead).size === 1 ? normalizedKey : state.typeahead;
    const items = availableMenuItems(menu);
    const currentIndex = items.indexOf(current);
    const startIndex = currentIndex < 0 ? -1 : currentIndex;
    let match = null;
    for (let offset = 1; offset <= items.length; offset += 1) {
      const candidate = items[(startIndex + offset + items.length) % items.length];
      if (candidate.textContent.trim().toLocaleLowerCase().startsWith(search)) {
        match = candidate;
        break;
      }
    }
    if (match) {
      setMenuRoving(menu, match);
      match.focus();
    }
  }

  function attachMenu(menu) {
    const existing = menuStates.get(menu);
    if (existing) return existing;
    const state = { isOpen: false, typeahead: "", typeaheadTimer: null };
    menuStates.set(menu, state);

    menu.addEventListener("click", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const trigger = event.target.closest(menuTriggerSelector);
      if (trigger && menu.contains(trigger)) {
        if (isDisabledControl(trigger)) return;
        event.preventDefault();
        if (state.isOpen) closeMenu(menu, "trigger", false);
        else openMenu(menu, "trigger", false);
        return;
      }

      const item = event.target.closest(menuItemSelector);
      if (!item || !menu.contains(item)) return;
      if (isMenuUnavailable(menu) || isDisabledControl(item)) {
        event.preventDefault();
        return;
      }
      dispatchComponentEvent(menu, "menu", "select", {
        value: item.getAttribute("data-value") || ""
      });
      closeMenu(menu, "select", true);
    });

    menu.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (!(event.target instanceof global.Element)) return;
      const trigger = event.target.closest(menuTriggerSelector);
      if (trigger && menu.contains(trigger)) {
        if (event.key === "Escape" && state.isOpen) {
          event.preventDefault();
          closeMenu(menu, "escape", true);
        } else if (event.key === "Tab" && state.isOpen) {
          closeMenu(menu, "tab", false);
        } else if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          openMenu(menu, "keyboard", event.key === "ArrowUp");
        }
        return;
      }

      const item = event.target.closest(menuItemSelector);
      if (!item || !menu.contains(item)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(menu, "escape", true);
      } else if (event.key === "Tab") {
        closeMenu(menu, "tab", false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveMenuFocus(menu, item, 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveMenuFocus(menu, item, -1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const items = availableMenuItems(menu);
        const target = event.key === "Home" ? items[0] : items[items.length - 1];
        if (target) {
          setMenuRoving(menu, target);
          target.focus();
        }
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!isMenuUnavailable(menu) && !isDisabledControl(item)) item.click();
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (!isMenuUnavailable(menu)) matchMenuTypeahead(menu, state, event.key, item);
      }
    });

    state.observer = new global.MutationObserver(() => {
      const requestedOpen = menu.getAttribute("data-open") === "true";
      if (isMenuUnavailable(menu)) closeMenu(menu, "unavailable", false);
      else if (requestedOpen && !state.isOpen) openMenu(menu, "state", false);
      else if (!requestedOpen && state.isOpen) closeMenu(menu, "state", false);
    });
    state.observer.observe(menu, {
      attributes: true,
      attributeFilter: ["aria-disabled", "data-disabled", "data-open", "disabled"],
      subtree: true
    });
    return state;
  }

  function initializeMenus(root) {
    const menus = elementsWithin(root || document, menuSelector);
    menus.forEach((menu) => {
      attachMenu(menu);
      if (menu.getAttribute("data-open") === "true") openMenu(menu, "state", false);
      else closeMenu(menu, "state", false);
    });
    menus
      .filter((menu) => menu.getAttribute("data-open") !== "true")
      .forEach((menu) => closeMenu(menu, "state", false));
    return menus;
  }

  const popoverSelector = "[data-aurelglyph-popover]";
  const popoverTriggerSelector = "[data-aurelglyph-popover-trigger]";
  const popoverContentSelector = "[data-aurelglyph-popover-content]";
  const popoverDismissSelector = "[data-aurelglyph-popover-dismiss]";
  const popoverStates = new WeakMap();

  function popoverParts(popover) {
    return {
      content: popover.querySelector(popoverContentSelector),
      trigger: popover.querySelector(popoverTriggerSelector)
    };
  }

  function writePopoverState(popover, open) {
    const { content, trigger } = popoverParts(popover);
    if (!content) return;
    const value = String(open);
    if (popover.getAttribute("data-open") !== value) popover.setAttribute("data-open", value);
    popover.classList.toggle("is-open", open);
    trigger?.setAttribute("aria-expanded", value);
    content.hidden = !open;
  }

  function openPopover(popover, reason) {
    const state = attachPopover(popover);
    const { content, trigger } = popoverParts(popover);
    if (!content || !trigger || !canOpenInteraction(popover)) {
      closePopover(popover, "ancestor-unavailable", false);
      return false;
    }
    const wasOpen = state.isOpen;
    state.isOpen = true;
    if (!wasOpen) pushInteractionLayer(popover, "popover");
    state.returnFocus = trigger;
    writePopoverState(popover, true);
    if (!wasOpen) {
      const target = focusableElements(content)[0] || content;
      if (typeof target.focus === "function") target.focus();
    }
    startAnchoredSurface(popover, content, 8, trigger, () => closePopover(popover, "anchor-hidden", false));
    if (!wasOpen) dispatchComponentEvent(popover, "popover", "open", { reason: reason || "api" });
    return !wasOpen;
  }

  function closePopover(popover, reason, restoreFocus) {
    const state = attachPopover(popover);
    const wasOpen = state.isOpen;
    closeDescendantInteractions(popover, "ancestor-close");
    state.isOpen = false;
    removeInteractionLayer(popover);
    stopAnchoredSurface(popover);
    writePopoverState(popover, false);
    if (restoreFocus && state.returnFocus && state.returnFocus.isConnected) state.returnFocus.focus();
    state.returnFocus = null;
    if (wasOpen) dispatchComponentEvent(popover, "popover", "close", { reason: reason || "api" });
    return wasOpen;
  }

  function attachPopover(popover) {
    const existing = popoverStates.get(popover);
    if (existing) return existing;
    const state = { isOpen: false, returnFocus: null };
    popoverStates.set(popover, state);
    popover.addEventListener("click", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const trigger = event.target.closest(popoverTriggerSelector);
      if (trigger && popover.contains(trigger)) {
        if (isDisabledControl(trigger)) return;
        event.preventDefault();
        if (state.isOpen) closePopover(popover, "trigger", true);
        else openPopover(popover, "trigger");
        return;
      }
      const dismiss = event.target.closest(popoverDismissSelector);
      if (dismiss && popover.contains(dismiss) && !isDisabledControl(dismiss)) {
        if (!deferDismissUntilSubmit(dismiss, () => closePopover(popover, "dismiss", true))) {
          closePopover(popover, "dismiss", true);
        }
      }
    });
    popover.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape" && state.isOpen) {
        event.preventDefault();
        closePopover(popover, "escape", true);
      }
    });
    state.observer = new global.MutationObserver(() => {
      const requestedOpen = popover.getAttribute("data-open") === "true";
      if (requestedOpen && !state.isOpen) openPopover(popover, "state");
      else if (!requestedOpen && state.isOpen) closePopover(popover, "state", false);
    });
    state.observer.observe(popover, { attributes: true, attributeFilter: ["data-open"] });
    return state;
  }

  function initializePopovers(root) {
    const popovers = elementsWithin(root || document, popoverSelector);
    popovers.forEach((popover) => {
      attachPopover(popover);
      if (popover.getAttribute("data-open") === "true") openPopover(popover, "state");
      else closePopover(popover, "state", false);
    });
    popovers
      .filter((popover) => popover.getAttribute("data-open") !== "true")
      .forEach((popover) => closePopover(popover, "state", false));
    return popovers;
  }

  const comboboxSelector = "[data-aurelglyph-combobox]";
  const comboboxInputSelector = "[data-aurelglyph-combobox-input]";
  const comboboxListSelector = "[data-aurelglyph-combobox-listbox]";
  const comboboxOptionSelector = "[data-aurelglyph-combobox-option]";
  const comboboxValueSelector = "[data-aurelglyph-combobox-value]";
  const comboboxEmptySelector = "[data-aurelglyph-combobox-empty]";
  const comboboxToggleSelector = "[data-aurelglyph-combobox-toggle]";
  const comboboxStates = new WeakMap();

  function comboboxParts(combobox) {
    return {
      empty: combobox.querySelector(comboboxEmptySelector),
      input: combobox.querySelector(comboboxInputSelector),
      list: combobox.querySelector(comboboxListSelector),
      toggle: combobox.querySelector(comboboxToggleSelector),
      value: combobox.querySelector(comboboxValueSelector)
    };
  }

  function isComboboxUnavailable(combobox) {
    const { input } = comboboxParts(combobox);
    return Boolean(
      !input ||
      combobox.getAttribute("data-disabled") === "true" ||
      combobox.getAttribute("data-readonly") === "true" ||
      isDisabledControl(input) ||
      input.readOnly
    );
  }

  function synchronizeComboboxValidity(combobox) {
    const { input, value } = comboboxParts(combobox);
    if (!input || !value || typeof input.setCustomValidity !== "function") return;
    input.setCustomValidity(input.required && value.value === "" ? "Select an option." : "");
  }

  function visibleComboboxOptions(combobox) {
    return Array.from(combobox.querySelectorAll(comboboxOptionSelector)).filter(
      (option) => !option.hidden && option.getAttribute("aria-disabled") !== "true"
    );
  }

  function setComboboxActive(combobox, option) {
    const { input } = comboboxParts(combobox);
    Array.from(combobox.querySelectorAll(comboboxOptionSelector)).forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === option);
    });
    if (!input) return;
    if (option && option.id) input.setAttribute("aria-activedescendant", option.id);
    else input.removeAttribute("aria-activedescendant");
    const state = comboboxStates.get(combobox);
    if (state) state.activeOption = option || null;
  }

  function filterCombobox(combobox, query) {
    const normalized = query.trim().toLocaleLowerCase();
    let count = 0;
    Array.from(combobox.querySelectorAll(comboboxOptionSelector)).forEach((option) => {
      const label = (option.getAttribute("data-label") || option.textContent || "").toLocaleLowerCase();
      const value = (option.getAttribute("data-value") || "").toLocaleLowerCase();
      const keywords = (option.getAttribute("data-keywords") || "").toLocaleLowerCase();
      const matches = !normalized || label.includes(normalized) || value.includes(normalized) || keywords.includes(normalized);
      option.hidden = !matches;
      if (matches) count += 1;
    });
    const { empty } = comboboxParts(combobox);
    if (empty) empty.hidden = count !== 0;
    setComboboxActive(combobox, null);
    return count;
  }

  function writeComboboxState(combobox, open) {
    const { input, list, toggle } = comboboxParts(combobox);
    if (!list) return;
    const value = String(open);
    if (combobox.getAttribute("data-open") !== value) combobox.setAttribute("data-open", value);
    combobox.classList.toggle("is-open", open);
    input?.setAttribute("aria-expanded", value);
    if (toggle) toggle.setAttribute("aria-label", open ? "Close options" : "Open options");
    list.hidden = !open;
    if (!open) setComboboxActive(combobox, null);
  }

  function openCombobox(combobox, reason) {
    const state = attachCombobox(combobox);
    if (!canOpenInteraction(combobox) || isComboboxUnavailable(combobox)) {
      state.isOpen = false;
      removeInteractionLayer(combobox);
      stopAnchoredSurface(combobox);
      writeComboboxState(combobox, false);
      return false;
    }
    const wasOpen = state.isOpen;
    state.isOpen = true;
    if (!wasOpen) pushInteractionLayer(combobox, "combobox");
    writeComboboxState(combobox, true);
    const { input, list } = comboboxParts(combobox);
    startAnchoredSurface(combobox, list, 8, input, () => closeCombobox(combobox, "anchor-hidden"));
    if (!wasOpen) dispatchComponentEvent(combobox, "combobox", "open", { reason: reason || "api" });
    return !wasOpen;
  }

  function closeCombobox(combobox, reason) {
    const state = attachCombobox(combobox);
    const wasOpen = state.isOpen;
    closeDescendantInteractions(combobox, "ancestor-close");
    state.isOpen = false;
    removeInteractionLayer(combobox);
    stopAnchoredSurface(combobox);
    writeComboboxState(combobox, false);
    if (wasOpen) dispatchComponentEvent(combobox, "combobox", "close", { reason: reason || "api" });
    return wasOpen;
  }

  function moveComboboxActive(combobox, offset) {
    const state = attachCombobox(combobox);
    const options = visibleComboboxOptions(combobox);
    if (!options.length) return;
    const currentIndex = options.indexOf(state.activeOption);
    const nextIndex = currentIndex < 0 ? (offset < 0 ? options.length - 1 : 0) : (currentIndex + offset + options.length) % options.length;
    setComboboxActive(combobox, options[nextIndex]);
    if (typeof options[nextIndex].scrollIntoView === "function") {
      options[nextIndex].scrollIntoView({ block: "nearest" });
    }
  }

  function selectComboboxOption(combobox, option, reason) {
    if (!option || option.getAttribute("aria-disabled") === "true") return false;
    const { input, value } = comboboxParts(combobox);
    if (!input || !value || isComboboxUnavailable(combobox)) return false;
    const selectedValue = option.getAttribute("data-value") || "";
    const selectedLabel = option.getAttribute("data-label") || option.textContent.trim();
    input.value = selectedLabel;
    value.value = selectedValue;
    Array.from(combobox.querySelectorAll(comboboxOptionSelector)).forEach((candidate) => {
      const selected = candidate === option;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.classList.toggle("is-selected", selected);
    });
    const EventConstructor = value.ownerDocument.defaultView.Event;
    value.dispatchEvent(new EventConstructor("input", { bubbles: true }));
    value.dispatchEvent(new EventConstructor("change", { bubbles: true }));
    synchronizeComboboxValidity(combobox);
    dispatchComponentEvent(combobox, "combobox", "select", {
      label: selectedLabel,
      reason: reason || "api",
      value: selectedValue
    });
    closeCombobox(combobox, "select");
    const state = comboboxStates.get(combobox);
    if (state) state.suppressFocusOpen = input.ownerDocument.activeElement !== input;
    input.focus();
    return true;
  }

  function bindComboboxContent(combobox, state) {
    const { input, list, value } = comboboxParts(combobox);
    const changed = state.boundInput !== input || state.boundList !== list || state.boundValue !== value;
    state.boundInput = input;
    state.boundList = list;
    state.boundValue = value;
    if (changed) {
      state.defaultInputValue = input ? input.defaultValue : "";
      state.defaultValue = value ? value.getAttribute("value") || "" : "";
    }
    return { changed, input, list, value };
  }

  function resetCombobox(combobox) {
    const state = attachCombobox(combobox);
    const { input, value } = bindComboboxContent(combobox, state);
    if (!input || !value) return;
    input.value = state.defaultInputValue;
    value.value = state.defaultValue;
    let matched = false;
    Array.from(combobox.querySelectorAll(comboboxOptionSelector)).forEach((option) => {
      const selected = !matched && value.value !== "" && option.getAttribute("data-value") === value.value;
      if (selected) matched = true;
      option.setAttribute("aria-selected", String(selected));
      option.classList.toggle("is-selected", selected);
    });
    filterCombobox(combobox, input.value);
    synchronizeComboboxValidity(combobox);
    closeCombobox(combobox, "reset");
  }

  function attachCombobox(combobox) {
    const existing = comboboxStates.get(combobox);
    if (existing) return existing;
    const state = {
      activeOption: null,
      boundInput: null,
      boundList: null,
      boundValue: null,
      defaultInputValue: "",
      defaultValue: "",
      isOpen: false,
      suppressFocusOpen: false
    };
    comboboxStates.set(combobox, state);

    synchronizeComboboxValidity(combobox);

    combobox.addEventListener("input", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const input = event.target.closest(comboboxInputSelector);
      const { value } = comboboxParts(combobox);
      if (!input || !value || !combobox.contains(input)) return;
      if (isComboboxUnavailable(combobox)) {
        closeCombobox(combobox, "unavailable");
        return;
      }
      value.value = "";
      Array.from(combobox.querySelectorAll(comboboxOptionSelector)).forEach((option) => {
        option.setAttribute("aria-selected", "false");
        option.classList.remove("is-selected");
      });
      synchronizeComboboxValidity(combobox);
      filterCombobox(combobox, input.value);
      openCombobox(combobox, "input");
      dispatchComponentEvent(combobox, "combobox", "input", { query: input.value });
    });
    combobox.addEventListener("focusin", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const input = event.target.closest(comboboxInputSelector);
      if (!input || !combobox.contains(input)) return;
      if (state.suppressFocusOpen) {
        state.suppressFocusOpen = false;
        return;
      }
      if (!input.readOnly && !isDisabledControl(input)) {
        filterCombobox(combobox, input.value);
        openCombobox(combobox, "focus");
      }
    });
    combobox.addEventListener("keydown", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const input = event.target.closest(comboboxInputSelector);
      if (!input || !combobox.contains(input)) return;
      if (isComboboxUnavailable(combobox)) {
        if (state.isOpen) closeCombobox(combobox, "unavailable");
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openCombobox(combobox, "keyboard");
        moveComboboxActive(combobox, event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Home" && state.isOpen) {
        event.preventDefault();
        const option = visibleComboboxOptions(combobox)[0];
        if (option) setComboboxActive(combobox, option);
      } else if (event.key === "End" && state.isOpen) {
        event.preventDefault();
        const options = visibleComboboxOptions(combobox);
        if (options.length) setComboboxActive(combobox, options[options.length - 1]);
      } else if (event.key === "Enter" && state.isOpen && state.activeOption) {
        event.preventDefault();
        selectComboboxOption(combobox, state.activeOption, "keyboard");
      } else if (event.key === "Escape" && state.isOpen) {
        event.preventDefault();
        closeCombobox(combobox, "escape");
      }
    });
    combobox.addEventListener("click", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const toggle = event.target.closest(comboboxToggleSelector);
      if (toggle && combobox.contains(toggle)) {
        if (isDisabledControl(toggle)) return;
        const { input } = comboboxParts(combobox);
        if (!input) return;
        event.preventDefault();
        const closing = state.isOpen;
        if (closing) closeCombobox(combobox, "toggle");
        else {
          filterCombobox(combobox, input.value);
          openCombobox(combobox, "toggle");
        }
        state.suppressFocusOpen = closing && input.ownerDocument.activeElement !== input;
        input.focus();
        return;
      }
      const option = event.target.closest(comboboxOptionSelector);
      if (option && combobox.contains(option)) {
        if (isComboboxUnavailable(combobox) || isDisabledControl(option)) {
          event.preventDefault();
          return;
        }
        selectComboboxOption(combobox, option, "pointer");
      }
    });
    combobox.addEventListener("mousedown", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const option = event.target.closest(comboboxOptionSelector);
      if (option && combobox.contains(option)) event.preventDefault();
    });
    combobox.addEventListener("focusout", (event) => {
      if (!state.isOpen) return;
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof global.Node && combobox.contains(nextTarget)) return;
      closeCombobox(combobox, "focusout");
    });
    state.observer = new global.MutationObserver(() => {
      const requestedOpen = combobox.getAttribute("data-open") === "true";
      if (isComboboxUnavailable(combobox)) closeCombobox(combobox, "unavailable");
      else if (requestedOpen && !state.isOpen) openCombobox(combobox, "state");
      else if (!requestedOpen && state.isOpen) closeCombobox(combobox, "state");
    });
    state.observer.observe(combobox, {
      attributes: true,
      attributeFilter: ["aria-disabled", "data-disabled", "data-open", "data-readonly", "disabled", "readonly"],
      subtree: true
    });
    return state;
  }

  function initializeComboboxes(root) {
    const comboboxes = elementsWithin(root || document, comboboxSelector);
    comboboxes.forEach((combobox) => {
      const state = attachCombobox(combobox);
      const { changed, input } = bindComboboxContent(combobox, state);
      if (input && changed) filterCombobox(combobox, input.value);
      synchronizeComboboxValidity(combobox);
      if (combobox.getAttribute("data-open") === "true") openCombobox(combobox, "state");
      else closeCombobox(combobox, "state");
    });
    comboboxes
      .filter((combobox) => combobox.getAttribute("data-open") !== "true")
      .forEach((combobox) => closeCombobox(combobox, "state"));
    return comboboxes;
  }

  const tooltipSelector = "[data-aurelglyph-tooltip]";
  const tooltipContentSelector = "[data-aurelglyph-tooltip-content]";
  const tooltipStates = new WeakMap();

  function writeTooltipState(tooltip, open) {
    const content = tooltip.querySelector(tooltipContentSelector);
    if (!content) return;
    const value = String(open);
    if (tooltip.getAttribute("data-open") !== value) tooltip.setAttribute("data-open", value);
    content.hidden = !open;
  }

  function openTooltip(tooltip, reason) {
    const state = attachTooltip(tooltip);
    if (!canOpenInteraction(tooltip)) {
      closeTooltip(tooltip, "ancestor-unavailable", true);
      return false;
    }
    const wasOpen = state.isOpen;
    state.isOpen = true;
    if (!wasOpen) pushInteractionLayer(tooltip, "tooltip");
    writeTooltipState(tooltip, true);
    startAnchoredSurface(tooltip, tooltip.querySelector(tooltipContentSelector), 8, tooltip, () =>
      closeTooltip(tooltip, "anchor-hidden", true)
    );
    if (!wasOpen) dispatchComponentEvent(tooltip, "tooltip", "open", { reason: reason || "api" });
    return !wasOpen;
  }

  function closeTooltip(tooltip, reason, resetActivation) {
    const state = attachTooltip(tooltip);
    const wasOpen = state.isOpen;
    state.isOpen = false;
    removeInteractionLayer(tooltip);
    stopAnchoredSurface(tooltip);
    if (resetActivation) {
      state.hasFocus = false;
      state.hasPointer = false;
    }
    writeTooltipState(tooltip, false);
    if (wasOpen) dispatchComponentEvent(tooltip, "tooltip", "close", { reason: reason || "api" });
    return wasOpen;
  }

  function attachTooltip(tooltip) {
    const existing = tooltipStates.get(tooltip);
    if (existing) return existing;
    const state = { isOpen: false, hasFocus: false, hasPointer: false };
    tooltipStates.set(tooltip, state);
    tooltip.addEventListener("mouseenter", () => {
      state.hasPointer = true;
      openTooltip(tooltip, "pointer");
    });
    tooltip.addEventListener("mouseleave", () => {
      state.hasPointer = false;
      if (!state.hasFocus) closeTooltip(tooltip, "pointer");
    });
    tooltip.addEventListener("focusin", () => {
      state.hasFocus = true;
      openTooltip(tooltip, "focus");
    });
    tooltip.addEventListener("focusout", (event) => {
      if (!tooltip.contains(event.relatedTarget)) {
        state.hasFocus = false;
        if (!state.hasPointer) closeTooltip(tooltip, "blur");
      }
    });
    tooltip.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape" && state.isOpen) {
        event.preventDefault();
        closeTooltip(tooltip, "escape");
      }
    });
    return state;
  }

  function initializeTooltips(root) {
    const tooltips = elementsWithin(root || document, tooltipSelector);
    tooltips.forEach((tooltip) => {
      const wasInitialized = tooltipStates.has(tooltip);
      const state = attachTooltip(tooltip);
      if (!wasInitialized) state.isOpen = false;
      writeTooltipState(tooltip, state.isOpen);
      if (state.isOpen) {
        startAnchoredSurface(tooltip, tooltip.querySelector(tooltipContentSelector), 8, tooltip, () =>
          closeTooltip(tooltip, "anchor-hidden", true)
        );
      }
      else stopAnchoredSurface(tooltip);
    });
    return tooltips;
  }

  const sliderSelector = "[data-aurelglyph-slider]";
  const sliderOutputSelector = "[data-aurelglyph-slider-output]";
  const sliderStates = new WeakSet();

  const checkboxInputSelector = "[data-aurelglyph-checkbox-input], [data-aurelglyph-switch-input]";
  const checkboxStates = new WeakMap();

  function synchronizeCheckbox(input) {
    const indeterminate = input.getAttribute("data-indeterminate") === "true";
    input.indeterminate = indeterminate;
    input.setAttribute("aria-checked", indeterminate ? "mixed" : String(input.checked));
  }

  function attachCheckbox(input) {
    let state = checkboxStates.get(input);
    if (!state) {
      state = { defaultIndeterminate: input.getAttribute("data-indeterminate") === "true" };
      checkboxStates.set(input, state);
      input.addEventListener("change", () => {
        input.removeAttribute("data-indeterminate");
        synchronizeCheckbox(input);
      });
    }
    synchronizeCheckbox(input);
  }

  function resetCheckbox(input) {
    const state = checkboxStates.get(input);
    if (state && state.defaultIndeterminate) input.setAttribute("data-indeterminate", "true");
    else input.removeAttribute("data-indeterminate");
    synchronizeCheckbox(input);
  }

  function initializeCheckboxes(root) {
    const inputs = elementsWithin(root || document, checkboxInputSelector);
    inputs.forEach(attachCheckbox);
    return inputs;
  }

  function synchronizeSlider(slider) {
    const input = slider.querySelector("input[type='range']");
    const output = slider.querySelector(sliderOutputSelector);
    if (!input) return;
    const minimum = Number(input.min || 0);
    const maximum = Number(input.max || 100);
    const value = input.valueAsNumber;
    const progress = maximum > minimum ? ((value - minimum) / (maximum - minimum)) * 100 : 0;
    input.style.setProperty("--ag-slider-progress", `${Math.max(0, Math.min(100, progress))}%`);
    if (output) {
      output.value = input.value;
      output.textContent = input.value;
    }
  }

  function attachSlider(slider) {
    if (!sliderStates.has(slider)) {
      sliderStates.add(slider);
      slider.addEventListener("input", (event) => {
        if (!(event.target instanceof global.Element) || !event.target.matches("input[type='range']")) return;
        synchronizeSlider(slider);
      });
      slider.addEventListener("change", (event) => {
        if (!(event.target instanceof global.Element) || !event.target.matches("input[type='range']")) return;
        synchronizeSlider(slider);
        dispatchComponentEvent(slider, "slider", "change", { value: event.target.valueAsNumber });
      });
    }
    synchronizeSlider(slider);
  }

  function initializeSliders(root) {
    const sliders = elementsWithin(root || document, sliderSelector);
    sliders.forEach(attachSlider);
    return sliders;
  }

  const numberFieldSelector = "[data-aurelglyph-number-field]";
  const numberStepSelector = "[data-aurelglyph-number-step]";
  const numberFieldStates = new WeakSet();

  function nextNumberValue(input, direction) {
    const current = input.value === "" || !Number.isFinite(input.valueAsNumber) ? null : input.valueAsNumber;
    const parsedMinimum = input.min === "" ? null : Number(input.min);
    const minimum = Number.isFinite(parsedMinimum) ? parsedMinimum : null;
    const parsedMaximum = input.max === "" ? null : Number(input.max);
    const maximum = Number.isFinite(parsedMaximum) ? parsedMaximum : null;
    const parsedStep = input.step === "any" ? 1 : Math.abs(Number(input.step));
    const step = Number.isFinite(parsedStep) && parsedStep > 0 ? parsedStep : 1;
    const base = minimum === null ? 0 : minimum;
    let candidate;
    if (current === null) {
      if (minimum !== null && direction < 0) candidate = minimum;
      else if (minimum === null && maximum !== null && maximum < base) {
        candidate = base + Math.floor((maximum - base) / step) * step;
      } else candidate = base + step * direction;
    } else {
      const relative = (current - base) / step;
      const rounded = Math.round(relative);
      const aligned = Math.abs(relative - rounded) < 1e-10;
      const index = direction > 0 ? (aligned ? rounded + 1 : Math.ceil(relative)) : aligned ? rounded - 1 : Math.floor(relative);
      candidate = base + index * step;
    }
    candidate = Math.round(candidate * 1e12) / 1e12;
    if ((minimum !== null && candidate < minimum) || (maximum !== null && candidate > maximum)) return null;
    return candidate;
  }

  function synchronizeNumberSteps(field) {
    const input = field.querySelector("input[type='number']");
    if (!input) return;
    field.querySelectorAll(numberStepSelector).forEach((button) => {
      const direction = Number(button.getAttribute("data-aurelglyph-number-step")) < 0 ? -1 : 1;
      const atBoundary = nextNumberValue(input, direction) === null;
      button.disabled = input.disabled || input.readOnly || atBoundary;
    });
  }

  function stepNumberField(field, button) {
    const input = field.querySelector("input[type='number']");
    if (!input || isDisabledControl(button) || input.disabled || input.readOnly) return false;
    const direction = Number(button.getAttribute("data-aurelglyph-number-step")) < 0 ? -1 : 1;
    const previousValue = input.value;
    const nextValue = nextNumberValue(input, direction);
    if (nextValue === null) {
      synchronizeNumberSteps(field);
      input.focus();
      return false;
    }
    input.value = String(nextValue);
    if (input.value === previousValue) {
      synchronizeNumberSteps(field);
      input.focus();
      return false;
    }
    const EventConstructor = input.ownerDocument.defaultView.Event;
    input.dispatchEvent(new EventConstructor("input", { bubbles: true }));
    input.dispatchEvent(new EventConstructor("change", { bubbles: true }));
    synchronizeNumberSteps(field);
    dispatchComponentEvent(field, "number-field", "change", {
      direction,
      value: input.value === "" ? null : input.valueAsNumber
    });
    input.focus();
    return true;
  }

  function attachNumberField(field) {
    if (!numberFieldStates.has(field)) {
      numberFieldStates.add(field);
      field.addEventListener("click", (event) => {
        if (!(event.target instanceof global.Element)) return;
        const button = event.target.closest(numberStepSelector);
        if (button && field.contains(button)) {
          event.preventDefault();
          stepNumberField(field, button);
        }
      });
      ["input", "change"].forEach((eventName) => {
        field.addEventListener(eventName, (event) => {
          if (!(event.target instanceof global.Element) || !event.target.matches("input[type='number']")) return;
          synchronizeNumberSteps(field);
        });
      });
    }
    synchronizeNumberSteps(field);
  }

  function initializeNumberFields(root) {
    const fields = elementsWithin(root || document, numberFieldSelector);
    fields.forEach(attachNumberField);
    return fields;
  }

  const commandPaletteSelector = "[data-aurelglyph-command-palette]";
  const commandInputSelector = "[data-aurelglyph-command-input]";
  const commandItemSelector = "[data-aurelglyph-command-item]";
  const commandEmptySelector = "[data-aurelglyph-command-empty]";
  const commandPaletteStates = new WeakMap();

  function availableCommandItems(palette) {
    return Array.from(palette.querySelectorAll(commandItemSelector)).filter(
      (item) => !item.hidden && !isDisabledControl(item)
    );
  }

  function setCommandActive(palette, item) {
    const input = palette.querySelector(commandInputSelector);
    Array.from(palette.querySelectorAll(commandItemSelector)).forEach((candidate) => {
      const active = candidate === item;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-selected", String(active));
    });
    if (input) {
      if (item && item.id) input.setAttribute("aria-activedescendant", item.id);
      else input.removeAttribute("aria-activedescendant");
    }
    const state = commandPaletteStates.get(palette);
    if (state) state.activeItem = item || null;
  }

  function filterCommands(palette, query) {
    const normalized = query.trim().toLocaleLowerCase();
    let matches = 0;
    Array.from(palette.querySelectorAll(commandItemSelector)).forEach((item) => {
      const label = (item.getAttribute("data-label") || item.textContent || "").toLocaleLowerCase();
      const keywords = (item.getAttribute("data-keywords") || "").toLocaleLowerCase();
      item.hidden = Boolean(normalized) && !`${label} ${keywords}`.includes(normalized);
      if (!item.hidden) matches += 1;
    });
    const empty = palette.querySelector(commandEmptySelector);
    if (empty) empty.hidden = matches !== 0;
    setCommandActive(palette, availableCommandItems(palette)[0] || null);
  }

  function attachCommandPalette(palette) {
    const existing = commandPaletteStates.get(palette);
    if (existing) {
      const input = palette.querySelector(commandInputSelector);
      if (input) filterCommands(palette, input.value);
      return existing;
    }
    const state = { activeItem: null };
    commandPaletteStates.set(palette, state);
    palette.addEventListener("input", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const input = event.target.closest(commandInputSelector);
      if (!input || !palette.contains(input)) return;
      filterCommands(palette, input.value);
      dispatchComponentEvent(palette, "command-palette", "input", { query: input.value });
    });
    palette.addEventListener("keydown", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const input = event.target.closest(commandInputSelector);
      if (!input || !palette.contains(input)) return;
      if (event.key === "Escape") {
        if (input.value) {
          event.preventDefault();
          input.value = "";
          filterCommands(palette, "");
          dispatchComponentEvent(palette, "command-palette", "input", { query: "" });
        } else {
          dispatchComponentEvent(palette, "command-palette", "dismiss", { query: "" });
        }
        return;
      }
      const items = availableCommandItems(palette);
      if (!items.length) return;
      const current = items.indexOf(state.activeItem);
      let target = null;
      if (event.key === "ArrowDown") target = items[current < 0 ? 0 : (current + 1) % items.length];
      else if (event.key === "ArrowUp") target = items[current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length];
      else if (event.key === "Home") target = items[0];
      else if (event.key === "End") target = items[items.length - 1];
      else if (event.key === "Enter" && state.activeItem) {
        event.preventDefault();
        state.activeItem.click();
        return;
      }
      if (target) {
        event.preventDefault();
        setCommandActive(palette, target);
        if (typeof target.scrollIntoView === "function") target.scrollIntoView({ block: "nearest" });
      }
    });
    palette.addEventListener("mousemove", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const item = event.target.closest(commandItemSelector);
      if (item && palette.contains(item) && !isDisabledControl(item)) setCommandActive(palette, item);
    });
    palette.addEventListener("click", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const item = event.target.closest(commandItemSelector);
      if (!item || !palette.contains(item)) return;
      if (isDisabledControl(item)) {
        event.preventDefault();
        return;
      }
      dispatchComponentEvent(palette, "command-palette", "select", {
        value: item.getAttribute("data-value") || ""
      });
    });
    const input = palette.querySelector(commandInputSelector);
    if (input) filterCommands(palette, input.value);
    return state;
  }

  function initializeCommandPalettes(root) {
    const palettes = elementsWithin(root || document, commandPaletteSelector);
    palettes.forEach(attachCommandPalette);
    return palettes;
  }

  const selectionSelector = "[data-aurelglyph-selection-group]";
  const selectionItemSelector = "[data-aurelglyph-selection-item]";
  const selectionValueSelector = "[data-aurelglyph-selection-value]";
  const selectionStates = new WeakMap();

  function availableSelectionItems(group) {
    return Array.from(group.querySelectorAll(selectionItemSelector)).filter((item) => !isDisabledControl(item));
  }

  function selectGroupItem(group, item, reason) {
    if (!item || isDisabledControl(item) || group.getAttribute("data-disabled") === "true") return false;
    const kind = group.getAttribute("data-aurelglyph-selection-group") || "selection";
    Array.from(group.querySelectorAll(selectionItemSelector)).forEach((candidate) => {
      const selected = candidate === item;
      candidate.classList.toggle("is-active", selected);
      candidate.tabIndex = selected ? 0 : -1;
      if (candidate.getAttribute("role") === "tab") candidate.setAttribute("aria-selected", String(selected));
      if (candidate.getAttribute("role") === "radio") candidate.setAttribute("aria-checked", String(selected));
      const controls = candidate.getAttribute("aria-controls");
      if (controls) {
        const panel = candidate.ownerDocument.getElementById(controls);
        if (panel) panel.hidden = !selected;
      }
    });
    const hidden = group.querySelector(selectionValueSelector);
    const selectedValue = item.getAttribute("data-value") || "";
    if (hidden) {
      hidden.value = selectedValue;
      const EventConstructor = hidden.ownerDocument.defaultView.Event;
      hidden.dispatchEvent(new EventConstructor("input", { bubbles: true }));
      hidden.dispatchEvent(new EventConstructor("change", { bubbles: true }));
    }
    dispatchComponentEvent(group, "selection", "change", {
      kind,
      reason: reason || "api",
      value: selectedValue
    });
    return true;
  }

  function synchronizeSelectionGroup(group) {
    const items = Array.from(group.querySelectorAll(selectionItemSelector));
    const hidden = group.querySelector(selectionValueSelector);
    const requestedValue = hidden && hidden.value;
    const selected =
      items.find((item) => requestedValue !== null && item.getAttribute("data-value") === requestedValue) ||
      items.find((item) => item.getAttribute("aria-selected") === "true" || item.getAttribute("aria-checked") === "true") ||
      items.find((item) => !isDisabledControl(item)) ||
      items[0] ||
      null;
    items.forEach((item) => {
      const isSelected = item === selected;
      item.classList.toggle("is-active", isSelected);
      item.tabIndex = isSelected && !isDisabledControl(item) ? 0 : -1;
      if (item.getAttribute("role") === "tab") item.setAttribute("aria-selected", String(isSelected));
      if (item.getAttribute("role") === "radio") item.setAttribute("aria-checked", String(isSelected));
      const controls = item.getAttribute("aria-controls");
      if (controls) {
        const panel = item.ownerDocument.getElementById(controls);
        if (panel) panel.hidden = !isSelected;
      }
    });
    if (hidden) hidden.value = selected ? selected.getAttribute("data-value") || "" : "";
  }

  function resetSelectionGroup(group) {
    const state = attachSelectionGroup(group);
    const hidden = bindSelectionValue(group, state);
    if (hidden && state) hidden.value = state.defaultValue;
    synchronizeSelectionGroup(group);
  }

  function bindSelectionValue(group, state) {
    const hidden = group.querySelector(selectionValueSelector);
    if (state.boundValue !== hidden) {
      state.boundValue = hidden;
      state.defaultValue = hidden ? hidden.getAttribute("value") || "" : "";
    }
    return hidden;
  }

  function attachSelectionGroup(group) {
    const existing = selectionStates.get(group);
    if (existing) return existing;
    const state = { boundValue: null, defaultValue: "" };
    selectionStates.set(group, state);
    group.addEventListener("click", (event) => {
      if (!(event.target instanceof global.Element)) return;
      const item = event.target.closest(selectionItemSelector);
      if (!item || !group.contains(item)) return;
      selectGroupItem(group, item, "pointer");
    });
    group.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (!(event.target instanceof global.Element)) return;
      const item = event.target.closest(selectionItemSelector);
      if (!item || !group.contains(item)) return;
      const items = availableSelectionItems(group);
      if (!items.length) return;
      let target = null;
      const index = items.indexOf(item);
      if (["ArrowRight", "ArrowDown"].includes(event.key)) target = items[(index + 1) % items.length];
      else if (["ArrowLeft", "ArrowUp"].includes(event.key)) target = items[(index - 1 + items.length) % items.length];
      else if (event.key === "Home") target = items[0];
      else if (event.key === "End") target = items[items.length - 1];
      if (target) {
        event.preventDefault();
        selectGroupItem(group, target, "keyboard");
        target.focus();
      }
    });
    return state;
  }

  function initializeSelectionGroups(root) {
    const groups = elementsWithin(root || document, selectionSelector);
    groups.forEach((group) => {
      const state = attachSelectionGroup(group);
      bindSelectionValue(group, state);
      synchronizeSelectionGroup(group);
    });
    return groups;
  }

  const interactionDocuments = new WeakSet();

  function synchronizeResetForm(form) {
    elementsWithin(form, checkboxInputSelector).forEach((input) => {
      attachCheckbox(input);
      resetCheckbox(input);
    });
    elementsWithin(form, sliderSelector).forEach(attachSlider);
    elementsWithin(form, numberFieldSelector).forEach(attachNumberField);
    elementsWithin(form, comboboxSelector).forEach((combobox) => {
      attachCombobox(combobox);
      resetCombobox(combobox);
    });
    elementsWithin(form, commandPaletteSelector).forEach(attachCommandPalette);
    elementsWithin(form, selectionSelector).forEach((group) => {
      attachSelectionGroup(group);
      resetSelectionGroup(group);
    });
  }

  function installInteractionDocumentController(ownerDocument) {
    if (interactionDocuments.has(ownerDocument)) return;
    interactionDocuments.add(ownerDocument);
    ownerDocument.addEventListener("click", (event) => {
      if (!(event.target instanceof global.Element)) return;
      if (event[layerHandled]) return;
      const layer = topInteractionLayer(ownerDocument, (entry) => {
        return entry.kind !== "sheet" && !entry.element.contains(event.target);
      });
      if (!layer) return;
      event[layerHandled] = true;
      closeInteractionLayer(layer, "outside");
    });
    ownerDocument.addEventListener("reset", (event) => {
      if (!(event.target instanceof global.HTMLFormElement)) return;
      const form = event.target;
      global.setTimeout(() => {
        if (!event.defaultPrevented && form.isConnected) synchronizeResetForm(form);
      }, 0);
    });
  }

  function initializeAll(root) {
    const scope = root || document;
    const ownerDocument = scope.ownerDocument || scope;
    pruneInteractionLayers();
    installInteractionDocumentController(ownerDocument);
    const sheets = initialize(scope);
    return {
      checkboxes: initializeCheckboxes(scope),
      comboboxes: initializeComboboxes(scope),
      commandPalettes: initializeCommandPalettes(scope),
      menus: initializeMenus(scope),
      numberFields: initializeNumberFields(scope),
      popovers: initializePopovers(scope),
      selections: initializeSelectionGroups(scope),
      sheets,
      sliders: initializeSliders(scope),
      tooltips: initializeTooltips(scope)
    };
  }

  function destroyAll(root, reason) {
    const scope = root || document;
    sheetsWithin(scope).forEach((dialog) => closeSheet(dialog, reason || "destroy", false));
    elementsWithin(scope, menuSelector).forEach((menu) => closeMenu(menu, reason || "destroy", false));
    elementsWithin(scope, popoverSelector).forEach((popover) => closePopover(popover, reason || "destroy", false));
    elementsWithin(scope, comboboxSelector).forEach((combobox) => closeCombobox(combobox, reason || "destroy"));
    elementsWithin(scope, tooltipSelector).forEach((tooltip) => closeTooltip(tooltip, reason || "destroy", true));
  }

  const menuApi = {
    close(target, reason) {
      const menu = resolveComponent(target, menuSelector, document);
      return menu ? closeMenu(menu, reason || "api", true) : false;
    },
    init: initializeMenus,
    open(target) {
      const menu = resolveComponent(target, menuSelector, document);
      return menu ? openMenu(menu, "api", false) : false;
    },
    sync(target) {
      const menu = resolveComponent(target, menuSelector, document);
      if (!menu) return false;
      const state = attachMenu(menu);
      if (menu.getAttribute("data-open") === "true") openMenu(menu, "state", false);
      else closeMenu(menu, "state", false);
      return Boolean(state);
    }
  };

  const popoverApi = {
    close(target, reason) {
      const popover = resolveComponent(target, popoverSelector, document);
      return popover ? closePopover(popover, reason || "api", true) : false;
    },
    init: initializePopovers,
    open(target) {
      const popover = resolveComponent(target, popoverSelector, document);
      return popover ? openPopover(popover, "api") : false;
    },
    sync(target) {
      const popover = resolveComponent(target, popoverSelector, document);
      if (!popover) return false;
      attachPopover(popover);
      if (popover.getAttribute("data-open") === "true") openPopover(popover, "state");
      else closePopover(popover, "state", false);
      return true;
    }
  };

  const comboboxApi = {
    close(target, reason) {
      const combobox = resolveComponent(target, comboboxSelector, document);
      return combobox ? closeCombobox(combobox, reason || "api") : false;
    },
    init: initializeComboboxes,
    open(target) {
      const combobox = resolveComponent(target, comboboxSelector, document);
      return combobox ? openCombobox(combobox, "api") : false;
    },
    select(target, value) {
      const combobox = resolveComponent(target, comboboxSelector, document);
      if (!combobox) return false;
      const option = Array.from(combobox.querySelectorAll(comboboxOptionSelector)).find(
        (candidate) => candidate.getAttribute("data-value") === String(value)
      );
      return selectComboboxOption(combobox, option, "api");
    },
    sync(target) {
      const combobox = resolveComponent(target, comboboxSelector, document);
      if (!combobox) return false;
      attachCombobox(combobox);
      if (combobox.getAttribute("data-open") === "true") openCombobox(combobox, "state");
      else closeCombobox(combobox, "state");
      return true;
    }
  };

  const tooltipApi = {
    close(target, reason) {
      const tooltip = resolveComponent(target, tooltipSelector, document);
      return tooltip ? closeTooltip(tooltip, reason || "api") : false;
    },
    init: initializeTooltips,
    open(target) {
      const tooltip = resolveComponent(target, tooltipSelector, document);
      return tooltip ? openTooltip(tooltip, "api") : false;
    }
  };

  const selectionApi = {
    init: initializeSelectionGroups,
    select(target, value) {
      let container = target;
      if (typeof target === "string") {
        const id = target.trim().replace(/^#/, "");
        container = id ? document.getElementById(id) : null;
      }
      const group =
        container && container.nodeType === 1
          ? container.matches(selectionSelector)
            ? container
            : container.querySelector(selectionSelector)
          : null;
      if (!group) return false;
      const item = Array.from(group.querySelectorAll(selectionItemSelector)).find(
        (candidate) => candidate.getAttribute("data-value") === String(value)
      );
      return selectGroupItem(group, item, "api");
    }
  };

  global.Aurelglyph.sheets = api;
  global.Aurelglyph.dialogs = api;
  global.Aurelglyph.drawers = api;
  global.Aurelglyph.menus = menuApi;
  global.Aurelglyph.popovers = popoverApi;
  global.Aurelglyph.comboboxes = comboboxApi;
  global.Aurelglyph.commands = { init: initializeCommandPalettes };
  global.Aurelglyph.tooltips = tooltipApi;
  global.Aurelglyph.selections = selectionApi;
  global.Aurelglyph.init = initializeAll;
  global.Aurelglyph.destroy = destroyAll;
  global.Aurelglyph.__railsControllerInstalled = true;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initializeAll(document), { once: true });
  } else {
    initializeAll(document);
  }
  document.addEventListener("turbo:load", () => initializeAll(document));
  document.addEventListener("turbo:frame-load", (event) => initializeAll(event.target));
  document.addEventListener("turbo:before-cache", () => destroyAll(document, "turbo-cache"));
})(typeof window === "undefined" ? globalThis : window);
