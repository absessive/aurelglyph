import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
};

export type DataTableProps<Row> = HTMLAttributes<HTMLDivElement> & {
  columns: readonly DataTableColumn<Row>[];
  getRowId: (row: Row, index: number) => string;
  rows: readonly Row[];
};

export function DataTable<Row>({
  className,
  columns,
  getRowId,
  rows,
  ...props
}: DataTableProps<Row>): ReactElement {
  const classNames = ["ag-table-wrap", className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      <table className="ag-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowId(row, rowIndex)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
