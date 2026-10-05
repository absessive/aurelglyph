import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from "react";

/** Overrideable copy for text and generated accessibility labels owned by native controls. */
export type AurelglyphControlCopy = {
  actions: string;
  clear: string;
  clearSearch: string;
  close: string;
  closeLabel: (title: string) => string;
  commandPalette: string;
  decreaseLabel: (label: string) => string;
  filterOptions: string;
  increaseLabel: (label: string) => string;
  invalid: string;
  loading: string;
  loadingSelection: string;
  moreInformation: string;
  noActions: string;
  noCommands: string;
  noOptions: string;
  pagination: string;
  pageLabel: (label: string, page: number) => string;
  previous: string;
  previousPageLabel: (label: string) => string;
  next: string;
  nextPageLabel: (label: string) => string;
  primaryNavigation: string;
  progress: string;
  readOnly: string;
  remove: string;
  removeFileLabel: (name: string) => string;
  required: string;
  search: string;
  searchCommands: string;
  searchOptions: string;
  selectHint: string;
  selectPlaceholder: string;
  selecting: string;
  tabs: string;
  uploadDescription: string;
};

export const aurelglyphControlCopy: AurelglyphControlCopy = {
  actions: "Actions",
  clear: "Clear",
  clearSearch: "Clear search",
  close: "Close",
  closeLabel: (title) => `Close ${title}`,
  commandPalette: "Command palette",
  decreaseLabel: (label) => `Decrease ${label}`,
  filterOptions: "Filter options",
  increaseLabel: (label) => `Increase ${label}`,
  invalid: "invalid",
  loading: "Loading",
  loadingSelection: "Loading…",
  moreInformation: "More information",
  noActions: "No actions available.",
  noCommands: "No matching commands.",
  noOptions: "No matching options.",
  pagination: "Pagination",
  pageLabel: (label, page) => `${label}, page ${page}`,
  previous: "Previous",
  previousPageLabel: (label) => `${label}, previous page`,
  next: "Next",
  nextPageLabel: (label) => `${label}, next page`,
  primaryNavigation: "Primary navigation",
  progress: "Progress",
  readOnly: "read only",
  remove: "Remove",
  removeFileLabel: (name) => `Remove ${name}`,
  required: "required",
  search: "Search",
  searchCommands: "Search commands",
  searchOptions: "Search options",
  selectHint: "Opens a searchable option list",
  selectPlaceholder: "Select an option",
  selecting: "Selecting…",
  tabs: "Tabs",
  uploadDescription: "Choose files from this device."
};

const AurelglyphControlCopyContext = createContext(aurelglyphControlCopy);

export type AurelglyphControlCopyProviderProps = {
  children: ReactNode;
  value: Partial<AurelglyphControlCopy>;
};

export function AurelglyphControlCopyProvider({
  children,
  value
}: AurelglyphControlCopyProviderProps): ReactElement {
  const parent = useAurelglyphControlCopy();
  const resolved = useMemo(() => ({ ...parent, ...value }), [parent, value]);
  return (
    <AurelglyphControlCopyContext.Provider value={resolved}>
      {children}
    </AurelglyphControlCopyContext.Provider>
  );
}

export function useAurelglyphControlCopy(): AurelglyphControlCopy {
  return useContext(AurelglyphControlCopyContext);
}
