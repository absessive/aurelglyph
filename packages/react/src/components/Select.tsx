import { useId, type ReactElement, type ReactNode, type SelectHTMLAttributes } from "react";

import { joinIds, type ControlStateProps } from "./foundation.js";

export type SelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> &
  Pick<ControlStateProps, "busy" | "invalid"> & {
    error?: ReactNode;
    helpText?: ReactNode;
    label: ReactNode;
    options: readonly SelectOption[];
  };

export function Select({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  busy = false,
  className,
  error,
  helpText,
  id,
  invalid = false,
  label,
  options,
  ...props
}: SelectProps): ReactElement {
  const generatedId = useId();
  const fieldId = id ?? `ag-select-${generatedId}`;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const classNames = ["ag-select__input", className].filter(Boolean).join(" ");

  return (
    <div className="ag-select" data-busy={busy || undefined} data-invalid={isInvalid || undefined}>
      <label className="ag-select__label" htmlFor={fieldId}>
        {label}
      </label>
      <span className="ag-select__control">
        <select
          {...props}
          aria-busy={busy || undefined}
          aria-describedby={joinIds(ariaDescribedBy, helpId, errorId)}
          aria-invalid={isInvalid || undefined}
          className={classNames}
          id={fieldId}
        >
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
      {error ? (
        <span aria-live="polite" className="ag-select__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
