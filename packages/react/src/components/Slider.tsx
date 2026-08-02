import { useId, type ChangeEvent, type CSSProperties, type InputHTMLAttributes, type ReactElement, type ReactNode } from "react";

import { joinIds, useControllableState, type ControlStateProps } from "./foundation.js";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange" | "type" | "value"> &
  Pick<ControlStateProps, "invalid" | "loading"> & {
    defaultValue?: number;
    error?: ReactNode;
    formatValue?: (value: number) => string;
    helpText?: ReactNode;
    label: ReactNode;
    onValueChange?: (value: number) => void;
    value?: number;
  };

export function Slider({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  defaultValue,
  disabled,
  error,
  formatValue = String,
  helpText,
  id,
  invalid = false,
  label,
  loading = false,
  max = 100,
  min = 0,
  onValueChange,
  readOnly,
  style,
  value,
  ...props
}: SliderProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? `ag-slider-${generatedId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const parsedMin = Number(min);
  const numericMin = Number.isFinite(parsedMin) ? parsedMin : 0;
  const parsedMax = Number(max);
  const numericMax = Number.isFinite(parsedMax) && parsedMax > numericMin ? parsedMax : numericMin + 100;
  const [currentValue, setCurrentValue] = useControllableState({
    defaultValue: defaultValue ?? numericMin,
    onChange: onValueChange,
    value
  });
  const resolvedValue = Number.isFinite(currentValue)
    ? Math.max(numericMin, Math.min(numericMax, currentValue))
    : numericMin;
  const denominator = numericMax - numericMin;
  const progress = denominator > 0 ? ((resolvedValue - numericMin) / denominator) * 100 : 0;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const sliderStyle = {
    ...style,
    "--ag-slider-progress": `${Math.max(0, Math.min(100, progress))}%`
  } as CSSProperties;

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (!readOnly && Number.isFinite(event.currentTarget.valueAsNumber)) setCurrentValue(event.currentTarget.valueAsNumber);
  };

  return (
    <div
      className={["ag-slider", className].filter(Boolean).join(" ")}
      data-invalid={isInvalid || undefined}
      data-loading={loading || undefined}
    >
      <div className="ag-slider__header">
        <label className="ag-slider__label" htmlFor={inputId}>
          {label}
        </label>
        <output className="ag-slider__value" htmlFor={inputId}>
          {formatValue(resolvedValue)}
        </output>
      </div>
      <input
        {...props}
        aria-busy={loading || undefined}
        aria-describedby={joinIds(ariaDescribedBy, helpId, errorId)}
        aria-invalid={isInvalid || undefined}
        aria-readonly={readOnly || undefined}
        aria-valuetext={formatValue(resolvedValue)}
        className="ag-slider__input"
        disabled={disabled || loading}
        id={inputId}
        max={numericMax}
        min={numericMin}
        onChange={handleChange}
        readOnly={readOnly}
        style={sliderStyle}
        type="range"
        value={resolvedValue}
      />
      {helpText ? (
        <span className="ag-slider__help" id={helpId}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="ag-slider__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
