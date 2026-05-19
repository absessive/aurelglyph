import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "danger";

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  actions?: ReactNode;
  children?: ReactNode;
  title: ReactNode;
  tone?: AlertTone;
};

export function Alert({ actions, children, className, title, tone = "info", ...props }: AlertProps): ReactElement {
  const classNames = ["ag-alert", `ag-alert--${tone}`, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} role={tone === "danger" || tone === "warning" ? "alert" : "status"} {...props}>
      <span className="ag-alert__dot" aria-hidden="true" />
      <div className="ag-alert__content">
        <strong className="ag-alert__title">{title}</strong>
        {children ? <div className="ag-alert__body">{children}</div> : null}
      </div>
      {actions ? <div className="ag-alert__actions">{actions}</div> : null}
    </div>
  );
}
