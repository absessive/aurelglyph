import { useId, type ChangeEvent, type InputHTMLAttributes, type ReactElement, type ReactNode } from "react";

import { Icon } from "./Icon.js";
import { joinIds, useControllableState, type ControlStateProps } from "./foundation.js";

export type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange" | "type" | "value"> &
  Pick<ControlStateProps, "invalid" | "loading"> & {
    defaultValue?: number | null;
    decrementLabel?: string;
    error?: ReactNode;
    helpText?: ReactNode;
    incrementLabel?: string;
    label: ReactNode;
    onValueChange?: (value: number | null) => void;
    value?: number | null;
  };

function nextNumberValue(
  value: number | null,
  direction: 1 | -1,
  minimum: number | undefined,
  maximum: number | undefined,
  step: number
): number | null {
  const base = minimum ?? 0;
  let candidate: number;

  if (value === null) {
    if (minimum !== undefined && direction < 0) {
      candidate = minimum;
    } else if (minimum === undefined && maximum !== undefined && maximum < base) {
      candidate = base + Math.floor((maximum - base) / step) * step;
    } else {
      candidate = base + step * direction;
    }
  } else {
    const relativeValue = (value - base) / step;
    const roundedIndex = Math.round(relativeValue);
    const isStepAligned = Math.abs(relativeValue - roundedIndex) < 1e-10;
    const nextIndex =
      direction > 0
        ? isStepAligned
          ? roundedIndex + 1
          : Math.ceil(relativeValue)
        : isStepAligned
          ? roundedIndex - 1
          : Math.floor(relativeValue);
    candidate = base + nextIndex * step;
  }

  if (!Number.isFinite(candidate)) return null;
  const scaledCandidate = candidate * 1e12;
  if (Number.isFinite(scaledCandidate)) candidate = Math.round(scaledCandidate) / 1e12;
  if (minimum !== undefined && candidate < minimum) return null;
  if (maximum !== undefined && candidate > maximum) return null;
  return candidate;
}

export function NumberField({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  defaultValue = null,
  decrementLabel = "Decrease value",
  disabled,
  error,
  helpText,
  id,
  incrementLabel = "Increase value",
  invalid = false,
  label,
  loading = false,
  max,
  min,
  onValueChange,
  readOnly,
  step = 1,
  value,
  ...props
}: NumberFieldProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? `ag-number-${generatedId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const [currentValue, setCurrentValue] = useControllableState<number | null>({ defaultValue, onChange: onValueChange, value });
  const parsedMinimum = min === undefined ? undefined : Number(min);
  const minimum = parsedMinimum !== undefined && Number.isFinite(parsedMinimum) ? parsedMinimum : undefined;
  const parsedMaximum = max === undefined ? undefined : Number(max);
  const finiteMaximum = parsedMaximum !== undefined && Number.isFinite(parsedMaximum) ? parsedMaximum : undefined;
  const maximum = finiteMaximum === undefined ? undefined : Math.max(minimum ?? Number.NEGATIVE_INFINITY, finiteMaximum);
  const parsedStep = step === "any" ? 1 : Math.abs(Number(step));
  const increment = Number.isFinite(parsedStep) && parsedStep > 0 ? parsedStep : 1;
  const normalizedStep = step === "any" ? "any" : increment;
  const interactionDisabled = disabled || loading || readOnly;

  const clamp = (next: number): number => Math.min(maximum ?? Number.POSITIVE_INFINITY, Math.max(minimum ?? Number.NEGATIVE_INFINITY, next));
  const resolvedValue = currentValue !== null && Number.isFinite(currentValue) ? clamp(currentValue) : null;
  const decrementTarget = nextNumberValue(resolvedValue, -1, minimum, maximum, increment);
  const incrementTarget = nextNumberValue(resolvedValue, 1, minimum, maximum, increment);
  const nudge = (direction: 1 | -1): void => {
    if (interactionDisabled) return;
    const nextValue = direction < 0 ? decrementTarget : incrementTarget;
    if (nextValue !== null) setCurrentValue(nextValue);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (readOnly) return;
    const nextValue = event.currentTarget.valueAsNumber;
    setCurrentValue(event.currentTarget.value === "" || !Number.isFinite(nextValue) ? null : clamp(nextValue));
  };

  return (
    <div
      className={["ag-number-field", className].filter(Boolean).join(" ")}
      data-invalid={isInvalid || undefined}
      data-loading={loading || undefined}
    >
      <label className="ag-number-field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="ag-number-field__control">
        <button
          aria-label={decrementLabel}
          className="ag-number-field__step"
          disabled={interactionDisabled || decrementTarget === null}
          onClick={() => nudge(-1)}
          type="button"
        >
          <Icon decorative name="minus" />
        </button>
        <input
          {...props}
          aria-busy={loading || undefined}
          aria-describedby={joinIds(ariaDescribedBy, helpId, errorId)}
          aria-invalid={isInvalid || undefined}
          aria-readonly={readOnly || undefined}
          className="ag-number-field__input"
          disabled={disabled || loading}
          id={inputId}
          max={maximum}
          min={minimum}
          onChange={handleChange}
          readOnly={readOnly}
          step={normalizedStep}
          type="number"
          value={resolvedValue ?? ""}
        />
        <button
          aria-label={incrementLabel}
          className="ag-number-field__step"
          disabled={interactionDisabled || incrementTarget === null}
          onClick={() => nudge(1)}
          type="button"
        >
          <Icon decorative name="plus" />
        </button>
      </div>
      {helpText ? (
        <span className="ag-number-field__help" id={helpId}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="ag-number-field__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
