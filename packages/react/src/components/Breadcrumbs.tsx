import type { AnchorHTMLAttributes, HTMLAttributes, ReactElement } from "react";

export type BreadcrumbItem = AnchorHTMLAttributes<HTMLAnchorElement> & {
  current?: boolean;
  label: string;
};

export type BreadcrumbsProps = HTMLAttributes<HTMLElement> & {
  items: readonly BreadcrumbItem[];
  label?: string;
};

export function Breadcrumbs({ className, items, label = "Breadcrumb", ...props }: BreadcrumbsProps): ReactElement {
  const classNames = ["ag-breadcrumbs", className].filter(Boolean).join(" ");

  return (
    <nav aria-label={label} className={classNames} {...props}>
      <ol className="ag-breadcrumbs__list">
        {items.map(({ current = false, label: itemLabel, ...item }, index) => (
          <li className="ag-breadcrumbs__item" key={`${itemLabel}-${index}`}>
            {current ? (
              <span aria-current="page" className="ag-breadcrumbs__current">
                {itemLabel}
              </span>
            ) : (
              <a className="ag-breadcrumbs__link" {...item}>
                {itemLabel}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
