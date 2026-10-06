import { useId, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

import { ExpandableSection } from "./ExpandableSection.js";
import { useControllableState } from "./foundation.js";

export type AccordionItem = { id: string; title: ReactNode; content: ReactNode; disabled?: boolean; eyebrow?: ReactNode };
export type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  defaultValue?: readonly string[];
  disabled?: boolean;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  items: readonly AccordionItem[];
  onValueChange?: (value: readonly string[]) => void;
  type?: "single" | "multiple";
  value?: readonly string[];
};

export function Accordion({ className, defaultValue = [], disabled = false, headingLevel = 3, id, items, onValueChange, type = "single", value, ...props }: AccordionProps): ReactElement {
  const generatedId = useId();
  const groupId = id ?? `ag-accordion-${generatedId}`;
  const [openIds, setOpenIds] = useControllableState<readonly string[]>({ defaultValue, onChange: onValueChange, value });
  const validIds = items.filter((item) => openIds.includes(item.id)).map((item) => item.id);
  const expanded = type === "single" ? validIds.slice(0, 1) : validIds;
  return <div {...props} className={["ag-accordion", className].filter(Boolean).join(" ")} data-type={type} id={groupId}>{items.map((item, index) => <ExpandableSection className="ag-accordion__item" disabled={disabled || item.disabled} eyebrow={item.eyebrow} headingLevel={headingLevel} id={`${groupId}-item-${index}`} key={item.id} onOpenChange={(open) => { if (!disabled && !item.disabled) setOpenIds(open ? type === "single" ? [item.id] : [...expanded, item.id] : expanded.filter((candidate) => candidate !== item.id)); }} open={expanded.includes(item.id)} title={item.title}>{item.content}</ExpandableSection>)}</div>;
}
