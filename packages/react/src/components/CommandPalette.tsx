import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement
} from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";
import { edgeEnabledIndex, nextEnabledIndex, useControllableState } from "./foundation.js";

export type CommandPaletteItem = {
  disabled?: boolean;
  icon?: AurelglyphIconName;
  id: string;
  keywords?: readonly string[];
  label: string;
  shortcut?: string;
};

export type CommandPaletteProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  autoFocus?: boolean;
  defaultQuery?: string;
  dismissOnSelect?: boolean;
  emptyText?: string;
  items: readonly CommandPaletteItem[];
  label?: string;
  onDismiss?: () => void;
  onQueryChange?: (query: string) => void;
  onSelect?: (id: string) => void;
  placeholder?: string;
  query?: string;
};

export function CommandPalette({
  autoFocus = false,
  className,
  defaultQuery = "",
  dismissOnSelect = true,
  emptyText = "No commands found.",
  id,
  items,
  label = "Command palette",
  onDismiss,
  onQueryChange,
  onSelect,
  placeholder = "Type a command",
  query,
  ...props
}: CommandPaletteProps): ReactElement {
  const generatedId = useId();
  const paletteId = id ?? `ag-command-${generatedId}`;
  const inputId = `${paletteId}-input`;
  const listId = `${paletteId}-list`;
  const [search, setSearch] = useControllableState({ defaultValue: defaultQuery, onChange: onQueryChange, value: query });
  const [activeIndex, setActiveIndex] = useState(-1);
  const classNames = ["ag-command-palette", className].filter(Boolean).join(" ");
  const filteredItems = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return items;
    return items.filter((item) => [item.label, ...(item.keywords ?? [])].join(" ").toLocaleLowerCase().includes(needle));
  }, [items, search]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (current >= 0 && current < filteredItems.length && !filteredItems[current]?.disabled) return current;
      return edgeEnabledIndex(filteredItems.length, (index) => Boolean(filteredItems[index]?.disabled), "first");
    });
  }, [filteredItems]);

  const optionId = (index: number): string => `${paletteId}-option-${index}`;
  const selectItem = (index: number): void => {
    const item = filteredItems[index];
    if (item && !item.disabled) {
      onSelect?.(item.id);
      if (dismissOnSelect) onDismiss?.();
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.currentTarget.value);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    let nextIndex = -1;
    if (event.key === "ArrowDown") {
      nextIndex = nextEnabledIndex(activeIndex, filteredItems.length, (index) => Boolean(filteredItems[index]?.disabled), 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = nextEnabledIndex(activeIndex < 0 ? 0 : activeIndex, filteredItems.length, (index) => Boolean(filteredItems[index]?.disabled), -1);
    } else if (event.key === "Home") {
      nextIndex = edgeEnabledIndex(filteredItems.length, (index) => Boolean(filteredItems[index]?.disabled), "first");
    } else if (event.key === "End") {
      nextIndex = edgeEnabledIndex(filteredItems.length, (index) => Boolean(filteredItems[index]?.disabled), "last");
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectItem(activeIndex);
      return;
    } else if (event.key === "Escape") {
      if (search) {
        event.preventDefault();
        setSearch("");
        setActiveIndex(-1);
      } else if (onDismiss) {
        event.preventDefault();
        onDismiss();
      }
      return;
    } else {
      return;
    }

    if (nextIndex < 0) return;
    event.preventDefault();
    setActiveIndex(nextIndex);
    document.getElementById(optionId(nextIndex))?.scrollIntoView?.({ block: "nearest" });
  };

  return (
    <div {...props} aria-label={label} className={classNames} id={paletteId} role="dialog">
      <label className="ag-command-palette__search" htmlFor={inputId}>
        <span className="ag-command-palette__label">{label}</span>
        <input
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded="true"
          autoComplete="off"
          autoFocus={autoFocus}
          className="ag-command-palette__input"
          id={inputId}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          type="search"
          value={search}
        />
      </label>
      <div className="ag-command-palette__list" id={listId} role="listbox">
        {filteredItems.length === 0 ? (
          <p aria-disabled="true" aria-selected="false" className="ag-command-palette__empty" role="option">
            {emptyText}
          </p>
        ) : null}
        {filteredItems.map((item, index) => (
          <button
            aria-disabled={item.disabled || undefined}
            aria-selected={index === activeIndex}
            className={["ag-command-palette__item", index === activeIndex ? "is-active" : undefined].filter(Boolean).join(" ")}
            disabled={item.disabled}
            id={optionId(index)}
            key={item.id}
            onClick={() => selectItem(index)}
            onMouseMove={() => !item.disabled && setActiveIndex(index)}
            role="option"
            tabIndex={-1}
            type="button"
          >
            {item.icon ? <Icon className="ag-command-palette__icon" decorative name={item.icon} /> : null}
            <span className="ag-command-palette__item-label">{item.label}</span>
            {item.shortcut ? <kbd className="ag-command-palette__shortcut">{item.shortcut}</kbd> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
