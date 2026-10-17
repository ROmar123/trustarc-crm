import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Badge, useToast } from '../components/ui'
import { accountHealth, daysBetween, formatMoney } from '../domain/metrics'
import type { Note } from '../domain/types'
import { newId } from '../store/reducer'
import { useStore } from '../store/store'

export function AccountDetail() {
  const { id } = useParams(); const nav = useNavigate(); const toast = useToast()
  const { db, now, can, dispatch, me } = useStore()
  const [body, setBody] = useState(''); const [kind, setKind] = useState<Note['kind']>('Note')
  const a = db.accounts.find(x => x.id === id)
  if (!a) return <div className="card empty">Account not found. <Link to="/accounts">Back to accounts</Link></div>
  const h = accountHealth(db, a, now)
  const subs = db.subscriptions.filter(s => s.accountId === a.id)
  const opps = db.opportunities.filter(o => o.accountId === a.id)
  const name = (uid: string) => db.users.find(u => u.id === uid)?.name ?? '—'
  const product = (pid: string) => db.products.find(p => p.id === pid)?.name ?? pid
  const addNote = () => {
    if (!body.trim()) return
    const err = dispatch({ type: 'note.add', note: { id: newId('n'), accountId: a.id, authorId: me.id, kind, body: body.trim(), createdAt: new Date().toISOString().slice(0, 10) } })
    if (err) toast(err, true); else setBody('')
  }
  return (
    <>
      <div className="head"><div><Link to="/accounts">← Accounts</Link><h1>{a.name}</h1>
        <div className="sub">{a.industry} · {a.region} · {a.employees.toLocaleString()} employees · Owner {name(a.ownerId)}</div></div>
        <div className="row"><Badge>{a.tier}</Badge><Badge tone={a.status === 'Customer' ? 'good' : a.status === 'Churned' ? 'bad' : undefined}>{a.status}</Badge>
          {can('account:delete') && <button className="danger" onClick={() => { if (confirm(`Delete ${a.name} and all related records? This is logged.`)) { const err = dispatch({ type: 'account.delete', id: a.id }); if (err) toast(err, true); else nav('/accounts') } }}><Trash2 size={15} />Delete</button>}</div></div>
      <div className="grid g3">
        <div className="grid">
          <div className="card"><h2>Subscriptions</h2>
            {subs.length === 0 ? <div className="empty">No subscriptions.</div> : subs.map(s => <div key={s.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}><span>{product(s.productId)}<div className="muted">Ends {s.endDate} ({daysBetween(s.endDate, now)}d)</div></span><span className="row"><strong>{formatMoney(s.arr)}</strong><Badge tone={s.status === 'Active' ? 'good' : s.status === 'Churned' ? 'bad' : 'warn'}>{s.status}</Badge></span></div>)}</div>
          <div className="card"><h2>Opportunities</h2>
            {opps.length === 0 ? <div className="empty">No opportunities.</div> : opps.map(o => <div key={o.id} className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}><span>{o.name}<div className="muted">{o.type} · close {o.closeDate}</div></span><span className="row"><strong>{formatMoney(o.amount)}</strong><Badge>{o.stage}</Badge></span></div>)}</div>
          <div className="card"><h2>Activity</h2>
            {can('note:write') && <div className="row" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
              <select style={{ width: 110 }} aria-label="Activity type" value={kind} onChange={e => setKind(e.target.value as Note['kind'])}>{['Note', 'Call', 'Meeting', 'Email'].map(k => <option key={k}>{k}</option>)}</select>
              <textarea rows={2} style={{ flex: 1, minWidth: 200 }} aria-label="Activity details" placeholder="Log an interaction…" value={body} onChange={e => setBody(e.target.value)} />
              <button className="primary" onClick={addNote} disabled={!body.trim()}>Log</button></div>}
            <div className="tl">{db.notes.filter(n => n.accountId === a.id).map(n => <div key={n.id}><strong>{n.kind}</strong> · {n.createdAt} · {name(n.authorId)}<div>{n.body}</div></div>)}</div>
            {db.notes.every(n => n.accountId !== a.id) && <div className="empty">No activity yet.</div>}</div>
        </div>
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card"><h2>Health</h2>{a.status !== 'Customer' ? <div className="muted">Health scoring applies to customers.</div> : <>
            <div className="row"><Badge tone={h.label === 'Healthy' ? 'good' : h.label === 'Watch' ? 'warn' : 'bad'}>{h.label}</Badge><strong>{h.score}/100</strong></div>
            <ul className="muted">{h.reasons.length ? h.reasons.map(r => <li key={r}>{r}</li>) : <li>No risk signals.</li>}</ul></>}</div>
          <div className="card"><h2>Frameworks</h2><div className="row">{a.frameworks.map(f => <Badge key={f} tone="mute">{f}</Badge>)}</div></div>
          <div className="card"><h2>Contacts</h2>{db.contacts.filter(c => c.accountId === a.id).map(c => <div key={c.id} style={{ padding: '6px 0' }}><strong>{c.name}</strong> <Badge tone="mute">{c.role}</Badge><div className="muted">{c.title} · {c.email}</div></div>)}
            {db.contacts.every(c => c.accountId !== a.id) && <div className="empty">No contacts.</div>}</div>
        </div>
      </div>
    </>
  )
}
