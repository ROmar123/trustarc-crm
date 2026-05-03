import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Card from "../components/ui/Card.jsx";

function isoDate(d) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}
function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function money(n) {
  const v = toNum(n);
  return `R ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        whiteSpace: "nowrap",
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

// next_period_start rules for your MVP:
// - weekly: next_period_start = start_date (your generator uses next_period_start <= target)
// - monthly: next_period_start = start_date (same idea)
// You can move this later if you want "next cycle" logic, but this is the correct minimal behavior.
function computeNextPeriodStart(start_date /* yyyy-mm-dd */) {
  return start_date;
}

export default function Subscriptions({ setView, setContext, context }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // filters
  const [status, setStatus] = useState("all"); // all | active | paused | cancelled
  const [period, setPeriod] = useState("all"); // all | weekly | monthly
  const [q, setQ] = useState("");

  // data
  const [rows, setRows] = useState([]);
  const [customersPick, setCustomersPick] = useState([]);
  const [routesPick, setRoutesPick] = useState([]);
  const [pricing, setPricing] = useState([]); // route_pricing rows (client-side resolve)

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_id: "",
    route_id: "",
    billing_period: "weekly",
    seats: 1,
    price_override: "", // string input (optional)
    start_date: isoDate(new Date()),
    status: "active",
    notes: "",
  });

  // --------- loaders ----------
  async function loadPickers() {
    setToast("");

    const [custRes, routeRes, pricingRes] = await Promise.all([
      supabase
        .from("customers")
        .select("customer_id, display_name, email, status")
        .eq("status", "active")
        .order("display_name", { ascending: true })
        .limit(2000),

      supabase
        .from("routes")
        .select("route_id, route_name, origin_label, destination_label, is_active")
        .order("route_name", { ascending: true })
        .limit(2000),

      supabase
        .from("route_pricing")
        .select("pricing_id, route_id, weekly_price, monthly_price, effective_from, effective_to")
        .order("effective_from", { ascending: false })
        .limit(5000),
    ]);

    if (custRes.error) setToast(custRes.error.message);
    if (routeRes.error) setToast(routeRes.error.message);
    if (pricingRes.error) setToast(pricingRes.error.message);

    setCustomersPick(custRes.data || []);
    setRoutesPick(routeRes.data || []);
    setPricing(pricingRes.data || []);
  }

  function resolveRoutePrice(route_id, billing_period, effectiveDate /* yyyy-mm-dd */) {
    // pick the most recent pricing row where effective_from <= date and (effective_to null or >= date)
    const d = effectiveDate ? new Date(effectiveDate) : new Date();

    const candidates = pricing.filter((p) => {
      if (p.route_id !== route_id) return false;
      const from = p.effective_from ? new Date(p.effective_from) : null;
      const to = p.effective_to ? new Date(p.effective_to) : null;
      if (from && from > d) return false;
      if (to && to < d) return false;
      return true;
    });

    const best = candidates.sort((a, b) => {
      const af = a.effective_from ? new Date(a.effective_from).getTime() : 0;
      const bf = b.effective_from ? new Date(b.effective_from).getTime() : 0;
      return bf - af;
    })[0];

    if (!best) return 0;
    return billing_period === "monthly" ? toNum(best.monthly_price) : toNum(best.weekly_price);
  }

  async function load() {
    setLoading(true);
    setToast("");

    try {
      let query = supabase
        .from("subscriptions")
        .select(
          "subscription_id, customer_id, route_id, billing_period, seats, price_override, start_date, next_period_start, status, notes, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(2000);

      if (status !== "all") query = query.eq("status", status);
      if (period !== "all") query = query.eq("billing_period", period);

      const { data, error } = await query;
      if (error) throw error;

      const subs = data || [];

      // map names via pickers (fast)
      const custById = Object.fromEntries((customersPick || []).map((c) => [c.customer_id, c]));
      const routeById = Object.fromEntries((routesPick || []).map((r) => [r.route_id, r]));

      let mapped = subs.map((s) => {
        const c = custById[s.customer_id];
        const r = routeById[s.route_id];

        const basePrice = resolveRoutePrice(s.route_id, s.billing_period, s.start_date);
        const override = s.price_override === null || s.price_override === undefined ? null : toNum(s.price_override);
        const unitPrice = override !== null && override !== 0 ? override : basePrice;

        const estValue = toNum(s.seats) * unitPrice;

        return {
          ...s,
          customer_name: c?.display_name || "—",
          customer_email: c?.email || "",
          route_name: r?.route_name || "—",
          route_leg: r ? `${r.origin_label || ""} → ${r.destination_label || ""}`.trim() : "",
          price_unit: unitPrice,
          est_value: estValue,
        };
      });

      // search (client-side)
      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        mapped = mapped.filter((r) => {
          return (
            String(r.customer_name || "").toLowerCase().includes(qq) ||
            String(r.customer_email || "").toLowerCase().includes(qq) ||
            String(r.route_name || "").toLowerCase().includes(qq) ||
            String(r.subscription_id || "").toLowerCase().includes(qq)
          );
        });
      }

      setRows(mapped);
    } catch (e) {
      setToast(e?.message || "Couldn’t load subscriptions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // --------- actions ----------
  async function createSubscription() {
    setToast("");

    const customer_id = createForm.customer_id;
    const route_id = createForm.route_id;
    const billing_period = createForm.billing_period;
    const seats = Math.max(1, Math.floor(toNum(createForm.seats)));
    const start_date = createForm.start_date || isoDate(new Date());
    const next_period_start = computeNextPeriodStart(start_date);

    if (!customer_id) return setToast("Pick a customer.");
    if (!route_id) return setToast("Pick a route.");

    // price_override optional
    const poRaw = String(createForm.price_override ?? "").trim();
    const price_override = poRaw === "" ? null : Number(poRaw);
    if (poRaw !== "" && !Number.isFinite(price_override)) return setToast("Price override must be a number.");
    if (price_override !== null && price_override < 0) return setToast("Price override cannot be negative.");

    const payload = {
      customer_id,
      route_id,
      billing_period,
      seats,
      price_override,
      start_date,
      next_period_start,
      status: createForm.status || "active",
      notes: createForm.notes || null,
    };

    const { error } = await supabase.from("subscriptions").insert(payload);
    if (error) return setToast(error.message);

    setShowCreate(false);
    setCreateForm((s) => ({
      ...s,
      customer_id: "",
      route_id: "",
      seats: 1,
      price_override: "",
      start_date: isoDate(new Date()),
      status: "active",
      notes: "",
    }));

    await load();
  }

  async function setSubStatus(subscription_id, nextStatus) {
    setToast("");
    const { error } = await supabase.from("subscriptions").update({ status: nextStatus }).eq("subscription_id", subscription_id);
    if (error) return setToast(error.message);
    await load();
  }

  function toneForStatus(s) {
    const x = String(s || "").toLowerCase();
    if (x === "active") return "green";
    if (x === "paused") return "amber";
    if (x === "cancelled") return "red";
    return "muted";
  }

  // --------- lifecycle ----------
  useEffect(() => {
    loadPickers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // only load when pickers exist (so names resolve)
    if (customersPick.length || routesPick.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, period, q, customersPick, routesPick]);

  // --------- derived KPIs ----------
  const kpi = useMemo(() => {
    const active = rows.filter((r) => String(r.status).toLowerCase() === "active").length;
    const paused = rows.filter((r) => String(r.status).toLowerCase() === "paused").length;
    const monthlyValue = rows
      .filter((r) => String(r.status).toLowerCase() === "active")
      .reduce((a, r) => a + toNum(r.est_value), 0);

    return { active, paused, monthlyValue };
  }, [rows]);

  const headerRight = (
    <>
      <div style={{ minWidth: 180 }}>
        <div className="kpiLabel">Status</div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={{ minWidth: 180 }}>
        <div className="kpiLabel">Billing</div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="all">All</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div style={{ minWidth: 260 }}>
        <div className="kpiLabel">Search</div>
        <input className="input" placeholder="Customer / route / email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
        Refresh
      </button>

      <button className="btn btnPrimary" type="button" onClick={() => setShowCreate(true)}>
        + Subscription
      </button>
    </>
  );

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Subscriptions</div>
          <div className="pageSub">Manage customer subscriptions (weekly / monthly)</div>
        </div>
        <div className="pageActions">{headerRight}</div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      {/* KPI row */}
      <div className="grid grid4">
        <div className="card cardGlow">
          <div className="kpiLabel">Active</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{kpi.active}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Paused</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{kpi.paused}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Est. value (active)</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{money(kpi.monthlyValue)}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Uses override if set, else route pricing.
          </div>
        </div>
        <div className="card">
          <div className="kpiLabel">Shown</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{rows.length}</div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <Card title="Subscriptions" action={<span className="chip">{rows.length} shown</span>}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Route</th>
                <th>Billing</th>
                <th>Seats</th>
                <th>Start</th>
                <th>Next</th>
                <th>Price</th>
                <th style={{ textAlign: "right" }}>Est. Value</th>
                <th>Status</th>
                <th style={{ width: 280 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.subscription_id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 850 }}>{r.customer_name}</span>
                      {r.customer_email ? <span className="muted" style={{ fontSize: 12 }}>{r.customer_email}</span> : null}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 850 }}>{r.route_name}</span>
                      {r.route_leg ? <span className="muted" style={{ fontSize: 12 }}>{r.route_leg}</span> : null}
                    </div>
                  </td>

                  <td style={{ fontWeight: 850 }}>{String(r.billing_period || "").toUpperCase()}</td>
                  <td style={{ fontWeight: 850 }}>{toNum(r.seats)}</td>
                  <td className="muted">{r.start_date}</td>
                  <td className="muted">{r.next_period_start}</td>

                  <td style={{ fontWeight: 850 }}>
                    {money(r.price_unit)}
                    {r.price_override !== null && r.price_override !== undefined ? (
                      <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>(override)</span>
                    ) : null}
                  </td>

                  <td style={{ textAlign: "right", fontWeight: 900 }}>{money(r.est_value)}</td>

                  <td>
                    <StatusBadge tone={toneForStatus(r.status)}>
                      {String(r.status || "").toUpperCase()}
                    </StatusBadge>
                  </td>

                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={() => {
                        setContext?.({ subscription_id: r.subscription_id, customer_id: r.customer_id, route_id: r.route_id });
                        setView?.("subscription_details");
                      }}
                      style={{ marginRight: 8 }}
                    >
                      View
                    </button>

                    {String(r.status).toLowerCase() === "active" ? (
                      <button className="btn btnGhost" type="button" onClick={() => setSubStatus(r.subscription_id, "paused")} style={{ marginRight: 8 }}>
                        Pause
                      </button>
                    ) : null}

                    {String(r.status).toLowerCase() === "paused" ? (
                      <button className="btn btnGhost" type="button" onClick={() => setSubStatus(r.subscription_id, "active")} style={{ marginRight: 8 }}>
                        Activate
                      </button>
                    ) : null}

                    {String(r.status).toLowerCase() !== "cancelled" ? (
                      <button className="btn btnGhost" type="button" onClick={() => setSubStatus(r.subscription_id, "cancelled")}>
                        Cancel
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan={10} className="muted">No subscriptions found for this filter.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE MODAL */}
      {showCreate ? (
        <Modal
          title="New subscription"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={createSubscription} disabled={loading}>
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

            <div>
              <div className="kpiLabel">Route</div>
              <select
                value={createForm.route_id}
                onChange={(e) => setCreateForm((s) => ({ ...s, route_id: e.target.value }))}
              >
                <option value="">Select…</option>
                {routesPick.map((r) => (
                  <option key={r.route_id} value={r.route_id}>
                    {r.route_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Billing period</div>
                <select
                  value={createForm.billing_period}
                  onChange={(e) => setCreateForm((s) => ({ ...s, billing_period: e.target.value }))}
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
                  min={1}
                  value={createForm.seats}
                  onChange={(e) => setCreateForm((s) => ({ ...s, seats: e.target.value }))}
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Start date</div>
                <input
                  className="input"
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm((s) => ({ ...s, start_date: e.target.value }))}
                />
              </div>

              <div>
                <div className="kpiLabel">Status</div>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <div className="kpiLabel">Price override (optional)</div>
              <input
                className="input"
                value={createForm.price_override}
                onChange={(e) => setCreateForm((s) => ({ ...s, price_override: e.target.value }))}
                placeholder="Leave blank to use route pricing"
              />
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                If set, this replaces route pricing for this subscription.
              </div>
            </div>

            <div>
              <div className="kpiLabel">Notes (optional)</div>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Internal notes"
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}