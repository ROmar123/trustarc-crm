import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Card from "../components/ui/Card.jsx";

/** ✅ Match your real DB */
const INVOICE_LINES_TABLE = "invoice_lines";

function money(n) {
  const v = Number(n || 0);
  return `R ${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isoDate(d) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** tiny icons (inline, no deps) */
function Icon({ kind }) {
  const common = {
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (kind === "invoice")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h6" />
      </svg>
    );
  if (kind === "paid")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l3 3 5-7" />
      </svg>
    );
  if (kind === "due")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  if (kind === "send")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4z" />
      </svg>
    );
  if (kind === "lines")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  if (kind === "view")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  if (kind === "cash")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M2 7h20v10H2z" />
        <path d="M6 11h.01" />
        <path d="M18 13h.01" />
        <path d="M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z" />
      </svg>
    );
  return null;
}

function StatusBadge({ tone, children }) {
  const bg =
    tone === "green"
      ? "rgba(65, 230, 155, .14)"
      : tone === "amber"
      ? "rgba(255, 186, 0, .14)"
      : tone === "red"
      ? "rgba(255, 90, 90, .14)"
      : "rgba(255,255,255,.08)";
  const border =
    tone === "green"
      ? "rgba(65, 230, 155, .22)"
      : tone === "amber"
      ? "rgba(255, 186, 0, .20)"
      : tone === "red"
      ? "rgba(255, 90, 90, .20)"
      : "rgba(255,255,255,.10)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        color: "rgba(255,255,255,.90)",
        fontSize: 12,
        fontWeight: 850,
        letterSpacing: ".2px",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background:
            tone === "green"
              ? "rgba(65, 230, 155, 1)"
              : tone === "amber"
              ? "rgba(255, 186, 0, 1)"
              : tone === "red"
              ? "rgba(255, 90, 90, 1)"
              : "rgba(255,255,255,.35)",
        }}
      />
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modalBox" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div className="modalTitle">{title}</div>
          <button className="btn btnGhost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function Billing({ setView, setContext, context }) {
  const [from, setFrom] = useState(() => isoDate(startOfMonth(new Date())));
  const [to, setTo] = useState(() => isoDate(endOfMonth(new Date())));

  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState({ invoiced: 0, paid: 0, due: 0, pending: 0 });

  const [showLines, setShowLines] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const [invoiceLines, setInvoiceLines] = useState([]);
  const [lineForm, setLineForm] = useState({ description: "", qty: 1, unit_price: 0 });

  // New invoice modal + picker
  const [showCreate, setShowCreate] = useState(false);
  const [customersPick, setCustomersPick] = useState([]);

  const [createForm, setCreateForm] = useState({
    customer_id: "",
    invoice_number: "",
    status: "issued",
    period_start: from,
    period_end: to,
  });

  // ✅ Last payment per invoice (for display on Billing list)
  const [lastPayByInvoice, setLastPayByInvoice] = useState({});

  // ✅ PAYMENT MODAL (aligned to your SQL schema)
  const [showPayment, setShowPayment] = useState(false);
  const [payInvoice, setPayInvoice] = useState(null);
  const [payForm, setPayForm] = useState({
    paid_on: isoDate(new Date()),
    amount: "",
    provider: "eft",
    provider_reference: "",
  });

  function openCreateModal() {
    setCreateForm({
      customer_id: "",
      invoice_number: "",
      status: "issued",
      period_start: from,
      period_end: to,
    });
    setShowCreate(true);
  }

  function openPaymentModal(invRow) {
    const outstanding = Number(invRow?.outstanding_amount || 0);
    setPayInvoice(invRow);
    setPayForm({
      paid_on: isoDate(new Date()),
      amount: outstanding > 0 ? String(outstanding.toFixed(2)) : "",
      provider: "eft",
      provider_reference: invRow?.invoice_display || "",
    });
    setShowPayment(true);
  }

  function statusTone(invoiceStatus, outstandingAmount) {
    const s = String(invoiceStatus || "").toLowerCase();
    const due = Number(outstandingAmount || 0) > 0.01;

    if (s === "paid") return "green";
    if (s === "overdue") return "red";
    if (s === "partially_paid") return "amber";
    if (due) return "red";
    return "muted";
  }

  function statusLabel(invoiceStatus, outstandingAmount) {
    const s = String(invoiceStatus || "").toUpperCase();
    const due = Number(outstandingAmount || 0) > 0.01;
    return due && s !== "PAID" ? `${s} • DUE` : s || "—";
  }

  function providerLabel(p) {
    const x = String(p || "").toLowerCase();
    if (x === "eft") return "EFT";
    if (x === "cash") return "Cash";
    if (x === "payfast") return "PayFast";
    if (x === "other") return "Other";
    return "—";
  }

  async function loadCustomersPicker() {
    const { data, error } = await supabase
      .from("customers")
      .select("customer_id, display_name, email")
      .eq("status", "active")
      .order("display_name", { ascending: true })
      .limit(2000);

    if (error) {
      setToast(error.message);
      setCustomersPick([]);
      return;
    }

    setCustomersPick(data || []);
  }

  async function createInvoice() {
    setToast("");
    if (!createForm.customer_id) return setToast("Pick a customer.");

    const payload = {
      customer_id: createForm.customer_id,
      invoice_number: createForm.invoice_number?.trim() ? createForm.invoice_number.trim() : null,
      status: createForm.status,
      period_start: createForm.period_start,
      period_end: createForm.period_end,
    };

    const { data, error } = await supabase.from("invoices").insert(payload).select().single();
    if (error) return setToast(error.message);

    setShowCreate(false);
    await load();

    setActiveInvoice({
      ...data,
      invoice_display: data.invoice_number || `#${String(data.invoice_id).slice(0, 8)}`,
    });
    setShowLines(true);
    await loadInvoiceLines(data.invoice_id);
  }

  async function loadInvoiceLines(invoice_id) {
    setToast("");

    const { data, error } = await supabase
      .from(INVOICE_LINES_TABLE)
      .select("invoice_line_id, invoice_id, description, qty, unit_price, line_total, created_at")
      .eq("invoice_id", invoice_id)
      .order("created_at", { ascending: true });

    if (error) {
      setToast(error.message);
      setInvoiceLines([]);
      return;
    }

    setInvoiceLines(data || []);
  }

  async function addLine() {
    if (!activeInvoice?.invoice_id) return;

    setToast("");

    const qty = Number(lineForm.qty || 0);
    const unit = Number(lineForm.unit_price || 0);

    if (!lineForm.description?.trim()) return setToast("Line needs a description.");
    if (qty <= 0) return setToast("Qty must be > 0.");

    const payload = {
      invoice_id: activeInvoice.invoice_id,
      description: lineForm.description.trim(),
      qty,
      unit_price: unit,
    };

    const { error } = await supabase.from(INVOICE_LINES_TABLE).insert(payload);
    if (error) return setToast(error.message);

    setLineForm({ description: "", qty: 1, unit_price: 0 });

    await loadInvoiceLines(activeInvoice.invoice_id);
    await load();
  }

  async function deleteLine(invoice_line_id) {
    setToast("");

    const { error } = await supabase.from(INVOICE_LINES_TABLE).delete().eq("invoice_line_id", invoice_line_id);
    if (error) return setToast(error.message);

    await loadInvoiceLines(activeInvoice.invoice_id);
    await load();
  }

  async function savePayment() {
    setToast("");

    if (!payInvoice?.invoice_id) return setToast("No invoice selected.");
    const outstanding = Number(payInvoice?.outstanding_amount || 0);
    const amount = Number(payForm.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) return setToast("Payment amount must be > 0.");
    if (amount > outstanding + 0.01) return setToast(`Cannot pay more than outstanding (${money(outstanding)}).`);

    setLoading(true);
    try {
      const paymentPayload = {
        customer_id: payInvoice.customer_id,
        provider: payForm.provider || "eft",
        provider_reference: payForm.provider_reference?.trim() || null,
        amount,
        status: "succeeded",
        paid_at: new Date(`${payForm.paid_on}T00:00:00Z`).toISOString(),
      };

      const payRes = await supabase.from("payments").insert(paymentPayload).select("payment_id").single();
      if (payRes.error) throw payRes.error;

      const payment_id = payRes.data?.payment_id;
      if (!payment_id) throw new Error("Payment created but no payment_id returned.");

      const allocRes = await supabase.from("payment_allocations").insert({
        payment_id,
        invoice_id: payInvoice.invoice_id,
        allocated_amount: amount,
      });
      if (allocRes.error) throw allocRes.error;

      setShowPayment(false);
      setPayInvoice(null);
      await load();
    } catch (e) {
      setToast(e?.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    setToast("");

    try {
      let invQuery = supabase
        .from("invoices")
        .select("invoice_id, invoice_number, customer_id, status, period_start, period_end, total_amount, created_at")
        .neq("status", "void")
        .gte("period_start", from)
        .lte("period_start", to)
        .order("period_start", { ascending: false })
        .limit(800);

      if (status === "paid") invQuery = invQuery.eq("status", "paid");
      if (status === "issued") invQuery = invQuery.eq("status", "issued");
      if (status === "partially_paid") invQuery = invQuery.eq("status", "partially_paid");
      if (status === "overdue") invQuery = invQuery.eq("status", "overdue");

      const { data: inv, error: invErr } = await invQuery;
      if (invErr) throw invErr;

      const invoices = inv || [];
      const invoiceIds = invoices.map((r) => r.invoice_id).filter(Boolean);

      // Customers
      const customerIds = [...new Set(invoices.map((r) => r.customer_id).filter(Boolean))];
      let customersById = {};
      if (customerIds.length) {
        const { data: cust, error: custErr } = await supabase
          .from("customers")
          .select("customer_id, display_name, email")
          .in("customer_id", customerIds)
          .limit(2000);

        if (custErr) throw custErr;
        customersById = Object.fromEntries((cust || []).map((c) => [c.customer_id, c]));
      }

      // AR view
      const { data: ar, error: arErr } = await supabase
        .from("accounts_receivable")
        .select("invoice_id, balance_amount, paid_amount, total_amount, period_start")
        .gte("period_start", from)
        .lte("period_start", to);

      if (arErr) throw arErr;

      const arRows = ar || [];
      const arByInvoice = Object.fromEntries(arRows.map((r) => [r.invoice_id, r]));

      // Pending sends
      const { data: pending, error: pendErr } = await supabase
        .from("invoices_to_email")
        .select("invoice_id, balance_amount, period_start")
        .gte("period_start", from)
        .lte("period_start", to)
        .limit(5000);

      if (pendErr) throw pendErr;

      // ✅ Last payment per invoice
      let lastMap = {};
      if (invoiceIds.length) {
        const { data: allocs, error: aErr } = await supabase
          .from("payment_allocations")
          .select(
            `
            invoice_id,
            created_at,
            allocated_amount,
            payments:payment_id (
              provider,
              provider_reference,
              paid_at,
              amount,
              status
            )
          `
          )
          .in("invoice_id", invoiceIds)
          .order("created_at", { ascending: false })
          .limit(5000);

        if (aErr) throw aErr;

        for (const a of allocs || []) {
          if (!a?.invoice_id) continue;
          if (lastMap[a.invoice_id]) continue;

          const p = a.payments || {};
          lastMap[a.invoice_id] = {
            provider: p.provider || null,
            provider_reference: p.provider_reference || null,
            paid_at: p.paid_at || null,
            allocated_amount: a.allocated_amount || null,
          };
        }
      }
      setLastPayByInvoice(lastMap);

      // KPIs
      const pendingTotal = (pending || []).reduce((x, r) => x + Number(r.balance_amount || 0), 0);
      const invoicedTotal = invoices.reduce((x, r) => x + Number(r.total_amount || 0), 0);
      const dueTotal = arRows.reduce((x, r) => x + Number(r.balance_amount || 0), 0);

      const paidTotal = invoices.reduce((x, r) => {
        const arRow = arByInvoice[r.invoice_id];
        const bal = arRow ? Number(arRow.balance_amount || 0) : 0;
        const total = Number(r.total_amount || 0);
        return x + Math.max(0, total - bal);
      }, 0);

      setKpis({ invoiced: invoicedTotal, paid: paidTotal, due: dueTotal, pending: pendingTotal });

      // Map rows
      let mapped = invoices.map((r) => {
        const arRow = arByInvoice[r.invoice_id];
        const outstanding = arRow ? Number(arRow.balance_amount || 0) : 0;

        const c = customersById[r.customer_id];
        const customerName = c?.display_name || "—";
        const customerEmail = c?.email || "";

        const lp = lastMap[r.invoice_id];

        return {
          ...r,
          customer_name: customerName,
          customer_email: customerEmail,
          invoice_display: r.invoice_number || `#${String(r.invoice_id).slice(0, 8)}`,
          period: `${r.period_start} → ${r.period_end}`,
          total: money(r.total_amount),
          outstanding_amount: outstanding,
          outstanding: money(outstanding),

          last_payment_provider: lp?.provider || null,
          last_payment_ref: lp?.provider_reference || null,
          last_payment_at: lp?.paid_at || null,
          last_payment_alloc: lp?.allocated_amount ?? null,
        };
      });

      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        mapped = mapped.filter((r) => {
          return (
            String(r.invoice_display || "").toLowerCase().includes(qq) ||
            String(r.customer_name || "").toLowerCase().includes(qq) ||
            String(r.customer_email || "").toLowerCase().includes(qq)
          );
        });
      }

      if (status === "due") {
        mapped = mapped.filter((r) => Number(r.outstanding_amount || 0) > 0.01);
      }

      setRows(mapped);
    } catch (e) {
      setToast(e?.message || "Couldn’t load billing.");
      setRows([]);
      setLastPayByInvoice({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (context?.range_from) setFrom(context.range_from);
    if (context?.range_to) setTo(context.range_to);
    if (context?.billing_focus) setStatus(context.billing_focus === "due" ? "due" : context.billing_focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, status]);

  useEffect(() => {
    loadCustomersPicker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ IMPORTANT: no inline minWidth wrappers here anymore
  const headerRight = (
    <>
      <div className="filterField">
        <div className="kpiLabel">From</div>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>

      <div className="filterField">
        <div className="kpiLabel">To</div>
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="filterField">
        <div className="kpiLabel">Status</div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="issued">Issued</option>
          <option value="partially_paid">Part-paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="due">Outstanding</option>
        </select>
      </div>

      <div className="filterField">
        <div className="kpiLabel">Search</div>
        <input
          className="input"
          placeholder="Invoice or customer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
        Refresh
      </button>

      <button className="btn btnPrimary" type="button" onClick={openCreateModal} disabled={loading}>
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <Icon kind="invoice" /> + New invoice
        </span>
      </button>
    </>
  );

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Billing</div>
          <div className="pageSub">
            {from} → {to}
          </div>
        </div>
        <div className="pageActions">{headerRight}</div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <div className="grid grid4">
        <div className="card cardGlow">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Invoiced</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {money(kpis.invoiced)}
              </div>
            </div>
            <div className="kpiIcon">
              <Icon kind="invoice" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Paid</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {money(kpis.paid)}
              </div>
            </div>
            <div className="kpiIcon">
              <Icon kind="paid" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Outstanding</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {money(kpis.due)}
              </div>
            </div>
            <div className="kpiIcon">
              <Icon kind="due" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Pending sends</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {money(kpis.pending)}
              </div>
            </div>
            <div className="kpiIcon">
              <Icon kind="send" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <Card title="Invoices" action={<span className="chip">{rows.length} shown</span>}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Period</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "right" }}>Outstanding</th>
                <th style={{ width: 340 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.invoice_id}>
                  <td style={{ fontWeight: 850 }}>{r.invoice_display}</td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 850 }}>{r.customer_name}</span>
                      {r.customer_email ? (
                        <span className="muted" style={{ fontSize: 12 }}>
                          {r.customer_email}
                        </span>
                      ) : null}

                      {r.last_payment_provider ? (
                        <span className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                          Last payment: <b>{providerLabel(r.last_payment_provider)}</b>
                          {r.last_payment_ref ? ` • ${r.last_payment_ref}` : ""}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td>
                    <StatusBadge tone={statusTone(r.status, r.outstanding_amount)}>
                      {statusLabel(r.status, r.outstanding_amount)}
                    </StatusBadge>
                  </td>

                  <td className="muted">{r.period}</td>

                  <td style={{ textAlign: "right", fontWeight: 850 }}>{r.total}</td>
                  <td style={{ textAlign: "right", fontWeight: 850 }}>{r.outstanding}</td>

                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={async () => {
                        setActiveInvoice(r);
                        setShowLines(true);
                        await loadInvoiceLines(r.invoice_id);
                      }}
                      style={{ marginRight: 8 }}
                    >
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <Icon kind="lines" /> Lines
                      </span>
                    </button>

                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={() => openPaymentModal(r)}
                      disabled={Number(r.outstanding_amount || 0) <= 0.01}
                      style={{ marginRight: 8 }}
                    >
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <Icon kind="cash" /> Add payment
                      </span>
                    </button>

                    <button
                      className="btn btnPrimary"
                      type="button"
                      onClick={() => {
                        setContext?.({ invoice_id: r.invoice_id, customer_id: r.customer_id });
                        setView?.("invoice");
                      }}
                    >
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <Icon kind="view" /> View
                      </span>
                    </button>
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No invoices found for this period / filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE INVOICE MODAL */}
      {showCreate ? (
        <Modal
          title="New invoice"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={createInvoice}>
                Create
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div>
              <div className="kpiLabel">Customer</div>
              <select
                value={createForm.customer_id}
                onChange={(e) => setCreateForm((s) => ({ ...s, customer_id: e.target.value }))}
              >
                <option value="">Select…</option>
                {customersPick.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.display_name} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Invoice # (optional)</div>
                <input
                  className="input"
                  value={createForm.invoice_number}
                  onChange={(e) => setCreateForm((s) => ({ ...s, invoice_number: e.target.value }))}
                  placeholder="e.g. TA-2026-000001"
                />
              </div>

              <div>
                <div className="kpiLabel">Status</div>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))}
                >
                  <option value="issued">issued</option>
                  <option value="partially_paid">partially_paid</option>
                  <option value="paid">paid</option>
                  <option value="overdue">overdue</option>
                </select>
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Period start</div>
                <input
                  className="input"
                  type="date"
                  value={createForm.period_start}
                  onChange={(e) => setCreateForm((s) => ({ ...s, period_start: e.target.value }))}
                />
              </div>

              <div>
                <div className="kpiLabel">Period end</div>
                <input
                  className="input"
                  type="date"
                  value={createForm.period_end}
                  onChange={(e) => setCreateForm((s) => ({ ...s, period_end: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* PAYMENT MODAL */}
      {showPayment && payInvoice ? (
        <Modal
          title={`Record payment — ${payInvoice.invoice_display}`}
          onClose={() => setShowPayment(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowPayment(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={savePayment} disabled={loading}>
                Save payment
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div className="card">
              <div className="muted" style={{ fontSize: 12 }}>
                Outstanding: <b>{money(payInvoice.outstanding_amount)}</b>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Customer: <b>{payInvoice.customer_name}</b>
              </div>

              {lastPayByInvoice?.[payInvoice.invoice_id]?.provider ? (
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  Last payment on this invoice:{" "}
                  <b>{providerLabel(lastPayByInvoice[payInvoice.invoice_id].provider)}</b>
                </div>
              ) : null}
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Paid on</div>
                <input
                  className="input"
                  type="date"
                  value={payForm.paid_on}
                  onChange={(e) => setPayForm((s) => ({ ...s, paid_on: e.target.value }))}
                />
              </div>

              <div>
                <div className="kpiLabel">Amount (R)</div>
                <input
                  className="input"
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((s) => ({ ...s, amount: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <div className="kpiLabel">Payment method</div>
              <select
                className="input"
                value={payForm.provider}
                onChange={(e) => setPayForm((s) => ({ ...s, provider: e.target.value }))}
              >
                <option value="eft">EFT</option>
                <option value="cash">Cash</option>
                <option value="payfast">PayFast</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <div className="kpiLabel">Provider reference (optional)</div>
              <input
                className="input"
                value={payForm.provider_reference}
                onChange={(e) => setPayForm((s) => ({ ...s, provider_reference: e.target.value }))}
                placeholder="e.g. FNB ref / PayFast ref"
              />
            </div>

            <div className="muted" style={{ fontSize: 12 }}>
              Guardrail: we block overpayments here, and the DB will keep your invoice status / AR in sync.
            </div>
          </div>
        </Modal>
      ) : null}

      {/* LINES MODAL */}
      {showLines && activeInvoice ? (
        <Modal
          title={`Invoice lines — ${activeInvoice.invoice_display || activeInvoice.invoice_id}`}
          onClose={() => setShowLines(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowLines(false)}>
                Done
              </button>
              <button
                className="btn btnPrimary"
                type="button"
                onClick={() => {
                  setContext?.({ invoice_id: activeInvoice.invoice_id, customer_id: activeInvoice.customer_id });
                  setView?.("invoice");
                }}
              >
                View invoice
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div className="card">
              <div className="cardHead">
                <div className="cardTitle">Add line</div>
              </div>

              <div className="formGrid">
                <div>
                  <div className="kpiLabel">Description</div>
                  <input
                    className="input"
                    value={lineForm.description}
                    onChange={(e) => setLineForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="e.g. Monthly subscription adjustment"
                  />
                </div>

                <div className="formRow2">
                  <div>
                    <div className="kpiLabel">Qty</div>
                    <input
                      className="input"
                      type="number"
                      value={lineForm.qty}
                      onChange={(e) => setLineForm((s) => ({ ...s, qty: e.target.value }))}
                    />
                  </div>

                  <div>
                    <div className="kpiLabel">Unit price (R)</div>
                    <input
                      className="input"
                      type="number"
                      value={lineForm.unit_price}
                      onChange={(e) => setLineForm((s) => ({ ...s, unit_price: e.target.value }))}
                    />
                  </div>
                </div>

                <button className="btn btnPrimary" type="button" onClick={addLine}>
                  Add
                </button>
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ width: 90 }}>Qty</th>
                    <th style={{ width: 140 }}>Unit</th>
                    <th style={{ width: 160 }}>Total</th>
                    <th style={{ width: 120 }} />
                  </tr>
                </thead>
                <tbody>
                  {invoiceLines.map((l) => (
                    <tr key={l.invoice_line_id}>
                      <td>{l.description}</td>
                      <td>{Number(l.qty || 0)}</td>
                      <td>{money(l.unit_price)}</td>
                      <td>{money(l.line_total)}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btnGhost" type="button" onClick={() => deleteLine(l.invoice_line_id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!invoiceLines.length ? (
                    <tr>
                      <td colSpan={5} className="muted">
                        No lines yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}