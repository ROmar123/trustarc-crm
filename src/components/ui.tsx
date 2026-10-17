import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export function Badge({ tone, children }: { tone?: 'good' | 'warn' | 'bad' | 'mute'; children: ReactNode }) {
  return <span className={`badge ${tone ?? ''}`}>{children}</span>
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <div className="card kpi"><div className="l">{label}</div><div className="v">{value}</div>{hint && <div className="muted">{hint}</div>}</div>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="head"><h2 style={{ margin: 0 }}>{title}</h2><button onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return <label className={full ? 'full' : ''}>{label}{children}</label>
}

const ToastCtx = createContext<(msg: string, isError?: boolean) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; err: boolean } | null>(null)
  const show = useCallback((msg: string, err = false) => setT({ msg, err }), [])
  useEffect(() => { if (!t) return; const id = setTimeout(() => setT(null), 3500); return () => clearTimeout(id) }, [t])
  const v = useMemo(() => show, [show])
  return <ToastCtx.Provider value={v}>{children}{t && <div className={`toast ${t.err ? 'err' : ''}`} role="status">{t.msg}</div>}</ToastCtx.Provider>
}

export interface Col<T> { key: string; header: string; render: (r: T) => ReactNode; sort?: (r: T) => string | number }
export function DataTable<T extends { id: string }>({ rows, cols, empty = 'Nothing to show.', pageSize = 10 }: { rows: T[]; cols: Col<T>[]; empty?: string; pageSize?: number }) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [dir, setDir] = useState<1 | -1>(1)
  const [page, setPage] = useState(0)
  const sorted = useMemo(() => {
    const c = cols.find(x => x.key === sortKey)
    if (!c?.sort) return rows
    const f = c.sort
    return [...rows].sort((a, b) => (f(a) > f(b) ? 1 : f(a) < f(b) ? -1 : 0) * dir)
  }, [rows, cols, sortKey, dir])
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const cur = Math.min(page, pages - 1)
  const slice = sorted.slice(cur * pageSize, cur * pageSize + pageSize)
  if (rows.length === 0) return <div className="empty">{empty}</div>
  return (
    <div>
      <div className="tablewrap"><table>
        <thead><tr>{cols.map(c => (
          <th key={c.key} className={c.sort ? 'sortable' : ''} aria-sort={sortKey === c.key ? (dir === 1 ? 'ascending' : 'descending') : undefined}
            onClick={() => c.sort && (sortKey === c.key ? setDir(d => (d === 1 ? -1 : 1)) : (setSortKey(c.key), setDir(1)))}>
            {c.header}{sortKey === c.key ? (dir === 1 ? ' ▲' : ' ▼') : ''}
          </th>))}</tr></thead>
        <tbody>{slice.map(r => <tr key={r.id}>{cols.map(c => <td key={c.key}>{c.render(r)}</td>)}</tr>)}</tbody>
      </table></div>
      {pages > 1 && <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
        <span className="muted">{sorted.length} records</span>
        <span className="row"><button disabled={cur === 0} onClick={() => setPage(cur - 1)}>Prev</button><span>{cur + 1} / {pages}</span><button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button></span>
      </div>}
    </div>
  )
}

export const csvDownload = (name: string, rows: Record<string, string | number>[]): void => {
  if (rows.length === 0) return
  const keys = Object.keys(rows[0])
  // Prefix formula-trigger characters so spreadsheets don't execute injected content.
  const esc = (v: string | number) => { let s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"` }
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
