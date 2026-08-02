import type { ReactElement } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useAurelglyphTheme } from "./theme.js";

export type AurelglyphIconName =
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "info"
  | "minus"
  | "plus"
  | "search";

export type IconProps = {
  name: AurelglyphIconName;
  label?: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ color, label, name, size = 20, strokeWidth = 1.75, style }: IconProps): ReactElement {
  const theme = useAurelglyphTheme();
  const stroke = color ?? theme.colors.text;
  const line: ViewStyle = {
    backgroundColor: stroke,
    borderRadius: strokeWidth,
    height: strokeWidth,
    position: "absolute"
  };
  const center = (size - strokeWidth) / 2;
  let drawing: ReactElement;

  if (name === "search") {
    drawing = (
      <>
        <View style={{ borderColor: stroke, borderRadius: size * 0.28, borderWidth: strokeWidth, height: size * 0.56, left: size * 0.12, position: "absolute", top: size * 0.1, width: size * 0.56 }} />
        <View style={[line, { left: size * 0.59, top: size * 0.65, transform: [{ rotate: "45deg" }], width: size * 0.3 }]} />
      </>
    );
  } else if (name === "plus" || name === "minus") {
    drawing = (
      <>
        <View style={[line, { left: size * 0.18, top: center, width: size * 0.64 }]} />
        {name === "plus" ? <View style={[line, { left: size * 0.18, top: center, transform: [{ rotate: "90deg" }], width: size * 0.64 }]} /> : null}
      </>
    );
  } else if (name === "close") {
    drawing = (
      <>
        <View style={[line, { left: size * 0.16, top: center, transform: [{ rotate: "45deg" }], width: size * 0.68 }]} />
        <View style={[line, { left: size * 0.16, top: center, transform: [{ rotate: "-45deg" }], width: size * 0.68 }]} />
      </>
    );
  } else if (name === "check") {
    drawing = (
      <>
        <View style={[line, { left: size * 0.12, top: size * 0.56, transform: [{ rotate: "45deg" }], width: size * 0.34 }]} />
        <View style={[line, { left: size * 0.34, top: size * 0.48, transform: [{ rotate: "-45deg" }], width: size * 0.58 }]} />
      </>
    );
  } else if (name === "chevron-down") {
    drawing = (
      <>
        <View style={[line, { left: size * 0.18, top: size * 0.48, transform: [{ rotate: "45deg" }], width: size * 0.4 }]} />
        <View style={[line, { left: size * 0.43, top: size * 0.48, transform: [{ rotate: "-45deg" }], width: size * 0.4 }]} />
      </>
    );
  } else if (name === "chevron-left" || name === "chevron-right") {
    const direction = name === "chevron-left" ? -1 : 1;
    drawing = (
      <>
        <View style={[line, { left: size * 0.3, top: size * 0.38, transform: [{ rotate: `${direction * 45}deg` }], width: size * 0.42 }]} />
        <View style={[line, { left: size * 0.3, top: size * 0.62, transform: [{ rotate: `${direction * -45}deg` }], width: size * 0.42 }]} />
      </>
    );
  } else {
    drawing = (
      <>
        <View style={{ borderColor: stroke, borderRadius: size / 2, borderWidth: strokeWidth, height: size * 0.82, left: size * 0.09, position: "absolute", top: size * 0.09, width: size * 0.82 }} />
        <View style={[line, { left: size * 0.45, top: size * 0.43, transform: [{ rotate: "90deg" }], width: size * 0.3 }]} />
        <View style={{ backgroundColor: stroke, borderRadius: strokeWidth, height: strokeWidth * 1.4, left: center, position: "absolute", top: size * 0.27, width: strokeWidth * 1.4 }} />
      </>
    );
  }

  return (
    <View
      accessible={Boolean(label)}
      accessibilityLabel={label}
      accessibilityRole={label ? "image" : undefined}
      pointerEvents="none"
      style={[{ height: size, position: "relative", width: size }, style]}
    >
      {drawing}
    </View>
  );
}
