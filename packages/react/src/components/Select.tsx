import type { SelectHTMLAttributes, ReactElement } from "react";

export type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  helpText?: string;
  label: string;
  options: readonly SelectOption[];
};

export function Select({ className, helpText, id, label, options, ...props }: SelectProps): ReactElement {
  const fieldId = id ?? props.name;
  const helpId = helpText && fieldId ? `${fieldId}-help` : undefined;
  const classNames = ["ag-select__input", className].filter(Boolean).join(" ");

  return (
    <label className="ag-select">
      <span className="ag-select__label">{label}</span>
      <span className="ag-select__control">
        <select aria-describedby={helpId} className={classNames} id={fieldId} {...props}>
          {options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      {helpText ? (
        <span className="ag-select__help" id={helpId}>
          {helpText}
        </span>
      ) : null}
    </label>
  );
}
