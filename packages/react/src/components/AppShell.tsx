import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  footer?: ReactNode;
  navigation?: ReactNode;
  topBar?: ReactNode;
};

export function AppShell({
  children,
  className,
  footer,
  navigation,
  topBar,
  ...props
}: AppShellProps): ReactElement {
  const classNames = ["ag-app-shell", className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      {topBar ? <header className="ag-app-shell__top">{topBar}</header> : null}
      <div className="ag-app-shell__body">
        {navigation ? <aside className="ag-app-shell__nav">{navigation}</aside> : null}
        <main className="ag-app-shell__content">{children}</main>
      </div>
      {footer ? <footer className="ag-app-shell__footer">{footer}</footer> : null}
    </div>
  );
}
