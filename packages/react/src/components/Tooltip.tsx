import {
  cloneElement,
  useId,
  useRef,
  useState,
  type FocusEventHandler,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode
} from "react";

import { joinIds, useDismissLayer, useViewportShift } from "./foundation.js";

type TooltipTriggerProps = {
  "aria-describedby"?: string;
  onBlur?: FocusEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
};

export type TooltipPlacement = "top" | "right" | "bottom" | "left";

export type TooltipProps = {
  children: ReactElement<TooltipTriggerProps>;
  content: ReactNode;
  id?: string;
  placement?: TooltipPlacement;
};

export function Tooltip({ children, content, id, placement = "top" }: TooltipProps): ReactElement {
  const generatedId = useId();
  const tooltipId = id ?? `ag-tooltip-${generatedId}`;
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = focused || hovered;
  const rootRef = useRef<HTMLSpanElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);

  useDismissLayer({
    enabled: open,
    onDismiss: () => {
      setFocused(false);
      setHovered(false);
    },
    refs: [rootRef]
  });
  useViewportShift({
    anchorRef: rootRef,
    enabled: open,
    onAnchorHidden: () => {
      setFocused(false);
      setHovered(false);
    },
    ref: surfaceRef
  });

  const trigger = cloneElement(children, {
    "aria-describedby": joinIds(children.props["aria-describedby"], tooltipId),
    onBlur: (event) => {
      children.props.onBlur?.(event);
      if (!event.defaultPrevented) setFocused(false);
    },
    onFocus: (event) => {
      children.props.onFocus?.(event);
      if (!event.defaultPrevented) setFocused(true);
    },
    onMouseEnter: (event) => {
      children.props.onMouseEnter?.(event);
      if (!event.defaultPrevented) setHovered(true);
    },
    onMouseLeave: (event) => {
      children.props.onMouseLeave?.(event);
      if (!event.defaultPrevented) setHovered(false);
    }
  });

  return (
    <span
      className="ag-tooltip"
      data-focused={focused || undefined}
      data-hovered={hovered || undefined}
      data-open={open || undefined}
      data-placement={placement}
      ref={rootRef}
    >
      {trigger}
      <span className="ag-tooltip__surface" hidden={!open} id={tooltipId} ref={surfaceRef} role="tooltip">
        {content}
      </span>
    </span>
  );
}
