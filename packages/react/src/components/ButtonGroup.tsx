import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  label: string;
  orientation?: "horizontal" | "vertical";
};

export function ButtonGroup({
  children,
  className,
  label,
  orientation = "horizontal",
  ...props
}: ButtonGroupProps): ReactElement {
  return (
    <div
      aria-label={label}
      className={["ag-button-group", className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
}
