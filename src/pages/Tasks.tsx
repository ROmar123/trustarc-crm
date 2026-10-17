import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Badge, DataTable, Field, Modal, useToast } from '../components/ui'
import { daysBetween } from '../domain/metrics'
import { newId } from '../store/reducer'
import { useStore } from '../store/store'

export function Tasks() {
  const { db, now, can, dispatch, me } = useStore(); const toast = useToast()
  const [mine, setMine] = useState(true); const [hideDone, setHideDone] = useState(true); const [creating, setCreating] = useState(false)
  const rows = db.tasks.filter(t => (!mine || t.assigneeId === me.id) && (!hideDone || !t.done)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return (
    <>
      <div className="head"><div><h1>Tasks</h1><div className="sub">{rows.length} shown</div></div>
        <div className="row"><label style={{ flexDirection: 'row', display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={mine} onChange={e => setMine(e.target.checked)} />Assigned to me</label>
          <label style={{ flexDirection: 'row', display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto' }} checked={hideDone} onChange={e => setHideDone(e.target.checked)} />Hide completed</label>
          {can('task:write') && <button className="primary" onClick={() => setCreating(true)}><Plus size={15} />New task</button>}</div></div>
      <div className="card"><DataTable rows={rows} empty="No tasks." cols={[
        { key: 'done', header: '', render: t => <input type="checkbox" style={{ width: 'auto' }} aria-label={`Complete ${t.title}`} disabled={!can('task:write')} checked={t.done} onChange={() => { const e = dispatch({ type: 'task.toggle', id: t.id }); if (e) toast(e, true) }} /> },
        { key: 'title', header: 'Task', render: t => <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span> },
        { key: 'acc', header: 'Account', render: t => <Link to={`/accounts/${t.accountId}`}>{db.accounts.find(a => a.id === t.accountId)?.name}</Link> },
        { key: 'due', header: 'Due', sort: t => t.dueDate, render: t => { const d = daysBetween(t.dueDate, now); return <>{t.dueDate} {!t.done && d < 0 && <Badge tone="bad">{-d}d overdue</Badge>}</> } },
        { key: 'pri', header: 'Priority', render: t => <Badge tone={t.priority === 'High' ? 'bad' : t.priority === 'Medium' ? 'warn' : 'mute'}>{t.priority}</Badge> },
        { key: 'who', header: 'Assignee', render: t => db.users.find(u => u.id === t.assigneeId)?.name },
      ]} /></div>
      {creating && <TaskForm onClose={() => setCreating(false)} onSave={t => { const e = dispatch({ type: 'task.upsert', task: t }); toast(e ?? 'Task created', !!e); if (!e) setCreating(false) }} meId={me.id} />}
    </>
  )
}

function TaskForm({ onClose, onSave, meId }: { onClose: () => void; onSave: (t: import('../domain/types').Task) => void; meId: string }) {
  const { db } = useStore()
  const [f, setF] = useState({ title: '', accountId: db.accounts[0]?.id ?? '', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), priority: 'Medium' as 'High' | 'Medium' | 'Low', assigneeId: meId })
  return (
    <Modal title="New task" onClose={onClose}>
      <form className="formgrid" onSubmit={e => { e.preventDefault(); if (f.title.trim()) onSave({ id: newId('t'), ...f, title: f.title.trim(), done: false }) }}>
        <Field label="Title" full><input required autoFocus value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Account"><select value={f.accountId} onChange={e => setF({ ...f, accountId: e.target.value })}>{db.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        <Field label="Due"><input type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} /></Field>
        <Field label="Priority"><select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value as 'High' | 'Medium' | 'Low' })}><option>High</option><option>Medium</option><option>Low</option></select></Field>
        <Field label="Assignee"><select value={f.assigneeId} onChange={e => setF({ ...f, assigneeId: e.target.value })}>{db.users.filter(u => u.active && u.role !== 'read_only').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <div className="full row" style={{ justifyContent: 'flex-end' }}><button type="button" onClick={onClose}>Cancel</button><button className="primary">Create</button></div>
      </form>
    </Modal>
  )
}
