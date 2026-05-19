import type { HTMLAttributes, ReactElement } from "react";

export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  currentPage: number;
  label?: string;
  onPageChange?: (page: number) => void;
  totalPages: number;
};

export function Pagination({
  className,
  currentPage,
  label = "Pagination",
  onPageChange,
  totalPages,
  ...props
}: PaginationProps): ReactElement {
  const classNames = ["ag-pagination", className].filter(Boolean).join(" ");
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label={label} className={classNames} {...props}>
      <button className="ag-pagination__button" disabled={currentPage <= 1} onClick={() => onPageChange?.(currentPage - 1)} type="button">
        Previous
      </button>
      <div className="ag-pagination__pages">
        {pages.map((page) => (
          <button
            aria-current={page === currentPage ? "page" : undefined}
            className={["ag-pagination__page", page === currentPage ? "is-active" : undefined].filter(Boolean).join(" ")}
            key={page}
            onClick={() => onPageChange?.(page)}
            type="button"
          >
            {page}
          </button>
        ))}
      </div>
      <button
        className="ag-pagination__button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        type="button"
      >
        Next
      </button>
    </nav>
  );
}
