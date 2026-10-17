import { NavLink, Outlet } from 'react-router-dom'
import { Building2, CheckSquare, Gauge, KanbanSquare, Layers, RefreshCw, ScrollText, Users } from 'lucide-react'
import { Logo } from '../brand/Logo'
import { ROLE_LABEL } from '../domain/rbac'
import { useStore } from '../store/store'

const NAV = [
  { to: '/', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/renewals', label: 'Renewals', icon: RefreshCw },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/products', label: 'Products', icon: Layers },
]

export function Layout() {
  const { me, db, can, switchUser, resetDemoData } = useStore()
  return (
    <div className="shell">
      <nav className="side" aria-label="Primary">
        <div className="brandrow"><Logo /> Privacy CRM</div>
        {NAV.map(n => <NavLink key={n.to} to={n.to} end={n.end}><n.icon size={17} />{n.label}</NavLink>)}
        {can('audit:read') && <NavLink to="/audit"><ScrollText size={17} />Audit log</NavLink>}
        {can('user:manage') && <NavLink to="/team"><Users size={17} />Team & access</NavLink>}
        <div className="spacer" />
        <button onClick={() => confirm('Reset all demo data?') && resetDemoData()} style={{ background: 'transparent', color: 'var(--sidebar-text)', borderColor: 'rgba(255,255,255,.2)' }}>Reset demo data</button>
      </nav>
      <div className="main">
        <header className="top">
          <span className="muted">Signed in as <strong style={{ color: 'var(--text)' }}>{me.name}</strong> · {ROLE_LABEL[me.role]}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Demo: switch role
            <select style={{ width: 'auto' }} value={me.id} onChange={e => switchUser(e.target.value)}>
              {db.users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name} — {ROLE_LABEL[u.role]}</option>)}
            </select>
          </label>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
