import { useEffect, useId, useRef, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

import { Link } from "./Link.js";

export type ValidationIssue = { id: string; message: ReactNode; fieldId?: string; onFocus?: () => void };
export type ValidationSummaryProps = Omit<HTMLAttributes<HTMLElement>, "children" | "title"> & {
  announcementKey?: string | number;
  announcementLabel?: (title: string, count: number) => string;
  errors: readonly ValidationIssue[];
  focusKey?: string | number;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  title?: string;
};

export function ValidationSummary({ announcementKey, announcementLabel = (heading, count) => `${heading}. ${count} fields need attention`, className, errors, focusKey, headingLevel = 2, id, title = "Check these fields", ...props }: ValidationSummaryProps): ReactElement | null {
  const generatedId = useId();
  const summaryId = id ?? `ag-validation-${generatedId}`;
  const ref = useRef<HTMLElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const seenFocus = useRef(new Set<string | number>());
  const seenAnnouncement = useRef(new Set<string | number>());
  const Heading = `h${headingLevel}` as "h2";
  useEffect(() => {
    if (!errors.length) return;
    if (focusKey !== undefined && !seenFocus.current.has(focusKey)) { seenFocus.current.add(focusKey); ref.current?.focus(); }
    if (announcementKey !== undefined && !seenAnnouncement.current.has(announcementKey)) {
      seenAnnouncement.current.add(announcementKey);
      if (liveRef.current) liveRef.current.textContent = announcementLabel(title, errors.length);
    }
  }, [announcementKey, announcementLabel, errors.length, focusKey, title]);
  if (!errors.length) return null;
  return <section {...props} aria-labelledby={`${summaryId}-title`} className={["ag-validation-summary", className].filter(Boolean).join(" ")} id={summaryId} ref={ref} tabIndex={-1}>
    <Heading className="ag-validation-summary__title" id={`${summaryId}-title`}>{title}</Heading>
    <ul className="ag-validation-summary__list">{errors.map((issue) => <li className="ag-validation-summary__item" key={issue.id}>{issue.fieldId ? <Link className="ag-validation-summary__link" href={`#${encodeURIComponent(issue.fieldId)}`} onClick={(event) => {
      const field = document.getElementById(issue.fieldId ?? "");
      if (field || issue.onFocus) { event.preventDefault(); if (issue.onFocus) issue.onFocus(); else field?.focus(); }
    }}>{issue.message}</Link> : issue.onFocus ? <button className="ag-validation-summary__link" onClick={issue.onFocus} type="button">{issue.message}</button> : issue.message}</li>)}</ul>
    <span aria-live="polite" aria-atomic="true" className="ag-sr-only" ref={liveRef} />
  </section>;
}
