import type { HTMLAttributes, ReactElement } from "react";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
  size?: SpinnerSize;
};

export function Spinner({ className, label = "Loading", size = "md", ...props }: SpinnerProps): ReactElement {
  return (
    <span
      aria-label={label}
      className={["ag-spinner", `ag-spinner--${size}`, className].filter(Boolean).join(" ")}
      data-size={size}
      role="status"
      {...props}
    >
      <span aria-hidden="true" className="ag-spinner__ring" />
    </span>
  );
}
