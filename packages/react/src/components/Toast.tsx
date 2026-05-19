import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  actions?: ReactNode;
  children?: ReactNode;
  title: ReactNode;
  tone?: ToastTone;
};

export function Toast({ actions, children, className, title, tone = "info", ...props }: ToastProps): ReactElement {
  const classNames = ["ag-toast", `ag-toast--${tone}`, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} role="status" {...props}>
      <span className="ag-toast__dot" aria-hidden="true" />
      <div className="ag-toast__content">
        <strong className="ag-toast__title">{title}</strong>
        {children ? <div className="ag-toast__body">{children}</div> : null}
      </div>
      {actions ? <div className="ag-toast__actions">{actions}</div> : null}
    </div>
  );
}
