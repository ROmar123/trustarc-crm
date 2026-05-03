import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Card from "../components/ui/Card.jsx";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons for many Vite setups
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

export default function RouteDetails({ setView, context }) {
  const routeId = context?.route_id;

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [route, setRoute] = useState(null);
  const [pricing, setPricing] = useState([]);

  const [subs, setSubs] = useState([]);
  const [invoicedTotal, setInvoicedTotal] = useState(0);
  const [outstandingTotal, setOutstandingTotal] = useState(0);

  const [showMap, setShowMap] = useState(true);

  const [showAddPrice, setShowAddPrice] = useState(false);
  const [priceForm, setPriceForm] = useState({
    weekly_price: 0,
    monthly_price: 0,
    effective_from: todayISO(),
    effective_to: "",
  });

  async function load() {
    if (!routeId) {
      setToast("No route selected.");
      return;
    }

    setLoading(true);
    setToast("");

    try {
      // 1) route
      const rRes = await supabase
        .from("routes")
        .select("route_id, route_name, origin_label, destination_label, is_active, origin_lat, origin_lng, destination_lat, destination_lng, created_at")
        .eq("route_id", routeId)
        .single();
      if (rRes.error) throw rRes.error;
      setRoute(rRes.data);

      // 2) pricing
      const pRes = await supabase
        .from("route_pricing")
        .select("pricing_id, route_id, weekly_price, monthly_price, effective_from, effective_to, created_at")
        .eq("route_id", routeId)
        .order("effective_from", { ascending: false });
      if (pRes.error) throw pRes.error;
      setPricing(pRes.data || []);

      // 3) subscriptions for this route
      const sRes = await supabase
        .from("subscriptions")
        .select("subscription_id, customer_id, seats, billing_period, status, start_date, next_period_start")
        .eq("route_id", routeId)
        .limit(5000);
      if (sRes.error) throw sRes.error;
      const subRows = sRes.data || [];
      setSubs(subRows);

      // 4) invoice totals by mapping subscription_id -> route
      const subIds = subRows.map((s) => s.subscription_id).filter(Boolean);

      let invTotal = 0;
      if (subIds.length) {
        const invRes = await supabase
          .from("invoices")
          .select("invoice_id, subscription_id, total_amount, status")
          .in("subscription_id", subIds)
          .neq("status", "void")
          .limit(8000);
        if (invRes.error) throw invRes.error;
        invTotal = (invRes.data || []).reduce((a, r) => a + toNum(r.total_amount), 0);
      }
      setInvoicedTotal(invTotal);

      // 5) outstanding from accounts_receivable
      let outTotal = 0;
      if (subIds.length) {
        const arRes = await supabase
          .from("accounts_receivable")
          .select("subscription_id, balance_amount")
          .in("subscription_id", subIds)
          .limit(8000);
        if (arRes.error) throw arRes.error;
        outTotal = (arRes.data || []).reduce((a, r) => a + toNum(r.balance_amount), 0);
      }
      setOutstandingTotal(outTotal);
    } catch (e) {
      setToast(e?.message || "Couldn’t load route details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const kpis = useMemo(() => {
    const activeSubs = subs.filter((s) => String(s.status || "") === "active");
    const activeCustomers = new Set(activeSubs.map((s) => s.customer_id).filter(Boolean)).size;
    const activeSeats = activeSubs.reduce((a, s) => a + toNum(s.seats), 0);

    const totalSubs = subs.length;
    const paused = subs.filter((s) => String(s.status || "") === "paused").length;
    const cancelled = subs.filter((s) => String(s.status || "") === "cancelled").length;

    return {
      activeCustomers,
      activeSeats,
      totalSubs,
      paused,
      cancelled,
    };
  }, [subs]);

  const currentWeekly = useMemo(() => {
    const t = todayISO();
    const row = pricing.find(
      (p) => p.effective_from <= t && (!p.effective_to || p.effective_to >= t)
    );
    return row ? toNum(row.weekly_price) : null;
  }, [pricing]);

  const currentMonthly = useMemo(() => {
    const t = todayISO();
    const row = pricing.find(
      (p) => p.effective_from <= t && (!p.effective_to || p.effective_to >= t)
    );
    return row ? toNum(row.monthly_price) : null;
  }, [pricing]);

  const mapData = useMemo(() => {
    if (!route || !hasCoords(route)) return null;
    const o = [toNum(route.origin_lat), toNum(route.origin_lng)];
    const d = [toNum(route.destination_lat), toNum(route.destination_lng)];
    const mid = [(o[0] + d[0]) / 2, (o[1] + d[1]) / 2];
    return { o, d, mid };
  }, [route]);

  async function addPricing() {
    if (!routeId) return;

    setToast("");

    const weekly = toNum(priceForm.weekly_price);
    const monthly = toNum(priceForm.monthly_price);
    const effectiveFrom = String(priceForm.effective_from || "").trim();
    const effectiveTo = String(priceForm.effective_to || "").trim();

    if (!effectiveFrom) return setToast("effective_from is required.");

    const payload = {
      route_id: routeId,
      weekly_price: weekly,
      monthly_price: monthly,
      effective_from: effectiveFrom,
      effective_to: effectiveTo ? effectiveTo : null,
    };

    const res = await supabase.from("route_pricing").insert(payload);
    if (res.error) return setToast(res.error.message);

    setShowAddPrice(false);
    setPriceForm({ weekly_price: 0, monthly_price: 0, effective_from: todayISO(), effective_to: "" });
    await load();
  }

  async function deletePricing(pricing_id) {
    setToast("");
    const res = await supabase.from("route_pricing").delete().eq("pricing_id", pricing_id);
    if (res.error) return setToast(res.error.message);
    await load();
  }

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Route</div>
          <div className="pageSub">
            {route?.route_name || "—"}{" "}
            {route?.origin_label && route?.destination_label
              ? `• ${route.origin_label} → ${route.destination_label}`
              : ""}
          </div>
        </div>

        <div className="pageActions">
          <button className="btn btnGhost" type="button" onClick={() => setView?.("routes")}>
            ← Back to routes
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      {/* Top KPIs */}
      <div className="grid grid4">
        <div className="card cardGlow">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Active subscribers</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.activeCustomers}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Active seats</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{kpis.activeSeats}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Invoiced value</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{money(invoicedTotal)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Outstanding</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>{money(outstandingTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid grid2">
        <Card title="Route profile">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{route?.route_name || "—"}</div>
            <div className="muted">
              {route?.origin_label || "—"} → {route?.destination_label || "—"}
            </div>
            <div className="muted">
              Status: <b>{route?.is_active ? "ACTIVE" : "INACTIVE"}</b>
            </div>
            <div className="muted">
              Map: <b>{route && hasCoords(route) ? "READY" : "MISSING COORDS"}</b>
            </div>

            <div style={{ height: 8 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="chip">
                Weekly now: <b>{currentWeekly == null ? "—" : money(currentWeekly)}</b>
              </span>
              <span className="chip">
                Monthly now: <b>{currentMonthly == null ? "—" : money(currentMonthly)}</b>
              </span>
              <span className="chip">
                Subs: <b>{kpis.totalSubs}</b> (paused {kpis.paused} / cancelled {kpis.cancelled})
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Map"
          action={
            <button className="btn btnGhost" type="button" onClick={() => setShowMap((s) => !s)}>
              {showMap ? "Hide" : "Show"}
            </button>
          }
        >
          {!showMap ? (
            <div className="muted">Map hidden.</div>
          ) : mapData ? (
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)" }}>
              <MapContainer
                center={mapData.mid}
                zoom={10}
                style={{ height: 360, width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapData.o}>
                  <Popup>
                    <b>Origin</b>
                    <br />
                    {route?.origin_label || "—"}
                  </Popup>
                </Marker>
                <Marker position={mapData.d}>
                  <Popup>
                    <b>Destination</b>
                    <br />
                    {route?.destination_label || "—"}
                  </Popup>
                </Marker>
                <Polyline positions={[mapData.o, mapData.d]} />
              </MapContainer>
            </div>
          ) : (
            <div className="muted">
              No coordinates saved for this route yet. Add origin/destination lat/lng in Edit.
            </div>
          )}
        </Card>
      </div>

      <div style={{ height: 14 }} />

      {/* Pricing */}
      <Card
        title="Route pricing"
        action={
          <button className="btn btnPrimary" type="button" onClick={() => setShowAddPrice(true)} disabled={loading}>
            + Add pricing
          </button>
        }
      >
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Effective from</th>
                <th>Effective to</th>
                <th style={{ textAlign: "right" }}>Weekly</th>
                <th style={{ textAlign: "right" }}>Monthly</th>
                <th style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => (
                <tr key={p.pricing_id}>
                  <td>{p.effective_from}</td>
                  <td className="muted">{p.effective_to || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 900 }}>{money(p.weekly_price)}</td>
                  <td style={{ textAlign: "right", fontWeight: 900 }}>{money(p.monthly_price)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btnGhost" type="button" onClick={() => deletePricing(p.pricing_id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {!pricing.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No pricing configured yet. Add at least one effective price to enable invoice generation.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add pricing modal */}
      {showAddPrice ? (
        <Modal
          title="Add route pricing"
          onClose={() => setShowAddPrice(false)}
          footer={
            <>
              <button className="btn btnGhost" type="button" onClick={() => setShowAddPrice(false)}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="button" onClick={addPricing} disabled={loading}>
                Save
              </button>
            </>
          }
        >
          <div className="formGrid">
            <div className="formRow2">
              <div>
                <div className="kpiLabel">Weekly price (R)</div>
                <input
                  className="input"
                  type="number"
                  value={priceForm.weekly_price}
                  onChange={(e) => setPriceForm((s) => ({ ...s, weekly_price: e.target.value }))}
                />
              </div>
              <div>
                <div className="kpiLabel">Monthly price (R)</div>
                <input
                  className="input"
                  type="number"
                  value={priceForm.monthly_price}
                  onChange={(e) => setPriceForm((s) => ({ ...s, monthly_price: e.target.value }))}
                />
              </div>
            </div>

            <div className="formRow2">
              <div>
                <div className="kpiLabel">Effective from</div>
                <input
                  className="input"
                  type="date"
                  value={priceForm.effective_from}
                  onChange={(e) => setPriceForm((s) => ({ ...s, effective_from: e.target.value }))}
                />
              </div>
              <div>
                <div className="kpiLabel">Effective to (optional)</div>
                <input
                  className="input"
                  type="date"
                  value={priceForm.effective_to}
                  onChange={(e) => setPriceForm((s) => ({ ...s, effective_to: e.target.value }))}
                />
              </div>
            </div>

            <div className="muted" style={{ fontSize: 12 }}>
              Pricing is versioned. Keep ranges clean (no overlaps), and always have one active row for “today”.
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}