import { useStore, money, invoiceBalance, invoiceState, subscriptionPrice, addDays } from "../store.jsx";
import { fmtDate, today } from "../ui.jsx";

export default function Overview({ go }) {
  const { state: s } = useStore();
  const active = s.subscriptions.filter((x) => x.status === "active");
  const mrr = active.reduce((t, x) => t + subscriptionPrice(s, x) * (x.period === "weekly" ? 52 / 12 : 1), 0);
  const outstanding = s.invoices.reduce((t, i) => t + invoiceBalance(s, i), 0);
  const overdue = s.invoices.filter((i) => invoiceState(s, i) === "overdue");
  const dueToBill = active.filter((x) => x.nextPeriodStart <= today());
  const cust = (id) => s.customers.find((c) => c.id === id)?.name || "—";
  const weekAhead = addDays(today(), 7);
  const trips = s.trips.filter((t) => t.status === "scheduled" && t.date >= today() && t.date <= weekAhead).sort((a, b) => a.date.localeCompare(b.date));
  const expiring = s.drivers.filter((d) => d.licenceExpiry && d.licenceExpiry <= addDays(today(), 30) && d.status === "active");

  const stats = [
    ["Monthly recurring", money(mrr), `${active.length} active subscriptions`, "subscriptions"],
    ["Outstanding", money(outstanding), `${s.invoices.filter((i) => invoiceBalance(s, i) > 0).length} open invoices`, "billing"],
    ["Overdue", money(overdue.reduce((t, i) => t + invoiceBalance(s, i), 0)), `${overdue.length} invoices`, "billing"],
    ["Ready to invoice", dueToBill.length, "subscriptions due", "subscriptions"],
    ["Customers", s.customers.filter((c) => c.status === "active").length, `${s.routes.filter((r) => r.active).length} routes`, "customers"],
  ];
  return (
    <>
      <div className="stats">
        {stats.map(([l, v, sub, to]) => <button key={l} className="stat" onClick={() => go(to)}><small>{l}</small><strong>{v}</strong><span>{sub}</span></button>)}
      </div>
      <div className="cols">
        <section className="card">
          <h3>Needs invoicing</h3>
          {dueToBill.map((x) => <div className="line" key={x.id}><span>{cust(x.customerId)}</span><small>{fmtDate(x.nextPeriodStart)}</small></div>)}
          {!dueToBill.length && <p className="muted">Nothing due.</p>}
          <h3 style={{ marginTop: 18 }}>Overdue invoices</h3>
          {overdue.map((i) => <div className="line" key={i.id}><span>{i.number} · {cust(i.customerId)}</span><b className="late">{money(invoiceBalance(s, i))}</b></div>)}
          {!overdue.length && <p className="muted">None 🎉</p>}
        </section>
        <section className="card">
          <h3>Trips this week</h3>
          {trips.map((t) => <div className="line" key={t.id}><span>{s.routes.find((r) => r.id === t.routeId)?.name}</span><small>{fmtDate(t.date)}</small></div>)}
          {!trips.length && <p className="muted">No scheduled trips.</p>}
          <h3 style={{ marginTop: 18 }}>Licences expiring (30 days)</h3>
          {expiring.map((d) => <div className="line" key={d.id}><span>{d.name}</span><small className="late">{fmtDate(d.licenceExpiry)}</small></div>)}
          {!expiring.length && <p className="muted">All current.</p>}
        </section>
      </div>
    </>
  );
}
