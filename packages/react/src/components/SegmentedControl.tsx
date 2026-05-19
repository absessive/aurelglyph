import type { HTMLAttributes, ReactElement } from "react";

export type SegmentedControlItem = {
  disabled?: boolean;
  id: string;
  label: string;
};

export type SegmentedControlProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  activeId: string;
  items: readonly SegmentedControlItem[];
  label?: string;
  onValueChange?: (id: string) => void;
};

export function SegmentedControl({
  activeId,
  className,
  items,
  label = "Options",
  onValueChange,
  ...props
}: SegmentedControlProps): ReactElement {
  const classNames = ["ag-segmented", className].filter(Boolean).join(" ");

  return (
    <div aria-label={label} className={classNames} role="radiogroup" {...props}>
      {items.map((item) => (
        <button
          aria-checked={item.id === activeId}
          className={["ag-segmented__item", item.id === activeId ? "is-active" : undefined]
            .filter(Boolean)
            .join(" ")}
          disabled={item.disabled}
          key={item.id}
          onClick={() => onValueChange?.(item.id)}
          role="radio"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
