import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, Field, Modal, useToast } from '../components/ui'
import { formatMoney } from '../domain/metrics'
import { STAGES, type OppType, type Stage } from '../domain/types'
import { newId } from '../store/reducer'
import { useStore } from '../store/store'

export function Pipeline() {
  const { db, can, dispatch, me } = useStore(); const toast = useToast()
  const [over, setOver] = useState<Stage | null>(null)
  const [lost, setLost] = useState<string | null>(null); const [reason, setReason] = useState('')
  const [creating, setCreating] = useState(false)
  const acct = (id: string) => db.accounts.find(a => a.id === id)?.name ?? '—'
  const writable = can('opportunity:write')
  const move = (id: string, stage: Stage) => {
    if (!writable) return toast('You do not have permission to move deals.', true)
    if (stage === 'Closed Lost') { setLost(id); return }
    const err = dispatch({ type: 'opportunity.stage', id, stage }); if (err) toast(err, true)
  }
  return (
    <>
      <div className="head"><div><h1>Pipeline</h1><div className="sub">Drag deals between stages{writable ? '' : ' (read-only)'}. Every move is audited.</div></div>
        {writable && <button className="primary" onClick={() => setCreating(true)}><Plus size={15} />New opportunity</button>}</div>
      <div className="kanban">
        {STAGES.map(stage => {
          const deals = db.opportunities.filter(o => o.stage === stage)
          return (
            <div key={stage} className={`col ${over === stage ? 'over' : ''}`} onDragOver={e => { e.preventDefault(); setOver(stage) }} onDragLeave={() => setOver(null)}
              onDrop={e => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) move(id, stage) }}>
              <header><span>{stage}</span><span className="muted">{deals.length} · {formatMoney(deals.reduce((s, d) => s + d.amount, 0))}</span></header>
              {deals.map(o => (
                <div key={o.id} className="deal" draggable={writable} onDragStart={e => e.dataTransfer.setData('text/plain', o.id)}>
                  <strong>{o.name}</strong><Link to={`/accounts/${o.accountId}`} className="muted">{acct(o.accountId)}</Link>
                  <div className="row" style={{ justifyContent: 'space-between' }}><strong>{formatMoney(o.amount)}</strong><Badge tone="mute">{o.type}</Badge></div>
                  <span className="muted">Close {o.closeDate}</span>
                  {o.lostReason && <Badge tone="bad">{o.lostReason}</Badge>}
                  {writable && <select aria-label={`Move ${o.name}`} value={o.stage} onChange={e => move(o.id, e.target.value as Stage)}>{STAGES.map(s => <option key={s}>{s}</option>)}</select>}
                </div>))}
            </div>)
        })}
      </div>
      {lost && <Modal title="Mark as lost" onClose={() => { setLost(null); setReason('') }}>
        <Field label="Lost reason (required)"><select value={reason} onChange={e => setReason(e.target.value)}><option value="">Select…</option>{['Budget freeze', 'Chose competitor', 'No decision', 'Project cancelled', 'Compliance scope changed'].map(r => <option key={r}>{r}</option>)}</select></Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button onClick={() => { setLost(null); setReason('') }}>Cancel</button>
          <button className="primary" disabled={!reason} onClick={() => { const err = dispatch({ type: 'opportunity.stage', id: lost, stage: 'Closed Lost', lostReason: reason }); if (err) toast(err, true); setLost(null); setReason('') }}>Confirm</button></div></Modal>}
      {creating && <OppForm ownerId={me.id} onClose={() => setCreating(false)} onSave={o => { const err = dispatch({ type: 'opportunity.upsert', opportunity: o }); toast(err ?? 'Opportunity created', !!err); if (!err) setCreating(false) }} />}
    </>
  )
}

function OppForm({ ownerId, onClose, onSave }: { ownerId: string; onClose: () => void; onSave: (o: import('../domain/types').Opportunity) => void }) {
  const { db } = useStore()
  const [f, setF] = useState({ name: '', accountId: db.accounts[0]?.id ?? '', amount: 25000, closeDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10), type: 'New' as OppType, productIds: [] as string[] })
  const valid = f.name.trim().length > 2 && f.amount > 0 && !!f.accountId
  return (
    <Modal title="New opportunity" onClose={onClose}>
      <form className="formgrid" onSubmit={e => { e.preventDefault(); if (valid) onSave({ id: newId('o'), ...f, name: f.name.trim(), stage: 'Prospecting', ownerId }) }}>
        <Field label="Name" full><input required autoFocus value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Account"><select value={f.accountId} onChange={e => setF({ ...f, accountId: e.target.value })}>{db.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        <Field label="Type"><select value={f.type} onChange={e => setF({ ...f, type: e.target.value as OppType })}><option>New</option><option>Expansion</option><option>Renewal</option></select></Field>
        <Field label="Amount (USD)"><input type="number" min={1} value={f.amount} onChange={e => setF({ ...f, amount: Number(e.target.value) })} /></Field>
        <Field label="Expected close"><input type="date" value={f.closeDate} onChange={e => setF({ ...f, closeDate: e.target.value })} /></Field>
        <div className="full"><div className="muted" style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Products</div><div className="row">{db.products.map(p => <label key={p.id} style={{ display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center', fontWeight: 500 }}><input type="checkbox" style={{ width: 'auto' }} checked={f.productIds.includes(p.id)} onChange={e => setF({ ...f, productIds: e.target.checked ? [...f.productIds, p.id] : f.productIds.filter(x => x !== p.id) })} />{p.name}</label>)}</div></div>
        <div className="full row" style={{ justifyContent: 'flex-end' }}><button type="button" onClick={onClose}>Cancel</button><button className="primary" disabled={!valid}>Create</button></div>
      </form>
    </Modal>
  )
}

export type { Stage }
