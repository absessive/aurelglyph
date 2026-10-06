# Shared layouts

The example's outer rail and theme controls are page-local in `examples/react-vite/src/App.tsx`, not exported layout primitives. There is no shared site footer or router wrapper. The self-contained primitive specimen board does not need a newly extracted gallery shell. CSS/React/Rails share `ag-*` classes; React Native and SwiftUI preserve native rendering through separate adapters.

## AppShell

Main content plus optional top bar, navigation aside, and footer; content element is configurable.

Source: `packages/react/src/components/AppShell.tsx`

```tsx
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from "react";

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  contentAs?: ElementType;
  footer?: ReactNode;
  navigation?: ReactNode;
  topBar?: ReactNode;
};

export function AppShell({
  children,
  className,
  contentAs: Content = "main",
  footer,
  navigation,
  topBar,
  ...props
}: AppShellProps): ReactElement {
  const classNames = ["ag-app-shell", className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      {topBar ? <div className="ag-app-shell__top">{topBar}</div> : null}
      <div
        className={["ag-app-shell__body", navigation ? "ag-app-shell__body--with-navigation" : undefined]
          .filter(Boolean)
          .join(" ")}
      >
        {navigation ? <aside className="ag-app-shell__nav">{navigation}</aside> : null}
        <Content className="ag-app-shell__content">{children}</Content>
      </div>
      {footer ? <footer className="ag-app-shell__footer">{footer}</footer> : null}
    </div>
  );
}
```

## TopBar

Semantic header with optional leading content, subtitle, and actions; heading element configurable.

Source: `packages/react/src/components/TopBar.tsx`

```tsx
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from "react";

export type TopBarProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  leading?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
  titleAs?: ElementType;
};

export function TopBar({
  actions,
  className,
  leading,
  subtitle,
  title,
  titleAs: Title = "h1",
  ...props
}: TopBarProps): ReactElement {
  const classNames = ["ag-top-bar", className].filter(Boolean).join(" ");

  return (
    <header className={classNames} {...props}>
      {leading ? <div className="ag-top-bar__leading">{leading}</div> : null}
      <div className="ag-top-bar__title-group">
        <Title className="ag-top-bar__title">{title}</Title>
        {subtitle ? <p className="ag-top-bar__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ag-top-bar__actions">{actions}</div> : null}
    </header>
  );
}
```

## TabBar

Navigation landmark with anchor items and active page semantics; this is route navigation, not tab-panel selection.

Source: `packages/react/src/components/TabBar.tsx`

```tsx
import type { AnchorHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";

import { Icon, type AurelglyphIconName } from "./Icon.js";

export type TabBarItem = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  icon?: AurelglyphIconName;
  id: string;
  label: ReactNode;
};

export type TabBarProps = HTMLAttributes<HTMLElement> & {
  activeId?: string;
  items: TabBarItem[];
  label?: string;
};

export function TabBar({
  activeId,
  className,
  items,
  label = "Primary",
  ...props
}: TabBarProps): ReactElement {
  const classNames = ["ag-tab-bar", className].filter(Boolean).join(" ");

  return (
    <nav aria-label={label} className={classNames} {...props}>
      {items.map(({ icon, id, label: itemLabel, ...itemProps }) => {
        const isActive = id === activeId;

        return (
          <a
            {...itemProps}
            aria-current={isActive ? "page" : itemProps["aria-current"]}
            className={["ag-tab-bar__item", isActive ? "is-active" : undefined, itemProps.className]
              .filter(Boolean)
              .join(" ")}
            data-active={isActive ? true : undefined}
            key={id}
          >
            {icon ? <Icon className="ag-tab-bar__icon" decorative name={icon} /> : null}
            <span className="ag-tab-bar__label">{itemLabel}</span>
          </a>
        );
      })}
    </nav>
  );
}
```

## NavigationStack / NavigationPage

Visual page grouping and titled section headers; not an application router.

Source: `packages/react/src/components/NavigationStack.tsx`

```tsx
import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type NavigationStackProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  headingLevel?: 1 | 2 | 3;
  title?: ReactNode;
};

export type NavigationPageProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  children: ReactNode;
  headingLevel?: 2 | 3 | 4;
  title: ReactNode;
};

export function NavigationStack({ children, className, headingLevel = 2, title, ...props }: NavigationStackProps): ReactElement {
  const classNames = ["ag-nav-stack", className].filter(Boolean).join(" ");
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";

  return (
    <div className={classNames} {...props}>
      {title ? <Heading className="ag-nav-stack__title">{title}</Heading> : null}
      <div className="ag-nav-stack__pages">{children}</div>
    </div>
  );
}

export function NavigationPage({
  actions,
  children,
  className,
  headingLevel = 3,
  title,
  ...props
}: NavigationPageProps): ReactElement {
  const classNames = ["ag-nav-page", className].filter(Boolean).join(" ");
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <section className={classNames} {...props}>
      <header className="ag-nav-page__header">
        <Heading className="ag-nav-page__title">{title}</Heading>
        {actions ? <div className="ag-nav-page__actions">{actions}</div> : null}
      </header>
      <div className="ag-nav-page__body">{children}</div>
    </section>
  );
}
```

## Toolbar

Named toolbar role wrapping consumer controls.

Source: `packages/react/src/components/Toolbar.tsx`

```tsx
import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  label?: string;
};

export function Toolbar({ children, className, label = "Toolbar", ...props }: ToolbarProps): ReactElement {
  const classNames = ["ag-toolbar", className].filter(Boolean).join(" ");

  return (
    <div aria-label={label} className={classNames} role="toolbar" {...props}>
      {children}
    </div>
  );
}
```

## Surface / Box / Stack / Container / Grid

Tokenized reusable surface, flex, width container, and responsive grid primitives.

Source: `packages/react/src/components/Layout.tsx`

```tsx
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
```
