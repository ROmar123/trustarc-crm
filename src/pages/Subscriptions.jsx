import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import DataPage from "../DataPage.jsx";
import { Pill, fmtDate, today, opts } from "../ui.jsx";
import { useStore, money, subscriptionPrice, addPeriod, addDays, nextInvoiceNumber } from "../store.jsx";

const name = (list, id) => list.find((x) => x.id === id)?.name || "—";

export default function Subscriptions({ search, go }) {
  const { state, save } = useStore();
  const [status, setStatus] = useState("");

  function invoiceFor(sub) {
    const route = name(state.routes, sub.routeId);
    const total = subscriptionPrice(state, sub);
    const start = sub.nextPeriodStart;
    save("invoices", {
      number: nextInvoiceNumber(state),
      customerId: sub.customerId,
      subscriptionId: sub.id,
      periodStart: start,
      periodEnd: addDays(addPeriod(start, sub.period), -1),
      issued: today(),
      due: start,
      status: "issued",
      lines: [{ description: `${route} — ${sub.period} × ${sub.seats} seat(s)`, qty: 1, unit: total }],
    });
    save("subscriptions", { ...sub, nextPeriodStart: addPeriod(start, sub.period) });
  }

  const config = {
    kind: "subscriptions",
    noun: "subscription",
    blank: { customerId: "", routeId: "", seats: 1, period: "monthly", status: "active", startDate: today(), nextPeriodStart: today(), priceOverride: "", notes: "" },
    filter: (s) => !status || s.status === status,
    filters: (
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option><option>active</option><option>paused</option><option>cancelled</option>
      </select>
    ),
    match: (s, q, st) => [name(st.customers, s.customerId), name(st.routes, s.routeId)].some((x) => x.toLowerCase().includes(q)),
    prepare: (v) => ({ ...v, seats: Number(v.seats) || 1, priceOverride: v.priceOverride === "" ? "" : Number(v.priceOverride) }),
    columns: [
      { h: "Customer", r: (s, st) => <strong>{name(st.customers, s.customerId)}</strong> },
      { h: "Route", r: (s, st) => name(st.routes, s.routeId) },
      { h: "Seats", num: true, r: (s) => s.seats },
      { h: "Billing", r: (s, st) => <>{money(subscriptionPrice(st, s))}<small>{s.period}</small></> },
      { h: "Next bill", r: (s) => fmtDate(s.nextPeriodStart) },
      { h: "Status", r: (s) => <Pill v={s.status} /> },
      {
        h: "", r: (s) => s.status === "active" && (
          <button className="btn small" title="Create the invoice for the next billing period"
            onClick={(e) => { e.stopPropagation(); if (confirm(`Invoice ${fmtDate(s.nextPeriodStart)} period?`)) { invoiceFor(s); go("billing"); } }}>
            <FilePlus2 size={14} /> Invoice
          </button>
        ),
      },
    ],
    fields: (st) => [
      { key: "customerId", label: "Customer", required: true, options: opts(st.customers, (c) => c.name) },
      { key: "routeId", label: "Route", required: true, options: opts(st.routes.filter((r) => r.active), (r) => r.name) },
      { key: "seats", label: "Seats", type: "number", required: true },
      { key: "period", label: "Billing period", noBlank: true, options: [{ value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }] },
      { key: "startDate", label: "Start date", type: "date" },
      { key: "nextPeriodStart", label: "Next period starts", type: "date" },
      { key: "priceOverride", label: "Price override per period (R, optional)", type: "number" },
      { key: "status", label: "Status", noBlank: true, options: ["active", "paused", "cancelled"].map((v) => ({ value: v, label: v })) },
      { key: "notes", label: "Notes", full: true },
    ],
  };
  return <DataPage config={config} search={search} />;
}
