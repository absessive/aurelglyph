import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from "react";
import { SafeAreaView, StyleSheet, View, type Insets } from "react-native";

export type OverlayHostFrame = { height: number; width: number; x: number; y: number };

type OverlayHostContextValue = {
  frame: OverlayHostFrame | null;
  removeOverlay: (id: string) => void;
  setOverlay: (id: string, node: ReactNode) => void;
};

const OverlayHostContext = createContext<OverlayHostContextValue | null>(null);

export type AurelglyphOverlayHostProps = {
  children: ReactNode;
  insets?: Partial<Insets>;
};

export function AurelglyphOverlayHost({ children, insets }: AurelglyphOverlayHostProps): ReactElement {
  const [entries, setEntries] = useState<ReadonlyMap<string, ReactNode>>(() => new Map());
  const [frame, setFrame] = useState<OverlayHostFrame | null>(null);
  const hostRef = useRef<View | null>(null);
  const measureHost = useCallback((): void => {
    hostRef.current?.measureInWindow((x, y, width, height) => {
      setFrame((current) => current?.x === x && current.y === y && current.width === width && current.height === height
        ? current
        : { height, width, x, y });
    });
  }, []);
  const setOverlay = useCallback((id: string, node: ReactNode): void => {
    setEntries((current) => {
      if (current.get(id) === node) return current;
      const next = new Map(current);
      next.set(id, node);
      return next;
    });
  }, []);
  const removeOverlay = useCallback((id: string): void => {
    setEntries((current) => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ frame, removeOverlay, setOverlay }), [frame, removeOverlay, setOverlay]);
  const layer = (
    <View
      accessible={false}
      collapsable={false}
      onLayout={measureHost}
      pointerEvents="box-none"
      ref={hostRef}
      style={styles.host}
      testID="aurelglyph-overlay-host"
    >
      {Array.from(entries, ([id, node]) => <Fragment key={id}>{node}</Fragment>)}
    </View>
  );
  const hasExplicitInsets = insets !== undefined;
  const safeInset = (value: number | undefined): number => value !== undefined && Number.isFinite(value) ? Math.max(0, value) : 0;
  const boundaryStyle = hasExplicitInsets
    ? {
      paddingBottom: safeInset(insets.bottom),
      paddingLeft: safeInset(insets.left),
      paddingRight: safeInset(insets.right),
      paddingTop: safeInset(insets.top)
    }
    : undefined;
  return (
    <OverlayHostContext.Provider value={value}>
      {children}
      {hasExplicitInsets ? (
        <View accessible={false} pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.boundary, boundaryStyle]}>{layer}</View>
      ) : (
        <SafeAreaView accessible={false} pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.boundary]}>{layer}</SafeAreaView>
      )}
    </OverlayHostContext.Provider>
  );
}

export function useAurelglyphOverlayHost(): OverlayHostContextValue | null {
  return useContext(OverlayHostContext);
}

const styles = StyleSheet.create({
  boundary: { elevation: 1000, zIndex: 1000 },
  host: { flex: 1, zIndex: 1 }
});
