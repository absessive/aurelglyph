import { useId, type FieldsetHTMLAttributes, type ReactElement, type ReactNode } from "react";

import { Icon } from "./Icon.js";
import { horizontalArrowStep, joinIds, type ControlStateProps } from "./foundation.js";
import { useFormControlState } from "./form-control-state.js";

export type RatingProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "defaultValue" | "onChange"> & Pick<ControlStateProps, "invalid" | "loading" | "readOnly" | "required"> & {
  clearable?: boolean;
  clearLabel?: string;
  defaultValue?: number;
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
  max?: number;
  name?: string;
  onValueChange?: (value: number) => void;
  value?: number;
  valueLabel?: (value: number, max: number) => string;
};

export function normalizeRating(value: number, max: number): number { return Math.max(0, Math.min(max, Number.isFinite(value) ? Math.round(value) : 0)); }
export function Rating({ "aria-describedby": describedBy, "aria-invalid": ariaInvalid, className, clearable = true, clearLabel = "Clear rating", defaultValue = 0, disabled = false, error, helpText, id, invalid = false, label, loading = false, max = 5, name, onValueChange, readOnly = false, required = false, value, valueLabel = (count, maximum) => `${count} of ${maximum}`, ...props }: RatingProps): ReactElement {
  const generatedId = useId();
  const groupId = id ?? `ag-rating-${generatedId}`;
  const maximum = Math.max(1, Math.min(20, Number.isFinite(max) ? Math.floor(max) : 5));
  const [rawValue, setValue, ref] = useFormControlState<number, HTMLFieldSetElement>({ defaultValue, formId: props.form, onChange: onValueChange, value });
  const selected = normalizeRating(rawValue, maximum);
  const blocked = disabled || loading;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const helpId = helpText ? `${groupId}-help` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;
  return <fieldset {...props} aria-busy={loading || undefined} aria-describedby={joinIds(describedBy, helpId, errorId)} aria-invalid={isInvalid || undefined} aria-readonly={readOnly || undefined} aria-required={required || undefined} className={["ag-rating", className].filter(Boolean).join(" ")} data-invalid={isInvalid || undefined} data-readonly={readOnly || undefined} disabled={blocked} id={groupId} ref={ref} role="radiogroup">
    <legend className="ag-field__label">{label}{isInvalid ? <Icon className="ag-rating__invalid-marker" decorative name="warning" /> : null}</legend>
    <div className="ag-rating__options">{Array.from({ length: maximum }, (_, index) => index + 1).map((choice) => <label className="ag-rating__option" data-filled={choice <= selected || undefined} key={choice}>
      <input aria-describedby={joinIds(helpId, errorId)} aria-disabled={readOnly || undefined} aria-label={valueLabel(choice, maximum)} checked={choice === selected} className="ag-rating__input" name={name ?? groupId} onChange={() => { if (!blocked && !readOnly && selected !== choice) setValue(choice); }} onClick={(event) => { if (readOnly) event.preventDefault(); }} onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", " "].includes(event.key)) return;
        if (readOnly || blocked) { event.preventDefault(); return; }
        if (event.key === " ") return;
        event.preventDefault();
        const step = event.key === "ArrowLeft" || event.key === "ArrowRight" ? horizontalArrowStep(event.currentTarget, event.key) : event.key === "ArrowDown" ? 1 : -1;
        const next = event.key === "Home" ? 1 : event.key === "End" ? maximum : Math.max(1, Math.min(maximum, choice + step));
        if (next !== selected) setValue(next);
        event.currentTarget.closest(".ag-rating__options")?.querySelector<HTMLInputElement>(`input[value='${next}']`)?.focus();
      }} required={required && !readOnly} tabIndex={choice === (selected || 1) ? 0 : -1} type="radio" value={choice} />
      <Icon className="ag-rating__star" decorative name="star" />
    </label>)}{clearable && !required && !readOnly ? <button className="ag-rating__clear" disabled={blocked || selected === 0} onClick={() => { if (!blocked && selected !== 0) setValue(0); }} type="button">{clearLabel}</button> : null}</div>
    <span className="ag-rating__value">{valueLabel(selected, maximum)}</span>
    {name && selected === 0 && !blocked ? <input name={name} type="hidden" value="0" /> : null}
    {helpText ? <p className="ag-field__help" id={helpId}>{helpText}</p> : null}
    {error ? <p aria-live="polite" className="ag-field__error" id={errorId}>{error}</p> : null}
  </fieldset>;
}
