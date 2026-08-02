import type { CSSProperties, ElementType, HTMLAttributes, ReactElement, ReactNode } from "react";

export type SurfaceElevation = "flat" | "raised" | "floating";
export type SurfacePadding = "none" | "sm" | "md" | "lg";

export type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children?: ReactNode;
  elevation?: SurfaceElevation;
  padding?: SurfacePadding;
};

export function Surface({
  as: Component = "div",
  children,
  className,
  elevation = "raised",
  padding = "md",
  ...props
}: SurfaceProps): ReactElement {
  return (
    <Component
      className={["ag-surface", className].filter(Boolean).join(" ")}
      data-elevation={elevation}
      data-padding={padding}
      {...props}
    >
      {children}
    </Component>
  );
}

export type BoxProps = SurfaceProps;

export function Box({ className, elevation = "flat", ...props }: BoxProps): ReactElement {
  return <Surface className={["ag-box", className].filter(Boolean).join(" ")} elevation={elevation} {...props} />;
}

export type StackProps = HTMLAttributes<HTMLElement> & {
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  as?: ElementType;
  children?: ReactNode;
  direction?: "row" | "column";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
};

type StackStyle = CSSProperties & {
  "--ag-stack-gap"?: string;
};

const stackGaps: Record<NonNullable<StackProps["gap"]>, string> = {
  none: "0",
  xs: "var(--ag-space-1)",
  sm: "var(--ag-space-2)",
  md: "var(--ag-space-4)",
  lg: "var(--ag-space-6)",
  xl: "var(--ag-space-8)"
};

export function Stack({
  align = "stretch",
  as: Component = "div",
  children,
  className,
  direction = "column",
  gap = "md",
  justify = "start",
  style,
  wrap = false,
  ...props
}: StackProps): ReactElement {
  const stackStyle = { ...style, "--ag-stack-gap": stackGaps[gap] } as StackStyle;

  return (
    <Component
      className={["ag-stack", className].filter(Boolean).join(" ")}
      data-align={align}
      data-direction={direction}
      data-gap={gap}
      data-justify={justify}
      data-wrap={wrap || undefined}
      style={stackStyle}
      {...props}
    >
      {children}
    </Component>
  );
}

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children?: ReactNode;
  size?: ContainerSize;
};

export function Container({
  as: Component = "div",
  children,
  className,
  size = "lg",
  ...props
}: ContainerProps): ReactElement {
  return (
    <Component className={["ag-container", className].filter(Boolean).join(" ")} data-size={size} {...props}>
      {children}
    </Component>
  );
}

export type GridProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children?: ReactNode;
  columns?: number | GridResponsiveColumns;
  gap?: string;
  minItemWidth?: string;
};

export type GridResponsiveColumns = {
  base?: number;
  lg?: number;
  md?: number;
  sm?: number;
  xl?: number;
};

type GridStyle = CSSProperties & {
  "--ag-grid-columns"?: string;
  "--ag-grid-columns-lg"?: string;
  "--ag-grid-columns-md"?: string;
  "--ag-grid-columns-sm"?: string;
  "--ag-grid-columns-xl"?: string;
  "--ag-grid-gap"?: string;
  "--ag-grid-min-item-width"?: string;
  "--ag-grid-target-width"?: string;
  "--ag-grid-target-width-lg"?: string;
  "--ag-grid-target-width-md"?: string;
  "--ag-grid-target-width-sm"?: string;
  "--ag-grid-target-width-xl"?: string;
};

function normalizedGridColumnCount(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

function gridTargetWidth(columns: number): string {
  return `${100 / columns}%`;
}

export function Grid({
  as: Component = "div",
  children,
  className,
  columns = 12,
  gap = "var(--ag-space-4)",
  minItemWidth,
  style,
  ...props
}: GridProps): ReactElement {
  const responsiveColumns = typeof columns === "object" ? columns : undefined;
  const numericColumns = typeof columns === "number" ? columns : undefined;
  const baseColumns = normalizedGridColumnCount(responsiveColumns?.base ?? numericColumns, 12);
  const smColumns = responsiveColumns?.sm === undefined ? undefined : normalizedGridColumnCount(responsiveColumns.sm, baseColumns);
  const mdColumns = responsiveColumns?.md === undefined ? undefined : normalizedGridColumnCount(responsiveColumns.md, smColumns ?? baseColumns);
  const lgColumns = responsiveColumns?.lg === undefined ? undefined : normalizedGridColumnCount(responsiveColumns.lg, mdColumns ?? smColumns ?? baseColumns);
  const xlColumns = responsiveColumns?.xl === undefined ? undefined : normalizedGridColumnCount(responsiveColumns.xl, lgColumns ?? mdColumns ?? smColumns ?? baseColumns);
  const gridStyle: GridStyle = {
    "--ag-grid-columns": String(baseColumns),
    "--ag-grid-columns-lg": lgColumns === undefined ? undefined : String(lgColumns),
    "--ag-grid-columns-md": mdColumns === undefined ? undefined : String(mdColumns),
    "--ag-grid-columns-sm": smColumns === undefined ? undefined : String(smColumns),
    "--ag-grid-columns-xl": xlColumns === undefined ? undefined : String(xlColumns),
    "--ag-grid-gap": gap,
    "--ag-grid-min-item-width": minItemWidth,
    "--ag-grid-target-width": gridTargetWidth(baseColumns),
    "--ag-grid-target-width-lg": lgColumns === undefined ? undefined : gridTargetWidth(lgColumns),
    "--ag-grid-target-width-md": mdColumns === undefined ? undefined : gridTargetWidth(mdColumns),
    "--ag-grid-target-width-sm": smColumns === undefined ? undefined : gridTargetWidth(smColumns),
    "--ag-grid-target-width-xl": xlColumns === undefined ? undefined : gridTargetWidth(xlColumns),
    ...style
  };

  return (
    <Component className={["ag-grid", className].filter(Boolean).join(" ")} style={gridStyle} {...props}>
      {children}
    </Component>
  );
}
