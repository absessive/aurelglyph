import {
  createContext,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode
} from "react";

export type GlyphSpring = "quiet" | "standard" | "expressive";
export type GlyphTransitionName = "bloom" | "drift" | "collapse" | "glass" | "thread" | "tilt" | "arc" | "none";
export type GlyphState = "matched" | "presenting" | "dismissing" | "appearing" | "disappearing";
export type GlyphDirection = "up" | "down" | "leading" | "trailing" | "forward" | "back";
export type GlyphSnapshotStrategy = "live" | "optimized" | "layer" | "none";

export type GlyphInteractiveState = {
  active: boolean;
  progress: number;
  phase: "idle" | "updating" | "finishing" | "cancelling";
};

export type GlyphMotionContextValue = {
  prefersReducedMotion: boolean;
  spring: GlyphSpring;
  viewTransitionsAvailable: boolean;
};

export type GlyphMotionProviderProps = {
  children: ReactNode;
  prefersReducedMotion?: boolean;
  spring?: GlyphSpring;
  viewTransitionsAvailable?: boolean;
};

export type GlyphMatchProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  id: string;
  snapshot?: GlyphSnapshotStrategy;
  state?: GlyphState;
};

export type GlyphTransitionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  direction?: GlyphDirection;
  name: GlyphTransitionName;
  spring?: GlyphSpring;
  threadIndex?: number;
};

type GlyphMatchStyle = CSSProperties & {
  viewTransitionName?: string;
};

type GlyphTransitionStyle = CSSProperties & {
  "--ag-glyph-thread-index"?: number;
};

const GlyphMotionContext = createContext<GlyphMotionContextValue>({
  prefersReducedMotion: false,
  spring: "standard",
  viewTransitionsAvailable: false
});

function detectViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

export function GlyphMotionProvider({
  children,
  prefersReducedMotion = false,
  spring = "standard",
  viewTransitionsAvailable = detectViewTransitions()
}: GlyphMotionProviderProps): ReactElement {
  return (
    <GlyphMotionContext.Provider value={{ prefersReducedMotion, spring, viewTransitionsAvailable }}>
      {children}
    </GlyphMotionContext.Provider>
  );
}

export function useGlyphMotion(): GlyphMotionContextValue {
  return useContext(GlyphMotionContext);
}

export function createGlyphInteractiveState(progress = 0): GlyphInteractiveState {
  return {
    active: progress > 0 && progress < 1,
    phase: progress <= 0 ? "idle" : progress >= 1 ? "finishing" : "updating",
    progress: Math.max(0, Math.min(1, progress))
  };
}

export function GlyphMatch({
  children,
  className,
  id,
  snapshot = "optimized",
  state = "matched",
  style,
  ...props
}: GlyphMatchProps): ReactElement {
  const classNames = ["ag-glyph-match", className].filter(Boolean).join(" ");
  const glyphStyle: GlyphMatchStyle = { viewTransitionName: id, ...style };

  return (
    <div
      className={classNames}
      data-glyph-match={id}
      data-glyph-snapshot={snapshot}
      data-glyph-state={state}
      style={glyphStyle}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlyphTransition({
  children,
  className,
  direction = "forward",
  name,
  spring,
  style,
  threadIndex,
  ...props
}: GlyphTransitionProps): ReactElement {
  const context = useGlyphMotion();
  const resolvedSpring = spring ?? context.spring;
  const classNames = ["ag-glyph-transition", `ag-glyph-transition--${name}`, className]
    .filter(Boolean)
    .join(" ");
  const glyphStyle: GlyphTransitionStyle = {
    "--ag-glyph-thread-index": threadIndex,
    ...style
  };

  return (
    <div
      className={classNames}
      data-glyph-direction={direction}
      data-glyph-reduced-motion={context.prefersReducedMotion || undefined}
      data-glyph-spring={resolvedSpring}
      data-glyph-thread-index={threadIndex}
      data-glyph-transition={name}
      data-glyph-view-transition={context.viewTransitionsAvailable || undefined}
      style={glyphStyle}
      {...props}
    >
      {children}
    </div>
  );
}
