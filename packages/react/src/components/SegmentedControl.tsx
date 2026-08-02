import { useId, useRef, type HTMLAttributes, type KeyboardEvent, type ReactElement } from "react";

import { edgeEnabledIndex, focusAt, nextEnabledIndex } from "./foundation.js";

export type SegmentedControlItem = {
  disabled?: boolean;
  id: string;
  label: string;
};

export type SegmentedControlProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  activeId: string;
  disabled?: boolean;
  items: readonly SegmentedControlItem[];
  label?: string;
  onValueChange?: (id: string) => void;
};

export function SegmentedControl({
  activeId,
  className,
  disabled = false,
  id,
  items,
  label = "Options",
  onValueChange,
  ...props
}: SegmentedControlProps): ReactElement {
  const generatedId = useId();
  const controlId = id ?? `ag-segmented-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const classNames = ["ag-segmented", className].filter(Boolean).join(" ");
  const activeIndex = items.findIndex((item) => item.id === activeId && !item.disabled);
  const fallbackIndex = edgeEnabledIndex(items.length, (index) => Boolean(items[index]?.disabled), "first");
  const tabStopIndex = activeIndex >= 0 ? activeIndex : fallbackIndex;
  const resolvedActiveId = activeIndex >= 0 ? activeId : items[fallbackIndex]?.id;

  const moveSelection = (index: number): void => {
    const item = items[index];
    if (!item || disabled || item.disabled) return;
    onValueChange?.(item.id);
    focusAt(rootRef.current as HTMLElement, "[role='radio']", index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    let nextIndex = -1;
    if (event.key === "Home") nextIndex = edgeEnabledIndex(items.length, (candidate) => disabled || Boolean(items[candidate]?.disabled), "first");
    else if (event.key === "End") nextIndex = edgeEnabledIndex(items.length, (candidate) => disabled || Boolean(items[candidate]?.disabled), "last");
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = nextEnabledIndex(index, items.length, (candidate) => disabled || Boolean(items[candidate]?.disabled), 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = nextEnabledIndex(index, items.length, (candidate) => disabled || Boolean(items[candidate]?.disabled), -1);
    }

    if (nextIndex < 0) return;
    event.preventDefault();
    moveSelection(nextIndex);
  };

  return (
    <div
      {...props}
      aria-disabled={disabled || undefined}
      aria-label={label}
      className={classNames}
      id={controlId}
      ref={rootRef}
      role="radiogroup"
    >
      {items.map((item, index) => (
        <button
          aria-checked={item.id === resolvedActiveId}
          className={["ag-segmented__item", item.id === resolvedActiveId ? "is-active" : undefined]
            .filter(Boolean)
            .join(" ")}
          disabled={disabled || item.disabled}
          id={`${controlId}-option-${index}`}
          key={item.id}
          onClick={() => onValueChange?.(item.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          role="radio"
          tabIndex={index === tabStopIndex ? 0 : -1}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
