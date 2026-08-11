import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactElement,
  type ReactNode
} from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle
} from "react-native";

import type { ControlStateProps } from "./foundation.js";
import { resolveResponsiveColumns } from "./foundation.js";
import { useAurelglyphTheme } from "./theme.js";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
const ButtonGroupVisualContext = createContext<"horizontal" | "vertical" | null>(null);
const buttonPaintKeys = [
  "backgroundColor",
  "borderBlockColor",
  "borderBlockEndColor",
  "borderBlockStartColor",
  "borderBottomColor",
  "borderBottomEndRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderBottomStartRadius",
  "borderBottomWidth",
  "borderColor",
  "borderCurve",
  "borderEndColor",
  "borderEndEndRadius",
  "borderEndStartRadius",
  "borderEndWidth",
  "borderLeftColor",
  "borderLeftWidth",
  "borderRadius",
  "borderRightColor",
  "borderRightWidth",
  "borderStartColor",
  "borderStartEndRadius",
  "borderStartStartRadius",
  "borderStartWidth",
  "borderStyle",
  "borderTopColor",
  "borderTopEndRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderTopStartRadius",
  "borderTopWidth",
  "borderWidth",
  "boxShadow",
  "experimental_backgroundImage",
  "experimental_backgroundPosition",
  "experimental_backgroundRepeat",
  "experimental_backgroundSize",
  "outlineColor",
  "outlineOffset",
  "outlineStyle",
  "outlineWidth",
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius"
] as const satisfies ReadonlyArray<keyof ViewStyle>;

function splitButtonStyle(style: StyleProp<ViewStyle>): { layout: ViewStyle | undefined; paint: ViewStyle | undefined } {
  const flattened = StyleSheet.flatten(style);
  if (!flattened) return { layout: undefined, paint: undefined };
  const layout = { ...flattened } as Record<string, unknown>;
  const paint: Record<string, unknown> = {};
  for (const key of buttonPaintKeys) {
    if (layout[key] !== undefined) paint[key] = layout[key];
    delete layout[key];
  }
  return { layout: layout as ViewStyle, paint: paint as ViewStyle };
}

export type ButtonProps = Omit<PressableProps, "children" | "disabled" | "style"> &
  Pick<ControlStateProps, "busy" | "disabled" | "loading"> & {
    children: ReactNode;
    icon?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
  };

export function Button({
  accessibilityLabel,
  busy = false,
  children,
  disabled = false,
  hitSlop,
  icon,
  loading = false,
  size = "md",
  style,
  textStyle,
  variant = "primary",
  ...props
}: ButtonProps): ReactElement {
  const theme = useAurelglyphTheme();
  const attachedOrientation = useContext(ButtonGroupVisualContext);
  const unavailable = disabled || loading;
  const palette = buttonPalette(variant, theme.colors);
  const height = size === "sm" ? 36 : size === "lg" ? 52 : 44;
  const visualInset = size === "sm" ? 4 : 0;
  const visualInsetX = attachedOrientation === "horizontal" ? 0 : visualInset;
  const visualInsetY = attachedOrientation === "vertical" ? 0 : visualInset;
  const targetSize = Math.max(44, height);
  const consumerStyle = splitButtonStyle(style);
  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: busy || loading, disabled: unavailable }}
      disabled={unavailable}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: "transparent",
          borderRadius: theme.radii.sm,
          opacity: unavailable ? 0.52 : pressed ? 0.82 : 1,
          paddingHorizontal: (size === "sm" ? theme.space[3] : theme.space[4]) + visualInsetX,
          paddingVertical: visualInsetY
        },
        consumerStyle.layout,
        { minHeight: targetSize, minWidth: targetSize }
      ]}
    >
      <View
        accessible={false}
        pointerEvents="none"
        style={[
          styles.buttonBackdrop,
          {
            backgroundColor: palette.background,
            borderColor: palette.border,
            borderRadius: theme.radii.sm,
            bottom: visualInsetY,
            left: visualInsetX,
            right: visualInsetX,
            top: visualInsetY
          },
          consumerStyle.paint
        ]}
      />
      {loading ? <ActivityIndicator color={palette.text} size="small" /> : icon}
      {typeof children === "string" || typeof children === "number" ? (
        <Text
          style={[
            styles.buttonText,
            { color: palette.text, fontFamily: theme.fonts.ui, fontSize: size === "sm" ? 13 : 15 },
            textStyle
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

function buttonPalette(variant: ButtonVariant, colors: ReturnType<typeof useAurelglyphTheme>["colors"]): {
  background: string;
  border: string;
  text: string;
} {
  if (variant === "primary") return { background: colors.accent, border: colors.accentStrong, text: colors.accentForeground };
  if (variant === "danger") return { background: colors.dangerControl, border: colors.danger, text: colors.dangerForeground };
  if (variant === "ghost") return { background: "transparent", border: "transparent", text: colors.text };
  return { background: colors.surfaceMuted, border: colors.borderStrong, text: colors.text };
}

export type IconButtonProps = Omit<ButtonProps, "accessibilityLabel" | "children" | "icon" | "textStyle"> & {
  label: string;
  icon: ReactNode;
};

export function IconButton({ icon, label, loading = false, size = "md", style, ...props }: IconButtonProps): ReactElement {
  const dimension = size === "sm" ? 36 : size === "lg" ? 52 : 44;
  return (
    <Button
      accessibilityLabel={label}
      loading={loading}
      size={size}
      style={[{ width: dimension, paddingHorizontal: 0 }, style]}
      {...props}
    >
      {loading ? null : icon}
    </Button>
  );
}

export type ButtonGroupProps = ViewProps & {
  children: ReactNode;
  label: string;
  attached?: boolean;
  orientation?: "horizontal" | "vertical";
  wrap?: boolean;
};

export function ButtonGroup({ attached = false, children, label, orientation = "horizontal", style, wrap = !attached, ...props }: ButtonGroupProps): ReactElement {
  const theme = useAurelglyphTheme();
  const horizontal = orientation === "horizontal";
  const items = Children.map(children, (child, index) => {
    if (!isValidElement<ButtonProps>(child)) return child;
    return cloneElement(child, {
      accessibilityHint: [label, child.props.accessibilityHint].filter(Boolean).join(". "),
      style: [
        horizontal ? styles.buttonGroupItem : undefined,
        child.props.style,
        attached && index > 0 ? horizontal ? { marginLeft: -1 } : { marginTop: -1 } : undefined
      ]
    });
  });
  return (
    <ButtonGroupVisualContext.Provider value={attached ? orientation : null}>
      <View
        accessible={false}
        style={[
          styles.buttonGroup,
          { flexDirection: horizontal ? "row" : "column", flexWrap: horizontal && wrap ? "wrap" : "nowrap", gap: attached ? 0 : theme.space[2] },
          style
        ]}
        {...props}
      >
        {items}
      </View>
    </ButtonGroupVisualContext.Provider>
  );
}

export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerProps = {
  label?: string;
  size?: SpinnerSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function Spinner({ color, label = "Loading", size = "md", style }: SpinnerProps): ReactElement {
  const theme = useAurelglyphTheme();
  const nativeSize = size === "sm" ? 16 : size === "lg" ? 32 : 24;
  return (
    <View
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={[styles.spinner, style]}
    >
      <ActivityIndicator color={color ?? theme.colors.accent} size={nativeSize} />
    </View>
  );
}

export type DividerProps = ViewProps & { orientation?: "horizontal" | "vertical"; inset?: number; decorative?: boolean };

export function Divider({ decorative = false, inset = 0, orientation = "horizontal", style, ...props }: DividerProps): ReactElement {
  const theme = useAurelglyphTheme();
  return (
    <View
      accessible={!decorative}
      role={decorative ? undefined : "separator"}
      style={[
        orientation === "horizontal"
          ? { height: StyleSheet.hairlineWidth, marginHorizontal: inset, width: "auto" }
          : { alignSelf: "stretch", marginVertical: inset, width: StyleSheet.hairlineWidth },
        { backgroundColor: theme.colors.borderStrong },
        style
      ]}
      {...props}
    />
  );
}

export type SurfaceElevation = "flat" | "raised" | "floating";
export type SurfacePadding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
export type SurfaceProps = ViewProps & {
  children?: ReactNode;
  elevation?: SurfaceElevation;
  padding?: SurfacePadding;
};

export function Surface({ children, elevation = "flat", padding = 4, style, ...props }: SurfaceProps): ReactElement {
  const theme = useAurelglyphTheme();
  return (
    <View
      style={[
        {
          backgroundColor: elevation === "flat" ? theme.colors.surface : theme.colors.backgroundElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          borderWidth: StyleSheet.hairlineWidth,
          padding: theme.space[padding],
          shadowColor: theme.colors.shadow,
          shadowOffset: { height: elevation === "floating" ? 12 : 6, width: 0 },
          shadowOpacity: elevation === "flat" ? 0 : elevation === "floating" ? 0.38 : 0.22,
          shadowRadius: elevation === "floating" ? 24 : 12,
          elevation: elevation === "flat" ? 0 : elevation === "floating" ? 12 : 4
        },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export const Box = Surface;
export type BoxProps = SurfaceProps;

export type StackProps = ViewProps & {
  children?: ReactNode;
  direction?: "row" | "column";
  gap?: SurfacePadding;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  wrap?: boolean;
};

export function Stack({
  align,
  children,
  direction = "column",
  gap = 3,
  justify,
  style,
  wrap = false,
  ...props
}: StackProps): ReactElement {
  const theme = useAurelglyphTheme();
  return (
    <View
      style={[
        { alignItems: align, flexDirection: direction, flexWrap: wrap ? "wrap" : "nowrap", gap: theme.space[gap], justifyContent: justify },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";
export type ContainerProps = ViewProps & { children?: ReactNode; size?: ContainerSize; gutters?: boolean };

export function Container({ children, gutters = true, size = "lg", style, ...props }: ContainerProps): ReactElement {
  const theme = useAurelglyphTheme();
  const maxWidth = size === "sm" ? 560 : size === "md" ? 760 : size === "lg" ? 1120 : size === "xl" ? 1320 : undefined;
  return (
    <View
      style={[{ alignSelf: "center", maxWidth, paddingHorizontal: gutters ? theme.space[4] : 0, width: "100%" }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

export type GridResponsiveColumns = { base: number; sm?: number; md?: number; lg?: number };
export type GridProps = ViewProps & {
  children?: ReactNode;
  columns?: number | GridResponsiveColumns;
  gap?: SurfacePadding;
  minItemWidth?: number;
};

export function Grid({ children, columns = 1, gap = 4, minItemWidth, onLayout, style, ...props }: GridProps): ReactElement {
  const theme = useAurelglyphTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const spacing = theme.space[gap];
  const availableWidth = containerWidth ?? windowWidth;
  const responsiveCount = resolveResponsiveColumns(columns, availableWidth);
  const safeMinItemWidth = minItemWidth !== undefined && Number.isFinite(minItemWidth) && minItemWidth > 0 ? minItemWidth : undefined;
  const widthLimitedCount = safeMinItemWidth
    ? Math.max(1, Math.floor((availableWidth + spacing) / (safeMinItemWidth + spacing)))
    : responsiveCount;
  const count = Math.min(responsiveCount, widthLimitedCount);
  const handleLayout = (event: LayoutChangeEvent): void => {
    const nextWidth = event.nativeEvent.layout.width;
    if (Number.isFinite(nextWidth) && nextWidth > 0) {
      setContainerWidth((current) => current === nextWidth ? current : nextWidth);
    }
    onLayout?.(event);
  };
  return (
    <View
      {...props}
      onLayout={handleLayout}
      style={[{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing / 2, rowGap: spacing }, style]}
    >
      {Children.map(children, (child) => (
        <View style={{ flexBasis: `${100 / count}%`, maxWidth: `${100 / count}%`, paddingHorizontal: spacing / 2 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

export type ProgressProps = ViewProps & {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
};

export function Progress({ label = "Progress", max = 100, min = 0, showValue = false, style, value, ...props }: ProgressProps): ReactElement {
  const theme = useAurelglyphTheme();
  const indeterminate = value === undefined;
  const safeMin = Number.isFinite(min) ? min : 0;
  const finiteMax = Number.isFinite(max) ? max : safeMin + 100;
  const safeMax = finiteMax > safeMin ? finiteMax : safeMin + 1;
  const current = indeterminate ? undefined : Math.min(Math.max(Number.isFinite(value) ? value : safeMin, safeMin), safeMax);
  const percent = current === undefined ? 0 : ((current - safeMin) / (safeMax - safeMin)) * 100;
  return (
    <View style={[{ gap: theme.space[2] }, style]} {...props}>
      {showValue ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.mono, fontSize: 12 }}>{Math.round(percent)}%</Text> : null}
      <View
        accessibilityLabel={label}
        accessibilityRole="progressbar"
        accessibilityState={{ busy: indeterminate }}
        accessibilityValue={current === undefined ? undefined : { min: safeMin, max: safeMax, now: current, text: `${Math.round(percent)}%` }}
        style={{ backgroundColor: theme.colors.surfaceStrong, borderRadius: theme.radii.pill, height: 6, overflow: "hidden" }}
      >
        {indeterminate ? (
          <View style={{ backgroundColor: theme.colors.accent, height: 6, opacity: 0.62, width: "45%" }} />
        ) : (
          <View style={{ backgroundColor: theme.colors.accent, height: 6, width: `${percent}%` }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 8,
    justifyContent: "center",
    maxWidth: "100%",
    minWidth: 0,
    position: "relative"
  },
  buttonBackdrop: { borderWidth: StyleSheet.hairlineWidth, position: "absolute" },
  buttonText: { flexShrink: 1, fontWeight: "600", letterSpacing: 0.25, minWidth: 0, textAlign: "center" },
  buttonGroup: { alignItems: "center", maxWidth: "100%" },
  buttonGroupItem: { flexShrink: 1, minWidth: 44 },
  spinner: { alignItems: "center", justifyContent: "center" }
});
