import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/** Native form resets are silent; controlled values remain application-owned. */
export function useFormControlState<T, Element extends HTMLElement>({ defaultValue, formId, onChange, value }: {
  defaultValue: T;
  formId?: string;
  onChange?: (value: T) => void;
  value?: T;
}): readonly [T, (next: T) => void, RefObject<Element | null>] {
  const [state, setState] = useState({ internalValue: defaultValue, revision: 0 });
  const ref = useRef<Element>(null);
  const latest = useRef({ defaultValue, onChange, value });
  latest.current = { defaultValue, onChange, value };
  const setValue = useCallback((next: T): void => {
    if (latest.current.value === undefined) setState((current) => ({ ...current, internalValue: next }));
    latest.current.onChange?.(next);
  }, []);
  useEffect(() => {
    const element = ref.current;
    const form = element?.tagName === "FIELDSET" ? (element as unknown as HTMLFieldSetElement).form : element?.closest("form");
    if (!form) return;
    let mounted = true;
    const reset = (event: Event): void => {
      queueMicrotask(() => {
        if (!mounted || event.defaultPrevented) return;
        setState((current) => ({ internalValue: latest.current.value === undefined ? latest.current.defaultValue : current.internalValue, revision: current.revision + 1 }));
      });
    };
    form.addEventListener("reset", reset);
    return () => { mounted = false; form.removeEventListener("reset", reset); };
  }, [formId]);
  return [value === undefined ? state.internalValue : value, setValue, ref] as const;
}
