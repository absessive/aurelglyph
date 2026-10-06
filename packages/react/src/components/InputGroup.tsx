import { useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from "react";

import { joinIds, type ControlStateProps } from "./foundation.js";

export type InputGroupProps = Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & Pick<ControlStateProps, "busy" | "loading" | "invalid"> & {
  addonDescription?: string;
  containerClassName?: string;
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
  leading?: ReactNode;
  ref?: Ref<HTMLInputElement>;
  trailing?: ReactNode;
};

export function InputGroup({ "aria-describedby": describedBy, "aria-invalid": ariaInvalid, addonDescription, busy = false, className, containerClassName, disabled, error, helpText, id, invalid = false, label, leading, loading = false, ref, trailing, ...props }: InputGroupProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? `ag-group-${generatedId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const addonId = addonDescription ? `${inputId}-addons` : undefined;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const addon = (content: ReactNode, side: "leading" | "trailing"): ReactElement | null => content == null ? null : <span aria-hidden={typeof content === "string" || typeof content === "number" ? true : undefined} className={`ag-input-group__addon ag-input-group__addon--${side}`}>{content}</span>;
  return (
    <div className={["ag-field", "ag-input-group", containerClassName].filter(Boolean).join(" ")} data-invalid={isInvalid || undefined} data-loading={loading || undefined}>
      <label className="ag-field__label ag-input-group__label" htmlFor={inputId}>{label}</label>
      <div className="ag-input-group__control">
        {addon(leading, "leading")}
        <input {...props} aria-busy={busy || loading || undefined} aria-describedby={joinIds(describedBy, helpId, errorId, addonId)} aria-invalid={isInvalid || undefined} className={["ag-input", "ag-input-group__input", className].filter(Boolean).join(" ")} disabled={disabled || loading} id={inputId} ref={ref} />
        {addon(trailing, "trailing")}
      </div>
      {addonDescription ? <span className="ag-sr-only" id={addonId}>{addonDescription}</span> : null}
      {helpText ? <p className="ag-field__help ag-input-group__help" id={helpId}>{helpText}</p> : null}
      {error ? <p aria-live="polite" className="ag-field__error ag-input-group__error" id={errorId}>{error}</p> : null}
    </div>
  );
}
