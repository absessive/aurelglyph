import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

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

export function focusAt(container: HTMLElement, selector: string, index: number): void {
  const candidates = container.querySelectorAll<HTMLElement>(selector);
  candidates.item(index)?.focus();
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
