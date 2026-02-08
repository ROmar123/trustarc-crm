export default function Table({ columns, rows, onRowClick }) {
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 24, color: "var(--muted)" }}>
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)}>
                {columns.map((c) => (
                  <td key={c.key}>{row[c.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}