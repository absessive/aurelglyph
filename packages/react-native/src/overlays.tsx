import { cloneElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import {
  AccessibilityInfo,
  I18nManager,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ModalProps,
  type DimensionValue,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { useControllableState } from "./foundation.js";
import { useAurelglyphTheme } from "./theme.js";

export type OverlayDismissReason = "back" | "scrim" | "close";
export type OverlayOpenChangeDetails = { reason: OverlayDismissReason };
export type DialogVariant = "default" | "compact" | "wide";
export type DialogProps = Omit<ModalProps, "children" | "onDismiss" | "onRequestClose" | "visible"> & {
  open: boolean;
  onOpenChange: (open: boolean, details: OverlayOpenChangeDetails) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: DialogVariant;
  closeOnScrimPress?: boolean;
  panelStyle?: StyleProp<ViewStyle>;
};

export function Dialog({
  animationType = "fade",
  children,
  closeOnScrimPress = true,
  description,
  footer,
  onOpenChange,
  open,
  panelStyle,
  title,
  variant = "default",
  ...props
}: DialogProps): ReactElement {
  const theme = useAurelglyphTheme();
  const reduceMotion = useReducedMotion();
  const maxWidth = variant === "compact" ? 420 : variant === "wide" ? 760 : 560;
  const dismiss = (reason: OverlayDismissReason): void => onOpenChange(false, { reason });
  return (
    <Modal
      {...props}
      animationType={reduceMotion === false ? animationType : "none"}
      onRequestClose={() => dismiss("back")}
      statusBarTranslucent
      transparent
      visible={open}
    >
      <View style={[styles.scrim, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          accessible={false}
          onPress={() => closeOnScrimPress && dismiss("scrim")}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessible={false}
          accessibilityViewIsModal
          aria-modal
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.backgroundElevated,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radii.lg,
              maxWidth,
              shadowColor: theme.colors.shadow
            },
            panelStyle
          ]}
        >
          <View style={[styles.dialogHeader, { gap: theme.space[3] }]}>
            <View style={{ flex: 1, gap: theme.space[2] }}>
              <Text
                accessible
                accessibilityLabel={title}
                role="dialog"
                style={{ color: theme.colors.text, fontFamily: theme.fonts.display, fontSize: 22 }}
              >
                {title}
              </Text>
              {description ? <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.ui, lineHeight: 21 }}>{description}</Text> : null}
            </View>
            <Pressable
              accessibilityLabel={`Close ${title}`}
              accessibilityRole="button"
              onPress={() => dismiss("close")}
              style={({ pressed }) => [styles.closeButton, { borderColor: theme.colors.borderStrong, opacity: pressed ? 0.72 : 1 }]}
            >
              <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 12 }}>Close</Text>
            </Pressable>
          </View>
          <View style={{ gap: theme.space[3] }}>{children}</View>
          {footer ? <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

function useReducedMotion(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return enabled;
}

export type DrawerSide = "start" | "end" | "top" | "bottom";
export type DrawerProps = Omit<DialogProps, "variant"> & { side?: DrawerSide; size?: DimensionValue };

export function Drawer({ children, panelStyle, side = "end", size, ...props }: DrawerProps): ReactElement {
  const theme = useAurelglyphTheme();
  const vertical = side === "top" || side === "bottom";
  const physicalStart = I18nManager.isRTL ? "right" : "left";
  const borderOnLeft = (side === "end" && physicalStart === "left") || (side === "start" && physicalStart === "right");
  const borderOnRight = (side === "start" && physicalStart === "left") || (side === "end" && physicalStart === "right");
  const alignment: ViewStyle = {
    alignSelf: vertical ? "stretch" : side === "start" ? "flex-start" : "flex-end",
    borderRadius: 0,
    height: vertical ? size ?? "52%" : "100%",
    margin: 0,
    maxWidth: vertical ? undefined : 520,
    width: vertical ? "100%" : size ?? "86%",
    ...(side === "top" ? { marginBottom: "auto" } : {}),
    ...(side === "bottom" ? { marginTop: "auto" } : {})
  };
  return (
    <Dialog
      panelStyle={[
        alignment,
        {
          borderColor: theme.colors.borderStrong,
          borderBottomWidth: side === "top" ? StyleSheet.hairlineWidth : undefined,
          borderLeftWidth: borderOnLeft ? StyleSheet.hairlineWidth : undefined,
          borderRightWidth: borderOnRight ? StyleSheet.hairlineWidth : undefined,
          borderTopWidth: side === "bottom" ? StyleSheet.hairlineWidth : undefined
        },
        panelStyle
      ]}
      {...props}
    >
      {children}
    </Dialog>
  );
}

export type PopoverPlacement = "top" | "bottom" | "center";
export type PopoverProps = Omit<DialogProps, "description" | "footer" | "title" | "variant"> & {
  accessibilityLabel: string;
  title?: string;
  placement?: PopoverPlacement;
};

export function Popover({ accessibilityLabel, children, placement = "center", title, ...props }: PopoverProps): ReactElement {
  const theme = useAurelglyphTheme();
  const placementStyle: ViewStyle = placement === "top" ? { marginBottom: "auto", marginTop: 64 } : placement === "bottom" ? { marginBottom: 48, marginTop: "auto" } : {};
  return (
    <Dialog
      panelStyle={[{ maxWidth: 420, padding: theme.space[4] }, placementStyle]}
      title={title ?? accessibilityLabel}
      variant="compact"
      {...props}
    >
      {children}
    </Dialog>
  );
}

export type TooltipPlacement = "top" | "bottom" | "left" | "right";
type TooltipTriggerProps = Pick<
  PressableProps,
  "accessibilityHint" | "accessibilityLabel" | "delayLongPress" | "onLongPress" | "onPressOut"
>;
export type TooltipProps = {
  children: ReactElement<TooltipTriggerProps>;
  label: string;
  accessibilityLabel?: string;
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  placement?: TooltipPlacement;
  style?: StyleProp<ViewStyle>;
};

export function Tooltip({
  accessibilityLabel,
  children,
  defaultVisible = false,
  label,
  onVisibleChange,
  placement = "top",
  style,
  visible
}: TooltipProps): ReactElement {
  const theme = useAurelglyphTheme();
  const [open, setOpen] = useControllableState({ defaultValue: defaultVisible, onChange: onVisibleChange, value: visible });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const show = (): void => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hideSoon = (): void => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 1200);
  };
  const trigger = cloneElement(children, {
    accessibilityHint: [children.props.accessibilityHint, label].filter(Boolean).join(". "),
    ...(accessibilityLabel ? { accessibilityLabel } : {}),
    delayLongPress: children.props.delayLongPress ?? 400,
    onLongPress: (event) => {
      children.props.onLongPress?.(event);
      show();
    },
    onPressOut: (event) => {
      children.props.onPressOut?.(event);
      if (open) hideSoon();
    }
  });
  return (
    <View style={[styles.tooltipAnchor, style]}>
      {trigger}
      {open ? (
        <View
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          role="tooltip"
          style={[
            styles.tooltip,
            placement === "top"
              ? { bottom: "100%", marginBottom: 8 }
              : placement === "bottom"
                ? { marginTop: 8, top: "100%" }
                : placement === "left"
                  ? { marginRight: 8, right: "100%" }
                  : { left: "100%", marginLeft: 8 },
            { backgroundColor: theme.colors.surfaceStrong, borderColor: theme.colors.borderStrong, borderRadius: theme.radii.sm }
          ]}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.ui, fontSize: 12 }}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: { alignItems: "center", borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", minHeight: 44, paddingHorizontal: 10 },
  dialog: {
    alignSelf: "center",
    borderWidth: StyleSheet.hairlineWidth,
    gap: 20,
    margin: 20,
    padding: 20,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    width: "90%"
  },
  dialogHeader: { alignItems: "flex-start", flexDirection: "row" },
  footer: { alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 8, justifyContent: "flex-end", paddingTop: 16 },
  scrim: { flex: 1, justifyContent: "center" },
  tooltip: { borderWidth: StyleSheet.hairlineWidth, maxWidth: 240, paddingHorizontal: 10, paddingVertical: 7, position: "absolute", zIndex: 100 },
  tooltipAnchor: { alignSelf: "flex-start", position: "relative" }
});
