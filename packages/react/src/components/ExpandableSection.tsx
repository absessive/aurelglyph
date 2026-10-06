import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { useId, useState } from "react";

import { Icon } from "./Icon.js";

export type ExpandableSectionProps = Omit<HTMLAttributes<HTMLElement>, "children" | "title"> & {
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  eyebrow?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: ReactNode;
};

export function ExpandableSection({
  children,
  className,
  defaultOpen = false,
  disabled = false,
  eyebrow,
  headingLevel,
  id,
  onOpenChange,
  open,
  title,
  ...props
}: ExpandableSectionProps): ReactElement {
  const generatedId = useId();
  const sectionId = id ?? generatedId;
  const panelId = `${sectionId}-panel`;
  const triggerId = `${sectionId}-trigger`;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const classNames = ["ag-disclosure", className].filter(Boolean).join(" ");

  const toggleOpen = (): void => {
    if (disabled) return;
    const nextOpen = !isOpen;

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const trigger = (
    <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="ag-disclosure__trigger"
        disabled={disabled}
        id={triggerId}
        onClick={toggleOpen}
        type="button"
      >
        <span className="ag-disclosure__heading">
          {eyebrow ? <span className="ag-disclosure__eyebrow">{eyebrow}</span> : null}
          <span className="ag-disclosure__title">{title}</span>
        </span>
        <Icon className="ag-disclosure__icon" decorative name={isOpen ? "contract" : "expand"} />
      </button>
  );
  const Heading = `h${headingLevel ?? 3}` as "h3";

  return (
    <section {...props} className={classNames} data-open={isOpen ? true : undefined} id={sectionId}>
      {headingLevel ? <Heading className="ag-disclosure__heading-level">{trigger}</Heading> : trigger}
      <div
        aria-hidden={!isOpen}
        aria-labelledby={headingLevel ? triggerId : undefined}
        className="ag-disclosure__panel"
        hidden={!isOpen}
        id={panelId}
        inert={!isOpen ? true : undefined}
        role={headingLevel ? "region" : undefined}
      >
        <div className="ag-disclosure__panel-inner">{children}</div>
      </div>
    </section>
  );
}
