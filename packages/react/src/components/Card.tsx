import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type CardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  children: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
};

export function Card({ children, className, eyebrow, title, ...props }: CardProps): ReactElement {
  const classNames = ["ag-card", className].filter(Boolean).join(" ");

  return (
    <section className={classNames} {...props}>
      {eyebrow || title ? (
        <header className="ag-card__header">
          {eyebrow ? <p className="ag-card__eyebrow">{eyebrow}</p> : null}
          {title ? <h2 className="ag-card__title">{title}</h2> : null}
        </header>
      ) : null}
      <div className="ag-card__body">{children}</div>
    </section>
  );
}
