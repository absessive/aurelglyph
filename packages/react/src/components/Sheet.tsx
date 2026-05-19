import type { DialogHTMLAttributes, ReactElement, ReactNode } from "react";

export type SheetProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "title"> & {
  actions?: ReactNode;
  children: ReactNode;
  open?: boolean;
  title: ReactNode;
};

export function Sheet({ actions, children, className, open = false, title, ...props }: SheetProps): ReactElement {
  const classNames = ["ag-sheet", className].filter(Boolean).join(" ");

  return (
    <dialog aria-modal="true" className={classNames} open={open} {...props}>
      <div className="ag-sheet__surface">
        <header className="ag-sheet__header">
          <h2 className="ag-sheet__title">{title}</h2>
          {actions ? <div className="ag-sheet__actions">{actions}</div> : null}
        </header>
        <div className="ag-sheet__body">{children}</div>
      </div>
    </dialog>
  );
}
