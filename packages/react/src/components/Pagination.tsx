import type { HTMLAttributes, ReactElement } from "react";

export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  boundaryCount?: number;
  currentPage: number;
  disabled?: boolean;
  label?: string;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  totalPages: number;
};

type PaginationItem = number | "ellipsis";

function integerInRange(value: number, fallback: number, maximum: number): number {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.floor(value))) : fallback;
}

function paginationItems(page: number, pageCount: number, boundaryCount: number, siblingCount: number): PaginationItem[] {
  if (pageCount <= 0) return [];
  const visiblePages = new Set<number>();
  const addRange = (start: number, end: number): void => {
    for (let value = Math.max(1, start); value <= Math.min(pageCount, end); value += 1) visiblePages.add(value);
  };

  addRange(1, boundaryCount);
  addRange(pageCount - boundaryCount + 1, pageCount);
  addRange(page - siblingCount, page + siblingCount);

  const edgeWindow = boundaryCount + siblingCount * 2 + 2;
  if (page <= edgeWindow) addRange(1, edgeWindow + 1);
  if (page > pageCount - edgeWindow) addRange(pageCount - edgeWindow, pageCount);

  const sortedPages = [...visiblePages].sort((left, right) => left - right);
  const items: PaginationItem[] = [];
  for (const visiblePage of sortedPages) {
    const previousPage = items.at(-1);
    if (typeof previousPage === "number") {
      if (visiblePage - previousPage === 2) items.push(previousPage + 1);
      else if (visiblePage - previousPage > 2) items.push("ellipsis");
    }
    items.push(visiblePage);
  }
  return items;
}

export function Pagination({
  boundaryCount = 1,
  className,
  currentPage,
  disabled = false,
  label = "Pagination",
  onPageChange,
  siblingCount = 1,
  totalPages,
  ...props
}: PaginationProps): ReactElement {
  const classNames = ["ag-pagination", className].filter(Boolean).join(" ");
  const pageCount = Number.isFinite(totalPages) ? Math.max(0, Math.floor(totalPages)) : 0;
  const finiteCurrentPage = Number.isFinite(currentPage) ? Math.floor(currentPage) : 1;
  const resolvedPage = pageCount === 0 ? 0 : Math.min(pageCount, Math.max(1, finiteCurrentPage));
  const resolvedBoundaryCount = integerInRange(boundaryCount, 1, 5);
  const resolvedSiblingCount = integerInRange(siblingCount, 1, 5);
  const pages = paginationItems(resolvedPage, pageCount, resolvedBoundaryCount, resolvedSiblingCount);
  const requestPage = (page: number): void => {
    if (disabled || pageCount === 0) return;
    const nextPage = Math.min(pageCount, Math.max(1, page));
    if (nextPage !== resolvedPage) onPageChange?.(nextPage);
  };

  return (
    <nav aria-disabled={disabled || undefined} aria-label={label} className={classNames} {...props}>
      <button className="ag-pagination__button" disabled={disabled || resolvedPage <= 1} onClick={() => requestPage(resolvedPage - 1)} type="button">
        Previous
      </button>
      <div className="ag-pagination__pages">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span aria-hidden="true" className="ag-pagination__ellipsis" key={`ellipsis-${index}`}>
              …
            </span>
          ) : (
            <button
              aria-current={page === resolvedPage ? "page" : undefined}
              aria-label={`Page ${page}`}
              className={["ag-pagination__page", page === resolvedPage ? "is-active" : undefined].filter(Boolean).join(" ")}
              disabled={disabled}
              key={page}
              onClick={() => requestPage(page)}
              type="button"
            >
              {page}
            </button>
          )
        )}
      </div>
      <button
        className="ag-pagination__button"
        disabled={disabled || pageCount === 0 || resolvedPage >= pageCount}
        onClick={() => requestPage(resolvedPage + 1)}
        type="button"
      >
        Next
      </button>
    </nav>
  );
}
