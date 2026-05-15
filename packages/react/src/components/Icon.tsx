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
};

const defaultLabels: Record<AurelglyphIconName, string> = {
  upload: "Upload",
  attachment: "Attachment",
  microphone: "Microphone",
  camera: "Camera",
  video: "Video",
  image: "Image",
  play: "Play",
  pause: "Pause",
  record: "Record",
  stop: "Stop",
  send: "Send",
  save: "Save",
  search: "Search",
  filter: "Filter",
  settings: "Settings",
  edit: "Edit",
  delete: "Delete",
  close: "Close",
  back: "Back",
  forward: "Forward",
  check: "Check",
  warning: "Warning",
  info: "Info",
  success: "Success"
};

export function Icon({
  className,
  name,
  title,
  ...props
}: IconProps): ReactElement {
  const classNames = ["ag-icon", className].filter(Boolean).join(" ");
  const accessibleLabel = title ?? defaultLabels[name];

  return (
    <span
      aria-label={accessibleLabel}
      className={classNames}
      data-icon={name}
      role="img"
      title={title}
      {...props}
    />
  );
}
