import type { ReactElement } from "react";

import { Sheet, type SheetProps } from "./Sheet.js";

export type DrawerSide = "start" | "end" | "top" | "bottom";

export type DrawerProps = SheetProps & {
  side?: DrawerSide;
};

/** Modal panel attached to a viewport edge. */
export function Drawer({ className, side = "end", ...props }: DrawerProps): ReactElement {
  return (
    <Sheet
      className={["ag-drawer", `ag-drawer--${side}`, className].filter(Boolean).join(" ")}
      data-side={side}
      {...props}
    />
  );
}
