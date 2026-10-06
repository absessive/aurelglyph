# Shared primitives

React 19 custom components; semantic HTML plus tokenized `ag-*` classes. No third-party component library, Tailwind, or CSS-in-JS. Styles live in `packages/react/src/styles.css` and are appended to the CSS package build. Token source is `packages/tokens/src/tokens.json`; see `theme.md` for values.

This bounded selection supports new Link, Chip, PasswordField, InputGroup, ValidationSummary, Accordion, Stepper, and Rating patterns. Preserve native attributes, controlled/uncontrolled contracts, linked validation, visible focus, and quiet/atelier × light/dark appearances. The existing ExpandableSection is a single disclosure, not a coordinated accordion.

## Icon dependency

`packages/react/src/components/Icon.tsx` is the curated React icon source: stable typed names, a 24 × 24 geometric SVG path map, default accessible labels, decorative hiding, and `ag-icon` classes. Relevant existing names include `eye`, `eye-off`, `close`, `check`, `chevron-down`, `star`, `external-link`, `warning`, and `info`. It is a referenced dependency rather than an extra selected primitive dump.

## Button

Semantic native button with shared variants, optional curated icon, busy/loading states.

Key props: variant, icon, iconLabel, disabled, busy, loading; native button attributes.

Source: `packages/react/src/components/Button.tsx`

```tsx
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";
import type { ControlStateProps } from "./foundation.js";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Pick<ControlStateProps, "busy" | "loading"> & {
  variant?: ButtonVariant;
  icon?: AurelglyphIconName;
  iconLabel?: string;
  children?: ReactNode;
};

export function Button({
  children,
  busy = false,
  className,
  disabled,
  icon,
  iconLabel,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps): ReactElement {
  const classNames = ["ag-button", `ag-button--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      aria-busy={busy || loading || undefined}
      className={classNames}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {icon ? (
        <Icon
          className="ag-button__icon"
          decorative={!iconLabel && (Boolean(children) || Boolean(props["aria-label"]))}
          name={icon}
          title={iconLabel}
        />
      ) : null}
      {children ? <span className="ag-button__content">{children}</span> : null}
      {loading ? <span aria-hidden="true" className="ag-button__spinner" /> : null}
    </button>
  );
}
```

## IconButton

Accessible icon-only Button adapter; label is required.

Key props: icon, label; inherited Button states/attributes.

Source: `packages/react/src/components/IconButton.tsx`

```tsx
import type { ReactElement } from "react";

import { Button, type ButtonProps } from "./Button.js";
import type { AurelglyphIconName } from "./Icon.js";

export type IconButtonProps = Omit<ButtonProps, "aria-label" | "children" | "icon" | "iconLabel"> & {
  icon: AurelglyphIconName;
  label: string;
};

export function IconButton({ className, icon, label, ...props }: IconButtonProps): ReactElement {
  return (
    <Button
      aria-label={label}
      className={["ag-icon-button", className].filter(Boolean).join(" ")}
      icon={icon}
      {...props}
    />
  );
}
```

## Badge

Noninteractive inline semantic status label.

Key props: tone, children; span attributes.

Source: `packages/react/src/components/Badge.tsx`

```tsx
import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, className, tone = "neutral", ...props }: BadgeProps): ReactElement {
  const classNames = ["ag-badge", `ag-badge--${tone}`, className].filter(Boolean).join(" ");

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  );
}
```

## TextField

Labeled native input with generated IDs and linked help/error text.

Key props: label, helpText, error, invalid, busy, loading; native input attributes.

Source: `packages/react/src/components/TextField.tsx`

```tsx
import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { useId } from "react";

import { joinIds, type ControlStateProps } from "./foundation.js";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & Pick<ControlStateProps, "busy" | "invalid" | "loading"> & {
  error?: ReactNode;
  helpText?: ReactNode;
  label: ReactNode;
};

export function TextField({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  busy = false,
  className,
  disabled,
  error,
  helpText,
  id,
  invalid = false,
  label,
  loading = false,
  ...props
}: TextFieldProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = joinIds(ariaDescribedBy, helpId, errorId);
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const inputClassNames = ["ag-input", className].filter(Boolean).join(" ");

  return (
    <div className="ag-field" data-invalid={isInvalid || undefined} data-loading={loading || undefined}>
      <label className="ag-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        aria-busy={busy || loading || undefined}
        aria-describedby={describedBy}
        aria-invalid={isInvalid || undefined}
        className={inputClassNames}
        disabled={disabled || loading}
        id={inputId}
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
```

## RadioGroup

Fieldset/legend and native radio inputs with controlled or uncontrolled selection.

Key props: label, options, value, defaultValue, onValueChange, orientation, readOnly, required, invalid, loading.

Source: `packages/react/src/components/RadioGroup.tsx`

```tsx
import { useId, type FieldsetHTMLAttributes, type ReactElement, type ReactNode } from "react";

import { joinIds, useControllableState, type ControlStateProps } from "./foundation.js";

export type RadioOption = {
  description?: ReactNode;
  disabled?: boolean;
  label: ReactNode;
  value: string;
};

export type RadioGroupProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> &
  Pick<ControlStateProps, "invalid" | "loading" | "readOnly" | "required"> & {
    defaultValue?: string | null;
    error?: ReactNode;
    helpText?: ReactNode;
    label: ReactNode;
    name?: string;
    onValueChange?: (value: string) => void;
    options: readonly RadioOption[];
    orientation?: "horizontal" | "vertical";
    value?: string | null;
  };

export function RadioGroup({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  defaultValue,
  disabled,
  error,
  helpText,
  id,
  invalid = false,
  label,
  loading = false,
  name,
  onValueChange,
  options,
  orientation = "vertical",
  readOnly = false,
  required,
  value,
  ...props
}: RadioGroupProps): ReactElement {
  const generatedId = useId();
  const groupId = id ?? `ag-radio-${generatedId}`;
  const groupName = name ?? groupId;
  const helpId = helpText ? `${groupId}-help` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;
  const isInvalid = invalid || Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const [selected, setSelected] = useControllableState<string | null>({
    defaultValue: defaultValue ?? null,
    onChange: (next) => {
      if (next !== null) onValueChange?.(next);
    },
    value
  });

  return (
    <fieldset
      {...props}
      aria-busy={loading || undefined}
      aria-describedby={joinIds(ariaDescribedBy, helpId, errorId)}
      aria-invalid={isInvalid || undefined}
      aria-required={required || undefined}
      className={["ag-radio-group", className].filter(Boolean).join(" ")}
      data-invalid={isInvalid || undefined}
      data-loading={loading || undefined}
      data-orientation={orientation}
      data-readonly={readOnly || undefined}
      disabled={disabled || loading}
      id={groupId}
    >
      <legend className="ag-radio-group__legend">{label}</legend>
      <div className="ag-radio-group__options">
        {options.map((option, index) => {
          const optionId = `${groupId}-option-${index}`;
          const descriptionId = option.description ? `${optionId}-description` : undefined;
          return (
            <label className="ag-radio" htmlFor={optionId} key={option.value}>
              <input
                aria-describedby={descriptionId}
                checked={selected === option.value}
                className="ag-radio__input"
                disabled={option.disabled}
                id={optionId}
                name={groupName}
                onChange={() => {
                  if (!readOnly) setSelected(option.value);
                }}
                required={required}
                type="radio"
                value={option.value}
              />
              <span aria-hidden="true" className="ag-radio__circle" />
              <span className="ag-radio__copy">
                <span className="ag-radio__label">{option.label}</span>
                {option.description ? (
                  <span className="ag-radio__description" id={descriptionId}>
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {helpText ? (
        <span className="ag-radio-group__help" id={helpId}>
          {helpText}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="ag-radio-group__error" id={errorId}>
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
```

## ExpandableSection

Single disclosure with a semantic trigger and hidden/inert collapsed panel.

Key props: title, eyebrow, open, defaultOpen, onOpenChange, children.

Source: `packages/react/src/components/ExpandableSection.tsx`

```tsx
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { useId, useState } from "react";

import { Icon } from "./Icon.js";

export type ExpandableSectionProps = Omit<HTMLAttributes<HTMLElement>, "children" | "title"> & {
  children: ReactNode;
  defaultOpen?: boolean;
  eyebrow?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: ReactNode;
};

export function ExpandableSection({
  children,
  className,
  defaultOpen = false,
  eyebrow,
  id,
  onOpenChange,
  open,
  title,
  ...props
}: ExpandableSectionProps): ReactElement {
  const generatedId = useId();
  const sectionId = id ?? generatedId;
  const panelId = `${sectionId}-panel`;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const classNames = ["ag-disclosure", className].filter(Boolean).join(" ");

  const toggleOpen = (): void => {
    const nextOpen = !isOpen;

    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  return (
    <section {...props} className={classNames} data-open={isOpen ? true : undefined} id={sectionId}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="ag-disclosure__trigger"
        onClick={toggleOpen}
        type="button"
      >
        <span className="ag-disclosure__heading">
          {eyebrow ? <span className="ag-disclosure__eyebrow">{eyebrow}</span> : null}
          <span className="ag-disclosure__title">{title}</span>
        </span>
        <Icon className="ag-disclosure__icon" decorative name={isOpen ? "contract" : "expand"} />
      </button>
      <div
        aria-hidden={!isOpen}
        className="ag-disclosure__panel"
        hidden={!isOpen}
        id={panelId}
        inert={!isOpen ? true : undefined}
      >
        <div className="ag-disclosure__panel-inner">{children}</div>
      </div>
    </section>
  );
}
```

## Card

Section surface with optional editorial header and content body.

Key props: title, eyebrow, children.

Source: `packages/react/src/components/Card.tsx`

```tsx
import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type CardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  children: ReactNode;
  eyebrow?: ReactNode;
  title?: ReactNode;
};

export function Card({ children, className, eyebrow, title, ...props }: CardProps): ReactElement {
  const classNames = ["ag-card", className].filter(Boolean).join(" ");

  return (
    <section className={classNames} {...props}>
      {eyebrow || title ? (
        <header className="ag-card__header">
          {eyebrow ? <p className="ag-card__eyebrow">{eyebrow}</p> : null}
          {title ? <h2 className="ag-card__title">{title}</h2> : null}
        </header>
      ) : null}
      <div className="ag-card__body">{children}</div>
    </section>
  );
}
```

## ControlFoundation

Shared state contract, roving focus, direction-aware arrows, dismissal layers, and viewport-safe positioning.

Key props: ControlStateProps; useControllableState, joinIds, keyboard/focus and overlay helpers.

Source: `packages/react/src/components/foundation.ts`

```ts
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Shared state flags used by Aurelglyph controls. */
export type ControlStateProps = {
  /** Prevents interaction and removes the control from form submission where native semantics allow it. */
  disabled?: boolean;
  /** Announces that the control or its result is being updated. */
  busy?: boolean;
  /** Prevents interaction while communicating that an operation is in progress. */
  loading?: boolean;
  /** Allows focus and selection but prevents the value from being edited. */
  readOnly?: boolean;
  /** Marks a form value as required. */
  required?: boolean;
  /** Marks the current value as invalid. */
  invalid?: boolean;
};

export function useControllableState<T>({
  defaultValue,
  onChange,
  value
}: {
  defaultValue: T;
  onChange?: (value: T) => void;
  value?: T;
}): readonly [T, (next: T) => void] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const resolvedValue = isControlled ? value : internalValue;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T): void => {
      if (!isControlled) setInternalValue(next);
      onChangeRef.current?.(next);
    },
    [isControlled]
  );

  return [resolvedValue, setValue] as const;
}

export function nextEnabledIndex(
  current: number,
  count: number,
  disabled: (index: number) => boolean,
  direction: 1 | -1
): number {
  if (count <= 0) return -1;

  for (let offset = 1; offset <= count; offset += 1) {
    const candidate = (current + direction * offset + count) % count;
    if (!disabled(candidate)) return candidate;
  }

  return -1;
}

export function edgeEnabledIndex(count: number, disabled: (index: number) => boolean, edge: "first" | "last"): number {
  const start = edge === "first" ? 0 : count - 1;
  const direction = edge === "first" ? 1 : -1;

  for (let index = start; index >= 0 && index < count; index += direction) {
    if (!disabled(index)) return index;
  }

  return -1;
}

/** Resolves the visual step for a horizontal arrow key in the element's writing direction. */
export function horizontalArrowStep(element: HTMLElement, key: "ArrowLeft" | "ArrowRight"): 1 | -1 {
  const directionRoot = element.closest<HTMLElement>("[dir]");
  const explicitDirection = directionRoot?.getAttribute("dir")?.toLocaleLowerCase();
  const rightToLeft =
    explicitDirection === "rtl" ||
    (explicitDirection !== "ltr" && typeof getComputedStyle === "function" && getComputedStyle(element).direction === "rtl");

  if (key === "ArrowRight") return rightToLeft ? -1 : 1;
  return rightToLeft ? 1 : -1;
}

export function focusAt(container: HTMLElement, selector: string, index: number, options?: FocusOptions): void {
  const candidates = container.querySelectorAll<HTMLElement>(selector);
  const candidate = candidates.item(index);
  if (!candidate) return;
  if (options) candidate.focus(options);
  else candidate.focus();
}

type DismissLayerRecord = {
  dismiss: (reason: "escape" | "outside") => void;
  refs: () => readonly RefObject<HTMLElement | null>[];
};

const dismissLayers: DismissLayerRecord[] = [];

function dismissTopLayerFromKeyboard(event: globalThis.KeyboardEvent): void {
  if (event.key !== "Escape" || event.defaultPrevented) return;
  const layer = dismissLayers.at(-1);
  if (!layer) return;
  event.preventDefault();
  layer.dismiss("escape");
}

function dismissTopLayerFromPointer(event: PointerEvent): void {
  const layer = dismissLayers.at(-1);
  const target = event.target;
  if (!layer || !(target instanceof Node)) return;
  if (layer.refs().some((ref) => ref.current?.contains(target))) return;
  layer.dismiss("outside");
}

function connectDismissListeners(): void {
  if (dismissLayers.length !== 1) return;
  document.addEventListener("keydown", dismissTopLayerFromKeyboard);
  document.addEventListener("pointerdown", dismissTopLayerFromPointer);
}

function disconnectDismissListeners(): void {
  if (dismissLayers.length !== 0) return;
  document.removeEventListener("keydown", dismissTopLayerFromKeyboard);
  document.removeEventListener("pointerdown", dismissTopLayerFromPointer);
}

export function useDismissLayer({
  enabled,
  onDismiss,
  refs
}: {
  enabled: boolean;
  onDismiss: (reason: "escape" | "outside") => void;
  refs: readonly RefObject<HTMLElement | null>[];
}): void {
  const onDismissRef = useRef(onDismiss);
  const refsRef = useRef(refs);
  onDismissRef.current = onDismiss;
  refsRef.current = refs;

  useEffect(() => {
    if (!enabled) return;
    const layer: DismissLayerRecord = {
      dismiss: (reason) => onDismissRef.current(reason),
      refs: () => refsRef.current
    };
    dismissLayers.push(layer);
    connectDismissListeners();
    return () => {
      const index = dismissLayers.lastIndexOf(layer);
      if (index >= 0) dismissLayers.splice(index, 1);
      disconnectDismissListeners();
    };
  }, [enabled]);
}

export function joinIds(...ids: (string | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

/** Keeps an anchored floating surface inside its visible viewport/scrollport intersection. */
export function useViewportShift({
  anchorRef,
  enabled,
  margin = 8,
  onAnchorHidden,
  ref
}: {
  anchorRef?: RefObject<HTMLElement | null>;
  enabled: boolean;
  margin?: number;
  onAnchorHidden?: () => void;
  ref: RefObject<HTMLElement | null>;
}): void {
  const onAnchorHiddenRef = useRef(onAnchorHidden);
  onAnchorHiddenRef.current = onAnchorHidden;

  useIsomorphicLayoutEffect(() => {
    const surface = ref.current;
    if (!enabled || !surface || typeof window === "undefined") return;

    const requestFrame = window.requestAnimationFrame?.bind(window) ?? ((callback: FrameRequestCallback) => window.setTimeout(callback, 0));
    const cancelFrame = window.cancelAnimationFrame?.bind(window) ?? window.clearTimeout.bind(window);
    const anchor = anchorRef?.current ?? surface.parentElement;
    const collectAncestors = (element: Element | null): Element[] => {
      const collected: Element[] = [];
      for (let ancestor = element?.parentElement; ancestor && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        collected.push(ancestor);
      }
      return collected;
    };
    const surfaceAncestors = collectAncestors(surface);
    const observedAncestors = [...new Set([...surfaceAncestors, ...collectAncestors(anchor)])];
    let animationFrame = 0;
    let anchorWasVisible = false;
    const stabilizationTimers: number[] = [];
    const update = (): void => {
      surface.style.removeProperty("--ag-floating-visibility");
      surface.style.setProperty("--ag-floating-shift-x", "0px");
      surface.style.setProperty("--ag-floating-shift-y", "0px");
      const visualViewport = window.visualViewport;
      let viewportLeft = visualViewport?.offsetLeft ?? 0;
      let viewportTop = visualViewport?.offsetTop ?? 0;
      let viewportRight = viewportLeft + (visualViewport?.width ?? window.innerWidth);
      let viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);

      for (const ancestor of surfaceAncestors) {
        const style = getComputedStyle(ancestor);
        const clipsX = ["auto", "clip", "hidden", "overlay", "scroll"].includes(style.overflowX);
        const clipsY = ["auto", "clip", "hidden", "overlay", "scroll"].includes(style.overflowY);
        if (!clipsX && !clipsY) continue;
        const ancestorRect = ancestor.getBoundingClientRect();
        const clientLeft = ancestorRect.left + ancestor.clientLeft;
        const clientTop = ancestorRect.top + ancestor.clientTop;
        const clientRight = clientLeft + ancestor.clientWidth;
        const clientBottom = clientTop + ancestor.clientHeight;
        if (clipsX) {
          viewportLeft = Math.max(viewportLeft, clientLeft);
          viewportRight = Math.min(viewportRight, clientRight);
        }
        if (clipsY) {
          viewportTop = Math.max(viewportTop, clientTop);
          viewportBottom = Math.min(viewportBottom, clientBottom);
        }
      }

      if (anchor) {
        const anchorRect = anchor.getBoundingClientRect();
        const measurableAnchor = anchorRect.width > 0 || anchorRect.height > 0;
        let anchorHiddenByStyle = !anchor.isConnected;
        for (let element: Element | null = anchor; element && !anchorHiddenByStyle; element = element.parentElement) {
          const style = getComputedStyle(element);
          anchorHiddenByStyle = style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse";
        }
        const anchorVisible = anchorRect.right > viewportLeft
          && anchorRect.left < viewportRight
          && anchorRect.bottom > viewportTop
          && anchorRect.top < viewportBottom;
        if (anchorHiddenByStyle || (measurableAnchor && !anchorVisible) || (anchorWasVisible && !measurableAnchor)) {
          surface.style.setProperty("--ag-floating-visibility", "hidden");
          onAnchorHiddenRef.current?.();
          return;
        }
        if (measurableAnchor && anchorVisible) anchorWasVisible = true;
      }

      surface.style.setProperty("--ag-floating-available-width", `${Math.max(0, Math.floor(viewportRight - viewportLeft - margin * 2))}px`);
      surface.style.setProperty("--ag-floating-available-height", `${Math.max(0, Math.floor(viewportBottom - viewportTop - margin * 2))}px`);
      const rect = surface.getBoundingClientRect();
      let shiftX = 0;
      let shiftY = 0;

      if (rect.left < viewportLeft + margin) shiftX = viewportLeft + margin - rect.left;
      else if (rect.right > viewportRight - margin) shiftX = viewportRight - margin - rect.right;
      if (rect.top < viewportTop + margin) shiftY = viewportTop + margin - rect.top;
      else if (rect.bottom > viewportBottom - margin) shiftY = viewportBottom - margin - rect.bottom;

      surface.style.setProperty("--ag-floating-shift-x", `${Math.round(shiftX)}px`);
      surface.style.setProperty("--ag-floating-shift-y", `${Math.round(shiftY)}px`);
    };
    const schedule = (): void => {
      cancelFrame(animationFrame);
      animationFrame = requestFrame(update);
    };

    // Correct the opening frame synchronously. Browsers can throttle animation
    // frames in background/headless contexts, but the floating surface still
    // needs to enter the viewport before it is painted.
    update();
    // Focus management and browser scroll anchoring can move the trigger after
    // layout effects run. Recheck on the next frame without relying on that
    // deferred pass for the initial correction.
    schedule();
    // Native focus scrolling can settle after the next frame (notably in short
    // landscape viewports). A small bounded stabilization window catches that
    // geometry change even when the browser does not emit a scroll event.
    stabilizationTimers.push(window.setTimeout(update, 0), window.setTimeout(update, 120));
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
    resizeObserver?.observe(surface);
    if (anchor) resizeObserver?.observe(anchor);
    observedAncestors.forEach((ancestor) => resizeObserver?.observe(ancestor));
    const mutationObserver = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(schedule);
    if (mutationObserver) {
      const mutationTargets = new Set<Element>([...observedAncestors, document.documentElement]);
      if (anchor) mutationTargets.add(anchor);
      mutationTargets.forEach((target) => mutationObserver.observe(target, {
        attributeFilter: ["class", "hidden", "style"],
        attributes: true
      }));
    }

    return () => {
      cancelFrame(animationFrame);
      stabilizationTimers.forEach((timer) => window.clearTimeout(timer));
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      surface.style.removeProperty("--ag-floating-visibility");
      surface.style.removeProperty("--ag-floating-available-width");
      surface.style.removeProperty("--ag-floating-available-height");
      surface.style.removeProperty("--ag-floating-shift-x");
      surface.style.removeProperty("--ag-floating-shift-y");
    };
  }, [anchorRef, enabled, margin, ref]);
}
```
