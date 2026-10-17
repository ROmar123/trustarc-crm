import { useState } from "react";
import DataPage from "../DataPage.jsx";
import { Pill, fmtDate } from "../ui.jsx";
import { money, customerBalance, customerCredit, invoiceTotal } from "../store.jsx";

const config = {
  kind: "customers",
  noun: "customer",
  blank: { type: "individual", name: "", email: "", phone: "", status: "active", notes: "" },
  match: (c, q) => [c.name, c.email, c.phone].some((x) => (x || "").toLowerCase().includes(q)),
  columns: [
    { h: "Customer", r: (c) => <><strong>{c.name}</strong><small>{c.type}</small></> },
    { h: "Email", r: (c) => c.email },
    { h: "Phone", r: (c) => c.phone },
    { h: "Status", r: (c) => <Pill v={c.status} /> },
    { h: "Owing", num: true, r: (c, s) => { const b = customerBalance(s, c.id); return b > 0 ? <span className="late">{money(b)}</span> : money(0); } },
    { h: "Credit", num: true, r: (c, s) => money(customerCredit(s, c.id)) },
  ],
  fields: () => [
    { key: "name", label: "Name", required: true, full: true },
    { key: "type", label: "Type", noBlank: true, options: [{ value: "individual", label: "Individual" }, { value: "company", label: "Company" }] },
    { key: "status", label: "Status", noBlank: true, options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "notes", label: "Notes", full: true },
  ],
  extra: (c, s) => {
    const subs = s.subscriptions.filter((x) => x.customerId === c.id);
    const invs = s.invoices.filter((x) => x.customerId === c.id);
    const route = (id) => s.routes.find((r) => r.id === id)?.name || "—";
    return (
      <div className="related">
        <h4>Subscriptions</h4>
        {subs.map((x) => <div className="line" key={x.id}><span>{route(x.routeId)} · {x.seats} seat(s) · {x.period}</span><Pill v={x.status} /></div>)}
        {!subs.length && <p className="muted">None.</p>}
        <h4>Invoices</h4>
        {invs.map((x) => <div className="line" key={x.id}><span>{x.number} · {fmtDate(x.periodStart)}</span><span>{money(invoiceTotal(x))}</span></div>)}
        {!invs.length && <p className="muted">None.</p>}
      </div>
    );
  },
};

export default function Customers({ search }) {
  const [status, setStatus] = useState("");
  const cfg = {
    ...config,
    filter: (c) => !status || c.status === status,
    filters: (
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
      </select>
    ),
  };
  return <DataPage config={cfg} search={search} />;
}
