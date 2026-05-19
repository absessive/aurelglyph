import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  label?: string;
};

export function Toolbar({ children, className, label = "Toolbar", ...props }: ToolbarProps): ReactElement {
  const classNames = ["ag-toolbar", className].filter(Boolean).join(" ");

  return (
    <div aria-label={label} className={classNames} role="toolbar" {...props}>
      {children}
    </div>
  );
}
