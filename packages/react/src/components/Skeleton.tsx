import type { HTMLAttributes, ReactElement } from "react";

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
};

export function Skeleton({ className, label = "Loading", ...props }: SkeletonProps): ReactElement {
  const classNames = ["ag-skeleton", className].filter(Boolean).join(" ");

  return <span aria-label={label} className={classNames} role="status" {...props} />;
}
