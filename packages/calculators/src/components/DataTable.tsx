type DataTableProps = {
  caption?: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  emptyText?: string;
};

/** Simple table inside a horizontal scroll wrapper (mobile-safe). Text-only cells. */
export function DataTable({ caption, columns, rows, emptyText = "—" }: DataTableProps) {
  return (
    <div className="lc-table-wrap" tabIndex={0} role="region" aria-label={caption || columns.join(", ")}>
      <table className="lc-table">
        {caption ? <caption className="lc-sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyText}</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
