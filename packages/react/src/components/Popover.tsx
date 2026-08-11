import {
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode
} from "react";

import { useControllableState, useDismissLayer, useViewportShift } from "./foundation.js";

export type PopoverPlacement = "top" | "right" | "bottom" | "left";

export type PopoverProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  label: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: PopoverPlacement;
  trigger: ReactNode;
  triggerProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;
};

export function Popover({
  children,
  className,
  defaultOpen = false,
  disabled = false,
  id,
  label,
  onOpenChange,
  open,
  placement = "bottom",
  trigger,
  triggerProps,
  ...props
}: PopoverProps): ReactElement {
  const generatedId = useId();
  const popoverId = id ?? `ag-popover-${generatedId}`;
  const panelId = `${popoverId}-panel`;
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useControllableState({ defaultValue: defaultOpen, onChange: onOpenChange, value: open });

  useDismissLayer({
    enabled: isOpen,
    onDismiss: (reason) => {
      setOpen(false);
      if (reason === "escape") queueMicrotask(() => triggerRef.current?.focus());
    },
    refs: [rootRef]
  });
  useViewportShift({
    anchorRef: triggerRef,
    enabled: isOpen,
    onAnchorHidden: () => setOpen(false),
    ref: surfaceRef
  });

  return (
    <div
      className={["ag-popover", className].filter(Boolean).join(" ")}
      data-open={isOpen || undefined}
      data-placement={placement}
      id={popoverId}
      ref={rootRef}
      {...props}
    >
      <button
        {...triggerProps}
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={["ag-popover__trigger", triggerProps?.className].filter(Boolean).join(" ")}
        disabled={disabled || triggerProps?.disabled}
        onClick={(event) => {
          triggerProps?.onClick?.(event);
          if (!event.defaultPrevented) setOpen(!isOpen);
        }}
        ref={triggerRef}
        type="button"
      >
        {trigger}
      </button>
      <div aria-label={label} className="ag-popover__surface" hidden={!isOpen} id={panelId} ref={surfaceRef} role="dialog">
        {children}
      </div>
    </div>
  );
}
