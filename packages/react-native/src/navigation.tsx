import { type ReactElement, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { clamp, useControllableState, type ControlStateProps } from "./foundation.js";
import { Button } from "./primitives.js";
import { useAurelglyphTheme } from "./theme.js";

export type TabsItem = { id: string; label: string; content: ReactNode; disabled?: boolean; badge?: string };
export type TabsProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading"> & {
    items: readonly TabsItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (id: string) => void;
    label?: string;
    tabListStyle?: StyleProp<ViewStyle>;
  };

export function Tabs({
  defaultValue,
  disabled = false,
  items,
  label = "Tabs",
  loading = false,
  onValueChange,
  style,
  tabListStyle,
  value,
  ...props
}: TabsProps): ReactElement {
  const theme = useAurelglyphTheme();
  const accentInk = theme.appearance === "quiet" && theme.mode === "dark" ? theme.colors.focus : theme.colors.accentStrong;
  const selectionIndicator = theme.appearance === "quiet" ? theme.colors.focus : theme.colors.accent;
  const firstEnabled = items.find((item) => !item.disabled)?.id ?? "";
  const [selected, setSelected] = useControllableState({ defaultValue: defaultValue ?? firstEnabled, onChange: onValueChange, value });
  const active = items.find((item) => item.id === selected && !item.disabled) ?? items.find((item) => !item.disabled);
  return (
    <View style={[{ gap: theme.space[4] }, style]} {...props}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View accessible={false} style={[styles.tabList, { borderBottomColor: theme.colors.border }, tabListStyle]}>
          {items.map((item) => {
            const isSelected = item.id === active?.id;
            const unavailable = disabled || loading || item.disabled;
            return (
              <Pressable
                accessibilityLabel={`${label}, ${item.label}`}
                accessibilityRole="tab"
                accessibilityState={{ busy: loading, disabled: disabled || loading || item.disabled, selected: isSelected }}
                disabled={unavailable}
                key={item.id}
                onPress={() => setSelected(item.id)}
                style={({ pressed }) => [
                  styles.tab,
                  {
                    borderBottomColor: isSelected ? selectionIndicator : "transparent",
                    opacity: unavailable ? 0.48 : pressed ? 0.74 : 1
                  }
                ]}
              >
                <Text style={{ color: theme.colors.text, flexShrink: 1, fontFamily: theme.fonts.ui, fontWeight: isSelected ? "600" : "400" }}>{item.label}</Text>
                {item.badge ? <Text style={{ color: accentInk, fontFamily: theme.fonts.mono, fontSize: 10 }}>{item.badge}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View accessible={false}>{active?.content}</View>
    </View>
  );
}

export type SegmentedControlItem = { value: string; label: string; disabled?: boolean };
export type SegmentedControlProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading" | "readOnly"> & {
    items: readonly SegmentedControlItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    label: string;
  };

export function SegmentedControl({
  defaultValue,
  disabled = false,
  items,
  label,
  loading = false,
  onValueChange,
  readOnly = false,
  style,
  value,
  ...props
}: SegmentedControlProps): ReactElement {
  const theme = useAurelglyphTheme();
  const selectionIndicator = theme.appearance === "quiet" ? theme.colors.focus : theme.colors.accent;
  const { fontScale } = useWindowDimensions();
  const segmentMinWidth = Math.min(192, 96 * (Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1));
  const firstEnabled = items.find((item) => !item.disabled)?.value ?? "";
  const [selected, setSelected] = useControllableState({ defaultValue: defaultValue ?? firstEnabled, onChange: onValueChange, value });
  const active = items.some((item) => item.value === selected && !item.disabled) ? selected : firstEnabled;
  return (
    <View
      accessible={false}
      style={[styles.segmented, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.borderStrong, borderRadius: theme.radii.sm }, style]}
      {...props}
    >
      {items.map((item) => {
        const checked = item.value === active;
        const unavailable = disabled || loading || readOnly || item.disabled;
        return (
          <Pressable
            accessibilityLabel={[item.label, label, readOnly ? "read only" : undefined].filter(Boolean).join(", ")}
            accessibilityRole="radio"
            accessibilityState={{ busy: loading, checked, disabled: unavailable }}
            disabled={unavailable}
            key={item.value}
            onPress={() => setSelected(item.value)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: checked ? theme.colors.surface : "transparent",
                borderColor: checked ? selectionIndicator : "transparent",
                borderRadius: theme.radii.xs,
                flexBasis: segmentMinWidth,
                opacity: unavailable ? 0.48 : pressed ? 0.76 : 1
              }
            ]}
          >
            <Text style={{ color: theme.colors.text, flexShrink: 1, fontFamily: theme.fonts.ui, fontSize: 13, fontWeight: checked ? "600" : "400", textAlign: "center" }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type PaginationProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading"> & {
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    label?: string;
  };

export function Pagination({
  disabled = false,
  label = "Pagination",
  loading = false,
  onPageChange,
  page,
  pageCount,
  siblingCount = 1,
  style,
  ...props
}: PaginationProps): ReactElement {
  const theme = useAurelglyphTheme();
  const selectionIndicator = theme.appearance === "quiet" ? theme.colors.focus : theme.colors.accentStrong;
  const count = Number.isFinite(pageCount) && pageCount >= 1 ? Math.floor(pageCount) : 1;
  const current = Number.isFinite(page) ? Math.floor(clamp(page, 1, count)) : 1;
  const siblings = Number.isFinite(siblingCount) && siblingCount >= 0 ? Math.floor(siblingCount) : 1;
  const start = Math.max(1, current - siblings);
  const end = Math.min(count, current + siblings);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const unavailable = disabled || loading;
  return (
    <View accessible={false} style={[styles.pagination, style]} {...props}>
      <Button accessibilityLabel={`${label}, previous page`} disabled={unavailable || current === 1} onPress={() => onPageChange(current - 1)} size="sm" variant="secondary">Previous</Button>
      {start > 1 ? <Text accessible={false} style={{ color: theme.colors.muted }}>…</Text> : null}
      {pages.map((item) => (
        <Pressable
          accessibilityLabel={`${label}, page ${item}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: unavailable, selected: item === current }}
          disabled={unavailable}
          key={item}
          onPress={() => onPageChange(item)}
          style={({ pressed }) => [
            styles.page,
            {
              backgroundColor: item === current ? theme.colors.accent : theme.colors.surfaceMuted,
              borderColor: item === current ? selectionIndicator : theme.colors.borderStrong,
              borderRadius: theme.radii.xs,
              opacity: unavailable ? 0.48 : pressed ? 0.76 : 1
            }
          ]}
        >
          <Text style={{ color: item === current ? theme.colors.accentForeground : theme.colors.text, fontFamily: theme.fonts.mono, fontSize: 12 }}>{item}</Text>
        </Pressable>
      ))}
      {end < count ? <Text accessible={false} style={{ color: theme.colors.muted }}>…</Text> : null}
      <Button accessibilityLabel={`${label}, next page`} disabled={unavailable || current === count} onPress={() => onPageChange(current + 1)} size="sm" variant="secondary">Next</Button>
    </View>
  );
}

export type TabBarItem = { id: string; label: string; icon?: ReactNode; badge?: string; disabled?: boolean };
export type TabBarProps = Omit<ViewProps, "children"> &
  Pick<ControlStateProps, "disabled" | "loading"> & {
    items: readonly TabBarItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (id: string) => void;
    label?: string;
  };

export function TabBar({
  defaultValue,
  disabled = false,
  items,
  label = "Primary navigation",
  loading = false,
  onValueChange,
  style,
  value,
  ...props
}: TabBarProps): ReactElement {
  const theme = useAurelglyphTheme();
  const accentInk = theme.appearance === "quiet" && theme.mode === "dark" ? theme.colors.focus : theme.colors.accentStrong;
  const selectionIndicator = theme.appearance === "quiet" ? theme.colors.focus : theme.colors.accent;
  const { fontScale } = useWindowDimensions();
  const tabItemMinWidth = Math.min(144, 64 * (Number.isFinite(fontScale) ? Math.max(1, fontScale) : 1));
  const firstEnabled = items.find((item) => !item.disabled)?.id ?? "";
  const [selected, setSelected] = useControllableState({ defaultValue: defaultValue ?? firstEnabled, onChange: onValueChange, value });
  const active = items.some((item) => item.id === selected && !item.disabled) ? selected : firstEnabled;
  return (
    <View accessible={false} style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong }, style]} {...props}>
      <ScrollView
        accessible={false}
        contentContainerStyle={styles.tabBarList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {items.map((item) => {
          const isSelected = item.id === active;
          const unavailable = disabled || loading || item.disabled;
          return (
            <Pressable
              accessibilityLabel={`${label}, ${item.label}`}
              accessibilityRole="tab"
              accessibilityState={{ busy: loading, disabled: unavailable, selected: isSelected }}
              disabled={unavailable}
              key={item.id}
              onPress={() => setSelected(item.id)}
              style={({ pressed }) => [styles.tabBarItem, { flexBasis: tabItemMinWidth, minWidth: tabItemMinWidth, opacity: unavailable ? 0.48 : pressed ? 0.74 : 1 }]}
            >
              {item.icon}
              <Text style={{ color: theme.colors.text, flexShrink: 1, fontFamily: theme.fonts.ui, fontSize: 12, fontWeight: isSelected ? "600" : "400", textAlign: "center" }}>{item.label}</Text>
              {item.badge ? <Text style={{ color: accentInk, flexShrink: 1, fontFamily: theme.fonts.mono, fontSize: 9, textAlign: "center" }}>{item.badge}</Text> : null}
              <View accessible={false} style={[styles.tabBarIndicator, { backgroundColor: isSelected ? selectionIndicator : "transparent" }]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: "center", borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", minHeight: 44, minWidth: 44, paddingHorizontal: 8 },
  pagination: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  segment: { alignItems: "center", borderWidth: StyleSheet.hairlineWidth, flexBasis: 96, flexGrow: 1, flexShrink: 1, justifyContent: "center", minHeight: 44, minWidth: 44, paddingHorizontal: 10, paddingVertical: 7 },
  segmented: { borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", gap: 2, padding: 3 },
  tab: { alignItems: "center", borderBottomWidth: 2, flexDirection: "row", gap: 6, minHeight: 44, paddingHorizontal: 14, paddingVertical: 10 },
  tabBar: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  tabBarIndicator: { borderRadius: 1, bottom: 0, height: 2, left: 12, position: "absolute", right: 12 },
  tabBarItem: { alignItems: "center", flexBasis: 64, flexGrow: 1, flexShrink: 0, gap: 3, justifyContent: "center", minHeight: 56, minWidth: 64, paddingHorizontal: 8, paddingVertical: 7, position: "relative" },
  tabBarList: { flexDirection: "row", flexGrow: 1 },
  tabList: { borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row" }
});
