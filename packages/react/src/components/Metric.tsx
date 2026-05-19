import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type MetricProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  delta?: ReactNode;
  label: ReactNode;
  value: ReactNode;
};

export function Metric({ className, delta, label, value, ...props }: MetricProps): ReactElement {
  const classNames = ["ag-metric", className].filter(Boolean).join(" ");

  return (
    <section className={classNames} {...props}>
      <p className="ag-metric__label">{label}</p>
      <strong className="ag-metric__value">{value}</strong>
      {delta ? <span className="ag-metric__delta">{delta}</span> : null}
    </section>
  );
}
