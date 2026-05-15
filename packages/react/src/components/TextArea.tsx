import type { ReactElement, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
};

export function TextArea({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  error,
  helpText,
  id,
  label,
  ...props
}: TextAreaProps): ReactElement {
  const generatedId = useId();
  const textAreaId = id ?? generatedId;
  const helpId = helpText ? `${textAreaId}-help` : undefined;
  const errorId = error ? `${textAreaId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ");
  const textAreaClassNames = ["ag-textarea", className].filter(Boolean).join(" ");

  return (
    <div className="ag-field" data-invalid={error ? true : undefined}>
      <label className="ag-field__label" htmlFor={textAreaId}>
        {label}
      </label>
      <textarea
        {...props}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={textAreaClassNames}
        id={textAreaId}
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
