import { useId, type FieldsetHTMLAttributes, type ReactElement, type ReactNode } from "react";

import { joinIds, useControllableState, type ControlStateProps } from "./foundation.js";

export type RadioOption = {
  description?: ReactNode;
  disabled?: boolean;
  label: ReactNode;
  value: string;
};

export type RadioGroupProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> &
  Pick<ControlStateProps, "invalid" | "loading" | "readOnly" | "required"> & {
    defaultValue?: string | null;
    error?: ReactNode;
    helpText?: ReactNode;
    label: ReactNode;
    name?: string;
    onValueChange?: (value: string) => void;
    options: readonly RadioOption[];
    orientation?: "horizontal" | "vertical";
    value?: string | null;
  };

export function RadioGroup({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  defaultValue,
  disabled,
  error,
  helpText,
  id,
  invalid = false,
  label,
  loading = false,
  name,
  onValueChange,
  options,
  orientation = "vertical",
  readOnly = false,
  required,
  value,
  ...props
}: RadioGroupProps): ReactElement {
  const generatedId = useId();
  const groupId = id ?? `ag-radio-${generatedId}`;
  const groupName = name ?? groupId;
  const helpId = helpText ? `${groupId}-help` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const [selected, setSelected] = useControllableState<string | null>({
    defaultValue: defaultValue ?? null,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
    value
  });

  return (
    <fieldset
      {...props}
      aria-busy={loading || undefined}
      aria-describedby={joinIds(ariaDescribedBy, helpId, errorId)}
      aria-invalid={isInvalid || undefined}
      aria-required={required || undefined}
      className={["ag-radio-group", className].filter(Boolean).join(" ")}
      data-invalid={isInvalid || undefined}
      data-loading={loading || undefined}
      data-orientation={orientation}
      data-readonly={readOnly || undefined}
      disabled={disabled || loading}
      id={groupId}
    >
      <legend className="ag-radio-group__legend">{label}</legend>
      <div className="ag-radio-group__options">
        {options.map((option, index) => {
          const optionId = `${groupId}-option-${index}`;
          const descriptionId = option.description ? `${optionId}-description` : undefined;
          return (
            <label className="ag-radio" htmlFor={optionId} key={option.value}>
              <input
                aria-describedby={descriptionId}
                checked={selected === option.value}
                className="ag-radio__input"
                disabled={option.disabled}
                id={optionId}
                name={groupName}
                onChange={() => {
                  if (!readOnly) setSelected(option.value);
                }}
                required={required}
                type="radio"
                value={option.value}
              />
              <span aria-hidden="true" className="ag-radio__circle" />
              <span className="ag-radio__copy">
                <span className="ag-radio__label">{option.label}</span>
                {option.description ? (
                  <span className="ag-radio__description" id={descriptionId}>
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {helpText ? (
        <span className="ag-radio-group__help" id={helpId}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="ag-radio-group__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
