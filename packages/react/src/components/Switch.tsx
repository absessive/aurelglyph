import type { InputHTMLAttributes, MouseEvent, ReactElement, ReactNode } from "react";
import { useId } from "react";

import { joinIds, type ControlStateProps } from "./foundation.js";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & Pick<ControlStateProps, "loading" | "invalid"> & {
  description?: ReactNode;
  label: ReactNode;
};

export function Switch({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  description,
  disabled,
  id,
  invalid = false,
  label,
  loading = false,
  onClick,
  readOnly,
  ...props
}: SwitchProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const classNames = ["ag-switch", className].filter(Boolean).join(" ");
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  return (
    <label
      className={classNames}
      data-invalid={isInvalid || undefined}
      data-loading={loading || undefined}
      htmlFor={inputId}
    >
      <span className="ag-switch__copy">
        <span className="ag-switch__label">{label}</span>
        {description ? (
          <span className="ag-switch__description" id={descriptionId}>
            {description}
          </span>
        ) : null}
      </span>
      <input
        {...props}
        aria-busy={loading || undefined}
        aria-describedby={joinIds(ariaDescribedBy, descriptionId)}
        aria-invalid={isInvalid || undefined}
        aria-readonly={readOnly || undefined}
        className="ag-switch__input"
        disabled={disabled || loading}
        id={inputId}
        onClick={(event: MouseEvent<HTMLInputElement>) => {
          onClick?.(event);
          if (readOnly && !event.defaultPrevented) event.preventDefault();
        }}
        readOnly={readOnly}
        role="switch"
        type="checkbox"
      />
      <span className="ag-switch__track" aria-hidden="true">
        <span className="ag-switch__thumb" />
      </span>
    </label>
  );
}
