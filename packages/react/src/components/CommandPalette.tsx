import type { HTMLAttributes, ReactElement } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";

export type CommandPaletteItem = {
  icon?: AurelglyphIconName;
  id: string;
  label: string;
  shortcut?: string;
};

export type CommandPaletteProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
  items: readonly CommandPaletteItem[];
  label?: string;
  onSelect?: (id: string) => void;
  placeholder?: string;
};

export function CommandPalette({
  className,
  items,
  label = "Command palette",
  onSelect,
  placeholder = "Type a command",
  ...props
}: CommandPaletteProps): ReactElement {
  const classNames = ["ag-command-palette", className].filter(Boolean).join(" ");

  return (
    <div aria-label={label} className={classNames} role="dialog" {...props}>
      <label className="ag-command-palette__search">
        <span className="ag-command-palette__label">{label}</span>
        <input className="ag-command-palette__input" placeholder={placeholder} type="search" />
      </label>
      <div className="ag-command-palette__list" role="listbox">
        {items.map((item) => (
          <button className="ag-command-palette__item" key={item.id} onClick={() => onSelect?.(item.id)} role="option" type="button">
            {item.icon ? <Icon className="ag-command-palette__icon" decorative name={item.icon} /> : null}
            <span className="ag-command-palette__item-label">{item.label}</span>
            {item.shortcut ? <kbd className="ag-command-palette__shortcut">{item.shortcut}</kbd> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
