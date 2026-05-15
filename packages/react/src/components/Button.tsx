import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: AurelglyphIconName;
  iconLabel?: string;
  children?: ReactNode;
};

export function Button({
  children,
  className,
  icon,
  iconLabel,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps): ReactElement {
  const classNames = ["ag-button", `ag-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classNames} type={type} {...props}>
      {icon ? <Icon className="ag-button__icon" label={iconLabel} name={icon} /> : null}
      {children ? <span className="ag-button__content">{children}</span> : null}
    </button>
  );
}
