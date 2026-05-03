export default function Table({ columns = [], rows = [], onRowClick }) {
  const hasData = Array.isArray(rows) && rows.length > 0;

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {!hasData ? (
            <tr>
              <td colSpan={columns.length} className="muted">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((r, idx) => (
              <tr
                key={r.id || r.invoice_id || idx}
                className={onRowClick ? "rowClickable" : ""}
                onClick={() => onRowClick?.(r)}
              >
                {columns.map((c) => (
                  <td key={c.key}>
                    {typeof c.render === "function" ? c.render(r) : r?.[c.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}