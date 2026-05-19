import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type TabsItem = {
  disabled?: boolean;
  id: string;
  label: string;
};

export type TabsProps = HTMLAttributes<HTMLDivElement> & {
  activeId: string;
  children?: ReactNode;
  items: readonly TabsItem[];
  label?: string;
  onValueChange?: (id: string) => void;
};

export function Tabs({ activeId, children, className, items, label = "Sections", onValueChange, ...props }: TabsProps): ReactElement {
  const classNames = ["ag-tabs", className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      <div aria-label={label} className="ag-tabs__list" role="tablist">
        {items.map((item) => (
          <button
            aria-controls={`${item.id}-panel`}
            aria-selected={item.id === activeId}
            className={["ag-tabs__tab", item.id === activeId ? "is-active" : undefined].filter(Boolean).join(" ")}
            disabled={item.disabled}
            id={`${item.id}-tab`}
            key={item.id}
            onClick={() => onValueChange?.(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {children ? (
        <div aria-labelledby={`${activeId}-tab`} className="ag-tabs__panel" id={`${activeId}-panel`} role="tabpanel">
          {children}
        </div>
      ) : null}
    </div>
  );
}
