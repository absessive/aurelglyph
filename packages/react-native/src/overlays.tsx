import { cloneElement, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import {
  AccessibilityInfo,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type KeyboardAvoidingViewProps,
  type LayoutChangeEvent,
  type ModalProps,
  type DimensionValue,
  type PressableProps,
  type StyleProp,
  type ViewStyle
} from "react-native";

import { clamp, useControllableState } from "./foundation.js";
import { AurelglyphOverlayHost, useAurelglyphOverlayHost, type OverlayHostFrame } from "./overlay-host.js";
import { useAurelglyphTheme } from "./theme.js";

const modalOrientations: NonNullable<ModalProps["supportedOrientations"]> = [
  "portrait",
  "portrait-upside-down",
  "landscape",
  "landscape-left",
  "landscape-right"
];

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
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardAvoidingBehavior?: KeyboardAvoidingViewProps["behavior"];
  keyboardVerticalOffset?: number;
  panelStyle?: StyleProp<ViewStyle>;
  screenInset?: number;
  scrollable?: boolean;
};

export function Dialog({
  animationType = "fade",
  children,
  closeOnScrimPress = true,
  contentContainerStyle,
  description,
  footer,
  keyboardAvoidingBehavior = "padding",
  keyboardVerticalOffset = 0,
  onOpenChange,
  open,
  panelStyle,
  screenInset = 16,
  scrollable = true,
  statusBarTranslucent = false,
  supportedOrientations = modalOrientations,
  title,
  transparent = true,
  variant = "default",
  ...props
}: DialogProps): ReactElement {
  const theme = useAurelglyphTheme();
  const reduceMotion = useReducedMotion();
  const maxWidth = variant === "compact" ? 420 : variant === "wide" ? 760 : 560;
  const resolvedScreenInset = Number.isFinite(screenInset) ? Math.max(0, screenInset) : 16;
  const dismiss = (reason: OverlayDismissReason): void => onOpenChange(false, { reason });
  return (
    <Modal
      {...props}
      animationType={reduceMotion === false ? animationType : "none"}
      onRequestClose={() => dismiss("back")}
      statusBarTranslucent={statusBarTranslucent}
      supportedOrientations={supportedOrientations}
      transparent={transparent}
      visible={open}
    >
      <AurelglyphOverlayHost>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.overlay }]}>
          <KeyboardAvoidingView
            behavior={keyboardAvoidingBehavior}
            keyboardVerticalOffset={keyboardVerticalOffset}
            style={styles.keyboardAvoider}
          >
            <View style={[styles.scrim, { padding: resolvedScreenInset }]}>
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
                  <View style={styles.dialogHeading}>
                    <Text
                      accessible
                      accessibilityLabel={title}
                      role="dialog"
                      style={[styles.dialogTitle, { color: theme.colors.text, fontFamily: theme.fonts.display }]}
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
                {scrollable ? (
                  <ScrollView
                    bounces={false}
                    contentContainerStyle={[styles.dialogBodyContent, { gap: theme.space[3] }, contentContainerStyle]}
                    keyboardShouldPersistTaps="handled"
                    style={styles.dialogBody}
                  >
                    {children}
                  </ScrollView>
                ) : (
                  <View style={[styles.dialogBody, styles.dialogBodyContent, { gap: theme.space[3] }, contentContainerStyle]}>{children}</View>
                )}
                {footer ? <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>{footer}</View> : null}
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </AurelglyphOverlayHost>
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
      screenInset={0}
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

type TooltipRect = { height: number; width: number; x: number; y: number };
type TooltipSize = Pick<TooltipRect, "height" | "width">;

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
  const viewport = useWindowDimensions();
  const overlayHost = useAurelglyphOverlayHost();
  const tooltipId = useId();
  const [open, setOpen] = useControllableState({ defaultValue: defaultVisible, onChange: onVisibleChange, value: visible });
  const [anchor, setAnchor] = useState<TooltipRect | null>(null);
  const [tooltipSize, setTooltipSize] = useState<TooltipSize | null>(null);
  const anchorRef = useRef<View | null>(null);
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
  const measureAnchor = useCallback((): void => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor((current) => current?.x === x && current.y === y && current.width === width && current.height === height
        ? current
        : { height, width, x, y });
    });
  }, []);
  useEffect(() => {
    if (!open) return;
    setTooltipSize(null);
    measureAnchor();
  }, [measureAnchor, open, viewport.height, viewport.width, label]);
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(measureAnchor, 100);
    return () => clearInterval(interval);
  }, [measureAnchor, open]);
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
  const hostFrame = overlayHost?.frame ?? { height: viewport.height, width: viewport.width, x: 0, y: 0 };
  const hostReady = !overlayHost || overlayHost.frame !== null;
  const globalTooltipPosition = anchor && tooltipSize
    ? resolveTooltipPosition(anchor, tooltipSize, placement, hostFrame)
    : { left: 8, top: 8 };
  const positionOrigin = overlayHost ? hostFrame : { x: anchor?.x ?? 0, y: anchor?.y ?? 0 };
  const tooltipLeft = globalTooltipPosition.left - positionOrigin.x;
  const tooltipTop = globalTooltipPosition.top - positionOrigin.y;
  const tooltipNode = useMemo(() => (
    <View
      accessibilityLiveRegion="polite"
      onLayout={(event: LayoutChangeEvent) => {
        const { height, width } = event.nativeEvent.layout;
        setTooltipSize((current) => current?.height === height && current.width === width ? current : { height, width });
      }}
      pointerEvents="none"
      role="tooltip"
      style={[
        styles.tooltip,
        { left: tooltipLeft, top: tooltipTop },
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderColor: theme.colors.borderStrong,
          borderRadius: theme.radii.sm,
          maxWidth: Math.max(0, Math.min(240, hostFrame.width - 16)),
          opacity: anchor && tooltipSize && hostReady ? 1 : 0
        }
      ]}
    >
      <Text style={{ color: theme.colors.text, flexShrink: 1, fontFamily: theme.fonts.ui, fontSize: 12 }}>{label}</Text>
    </View>
  ), [
    anchor,
    hostFrame.width,
    hostReady,
    label,
    theme.colors.borderStrong,
    theme.colors.surfaceStrong,
    theme.colors.text,
    theme.fonts.ui,
    theme.radii.sm,
    tooltipLeft,
    tooltipSize,
    tooltipTop
  ]);
  const removeHostedOverlay = overlayHost?.removeOverlay;
  const setHostedOverlay = overlayHost?.setOverlay;
  useEffect(() => {
    if (!open || !removeHostedOverlay || !setHostedOverlay) return;
    setHostedOverlay(tooltipId, tooltipNode);
    return () => removeHostedOverlay(tooltipId);
  }, [open, removeHostedOverlay, setHostedOverlay, tooltipId, tooltipNode]);
  return (
    <View collapsable={false} onLayout={() => open && measureAnchor()} ref={anchorRef} style={[styles.tooltipAnchor, style]}>
      {trigger}
      {open && !overlayHost ? tooltipNode : null}
    </View>
  );
}

function resolveTooltipPosition(
  anchor: TooltipRect,
  tooltip: TooltipSize,
  requestedPlacement: TooltipPlacement,
  bounds: OverlayHostFrame
): { left: number; top: number } {
  const edge = 8;
  const gap = 8;
  const placements: Record<TooltipPlacement, { left: number; top: number }> = {
    top: { left: anchor.x + (anchor.width - tooltip.width) / 2, top: anchor.y - tooltip.height - gap },
    bottom: { left: anchor.x + (anchor.width - tooltip.width) / 2, top: anchor.y + anchor.height + gap },
    left: { left: anchor.x - tooltip.width - gap, top: anchor.y + (anchor.height - tooltip.height) / 2 },
    right: { left: anchor.x + anchor.width + gap, top: anchor.y + (anchor.height - tooltip.height) / 2 }
  };
  const opposite: Record<TooltipPlacement, TooltipPlacement> = { bottom: "top", left: "right", right: "left", top: "bottom" };
  const fitsOnRequestedAxis = (placement: TooltipPlacement, { left, top }: { left: number; top: number }): boolean => {
    if (placement === "top") return top >= bounds.y + edge;
    if (placement === "bottom") return top + tooltip.height <= bounds.y + bounds.height - edge;
    if (placement === "left") return left >= bounds.x + edge;
    return left + tooltip.width <= bounds.x + bounds.width - edge;
  };
  const preferred = placements[requestedPlacement];
  const oppositePlacement = opposite[requestedPlacement];
  const flipped = placements[oppositePlacement];
  const candidate = fitsOnRequestedAxis(requestedPlacement, preferred)
    ? preferred
    : fitsOnRequestedAxis(oppositePlacement, flipped)
      ? flipped
      : preferred;
  return {
    left: clamp(candidate.left, bounds.x + edge, Math.max(bounds.x + edge, bounds.x + bounds.width - tooltip.width - edge)),
    top: clamp(candidate.top, bounds.y + edge, Math.max(bounds.y + edge, bounds.y + bounds.height - tooltip.height - edge))
  };
}

const styles = StyleSheet.create({
  closeButton: { alignItems: "center", borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, justifyContent: "center", minHeight: 44, paddingHorizontal: 10 },
  dialog: {
    alignSelf: "center",
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
    gap: 20,
    maxHeight: "100%",
    minWidth: 0,
    padding: 20,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    width: "100%"
  },
  dialogBody: { flexShrink: 1, minHeight: 0 },
  dialogBodyContent: { flexGrow: 0 },
  dialogHeader: { alignItems: "flex-start", flexDirection: "row", flexShrink: 1 },
  dialogHeading: { flex: 1, gap: 8, minWidth: 0 },
  dialogTitle: { flexShrink: 1, fontSize: 22 },
  footer: { alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexShrink: 0, flexWrap: "wrap", gap: 8, justifyContent: "flex-end", paddingTop: 16 },
  keyboardAvoider: { flex: 1 },
  safeArea: { flex: 1 },
  scrim: { flex: 1, justifyContent: "center" },
  tooltip: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 7, position: "absolute", zIndex: 100 },
  tooltipAnchor: { alignSelf: "flex-start" }
});
