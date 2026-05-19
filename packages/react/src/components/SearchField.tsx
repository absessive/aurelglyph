import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { useId } from "react";

import { Icon } from "./Icon.js";

export type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  helpText?: ReactNode;
  label: ReactNode;
};

export function SearchField({
  "aria-describedby": ariaDescribedBy,
  className,
  helpText,
  id,
  label,
  placeholder = "Search",
  ...props
}: SearchFieldProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const inputClassNames = ["ag-search__input", className].filter(Boolean).join(" ");

  return (
    <div className="ag-search">
      <label className="ag-search__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="ag-search__control">
        <Icon className="ag-search__icon" decorative name="search" />
        <input
          {...props}
          aria-describedby={[ariaDescribedBy, helpId].filter(Boolean).join(" ") || undefined}
          className={inputClassNames}
          id={inputId}
          placeholder={placeholder}
          type="search"
        />
      </div>
      {helpText ? (
        <p className="ag-field__help" id={helpId}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
