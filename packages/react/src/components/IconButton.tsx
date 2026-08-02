import type { ReactElement } from "react";

import { Button, type ButtonProps } from "./Button.js";
import type { AurelglyphIconName } from "./Icon.js";

export type IconButtonProps = Omit<ButtonProps, "aria-label" | "children" | "icon" | "iconLabel"> & {
  icon: AurelglyphIconName;
  label: string;
};

export function IconButton({ className, icon, label, ...props }: IconButtonProps): ReactElement {
  return (
    <Button
      aria-label={label}
      className={["ag-icon-button", className].filter(Boolean).join(" ")}
      icon={icon}
      {...props}
    />
  );
}
