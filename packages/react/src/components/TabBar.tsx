import type { AnchorHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";

export type TabBarItem = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  icon?: AurelglyphIconName;
  id: string;
  label: ReactNode;
};

export type TabBarProps = HTMLAttributes<HTMLElement> & {
  activeId?: string;
  items: TabBarItem[];
  label?: string;
};

export function TabBar({
  activeId,
  className,
  items,
  label = "Primary",
  ...props
}: TabBarProps): ReactElement {
  const classNames = ["ag-tab-bar", className].filter(Boolean).join(" ");

  return (
    <nav aria-label={label} className={classNames} {...props}>
      {items.map(({ icon, id, label: itemLabel, ...itemProps }) => {
        const isActive = id === activeId;

        return (
          <a
            {...itemProps}
            aria-current={isActive ? "page" : itemProps["aria-current"]}
            className={["ag-tab-bar__item", isActive ? "is-active" : undefined, itemProps.className]
              .filter(Boolean)
              .join(" ")}
            data-active={isActive ? true : undefined}
            key={id}
          >
            {icon ? <Icon className="ag-tab-bar__icon" decorative name={icon} /> : null}
            <span className="ag-tab-bar__label">{itemLabel}</span>
          </a>
        );
      })}
    </nav>
  );
}
