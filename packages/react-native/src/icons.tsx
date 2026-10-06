import type { ReactElement } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useAurelglyphTheme } from "./theme.js";

export type AurelglyphIconName =
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "contract"
  | "expand"
  | "external-link"
  | "eye"
  | "eye-off"
  | "info"
  | "minus"
  | "plus"
  | "search"
  | "star"
  | "warning";

export type IconProps = {
  name: AurelglyphIconName;
  label?: string;
  color?: string;
  /** Fills the canonical star polygon; other icon shapes remain stroked. */
  filled?: boolean;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

// The canonical React glyph paths, rendered with lightweight native line
// segments. Curves are sampled geometrically; no font or SVG dependency.
const curatedGlyphs = {
  contract: "M10 4v6H4m6 0L4 4m10 0v6h6m-6 0 6-6M10 20v-6H4m6 0-6 6m10 0v-6h6m-6 0 6 6",
  expand: "M4 9V4h5M4 4l6 6m10-1V4h-5m5 0-6 6M4 15v5h5m-5 0 6-6m10 1v5h-5m5 0-6-6",
  "external-link": "M10 6H5v13h13v-5M14 5h5v5m0-5-9 9",
  eye: "M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  "eye-off": "M4 4l16 16M9.2 6.6A9.6 9.6 0 0 1 12 6c5.8 0 9 6 9 6a16 16 0 0 1-2.2 3M6.4 8.4A16 16 0 0 0 3 12s3.2 6 9 6c1 0 1.9-.2 2.8-.5",
  star: "m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8L12 4Z",
  warning: "M12 4 21 20H3L12 4Zm0 5v5m0 3h.01"
} as const;

type Point = { x: number; y: number };
type Segment = readonly [Point, Point];

function glyphSegments(path: string): Segment[] {
  const tokens = path.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  const segments: Segment[] = [];
  let point: Point = { x: 0, y: 0 };
  let start = point;
  let control: Point | undefined;
  let command = "";
  let index = 0;
  const lineTo = (next: Point): void => {
    if (next.x !== point.x || next.y !== point.y) segments.push([point, next]);
    point = next;
  };
  while (index < tokens.length) {
    if (/^[a-z]$/i.test(tokens[index])) command = tokens[index++];
    const relative = command === command.toLowerCase();
    const kind = command.toLowerCase();
    if (kind === "z") {
      lineTo(start);
      control = undefined;
      command = "";
      continue;
    }
    const count = ({ m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, a: 7 } as Record<string, number>)[kind];
    if (!count || index + count > tokens.length) break;
    const values = tokens.slice(index, index + count).map(Number);
    index += count;
    const resolve = (x: number, y: number): Point => ({ x: x + (relative ? point.x : 0), y: y + (relative ? point.y : 0) });
    if (kind === "m") {
      point = resolve(values[0], values[1]);
      start = point;
      command = relative ? "l" : "L";
      control = undefined;
    } else if (kind === "l" || kind === "h" || kind === "v") {
      lineTo(kind === "h"
        ? { x: values[0] + (relative ? point.x : 0), y: point.y }
        : kind === "v" ? { x: point.x, y: values[0] + (relative ? point.y : 0) } : resolve(values[0], values[1]));
      control = undefined;
    } else if (kind === "c" || kind === "s") {
      const origin = point;
      const first = kind === "c" ? resolve(values[0], values[1]) : control ? { x: 2 * point.x - control.x, y: 2 * point.y - control.y } : point;
      const second = resolve(values[kind === "c" ? 2 : 0], values[kind === "c" ? 3 : 1]);
      const end = resolve(values[kind === "c" ? 4 : 2], values[kind === "c" ? 5 : 3]);
      for (let step = 1; step <= 8; step += 1) {
        const t = step / 8;
        const inverse = 1 - t;
        lineTo({
          x: inverse ** 3 * origin.x + 3 * inverse ** 2 * t * first.x + 3 * inverse * t ** 2 * second.x + t ** 3 * end.x,
          y: inverse ** 3 * origin.y + 3 * inverse ** 2 * t * first.y + 3 * inverse * t ** 2 * second.y + t ** 3 * end.y
        });
      }
      control = second;
    } else if (kind === "a") {
      // These curated paths use unrotated circular arcs only.
      const origin = point;
      const end = resolve(values[5], values[6]);
      const dx = end.x - origin.x;
      const dy = end.y - origin.y;
      const distance = Math.hypot(dx, dy);
      if (!distance) continue;
      const radius = Math.max(Math.abs(values[0]), distance / 2);
      const large = Boolean(values[3]);
      const sweep = Boolean(values[4]);
      const offset = Math.sqrt(Math.max(0, radius ** 2 - distance ** 2 / 4));
      const sign = large === sweep ? -1 : 1;
      const center = { x: (origin.x + end.x) / 2 + sign * dy / distance * offset, y: (origin.y + end.y) / 2 - sign * dx / distance * offset };
      const angle = Math.atan2(origin.y - center.y, origin.x - center.x);
      let delta = Math.atan2(end.y - center.y, end.x - center.x) - angle;
      if (sweep && delta < 0) delta += Math.PI * 2;
      if (!sweep && delta > 0) delta -= Math.PI * 2;
      for (let step = 1; step <= 8; step += 1) {
        const nextAngle = angle + delta * step / 8;
        lineTo({ x: center.x + Math.cos(nextAngle) * radius, y: center.y + Math.sin(nextAngle) * radius });
      }
      point = end;
      control = undefined;
    }
  }
  return segments;
}

const nativeGlyphs = Object.fromEntries(Object.entries(curatedGlyphs).map(([name, path]) => [name, glyphSegments(path)])) as Record<keyof typeof curatedGlyphs, Segment[]>;

const starFill = Array.from({ length: 28 }, (_, index) => {
  const y = 4.2 + index * 0.55;
  const intersections = nativeGlyphs.star.flatMap(([from, to]) =>
    (from.y <= y && to.y > y) || (to.y <= y && from.y > y)
      ? [from.x + (y - from.y) * (to.x - from.x) / (to.y - from.y)] : []
  ).sort((left, right) => left - right);
  return intersections.reduce<Array<{ x: number; y: number; width: number }>>((rows, x, row) => {
    if (row % 2 === 0 && intersections[row + 1] !== undefined) rows.push({ x, y, width: intersections[row + 1] - x });
    return rows;
  }, []);
}).flat();

export function Icon({ color, filled = false, label, name, size = 20, strokeWidth = 1.75, style }: IconProps): ReactElement {
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

  if (name in nativeGlyphs) {
    const scale = size / 24;
    drawing = <>{name === "star" && filled ? starFill.map((row, index) => <View key={`fill-${index}`} style={{ backgroundColor: stroke, height: 0.7 * scale, left: row.x * scale, position: "absolute", top: row.y * scale, width: row.width * scale }} />) : null}{nativeGlyphs[name as keyof typeof nativeGlyphs].map(([from, to], index) => {
      const width = Math.max(strokeWidth, Math.hypot(to.x - from.x, to.y - from.y) * scale);
      return <View key={index} style={[line, { left: (from.x + to.x) * scale / 2 - width / 2, top: (from.y + to.y) * scale / 2 - strokeWidth / 2, transform: [{ rotate: `${Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI}deg` }], width }]} />;
    })}</>;
  } else if (name === "search") {
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
