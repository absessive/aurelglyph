import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from "react";

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  contentAs?: ElementType;
  footer?: ReactNode;
  navigation?: ReactNode;
  topBar?: ReactNode;
};

export function AppShell({
  children,
  className,
  contentAs: Content = "main",
  footer,
  navigation,
  topBar,
  ...props
}: AppShellProps): ReactElement {
  const classNames = ["ag-app-shell", className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      {topBar ? <div className="ag-app-shell__top">{topBar}</div> : null}
      <div className="ag-app-shell__body">
        {navigation ? <aside className="ag-app-shell__nav">{navigation}</aside> : null}
        <Content className="ag-app-shell__content">{children}</Content>
      </div>
      {footer ? <footer className="ag-app-shell__footer">{footer}</footer> : null}
    </div>
  );
}
