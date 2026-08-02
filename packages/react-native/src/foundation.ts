import { useCallback, useState } from "react";

export type ControlStateProps = {
  disabled?: boolean;
  busy?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  required?: boolean;
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
  const controlled = value !== undefined;
  const resolved = controlled ? value : internalValue;
  const setValue = useCallback(
    (next: T) => {
      if (!controlled) setInternalValue(next);
      onChange?.(next);
    },
    [controlled, onChange]
  );
  return [resolved, setValue] as const;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeStep(step: number | undefined): number {
  return step !== undefined && Number.isFinite(step) && step > 0 ? step : 1;
}

export function snapValue(value: number, min: number, max: number, step: number, base = min): number {
  const safeStep = normalizeStep(step);
  const safeBase = Number.isFinite(base) ? base : 0;
  const candidate = Number.isFinite(value) ? value : safeBase;
  const lowerIndex = Number.isFinite(min) ? Math.ceil((min - safeBase) / safeStep) : Number.MIN_SAFE_INTEGER;
  const upperIndex = Number.isFinite(max) ? Math.floor((max - safeBase) / safeStep) : Number.MAX_SAFE_INTEGER;
  if (lowerIndex > upperIndex) return clamp(candidate, min, max);
  const index = clamp(Math.round((candidate - safeBase) / safeStep), lowerIndex, upperIndex);
  const precision = Math.max(decimalPlaces(safeStep), decimalPlaces(safeBase));
  return Number((safeBase + index * safeStep).toFixed(precision));
}

function decimalPlaces(value: number): number {
  const text = String(value).toLowerCase();
  if (text.includes("e-")) return Number(text.split("e-")[1] ?? 0);
  return text.includes(".") ? (text.split(".")[1]?.length ?? 0) : 0;
}

export function resolveResponsiveColumns(
  columns: number | { base: number; sm?: number; md?: number; lg?: number },
  width: number
): number {
  const normalize = (value: number | undefined, fallback = 1): number =>
    value !== undefined && Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
  if (typeof columns === "number") return normalize(columns);
  const safeWidth = Number.isFinite(width) ? width : 0;
  const base = normalize(columns.base);
  if (safeWidth >= 1024 && columns.lg !== undefined) return normalize(columns.lg, base);
  if (safeWidth >= 768 && columns.md !== undefined) return normalize(columns.md, base);
  if (safeWidth >= 480 && columns.sm !== undefined) return normalize(columns.sm, base);
  return base;
}

export function nextEnabledIndex(
  current: number,
  count: number,
  isDisabled: (index: number) => boolean,
  direction: 1 | -1
): number {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  if (safeCount === 0) return -1;
  const safeCurrent = Number.isFinite(current) ? Math.floor(current) : 0;
  for (let offset = 1; offset <= safeCount; offset += 1) {
    const index = (safeCurrent + direction * offset + safeCount) % safeCount;
    if (!isDisabled(index)) return index;
  }
  return -1;
}

export function labelForValue<T extends { label: string; value: string }>(options: readonly T[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
