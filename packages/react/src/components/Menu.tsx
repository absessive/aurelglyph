import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode
} from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";
import { edgeEnabledIndex, focusAt, nextEnabledIndex, useControllableState, useDismissLayer } from "./foundation.js";

export type MenuItem = {
  disabled?: boolean;
  icon?: AurelglyphIconName;
  id: string;
  label: ReactNode;
  shortcut?: string;
};

export type MenuPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export type MenuProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;
  defaultOpen?: boolean;
  items: readonly MenuItem[];
  label: ReactNode;
  menuLabel?: string;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (id: string) => void;
  open?: boolean;
  placement?: MenuPlacement;
};

export function Menu({
  buttonProps,
  className,
  defaultOpen = false,
  id,
  items,
  label,
  menuLabel,
  onOpenChange,
  onSelect,
  open,
  placement = "bottom-start",
  ...props
}: MenuProps): ReactElement {
  const generatedId = useId();
  const menuId = id ?? `ag-menu-${generatedId}`;
  const triggerId = `${menuId}-trigger`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isOpen, setOpen] = useControllableState({ defaultValue: defaultOpen, onChange: onOpenChange, value: open });
  const classNames = ["ag-menu", className].filter(Boolean).join(" ");

  const close = (restoreFocus: boolean): void => {
    setOpen(false);
    if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus());
  };

  useDismissLayer({
    enabled: isOpen,
    onDismiss: (reason) => close(reason === "escape"),
    refs: [rootRef]
  });

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;
    const first = edgeEnabledIndex(items.length, (index) => Boolean(items[index]?.disabled), "first");
    if (first >= 0) queueMicrotask(() => rootRef.current && focusAt(rootRef.current, "[role='menuitem']", first));
  }, [isOpen]);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
    },
    []
  );

  const openFromKeyboard = (edge: "first" | "last"): void => {
    setOpen(true);
    queueMicrotask(() => {
      if (!rootRef.current) return;
      const target = edgeEnabledIndex(items.length, (index) => Boolean(items[index]?.disabled), edge);
      if (target >= 0) focusAt(rootRef.current, "[role='menuitem']", target);
    });
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    buttonProps?.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFromKeyboard("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openFromKeyboard("last");
    }
  };

  const handleItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    let target = -1;
    if (event.key === "ArrowDown") target = nextEnabledIndex(index, items.length, (candidate) => Boolean(items[candidate]?.disabled), 1);
    else if (event.key === "ArrowUp") target = nextEnabledIndex(index, items.length, (candidate) => Boolean(items[candidate]?.disabled), -1);
    else if (event.key === "Home") target = edgeEnabledIndex(items.length, (candidate) => Boolean(items[candidate]?.disabled), "first");
    else if (event.key === "End") target = edgeEnabledIndex(items.length, (candidate) => Boolean(items[candidate]?.disabled), "last");
    else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    } else if (event.key === "Tab") {
      setOpen(false);
      return;
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const nextBuffer = `${typeaheadRef.current}${event.key.toLocaleLowerCase()}`;
      typeaheadRef.current = nextBuffer;
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = setTimeout(() => {
        typeaheadRef.current = "";
      }, 500);
      const search = new Set(nextBuffer).size === 1 ? event.key.toLocaleLowerCase() : nextBuffer;
      for (let offset = 1; offset <= items.length; offset += 1) {
        const candidate = (index + offset) % items.length;
        const item = items[candidate];
        const text = typeof item?.label === "string" ? item.label : item?.id;
        if (item && !item.disabled && text?.toLocaleLowerCase().startsWith(search)) {
          target = candidate;
          break;
        }
      }
    }

    if (target < 0 || !rootRef.current) return;
    event.preventDefault();
    focusAt(rootRef.current, "[role='menuitem']", target);
  };

  const selectItem = (item: MenuItem): void => {
    if (item.disabled) return;
    onSelect?.(item.id);
    close(true);
  };

  return (
    <div
      className={classNames}
      data-open={isOpen || undefined}
      data-placement={placement}
      id={menuId}
      ref={rootRef}
      {...props}
    >
      <button
        {...buttonProps}
        aria-controls={menuId + "-surface"}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={["ag-menu__trigger", buttonProps?.className].filter(Boolean).join(" ")}
        id={triggerId}
        onClick={(event) => {
          buttonProps?.onClick?.(event);
          if (!event.defaultPrevented) setOpen(!isOpen);
        }}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type={buttonProps?.type ?? "button"}
      >
        {label}
        <Icon className="ag-menu__chevron" decorative name="chevron-down" />
      </button>
      <div
        aria-labelledby={menuLabel ? undefined : triggerId}
        aria-label={menuLabel}
        className="ag-menu__surface"
        hidden={!isOpen}
        id={menuId + "-surface"}
        role="menu"
      >
        {items.map((item, index) => (
          <button
            aria-disabled={item.disabled || undefined}
            className="ag-menu__item"
            disabled={item.disabled}
            key={item.id}
            onClick={() => selectItem(item)}
            onKeyDown={(event) => handleItemKeyDown(event, index)}
            role="menuitem"
            tabIndex={index === edgeEnabledIndex(items.length, (candidate) => Boolean(items[candidate]?.disabled), "first") ? 0 : -1}
            type="button"
          >
            {item.icon ? <Icon className="ag-menu__icon" decorative name={item.icon} /> : null}
            <span className="ag-menu__label">{item.label}</span>
            {item.shortcut ? <kbd className="ag-menu__shortcut">{item.shortcut}</kbd> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export type DropdownProps = MenuProps;

export function Dropdown(props: DropdownProps): ReactElement {
  return <Menu {...props} />;
}
