import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { useId } from "react";

import { joinIds, type ControlStateProps } from "./foundation.js";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & Pick<ControlStateProps, "busy" | "invalid" | "loading"> & {
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
};

export function TextField({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  busy = false,
  className,
  disabled,
  error,
  helpText,
  id,
  invalid = false,
  label,
  loading = false,
  ...props
}: TextFieldProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = joinIds(ariaDescribedBy, helpId, errorId);
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const inputClassNames = ["ag-input", className].filter(Boolean).join(" ");

  return (
    <div className="ag-field" data-invalid={isInvalid || undefined} data-loading={loading || undefined}>
      <label className="ag-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        aria-busy={busy || loading || undefined}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}
        className={inputClassNames}
        disabled={disabled || loading}
        id={inputId}
      />
      {helpText ? (
        <p className="ag-field__help" id={helpId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="ag-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
