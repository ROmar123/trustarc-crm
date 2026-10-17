import { useState } from "react";
import { Plus, Printer, CreditCard } from "lucide-react";
import { Modal, EntityForm, Pill, Empty, fmtDate, today, opts } from "../ui.jsx";
import { useStore, money, invoiceTotal, invoicePaid, invoiceBalance, invoiceState } from "../store.jsx";

export default function Billing({ search }) {
  const { state, save, remove } = useStore();
  const [tab, setTab] = useState("invoices");
  const [openInv, setOpenInv] = useState(null);
  const [paying, setPaying] = useState(null);
  const q = search.toLowerCase();
  const cust = (id) => state.customers.find((c) => c.id === id)?.name || "—";
  const invs = state.invoices.filter((i) => !q || i.number.toLowerCase().includes(q) || cust(i.customerId).toLowerCase().includes(q));
  const pays = state.payments.filter((p) => !q || cust(p.customerId).toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q));
  const outstanding = state.invoices.reduce((s, i) => s + invoiceBalance(state, i), 0);
  const overdue = state.invoices.filter((i) => invoiceState(state, i) === "overdue");

  const payFields = [
    { key: "customerId", label: "Customer", required: true, options: opts(state.customers, (c) => c.name) },
    { key: "invoiceId", label: "Apply to invoice (blank = credit)", options: opts(state.invoices.filter((i) => invoiceBalance(state, i) > 0 || i.id === paying?.invoiceId), (i) => `${i.number} · ${cust(i.customerId)} · ${money(invoiceBalance(state, i))} due`) },
    { key: "amount", label: "Amount (R)", type: "number", required: true },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "method", label: "Method", noBlank: true, options: ["EFT", "Cash", "Card", "PayFast"].map((v) => ({ value: v, label: v })) },
    { key: "reference", label: "Reference" },
  ];

  function savePayment(v) {
    const inv = state.invoices.find((i) => i.id === v.invoiceId);
    save("payments", { ...v, customerId: inv ? inv.customerId : v.customerId, amount: Number(v.amount) || 0 });
    setPaying(null);
  }

  return (
    <>
      <div className="stats">
        <div className="stat"><small>Outstanding</small><strong>{money(outstanding)}</strong><span>{state.invoices.filter((i) => invoiceBalance(state, i) > 0).length} open invoices</span></div>
        <div className="stat"><small>Overdue</small><strong className={overdue.length ? "late" : ""}>{money(overdue.reduce((s, i) => s + invoiceBalance(state, i), 0))}</strong><span>{overdue.length} invoices</span></div>
        <div className="stat"><small>Received</small><strong>{money(state.payments.reduce((s, p) => s + p.amount, 0))}</strong><span>{state.payments.length} payments</span></div>
      </div>
      <div className="toolbar">
        {["invoices", "payments"].map((t) => <button key={t} className={"chip" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>)}
        <span className="grow" />
        <button className="btn primary" onClick={() => setPaying({ customerId: "", invoiceId: "", amount: "", date: today(), method: "EFT", reference: "" })}>
          <Plus size={16} /> Record payment
        </button>
      </div>

      {tab === "invoices" ? (
        <div className="card flush">
          <table>
            <thead><tr><th>Invoice</th><th>Customer</th><th>Period</th><th>Due</th><th className="num">Total</th><th className="num">Balance</th><th>Status</th></tr></thead>
            <tbody>
              {invs.map((i) => (
                <tr key={i.id} onClick={() => setOpenInv(i.id)}>
                  <td><strong>{i.number}</strong></td><td>{cust(i.customerId)}</td>
                  <td>{fmtDate(i.periodStart)} – {fmtDate(i.periodEnd)}</td><td>{fmtDate(i.due)}</td>
                  <td className="num">{money(invoiceTotal(i))}</td><td className="num">{money(invoiceBalance(state, i))}</td>
                  <td><Pill v={invoiceState(state, i)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!invs.length && <Empty>No invoices yet — create them from the Subscriptions page.</Empty>}
        </div>
      ) : (
        <div className="card flush">
          <table>
            <thead><tr><th>Date</th><th>Customer</th><th>Applied to</th><th>Method</th><th>Reference</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {pays.map((p) => (
                <tr key={p.id} onClick={() => setPaying(p)}>
                  <td>{fmtDate(p.date)}</td><td>{cust(p.customerId)}</td>
                  <td>{state.invoices.find((i) => i.id === p.invoiceId)?.number || <span className="muted">Credit</span>}</td>
                  <td>{p.method}</td><td>{p.reference}</td><td className="num">{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pays.length && <Empty>No payments recorded.</Empty>}
        </div>
      )}

      {paying && (
        <Modal title={paying.id ? "Edit payment" : "Record payment"} onClose={() => setPaying(null)}>
          <EntityForm fields={payFields} initial={paying} onCancel={() => setPaying(null)} onSave={savePayment}
            onDelete={paying.id ? () => { if (confirm("Delete this payment?")) { remove("payments", paying.id); setPaying(null); } } : null} />
        </Modal>
      )}
      {openInv && <InvoiceModal id={openInv} onClose={() => setOpenInv(null)} onPay={(inv) => { setOpenInv(null); setPaying({ customerId: inv.customerId, invoiceId: inv.id, amount: invoiceBalance(state, inv), date: today(), method: "EFT", reference: inv.number }); }} />}
    </>
  );
}

function InvoiceModal({ id, onClose, onPay }) {
  const { state, save, remove } = useStore();
  const inv = state.invoices.find((i) => i.id === id);
  if (!inv) return null;
  const c = state.customers.find((x) => x.id === inv.customerId);
  const st = invoiceState(state, inv);
  const del = () => {
    if (!confirm("Delete this invoice?")) return;
    const why = remove("invoices", inv.id);
    if (why) alert(`Can't delete: ${why}. Void it instead.`); else onClose();
  };
  return (
    <Modal wide title={inv.number} onClose={onClose}>
      <div className="invoice">
        <div className="inv-head"><div><h2>TrustArc</h2><small>Tax invoice</small></div><div className="r"><strong>{inv.number}</strong><Pill v={st} /></div></div>
        <div className="inv-meta">
          <div><small>Billed to</small><strong>{c?.name}</strong><div>{c?.email}</div><div>{c?.phone}</div></div>
          <div><small>Issued</small>{fmtDate(inv.issued)}<small>Due</small>{fmtDate(inv.due)}<small>Period</small>{fmtDate(inv.periodStart)} – {fmtDate(inv.periodEnd)}</div>
        </div>
        <table>
          <thead><tr><th>Description</th><th className="num">Qty</th><th className="num">Unit</th><th className="num">Total</th></tr></thead>
          <tbody>{inv.lines.map((l, i) => <tr key={i}><td>{l.description}</td><td className="num">{l.qty}</td><td className="num">{money(l.unit)}</td><td className="num">{money(l.qty * l.unit)}</td></tr>)}</tbody>
        </table>
        <div className="totals"><span>Total</span><b>{money(invoiceTotal(inv))}</b><span>Paid</span><b>{money(invoicePaid(state, inv))}</b><span>Balance due</span><b>{money(invoiceBalance(state, inv))}</b></div>
      </div>
      <div className="actions noprint">
        <button className="btn danger" onClick={del}>Delete</button>
        {inv.status !== "void" ? <button className="btn" onClick={() => confirm("Void this invoice?") && save("invoices", { ...inv, status: "void" })}>Void</button> : <button className="btn" onClick={() => save("invoices", { ...inv, status: "issued" })}>Reinstate</button>}
        <span className="grow" />
        <button className="btn" onClick={() => window.print()}><Printer size={16} /> Print</button>
        {invoiceBalance(state, inv) > 0 && <button className="btn primary" onClick={() => onPay(inv)}><CreditCard size={16} /> Record payment</button>}
      </div>
    </Modal>
  );
}
