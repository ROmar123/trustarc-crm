import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { Badge, csvDownload, DataTable, Field, Modal, useToast } from '../components/ui'
import { accountHealth } from '../domain/metrics'
import type { Account, Tier } from '../domain/types'
import { newId } from '../store/reducer'
import { useStore } from '../store/store'

const FRAMEWORKS = ['GDPR', 'CCPA', 'POPIA', 'HIPAA', 'LGPD', 'PDPA', 'PCI DSS', 'SOC 2', 'FERPA']

export function Accounts() {
  const { db, now, can, dispatch, me } = useStore()
  const toast = useToast()
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [tier, setTier] = useState('')
  const [creating, setCreating] = useState(false)
  const rows = useMemo(() => db.accounts.filter(a =>
    (!q || `${a.name} ${a.industry}`.toLowerCase().includes(q.toLowerCase())) && (!status || a.status === status) && (!tier || a.tier === tier)), [db.accounts, q, status, tier])
  const owner = (id: string) => db.users.find(u => u.id === id)?.name ?? '—'

  const exportCsv = () => {
    csvDownload('accounts.csv', rows.map(a => ({ Name: a.name, Industry: a.industry, Region: a.region, Tier: a.tier, Status: a.status, Owner: owner(a.ownerId), Frameworks: a.frameworks.join('; ') })))
    dispatch({ type: 'audit.log', entry: { action: 'export', entity: 'account', entityId: '*', summary: `Exported ${rows.length} accounts to CSV` } })
  }
  return (
    <>
      <div className="head"><div><h1>Accounts</h1><div className="sub">{rows.length} of {db.accounts.length} accounts</div></div>
        <div className="row">
          {can('data:export') && <button onClick={exportCsv}><Download size={15} />Export CSV</button>}
          {can('account:write') && <button className="primary" onClick={() => setCreating(true)}><Plus size={15} />New account</button>}
        </div></div>
      <div className="card">
        <div className="filters" style={{ marginBottom: 12 }}>
          <input placeholder="Search name or industry…" aria-label="Search accounts" value={q} onChange={e => setQ(e.target.value)} />
          <select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option>Prospect</option><option>Customer</option><option>Churned</option></select>
          <select aria-label="Tier" value={tier} onChange={e => setTier(e.target.value)}><option value="">All tiers</option><option>Strategic</option><option>Enterprise</option><option>Mid-Market</option></select>
        </div>
        <DataTable rows={rows} empty="No accounts match your filters." cols={[
          { key: 'name', header: 'Account', sort: a => a.name, render: a => <Link to={`/accounts/${a.id}`}><strong>{a.name}</strong></Link> },
          { key: 'industry', header: 'Industry', sort: a => a.industry, render: a => a.industry },
          { key: 'region', header: 'Region', sort: a => a.region, render: a => a.region },
          { key: 'tier', header: 'Tier', sort: a => a.tier, render: a => <Badge>{a.tier}</Badge> },
          { key: 'fw', header: 'Frameworks', render: a => a.frameworks.map(f => <Badge key={f} tone="mute">{f}</Badge>).reduce<React.ReactNode[]>((acc, x) => [...acc, x, ' '], []) },
          { key: 'status', header: 'Status', sort: a => a.status, render: a => <Badge tone={a.status === 'Customer' ? 'good' : a.status === 'Churned' ? 'bad' : undefined}>{a.status}</Badge> },
          { key: 'health', header: 'Health', sort: a => accountHealth(db, a, now).score, render: a => { const h = accountHealth(db, a, now); return a.status === 'Customer' ? <Badge tone={h.label === 'Healthy' ? 'good' : h.label === 'Watch' ? 'warn' : 'bad'}>{h.score}</Badge> : <span className="muted">—</span> } },
          { key: 'owner', header: 'Owner', sort: a => owner(a.ownerId), render: a => owner(a.ownerId) },
        ]} />
      </div>
      {creating && <AccountForm onClose={() => setCreating(false)} onSave={a => { const err = dispatch({ type: 'account.upsert', account: a }); toast(err ?? `Created ${a.name}`, !!err); if (!err) setCreating(false) }} ownerId={me.id} />}
    </>
  )
}

function AccountForm({ onClose, onSave, ownerId }: { onClose: () => void; onSave: (a: Account) => void; ownerId: string }) {
  const { db } = useStore()
  const [f, setF] = useState({ name: '', industry: '', region: 'EMEA', tier: 'Enterprise' as Tier, employees: 500, ownerId, frameworks: [] as string[] })
  const valid = f.name.trim().length > 1 && f.industry.trim().length > 1 && f.employees > 0
  return (
    <Modal title="New account" onClose={onClose}>
      <form className="formgrid" onSubmit={e => { e.preventDefault(); if (valid) onSave({ id: newId('a'), ...f, name: f.name.trim(), industry: f.industry.trim(), status: 'Prospect', createdAt: new Date().toISOString().slice(0, 10) }) }}>
        <Field label="Company name" full><input required autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Industry"><input required value={f.industry} onChange={e => setF({ ...f, industry: e.target.value })} /></Field>
        <Field label="Region"><select value={f.region} onChange={e => setF({ ...f, region: e.target.value })}>{['North America', 'EMEA', 'APAC', 'LATAM'].map(r => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Tier"><select value={f.tier} onChange={e => setF({ ...f, tier: e.target.value as Tier })}><option>Strategic</option><option>Enterprise</option><option>Mid-Market</option></select></Field>
        <Field label="Employees"><input type="number" min={1} value={f.employees} onChange={e => setF({ ...f, employees: Number(e.target.value) })} /></Field>
        <Field label="Owner" full><select value={f.ownerId} onChange={e => setF({ ...f, ownerId: e.target.value })}>{db.users.filter(u => u.active && u.role !== 'read_only').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <div className="full"><div className="muted" style={{ marginBottom: 6, fontWeight: 600, fontSize: 12 }}>Regulatory frameworks</div>
          <div className="row">{FRAMEWORKS.map(fw => <label key={fw} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, fontWeight: 500 }}><input type="checkbox" style={{ width: 'auto' }} checked={f.frameworks.includes(fw)} onChange={e => setF({ ...f, frameworks: e.target.checked ? [...f.frameworks, fw] : f.frameworks.filter(x => x !== fw) })} />{fw}</label>)}</div></div>
        <div className="full row" style={{ justifyContent: 'flex-end' }}><button type="button" onClick={onClose}>Cancel</button><button className="primary" disabled={!valid}>Create account</button></div>
      </form>
    </Modal>
  )
}
