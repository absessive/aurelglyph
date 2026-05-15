import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { useId } from "react";

import { Icon } from "./Icon.js";

export type FileUploadProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
};

export function FileUpload({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  error,
  helpText = "Choose a file or drop one here.",
  id,
  label,
  ...props
}: FileUploadProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpId, errorId].filter(Boolean).join(" ");
  const inputClassNames = ["ag-upload__input", className].filter(Boolean).join(" ");

  return (
    <div className="ag-field ag-upload" data-invalid={error ? true : undefined}>
      <label className="ag-upload__target" htmlFor={inputId}>
        <Icon className="ag-upload__icon" decorative name="upload" />
        <span className="ag-field__label">{label}</span>
      </label>
      <input
        {...props}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={inputClassNames}
        id={inputId}
        type="file"
      />
      <p className="ag-field__help" id={helpId}>
        {helpText}
      </p>
      {error ? (
        <p className="ag-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
