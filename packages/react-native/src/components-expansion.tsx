import { useCallback, useEffect, useId, useRef, useState, type ReactElement, type ReactNode, type Ref } from "react";
import {
  AccessibilityInfo,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  findNodeHandle,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle
} from "react-native";

import { useAurelglyphControlCopy } from "./control-copy.js";
import { clamp, useControllableState, type ControlStateProps } from "./foundation.js";
import type { TextFieldProps } from "./forms.js";
import { Icon } from "./icons.js";
import { Button, IconButton } from "./primitives.js";
import { prepareIosSecureEntry, registerIosSecureEntry } from "./secure-entry.js";
import { useAurelglyphTheme } from "./theme.js";

function FocusControl({ onBlur, onFocus, style, ...props }: PressableProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [focused, setFocused] = useState(false);
  return <Pressable {...props} onBlur={(event) => { setFocused(false); onBlur?.(event); }} onFocus={(event) => { setFocused(true); onFocus?.(event); }} style={(state) => [
    typeof style === "function" ? style(state) : style,
    { borderColor: focused ? theme.colors.focus : "transparent", borderWidth: 1 }
  ]} />;
}

function labelStates(label: string, copy: ReturnType<typeof useAurelglyphControlCopy>, state: Pick<ControlStateProps, "invalid" | "readOnly" | "required">): string {
  return [label, state.required ? copy.required : undefined, state.invalid ? copy.invalid : undefined, state.readOnly ? copy.readOnly : undefined].filter(Boolean).join(", ");
}

function inertLinkProps(props: PressableProps): ViewProps {
  // An unavailable destination must not recover activation through secondary
  // native responders, screen-reader actions, web props, or context actions.
  return Object.fromEntries(Object.entries(props).filter(([key]) =>
    !/^(?:href|hrefAttrs|tabIndex|role|accessibilityRole|accessibilityActions|on(?:Press|LongPress|Accessibility|MagicTap|Responder|StartShould|MoveShould|Touch|Pointer|Key|Focus|Blur|Hover|Context))/.test(key)
  )) as ViewProps;
}

export type LinkProps = Omit<PressableProps, "children" | "disabled" | "onPress" | "onLongPress" | "style"> & Pick<ControlStateProps, "busy" | "disabled" | "loading"> & {
  children: string;
  external?: boolean;
  externalHint?: string;
  href?: string;
  onOpenError?: (error: unknown) => void;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Link({ accessibilityHint, accessibilityLabel, busy = false, children, disabled = false, external = false, externalHint, href, loading = false, onOpenError, onPress, style, textStyle, ...props }: LinkProps): ReactElement {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const unavailable = disabled || loading || (!href && !onPress);
  const [focused, setFocused] = useState(false);
  const label = accessibilityLabel ?? children;
  const hint = [accessibilityHint, unavailable ? copy.unavailable : external ? externalHint ?? copy.externalLink : undefined].filter(Boolean).join(". ") || undefined;
  const content = <>
    <Text style={[{ color: unavailable ? theme.colors.disabled : theme.colors.focus, fontFamily: theme.fonts.ui, fontSize: 15, textDecorationLine: unavailable ? "none" : "underline", flexShrink: 1 }, textStyle]}>{children}</Text>
    {external && !unavailable ? <Icon color={theme.colors.focus} name="external-link" size={16} /> : null}
  </>;
  const paint = [styles.link, { borderColor: focused && !unavailable ? theme.colors.focus : "transparent", borderRadius: theme.radii.xs }, style, { minHeight: 44, minWidth: 44 }];
  const safeProps = unavailable ? inertLinkProps(props) : props;
  if (unavailable) return <View {...safeProps} accessible accessibilityHint={hint} accessibilityLabel={label} accessibilityState={{ busy: busy || loading, disabled: true }} focusable={false} style={paint}>{content}</View>;
  return <Pressable
    {...safeProps}
    accessibilityHint={hint}
    accessibilityLabel={label}
    accessibilityRole="link"
    accessibilityState={{ busy }}
    onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
    onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
    onPress={(event) => {
      if (onPress) onPress(event);
      else if (href) void Linking.openURL(href).catch((error: unknown) => onOpenError?.(error));
    }}
    style={paint}
  >{content}</Pressable>;
}

export type ChipProps = Omit<ViewProps, "children"> & Pick<ControlStateProps, "disabled" | "loading" | "readOnly"> & {
  defaultSelected?: boolean;
  label: string;
  onRemove?: () => void;
  onSelectedChange?: (selected: boolean) => void;
  removeLabel?: string;
  selectable?: boolean;
  selected?: boolean;
};

export function Chip({ defaultSelected, disabled = false, label, loading = false, onRemove, onSelectedChange, readOnly = false, removeLabel, selectable, selected, style, ...props }: ChipProps): ReactElement {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const [resolved, setSelected] = useControllableState({ defaultValue: defaultSelected ?? false, onChange: onSelectedChange, value: selected });
  const canSelect = selectable ?? true;
  const unavailable = disabled || loading || readOnly;
  const content = <>
    {resolved ? <Icon color={theme.colors.focus} name="check" size={16} /> : null}
    <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 14, flexShrink: 1 }}>{label}</Text>
  </>;
  return <View {...props} accessible={false} style={[styles.chip, { backgroundColor: resolved ? theme.colors.accentMuted : theme.colors.surfaceMuted, borderColor: resolved ? theme.colors.focus : theme.colors.borderStrong, borderRadius: theme.radii.sm, opacity: disabled || loading ? 0.52 : 1 }, style]}>
    {canSelect ? <FocusControl accessibilityLabel={labelStates(label, copy, { readOnly })} accessibilityRole="checkbox" accessibilityState={{ busy: loading, checked: resolved, disabled: unavailable }} disabled={unavailable} onPress={() => setSelected(!resolved)} style={styles.chipLabel}>{content}</FocusControl>
      : <View accessible accessibilityLabel={[label, resolved ? copy.selected : undefined].filter(Boolean).join(", ")} style={styles.chipLabel}>{content}</View>}
    {onRemove ? <IconButton disabled={unavailable} icon={<Icon name="close" size={16} />} label={removeLabel ?? copy.removeChipLabel(label)} onPress={onRemove} style={{ borderStartWidth: StyleSheet.hairlineWidth, borderStartColor: theme.colors.borderStrong }} variant="ghost" /> : null}
  </View>;
}

type FieldFrameProps = { children: ReactNode; error?: string; helperText?: string; invalid?: boolean; label: string; labelId: string; required?: boolean; style?: StyleProp<ViewStyle> };

function FieldFrame({ children, error, helperText, invalid, label, labelId, required, style }: FieldFrameProps): ReactElement {
  const theme = useAurelglyphTheme();
  return <View accessible={false} style={[styles.field, style]}>
    <Text nativeID={labelId} style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 14, fontWeight: "600" }}>{label}{required ? " *" : ""}</Text>
    {children}
    {error || helperText ? <Text accessibilityLiveRegion={invalid ? "polite" : "none"} style={{ color: invalid ? theme.colors.danger : theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{error ?? helperText}</Text> : null}
  </View>;
}

function assignInputRef(ref: Ref<TextInputInstance> | undefined, input: TextInputInstance | null): void | (() => void) {
  if (typeof ref === "function") return ref(input);
  else if (ref) ref.current = input;
}

export type PasswordFieldProps = Omit<TextFieldProps, "label" | "multiline" | "secureTextEntry"> & {
  defaultVisible?: boolean;
  hideLabel?: string;
  inputRef?: Ref<TextInputInstance>;
  label: string;
  onVisibleChange?: (visible: boolean) => void;
  purpose?: "current" | "new";
  showLabel?: string;
  visible?: boolean;
};

export function PasswordField({ accessibilityHint, accessibilityLabel, autoComplete, busy = false, containerStyle, defaultValue = "", defaultVisible = false, disabled = false, error, helperText, hideLabel, inputRef, invalid = false, label, loading = false, onBlur, onChangeText, onFocus, onSelectionChange, onVisibleChange, purpose = "current", readOnly = false, required = false, selection, showLabel, style, textContentType, value, visible, ...props }: PasswordFieldProps): ReactElement {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const labelId = `ag-password-${useId()}`;
  const nativeInput = useRef<TextInputInstance>(null);
  const secureEntryOwner = useRef<{ input: TextInputInstance; detach?: () => void }>(null);
  const attachInput = useCallback((input: TextInputInstance | null) => {
    if (input) {
      // RN reattaches the same input ref when its native event count changes.
      // Ownership follows input identity, not those callback-ref lifecycles.
      if (secureEntryOwner.current?.input !== input) {
        secureEntryOwner.current?.detach?.();
        secureEntryOwner.current = { input, detach: registerIosSecureEntry(input) };
      }
      nativeInput.current = input;
    }
    const cleanup = assignInputRef(inputRef, input);
    if (input) return () => {
      if (typeof cleanup === "function") cleanup();
      else assignInputRef(inputRef, null);
    };
  }, [inputRef]);
  useEffect(() => () => {
    secureEntryOwner.current?.detach?.();
    secureEntryOwner.current = null;
    nativeInput.current = null;
  }, []);
  const selectedRange = useRef<TextInputProps["selection"]>(selection);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useControllableState({ defaultValue: defaultVisible, onChange: onVisibleChange, value: visible });
  const [password, setPassword] = useControllableState({ defaultValue, onChange: onChangeText, value });
  const lastNativeValue = useRef(password);
  const previousEntry = useRef({ password, revealed });
  const [nativeEditRevision, recordNativeEdit] = useState(0);
  const unavailable = disabled || loading;
  const isInvalid = invalid || Boolean(error);
  useEffect(() => {
    const visibilityChanged = previousEntry.current.revealed !== revealed;
    const externalValueChanged = lastNativeValue.current !== password;
    previousEntry.current = { password, revealed };
    lastNativeValue.current = password;
    const input = nativeInput.current;
    if (!input?.isFocused()) return;
    const range = selection ?? selectedRange.current;
    if (visibilityChanged) {
      input.focus();
      if (range) {
        const start = clamp(range.start, 0, password.length);
        input.setSelection(start, clamp(range.end ?? range.start, start, password.length));
      }
    }
    if (!revealed && (visibilityChanged || externalValueChanged)) prepareIosSecureEntry(input, password, selection);
    else if (revealed && (visibilityChanged || externalValueChanged)) prepareIosSecureEntry(input, null);
  }, [nativeEditRevision, password, revealed, selection]);
  const reveal = (): void => {
    if (unavailable) return;
    selectedRange.current = selection ?? selectedRange.current;
    setRevealed(!revealed);
  };
  return <FieldFrame error={error} helperText={helperText} invalid={isInvalid} label={label} labelId={labelId} required={required} style={containerStyle}>
    <View style={[styles.inputGroup, { backgroundColor: theme.colors.backgroundElevated, borderColor: focused ? theme.colors.focus : isInvalid ? theme.colors.danger : theme.colors.borderStrong, borderRadius: theme.radii.sm }]}>
      <TextInput
        {...props}
        accessibilityHint={[accessibilityHint, error ?? helperText].filter(Boolean).join(". ") || undefined}
        accessibilityLabel={labelStates(accessibilityLabel ?? label, copy, { invalid: isInvalid, readOnly, required })}
        accessibilityLabelledBy={labelId}
        accessibilityState={{ busy: busy || loading, disabled: unavailable }}
        autoCapitalize="none"
        autoComplete={autoComplete ?? (purpose === "new" ? "new-password" : "current-password")}
        autoCorrect={false}
        editable={!unavailable && !readOnly}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        onChangeText={(next) => { if (!unavailable && !readOnly) { lastNativeValue.current = next; if (value !== undefined) recordNativeEdit((revision) => revision + 1); setPassword(next); } }}
        onFocus={(event) => {
          setFocused(true); onFocus?.(event);
        }}
        onSelectionChange={(event) => { selectedRange.current = event.nativeEvent.selection; onSelectionChange?.(event); }}
        placeholderTextColor={theme.colors.subtle}
        ref={attachInput}
        secureTextEntry={!revealed}
        selection={selection}
        selectionColor={theme.colors.focus}
        style={[styles.groupInput, { color: unavailable ? theme.colors.disabled : theme.colors.text, fontFamily: theme.fonts.ui }, style]}
        textContentType={textContentType ?? (purpose === "new" ? "newPassword" : "password")}
        value={password}
      />
      <IconButton disabled={unavailable} icon={<Icon name={revealed ? "eye-off" : "eye"} />} label={revealed ? hideLabel ?? copy.hidePasswordLabel(label) : showLabel ?? copy.showPasswordLabel(label)} onPress={reveal} variant="ghost" />
    </View>
  </FieldFrame>;
}

export type InputGroupProps = Omit<TextFieldProps, "label"> & {
  addonDescription?: string;
  inputRef?: Ref<TextInputInstance>;
  label: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

export function InputGroup({ accessibilityHint, accessibilityLabel, addonDescription, busy = false, containerStyle, disabled = false, error, helperText, inputRef, invalid = false, label, loading = false, onBlur, onChangeText, onFocus, prefix, readOnly = false, required = false, style, suffix, ...props }: InputGroupProps): ReactElement {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const labelId = `ag-input-group-${useId()}`;
  const isInvalid = invalid || Boolean(error);
  const unavailable = disabled || loading;
  const [focused, setFocused] = useState(false);
  const addon = (value: ReactNode): ReactNode => typeof value === "string" || typeof value === "number"
    ? <Text accessible={false} accessibilityElementsHidden importantForAccessibility="no" style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 14, paddingHorizontal: theme.space[3] }}>{value}</Text> : value;
  return <FieldFrame error={error} helperText={helperText} invalid={isInvalid} label={label} labelId={labelId} required={required} style={containerStyle}>
    <View accessible={false} style={[styles.inputGroup, { backgroundColor: theme.colors.backgroundElevated, borderColor: focused ? theme.colors.focus : isInvalid ? theme.colors.danger : theme.colors.borderStrong, borderRadius: theme.radii.sm }]}>
      {prefix !== undefined && prefix !== null ? <View accessible={false} style={styles.addon}>{addon(prefix)}</View> : null}
      <TextInput
        {...props}
        accessibilityHint={[accessibilityHint, addonDescription, error ?? helperText].filter(Boolean).join(". ") || undefined}
        accessibilityLabel={labelStates(accessibilityLabel ?? label, copy, { invalid: isInvalid, readOnly, required })}
        accessibilityLabelledBy={labelId}
        accessibilityState={{ busy: busy || loading, disabled: unavailable }}
        editable={!unavailable && !readOnly}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        onChangeText={(next) => { if (!unavailable && !readOnly) onChangeText?.(next); }}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        placeholderTextColor={theme.colors.subtle}
        ref={inputRef}
        selectionColor={theme.colors.focus}
        style={[styles.groupInput, { color: unavailable ? theme.colors.disabled : theme.colors.text, fontFamily: theme.fonts.ui }, style]}
      />
      {suffix !== undefined && suffix !== null ? <View accessible={false} style={styles.addon}>{addon(suffix)}</View> : null}
    </View>
  </FieldFrame>;
}

export type ValidationError = { id: string; message: string; onPress?: () => void };
export type ValidationSummaryProps = Omit<ViewProps, "children"> & {
  announcementKey?: string | number;
  errors: readonly ValidationError[];
  focusKey?: string | number;
  title?: string;
};

export function ValidationSummary({ announcementKey, errors, focusKey, style, title, ...props }: ValidationSummaryProps): ReactElement | null {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const resolvedTitle = title ?? copy.validationSummary;
  const heading = useRef<React.ComponentRef<typeof Text>>(null);
  const handledAnnouncements = useRef(new Set<string | number>());
  const handledFocusKeys = useRef(new Set<string | number>());
  const announcement = copy.validationSummaryAnnouncement(resolvedTitle, errors.length);
  useEffect(() => {
    if (!errors.length) return;
    if (announcementKey !== undefined && !handledAnnouncements.current.has(announcementKey)) {
      handledAnnouncements.current.add(announcementKey);
      AccessibilityInfo.announceForAccessibility(announcement);
    }
    if (focusKey !== undefined && !handledFocusKeys.current.has(focusKey)) {
      const handle = findNodeHandle(heading.current);
      if (typeof handle === "number") {
        handledFocusKeys.current.add(focusKey);
        AccessibilityInfo.setAccessibilityFocus(handle);
      }
    }
  }, [announcement, announcementKey, errors.length, focusKey]);
  if (!errors.length) return null;
  return <View {...props} accessible={false} style={[styles.summary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.danger, borderRadius: theme.radii.sm }, style]}>
    <Text accessibilityRole="header" ref={heading} style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 15, fontWeight: "600" }}>{resolvedTitle}</Text>
    {errors.map((error) => error.onPress
      ? <FocusControl accessibilityLabel={error.message} accessibilityRole="button" key={error.id} onPress={error.onPress} style={styles.summaryAction}><Text style={{ color: theme.colors.danger, fontFamily: theme.fonts.ui, fontSize: 14, textDecorationLine: "underline" }}>{error.message}</Text></FocusControl>
      : <Text key={error.id} style={{ color: theme.colors.danger, fontFamily: theme.fonts.ui, fontSize: 14 }}>{error.message}</Text>)}
  </View>;
}

export type ExpandableSectionProps = Omit<ViewProps, "children"> & Pick<ControlStateProps, "disabled" | "loading"> & {
  children: ReactNode;
  defaultOpen?: boolean;
  eyebrow?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  title: string;
};

export function ExpandableSection({ children, defaultOpen = false, disabled = false, eyebrow, headingLevel = 3, loading = false, nativeID, onOpenChange, open, style, title, ...props }: ExpandableSectionProps): ReactElement {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const id = `ag-disclosure-${useId()}`;
  const panelId = `${nativeID ?? id}-panel`;
  const triggerId = `${nativeID ?? id}-trigger`;
  const [expanded, setExpanded] = useControllableState({ defaultValue: defaultOpen, onChange: onOpenChange, value: open });
  const unavailable = disabled || loading;
  return <View {...props} accessible={false} nativeID={nativeID ?? id} style={[styles.disclosure, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong, borderRadius: theme.radii.sm }, style]}>
    <FocusControl accessibilityHint={expanded ? copy.expanded : copy.collapsed} accessibilityLabel={title} accessibilityRole="button" accessibilityState={{ busy: loading, disabled: unavailable, expanded }} disabled={unavailable} nativeID={triggerId} onPress={() => setExpanded(!expanded)} style={styles.disclosureTrigger}>
      <View accessible={false} style={styles.grow}>
        {eyebrow ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 11 }}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" aria-level={headingLevel} style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 15, fontWeight: "600" }}>{title}</Text>
      </View>
      <Icon color={theme.colors.muted} name={expanded ? "contract" : "expand"} size={18} />
    </FocusControl>
    {expanded ? <View accessible={false} accessibilityLabelledBy={triggerId} nativeID={panelId} style={{ borderTopColor: theme.colors.border, borderTopWidth: StyleSheet.hairlineWidth, padding: theme.space[4] }}>{children}</View> : null}
  </View>;
}

export type AccordionItem = { content: ReactNode; disabled?: boolean; eyebrow?: string; id: string; title: string };
export type AccordionProps = Omit<ViewProps, "children"> & Pick<ControlStateProps, "disabled" | "loading"> & {
  defaultValue?: readonly string[];
  headingLevel?: ExpandableSectionProps["headingLevel"];
  items: readonly AccordionItem[];
  label?: string;
  onValueChange?: (value: readonly string[]) => void;
  type?: "single" | "multiple";
  value?: readonly string[];
};

export function Accordion({ defaultValue = [], disabled = false, headingLevel = 3, items, label, loading = false, onValueChange, style, type = "single", value, ...props }: AccordionProps): ReactElement {
  const copy = useAurelglyphControlCopy();
  const [opened, setOpened] = useControllableState({ defaultValue, onChange: onValueChange, value });
  const valid = [...new Set(items.filter((item) => opened.includes(item.id)).map((item) => item.id))];
  const active = type === "single" ? valid.slice(0, 1) : valid;
  return <View {...props} accessible={false} accessibilityLabel={label ?? copy.accordion} style={[styles.field, style]}>
    {items.map((item) => <ExpandableSection disabled={disabled || item.disabled} eyebrow={item.eyebrow} headingLevel={headingLevel} key={item.id} loading={loading} onOpenChange={(next) => {
      const updated = next ? type === "single" ? [item.id] : [...active, item.id] : active.filter((id) => id !== item.id);
      setOpened(updated);
    }} open={active.includes(item.id)} title={item.title}>{item.content}</ExpandableSection>)}
  </View>;
}

export type StepStatus = "current" | "completed" | "upcoming" | "error";
export type StepperItem = { description?: string; disabled?: boolean; id: string; label: string; status?: StepStatus };
export type StepperProps = Omit<ViewProps, "children"> & Pick<ControlStateProps, "disabled" | "loading"> & {
  currentId?: string;
  defaultCurrentId?: string;
  items: readonly StepperItem[];
  label?: string;
  onStepChange?: (id: string) => void;
  orientation?: "horizontal" | "vertical";
};

export function Stepper({ currentId, defaultCurrentId, disabled = false, items, label, loading = false, onStepChange, orientation = "horizontal", style, ...props }: StepperProps): ReactElement {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const [current, setCurrent] = useControllableState({ defaultValue: defaultCurrentId ?? items.find((item) => item.status === "current")?.id ?? items[0]?.id ?? "", onChange: onStepChange, value: currentId });
  const currentIndex = items.findIndex((item) => item.id === current);
  return <View {...props} accessible={false} accessibilityLabel={label ?? copy.stepper} style={[styles.stepper, { flexDirection: orientation === "vertical" ? "column" : "row" }, style]}>
    {items.map((item, index) => {
      const isCurrent = item.id === current;
      const state = item.status === "error" ? "error" : item.id === current ? "current" : item.status === "current" ? "upcoming" : item.status ?? (index < currentIndex ? "completed" : "upcoming");
      const status = isCurrent && state === "error" ? [copy.stepState("current"), copy.stepState("error")].join(", ") : copy.stepState(state);
      const unavailable = disabled || loading || item.disabled;
      const itemLabel = copy.stepLabel(item.label, index + 1, items.length, status);
      const color = state === "error" ? theme.colors.danger : state === "completed" ? theme.colors.success : state === "current" ? theme.colors.focus : theme.colors.muted;
      const content = <>
        <View accessible={false} style={[styles.stepMarker, { borderColor: color, borderRadius: theme.radii.sm }]}>{state === "completed" || state === "error" ? <Icon color={color} name={state === "completed" ? "check" : "warning"} size={18} /> : <Text style={{ color, fontFamily: theme.fonts.ui }}>{index + 1}</Text>}</View>
        <View accessible={false} style={styles.grow}><Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 14, fontWeight: isCurrent ? "600" : "400" }}>{item.label}</Text><Text style={{ color, fontFamily: theme.fonts.ui, fontSize: 12 }}>{status}</Text>{item.description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{item.description}</Text> : null}</View>
      </>;
      const itemStyle = [styles.step, orientation === "vertical" ? { flexBasis: "auto" as const, flexGrow: 0 } : undefined];
      return onStepChange ? <FocusControl accessibilityHint={item.description} accessibilityLabel={itemLabel} accessibilityRole="button" accessibilityState={{ busy: loading, disabled: unavailable, selected: item.id === current }} disabled={unavailable} key={item.id} onPress={() => setCurrent(item.id)} style={[itemStyle, { opacity: unavailable ? 0.52 : 1 }]}>{content}</FocusControl>
        : <View accessible accessibilityHint={item.description} accessibilityLabel={itemLabel} accessibilityState={{ selected: item.id === current }} key={item.id} style={itemStyle}>{content}</View>;
    })}
  </View>;
}

export type RatingProps = Omit<ViewProps, "children"> & Pick<ControlStateProps, "disabled" | "loading" | "readOnly" | "required" | "invalid"> & {
  clearable?: boolean;
  clearLabel?: string;
  defaultValue?: number;
  error?: string;
  helperText?: string;
  label?: string;
  max?: number;
  onValueChange?: (value: number) => void;
  value?: number;
};

export function Rating({ clearable = true, clearLabel, defaultValue = 0, disabled = false, error, helperText, invalid = false, label, loading = false, max = 5, onValueChange, readOnly = false, required = false, style, value, ...props }: RatingProps): ReactElement {
  const theme = useAurelglyphTheme();
  const copy = useAurelglyphControlCopy();
  const resolvedLabel = label ?? copy.rating;
  const count = Number.isFinite(max) ? Math.max(1, Math.min(20, Math.floor(max))) : 5;
  const [current, setCurrent] = useControllableState({ defaultValue, onChange: onValueChange, value });
  const selected = Number.isFinite(current) ? clamp(Math.round(current), 0, count) : 0;
  const unavailable = disabled || loading || readOnly;
  const isInvalid = invalid || Boolean(error) || (required && selected === 0);
  const select = (next: number): void => {
    if (!unavailable && next >= (required ? 1 : 0) && next <= count && next !== selected) setCurrent(next);
  };
  return <View {...props} accessible={false} style={[styles.field, { borderColor: isInvalid ? theme.colors.danger : "transparent", borderRadius: theme.radii.sm, borderWidth: 1 }, style]}>
    <View accessible={false} style={{ alignItems: "center", flexDirection: "row", gap: 6 }}>
      <Text style={{ color: theme.colors.text, flexShrink: 1, fontFamily: theme.fonts.ui, fontSize: 14, fontWeight: "600" }}>{resolvedLabel}{required ? " *" : ""}</Text>
      {isInvalid ? <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="aurelglyph-rating-invalid"><Icon color={theme.colors.danger} name="warning" size={16} /></View> : null}
    </View>
    <View accessible={false} style={styles.ratingRow}>
      <View
        accessible
        accessibilityActions={unavailable ? [] : [{ name: "increment", label: copy.increaseLabel(resolvedLabel) }, { name: "decrement", label: copy.decreaseLabel(resolvedLabel) }]}
        accessibilityHint={error ?? helperText}
        accessibilityLabel={labelStates(resolvedLabel, copy, { invalid: isInvalid, readOnly, required })}
        accessibilityRole="adjustable"
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        accessibilityValue={{ min: 0, max: count, now: selected, text: copy.ratingValueLabel(selected, count) }}
        onAccessibilityAction={(event) => { if (event.nativeEvent.actionName === "increment") select(selected + 1); if (event.nativeEvent.actionName === "decrement") select(selected - 1); }}
        style={styles.ratingOptions}
      >
        {Array.from({ length: count }, (_, index) => {
          const option = index + 1;
          const icon = <Icon color={unavailable ? theme.colors.muted : option <= selected ? theme.colors.focus : theme.colors.muted} filled={option <= selected} name="star" size={24} />;
          return unavailable ? <View accessible={false} key={option} style={styles.ratingOption}>{icon}</View>
            : <FocusControl accessible={false} accessibilityLabel={copy.ratingOptionLabel(option, count)} accessibilityRole="radio" accessibilityState={{ checked: option === selected }} key={option} onPress={() => select(option)} style={styles.ratingOption}>{icon}</FocusControl>;
        })}
      </View>
      {clearable && !required && !readOnly ? <Button accessibilityLabel={clearLabel ?? copy.clearRating} disabled={unavailable || selected === 0} onPress={() => select(0)} size="sm" variant="ghost">{copy.clear}</Button> : null}
    </View>
    <Text accessible={false} style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{copy.ratingValueLabel(selected, count)}</Text>
    {error || helperText ? <Text accessibilityLiveRegion={isInvalid ? "polite" : "none"} style={{ color: isInvalid ? theme.colors.danger : theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{error ?? helperText}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  addon: { alignItems: "center", flexDirection: "row", flexShrink: 1, minHeight: 44 },
  chip: { alignItems: "center", alignSelf: "flex-start", borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", maxWidth: "100%" },
  chipLabel: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 6, minHeight: 44, minWidth: 44, paddingHorizontal: 12 },
  disclosure: { borderWidth: StyleSheet.hairlineWidth },
  disclosureTrigger: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 44, minWidth: 44, paddingHorizontal: 16, paddingVertical: 12 },
  field: { gap: 8 },
  grow: { flex: 1, gap: 3, minWidth: 0 },
  groupInput: { flexBasis: 100, flexGrow: 1, flexShrink: 1, fontSize: 15, minHeight: 44, minWidth: 44, paddingHorizontal: 12, paddingVertical: 10 },
  inputGroup: { alignItems: "center", borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap" },
  link: { alignItems: "center", alignSelf: "flex-start", borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 2, paddingVertical: 4 },
  ratingOption: { alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 44 },
  ratingOptions: { flexDirection: "row", flexWrap: "wrap" },
  ratingRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 4 },
  step: { alignItems: "center", flexBasis: 140, flexDirection: "row", flexGrow: 1, gap: 8, minHeight: 44, minWidth: 44, paddingVertical: 6 },
  stepMarker: { alignItems: "center", borderWidth: 1, height: 32, justifyContent: "center", width: 32 },
  stepper: { flexWrap: "wrap", gap: 12 },
  summary: { borderWidth: StyleSheet.hairlineWidth, gap: 4, padding: 16 },
  summaryAction: { justifyContent: "center", minHeight: 44, minWidth: 44 }
});
