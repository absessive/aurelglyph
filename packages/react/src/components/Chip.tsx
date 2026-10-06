import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon } from "./Icon.js";
import type { ControlStateProps } from "./foundation.js";
import { useFormControlState } from "./form-control-state.js";

export type ChipProps = Omit<HTMLAttributes<HTMLSpanElement>, "onChange" | "children"> & Pick<ControlStateProps, "disabled" | "loading" | "readOnly"> & {
  defaultSelected?: boolean;
  label: ReactNode;
  name?: string;
  onSelectedChange?: (selected: boolean) => void;
  selectable?: boolean;
  selected?: boolean;
  value?: string;
} & ({ onRemove: () => void; removeLabel: string } | { onRemove?: never; removeLabel?: never });

export function Chip({ className, defaultSelected = false, disabled = false, label, loading = false, name, onRemove, onSelectedChange, readOnly = false, removeLabel, selectable = true, selected, value = "on", ...props }: ChipProps): ReactElement {
  const [isSelected, setSelected, ref] = useFormControlState<boolean, HTMLSpanElement>({ defaultValue: defaultSelected, onChange: onSelectedChange, value: selected });
  const blocked = disabled || loading;
  return (
    <span {...props} aria-busy={loading || undefined} className={["ag-chip", isSelected && "is-selected", blocked && "is-disabled", className].filter(Boolean).join(" ")} data-readonly={readOnly || undefined} ref={ref}>
      {selectable ? <button aria-disabled={readOnly || undefined} aria-pressed={isSelected} className="ag-chip__select" disabled={blocked} onClick={() => { if (!blocked && !readOnly) setSelected(!isSelected); }} type="button">{isSelected ? <Icon decorative name="check" /> : null}<span className="ag-chip__label">{label}</span></button> : <span className="ag-chip__label">{label}</span>}
      {onRemove ? <button aria-disabled={readOnly || undefined} aria-label={removeLabel} className="ag-chip__remove" disabled={blocked} onClick={() => { if (!blocked && !readOnly) onRemove(); }} type="button"><Icon decorative name="close" /></button> : null}
      {name && isSelected ? <input className="ag-chip__value" disabled={blocked} name={name} type="hidden" value={value} /> : null}
    </span>
  );
}
