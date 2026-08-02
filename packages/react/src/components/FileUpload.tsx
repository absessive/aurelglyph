import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode
} from "react";

import { Icon } from "./Icon.js";
import { joinIds, type ControlStateProps } from "./foundation.js";

export type FileUploadProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & Pick<ControlStateProps, "invalid"> & {
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
  onFilesChange?: (files: FileList) => void;
};

export function FileUpload({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  disabled,
  error,
  helpText = "Choose a file or drop one here.",
  id,
  invalid = false,
  label,
  onChange,
  onFilesChange,
  ...props
}: FileUploadProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const [dragging, setDragging] = useState(false);
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const inputRef = useRef<HTMLInputElement>(null);
  const inputClassNames = ["ag-upload__input", className].filter(Boolean).join(" ");

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange?.(event);
    if (!event.defaultPrevented && event.currentTarget.files) onFilesChange?.(event.currentTarget.files);
  };

  const handleDrag = (event: DragEvent<HTMLDivElement>, over: boolean): void => {
    if (disabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(over);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    if (disabled || !event.dataTransfer.files.length) return;
    event.preventDefault();
    setDragging(false);

    const input = inputRef.current;
    if (input) {
      try {
        input.files = event.dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      } catch {
        // Some browsers protect the native FileList setter; the explicit callback remains reliable.
      }
    }
    onFilesChange?.(event.dataTransfer.files);
  };

  return (
    <div
      className="ag-field ag-upload"
      data-dragging={dragging || undefined}
      data-invalid={isInvalid || undefined}
      onDragEnter={(event) => handleDrag(event, true)}
      onDragLeave={(event) => {
        const relatedTarget = event.relatedTarget;
        if (!(relatedTarget instanceof Node) || !event.currentTarget.contains(relatedTarget)) handleDrag(event, false);
      }}
      onDragOver={(event) => handleDrag(event, true)}
      onDrop={handleDrop}
    >
      <label className="ag-upload__target" htmlFor={inputId}>
        <Icon className="ag-upload__icon" decorative name="upload" />
        <span className="ag-field__label">{label}</span>
      </label>
      <input
        {...props}
        aria-describedby={joinIds(ariaDescribedBy, helpId, errorId)}
        aria-invalid={isInvalid || undefined}
        className={inputClassNames}
        disabled={disabled}
        id={inputId}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      {helpText ? (
        <p className="ag-field__help" id={helpId}>
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="ag-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
