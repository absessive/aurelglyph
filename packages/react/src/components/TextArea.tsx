import type { ReactElement, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";

import { joinIds, type ControlStateProps } from "./foundation.js";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & Pick<ControlStateProps, "busy" | "invalid" | "loading"> & {
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
};

export function TextArea({
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
}: TextAreaProps): ReactElement {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;
  const helpId = helpText ? `${textAreaId}-help` : undefined;
  const errorId = error ? `${textAreaId}-error` : undefined;
  const describedBy = joinIds(ariaDescribedBy, helpId, errorId);
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const textAreaClassNames = ["ag-textarea", className].filter(Boolean).join(" ");

  return (
    <div className="ag-field" data-invalid={isInvalid || undefined} data-loading={loading || undefined}>
      <label className="ag-field__label" htmlFor={textAreaId}>
        {label}
      </label>
      <textarea
        {...props}
        aria-busy={busy || loading || undefined}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}
        className={textAreaClassNames}
        disabled={disabled || loading}
        id={textAreaId}
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
