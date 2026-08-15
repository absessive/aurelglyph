import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewProps } from "react-native";

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
  emptyMessage = "No actions available.",
  items,
  onOpenChange,
  onSelect,
  open,
  placement = "center",
  selectedValue,
  title = "Actions"
}: MenuProps): ReactElement {
  const theme = useAurelglyphTheme();
  return (
    <Dialog
      onOpenChange={onOpenChange}
      open={open}
      panelStyle={[
        { maxHeight: "72%", maxWidth: 440 },
        placement === "top" ? { marginBottom: "auto", marginTop: 56 } : placement === "bottom" ? { marginBottom: 40, marginTop: "auto" } : undefined
      ]}
      scrollable={false}
      title={title}
      variant="compact"
    >
      <ScrollView accessible={false} bounces={false} style={styles.selectionList}>
        <View style={{ gap: theme.space[1] }}>
          {items.length === 0 ? (
            <Text accessibilityLiveRegion="polite" role="status" style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, padding: 12 }}>{emptyMessage}</Text>
          ) : (
            items.map((item) => {
              const selected = item.value === selectedValue;
              return (
                <Pressable
                  accessibilityHint={item.description}
                  accessibilityLabel={`${accessibilityLabel}, ${item.label}`}
                  accessibilityRole="menuitem"
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
  defaultValue = "",
  disabled = false,
  emptyMessage = "No matching options.",
  error,
  helperText,
  invalid = false,
  label,
  loading = false,
  onValueChange,
  options,
  placeholder = "Select an option",
  readOnly = false,
  required = false,
  searchPlaceholder = "Search options",
  style,
  value,
  ...props
}: ComboboxProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [selected, setSelected] = useControllableState({ defaultValue, onChange: onValueChange, value });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
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
        accessibilityHint="Opens a searchable option list"
        accessibilityLabel={[label, required ? "required" : undefined, isInvalid ? "invalid" : undefined, readOnly ? "read only" : undefined].filter(Boolean).join(", ")}
        accessibilityRole="combobox"
        accessibilityState={{ busy: loading, disabled: unavailable, expanded: open && !unavailable }}
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
          {selected ? labelForValue(options, selected) : loading ? "Loading…" : placeholder}
        </Text>
        <Icon color={theme.colors.muted} name="chevron-down" size={16} />
      </Pressable>
      {error || helperText ? <Text accessibilityLiveRegion={error ? "polite" : "none"} style={{ color: error ? theme.colors.danger : theme.colors.muted, fontFamily: theme.fonts.ui, fontSize: 12 }}>{error ?? helperText}</Text> : null}
      <Dialog
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
          accessibilityLabel={searchPlaceholder}
          autoFocus
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
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
          value={query}
        />
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" style={styles.selectionList}>
          <View accessible={false} style={{ gap: theme.space[1] }}>
            {results.length === 0 ? (
              <Text accessibilityLiveRegion="polite" role="status" style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, padding: 12 }}>{emptyMessage}</Text>
            ) : (
              results.map((option) => {
                const active = option.value === selected;
                return (
                  <Pressable
                    accessibilityHint={option.description}
                    accessibilityLabel={`${label}, ${option.label}`}
                    role="option"
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
export type SelectProps = Omit<ComboboxProps, "emptyMessage" | "searchPlaceholder">;

export function Select(props: SelectProps): ReactElement {
  return <Combobox searchPlaceholder="Filter options" {...props} />;
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
  emptyMessage = "No matching commands.",
  items,
  onOpenChange,
  onQueryChange,
  open,
  placeholder = "Search commands",
  query: controlledQuery,
  title = "Command palette"
}: CommandPaletteProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
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
  return (
    <Dialog
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
      title={title}
      variant="wide"
    >
      <TextInput
        accessibilityLabel={placeholder}
        autoFocus
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.subtle}
        selectionColor={theme.colors.accent}
        style={[
          styles.searchInput,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong, borderRadius: theme.radii.sm, color: theme.colors.text, fontFamily: theme.fonts.ui }
        ]}
        value={query}
      />
      <ScrollView bounces={false} keyboardShouldPersistTaps="handled" style={styles.selectionList}>
        <View accessible={false} style={{ gap: theme.space[1] }}>
          {results.length === 0 ? <Text accessibilityLiveRegion="polite" role="status" style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, padding: 12 }}>{emptyMessage}</Text> : null}
          {results.map((item) => (
            <Pressable
              accessibilityHint={item.description}
              accessibilityLabel={`${title}, ${item.label}`}
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
