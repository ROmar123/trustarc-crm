import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Card from "../components/ui/Card.jsx";

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function isoDate(d) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

/** same modal shell you used in Billing */
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

export default function Subscriptions({ setView, setContext, context }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [status, setStatus] = useState("all"); // all | active | paused | cancelled
  const [q, setQ] = useState("");

  const [subs, setSubs] = useState([]);
  const [customersById, setCustomersById] = useState({});
  const [routesById, setRoutesById] = useState({});

  // ✅ create modal
  const [showCreate, setShowCreate] = useState(false);
  const [customersPick, setCustomersPick] = useState([]);
  const [routesPick, setRoutesPick] = useState([]);

  const [createForm, setCreateForm] = useState({
    customer_id: "",
    route_id: "",
    billing_period: "monthly", // weekly | monthly (per your enum)
    seats: 1,
    status: "active",
    start_date: isoDate(new Date()),
  });

  async function loadPickers() {
    setToast("");
    try {
      const custRes = await supabase
        .from("customers")
        .select("customer_id, display_name, email, status")
        .eq("status", "active")
        .order("display_name", { ascending: true })
        .limit(2000);

      if (custRes.error) throw custRes.error;
      setCustomersPick(custRes.data || []);

      const routeRes = await supabase
        .from("routes")
        .select("route_id, route_name, origin_label, destination_label, is_active")
        .eq("is_active", true)
        .order("route_name", { ascending: true })
        .limit(2000);

      if (routeRes.error) throw routeRes.error;
      setRoutesPick(routeRes.data || []);
    } catch (e) {
      setToast(e?.message || "Could not load pickers.");
      setCustomersPick([]);
      setRoutesPick([]);
    }
  }

  async function createSubscription() {
    setToast("");

    if (!createForm.customer_id) return setToast("Pick a customer.");
    if (!createForm.route_id) return setToast("Pick a route.");

    const seats = toNum(createForm.seats);
    if (seats <= 0) return setToast("Seats must be > 0.");

    // ✅ insert only fields that should exist (if a field doesn’t exist you’ll get a clear error)
    const payload = {
      customer_id: createForm.customer_id,
      route_id: createForm.route_id,
      billing_period: createForm.billing_period,
      seats,
      status: createForm.status,
      start_date: createForm.start_date,
    };

    const { error } = await supabase.from("subscriptions").insert(payload);
    if (error) return setToast(error.message);

    setShowCreate(false);
    setCreateForm({
      customer_id: "",
      route_id: "",
      billing_period: "monthly",
      seats: 1,
      status: "active",
      start_date: isoDate(new Date()),
    });

    await load();
  }

  async function load() {
    setLoading(true);
    setToast("");

    try {
      let qry = supabase
        .from("subscriptions")
        .select(
          "subscription_id, customer_id, route_id, billing_period, seats, status, start_date, next_period_start, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(1500);

      if (status !== "all") qry = qry.eq("status", status);

      const { data, error } = await qry;
      if (error) throw error;

      const rows = data || [];
      setSubs(rows);

      // lookups: customers + routes for list readability
      const custIds = [...new Set(rows.map((r) => r.customer_id).filter(Boolean))];
      const routeIds = [...new Set(rows.map((r) => r.route_id).filter(Boolean))];

      let nextCustomersById = {};
      if (custIds.length) {
        const { data: cust, error: custErr } = await supabase
          .from("customers")
          .select("customer_id, display_name, email")
          .in("customer_id", custIds)
          .limit(2000);

        if (custErr) throw custErr;
        nextCustomersById = Object.fromEntries((cust || []).map((c) => [c.customer_id, c]));
      }
      setCustomersById(nextCustomersById);

      let nextRoutesById = {};
      if (routeIds.length) {
        const { data: rts, error: rtErr } = await supabase
          .from("routes")
          .select("route_id, route_name, origin_label, destination_label, is_active")
          .in("route_id", routeIds)
          .limit(2000);

        if (rtErr) throw rtErr;
        nextRoutesById = Object.fromEntries((rts || []).map((r) => [r.route_id, r]));
      }
      setRoutesById(nextRoutesById);
    } catch (e) {
      setToast(e?.message || "Could not load subscriptions.");
      setSubs([]);
      setCustomersById({});
      setRoutesById({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // pre-load for modal dropdowns
    loadPickers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return subs;
    const qq = q.trim().toLowerCase();

    return subs.filter((s) => {
      const c = customersById[s.customer_id];
      const r = routesById[s.route_id];

      return (
        String(s.subscription_id || "").toLowerCase().includes(qq) ||
        String(c?.display_name || "").toLowerCase().includes(qq) ||
        String(c?.email || "").toLowerCase().includes(qq) ||
        String(r?.route_name || "").toLowerCase().includes(qq) ||
        String(r?.origin_label || "").toLowerCase().includes(qq) ||
        String(r?.destination_label || "").toLowerCase().includes(qq)
      );
    });
  }, [subs, q, customersById, routesById]);

  const kpiTotal = subs.length;
  const kpiActive = subs.filter((s) => String(s.status || "").toLowerCase() === "active").length;
  const kpiSeats = subs.reduce((a, s) => a + toNum(s.seats), 0);

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Subscriptions</div>
          <div className="pageSub">Recurring routes per customer</div>
        </div>

        <div className="pageActions">
          <div style={{ minWidth: 240 }}>
            <div className="kpiLabel">Search</div>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Customer / route / email…"
            />
          </div>

          <div style={{ minWidth: 190 }}>
            <div className="kpiLabel">Filter</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
            Refresh
          </button>

          <button className="btn btnPrimary" type="button" onClick={() => setShowCreate(true)} disabled={loading}>
            + Subscription
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      {/* KPI strip */}
      <div className="grid grid3" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="kpiLabel">Total subscriptions</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{kpiTotal}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Active</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{kpiActive}</div>
        </div>
        <div className="card">
          <div className="kpiLabel">Total seats</div>
          <div className="kpiValue" style={{ fontSize: 22 }}>{kpiSeats}</div>
        </div>
      </div>

      <Card title="Subscription list" action={<span className="chip">{filtered.length} shown</span>}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Route</th>
                <th>Billing</th>
                <th style={{ textAlign: "right" }}>Seats</th>
                <th>Status</th>
                <th>Start</th>
                <th style={{ width: 140 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const c = customersById[s.customer_id];
                const r = routesById[s.route_id];

                const custName = c?.display_name || "—";
                const custEmail = c?.email || "";

                const routeName =
                  r?.route_name ||
                  (r?.origin_label && r?.destination_label ? `${r.origin_label} → ${r.destination_label}` : "—");

                return (
                  <tr key={s.subscription_id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 850 }}>{custName}</span>
                        {custEmail ? <span className="muted" style={{ fontSize: 12 }}>{custEmail}</span> : null}
                      </div>
                    </td>

                    <td style={{ fontWeight: 850 }}>{routeName}</td>

                    <td className="muted">{s.billing_period || "—"}</td>

                    <td style={{ textAlign: "right" }}>{toNum(s.seats)}</td>

                    <td>{String(s.status || "—")}</td>

                    <td className="muted">{s.start_date || "—"}</td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btnPrimary"
                        type="button"
                        onClick={() => {
                          setContext?.({ subscription_id: s.subscription_id });
                          setView?.("subscription_details");
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No subscriptions found.
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
                    {r.route_name ||
                      (r.origin_label && r.destination_label ? `${r.origin_label} → ${r.destination_label}` : r.route_id)}
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

            <div className="muted" style={{ fontSize: 12 }}>
              Tip: pricing will come from the latest <b>route_pricing</b> row in your details page.
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}