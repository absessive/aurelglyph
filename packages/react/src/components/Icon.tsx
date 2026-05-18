import type { HTMLAttributes, ReactElement } from "react";

export type AurelglyphIconName =
  | "home"
  | "dashboard"
  | "user"
  | "users"
  | "bell"
  | "mail"
  | "calendar"
  | "clock"
  | "plus"
  | "minus"
  | "upload"
  | "download"
  | "attachment"
  | "share"
  | "send"
  | "copy"
  | "save"
  | "lock"
  | "unlock"
  | "shield"
  | "eye"
  | "eye-off"
  | "search"
  | "filter"
  | "sort"
  | "menu"
  | "more-horizontal"
  | "more-vertical"
  | "settings"
  | "edit"
  | "delete"
  | "close"
  | "back"
  | "forward"
  | "chevron-down"
  | "chevron-up"
  | "external-link"
  | "refresh"
  | "sync"
  | "check"
  | "warning"
  | "info"
  | "success"
  | "cloud"
  | "database"
  | "server"
  | "terminal"
  | "code"
  | "archive"
  | "star"
  | "heart"
  | "bookmark"
  | "tag"
  | "map-pin"
  | "location"
  | "phone"
  | "message"
  | "chat"
  | "grid"
  | "list"
  | "columns"
  | "table"
  | "layout"
  | "panel"
  | "sidebar"
  | "command"
  | "package"
  | "cube"
  | "layers"
  | "workflow"
  | "branch"
  | "git-branch"
  | "link"
  | "unlink"
  | "log-in"
  | "log-out"
  | "power"
  | "play"
  | "pause"
  | "stop"
  | "record"
  | "microphone"
  | "camera"
  | "video"
  | "image"
  | "music"
  | "volume"
  | "mute"
  | "wallet"
  | "credit-card"
  | "cart"
  | "receipt"
  | "chart-line"
  | "chart-bar"
  | "activity"
  | "spark"
  | "bolt"
  | "target"
  | "compass"
  | "thumbs-up"
  | "thumbs-down"
  | "help"
  | "notification"
  | "expand"
  | "contract";

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  decorative?: boolean;
  name: AurelglyphIconName;
};

const defaultLabels: Record<AurelglyphIconName, string> = {
  home: "Home",
  dashboard: "Dashboard",
  user: "User",
  users: "Users",
  bell: "Bell",
  mail: "Mail",
  calendar: "Calendar",
  clock: "Clock",
  plus: "Plus",
  minus: "Minus",
  upload: "Upload",
  download: "Download",
  attachment: "Attachment",
  share: "Share",
  send: "Send",
  copy: "Copy",
  save: "Save",
  lock: "Lock",
  unlock: "Unlock",
  shield: "Shield",
  eye: "Eye",
  "eye-off": "Eye off",
  search: "Search",
  filter: "Filter",
  sort: "Sort",
  menu: "Menu",
  "more-horizontal": "More horizontal",
  "more-vertical": "More vertical",
  settings: "Settings",
  edit: "Edit",
  delete: "Delete",
  close: "Close",
  back: "Back",
  forward: "Forward",
  "chevron-down": "Chevron down",
  "chevron-up": "Chevron up",
  "external-link": "External link",
  refresh: "Refresh",
  sync: "Sync",
  check: "Check",
  warning: "Warning",
  info: "Info",
  success: "Success",
  cloud: "Cloud",
  database: "Database",
  server: "Server",
  terminal: "Terminal",
  code: "Code",
  archive: "Archive",
  star: "Star",
  heart: "Heart",
  bookmark: "Bookmark",
  tag: "Tag",
  "map-pin": "Map pin",
  location: "Location",
  phone: "Phone",
  message: "Message",
  chat: "Chat",
  grid: "Grid",
  list: "List",
  columns: "Columns",
  table: "Table",
  layout: "Layout",
  panel: "Panel",
  sidebar: "Sidebar",
  command: "Command",
  package: "Package",
  cube: "Cube",
  layers: "Layers",
  workflow: "Workflow",
  branch: "Branch",
  "git-branch": "Git branch",
  link: "Link",
  unlink: "Unlink",
  "log-in": "Log in",
  "log-out": "Log out",
  power: "Power",
  play: "Play",
  pause: "Pause",
  stop: "Stop",
  record: "Record",
  microphone: "Microphone",
  camera: "Camera",
  video: "Video",
  image: "Image",
  music: "Music",
  volume: "Volume",
  mute: "Mute",
  wallet: "Wallet",
  "credit-card": "Credit card",
  cart: "Cart",
  receipt: "Receipt",
  "chart-line": "Chart line",
  "chart-bar": "Chart bar",
  activity: "Activity",
  spark: "Spark",
  bolt: "Bolt",
  target: "Target",
  compass: "Compass",
  "thumbs-up": "Thumbs up",
  "thumbs-down": "Thumbs down",
  help: "Help",
  notification: "Notification",
  expand: "Expand",
  contract: "Contract"
};

const glyphs: Record<AurelglyphIconName, string> = {
  home: "M4 11.5 12 4l8 7.5V20h-5v-5H9v5H4v-8.5Z",
  dashboard: "M4 5h16v14H4V5Zm3 10h3V8H7v7Zm5 0h5v-4h-5v4Zm0-6h5V8h-5v1Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0 0-6m0 9a5 5 0 0 1 5 5",
  bell: "M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4L6 17Zm4 0a2 2 0 0 0 4 0",
  mail: "M4 6h16v12H4V6Zm0 2 8 5 8-5",
  calendar: "M5 6h14v14H5V6Zm0 4h14M8 4v4m8-4v4",
  clock: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12v5l3 2",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  upload: "M12 3v12m0-12 4 4m-4-4-4 4M5 15v4h14v-4",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M5 19h14",
  attachment: "M8 12.5 13.8 6.7a3 3 0 1 1 4.2 4.2l-7.4 7.4a5 5 0 0 1-7.1-7.1l7.1-7.1",
  share: "M12 4v10m0-10 4 4m-4-4-4 4M5 11v8h14v-8",
  send: "M4 12 20 4l-5 16-3-7-8-1Zm8 1 8-9",
  copy: "M8 8h10v12H8V8Zm-2 8H4V4h10v2",
  save: "M5 5h12l2 2v12H5V5Zm3 0v6h8V5M8 19v-5h8v5",
  lock: "M6 11h12v9H6v-9Zm3 0V8a3 3 0 0 1 6 0v3",
  unlock: "M6 11h12v9H6v-9Zm3 0V8a3 3 0 0 1 5.5-1.7",
  shield: "M12 3 20 6v5c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3Z",
  eye: "M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  "eye-off": "M4 4l16 16M9.2 6.6A9.6 9.6 0 0 1 12 6c5.8 0 9 6 9 6a16 16 0 0 1-2.2 3M6.4 8.4A16 16 0 0 0 3 12s3.2 6 9 6c1 0 1.9-.2 2.8-.5",
  search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4",
  filter: "M4 6h16l-6 7v5l-4 2v-7L4 6Z",
  sort: "M8 5v14m0 0-3-3m3 3 3-3m5 3V5m0 0-3 3m3-3 3 3",
  menu: "M4 7h16M4 12h16M4 17h16",
  "more-horizontal": "M6 12h.01M12 12h.01M18 12h.01",
  "more-vertical": "M12 6h.01M12 12h.01M12 18h.01",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v3m0 11v3m8.5-8.5h-3m-11 0h-3m14.4-5.9-2.1 2.1M8.2 15.8l-2.1 2.1m0-11.8 2.1 2.1m7.6 7.6 2.1 2.1",
  edit: "M5 17.5V20h2.5L18.8 8.7l-2.5-2.5L5 17.5Zm10-10 2.5 2.5",
  delete: "M6 7h12M9 7V5h6v2m-7 0 1 13h6l1-13",
  close: "M6 6l12 12M18 6 6 18",
  back: "M15 6 9 12l6 6",
  forward: "m9 6 6 6-6 6",
  "chevron-down": "m6 9 6 6 6-6",
  "chevron-up": "m6 15 6-6 6 6",
  "external-link": "M10 6H5v13h13v-5M14 5h5v5m0-5-9 9",
  refresh: "M19 8a7 7 0 0 0-12-2l-2 2m0 0h5M5 8V3m0 13a7 7 0 0 0 12 2l2-2m0 0h-5m5 0v5",
  sync: "M17 4h4v4m0-4-5 5a6 6 0 0 0-10 3m1 8H3v-4m0 4 5-5a6 6 0 0 0 10-3",
  check: "m5 12 4 4L19 6",
  warning: "M12 4 21 20H3L12 4Zm0 5v5m0 3h.01",
  info: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-9v5m0-8h.01",
  success: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-4-8 3 3 5-6",
  cloud: "M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 2A3 3 0 0 0 7 18Z",
  database: "M5 7c0-2 14-2 14 0v10c0 2-14 2-14 0V7Zm0 0c0 2 14 2 14 0M5 12c0 2 14 2 14 0",
  server: "M4 5h16v6H4V5Zm0 8h16v6H4v-6Zm3-5h.01M7 16h.01",
  terminal: "M4 5h16v14H4V5Zm4 5 3 2-3 2m5 1h4",
  code: "m9 8-4 4 4 4m6-8 4 4-4 4m-2-10-2 12",
  archive: "M4 6h16v4H4V6Zm2 4v10h12V10m-8 4h4",
  star: "m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 4Z",
  heart: "M12 20s-8-4.8-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.2-8 10-8 10Z",
  bookmark: "M6 4h12v16l-6-3-6 3V4Z",
  tag: "M4 6v6l8 8 8-8-8-8H6a2 2 0 0 0-2 2Zm5 2h.01",
  "map-pin": "M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  location: "M12 3v3m0 12v3m9-9h-3M6 12H3m15.4-6.4-2.1 2.1M7.7 16.3l-2.1 2.1m0-12.8 2.1 2.1m8.6 8.6 2.1 2.1M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  phone: "M7 4h10v16H7V4Zm3 2h4M11 18h2",
  message: "M4 5h16v11H9l-5 4V5Z",
  chat: "M5 6h14v9H9l-4 4V6Zm4 3h6m-6 3h4",
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  columns: "M4 5h16v14H4V5Zm8 0v14",
  table: "M4 5h16v14H4V5Zm0 5h16M9 5v14m6-14v14",
  layout: "M4 5h16v14H4V5Zm0 5h16m-6 0v9",
  panel: "M4 5h16v14H4V5Zm4 0v14m0-9h12",
  sidebar: "M4 5h16v14H4V5Zm5 0v14",
  command: "M8 8H6a2 2 0 1 1 2-2v12a2 2 0 1 1-2-2h12a2 2 0 1 1-2 2V6a2 2 0 1 1 2 2H8Z",
  package: "M4 8 12 4l8 4v9l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v9",
  cube: "M12 3 20 8v8l-8 5-8-5V8l8-5Zm0 0v8m0 0 8-3m-8 3-8-3",
  layers: "m12 4 9 5-9 5-9-5 9-5Zm-7 9 7 4 7-4M5 17l7 4 7-4",
  workflow: "M5 7h5v5H5V7Zm9 5h5v5h-5v-5Zm-4-2h2a2 2 0 0 1 2 2m-9 0v2a2 2 0 0 0 2 2h5",
  branch: "M7 5v8a4 4 0 0 0 4 4h6M17 13l4 4-4 4M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  "git-branch": "M7 4v10a4 4 0 0 0 4 4h3M17 4v3a5 5 0 0 1-5 5H7M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  link: "M10 8h4m-5 8H7a4 4 0 0 1 0-8h3m5 8h2a4 4 0 0 0 0-8h-3",
  unlink: "M4 4l16 16M10 8h4m-5 8H7a4 4 0 0 1-.8-7.9M15 16h2a4 4 0 0 0 2.6-7",
  "log-in": "M4 4h8v16H4M12 12h8m0 0-3-3m3 3-3 3",
  "log-out": "M12 4h8v16h-8M4 12h10m0 0-3-3m3 3-3 3",
  power: "M12 3v8m5.7-5.7a8 8 0 1 1-11.4 0",
  play: "M8 5v14l11-7L8 5Z",
  pause: "M7 5h4v14H7V5Zm6 0h4v14h-4V5Z",
  stop: "M7 7h10v10H7V7Z",
  record: "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
  microphone: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0M12 17v4",
  camera: "M4 8h4l1.5-2h5L16 8h4v10H4V8Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  video: "M4 7h11v10H4V7Zm11 3 5-3v10l-5-3",
  image: "M4 6h16v12H4V6Zm3 9 3-3 2 2 3-4 3 5M8 9h.01",
  music: "M9 18a3 3 0 1 1-2-2.8V6l11-2v10.5a3 3 0 1 1-2-2.8V8L9 9.4V18Z",
  volume: "M4 10v4h4l5 4V6l-5 4H4Zm12-1a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12",
  mute: "M4 10v4h4l5 4V6l-5 4H4Zm12 0 5 5m0-5-5 5",
  wallet: "M4 7h15v12H4V7Zm0 0 3-3h10v3m-1 6h3",
  "credit-card": "M4 6h16v12H4V6Zm0 4h16M7 15h4",
  cart: "M4 5h2l2 10h9l3-7H7m2 11h.01M17 19h.01",
  receipt: "M6 4h12v16l-3-2-3 2-3-2-3 2V4Zm3 5h6m-6 4h6",
  "chart-line": "M4 18h16M6 15l4-4 3 3 5-7",
  "chart-bar": "M5 19V9h4v10m3 0V5h4v14m3 0v-7h2",
  activity: "M3 12h4l2-6 4 12 2-6h6",
  spark: "M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Zm6 12 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z",
  bolt: "M13 3 5 14h6l-1 7 8-11h-6l1-7Z",
  target: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-4h.01",
  compass: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3-11-2 5-5 2 2-5 5-2Z",
  "thumbs-up": "M7 10v10H4V10h3Zm3 10h6.5a2 2 0 0 0 2-1.7l1-6A2 2 0 0 0 17.5 10H14l1-4a2 2 0 0 0-3.5-1.7L8 10v8a2 2 0 0 0 2 2Z",
  "thumbs-down": "M7 14V4H4v10h3Zm3-10h6.5a2 2 0 0 1 2 1.7l1 6a2 2 0 0 1-2 2.3H14l1 4a2 2 0 0 1-3.5 1.7L8 14V6a2 2 0 0 1 2-2Z",
  help: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-2-10a2 2 0 1 1 3.3 1.5c-.9.8-1.3 1.1-1.3 2.5m0 3h.01",
  notification: "M6 17h12l-1.5-2v-4a4.5 4.5 0 0 0-9 0v4L6 17Zm4 0a2 2 0 0 0 4 0M18 5h.01",
  expand: "M4 9V4h5M4 4l6 6m10-1V4h-5m5 0-6 6M4 15v5h5m-5 0 6-6m10 1v5h-5m5 0-6-6",
  contract: "M10 4v6H4m6 0L4 4m10 0v6h6m-6 0 6-6M10 20v-6H4m6 0-6 6m10 0v-6h6m-6 0 6 6"
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
