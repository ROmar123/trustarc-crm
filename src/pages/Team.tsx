import { Badge, DataTable, useToast } from '../components/ui'
import { ROLE_LABEL, ROLE_PERMISSIONS } from '../domain/rbac'
import type { Role } from '../domain/types'
import { useStore } from '../store/store'

export function Team() {
  const { db, me, can, dispatch } = useStore(); const toast = useToast()
  if (!can('user:manage')) return <div className="card empty">Administrator access required.</div>
  return (
    <>
      <div><h1>Team & access</h1><div className="sub">Roles map to least-privilege permission sets. All changes are audited.</div></div>
      <div className="card"><DataTable rows={db.users} cols={[
        { key: 'n', header: 'User', render: u => <><strong>{u.name}</strong><div className="muted">{u.email}</div></> },
        { key: 'r', header: 'Role', render: u => <select aria-label={`Role for ${u.name}`} disabled={u.id === me.id} value={u.role} onChange={e => { const err = dispatch({ type: 'user.role', id: u.id, role: e.target.value as Role }); if (err) toast(err, true) }}>{(Object.keys(ROLE_LABEL) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select> },
        { key: 's', header: 'Status', render: u => <Badge tone={u.active ? 'good' : 'mute'}>{u.active ? 'Active' : 'Deactivated'}</Badge> },
        { key: 'a', header: '', render: u => <button disabled={u.id === me.id} onClick={() => { const err = dispatch({ type: 'user.active', id: u.id, active: !u.active }); if (err) toast(err, true) }}>{u.active ? 'Deactivate' : 'Activate'}</button> },
      ]} /></div>
      <div className="card"><h2>Permission matrix</h2><div className="tablewrap"><table><thead><tr><th>Permission</th>{(Object.keys(ROLE_LABEL) as Role[]).map(r => <th key={r}>{ROLE_LABEL[r]}</th>)}</tr></thead>
        <tbody>{ROLE_PERMISSIONS.admin.map(p => <tr key={p}><td>{p}</td>{(Object.keys(ROLE_LABEL) as Role[]).map(r => <td key={r}>{ROLE_PERMISSIONS[r].includes(p) ? '✓' : '—'}</td>)}</tr>)}</tbody></table></div></div>
    </>
  )
}
