import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { Kpi, Badge } from '../components/ui'
import { accountHealth, activeArr, formatMoney, isOpen, pipelineByStage, renewalsDue, weightedPipeline, winRate } from '../domain/metrics'
import { useStore } from '../store/store'

const PIE = ['var(--brand-primary)', 'var(--brand-accent)', 'var(--brand-highlight)', 'var(--brand-neutral)', '#7a5af8', '#f79009', '#12b76a']

export function Dashboard() {
  const { db, now } = useStore()
  const open = db.opportunities.filter(isOpen)
  const wr = winRate(db.opportunities)
  const renewals = renewalsDue(db.subscriptions, 90, now)
  const stages = pipelineByStage(db.opportunities).filter(s => s.stage !== 'Closed Lost')
  const byProduct = db.products.map(p => ({ name: p.name, value: db.subscriptions.filter(s => s.productId === p.id && s.status !== 'Churned').reduce((t, s) => t + s.arr, 0) })).filter(x => x.value > 0)
  const atRisk = db.accounts.filter(a => a.status === 'Customer').map(a => ({ a, h: accountHealth(db, a, now) })).filter(x => x.h.label !== 'Healthy').sort((x, y) => x.h.score - y.h.score)
  return (
    <>
      <div><h1>Revenue overview</h1><div className="sub">Pipeline, recurring revenue and account health across the privacy portfolio.</div></div>
      <div className="grid g4">
        <Kpi label="Active ARR" value={formatMoney(activeArr(db.subscriptions))} />
        <Kpi label="Open pipeline" value={formatMoney(open.reduce((s, o) => s + o.amount, 0))} hint={`${open.length} opportunities`} />
        <Kpi label="Weighted pipeline" value={formatMoney(weightedPipeline(db.opportunities))} />
        <Kpi label="Win rate" value={wr === null ? '—' : `${Math.round(wr * 100)}%`} hint={`${renewals.length} renewals in 90 days`} />
      </div>
      <div className="grid g3">
        <div className="card"><h2>Pipeline by stage</h2>
          <div style={{ height: 260 }}><ResponsiveContainer><BarChart data={stages}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="stage" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} /><YAxis tickFormatter={v => `$${v / 1000}k`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} /><Tooltip formatter={v => formatMoney(Number(v))} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} /><Bar dataKey="amount" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card"><h2>ARR by product</h2>
          <div style={{ height: 260 }}><ResponsiveContainer><PieChart><Pie data={byProduct} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>{byProduct.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip formatter={v => formatMoney(Number(v))} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="card"><h2>Accounts needing attention</h2>
        {atRisk.length === 0 ? <div className="empty">All customer accounts are healthy.</div> : atRisk.map(({ a, h }) => (
          <div key={a.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div><Link to={`/accounts/${a.id}`}><strong>{a.name}</strong></Link><div className="muted">{h.reasons.join(' · ')}</div></div>
            <Badge tone={h.label === 'At risk' ? 'bad' : 'warn'}>{h.label} · {h.score}</Badge>
          </div>))}
      </div>
    </>
  )
}
