import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Switch as NativeSwitch,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextInputProps,
  type ViewProps,
  type ViewStyle
} from "react-native";

import { clamp, normalizeStep, snapValue, useControllableState, type ControlStateProps } from "./foundation.js";
import { Icon } from "./icons.js";
import { Button } from "./primitives.js";
import { useAurelglyphTheme } from "./theme.js";

type FieldChromeProps = {
  children: ReactNode;
  error?: string;
  helperText?: string;
  invalid?: boolean;
  label?: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
};

function FieldChrome({ children, error, helperText, invalid, label, required, style }: FieldChromeProps): ReactElement {
  const theme = useAurelglyphTheme();
  return (
    <View style={[styles.field, style]}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.muted, fontFamily: theme.fonts.mono }]}>
          {label}
          {required ? " *" : ""}
        </Text>
      ) : null}
      {children}
      {error || helperText ? (
        <Text
          accessibilityLiveRegion={error ? "polite" : "none"}
          style={{ color: error ? theme.colors.danger : theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}
        >
          {error ?? helperText}
        </Text>
      ) : null}
    </View>
  );
}

export type TextFieldProps = Omit<TextInputProps, "editable"> & ControlStateProps & {
  label?: string;
  helperText?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  busy = false,
  containerStyle,
  disabled = false,
  error,
  helperText,
  invalid = false,
  label,
  loading = false,
  readOnly = false,
  required = false,
  style,
  ...props
}: TextFieldProps): ReactElement {
  const theme = useAurelglyphTheme();
  const isInvalid = invalid || Boolean(error);
  const {
    accessibilityHint,
    accessibilityLabel,
    ...inputProps
  } = props;
  const stateLabel = [accessibilityLabel ?? label, required ? "required" : undefined, isInvalid ? "invalid" : undefined, readOnly ? "read only" : undefined]
    .filter(Boolean)
    .join(", ");
  const stateHint = [accessibilityHint, error ?? helperText].filter(Boolean).join(". ") || undefined;
  return (
    <FieldChrome error={error} helperText={helperText} invalid={isInvalid} label={label} required={required} style={containerStyle}>
      <TextInput
        {...inputProps}
        accessibilityHint={stateHint}
        accessibilityLabel={stateLabel || undefined}
        accessibilityState={{ busy: busy || loading, disabled: disabled || loading }}
        editable={!disabled && !loading && !readOnly}
        placeholderTextColor={theme.colors.subtle}
        selectionColor={theme.colors.accent}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.backgroundElevated,
            borderColor: isInvalid ? theme.colors.danger : theme.colors.borderStrong,
            borderRadius: theme.radii.sm,
            color: disabled ? theme.colors.disabled : theme.colors.text,
            fontFamily: theme.fonts.ui
          },
          style
        ]}
      />
    </FieldChrome>
  );
}

export type SearchFieldProps = Omit<TextFieldProps, "multiline" | "numberOfLines"> & {
  clearLabel?: string;
  icon?: ReactNode;
  onClear?: () => void;
};

export function SearchField({
  busy = false,
  clearLabel = "Clear search",
  containerStyle,
  defaultValue = "",
  disabled = false,
  error,
  helperText,
  icon,
  invalid = false,
  label = "Search",
  loading = false,
  onChangeText,
  onClear,
  placeholder = "Search",
  readOnly = false,
  required = false,
  style,
  value,
  ...props
}: SearchFieldProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [query, setQuery] = useControllableState({ defaultValue, onChange: onChangeText, value });
  const unavailable = disabled || loading || readOnly;
  const isInvalid = invalid || Boolean(error);
  const clear = (): void => {
    if (unavailable) return;
    setQuery("");
    onClear?.();
  };
  return (
    <FieldChrome error={error} helperText={helperText} invalid={isInvalid} label={label} required={required} style={containerStyle}>
      <View style={styles.searchRow}>
        {icon ?? <Icon color={theme.colors.muted} name="search" />}
        <TextInput
          {...props}
          accessibilityHint={[props.accessibilityHint, error ?? helperText].filter(Boolean).join(". ") || undefined}
          accessibilityLabel={[props.accessibilityLabel ?? label, required ? "required" : undefined, isInvalid ? "invalid" : undefined, readOnly ? "read only" : undefined].filter(Boolean).join(", ")}
          accessibilityState={{ busy: busy || loading, disabled: disabled || loading }}
          editable={!unavailable}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.subtle}
          returnKeyType="search"
          role="searchbox"
          selectionColor={theme.colors.accent}
          style={[
            styles.input,
            styles.searchInput,
            {
              backgroundColor: theme.colors.backgroundElevated,
              borderColor: isInvalid ? theme.colors.danger : theme.colors.borderStrong,
              borderRadius: theme.radii.sm,
              color: unavailable ? theme.colors.disabled : theme.colors.text,
              fontFamily: theme.fonts.ui
            },
            style
          ]}
          value={query}
        />
        {query ? (
          <Button accessibilityLabel={clearLabel} disabled={unavailable} onPress={clear} size="sm" variant="ghost">
            Clear
          </Button>
        ) : null}
      </View>
    </FieldChrome>
  );
}

export type TextAreaProps = TextFieldProps & { rows?: number };

export function TextArea({ rows = 4, style, ...props }: TextAreaProps): ReactElement {
  return <TextField multiline numberOfLines={rows} style={[{ minHeight: rows * 24 + 24, textAlignVertical: "top" }, style]} {...props} />;
}

export type SwitchProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "busy" | "disabled" | "loading" | "readOnly"> & {
    label: string;
    description?: string;
    value?: boolean;
    defaultValue?: boolean;
    onValueChange?: (value: boolean) => void;
  };

export function Switch({
  busy = false,
  defaultValue = false,
  description,
  disabled = false,
  label,
  loading = false,
  onValueChange,
  readOnly = false,
  style,
  value,
  ...props
}: SwitchProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [checked, setChecked] = useControllableState({ defaultValue, onChange: onValueChange, value });
  const unavailable = disabled || loading || readOnly;
  return (
    <View style={[styles.controlRow, style]} {...props}>
      <View style={styles.controlCopy}>
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 15 }}>{label}</Text>
        {description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{description}</Text> : null}
      </View>
      <NativeSwitch
        accessibilityLabel={label}
        accessibilityState={{ busy: busy || loading, disabled: unavailable, checked }}
        disabled={unavailable}
        ios_backgroundColor={theme.colors.surfaceStrong}
        onValueChange={setChecked}
        thumbColor={checked ? theme.colors.accentForeground : theme.colors.muted}
        trackColor={{ false: theme.colors.surfaceStrong, true: theme.colors.accent }}
        value={checked}
      />
    </View>
  );
}

export type CheckboxProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading" | "readOnly" | "required" | "invalid"> & {
    label: string;
    description?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    indeterminate?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  };

export function Checkbox({
  checked,
  defaultChecked = false,
  description,
  disabled = false,
  indeterminate = false,
  invalid = false,
  label,
  loading = false,
  onCheckedChange,
  readOnly = false,
  required = false,
  style,
  ...props
}: CheckboxProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [resolved, setResolved] = useControllableState({ defaultValue: defaultChecked, onChange: onCheckedChange, value: checked });
  const unavailable = disabled || loading || readOnly;
  return (
    <Pressable
      accessibilityLabel={`${label}${required ? ", required" : ""}${invalid ? ", invalid" : ""}`}
      accessibilityHint={[description, readOnly ? "Read only" : undefined].filter(Boolean).join(". ") || undefined}
      accessibilityRole="checkbox"
      accessibilityState={{ busy: loading, checked: indeterminate ? "mixed" : resolved, disabled: unavailable }}
      disabled={unavailable}
      onPress={() => setResolved(indeterminate || !resolved)}
      style={({ pressed }) => [styles.controlRow, { opacity: unavailable ? 0.52 : pressed ? 0.76 : 1 }, style]}
      {...props}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: resolved || indeterminate ? theme.colors.accent : theme.colors.backgroundElevated,
            borderColor: invalid ? theme.colors.danger : resolved || indeterminate ? theme.colors.accentStrong : theme.colors.borderStrong,
            borderRadius: theme.radii.xs
          }
        ]}
      >
        {indeterminate ? <Icon color={theme.colors.accentForeground} name="minus" size={14} strokeWidth={2} /> : resolved ? <Icon color={theme.colors.accentForeground} name="check" size={14} strokeWidth={2} /> : null}
      </View>
      <View style={styles.controlCopy}>
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 15 }}>{label}</Text>
        {description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

export type RadioOption = { label: string; value: string; description?: string; disabled?: boolean };
export type RadioGroupProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading" | "readOnly" | "required" | "invalid"> & {
    label: string;
    options: readonly RadioOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    error?: string;
  };

export function RadioGroup({
  defaultValue = "",
  disabled = false,
  error,
  invalid = false,
  label,
  loading = false,
  onValueChange,
  options,
  readOnly = false,
  required = false,
  style,
  value,
  ...props
}: RadioGroupProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [selected, setSelected] = useControllableState({ defaultValue, onChange: onValueChange, value });
  const isInvalid = invalid || Boolean(error);
  return (
    <View
      accessible={false}
      style={[styles.field, style]}
      {...props}
    >
      <Text style={[styles.label, { color: isInvalid ? theme.colors.danger : theme.colors.muted, fontFamily: theme.fonts.mono }]}>{label}</Text>
      {options.map((option) => {
        const checked = selected === option.value;
        const unavailable = disabled || loading || readOnly || option.disabled;
        return (
          <Pressable
            accessibilityHint={[option.description, error].filter(Boolean).join(". ") || undefined}
            accessibilityLabel={[option.label, label, required ? "required" : undefined, isInvalid ? "invalid" : undefined, readOnly ? "read only" : undefined].filter(Boolean).join(", ")}
            accessibilityRole="radio"
            accessibilityState={{ busy: loading, checked, disabled: unavailable }}
            disabled={unavailable}
            key={option.value}
            onPress={() => setSelected(option.value)}
            style={({ pressed }) => [styles.controlRow, { opacity: unavailable ? 0.52 : pressed ? 0.76 : 1 }]}
          >
            <View
              style={[
                styles.radio,
                { borderColor: isInvalid ? theme.colors.danger : checked ? theme.colors.accent : theme.colors.borderStrong }
              ]}
            >
              {checked ? <View style={[styles.radioDot, { backgroundColor: theme.colors.accent }]} /> : null}
            </View>
            <View style={styles.controlCopy}>
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui }}>{option.label}</Text>
              {option.description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{option.description}</Text> : null}
            </View>
          </Pressable>
        );
      })}
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, fontFamily: theme.fonts.ui, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}

export type SliderProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading" | "readOnly" | "required" | "invalid"> & {
    label: string;
    value?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (value: number) => void;
    formatValue?: (value: number) => string;
    helperText?: string;
    error?: string;
  };

export function Slider({
  defaultValue,
  disabled = false,
  error,
  formatValue = String,
  helperText,
  invalid = false,
  label,
  loading = false,
  max = 100,
  min = 0,
  onValueChange,
  readOnly = false,
  required = false,
  step = 1,
  style,
  value,
  ...props
}: SliderProps): ReactElement {
  const theme = useAurelglyphTheme();
  const safeMin = Number.isFinite(min) ? min : 0;
  const finiteMax = Number.isFinite(max) ? max : safeMin + 100;
  const safeMax = finiteMax > safeMin ? finiteMax : safeMin + 1;
  const safeStep = normalizeStep(step);
  const initial = snapValue(defaultValue ?? safeMin, safeMin, safeMax, safeStep);
  const [resolved, setResolved] = useControllableState({ defaultValue: initial, onChange: onValueChange, value });
  const current = snapValue(resolved, safeMin, safeMax, safeStep);
  const [trackWidth, setTrackWidth] = useState(1);
  const unavailable = disabled || loading || readOnly;
  const isInvalid = invalid || Boolean(error);
  const setFromEvent = (event: GestureResponderEvent): void => {
    if (unavailable) return;
    const ratio = clamp(event.nativeEvent.locationX / trackWidth, 0, 1);
    setResolved(snapValue(safeMin + ratio * (safeMax - safeMin), safeMin, safeMax, safeStep));
  };
  const adjust = (direction: 1 | -1): void => {
    if (!unavailable) setResolved(snapValue(current + direction * safeStep, safeMin, safeMax, safeStep));
  };
  const percent = ((current - safeMin) / (safeMax - safeMin)) * 100;
  return (
    <View style={[styles.field, style]} {...props}>
      <FieldChrome error={error} helperText={helperText} invalid={isInvalid} label={label} required={required}>
      <View
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        accessibilityHint={[error ?? helperText, readOnly ? "Read only" : undefined].filter(Boolean).join(". ") || undefined}
        accessibilityLabel={[label, required ? "required" : undefined, isInvalid ? "invalid" : undefined].filter(Boolean).join(", ")}
        accessibilityRole="adjustable"
        accessibilityState={{ busy: loading, disabled: unavailable }}
        accessibilityValue={{ max: safeMax, min: safeMin, now: current, text: formatValue(current) }}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") adjust(1);
          if (event.nativeEvent.actionName === "decrement") adjust(-1);
        }}
        onLayout={(event) => setTrackWidth(Math.max(event.nativeEvent.layout.width, 1))}
        onMoveShouldSetResponder={() => !unavailable}
        onResponderGrant={setFromEvent}
        onResponderMove={setFromEvent}
        onStartShouldSetResponder={() => !unavailable}
        style={[styles.sliderTouchTarget, { opacity: unavailable ? 0.52 : 1 }]}
      >
        <View pointerEvents="none" style={[styles.sliderTrack, { backgroundColor: theme.colors.surfaceStrong }]}>
          <View style={[styles.sliderFill, { backgroundColor: theme.colors.accent, width: `${percent}%` }]} />
          <View
            accessible={false}
            style={[
              styles.sliderThumb,
              {
                backgroundColor: theme.colors.accentForeground,
                borderColor: isInvalid ? theme.colors.danger : theme.colors.accent,
                left: `${percent}%`
              }
            ]}
          />
        </View>
      </View>
      <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 12 }}>{formatValue(current)}</Text>
      </FieldChrome>
    </View>
  );
}

export type NumberFieldProps = Omit<TextInputProps, "defaultValue" | "editable" | "keyboardType" | "onChangeText" | "value"> &
  Pick<ControlStateProps, "disabled" | "loading" | "readOnly" | "required" | "invalid"> & {
    label: string;
    value?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (value: number) => void;
    helperText?: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
  };

export function NumberField({
  containerStyle,
  defaultValue,
  disabled = false,
  error,
  helperText,
  invalid = false,
  label,
  loading = false,
  max: maximum,
  min: minimum,
  onValueChange,
  readOnly = false,
  required = false,
  step = 1,
  style,
  value,
  ...props
}: NumberFieldProps): ReactElement {
  const theme = useAurelglyphTheme();
  const min = minimum !== undefined && Number.isFinite(minimum) ? minimum : Number.MIN_SAFE_INTEGER;
  const max = maximum !== undefined && Number.isFinite(maximum) ? maximum : Number.MAX_SAFE_INTEGER;
  const safeMax = max >= min ? max : min;
  const safeStep = normalizeStep(step);
  const stepBase = minimum !== undefined && Number.isFinite(minimum) ? minimum : 0;
  const snap = (candidate: number): number => snapValue(candidate, min, safeMax, safeStep, stepBase);
  const initial = snap(defaultValue ?? (minimum !== undefined ? min : maximum !== undefined && maximum < 0 ? maximum : 0));
  const [resolved, setResolved] = useControllableState({ defaultValue: initial, onChange: onValueChange, value });
  const current = snap(resolved);
  const [text, setText] = useState(String(current));
  useEffect(() => setText(String(current)), [current]);
  const unavailable = disabled || loading || readOnly;
  const commit = (candidate: number): void => {
    const next = snap(candidate);
    setResolved(next);
    setText(String(next));
  };
  const commitText = (): void => {
    const parsed = Number(text);
    if (Number.isFinite(parsed)) commit(parsed);
    else setText(String(current));
  };
  const isInvalid = invalid || Boolean(error);
  const previous = snap(current - safeStep);
  const next = snap(current + safeStep);
  const hasMinimum = minimum !== undefined && Number.isFinite(minimum);
  const hasMaximum = maximum !== undefined && Number.isFinite(maximum);
  const { accessibilityHint, accessibilityLabel, onBlur, ...inputProps } = props;
  return (
    <FieldChrome error={error} helperText={helperText} invalid={isInvalid} label={label} required={required} style={containerStyle}>
      <View style={styles.numberRow}>
        <Button
          accessibilityLabel={`Decrease ${label}`}
          disabled={unavailable || previous === current}
          onPress={() => commit(previous)}
          size="sm"
          variant="secondary"
        >
          <Icon name="minus" size={16} />
        </Button>
        <TextInput
          {...inputProps}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          accessibilityHint={[accessibilityHint, error ?? helperText, readOnly ? "Read only" : undefined].filter(Boolean).join(". ") || undefined}
          accessibilityLabel={[accessibilityLabel ?? label, required ? "required" : undefined, isInvalid ? "invalid" : undefined].filter(Boolean).join(", ")}
          accessibilityRole="adjustable"
          accessibilityState={{ busy: loading, disabled: unavailable }}
          accessibilityValue={{ max: hasMaximum ? safeMax : undefined, min: hasMinimum ? min : undefined, now: current, text: String(current) }}
          editable={!unavailable}
          keyboardType="decimal-pad"
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "increment") commit(next);
            if (event.nativeEvent.actionName === "decrement") commit(previous);
          }}
          onBlur={(event) => {
            commitText();
            onBlur?.(event);
          }}
          onChangeText={setText}
          selectionColor={theme.colors.accent}
          style={[
            styles.input,
            styles.numberInput,
            {
              backgroundColor: theme.colors.backgroundElevated,
              borderColor: isInvalid ? theme.colors.danger : theme.colors.borderStrong,
              borderRadius: theme.radii.sm,
              color: unavailable ? theme.colors.disabled : theme.colors.text,
              fontFamily: theme.fonts.mono
            },
            style
          ]}
          value={text}
        />
        <Button
          accessibilityLabel={`Increase ${label}`}
          disabled={unavailable || next === current}
          onPress={() => commit(next)}
          size="sm"
          variant="secondary"
        >
          <Icon name="plus" size={16} />
        </Button>
      </View>
    </FieldChrome>
  );
}

export type NativeFile = { name: string; size?: number; type?: string; uri?: string };
export type FileUploadProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading" | "required" | "invalid"> & {
    label: string;
    description?: string;
    files?: readonly NativeFile[];
    onRequestFiles: () => void;
    onRemoveFile?: (file: NativeFile, index: number) => void;
    error?: string;
  };

export function FileUpload({
  description = "Choose files from this device.",
  disabled = false,
  error,
  files = [],
  invalid = false,
  label,
  loading = false,
  onRemoveFile,
  onRequestFiles,
  required = false,
  style,
  ...props
}: FileUploadProps): ReactElement {
  const theme = useAurelglyphTheme();
  const unavailable = disabled || loading;
  return (
    <View style={[styles.field, style]} {...props}>
      <FieldChrome error={error} invalid={invalid || Boolean(error)} label={label} required={required}>
      <Pressable
        accessibilityHint={description}
        accessibilityLabel={[label, required ? "required" : undefined, invalid || error ? "invalid" : undefined].filter(Boolean).join(", ")}
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: unavailable }}
        disabled={unavailable}
        onPress={onRequestFiles}
        style={({ pressed }) => [
          styles.upload,
          {
            backgroundColor: theme.colors.backgroundElevated,
            borderColor: invalid || error ? theme.colors.danger : theme.colors.borderStrong,
            borderRadius: theme.radii.md,
            opacity: unavailable ? 0.52 : pressed ? 0.78 : 1
          }
        ]}
      >
        <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontWeight: "600" }}>{loading ? "Selecting…" : label}</Text>
        <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{description}</Text>
      </Pressable>
      {files.map((file, index) => (
        <View key={`${file.uri ?? file.name}-${index}`} style={styles.fileRow}>
          <Text numberOfLines={1} style={{ color: theme.colors.text, flex: 1, fontFamily: theme.fonts.mono, fontSize: 12 }}>{file.name}</Text>
          {onRemoveFile ? <Button accessibilityLabel={`Remove ${file.name}`} disabled={unavailable} onPress={() => onRemoveFile(file, index)} size="sm" variant="ghost">Remove</Button> : null}
        </View>
      ))}
      </FieldChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: { alignItems: "center", borderWidth: 1, height: 20, justifyContent: "center", width: 20 },
  controlCopy: { flex: 1, gap: 2 },
  controlRow: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 44 },
  field: { gap: 8 },
  fileRow: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 40 },
  input: { borderWidth: StyleSheet.hairlineWidth, fontSize: 16, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" },
  numberInput: { flex: 1, textAlign: "center" },
  numberRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  radio: { alignItems: "center", borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: "center", width: 20 },
  radioDot: { borderRadius: 5, height: 10, width: 10 },
  searchInput: { flex: 1 },
  searchRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  sliderFill: { borderRadius: 3, height: 6 },
  sliderThumb: { borderRadius: 11, borderWidth: 3, height: 22, marginLeft: -11, position: "absolute", top: -8, width: 22 },
  sliderTouchTarget: { justifyContent: "center", minHeight: 44, width: "100%" },
  sliderTrack: { borderRadius: 3, height: 6, width: "100%" },
  upload: { borderStyle: "dashed", borderWidth: 1, gap: 6, minHeight: 96, padding: 16, justifyContent: "center" }
});
