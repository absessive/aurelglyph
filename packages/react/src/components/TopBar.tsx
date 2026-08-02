import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from "react";

export type TopBarProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  leading?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
  titleAs?: ElementType;
};

export function TopBar({
  actions,
  className,
  leading,
  subtitle,
  title,
  titleAs: Title = "h1",
  ...props
}: TopBarProps): ReactElement {
  const classNames = ["ag-top-bar", className].filter(Boolean).join(" ");

  return (
    <header className={classNames} {...props}>
      {leading ? <div className="ag-top-bar__leading">{leading}</div> : null}
      <div className="ag-top-bar__title-group">
        <Title className="ag-top-bar__title">{title}</Title>
        {subtitle ? <p className="ag-top-bar__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ag-top-bar__actions">{actions}</div> : null}
    </header>
  );
}
