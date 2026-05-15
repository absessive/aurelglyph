import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { useId } from "react";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
};

export function TextField({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  error,
  helpText,
  id,
  label,
  ...props
}: TextFieldProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ");
  const inputClassNames = ["ag-input", className].filter(Boolean).join(" ");

  return (
    <div className="ag-field" data-invalid={error ? true : undefined}>
      <label className="ag-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={inputClassNames}
        id={inputId}
      />
      {helpText ? (
        <p className="ag-field__help" id={helpId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p className="ag-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
