import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon } from "./Icon.js";
import { Link } from "./Link.js";

export type StepStatus = "current" | "completed" | "upcoming" | "error";
export type StepperItem = { id: string; label: ReactNode; description?: ReactNode; disabled?: boolean; href?: string; status?: StepStatus };
export type StepperProps = Omit<HTMLAttributes<HTMLOListElement>, "children"> & {
  currentId?: string;
  disabled?: boolean;
  items: readonly StepperItem[];
  onStepChange?: (id: string) => void;
  statusLabels?: Partial<Record<StepStatus | "disabled", string>>;
};

const defaultStatusLabels = { current: "Current", completed: "Completed", upcoming: "Upcoming", error: "Error", disabled: "Unavailable" };
export function Stepper({ className, currentId, disabled = false, items, onStepChange, statusLabels, ...props }: StepperProps): ReactElement {
  const copy = { ...defaultStatusLabels, ...statusLabels };
  const currentIndex = currentId !== undefined ? items.findIndex((item) => item.id === currentId) : items.findIndex((item) => item.status === "current");
  return <ol {...props} className={["ag-stepper", "ag-stepper__list", className].filter(Boolean).join(" ")}>{items.map((item, index) => {
    const isCurrent = index === currentIndex;
    const status = item.status === "current" && !isCurrent ? "upcoming" : item.status ?? (isCurrent ? "current" : currentIndex >= 0 && index < currentIndex ? "completed" : "upcoming");
    const blocked = disabled || item.disabled;
    const content = <><span aria-hidden="true" className="ag-stepper__marker">{status === "completed" || status === "error" ? <Icon decorative name={status === "completed" ? "check" : "warning"} /> : index + 1}</span><span className="ag-stepper__content"><span className="ag-stepper__label">{item.label}</span><span className="ag-stepper__status">{isCurrent && status !== "current" ? <>{copy.current}<span aria-hidden="true"> · </span></> : null}{copy[status]}{blocked ? <><span aria-hidden="true"> · </span>{copy.disabled}</> : null}</span>{item.description ? <span className="ag-stepper__description">{item.description}</span> : null}</span></>;
    return <li aria-current={isCurrent ? "step" : undefined} className={["ag-stepper__item", `is-${status}`, isCurrent && status !== "current" && "is-current", blocked && "is-disabled"].filter(Boolean).join(" ")} key={item.id}>{item.href && !blocked ? <Link className="ag-stepper__action" href={item.href}>{content}</Link> : onStepChange && !blocked ? <button className="ag-stepper__action" onClick={() => onStepChange(item.id)} type="button">{content}</button> : <span className="ag-stepper__action">{content}</span>}</li>;
  })}</ol>;
}
