import type { HTMLAttributes, ReactElement } from "react";

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  max?: number;
  value: number;
};

export function Progress({ className, label = "Progress", max = 100, value, ...props }: ProgressProps): ReactElement {
  const classNames = ["ag-progress", className].filter(Boolean).join(" ");
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={value}
      className={classNames}
      role="progressbar"
      {...props}
    >
      <span className="ag-progress__bar" style={{ inlineSize: `${percentage}%` }} />
    </div>
  );
}
