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
  decorative?: boolean;
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

const glyphs: Record<AurelglyphIconName, string> = {
  upload: "M12 3v12m0-12 4 4m-4-4-4 4M5 15v4h14v-4",
  attachment: "M8 12.5 13.8 6.7a3 3 0 1 1 4.2 4.2l-7.4 7.4a5 5 0 0 1-7.1-7.1l7.1-7.1",
  microphone: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 17v4",
  camera: "M4 8h4l1.5-2h5L16 8h4v10H4V8Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  video: "M4 7h11v10H4V7Zm11 3 5-3v10l-5-3",
  image: "M4 6h16v12H4V6Zm3 9 3-3 2 2 3-4 3 5M8 9h.01",
  play: "M8 5v14l11-7L8 5Z",
  pause: "M7 5h4v14H7V5Zm6 0h4v14h-4V5Z",
  record: "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
  stop: "M7 7h10v10H7V7Z",
  send: "M4 12 20 4l-5 16-3-7-8-1Zm8 1 8-9",
  save: "M5 5h12l2 2v12H5V5Zm3 0v6h8V5M8 19v-5h8v5",
  search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4",
  filter: "M4 6h16l-6 7v5l-4 2v-7L4 6Z",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v3m0 11v3m8.5-8.5h-3m-11 0h-3m14.4-5.9-2.1 2.1M8.2 15.8l-2.1 2.1m0-11.8 2.1 2.1m7.6 7.6 2.1 2.1",
  edit: "M5 17.5V20h2.5L18.8 8.7l-2.5-2.5L5 17.5Zm10-10 2.5 2.5",
  delete: "M6 7h12M9 7V5h6v2m-7 0 1 13h6l1-13",
  close: "M6 6l12 12M18 6 6 18",
  back: "M15 6 9 12l6 6",
  forward: "m9 6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  warning: "M12 4 21 20H3L12 4Zm0 5v5m0 3h.01",
  info: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-9v5m0-8h.01",
  success: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-4-8 3 3 5-6"
};

export function Icon({
  className,
  decorative = false,
  name,
  title,
  ...props
}: IconProps): ReactElement {
  const classNames = ["ag-icon", className].filter(Boolean).join(" ");
  const accessibleLabel = title ?? defaultLabels[name];

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : accessibleLabel}
      className={classNames}
      data-icon={name}
      role={decorative ? undefined : "img"}
      title={decorative ? undefined : title}
      {...props}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d={glyphs[name]} />
      </svg>
    </span>
  );
}
