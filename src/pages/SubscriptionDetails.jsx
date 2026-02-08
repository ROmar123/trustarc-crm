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

export default function SubscriptionDetails({ setView, setContext, context }) {
  const subscriptionId = context?.subscription_id;

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [sub, setSub] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [route, setRoute] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [invoices, setInvoices] = useState([]);

  function toneForStatus(s) {
    const v = String(s || "").toLowerCase();
    if (v === "active") return "green";
    if (v === "paused") return "amber";
    if (v === "cancelled") return "red";
    return "muted";
  }

  function currentPriceForRoute(pricingRows, billing_period) {
    if (!pricingRows?.length) return null;
    const latest = pricingRows
      .slice()
      .sort((a, b) => String(b.effective_from).localeCompare(String(a.effective_from)))[0];

    if (!latest) return null;
    return billing_period === "weekly" ? toNum(latest.weekly_price) : toNum(latest.monthly_price);
  }

  async function load() {
    if (!subscriptionId) {
      setToast("No subscription selected.");
      return;
    }

    setLoading(true);
    setToast("");

    try {
      const sRes = await supabase
        .from("subscriptions")
        .select(
          "subscription_id, customer_id, route_id, billing_period, seats, price_override, start_date, next_period_start, status, notes, created_at, updated_at"
        )
        .eq("subscription_id", subscriptionId)
        .single();

      if (sRes.error) throw sRes.error;
      setSub(sRes.data);

      const cRes = await supabase
        .from("customers")
        .select("customer_id, display_name, email, phone, status, created_at")
        .eq("customer_id", sRes.data.customer_id)
        .single();

      if (cRes.error) throw cRes.error;
      setCustomer(cRes.data);

      const rRes = await supabase
        .from("routes")
        .select("route_id, route_name, origin_label, destination_label, is_active, created_at")
        .eq("route_id", sRes.data.route_id)
        .single();

      if (rRes.error) throw rRes.error;
      setRoute(rRes.data);

      const pRes = await supabase
        .from("route_pricing")
        .select("pricing_id, route_id, weekly_price, monthly_price, effective_from, effective_to")
        .eq("route_id", sRes.data.route_id)
        .order("effective_from", { ascending: false })
        .limit(50);

      if (pRes.error) throw pRes.error;
      setPricing(pRes.data || []);

      const invRes = await supabase
        .from("invoices")
        .select("invoice_id, invoice_number, period_start, period_end, total_amount, status, email_status, created_at")
        .eq("subscription_id", subscriptionId)
        .neq("status", "void")
        .order("period_start", { ascending: false })
        .limit(200);

      if (invRes.error) throw invRes.error;
      setInvoices(invRes.data || []);
    } catch (e) {
      setToast(e?.message || "Couldn’t load subscription.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionId]);

  const pricingSnapshot = useMemo(() => {
    if (!sub) return { unit: null, est: null };

    const base = currentPriceForRoute(pricing, sub.billing_period);
    const unit = sub.price_override != null ? toNum(sub.price_override) : base;
    const est = unit == null ? null : unit * toNum(sub.seats);

    return { unit, est };
  }, [sub, pricing]);

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Subscription</div>
          <div className="pageSub">
            {sub ? String(sub.subscription_id).slice(0, 8) : "—"}{" "}
            {route?.route_name ? `• ${route.route_name}` : ""}
          </div>
        </div>

        <div className="pageActions">
          <button className="btn btnGhost" type="button" onClick={() => setView?.("subscriptions")}>
            ← Back to subscriptions
          </button>

          {customer?.customer_id ? (
            <button
              className="btn btnGhost"
              type="button"
              onClick={() => {
                setContext?.({ customer_id: customer.customer_id });
                setView?.("customer_detail");
              }}
            >
              Open customer
            </button>
          ) : null}

          <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      <div className="grid grid2">
        <Card title="Subscription">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <StatusBadge tone={toneForStatus(sub?.status)}>{String(sub?.status || "—").toUpperCase()}</StatusBadge>
            </div>

            <div className="muted">
              Billing: <b>{String(sub?.billing_period || "—").toUpperCase()}</b>
            </div>

            <div className="muted">
              Seats: <b>{toNum(sub?.seats)}</b>
            </div>

            <div className="muted">
              Start: <b>{sub?.start_date || "—"}</b>
            </div>

            <div className="muted">
              Next period start: <b>{sub?.next_period_start || "—"}</b>
            </div>

            <div className="muted">
              Override:{" "}
              <b>{sub?.price_override == null ? "—" : money(sub.price_override)}</b>
            </div>

            <div className="muted">
              Est per period: <b>{pricingSnapshot.est == null ? "—" : money(pricingSnapshot.est)}</b>
            </div>

            {sub?.notes ? (
              <div className="muted" style={{ marginTop: 6 }}>
                Notes: {sub.notes}
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Customer & Route">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900 }}>{customer?.display_name || "—"}</div>
              <div className="muted">{customer?.email || ""}</div>
              <div className="muted">{customer?.phone || ""}</div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />

            <div>
              <div style={{ fontWeight: 900 }}>{route?.route_name || "—"}</div>
              <div className="muted">
                {route?.origin_label || "—"} → {route?.destination_label || "—"}
              </div>
              <div className="muted">Active route: {route?.is_active ? "Yes" : "No"}</div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />

            <div className="muted" style={{ fontSize: 12 }}>
              Pricing snapshot uses the latest <b>route_pricing</b> row (unless override is set).
            </div>
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid grid2">
        <Card title="Invoices (this subscription)" action={<span className="chip">{invoices.length} invoices</span>}>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ width: 180 }} />
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.invoice_id}>
                    <td style={{ fontWeight: 850 }}>{i.invoice_number || String(i.invoice_id).slice(0, 8)}</td>
                    <td className="muted">
                      {i.period_start} → {i.period_end}
                    </td>
                    <td className="muted">{String(i.status || "").toUpperCase()}</td>
                    <td style={{ textAlign: "right", fontWeight: 850 }}>{money(i.total_amount)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btnPrimary"
                        type="button"
                        onClick={() => {
                          setContext?.({ invoice_id: i.invoice_id });
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
                    <td colSpan={5} className="muted">
                      No invoices for this subscription yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Route pricing history" action={<span className="chip">{pricing.length} rows</span>}>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Effective from</th>
                  <th>Effective to</th>
                  <th style={{ textAlign: "right" }}>Weekly</th>
                  <th style={{ textAlign: "right" }}>Monthly</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((p) => (
                  <tr key={p.pricing_id}>
                    <td className="muted">{p.effective_from}</td>
                    <td className="muted">{p.effective_to || "—"}</td>
                    <td style={{ textAlign: "right", fontWeight: 850 }}>{money(p.weekly_price)}</td>
                    <td style={{ textAlign: "right", fontWeight: 850 }}>{money(p.monthly_price)}</td>
                  </tr>
                ))}

                {!pricing.length ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No pricing rows found for this route yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}