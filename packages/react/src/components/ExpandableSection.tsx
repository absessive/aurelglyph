import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { useId, useState } from "react";

import { Icon } from "./Icon.js";

export type ExpandableSectionProps = Omit<HTMLAttributes<HTMLElement>, "children" | "title"> & {
  children: ReactNode;
  defaultOpen?: boolean;
  eyebrow?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: ReactNode;
};

export function ExpandableSection({
  children,
  className,
  defaultOpen = false,
  eyebrow,
  id,
  onOpenChange,
  open,
  title,
  ...props
}: ExpandableSectionProps): ReactElement {
  const generatedId = useId();
  const sectionId = id ?? generatedId;
  const panelId = `${sectionId}-panel`;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const classNames = ["ag-disclosure", className].filter(Boolean).join(" ");

  const toggleOpen = (): void => {
    const nextOpen = !isOpen;

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  return (
    <section {...props} className={classNames} data-open={isOpen ? true : undefined} id={sectionId}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="ag-disclosure__trigger"
        onClick={toggleOpen}
        type="button"
      >
        <span className="ag-disclosure__heading">
          {eyebrow ? <span className="ag-disclosure__eyebrow">{eyebrow}</span> : null}
          <span className="ag-disclosure__title">{title}</span>
        </span>
        <Icon className="ag-disclosure__icon" decorative name={isOpen ? "contract" : "expand"} />
      </button>
      <div aria-hidden={!isOpen} className="ag-disclosure__panel" id={panelId}>
        <div className="ag-disclosure__panel-inner">{children}</div>
      </div>
    </section>
  );
}
