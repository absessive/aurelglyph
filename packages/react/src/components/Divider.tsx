import type { HTMLAttributes, ReactElement } from "react";

export type DividerProps = HTMLAttributes<HTMLElement> & {
  label?: string;
  orientation?: "horizontal" | "vertical";
};

export function Divider({ className, label, orientation = "horizontal", ...props }: DividerProps): ReactElement {
  if (orientation === "horizontal") {
    return (
      <div
        aria-label={label}
        className={["ag-divider", className].filter(Boolean).join(" ")}
        data-orientation="horizontal"
        role="separator"
        {...props}
      >
        {label ? <span className="ag-divider__label">{label}</span> : null}
      </div>
    );
  }

  return (
    <div
      aria-label={label}
      aria-orientation="vertical"
      className={["ag-divider", className].filter(Boolean).join(" ")}
      data-orientation="vertical"
      role="separator"
      {...props}
    />
  );
}
