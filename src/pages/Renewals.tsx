import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, DataTable } from '../components/ui'
import { daysBetween, formatMoney, renewalsDue } from '../domain/metrics'
import { useStore } from '../store/store'

export function Renewals() {
  const { db, now } = useStore()
  const [window, setWindow] = useState(90)
  const rows = renewalsDue(db.subscriptions, window, now)
  const covered = (accId: string) => db.opportunities.some(o => o.accountId === accId && o.type === 'Renewal' && o.stage !== 'Closed Won' && o.stage !== 'Closed Lost')
  return (
    <>
      <div className="head"><div><h1>Renewals</h1><div className="sub">{rows.length} subscriptions · {formatMoney(rows.reduce((s, r) => s + r.arr, 0))} ARR up for renewal</div></div>
        <select style={{ width: 'auto' }} aria-label="Window" value={window} onChange={e => setWindow(Number(e.target.value))}>{[30, 60, 90, 180, 365].map(d => <option key={d} value={d}>Next {d} days</option>)}</select></div>
      <div className="card"><DataTable rows={rows} empty="No renewals in this window." cols={[
        { key: 'acc', header: 'Account', sort: s => db.accounts.find(a => a.id === s.accountId)?.name ?? '', render: s => <Link to={`/accounts/${s.accountId}`}>{db.accounts.find(a => a.id === s.accountId)?.name}</Link> },
        { key: 'prod', header: 'Product', render: s => db.products.find(p => p.id === s.productId)?.name },
        { key: 'arr', header: 'ARR', sort: s => s.arr, render: s => formatMoney(s.arr) },
        { key: 'end', header: 'Renews', sort: s => s.endDate, render: s => `${s.endDate} (${daysBetween(s.endDate, now)}d)` },
        { key: 'opp', header: 'Renewal opp', render: s => covered(s.accountId) ? <Badge tone="good">Open</Badge> : <Badge tone="bad">Missing</Badge> },
      ]} /></div>
    </>
  )
}
