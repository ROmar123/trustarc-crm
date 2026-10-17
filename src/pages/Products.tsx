import { formatMoney } from '../domain/metrics'
import { useStore } from '../store/store'

export function Products() {
  const { db } = useStore()
  return (
    <>
      <div><h1>Product catalogue</h1><div className="sub">Privacy platform modules sold and renewed through this CRM.</div></div>
      <div className="grid g2">{db.products.map(p => {
        const subs = db.subscriptions.filter(s => s.productId === p.id && s.status !== 'Churned')
        return <div key={p.id} className="card"><h2>{p.name}</h2><p className="muted">{p.description}</p>
          <div className="row" style={{ justifyContent: 'space-between' }}><span>List ARR <strong>{formatMoney(p.listArr)}</strong></span><span>{subs.length} customers · <strong>{formatMoney(subs.reduce((s, x) => s + x.arr, 0))}</strong> ARR</span></div></div>
      })}</div>
    </>
  )
}
