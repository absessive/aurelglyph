import type { ReactElement, ReactNode } from "react";

import { Icon } from "./Icon.js";
import { Popover, type PopoverProps } from "./Popover.js";

export type MoreInformationProps = Omit<PopoverProps, "children" | "label" | "trigger"> & {
  /** Optional explanatory content revealed by the information trigger. */
  children?: ReactNode;
  /** Accessible name for the information panel and its trigger. */
  label?: string;
  /** Compact visible trigger copy. */
  triggerLabel?: ReactNode;
};

/** Keeps optional explanatory copy available without permanently occupying the working surface. */
export function MoreInformation({
  children,
  className,
  label = "More information",
  triggerLabel = "More information",
  triggerProps,
  ...props
}: MoreInformationProps): ReactElement {
  return (
    <Popover
      {...props}
      className={["ag-more-information", className].filter(Boolean).join(" ")}
      label={label}
      trigger={
        <>
          <Icon decorative name="info" />
          <span className="ag-more-information__trigger-label">{triggerLabel}</span>
        </>
      }
      triggerProps={{
        ...triggerProps,
        "aria-label": triggerProps?.["aria-label"] ?? label,
        className: ["ag-more-information__trigger", triggerProps?.className].filter(Boolean).join(" ")
      }}
    >
      <div className="ag-more-information__content">{children}</div>
    </Popover>
  );
}
