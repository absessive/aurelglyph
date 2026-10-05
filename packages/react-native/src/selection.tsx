import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputInstance, type ViewProps } from "react-native";

import { useAurelglyphControlCopy } from "./control-copy.js";
import { labelForValue, useControllableState, type ControlStateProps } from "./foundation.js";
import { Icon } from "./icons.js";
import { Dialog, type OverlayOpenChangeDetails } from "./overlays.js";
import { useAurelglyphTheme } from "./theme.js";

export type MenuPlacement = "top" | "bottom" | "center";
export type MenuItem = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect?: () => void;
};
export type MenuProps = {
  open: boolean;
  onOpenChange: (open: boolean, details: OverlayOpenChangeDetails) => void;
  items: readonly MenuItem[];
  title?: string;
  accessibilityLabel: string;
  selectedValue?: string;
  onSelect?: (value: string) => void;
  placement?: MenuPlacement;
  closeOnSelect?: boolean;
  emptyMessage?: string;
};

export function Menu({
  accessibilityLabel,
  closeOnSelect = true,
  emptyMessage,
  items,
  onOpenChange,
  onSelect,
  open,
  placement = "center",
  selectedValue,
  title
}: MenuProps): ReactElement {
  const theme = useAurelglyphTheme();
  const controlCopy = useAurelglyphControlCopy();
  const resolvedTitle = title ?? controlCopy.actions;
  const resolvedEmptyMessage = emptyMessage ?? controlCopy.noActions;
  return (
    <Dialog
      onOpenChange={onOpenChange}
      open={open}
      panelStyle={[
        { maxHeight: "72%", maxWidth: 440 },
        placement === "top" ? { marginBottom: "auto", marginTop: 56 } : placement === "bottom" ? { marginBottom: 40, marginTop: "auto" } : undefined
      ]}
      scrollable={false}
      title={resolvedTitle}
      variant="compact"
    >
      <ScrollView accessible={false} bounces={false} style={styles.selectionList}>
        <View style={{ gap: theme.space[1] }}>
          {items.length === 0 ? (
            <Text accessibilityLiveRegion="polite" role="status" style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, padding: 12 }}>{resolvedEmptyMessage}</Text>
          ) : (
            items.map((item) => {
              const selected = item.value === selectedValue;
              return (
                <Pressable
                  accessibilityHint={item.description}
                  accessibilityLabel={`${accessibilityLabel}, ${item.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: item.disabled, selected }}
                  disabled={item.disabled}
                  key={item.value}
                  onPress={() => {
                    item.onSelect?.();
                    onSelect?.(item.value);
                    if (closeOnSelect) onOpenChange(false, { reason: "close" });
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected ? theme.colors.accentMuted : pressed ? theme.colors.surfaceMuted : "transparent",
                      borderColor: selected ? theme.colors.accent : "transparent",
                      borderRadius: theme.radii.sm,
                      opacity: item.disabled ? 0.48 : 1
                    }
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Text style={{ color: item.danger ? theme.colors.danger : theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 15 }}>{item.label}</Text>
                    {item.description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{item.description}</Text> : null}
                  </View>
                  {selected ? <View accessible={false} style={[styles.signalDot, { backgroundColor: theme.colors.accent }]} /> : null}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </Dialog>
  );
}

export const Dropdown = Menu;
export type DropdownProps = MenuProps;

export type ComboboxOption = { value: string; label: string; description?: string; disabled?: boolean; keywords?: readonly string[] };
export type ComboboxProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading" | "readOnly" | "required" | "invalid"> & {
    autoFocusSearch?: boolean;
    label: string;
    options: readonly ComboboxOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    helperText?: string;
    error?: string;
  };

export function Combobox({
  autoFocusSearch = true,
  defaultValue = "",
  disabled = false,
  emptyMessage,
  error,
  helperText,
  invalid = false,
  label,
  loading = false,
  onValueChange,
  options,
  placeholder,
  readOnly = false,
  required = false,
  searchPlaceholder,
  style,
  value,
  ...props
}: ComboboxProps): ReactElement {
  const theme = useAurelglyphTheme();
  const controlCopy = useAurelglyphControlCopy();
  const resolvedEmptyMessage = emptyMessage ?? controlCopy.noOptions;
  const resolvedPlaceholder = placeholder ?? controlCopy.selectPlaceholder;
  const resolvedSearchPlaceholder = searchPlaceholder ?? controlCopy.searchOptions;
  const [selected, setSelected] = useControllableState({ defaultValue, onChange: onValueChange, value });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<TextInputInstance>(null);
  const focusSearchAfterPresentation = useCallback((): void => {
    if (autoFocusSearch) searchInputRef.current?.focus();
  }, [autoFocusSearch]);
  const displayedValue = selected
    ? labelForValue(options, selected)
    : loading
      ? controlCopy.loadingSelection
      : resolvedPlaceholder;
  const unavailable = disabled || loading || readOnly;
  const isInvalid = invalid || Boolean(error);
  useEffect(() => {
    if (!unavailable || !open) return;
    setOpen(false);
    setQuery("");
  }, [open, unavailable]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return options;
    return options.filter((option) => [option.label, option.value, ...(option.keywords ?? [])].some((part) => part.toLocaleLowerCase().includes(needle)));
  }, [options, query]);
  return (
    <View style={[{ gap: theme.space[2] }, style]} {...props}>
      <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>
        {label}{required ? " *" : ""}
      </Text>
      <Pressable
        accessibilityHint={controlCopy.selectHint}
        accessibilityLabel={[label, required ? controlCopy.required : undefined, isInvalid ? controlCopy.invalid : undefined, readOnly ? controlCopy.readOnly : undefined].filter(Boolean).join(", ")}
        accessibilityRole="combobox"
        accessibilityState={{ busy: loading, disabled: unavailable, expanded: open && !unavailable }}
        accessibilityValue={{ text: displayedValue }}
        disabled={unavailable}
        onPress={() => {
          if (!unavailable) setOpen(true);
        }}
        style={({ pressed }) => [
          styles.comboboxTrigger,
          {
            backgroundColor: theme.colors.backgroundElevated,
            borderColor: isInvalid ? theme.colors.danger : theme.colors.borderStrong,
            borderRadius: theme.radii.sm,
            opacity: unavailable ? 0.52 : pressed ? 0.78 : 1
          }
        ]}
      >
        <Text style={{ color: selected ? theme.colors.text : theme.colors.muted, flex: 1, flexShrink: 1, fontFamily: theme.fonts.ui, minWidth: 0 }}>
          {displayedValue}
        </Text>
        <Icon color={theme.colors.muted} name="chevron-down" size={16} />
      </Pressable>
      {error || helperText ? <Text accessibilityLiveRegion={error ? "polite" : "none"} style={{ color: error ? theme.colors.danger : theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{error ?? helperText}</Text> : null}
      <Dialog
        onShow={focusSearchAfterPresentation}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
        open={open && !unavailable}
        panelStyle={{ maxHeight: "82%" }}
        scrollable={false}
        title={label}
        variant="compact"
      >
        <TextInput
          accessibilityLabel={resolvedSearchPlaceholder}
          autoFocus={autoFocusSearch}
          onChangeText={setQuery}
          placeholder={resolvedSearchPlaceholder}
          placeholderTextColor={theme.colors.subtle}
          selectionColor={theme.colors.accent}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radii.sm,
              color: theme.colors.text,
              fontFamily: theme.fonts.ui
            }
          ]}
          ref={searchInputRef}
          value={query}
        />
        <ScrollView bounces={false} keyboardShouldPersistTaps="always" style={styles.selectionList}>
          <View accessible={false} style={{ gap: theme.space[1] }}>
            {results.length === 0 ? (
              <Text accessibilityLiveRegion="polite" role="status" style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, padding: 12 }}>{resolvedEmptyMessage}</Text>
            ) : (
              results.map((option) => {
                const active = option.value === selected;
                return (
                  <Pressable
                    accessibilityHint={option.description}
                    accessibilityLabel={`${label}, ${option.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: option.disabled, selected: active }}
                    disabled={option.disabled}
                    key={option.value}
                    onPress={() => {
                      setSelected(option.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: active ? theme.colors.accentMuted : pressed ? theme.colors.surfaceMuted : "transparent",
                        borderColor: active ? theme.colors.accent : "transparent",
                        borderRadius: theme.radii.sm,
                        opacity: option.disabled ? 0.48 : 1
                      }
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui }}>{option.label}</Text>
                      {option.description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{option.description}</Text> : null}
                    </View>
                    {active ? <View accessible={false} style={[styles.signalDot, { backgroundColor: theme.colors.accent }]} /> : null}
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      </Dialog>
    </View>
  );
}

export const Autocomplete = Combobox;
export type AutocompleteProps = ComboboxProps;

export type SelectOption = ComboboxOption;
export type SelectProps = Omit<ComboboxProps, "emptyMessage">;

export function Select({ autoFocusSearch = false, searchPlaceholder, ...props }: SelectProps): ReactElement {
  const controlCopy = useAurelglyphControlCopy();
  return <Combobox autoFocusSearch={autoFocusSearch} searchPlaceholder={searchPlaceholder ?? controlCopy.filterOptions} {...props} />;
}

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
  onSelect: () => void;
};
export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean, details: OverlayOpenChangeDetails) => void;
  items: readonly CommandPaletteItem[];
  title?: string;
  placeholder?: string;
  emptyMessage?: string;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
};

export function CommandPalette({
  defaultQuery = "",
  emptyMessage,
  items,
  onOpenChange,
  onQueryChange,
  open,
  placeholder,
  query: controlledQuery,
  title
}: CommandPaletteProps): ReactElement {
  const theme = useAurelglyphTheme();
  const controlCopy = useAurelglyphControlCopy();
  const resolvedEmptyMessage = emptyMessage ?? controlCopy.noCommands;
  const resolvedPlaceholder = placeholder ?? controlCopy.searchCommands;
  const resolvedTitle = title ?? controlCopy.commandPalette;
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const searchInputRef = useRef<TextInputInstance>(null);
  const query = controlledQuery ?? internalQuery;
  const wasOpen = useRef(open);
  const setQuery = useCallback((next: string): void => {
    if (controlledQuery === undefined) setInternalQuery(next);
    onQueryChange?.(next);
  }, [controlledQuery, onQueryChange]);
  useEffect(() => {
    if (controlledQuery !== undefined) setInternalQuery(controlledQuery);
  }, [controlledQuery]);
  useEffect(() => {
    if (wasOpen.current && !open) setQuery("");
    wasOpen.current = open;
  }, [open, setQuery]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return items;
    return items.filter((item) => [item.label, item.description ?? "", ...(item.keywords ?? [])].some((part) => part.toLocaleLowerCase().includes(needle)));
  }, [items, query]);
  const focusSearchAfterPresentation = useCallback((): void => {
    searchInputRef.current?.focus();
  }, []);
  return (
    <Dialog
      onShow={focusSearchAfterPresentation}
      onOpenChange={(next, details) => {
        if (!next && details.reason === "back" && query) {
          setQuery("");
          return;
        }
        if (!next) setQuery("");
        onOpenChange(next, details);
      }}
      open={open}
      panelStyle={{ maxHeight: "82%", maxWidth: 680 }}
      scrollable={false}
      title={resolvedTitle}
      variant="wide"
    >
      <TextInput
        accessibilityLabel={resolvedPlaceholder}
        autoFocus
        onChangeText={setQuery}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={theme.colors.subtle}
        selectionColor={theme.colors.accent}
        style={[
          styles.searchInput,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong, borderRadius: theme.radii.sm, color: theme.colors.text, fontFamily: theme.fonts.ui }
        ]}
        ref={searchInputRef}
        value={query}
      />
      <ScrollView bounces={false} keyboardShouldPersistTaps="always" style={styles.selectionList}>
        <View accessible={false} style={{ gap: theme.space[1] }}>
          {results.length === 0 ? <Text accessibilityLiveRegion="polite" role="status" style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, padding: 12 }}>{resolvedEmptyMessage}</Text> : null}
          {results.map((item) => (
            <Pressable
              accessibilityHint={item.description}
              accessibilityLabel={`${resolvedTitle}, ${item.label}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: item.disabled }}
              disabled={item.disabled}
              key={item.id}
              onPress={() => {
                item.onSelect();
                setQuery("");
                onOpenChange(false, { reason: "close" });
              }}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: pressed ? theme.colors.surfaceMuted : "transparent", borderColor: "transparent", borderRadius: theme.radii.sm, opacity: item.disabled ? 0.48 : 1 }
              ]}
            >
              <View style={styles.optionCopy}>
                <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui }}>{item.label}</Text>
                {item.description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{item.description}</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  comboboxTrigger: { alignItems: "center", borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10 },
  option: { alignItems: "center", borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12, minHeight: 48, paddingHorizontal: 12, paddingVertical: 9 },
  optionCopy: { flex: 1, gap: 2, minWidth: 0 },
  searchInput: { borderWidth: StyleSheet.hairlineWidth, fontSize: 16, minHeight: 46, paddingHorizontal: 12, paddingVertical: 10 },
  selectionList: { flexShrink: 1, minHeight: 0 },
  signalDot: { borderRadius: 4, height: 8, width: 8 }
});
