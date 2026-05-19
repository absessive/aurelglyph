import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { useId } from "react";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  description?: ReactNode;
  label: ReactNode;
};

export function Switch({
  className,
  description,
  id,
  label,
  ...props
}: SwitchProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const classNames = ["ag-switch", className].filter(Boolean).join(" ");

  return (
    <label className={classNames} htmlFor={inputId}>
      <span className="ag-switch__copy">
        <span className="ag-switch__label">{label}</span>
        {description ? <span className="ag-switch__description">{description}</span> : null}
      </span>
      <input className="ag-switch__input" id={inputId} role="switch" type="checkbox" {...props} />
      <span className="ag-switch__track" aria-hidden="true">
        <span className="ag-switch__thumb" />
      </span>
    </label>
  );
}
