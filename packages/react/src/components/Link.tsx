import type { AnchorHTMLAttributes, ReactElement } from "react";
import { useId } from "react";

import { Icon } from "./Icon.js";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  disabled?: boolean;
  external?: boolean;
  externalLabel?: string;
  unavailableLabel?: string;
};

/** Navigation, not an action. Unavailable destinations are non-interactive placeholders. */
export function Link({ children, className, disabled = false, external = false, externalLabel, href, rel, target, unavailableLabel = "Unavailable", ...props }: LinkProps): ReactElement {
  const descriptionId = `ag-link-${useId()}`;
  const resolvedTarget = target ?? (external ? "_blank" : undefined);
  const hasExternalNotice = external || resolvedTarget === "_blank";
  const classes = ["ag-link", hasExternalNotice && "ag-link--external", className].filter(Boolean).join(" ");
  const notice = externalLabel ?? (resolvedTarget === "_blank" ? "Opens in a new tab" : "External link");
  if (disabled || !href) {
    return <span aria-describedby={[props["aria-describedby"], descriptionId].filter(Boolean).join(" ")} aria-disabled="true" className={`${classes} is-unavailable`} id={props.id} style={props.style} title={props.title}>{props["aria-label"] ? <><span aria-hidden="true">{children}</span><span className="ag-sr-only">{props["aria-label"]}</span></> : children}<span className="ag-sr-only" id={descriptionId}> {unavailableLabel}</span></span>;
  }
  return (
    <a {...props} className={classes} href={href} rel={external || resolvedTarget === "_blank" ? [...new Set(`${rel ?? ""} noopener noreferrer`.trim().split(/\s+/u))].join(" ") : rel} target={resolvedTarget}>
      {children}
      {hasExternalNotice ? <><Icon className="ag-link__icon" decorative name="external-link" /><span className="ag-sr-only"> {notice}</span></> : null}
    </a>
  );
}
