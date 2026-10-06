import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from "react";

/** Overrideable copy for text and generated accessibility labels owned by native controls. */
export type AurelglyphControlCopy = {
  actions: string;
  accordion: string;
  clear: string;
  clearSearch: string;
  clearRating: string;
  close: string;
  closeLabel: (title: string) => string;
  commandPalette: string;
  decreaseLabel: (label: string) => string;
  expanded: string;
  collapsed: string;
  externalLink: string;
  filterOptions: string;
  increaseLabel: (label: string) => string;
  invalid: string;
  hidePasswordLabel: (label: string) => string;
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
  removeChipLabel: (label: string) => string;
  rating: string;
  ratingOptionLabel: (value: number, max: number) => string;
  ratingValueLabel: (value: number, max: number) => string;
  required: string;
  search: string;
  searchCommands: string;
  searchOptions: string;
  selectHint: string;
  selected: string;
  selectPlaceholder: string;
  selecting: string;
  tabs: string;
  showPasswordLabel: (label: string) => string;
  stepper: string;
  stepState: (state: "current" | "completed" | "upcoming" | "error") => string;
  stepLabel: (label: string, position: number, total: number, state: string) => string;
  unavailable: string;
  uploadDescription: string;
  validationSummary: string;
  validationSummaryAnnouncement: (title: string, count: number) => string;
};

export const aurelglyphControlCopy: AurelglyphControlCopy = {
  actions: "Actions",
  accordion: "Sections",
  clear: "Clear",
  clearSearch: "Clear search",
  clearRating: "Clear rating",
  close: "Close",
  closeLabel: (title) => `Close ${title}`,
  commandPalette: "Command palette",
  decreaseLabel: (label) => `Decrease ${label}`,
  expanded: "expanded",
  collapsed: "collapsed",
  externalLink: "Opens an external link",
  filterOptions: "Filter options",
  increaseLabel: (label) => `Increase ${label}`,
  invalid: "invalid",
  hidePasswordLabel: (label) => `Hide ${label}`,
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
  removeChipLabel: (label) => `Remove ${label}`,
  rating: "Rating",
  ratingOptionLabel: (value, max) => `${value} of ${max}`,
  ratingValueLabel: (value, max) => `${value} of ${max}`,
  required: "required",
  search: "Search",
  searchCommands: "Search commands",
  searchOptions: "Search options",
  selectHint: "Opens a searchable option list",
  selected: "selected",
  selectPlaceholder: "Select an option",
  selecting: "Selecting…",
  tabs: "Tabs",
  showPasswordLabel: (label) => `Show ${label}`,
  stepper: "Steps",
  stepState: (state) => ({ current: "Current", completed: "Completed", upcoming: "Upcoming", error: "Needs attention" })[state],
  stepLabel: (label, position, total, state) => `${label}, step ${position} of ${total}, ${state}`,
  unavailable: "unavailable",
  uploadDescription: "Choose files from this device.",
  validationSummary: "Check these fields",
  validationSummaryAnnouncement: (title, count) => `${title}. ${count} ${count === 1 ? "error" : "errors"}.`
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
