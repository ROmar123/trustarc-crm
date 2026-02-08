import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Card from "../components/ui/Card.jsx";

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function money(n) {
  const v = toNum(n);
  return `R ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function isoDate(d) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}
function daysBetween(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
function formatTenure(createdAt) {
  if (!createdAt) return { days: 0, months: 0, label: "—" };
  const created = new Date(createdAt);
  const now = new Date();
  const days = daysBetween(created, now);
  const months = Math.floor(days / 30);
  const label = months >= 1 ? `${months} mo • ${days} days` : `${days} days`;
  return { days, months, label };
}

function Chip({ tone = "muted", children }) {
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
        color: "rgba(255,255,255,.92)",
        fontSize: 12,
        fontWeight: 850,
        letterSpacing: ".2px",
      }}
    >
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

export default function CustomerDetail({ setView, setContext, context }) {
  const customerId = context?.customer_id;

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [tab, setTab] = useState("subscriptions"); // subscriptions | invoices

  const [customer, setCustomer] = useState(null);
  const [credit, setCredit] = useState(0);

  const [routes, setRoutes] = useState([]);
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // modals
  const [showAddSub, setShowAddSub] = useState(false);
  const [showAddInv, setShowAddInv] = useState(false);

  // forms
  const [subForm, setSubForm] = useState({
    route_id: "",
    billing_period: "monthly",
    seats: 1,
    price_override: "",
    start_date: isoDate(new Date()),
    next_period_start: isoDate(new Date()),
    status: "active",
    notes: "",
  });

  // NOTE: invoices require subscription_id in your schema
  const [invForm, setInvForm] = useState({
    subscription_id: "",
    period_start: isoDate(new Date()),
    period_end: isoDate(new Date()),
    status: "issued",
    email_status: "pending",
    // optional initial line
    add_initial_line: true,
    line_description: "Adjustment / Manual invoice",
    line_qty: 1,
    line_unit_price: 0,
  });

  const tenure = useMemo(() => formatTenure(customer?.created_at), [customer?.created_at]);

  function statusToneCustomer(s) {
    const v = String(s || "").toLowerCase();
    if (v === "active") return "green";
    if (v === "inactive") return "red";
    return "muted";
  }

  function subTone(s) {
    const v = String(s || "").toLowerCase();
    if (v === "active") return "green";
    if (v === "paused") return "amber";
    if (v === "cancelled") return "red";
    return "muted";
  }

  function invTone(s, balance) {
    const v = String(s || "").toLowerCase();
    const due = toNum(balance) > 0.01;
    if (v === "paid") return "green";
    if (v === "partially_paid") return "amber";
    if (v === "overdue") return "red";
    if (due) return "red";
    return "muted";
  }

  async function load() {
    if (!customerId) {
      setToast("No customer selected.");
      return;
    }

    setLoading(true);
    setToast("");

    try {
      // customer
      const { data: cust, error: custErr } = await supabase
        .from("customers")
        .select("customer_id, display_name, email, phone, status, notes, created_at")
        .eq("customer_id", customerId)
        .single();
      if (custErr) throw custErr;
      setCustomer(cust);

      // credit (view)
      const { data: cred, error: credErr } = await supabase
        .from("customer_credit")
        .select("customer_id, credit_balance")
        .eq("customer_id", customerId)
        .single();
      if (!credErr) setCredit(toNum(cred?.credit_balance));

      // routes (for dropdown)
      const { data: rts, error: rtsErr } = await supabase
        .from("routes")
        .select("route_id, route_name, is_active")
        .order("route_name", { ascending: true })
        .limit(1000);
      if (rtsErr) throw rtsErr;
      setRoutes(rts || []);

      // subscriptions (customer)
      const { data: s, error: sErr } = await supabase
        .from("subscriptions")
        .select("subscription_id, route_id, billing_period, seats, price_override, start_date, next_period_start, status, notes, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;
      setSubs(s || []);

      // invoices (customer)
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("invoice_id, invoice_number, subscription_id, period_start, period_end, total_amount, status, email_status, created_at")
        .eq("customer_id", customerId)
        .neq("status", "void")
        .order("period_start", { ascending: false })
        .limit(1000);
      if (invErr) throw invErr;

      // Get balances from accounts_receivable for this customer’s invoices (only those with balance > 0 exist in view)
      const invIds = (inv || []).map((x) => x.invoice_id);
      let arByInvoice = {};
      if (invIds.length) {
        const { data: ar, error: arErr } = await supabase
          .from("accounts_receivable")
          .select("invoice_id, balance_amount, paid_amount, total_amount")
          .in("invoice_id", invIds);
        if (arErr) throw arErr;
        arByInvoice = Object.fromEntries((ar || []).map((x) => [x.invoice_id, x]));
      }

      const mapped = (inv || []).map((row) => {
        const ar = arByInvoice[row.invoice_id];
        const balance = ar ? toNum(ar.balance_amount) : 0;
        const paid = ar ? toNum(ar.paid_amount) : Math.max(0, toNum(row.total_amount) - balance);
        return {
          ...row,
          invoice_display: row.invoice_number || `#${String(row.invoice_id).slice(0, 8)}`,
          balance_amount: balance,
          paid_amount: paid,
          balance: money(balance),
          total: money(row.total_amount),
        };
      });

      setInvoices(mapped);
    } catch (e) {
      setToast(e?.message || "Could not load customer.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function createSubscription() {
    setToast("");
    if (!customerId) return;

    if (!subForm.route_id) return setToast("Pick a route.");
    const seats = Math.max(1, Math.floor(toNum(subForm.seats)));
    const po = String(subForm.price_override || "").trim();
    const price_override = po === "" ? null : toNum(po);

    const payload = {
      customer_id: customerId,
      route_id: subForm.route_id,
      billing_period: subForm.billing_period,
      seats,
      price_override,
      start_date: subForm.start_date,
      next_period_start: subForm.next_period_start,
      status: subForm.status,
      notes: subForm.notes || null,
    };

    const { error } = await supabase.from("subscriptions").insert(payload);
    if (error) return setToast(error.message);

    setShowAddSub(false);
    await load();
  }

  async function createInvoice() {
    setToast("");
    if (!customerId) return;

    if (!invForm.subscription_id) return setToast("Pick a subscription (invoice needs subscription_id).");

    // invoice_number is required in your schema — use next_invoice_number()
    const { data: invNoData, error: invNoErr } = await supabase.rpc("next_invoice_number");
    if (invNoErr) return setToast(invNoErr.message);

    const invoice_number = String(invNoData || "").trim();
    if (!invoice_number) return setToast("Could not generate invoice number.");

    const payload = {
      invoice_number,
      customer_id: customerId,
      subscription_id: invForm.subscription_id,
      period_start: invForm.period_start,
      period_end: invForm.period_end,
      status: invForm.status,
      email_status: invForm.email_status,
    };

    const { data: created, error } = await supabase.from("invoices").insert(payload).select().single();
    if (error) return setToast(error.message);

    // Optional: create an initial line (so invoice has value)
    if (invForm.add_initial_line) {
      const desc = String(invForm.line_description || "").trim();
      const qty = Math.max(0.01, toNum(invForm.line_qty));
      const unit = toNum(invForm.line_unit_price);

      if (!desc) return setToast("Initial line needs a description.");

      const { error: lineErr } = await supabase.from("invoice_lines").insert({
        invoice_id: created.invoice_id,
        description: desc,
        qty,
        unit_price: unit,
        // line_total computed by trigger
      });

      if (lineErr) return setToast(lineErr.message);
    }

    setShowAddInv(false);
    await load();
  }

  if (!customerId) {
    return (
      <div>
        <div className="pageHead">
          <div>
            <div className="pageTitle">Customer</div>
            <div className="pageSub">No customer selected</div>
          </div>
          <div className="pageActions">
            <button className="btn btnGhost" type="button" onClick={() => setView?.("customers")}>
              ← Back to customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeRouteName = (rid) => routes.find((r) => r.route_id === rid)?.route_name || "—";

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">{customer?.display_name || "Customer"}</div>
          <div className="pageSub">
            {customer?.email || ""} {customer?.phone ? `• ${customer.phone}` : ""}
          </div>
        </div>

        <div className="pageActions" style={{ gap: 10 }}>
          <Chip tone={statusToneCustomer(customer?.status)}>
            {String(customer?.status || "—").toUpperCase()}
          </Chip>

          <Chip tone="muted">Tenure: {tenure.label}</Chip>

          <Chip tone={credit > 0.01 ? "amber" : "muted"}>Credit: {money(credit)}</Chip>

          <button className="btn btnGhost" type="button" onClick={() => setView?.("customers")}>
            ← Back
          </button>

          <button className="btn btnGhost" type="button" onClick={() => setShowAddSub(true)}>
            + Subscription
          </button>

          <button className="btn btnPrimary" type="button" onClick={() => setShowAddInv(true)}>
            + Invoice
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      {/* Top cards */}
      <div className="grid grid3">
        <div className="card cardGlow">
          <div className="kpiLabel">Customer</div>
          <div style={{ fontWeight: 900, fontSize: 18, marginTop: 6 }}>{customer?.display_name || "—"}</div>
          <div className="muted" style={{ marginTop: 6 }}>{customer?.email || ""}</div>
          <div className="muted">{customer?.phone || ""}</div>
          <div className="muted" style={{ marginTop: 10 }}>
            Created: {customer?.created_at ? isoDate(new Date(customer.created_at)) : "—"}
          </div>
        </div>

        <div className="card">
          <div className="kpiLabel">Subscriptions</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{subs.length}</div>
          <div className="muted">Active: {subs.filter((s) => String(s.status).toLowerCase() === "active").length}</div>
        </div>

        <div className="card">
          <div className="kpiLabel">Invoices</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{invoices.length}</div>
          <div className="muted">
            Outstanding: {invoices.filter((i) => toNum(i.balance_amount) > 0.01).length}
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <button className={`btn ${tab === "subscriptions" ? "btnPrimary" : "btnGhost"}`} type="button" onClick={() => setTab("subscriptions")}>
          Subscriptions
        </button>
        <button className={`btn ${tab === "invoices" ? "btnPrimary" : "btnGhost"}`} type="button" onClick={() => setTab("invoices")}>
          Invoices
        </button>
        <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {tab === "subscriptions" ? (
        <Card title="Subscriptions" action={<span className="chip">{subs.length} total</span>}>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Billing</th>
                  <th style={{ textAlign: "right" }}>Seats</th>
                  <th>Next period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.subscription_id}>
                    <td style={{ fontWeight: 850 }}>{activeRouteName(s.route_id)}</td>
                    <td className="muted">{String(s.billing_period || "").toUpperCase()}</td>
                    <td style={{ textAlign: "right", fontWeight: 850 }}>{toNum(s.seats)}</td>
                    <td className="muted">{s.next_period_start}</td>
                    <td>
                      <Chip tone={subTone(s.status)}>{String(s.status || "").toUpperCase()}</Chip>
                    </td>
                  </tr>
                ))}
                {!subs.length ? (
                  <tr>
                    <td colSpan={5} className="muted">No subscriptions yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === "invoices" ? (
        <Card title="Invoices" action={<span className="chip">{invoices.length} total</span>}>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th style={{ width: 140 }} />
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.invoice_id}>
                    <td style={{ fontWeight: 900 }}>{i.invoice_display}</td>
                    <td className="muted">{i.period_start} → {i.period_end}</td>
                    <td>
                      <Chip tone={invTone(i.status, i.balance_amount)}>
                        {String(i.status || "").toUpperCase()}
                        {toNum(i.balance_amount) > 0.01 ? " • DUE" : ""}
                      </Chip>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 900 }}>{i.total}</td>
                    <td style={{ textAlign: "right", fontWeight: 900 }}>{i.balance}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btnPrimary"
                        type="button"
                        onClick={() => {
                          setContext?.({ invoice_id: i.invoice_id, customer_id: customerId });
                          setView?.("invoice");
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!invoices.length ? (
                  <tr>
                    <td colSpan={6} className="muted">No invoices yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {/* ADD SUBSCRIPTION MODAL */}
      {showAddSub ? (
        <Modal
          title="Add subscription"
          onClose={() => setShowAddSub(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowAddSub(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={createSubscription}>
                Create subscription
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div>
              <div className="kpiLabel">Route</div>
              <select
                value={subForm.route_id}
                onChange={(e) => setSubForm((s) => ({ ...s, route_id: e.target.value }))}
              >
                <option value="">Select…</option>
                {routes.map((r) => (
                  <option key={r.route_id} value={r.route_id}>
                    {r.route_name} {r.is_active ? "" : "(inactive)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Billing period</div>
                <select
                  value={subForm.billing_period}
                  onChange={(e) => setSubForm((s) => ({ ...s, billing_period: e.target.value }))}
                >
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                </select>
              </div>

              <div>
                <div className="kpiLabel">Seats</div>
                <input
                  className="input"
                  type="number"
                  value={subForm.seats}
                  onChange={(e) => setSubForm((s) => ({ ...s, seats: e.target.value }))}
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Start date</div>
                <input
                  className="input"
                  type="date"
                  value={subForm.start_date}
                  onChange={(e) => setSubForm((s) => ({ ...s, start_date: e.target.value }))}
                />
              </div>
              <div>
                <div className="kpiLabel">Next period start</div>
                <input
                  className="input"
                  type="date"
                  value={subForm.next_period_start}
                  onChange={(e) => setSubForm((s) => ({ ...s, next_period_start: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <div className="kpiLabel">Price override (optional)</div>
              <input
                className="input"
                type="number"
                value={subForm.price_override}
                onChange={(e) => setSubForm((s) => ({ ...s, price_override: e.target.value }))}
                placeholder="Leave blank to use route pricing"
              />
            </div>

            <div>
              <div className="kpiLabel">Notes (optional)</div>
              <textarea
                value={subForm.notes}
                onChange={(e) => setSubForm((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Internal notes"
              />
            </div>
          </div>
        </Modal>
      ) : null}

      {/* ADD INVOICE MODAL */}
      {showAddInv ? (
        <Modal
          title="Add invoice"
          onClose={() => setShowAddInv(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowAddInv(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={createInvoice}>
                Create invoice
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div>
              <div className="kpiLabel">Subscription (required)</div>
              <select
                value={invForm.subscription_id}
                onChange={(e) => setInvForm((s) => ({ ...s, subscription_id: e.target.value }))}
              >
                <option value="">Select…</option>
                {subs.map((s) => (
                  <option key={s.subscription_id} value={s.subscription_id}>
                    {activeRouteName(s.route_id)} • {String(s.billing_period).toUpperCase()} • seats {toNum(s.seats)}
                  </option>
                ))}
              </select>
              {!subs.length ? (
                <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                  No subscriptions exist yet — create a subscription first.
                </div>
              ) : null}
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Period start</div>
                <input
                  className="input"
                  type="date"
                  value={invForm.period_start}
                  onChange={(e) => setInvForm((s) => ({ ...s, period_start: e.target.value }))}
                />
              </div>
              <div>
                <div className="kpiLabel">Period end</div>
                <input
                  className="input"
                  type="date"
                  value={invForm.period_end}
                  onChange={(e) => setInvForm((s) => ({ ...s, period_end: e.target.value }))}
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Status</div>
                <select value={invForm.status} onChange={(e) => setInvForm((s) => ({ ...s, status: e.target.value }))}>
                  <option value="issued">issued</option>
                  <option value="paid">paid</option>
                  <option value="partially_paid">partially_paid</option>
                  <option value="overdue">overdue</option>
                </select>
              </div>

              <div>
                <div className="kpiLabel">Email status</div>
                <select
                  value={invForm.email_status}
                  onChange={(e) => setInvForm((s) => ({ ...s, email_status: e.target.value }))}
                >
                  <option value="pending">pending</option>
                  <option value="sent">sent</option>
                  <option value="failed">failed</option>
                </select>
              </div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>Initial line (optional)</div>
                <label className="muted" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={!!invForm.add_initial_line}
                    onChange={(e) => setInvForm((s) => ({ ...s, add_initial_line: e.target.checked }))}
                  />
                  Add line
                </label>
              </div>

              {invForm.add_initial_line ? (
                <div className="formGrid" style={{ marginTop: 10 }}>
                  <div>
                    <div className="kpiLabel">Description</div>
                    <input
                      className="input"
                      value={invForm.line_description}
                      onChange={(e) => setInvForm((s) => ({ ...s, line_description: e.target.value }))}
                      placeholder="e.g. Monthly subscription / Adjustment"
                    />
                  </div>

                  <div className="formRow2">
                    <div>
                      <div className="kpiLabel">Qty</div>
                      <input
                        className="input"
                        type="number"
                        value={invForm.line_qty}
                        onChange={(e) => setInvForm((s) => ({ ...s, line_qty: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="kpiLabel">Unit price (R)</div>
                      <input
                        className="input"
                        type="number"
                        value={invForm.line_unit_price}
                        onChange={(e) => setInvForm((s) => ({ ...s, line_unit_price: e.target.value }))}
                      />
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        This creates the first invoice line immediately.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}