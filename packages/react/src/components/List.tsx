import type { HTMLAttributes, LiHTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";

export type ListSectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  children: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
};

export type ListRowProps = Omit<LiHTMLAttributes<HTMLLIElement>, "title"> & {
  description?: ReactNode;
  icon?: AurelglyphIconName;
  selected?: boolean;
  title: ReactNode;
  trailing?: ReactNode;
};

export function ListSection({
  children,
  className,
  eyebrow,
  title,
  ...props
}: ListSectionProps): ReactElement {
  const classNames = ["ag-list-section", className].filter(Boolean).join(" ");

  return (
    <section className={classNames} {...props}>
      {eyebrow || title ? (
        <div className="ag-list-section__header">
          {eyebrow ? <p className="ag-list-section__eyebrow">{eyebrow}</p> : null}
          {title ? <h2 className="ag-list-section__title">{title}</h2> : null}
        </div>
      ) : null}
      <ul className="ag-list-section__list">{children}</ul>
    </section>
  );
}

export function ListRow({
  className,
  description,
  icon,
  selected = false,
  title,
  trailing,
  ...props
}: ListRowProps): ReactElement {
  const classNames = ["ag-list-row", selected ? "is-selected" : undefined, className]
    .filter(Boolean)
    .join(" ");

  return (
    <li aria-selected={selected || undefined} className={classNames} data-selected={selected || undefined} {...props}>
      {icon ? (
        <span className="ag-list-row__icon" aria-hidden="true">
          <Icon decorative name={icon} />
        </span>
      ) : null}
      <span className="ag-list-row__content">
        <span className="ag-list-row__title">{title}</span>
        {description ? <span className="ag-list-row__description">{description}</span> : null}
      </span>
      {trailing ? <span className="ag-list-row__trailing">{trailing}</span> : null}
    </li>
  );
}
