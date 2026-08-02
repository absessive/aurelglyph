import { useId, useRef, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from "react";

import { edgeEnabledIndex, focusAt, nextEnabledIndex } from "./foundation.js";

export type TabsItem = {
  disabled?: boolean;
  id: string;
  label: string;
};

export type TabsProps = HTMLAttributes<HTMLDivElement> & {
  activeId: string;
  children?: ReactNode;
  disabled?: boolean;
  items: readonly TabsItem[];
  label?: string;
  onValueChange?: (id: string) => void;
};

function safePart(value: string): string {
  return encodeURIComponent(value).replaceAll("%", "-");
}

export function Tabs({
  activeId,
  children,
  className,
  disabled = false,
  id,
  items,
  label = "Sections",
  onValueChange,
  ...props
}: TabsProps): ReactElement {
  const generatedId = useId();
  const baseId = id ?? `ag-tabs-${generatedId}`;
  const listRef = useRef<HTMLDivElement>(null);
  const classNames = ["ag-tabs", className].filter(Boolean).join(" ");
  const activeIndex = items.findIndex((item) => item.id === activeId && !item.disabled);
  const fallbackIndex = edgeEnabledIndex(items.length, (index) => disabled || Boolean(items[index]?.disabled), "first");
  const tabStopIndex = activeIndex >= 0 ? activeIndex : fallbackIndex;
  const resolvedActiveId = activeIndex >= 0 ? activeId : (items[fallbackIndex]?.id ?? activeId);
  const tabId = (itemId: string): string => `${baseId}-tab-${safePart(itemId)}`;
  const panelId = (itemId: string): string => `${baseId}-panel-${safePart(itemId)}`;

  const moveSelection = (index: number): void => {
    const item = items[index];
    if (!item || item.disabled || disabled) return;
    onValueChange?.(item.id);
    focusAt(listRef.current as HTMLElement, "[role='tab']", index);
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
    <div className={classNames} data-disabled={disabled || undefined} id={baseId} {...props}>
      <div aria-label={label} className="ag-tabs__list" ref={listRef} role="tablist">
        {items.map((item, index) => (
          <button
            aria-controls={panelId(item.id)}
            aria-selected={item.id === resolvedActiveId}
            className={["ag-tabs__tab", item.id === resolvedActiveId ? "is-active" : undefined].filter(Boolean).join(" ")}
            disabled={disabled || item.disabled}
            id={tabId(item.id)}
            key={item.id}
            onClick={() => onValueChange?.(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            role="tab"
            tabIndex={index === tabStopIndex ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {children
        ? items.map((item) => {
            const active = item.id === resolvedActiveId;
            return (
              <div
                aria-labelledby={tabId(item.id)}
                className="ag-tabs__panel"
                hidden={!active}
                id={panelId(item.id)}
                key={item.id}
                role="tabpanel"
                tabIndex={active ? 0 : undefined}
              >
                {active ? children : null}
              </div>
            );
          })
        : null}
    </div>
  );
}
