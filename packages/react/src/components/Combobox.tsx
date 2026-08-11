import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode
} from "react";

import { Icon } from "./Icon.js";
import {
  edgeEnabledIndex,
  joinIds,
  nextEnabledIndex,
  useControllableState,
  useDismissLayer,
  useViewportShift,
  type ControlStateProps
} from "./foundation.js";

export type ComboboxOption = {
  disabled?: boolean;
  keywords?: readonly string[];
  label: string;
  value: string;
};

export type ComboboxProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> &
  Pick<ControlStateProps, "busy" | "disabled" | "invalid" | "loading" | "readOnly" | "required"> & {
    defaultInputValue?: string;
    defaultValue?: string | null;
    error?: ReactNode;
    helpText?: ReactNode;
    inputValue?: string;
    inputProps?: Omit<
      InputHTMLAttributes<HTMLInputElement>,
      | "aria-activedescendant"
      | "aria-autocomplete"
      | "aria-controls"
      | "aria-expanded"
      | "defaultValue"
      | "disabled"
      | "id"
      | "name"
      | "readOnly"
      | "required"
      | "role"
      | "type"
      | "value"
    >;
    label: ReactNode;
    name?: string;
    noResultsText?: ReactNode;
    onInputValueChange?: (value: string) => void;
    onValueChange?: (value: string | null) => void;
    options: readonly ComboboxOption[];
    placeholder?: string;
    value?: string | null;
  };

export function Combobox({
  "aria-describedby": ariaDescribedBy,
  busy = false,
  className,
  defaultInputValue,
  defaultValue,
  disabled = false,
  error,
  helpText,
  id,
  inputValue,
  inputProps,
  invalid = false,
  label,
  loading = false,
  name,
  noResultsText = "No results found.",
  onBlur,
  onInputValueChange,
  onValueChange,
  options,
  placeholder,
  readOnly = false,
  required = false,
  value,
  ...props
}: ComboboxProps): ReactElement {
  const generatedId = useId();
  const comboboxId = id ?? `ag-combobox-${generatedId}`;
  const inputId = `${comboboxId}-input`;
  const listId = `${comboboxId}-list`;
  const helpId = helpText ? `${comboboxId}-help` : undefined;
  const errorId = error ? `${comboboxId}-error` : undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const suppressFocusOpenRef = useRef(false);
  const initialLabel = options.find((option) => option.value === defaultValue)?.label ?? "";
  const [selectedValue, setSelectedValue] = useControllableState<string | null>({
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
    value
  });
  const [query, setQuery] = useControllableState({
    defaultValue: defaultInputValue ?? initialLabel,
    onChange: onInputValueChange,
    value: inputValue
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isInvalid = invalid || Boolean(error);
  const isBusy = busy || loading;
  const unavailable = disabled || loading || readOnly;
  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      [option.label, ...(option.keywords ?? [])].join(" ").toLocaleLowerCase().includes(needle)
    );
  }, [options, query]);
  const controlledLabel =
    value === undefined ? undefined : value === null ? "" : options.find((option) => option.value === value)?.label;

  useDismissLayer({ enabled: open && !unavailable, onDismiss: () => setOpen(false), refs: [rootRef] });
  useViewportShift({
    anchorRef: inputRef,
    enabled: open && !unavailable,
    onAnchorHidden: () => setOpen(false),
    ref: listRef
  });

  useEffect(() => {
    if (!unavailable) return;
    setOpen(false);
    setActiveIndex(-1);
  }, [unavailable]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (current >= 0 && current < filteredOptions.length && !filteredOptions[current]?.disabled) return current;
      return edgeEnabledIndex(filteredOptions.length, (index) => Boolean(filteredOptions[index]?.disabled), "first");
    });
  }, [filteredOptions]);

  useEffect(() => {
    if (value === undefined || inputValue !== undefined) return;
    if (controlledLabel !== undefined) setQuery(controlledLabel);
  }, [controlledLabel, inputValue, setQuery, value]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(required && selectedValue === null ? "Select an option." : "");
  }, [required, selectedValue]);

  const optionId = (index: number): string => `${comboboxId}-option-${index}`;
  const selectOption = (index: number): void => {
    if (unavailable) return;
    const option = filteredOptions[index];
    if (!option || option.disabled) return;
    setSelectedValue(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>): void => {
    inputProps?.onChange?.(event);
    if (event.defaultPrevented || unavailable) return;
    setQuery(event.currentTarget.value);
    if (selectedValue !== null) setSelectedValue(null);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    inputProps?.onKeyDown?.(event);
    if (event.defaultPrevented || unavailable) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        const edge = event.key === "ArrowDown" ? "first" : "last";
        setActiveIndex(edgeEnabledIndex(filteredOptions.length, (index) => Boolean(filteredOptions[index]?.disabled), edge));
        return;
      }
      setActiveIndex((current) =>
        nextEnabledIndex(
          current < 0 ? (event.key === "ArrowDown" ? -1 : 0) : current,
          filteredOptions.length,
          (index) => Boolean(filteredOptions[index]?.disabled),
          event.key === "ArrowDown" ? 1 : -1
        )
      );
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(edgeEnabledIndex(filteredOptions.length, (index) => Boolean(filteredOptions[index]?.disabled), "first"));
    } else if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(edgeEnabledIndex(filteredOptions.length, (index) => Boolean(filteredOptions[index]?.disabled), "last"));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      selectOption(activeIndex);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>): void => {
    onBlur?.(event);
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div
      className={["ag-combobox", className].filter(Boolean).join(" ")}
      data-invalid={isInvalid || undefined}
      data-busy={busy || undefined}
      data-loading={loading || undefined}
      data-open={open || undefined}
      id={comboboxId}
      onBlur={handleBlur}
      ref={rootRef}
      {...props}
    >
      <label className="ag-combobox__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="ag-combobox__control">
        <input
          {...inputProps}
          aria-activedescendant={open && !unavailable && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-autocomplete="list"
          aria-busy={isBusy || undefined}
          aria-controls={listId}
          aria-describedby={joinIds(inputProps?.["aria-describedby"], ariaDescribedBy, helpId, errorId)}
          aria-expanded={open && !unavailable}
          aria-invalid={isInvalid || undefined}
          aria-readonly={readOnly || undefined}
          aria-required={required || undefined}
          autoComplete={inputProps?.autoComplete ?? "off"}
          className={["ag-combobox__input", inputProps?.className].filter(Boolean).join(" ")}
          disabled={disabled || loading}
          id={inputId}
          onChange={handleInput}
          onFocus={(event) => {
            inputProps?.onFocus?.(event);
            if (suppressFocusOpenRef.current) {
              suppressFocusOpenRef.current = false;
            } else if (!unavailable) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? inputProps?.placeholder}
          readOnly={readOnly}
          ref={inputRef}
          required={required}
          role="combobox"
          value={query}
        />
        <button
          aria-label={open ? "Close options" : "Open options"}
          className="ag-combobox__toggle"
          disabled={disabled || loading || readOnly}
          onClick={() => {
            if (unavailable) return;
            const nextOpen = !open;
            setOpen(nextOpen);
            suppressFocusOpenRef.current = !nextOpen;
            queueMicrotask(() => inputRef.current?.focus());
          }}
          tabIndex={-1}
          type="button"
        >
          <Icon decorative name="chevron-down" />
        </button>
      </div>
      <div className="ag-combobox__list" hidden={!open || unavailable} id={listId} ref={listRef} role="listbox">
        {isBusy ? (
          <div aria-disabled="true" aria-selected="false" className="ag-combobox__empty" role="option">
            Loading…
          </div>
        ) : null}
        {!isBusy && filteredOptions.length === 0 ? (
          <div aria-disabled="true" aria-selected="false" className="ag-combobox__empty" role="option">
            {noResultsText}
          </div>
        ) : null}
        {!isBusy
          ? filteredOptions.map((option, index) => (
              <div
                aria-disabled={option.disabled || undefined}
                aria-selected={option.value === selectedValue}
                className={["ag-combobox__option", index === activeIndex ? "is-active" : undefined].filter(Boolean).join(" ")}
                id={optionId(index)}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => !unavailable && !option.disabled && setActiveIndex(index)}
                onClick={() => selectOption(index)}
                role="option"
              >
                {option.label}
                {option.value === selectedValue ? <Icon className="ag-combobox__check" decorative name="check" /> : null}
              </div>
            ))
          : null}
      </div>
      {name ? <input disabled={disabled || loading} name={name} type="hidden" value={selectedValue ?? ""} /> : null}
      {helpText ? (
        <span className="ag-combobox__help" id={helpId}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="ag-combobox__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export type AutocompleteProps = ComboboxProps;

export function Autocomplete(props: AutocompleteProps): ReactElement {
  return <Combobox {...props} />;
}
