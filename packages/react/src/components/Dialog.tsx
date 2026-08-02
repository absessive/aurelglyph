import type { ReactElement } from "react";

import {
  Sheet,
  type SheetDismissReason,
  type SheetOpenChangeDetails,
  type SheetProps
} from "./Sheet.js";

export type DialogDismissReason = SheetDismissReason;
export type DialogOpenChangeDetails = SheetOpenChangeDetails;
export type DialogVariant = "default" | "compact" | "wide";

export type DialogProps = SheetProps & {
  variant?: DialogVariant;
};

/** Accessible modal dialog with focus containment, dismissal, and focus restoration. */
export function Dialog({ className, variant = "default", ...props }: DialogProps): ReactElement {
  return (
    <Sheet
      className={["ag-dialog", `ag-dialog--${variant}`, className].filter(Boolean).join(" ")}
      data-variant={variant}
      {...props}
    />
  );
}
