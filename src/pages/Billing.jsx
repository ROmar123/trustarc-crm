import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Card from "../components/ui/Card.jsx";

/** ✅ Match your real DB (from your SQL): public.invoice_lines */
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

  const [status, setStatus] = useState("all"); // all | issued | paid | due | partially_paid | overdue
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState({ invoiced: 0, paid: 0, due: 0, pending: 0 });

  const [showLines, setShowLines] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const [invoiceLines, setInvoiceLines] = useState([]);
  const [lineForm, setLineForm] = useState({ description: "", qty: 1, unit_price: 0 });

  // ✅ New invoice modal + picker
  const [showCreate, setShowCreate] = useState(false);
  const [customersPick, setCustomersPick] = useState([]);

  const [createForm, setCreateForm] = useState({
    customer_id: "",
    invoice_number: "",
    status: "issued",
    period_start: from,
    period_end: to,
    notes: "",
  });

  function openCreateModal() {
    setCreateForm({
      customer_id: "",
      invoice_number: "",
      status: "issued",
      period_start: from,
      period_end: to,
      notes: "",
    });
    setShowCreate(true);
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
      // ✅ invoices table does not have notes/currency in your SQL, so we don’t send them
    };

    const { data, error } = await supabase.from("invoices").insert(payload).select().single();
    if (error) return setToast(error.message);

    setShowCreate(false);
    await load();

    // ✅ open lines immediately
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

    // ✅ DB computes line_total via trigger, so we only send core fields
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
    await load(); // triggers update invoice total/status
  }

  async function deleteLine(invoice_line_id) {
    setToast("");

    const { error } = await supabase.from(INVOICE_LINES_TABLE).delete().eq("invoice_line_id", invoice_line_id);
    if (error) return setToast(error.message);

    await loadInvoiceLines(activeInvoice.invoice_id);
    await load();
  }

  async function load() {
    setLoading(true);
    setToast("");

    try {
      // ✅ invoices in range
      let invQuery = supabase
        .from("invoices")
        .select("invoice_id, invoice_number, customer_id, status, period_start, period_end, total_amount, created_at")
        .neq("status", "void")
        .gte("period_start", from)
        .lte("period_start", to)
        .order("period_start", { ascending: false })
        .limit(800);

      // db-friendly filters
      if (status === "paid") invQuery = invQuery.eq("status", "paid");
      if (status === "issued") invQuery = invQuery.eq("status", "issued");
      if (status === "partially_paid") invQuery = invQuery.eq("status", "partially_paid");
      if (status === "overdue") invQuery = invQuery.eq("status", "overdue");

      const { data: inv, error: invErr } = await invQuery;
      if (invErr) throw invErr;

      const invoices = inv || [];

      // ✅ customers lookup
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

      // ✅ accounts_receivable view for balances (range matched)
      const { data: ar, error: arErr } = await supabase
        .from("accounts_receivable")
        .select("invoice_id, balance_amount, paid_amount, total_amount, period_start")
        .gte("period_start", from)
        .lte("period_start", to);

      if (arErr) throw arErr;

      const arRows = ar || [];
      const arByInvoice = Object.fromEntries(arRows.map((r) => [r.invoice_id, r]));

      // ✅ pending sends view (range matched)
      const { data: pending, error: pendErr } = await supabase
        .from("invoices_to_email")
        .select("invoice_id, balance_amount, period_start")
        .gte("period_start", from)
        .lte("period_start", to)
        .limit(5000);

      if (pendErr) throw pendErr;

      const pendingTotal = (pending || []).reduce((a, r) => a + Number(r.balance_amount || 0), 0);

      // ✅ KPIs
      const invoicedTotal = invoices.reduce((a, r) => a + Number(r.total_amount || 0), 0);
      const dueTotal = arRows.reduce((a, r) => a + Number(r.balance_amount || 0), 0);

      // paid KPI: total - balance per invoice
      const paidTotal = invoices.reduce((a, r) => {
        const arRow = arByInvoice[r.invoice_id];
        const bal = arRow ? Number(arRow.balance_amount || 0) : 0;
        const total = Number(r.total_amount || 0);
        return a + Math.max(0, total - bal);
      }, 0);

      setKpis({
        invoiced: invoicedTotal,
        paid: paidTotal,
        due: dueTotal,
        pending: pendingTotal,
      });

      // map rows
      let mapped = invoices.map((r) => {
        const arRow = arByInvoice[r.invoice_id];
        const outstanding = arRow ? Number(arRow.balance_amount || 0) : 0;

        const c = customersById[r.customer_id];
        const customerName = c?.display_name || "—";
        const customerEmail = c?.email || "";

        return {
          ...r,
          customer_name: customerName,
          customer_email: customerEmail,
          invoice_display: r.invoice_number || `#${String(r.invoice_id).slice(0, 8)}`,
          period: `${r.period_start} → ${r.period_end}`,
          total: money(r.total_amount),
          outstanding_amount: outstanding,
          outstanding: money(outstanding),
        };
      });

      // search
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

      // outstanding-only
      if (status === "due") {
        mapped = mapped.filter((r) => Number(r.outstanding_amount || 0) > 0.01);
      }

      setRows(mapped);
    } catch (e) {
      setToast(e?.message || "Couldn’t load billing.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // allow Overview → Billing to pre-focus
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

  const headerRight = (
    <>
      <div style={{ minWidth: 160 }}>
        <div className="kpiLabel">From</div>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>

      <div style={{ minWidth: 160 }}>
        <div className="kpiLabel">To</div>
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div style={{ minWidth: 190 }}>
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

      <div style={{ minWidth: 240 }}>
        <div className="kpiLabel">Search</div>
        <input className="input" placeholder="Invoice or customer…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
        Refresh
      </button>

      {/* ✅ REPLACED: Generate invoices → + New invoice */}
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

      {/* KPI cards with icons */}
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
                <th style={{ width: 220 }} />
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

      {/* ✅ CREATE MODAL */}
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

            <div>
              <div className="kpiLabel">Notes (optional)</div>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Internal notes (not stored in DB yet)"
              />
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Notes are UI-only right now (your invoices table doesn’t have a notes column).
              </div>
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