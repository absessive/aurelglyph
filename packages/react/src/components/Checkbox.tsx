import { useId, type InputHTMLAttributes, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { joinIds, type ControlStateProps } from "./foundation.js";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
  Pick<ControlStateProps, "invalid" | "loading"> & {
    description?: ReactNode;
    error?: ReactNode;
    indeterminate?: boolean;
    label: ReactNode;
  };

export function Checkbox({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  checked,
  className,
  description,
  disabled,
  error,
  id,
  indeterminate = false,
  invalid = false,
  label,
  loading = false,
  onClick,
  ...props
}: CheckboxProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? `ag-checkbox-${generatedId}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const classNames = ["ag-checkbox", className].filter(Boolean).join(" ");

  return (
    <div
      className={classNames}
      data-indeterminate={indeterminate || undefined}
      data-invalid={isInvalid || undefined}
      data-loading={loading || undefined}
    >
      <label className="ag-checkbox__control" htmlFor={inputId}>
        <input
          {...props}
          aria-busy={loading || undefined}
          aria-checked={indeterminate ? "mixed" : checked}
          aria-describedby={joinIds(ariaDescribedBy, descriptionId, errorId)}
          aria-invalid={isInvalid || undefined}
          aria-readonly={props.readOnly || undefined}
          checked={checked}
          className="ag-checkbox__input"
          data-indeterminate={indeterminate || undefined}
          disabled={disabled || loading}
          id={inputId}
          onClick={(event: MouseEvent<HTMLInputElement>) => {
            onClick?.(event);
            if (props.readOnly && !event.defaultPrevented) event.preventDefault();
          }}
          ref={(node) => {
            if (node) node.indeterminate = indeterminate;
          }}
          type="checkbox"
        />
        <span aria-hidden="true" className="ag-checkbox__box" />
        <span className="ag-checkbox__copy">
          <span className="ag-checkbox__label">{label}</span>
          {description ? (
            <span className="ag-checkbox__description" id={descriptionId}>
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <span aria-live="polite" className="ag-checkbox__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
