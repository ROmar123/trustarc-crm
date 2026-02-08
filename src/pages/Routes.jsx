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
function hasCoords(r) {
  return (
    r?.origin_lat != null &&
    r?.origin_lng != null &&
    r?.destination_lat != null &&
    r?.destination_lng != null
  );
}

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

  if (kind === "route")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M6 6h11a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h11" />
        <path d="M6 6v0" />
        <path d="M18 18v0" />
      </svg>
    );

  if (kind === "active")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l3 3 5-7" />
      </svg>
    );

  if (kind === "map")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z" />
        <circle cx="12" cy="11" r="2" />
      </svg>
    );

  if (kind === "missing")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    );

  if (kind === "plus")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );

  if (kind === "edit")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
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

export default function Routes({ setView, setContext }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | inactive | map_ready | missing_coords

  const [rows, setRows] = useState([]);
  const [kpis, setKpis] = useState({
    total: 0,
    active: 0,
    mapReady: 0,
    missing: 0,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRoute, setEditRoute] = useState(null);

  const [form, setForm] = useState({
    route_name: "",
    origin_label: "",
    destination_label: "",
    origin_lat: "",
    origin_lng: "",
    destination_lat: "",
    destination_lng: "",
    is_active: true,
  });

  function resetForm() {
    setForm({
      route_name: "",
      origin_label: "",
      destination_label: "",
      origin_lat: "",
      origin_lng: "",
      destination_lat: "",
      destination_lng: "",
      is_active: true,
    });
  }

  function hydrateFormFromRoute(r) {
    setForm({
      route_name: r?.route_name || "",
      origin_label: r?.origin_label || "",
      destination_label: r?.destination_label || "",
      origin_lat: r?.origin_lat ?? "",
      origin_lng: r?.origin_lng ?? "",
      destination_lat: r?.destination_lat ?? "",
      destination_lng: r?.destination_lng ?? "",
      is_active: !!r?.is_active,
    });
  }

  async function load() {
    setLoading(true);
    setToast("");

    try {
      // 1) routes
      const rRes = await supabase
        .from("routes")
        .select(
          "route_id, route_name, origin_label, destination_label, is_active, origin_lat, origin_lng, destination_lat, destination_lng, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(1000);

      if (rRes.error) throw rRes.error;
      const routes = rRes.data || [];

      // 2) subscriptions (for subscribed totals)
      const sRes = await supabase
        .from("subscriptions")
        .select("subscription_id, route_id, customer_id, seats, status, billing_period")
        .limit(5000);

      if (sRes.error) throw sRes.error;
      const subs = sRes.data || [];

      const subsByRoute = {};
      for (const s of subs) {
        const rid = s.route_id;
        if (!rid) continue;
        if (!subsByRoute[rid]) subsByRoute[rid] = [];
        subsByRoute[rid].push(s);
      }

      // 3) invoices (for invoiced totals) — we map by subscription_id -> route_id using the above
      const subIdToRoute = Object.fromEntries(subs.map((s) => [s.subscription_id, s.route_id]));

      const iRes = await supabase
        .from("invoices")
        .select("invoice_id, subscription_id, total_amount, status, created_at")
        .neq("status", "void")
        .limit(8000);

      if (iRes.error) throw iRes.error;
      const invoices = iRes.data || [];

      const invoicedByRoute = {};
      for (const inv of invoices) {
        const rid = subIdToRoute[inv.subscription_id];
        if (!rid) continue;
        invoicedByRoute[rid] = (invoicedByRoute[rid] || 0) + toNum(inv.total_amount);
      }

      // 4) accounts_receivable view for outstanding balances
      const arRes = await supabase
        .from("accounts_receivable")
        .select("invoice_id, subscription_id, balance_amount")
        .limit(8000);

      if (arRes.error) throw arRes.error;
      const ar = arRes.data || [];

      const outstandingByRoute = {};
      for (const row of ar) {
        const rid = subIdToRoute[row.subscription_id];
        if (!rid) continue;
        outstandingByRoute[rid] = (outstandingByRoute[rid] || 0) + toNum(row.balance_amount);
      }

      // map
      let mapped = routes.map((r) => {
        const routeSubs = subsByRoute[r.route_id] || [];
        const activeSubs = routeSubs.filter((s) => String(s.status || "") === "active");

        const customersActive = new Set(activeSubs.map((s) => s.customer_id).filter(Boolean));
        const seatsActive = activeSubs.reduce((a, s) => a + toNum(s.seats), 0);

        const invoiced = toNum(invoicedByRoute[r.route_id]);
        const outstanding = toNum(outstandingByRoute[r.route_id]);

        const mapReady = hasCoords(r);

        return {
          ...r,
          map_ready: mapReady,
          active_customers: customersActive.size,
          active_seats: seatsActive,
          invoiced_value: invoiced,
          outstanding_value: outstanding,
        };
      });

      // KPIs
      const total = mapped.length;
      const active = mapped.filter((r) => r.is_active).length;
      const mapReady = mapped.filter((r) => r.map_ready).length;
      const missing = mapped.filter((r) => !r.map_ready).length;

      setKpis({ total, active, mapReady, missing });

      // filters
      if (filter === "active") mapped = mapped.filter((r) => r.is_active);
      if (filter === "inactive") mapped = mapped.filter((r) => !r.is_active);
      if (filter === "map_ready") mapped = mapped.filter((r) => r.map_ready);
      if (filter === "missing_coords") mapped = mapped.filter((r) => !r.map_ready);

      // search
      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        mapped = mapped.filter((r) => {
          return (
            String(r.route_name || "").toLowerCase().includes(qq) ||
            String(r.origin_label || "").toLowerCase().includes(qq) ||
            String(r.destination_label || "").toLowerCase().includes(qq)
          );
        });
      }

      setRows(mapped);
    } catch (e) {
      setToast(e?.message || "Couldn’t load routes.");
      setRows([]);
      setKpis({ total: 0, active: 0, mapReady: 0, missing: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function createRoute() {
    setToast("");

    const name = String(form.route_name || "").trim();
    if (!name) return setToast("Route name is required.");

    const payload = {
      route_name: name,
      origin_label: String(form.origin_label || "").trim() || null,
      destination_label: String(form.destination_label || "").trim() || null,
      is_active: !!form.is_active,
      origin_lat: form.origin_lat === "" ? null : toNum(form.origin_lat),
      origin_lng: form.origin_lng === "" ? null : toNum(form.origin_lng),
      destination_lat: form.destination_lat === "" ? null : toNum(form.destination_lat),
      destination_lng: form.destination_lng === "" ? null : toNum(form.destination_lng),
    };

    const res = await supabase.from("routes").insert(payload);
    if (res.error) return setToast(res.error.message);

    setShowCreate(false);
    resetForm();
    await load();
  }

  async function saveEdit() {
    if (!editRoute?.route_id) return;

    setToast("");

    const name = String(form.route_name || "").trim();
    if (!name) return setToast("Route name is required.");

    const payload = {
      route_name: name,
      origin_label: String(form.origin_label || "").trim() || null,
      destination_label: String(form.destination_label || "").trim() || null,
      is_active: !!form.is_active,
      origin_lat: form.origin_lat === "" ? null : toNum(form.origin_lat),
      origin_lng: form.origin_lng === "" ? null : toNum(form.origin_lng),
      destination_lat: form.destination_lat === "" ? null : toNum(form.destination_lat),
      destination_lng: form.destination_lng === "" ? null : toNum(form.destination_lng),
    };

    const res = await supabase.from("routes").update(payload).eq("route_id", editRoute.route_id);
    if (res.error) return setToast(res.error.message);

    setShowEdit(false);
    setEditRoute(null);
    resetForm();
    await load();
  }

  async function toggleActive(route) {
    setToast("");
    const res = await supabase
      .from("routes")
      .update({ is_active: !route.is_active })
      .eq("route_id", route.route_id);

    if (res.error) return setToast(res.error.message);
    await load();
  }

  function statusTone(r) {
    if (!r.is_active) return "muted";
    if (r.map_ready) return "green";
    return "amber";
  }

  function statusLabel(r) {
    if (!r.is_active) return "INACTIVE";
    if (r.map_ready) return "ACTIVE • MAP READY";
    return "ACTIVE • NEEDS COORDS";
  }

  const headerRight = (
    <>
      <div style={{ minWidth: 260 }}>
        <div className="kpiLabel">Search</div>
        <input
          className="input"
          placeholder="Route / origin / destination…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div style={{ minWidth: 220 }}>
        <div className="kpiLabel">Filter</div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All routes</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="map_ready">Map ready</option>
          <option value="missing_coords">Missing coords</option>
        </select>
      </div>

      <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
        Refresh
      </button>

      <button
        className="btn btnPrimary"
        type="button"
        onClick={() => {
          resetForm();
          setShowCreate(true);
        }}
      >
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <Icon kind="plus" /> + Route
        </span>
      </button>
    </>
  );

  const filteredRows = useMemo(() => {
    // apply search client-side after load as well
    let x = [...rows];
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      x = x.filter((r) => {
        return (
          String(r.route_name || "").toLowerCase().includes(qq) ||
          String(r.origin_label || "").toLowerCase().includes(qq) ||
          String(r.destination_label || "").toLowerCase().includes(qq)
        );
      });
    }
    return x;
  }, [rows, q]);

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Routes</div>
          <div className="pageSub">Create, maintain and price your routes</div>
        </div>
        <div className="pageActions">{headerRight}</div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      {/* KPI cards */}
      <div className="grid grid4">
        <div className="card cardGlow">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Total routes</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.total}</div>
            </div>
            <div className="kpiIcon"><Icon kind="route" /></div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Active</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.active}</div>
            </div>
            <div className="kpiIcon"><Icon kind="active" /></div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Map ready</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.mapReady}</div>
            </div>
            <div className="kpiIcon"><Icon kind="map" /></div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Missing coords</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.missing}</div>
            </div>
            <div className="kpiIcon"><Icon kind="missing" /></div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <Card title="Route list" action={<span className="chip">{filteredRows.length} shown</span>}>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 280 }}>Route</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Active subs</th>
                <th style={{ textAlign: "right" }}>Active seats</th>
                <th style={{ textAlign: "right" }}>Invoiced</th>
                <th style={{ textAlign: "right" }}>Outstanding</th>
                <th style={{ width: 300 }} />
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.route_id}>
                  <td style={{ fontWeight: 900 }}>{r.route_name}</td>
                  <td className="muted">{r.origin_label || "—"}</td>
                  <td className="muted">{r.destination_label || "—"}</td>
                  <td>
                    <StatusBadge tone={statusTone(r)}>{statusLabel(r)}</StatusBadge>
                  </td>

                  <td style={{ textAlign: "right", fontWeight: 900 }}>{toNum(r.active_customers)}</td>
                  <td style={{ textAlign: "right", fontWeight: 900 }}>{toNum(r.active_seats)}</td>
                  <td style={{ textAlign: "right", fontWeight: 900 }}>{money(r.invoiced_value)}</td>
                  <td style={{ textAlign: "right", fontWeight: 900 }}>{money(r.outstanding_value)}</td>

                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={() => toggleActive(r)}
                      style={{ marginRight: 8 }}
                    >
                      {r.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={() => {
                        setEditRoute(r);
                        hydrateFormFromRoute(r);
                        setShowEdit(true);
                      }}
                      style={{ marginRight: 8 }}
                    >
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <Icon kind="edit" /> Edit
                      </span>
                    </button>

                    <button
                      className="btn btnPrimary"
                      type="button"
                      onClick={() => {
                        setContext?.({ route_id: r.route_id });
                        setView?.("route_details");
                      }}
                    >
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <Icon kind="view" /> View
                      </span>
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredRows.length ? (
                <tr>
                  <td colSpan={9} className="muted">
                    No routes found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE MODAL */}
      {showCreate ? (
        <Modal
          title="New route"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={createRoute} disabled={loading}>
                Create
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div>
              <div className="kpiLabel">Route name</div>
              <input
                className="input"
                value={form.route_name}
                onChange={(e) => setForm((s) => ({ ...s, route_name: e.target.value }))}
                placeholder="e.g. Lansdowne → Cape Town"
              />
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Origin label</div>
                <input
                  className="input"
                  value={form.origin_label}
                  onChange={(e) => setForm((s) => ({ ...s, origin_label: e.target.value }))}
                  placeholder="e.g. Lansdowne"
                />
              </div>

              <div>
                <div className="kpiLabel">Destination label</div>
                <input
                  className="input"
                  value={form.destination_label}
                  onChange={(e) => setForm((s) => ({ ...s, destination_label: e.target.value }))}
                  placeholder="e.g. Cape Town"
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Origin lat</div>
                <input
                  className="input"
                  type="number"
                  value={form.origin_lat}
                  onChange={(e) => setForm((s) => ({ ...s, origin_lat: e.target.value }))}
                  placeholder="-33.98"
                />
              </div>
              <div>
                <div className="kpiLabel">Origin lng</div>
                <input
                  className="input"
                  type="number"
                  value={form.origin_lng}
                  onChange={(e) => setForm((s) => ({ ...s, origin_lng: e.target.value }))}
                  placeholder="18.50"
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Destination lat</div>
                <input
                  className="input"
                  type="number"
                  value={form.destination_lat}
                  onChange={(e) => setForm((s) => ({ ...s, destination_lat: e.target.value }))}
                  placeholder="-33.93"
                />
              </div>
              <div>
                <div className="kpiLabel">Destination lng</div>
                <input
                  className="input"
                  type="number"
                  value={form.destination_lng}
                  onChange={(e) => setForm((s) => ({ ...s, destination_lng: e.target.value }))}
                  placeholder="18.42"
                />
              </div>
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              <span>Active</span>
            </label>

            <div className="muted" style={{ fontSize: 12 }}>
              Tip: Coords are optional now — but “Map ready” routes show better in operations.
            </div>
          </div>
        </Modal>
      ) : null}

      {/* EDIT MODAL */}
      {showEdit && editRoute ? (
        <Modal
          title={`Edit route — ${editRoute.route_name}`}
          onClose={() => {
            setShowEdit(false);
            setEditRoute(null);
          }}
          footer={
            <>
              <button
                className="btn btnGhost"
                type="button"
                onClick={() => {
                  setShowEdit(false);
                  setEditRoute(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={saveEdit} disabled={loading}>
                Save
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div>
              <div className="kpiLabel">Route name</div>
              <input
                className="input"
                value={form.route_name}
                onChange={(e) => setForm((s) => ({ ...s, route_name: e.target.value }))}
              />
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Origin label</div>
                <input
                  className="input"
                  value={form.origin_label}
                  onChange={(e) => setForm((s) => ({ ...s, origin_label: e.target.value }))}
                />
              </div>

              <div>
                <div className="kpiLabel">Destination label</div>
                <input
                  className="input"
                  value={form.destination_label}
                  onChange={(e) => setForm((s) => ({ ...s, destination_label: e.target.value }))}
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Origin lat</div>
                <input
                  className="input"
                  type="number"
                  value={form.origin_lat}
                  onChange={(e) => setForm((s) => ({ ...s, origin_lat: e.target.value }))}
                />
              </div>
              <div>
                <div className="kpiLabel">Origin lng</div>
                <input
                  className="input"
                  type="number"
                  value={form.origin_lng}
                  onChange={(e) => setForm((s) => ({ ...s, origin_lng: e.target.value }))}
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Destination lat</div>
                <input
                  className="input"
                  type="number"
                  value={form.destination_lat}
                  onChange={(e) => setForm((s) => ({ ...s, destination_lat: e.target.value }))}
                />
              </div>
              <div>
                <div className="kpiLabel">Destination lng</div>
                <input
                  className="input"
                  type="number"
                  value={form.destination_lng}
                  onChange={(e) => setForm((s) => ({ ...s, destination_lng: e.target.value }))}
                />
              </div>
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              <span>Active</span>
            </label>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}