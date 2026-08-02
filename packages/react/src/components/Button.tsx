import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";
import type { ControlStateProps } from "./foundation.js";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Pick<ControlStateProps, "busy" | "loading"> & {
  variant?: ButtonVariant;
  icon?: AurelglyphIconName;
  iconLabel?: string;
  children?: ReactNode;
};

export function Button({
  children,
  busy = false,
  className,
  disabled,
  icon,
  iconLabel,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps): ReactElement {
  const classNames = ["ag-button", `ag-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-busy={busy || loading || undefined}
      className={classNames}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {icon ? (
        <Icon
          className="ag-button__icon"
          decorative={!iconLabel && (Boolean(children) || Boolean(props["aria-label"]))}
          name={icon}
          title={iconLabel}
        />
      ) : null}
      {children ? <span className="ag-button__content">{children}</span> : null}
      {loading ? <span aria-hidden="true" className="ag-button__spinner" /> : null}
    </button>
  );
}
