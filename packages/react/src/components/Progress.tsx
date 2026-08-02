import type { HTMLAttributes, ReactElement } from "react";

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  max?: number;
  value: number;
};

export function Progress({ className, label = "Progress", max = 100, value, ...props }: ProgressProps): ReactElement {
  const classNames = ["ag-progress", className].filter(Boolean).join(" ");
  const resolvedMax = Number.isFinite(max) && max > 0 ? max : 100;
  const finiteValue = Number.isFinite(value) ? value : 0;
  const resolvedValue = Math.max(0, Math.min(resolvedMax, finiteValue));
  const percentage = (resolvedValue / resolvedMax) * 100;

  return (
    <div
      {...props}
      aria-label={label}
      aria-valuemax={resolvedMax}
      aria-valuemin={0}
      aria-valuenow={resolvedValue}
      className={classNames}
      role="progressbar"
    >
      <span className="ag-progress__bar" style={{ inlineSize: `${percentage}%` }} />
    </div>
  );
}
