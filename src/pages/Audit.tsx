import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Badge, csvDownload, DataTable } from '../components/ui'
import { useStore } from '../store/store'

export function Audit() {
  const { db, can, dispatch } = useStore()
  const [action, setAction] = useState(''); const [q, setQ] = useState('')
  const rows = useMemo(() => db.audit.filter(a => (!action || a.action === action) && (!q || a.summary.toLowerCase().includes(q.toLowerCase()))), [db.audit, action, q])
  const who = (id: string) => db.users.find(u => u.id === id)?.name ?? id
  if (!can('audit:read')) return <div className="card empty">You do not have access to the audit log.</div>
  return (
    <>
      <div className="head"><div><h1>Audit log</h1><div className="sub">Immutable record of every change, role switch and export.</div></div>
        {can('data:export') && <button onClick={() => { csvDownload('audit-log.csv', rows.map(r => ({ Time: r.ts, Actor: who(r.actorId), Action: r.action, Entity: r.entity, Summary: r.summary }))); dispatch({ type: 'audit.log', entry: { action: 'export', entity: 'audit', entityId: '*', summary: `Exported ${rows.length} audit entries` } }) }}><Download size={15} />Export CSV</button>}</div>
      <div className="card">
        <div className="filters" style={{ marginBottom: 12 }}><input aria-label="Search audit log" placeholder="Search summary…" value={q} onChange={e => setQ(e.target.value)} />
          <select aria-label="Action" value={action} onChange={e => setAction(e.target.value)}><option value="">All actions</option>{['create', 'update', 'delete', 'stage_change', 'login', 'role_change', 'export'].map(a => <option key={a}>{a}</option>)}</select></div>
        <DataTable rows={rows} pageSize={15} empty="No audit entries yet. Make a change and it will appear here." cols={[
          { key: 'ts', header: 'Time', sort: r => r.ts, render: r => new Date(r.ts).toLocaleString() },
          { key: 'who', header: 'Actor', render: r => who(r.actorId) },
          { key: 'act', header: 'Action', render: r => <Badge tone={r.action === 'delete' ? 'bad' : r.action === 'role_change' || r.action === 'export' ? 'warn' : undefined}>{r.action}</Badge> },
          { key: 'ent', header: 'Entity', render: r => r.entity },
          { key: 'sum', header: 'Summary', render: r => r.summary },
        ]} />
      </div>
    </>
  )
}
