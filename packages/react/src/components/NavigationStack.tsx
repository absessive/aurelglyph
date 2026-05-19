import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type NavigationStackProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  title?: ReactNode;
};

export type NavigationPageProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  children: ReactNode;
  title: ReactNode;
};

export function NavigationStack({ children, className, title, ...props }: NavigationStackProps): ReactElement {
  const classNames = ["ag-nav-stack", className].filter(Boolean).join(" ");

  return (
    <main className={classNames} {...props}>
      {title ? <h1 className="ag-nav-stack__title">{title}</h1> : null}
      <div className="ag-nav-stack__pages">{children}</div>
    </main>
  );
}

export function NavigationPage({ actions, children, className, title, ...props }: NavigationPageProps): ReactElement {
  const classNames = ["ag-nav-page", className].filter(Boolean).join(" ");

  return (
    <section className={classNames} {...props}>
      <header className="ag-nav-page__header">
        <h2 className="ag-nav-page__title">{title}</h2>
        {actions ? <div className="ag-nav-page__actions">{actions}</div> : null}
      </header>
      <div className="ag-nav-page__body">{children}</div>
    </section>
  );
}
