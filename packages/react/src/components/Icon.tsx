import type { HTMLAttributes, ReactElement } from "react";

export type AurelglyphIconName =
  | "upload"
  | "attachment"
  | "microphone"
  | "camera"
  | "video"
  | "image"
  | "play"
  | "pause"
  | "record"
  | "stop"
  | "send"
  | "save"
  | "search"
  | "filter"
  | "settings"
  | "edit"
  | "delete"
  | "close"
  | "back"
  | "forward"
  | "check"
  | "warning"
  | "info"
  | "success";

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  name: AurelglyphIconName;
  label?: string;
};

export function Icon({
  className,
  label,
  name,
  ...props
}: IconProps): ReactElement {
  const classNames = ["ag-icon", className].filter(Boolean).join(" ");

  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={classNames}
      data-icon={name}
      role={label ? "img" : undefined}
      {...props}
    />
  );
}
