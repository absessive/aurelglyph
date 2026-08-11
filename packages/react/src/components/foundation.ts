import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Shared state flags used by Aurelglyph controls. */
export type ControlStateProps = {
  /** Prevents interaction and removes the control from form submission where native semantics allow it. */
  disabled?: boolean;
  /** Announces that the control or its result is being updated. */
  busy?: boolean;
  /** Prevents interaction while communicating that an operation is in progress. */
  loading?: boolean;
  /** Allows focus and selection but prevents the value from being edited. */
  readOnly?: boolean;
  /** Marks a form value as required. */
  required?: boolean;
  /** Marks the current value as invalid. */
  invalid?: boolean;
};

export function useControllableState<T>({
  defaultValue,
  onChange,
  value
}: {
  defaultValue: T;
  onChange?: (value: T) => void;
  value?: T;
}): readonly [T, (next: T) => void] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T): void => {
      if (!isControlled) setInternalValue(next);
      onChangeRef.current?.(next);
    },
    [isControlled]
  );

  return [resolvedValue, setValue] as const;
}

export function nextEnabledIndex(
  current: number,
  count: number,
  disabled: (index: number) => boolean,
  direction: 1 | -1
): number {
  if (count <= 0) return -1;

  for (let offset = 1; offset <= count; offset += 1) {
    const candidate = (current + direction * offset + count) % count;
    if (!disabled(candidate)) return candidate;
  }

  return -1;
}

export function edgeEnabledIndex(count: number, disabled: (index: number) => boolean, edge: "first" | "last"): number {
  const start = edge === "first" ? 0 : count - 1;
  const direction = edge === "first" ? 1 : -1;

  for (let index = start; index >= 0 && index < count; index += direction) {
    if (!disabled(index)) return index;
  }

  return -1;
}

export function focusAt(container: HTMLElement, selector: string, index: number, options?: FocusOptions): void {
  const candidates = container.querySelectorAll<HTMLElement>(selector);
  const candidate = candidates.item(index);
  if (!candidate) return;
  if (options) candidate.focus(options);
  else candidate.focus();
}

type DismissLayerRecord = {
  dismiss: (reason: "escape" | "outside") => void;
  refs: () => readonly RefObject<HTMLElement | null>[];
};

const dismissLayers: DismissLayerRecord[] = [];

function dismissTopLayerFromKeyboard(event: globalThis.KeyboardEvent): void {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const layer = dismissLayers.at(-1);
  if (!layer) return;
  event.preventDefault();
  layer.dismiss("escape");
}

function dismissTopLayerFromPointer(event: PointerEvent): void {
  const layer = dismissLayers.at(-1);
  const target = event.target;
  if (!layer || !(target instanceof Node)) return;
  if (layer.refs().some((ref) => ref.current?.contains(target))) return;
  layer.dismiss("outside");
}

function connectDismissListeners(): void {
  if (dismissLayers.length !== 1) return;
  document.addEventListener("keydown", dismissTopLayerFromKeyboard);
  document.addEventListener("pointerdown", dismissTopLayerFromPointer);
}

function disconnectDismissListeners(): void {
  if (dismissLayers.length !== 0) return;
  document.removeEventListener("keydown", dismissTopLayerFromKeyboard);
  document.removeEventListener("pointerdown", dismissTopLayerFromPointer);
}

export function useDismissLayer({
  enabled,
  onDismiss,
  refs
}: {
  enabled: boolean;
  onDismiss: (reason: "escape" | "outside") => void;
  refs: readonly RefObject<HTMLElement | null>[];
}): void {
  const onDismissRef = useRef(onDismiss);
  const refsRef = useRef(refs);
  onDismissRef.current = onDismiss;
  refsRef.current = refs;

  useEffect(() => {
    if (!enabled) return;
    const layer: DismissLayerRecord = {
      dismiss: (reason) => onDismissRef.current(reason),
      refs: () => refsRef.current
    };
    dismissLayers.push(layer);
    connectDismissListeners();
    return () => {
      const index = dismissLayers.lastIndexOf(layer);
      if (index >= 0) dismissLayers.splice(index, 1);
      disconnectDismissListeners();
    };
  }, [enabled]);
}

export function joinIds(...ids: (string | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

/** Keeps an anchored floating surface inside its visible viewport/scrollport intersection. */
export function useViewportShift({
  anchorRef,
  enabled,
  margin = 8,
  onAnchorHidden,
  ref
}: {
  anchorRef?: RefObject<HTMLElement | null>;
  enabled: boolean;
  margin?: number;
  onAnchorHidden?: () => void;
  ref: RefObject<HTMLElement | null>;
}): void {
  const onAnchorHiddenRef = useRef(onAnchorHidden);
  onAnchorHiddenRef.current = onAnchorHidden;

  useIsomorphicLayoutEffect(() => {
    const surface = ref.current;
    if (!enabled || !surface || typeof window === "undefined") return;

    const requestFrame = window.requestAnimationFrame?.bind(window) ?? ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));
    const cancelFrame = window.cancelAnimationFrame?.bind(window) ?? window.clearTimeout.bind(window);
    const anchor = anchorRef?.current ?? surface.parentElement;
    const collectAncestors = (element: Element | null): Element[] => {
      const collected: Element[] = [];
      for (let ancestor = element?.parentElement; ancestor && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        collected.push(ancestor);
      }
      return collected;
    };
    const surfaceAncestors = collectAncestors(surface);
    const observedAncestors = [...new Set([...surfaceAncestors, ...collectAncestors(anchor)])];
    let animationFrame = 0;
    let anchorWasVisible = false;
    const stabilizationTimers: number[] = [];
    const update = (): void => {
      surface.style.removeProperty("--ag-floating-visibility");
      surface.style.setProperty("--ag-floating-shift-x", "0px");
      surface.style.setProperty("--ag-floating-shift-y", "0px");
      const visualViewport = window.visualViewport;
      let viewportLeft = visualViewport?.offsetLeft ?? 0;
      let viewportTop = visualViewport?.offsetTop ?? 0;
      let viewportRight = viewportLeft + (visualViewport?.width ?? window.innerWidth);
      let viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);

      for (const ancestor of surfaceAncestors) {
        const style = getComputedStyle(ancestor);
        const clipsX = ["auto", "clip", "hidden", "overlay", "scroll"].includes(style.overflowX);
        const clipsY = ["auto", "clip", "hidden", "overlay", "scroll"].includes(style.overflowY);
        if (!clipsX && !clipsY) continue;
        const ancestorRect = ancestor.getBoundingClientRect();
        const clientLeft = ancestorRect.left + ancestor.clientLeft;
        const clientTop = ancestorRect.top + ancestor.clientTop;
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
      }

      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        const measurableAnchor = anchorRect.width > 0 || anchorRect.height > 0;
        let anchorHiddenByStyle = !anchor.isConnected;
        for (let element: Element | null = anchor; element && !anchorHiddenByStyle; element = element.parentElement) {
          const style = getComputedStyle(element);
          anchorHiddenByStyle = style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse";
        }
        const anchorVisible = anchorRect.right > viewportLeft
          && anchorRect.left < viewportRight
          && anchorRect.bottom > viewportTop
          && anchorRect.top < viewportBottom;
        if (anchorHiddenByStyle || (measurableAnchor && !anchorVisible) || (anchorWasVisible && !measurableAnchor)) {
          surface.style.setProperty("--ag-floating-visibility", "hidden");
          onAnchorHiddenRef.current?.();
          return;
        }
        if (measurableAnchor && anchorVisible) anchorWasVisible = true;
      }

      surface.style.setProperty("--ag-floating-available-width", `${Math.max(0, Math.floor(viewportRight - viewportLeft - margin * 2))}px`);
      surface.style.setProperty("--ag-floating-available-height", `${Math.max(0, Math.floor(viewportBottom - viewportTop - margin * 2))}px`);
      const rect = surface.getBoundingClientRect();
      let shiftX = 0;
      let shiftY = 0;

      if (rect.left < viewportLeft + margin) shiftX = viewportLeft + margin - rect.left;
      else if (rect.right > viewportRight - margin) shiftX = viewportRight - margin - rect.right;
      if (rect.top < viewportTop + margin) shiftY = viewportTop + margin - rect.top;
      else if (rect.bottom > viewportBottom - margin) shiftY = viewportBottom - margin - rect.bottom;

      surface.style.setProperty("--ag-floating-shift-x", `${Math.round(shiftX)}px`);
      surface.style.setProperty("--ag-floating-shift-y", `${Math.round(shiftY)}px`);
    };
    const schedule = (): void => {
      cancelFrame(animationFrame);
      animationFrame = requestFrame(update);
    };

    // Correct the opening frame synchronously. Browsers can throttle animation
    // frames in background/headless contexts, but the floating surface still
    // needs to enter the viewport before it is painted.
    update();
    // Focus management and browser scroll anchoring can move the trigger after
    // layout effects run. Recheck on the next frame without relying on that
    // deferred pass for the initial correction.
    schedule();
    // Native focus scrolling can settle after the next frame (notably in short
    // landscape viewports). A small bounded stabilization window catches that
    // geometry change even when the browser does not emit a scroll event.
    stabilizationTimers.push(window.setTimeout(update, 0), window.setTimeout(update, 120));
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
    resizeObserver?.observe(surface);
    if (anchor) resizeObserver?.observe(anchor);
    observedAncestors.forEach((ancestor) => resizeObserver?.observe(ancestor));
    const mutationObserver = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(schedule);
    if (mutationObserver) {
      const mutationTargets = new Set<Element>([...observedAncestors, document.documentElement]);
      if (anchor) mutationTargets.add(anchor);
      mutationTargets.forEach((target) => mutationObserver.observe(target, {
        attributeFilter: ["class", "hidden", "style"],
        attributes: true
      }));
    }

    return () => {
      cancelFrame(animationFrame);
      stabilizationTimers.forEach((timer) => window.clearTimeout(timer));
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      surface.style.removeProperty("--ag-floating-visibility");
      surface.style.removeProperty("--ag-floating-available-width");
      surface.style.removeProperty("--ag-floating-available-height");
      surface.style.removeProperty("--ag-floating-shift-x");
      surface.style.removeProperty("--ag-floating-shift-y");
    };
  }, [anchorRef, enabled, margin, ref]);
}
