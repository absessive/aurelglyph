import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type NavigationStackProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  headingLevel?: 1 | 2 | 3;
  title?: ReactNode;
};

export type NavigationPageProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  children: ReactNode;
  headingLevel?: 2 | 3 | 4;
  title: ReactNode;
};

export function NavigationStack({ children, className, headingLevel = 2, title, ...props }: NavigationStackProps): ReactElement {
  const classNames = ["ag-nav-stack", className].filter(Boolean).join(" ");
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";

  return (
    <div className={classNames} {...props}>
      {title ? <Heading className="ag-nav-stack__title">{title}</Heading> : null}
      <div className="ag-nav-stack__pages">{children}</div>
    </div>
  );
}

export function NavigationPage({
  actions,
  children,
  className,
  headingLevel = 3,
  title,
  ...props
}: NavigationPageProps): ReactElement {
  const classNames = ["ag-nav-page", className].filter(Boolean).join(" ");
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <section className={classNames} {...props}>
      <header className="ag-nav-page__header">
        <Heading className="ag-nav-page__title">{title}</Heading>
        {actions ? <div className="ag-nav-page__actions">{actions}</div> : null}
      </header>
      <div className="ag-nav-page__body">{children}</div>
    </section>
  );
}
