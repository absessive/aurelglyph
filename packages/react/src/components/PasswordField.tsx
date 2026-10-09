import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type Ref } from "react";

import { Icon } from "./Icon.js";
import { InputGroup, type InputGroupProps } from "./InputGroup.js";

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type PasswordFieldProps = Omit<InputGroupProps, "leading" | "trailing" | "type" | "addonDescription"> & {
  hideLabel?: string;
  showLabel?: string;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void | (() => void) {
  if (typeof ref === "function") return ref(value);
  else if (ref) ref.current = value;
}

export function PasswordField({ autoComplete = "current-password", containerClassName, disabled, hideLabel = "Hide password", loading, ref, showLabel = "Show password", ...props }: PasswordFieldProps): ReactElement {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number | null; end: number | null; direction: "forward" | "backward" | "none" | null; focused: boolean; value: string } | null>(null);
  const attachInput = useCallback((input: HTMLInputElement | null): void | (() => void) => {
    inputRef.current = input;
    const cleanup = assignRef(ref, input);
    if (!input) return;
    return () => { inputRef.current = null; if (cleanup) cleanup(); else assignRef(ref, null); };
  }, [ref]);
  useCommitEffect(() => {
    const input = inputRef.current;
    const range = selection.current;
    if (!input || !range) return;
    selection.current = null;
    let cancelled = false;
    const view = input.ownerDocument.defaultView;
    const pending = { frame: undefined as number | undefined };
    const cancel = (): void => {
      cancelled = true;
      if (pending.frame !== undefined) view?.cancelAnimationFrame(pending.frame);
      for (const event of ["beforeinput", "keydown", "pointerdown"]) input.removeEventListener(event, cancel);
    };
    const restore = (deferred = false): void => {
      if (cancelled || !input.isConnected || inputRef.current !== input || input.disabled || input.value !== range.value) return;
      // A browser may normalize a type-change caret, but a new non-collapsed
      // selection belongs to the next edit (including select-all before fill).
      if (deferred && input.selectionStart !== input.selectionEnd
        && (input.selectionStart !== range.start || input.selectionEnd !== range.end)) return;
      if (deferred && range.focused && input.ownerDocument.activeElement !== input) return;
      if (range.focused) input.focus({ preventScroll: true });
      if (range.start !== null && range.end !== null) input.setSelectionRange(range.start, range.end, range.direction ?? undefined);
    };
    for (const event of ["beforeinput", "keydown", "pointerdown"]) input.addEventListener(event, cancel);
    restore();
    queueMicrotask(() => restore(true));
    pending.frame = view?.requestAnimationFrame(() => { restore(true); cancel(); });
    return cancel;
  }, [visible]);
  const toggle = (): void => {
    if (disabled || loading) return;
    const input = inputRef.current;
    selection.current = input ? { start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection, focused: input.ownerDocument.activeElement === input, value: input.value } : null;
    setVisible((current) => !current);
  };
  return <InputGroup {...props} autoComplete={autoComplete} autoCapitalize="none" containerClassName={["ag-password-field", containerClassName].filter(Boolean).join(" ")} disabled={disabled} loading={loading} ref={attachInput} spellCheck={false} trailing={<button aria-label={visible ? hideLabel : showLabel} aria-pressed={visible} className="ag-password-field__toggle ag-input-group__action" disabled={disabled || loading} onClick={toggle} onPointerDown={(event) => { if (event.button === 0) event.preventDefault(); }} type="button"><Icon decorative name={visible ? "eye-off" : "eye"} /></button>} type={visible ? "text" : "password"} />;
}
