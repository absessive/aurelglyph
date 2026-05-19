import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";

export type EmptyStateProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  children?: ReactNode;
  icon?: AurelglyphIconName;
  title: ReactNode;
};

export function EmptyState({ actions, children, className, icon = "archive", title, ...props }: EmptyStateProps): ReactElement {
  const classNames = ["ag-empty-state", className].filter(Boolean).join(" ");

  return (
    <section className={classNames} {...props}>
      <span className="ag-empty-state__icon" aria-hidden="true">
        <Icon decorative name={icon} />
      </span>
      <h2 className="ag-empty-state__title">{title}</h2>
      {children ? <div className="ag-empty-state__body">{children}</div> : null}
      {actions ? <div className="ag-empty-state__actions">{actions}</div> : null}
    </section>
  );
}
