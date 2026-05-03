import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import ReactECharts from "echarts-for-react";

import Card from "../components/ui/Card.jsx";
import Table from "../components/ui/Table.jsx";

function iso(d) {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 10);
}

function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0..6 (Sun..Sat)
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfWeek(d) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
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

function money(n) {
  const v = Number(n || 0);
  return `R ${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function sum(arr, key) {
  return (arr || []).reduce((a, r) => a + Number(r?.[key] || 0), 0);
}

// ---- Bucketing helpers (Week/Month bars) ----
function weekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday
  d.setDate(d.getDate() + diff);
  return iso(d); // week start YYYY-MM-DD
}
function monthKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
}

// ---- Icons (inline) ----
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

  if (kind === "users")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  if (kind === "route")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 19h6a4 4 0 0 0 4-4V5" />
        <path d="M20 5h-6a4 4 0 0 0-4 4v10" />
        <circle cx="14" cy="5" r="2" />
        <circle cx="10" cy="19" r="2" />
      </svg>
    );
  if (kind === "subs")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M20 7H4" />
        <path d="M20 12H4" />
        <path d="M20 17H4" />
        <path d="M7 7v10" />
      </svg>
    );
  if (kind === "target")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
      </svg>
    );
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
  if (kind === "credit")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <path d="M16 11h2" />
        <path d="M6 11h6" />
      </svg>
    );
  return null;
}

export default function Overview({ setView, setContext }) {
  // ✅ removed: preset + anchor
  // const [preset, setPreset] = useState("month");
  // const [anchor, setAnchor] = useState(() => new Date());

  // keep your date range
  const [from, setFrom] = useState(() => iso(startOfMonth(new Date())));
  const [to, setTo] = useState(() => iso(endOfMonth(new Date())));

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Trend toggle (Issued / Paid / Due)
  const [trendMetric, setTrendMetric] = useState("issued"); // issued | paid | due

  const [kpis, setKpis] = useState({
    customers: 0,
    routes: 0,
    activeSubs: 0,
    expected: 0,
    invoiced: 0,
    paid: 0,
    due: 0,
    credit: 0,
  });

  const [dueRows, setDueRows] = useState([]);
  const [creditRows, setCreditRows] = useState([]);
  const [pendingSend, setPendingSend] = useState({ count: 0, total: 0 });

  const [trendBuckets, setTrendBuckets] = useState({
    labels: [],
    issued: [],
    paid: [],
    due: [],
    bucketMode: "week",
  });

  // ✅ removed: rangeLabel + preset->date auto-apply
  // const rangeLabel = useMemo(() => {
  //   if (preset === "week") return "This Week";
  //   if (preset === "month") return "This Month";
  //   return "Custom";
  // }, [preset]);

  // useEffect(() => {
  //   if (preset === "week") {
  //     setFrom(iso(startOfWeek(anchor)));
  //     setTo(iso(endOfWeek(anchor)));
  //   } else if (preset === "month") {
  //     setFrom(iso(startOfMonth(anchor)));
  //     setTo(iso(endOfMonth(anchor)));
  //   }
  // }, [preset, anchor]);

  const collectionPct = useMemo(() => {
    const denom = Number(kpis.invoiced || 0);
    if (denom <= 0) return 0;
    return Math.max(0, Math.min(100, (Number(kpis.paid || 0) / denom) * 100));
  }, [kpis]);

  // ---- Data load ----
  async function load() {
    setLoading(true);
    setToast("");

    try {
      const startISO = from;
      const endISO = to;

      // counts
      const [cust, routes, subs] = await Promise.all([
        supabase
          .from("customers")
          .select("customer_id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("routes")
          .select("route_id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("subscriptions")
          .select("subscription_id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      // invoices in range (real)
      const invRes = await supabase
        .from("invoices")
        .select("invoice_id,total_amount,status,period_start,period_end")
        .neq("status", "void")
        .gte("period_start", startISO)
        .lte("period_start", endISO);

      const invRows = invRes.data || [];
      const invoicedTotal = sum(invRows, "total_amount");
      const paidInvoicesTotal = invRows
        .filter((r) => String(r.status).toLowerCase() === "paid")
        .reduce((a, r) => a + Number(r.total_amount || 0), 0);

      // AR in range (real)
      const arRes = await supabase
        .from("accounts_receivable")
        .select(
          "invoice_id,invoice_number,customer_id,customer_name,period_start,period_end,total_amount,paid_amount,balance_amount,created_at"
        )
        .gte("period_start", startISO)
        .lte("period_start", endISO)
        .order("balance_amount", { ascending: false })
        .limit(50);

      const ar = arRes.data || [];
      const dueTotal = sum(ar, "balance_amount");
      const paidFromAR = ar.reduce(
        (a, r) => a + Number(r.paid_amount || 0),
        0
      );

      const paidTotal = Math.max(paidInvoicesTotal, paidFromAR);

      // customer credit
      const creditRes = await supabase
        .from("customer_credit")
        .select("customer_id,display_name,email,credit_balance")
        .gt("credit_balance", 0)
        .order("credit_balance", { ascending: false })
        .limit(50);

      const creditList = creditRes.data || [];
      const creditTotal = creditList.reduce(
        (a, r) => a + Number(r.credit_balance || 0),
        0
      );

      // pending sends
      const pendingRes = await supabase
        .from("invoices_to_email")
        .select("invoice_id,total_amount,balance_amount")
        .limit(500);

      const pending = pendingRes.data || [];
      setPendingSend({
        count: pending.length,
        total: sum(pending, "balance_amount"),
      });

      // expected (active subs + pricing)
      const subsRowsRes = await supabase
        .from("subscriptions")
        .select(
          "subscription_id,customer_id,route_id,billing_period,seats,price_override,status"
        )
        .eq("status", "active");

      const subsRows = subsRowsRes.data || [];
      const effectiveDate = startISO;

      const routeIds = [
        ...new Set(subsRows.map((s) => s.route_id).filter(Boolean)),
      ];

      let pricingByRoute = {};
      if (routeIds.length) {
        const pricing = await supabase
          .from("route_pricing")
          .select(
            "route_id,weekly_price,monthly_price,effective_from,effective_to"
          )
          .in("route_id", routeIds)
          .lte("effective_from", effectiveDate)
          .or(`effective_to.is.null,effective_to.gte.${effectiveDate}`);

        (pricing.data || []).forEach((p) => {
          const cur = pricingByRoute[p.route_id];
          if (!cur || String(p.effective_from) > String(cur.effective_from)) {
            pricingByRoute[p.route_id] = p;
          }
        });
      }

      const expected = subsRows.reduce((acc, s) => {
        const seats = Number(s.seats || 1);
        const override =
          s.price_override !== null &&
          s.price_override !== undefined &&
          s.price_override !== ""
            ? Number(s.price_override)
            : null;

        if (override !== null && !Number.isNaN(override))
          return acc + override * seats;

        const p = pricingByRoute[s.route_id];
        if (!p) return acc;

        const price =
          s.billing_period === "monthly"
            ? Number(p.monthly_price || 0)
            : Number(p.weekly_price || 0);

        return acc + price * seats;
      }, 0);

      setKpis({
        customers: cust.count || 0,
        routes: routes.count || 0,
        activeSubs: subs.count || 0,
        expected,
        invoiced: invoicedTotal,
        paid: paidTotal,
        due: dueTotal,
        credit: creditTotal,
      });

      // tables (top 8)
      setDueRows(
        ar.slice(0, 8).map((r) => ({
          invoice_id: r.invoice_id,
          invoice_number: r.invoice_number,
          customer_name: r.customer_name,
          period: `${r.period_start} → ${r.period_end}`,
          balance_amount: Number(r.balance_amount || 0),
          balance: money(r.balance_amount),
        }))
      );

      setCreditRows(
        creditList.slice(0, 8).map((r) => ({
          customer_id: r.customer_id,
          display_name: r.display_name,
          email: r.email,
          credit_amount: Number(r.credit_balance || 0),
          credit: money(r.credit_balance),
        }))
      );

      // ---- Trend buckets (REAL sums) weekly/monthly ----
      const start = new Date(startISO + "T00:00:00");
      const end = new Date(endISO + "T00:00:00");
      const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
      const bucketMode = days > 45 ? "month" : "week";

      const buckets = {}; // key -> {issued, paid, due}
      const order = [];

      const ensure = (k) => {
        if (!buckets[k]) {
          buckets[k] = { issued: 0, paid: 0, due: 0 };
          order.push(k);
        }
      };

      const keyOf = (dateStr) => {
        if (!dateStr) return null;
        return bucketMode === "month" ? monthKey(dateStr) : weekKey(dateStr);
      };

      invRows.forEach((r) => {
        const k = keyOf(r.period_start);
        if (!k) return;
        ensure(k);
        const amt = Number(r.total_amount || 0);
        buckets[k].issued += amt;
        if (String(r.status).toLowerCase() === "paid") buckets[k].paid += amt;
      });

      ar.forEach((r) => {
        const k = keyOf(r.period_start);
        if (!k) return;
        ensure(k);
        buckets[k].due += Number(r.balance_amount || 0);
      });

      const labels = order;
      setTrendBuckets({
        labels,
        issued: labels.map((k) => Number((buckets[k].issued || 0).toFixed(2))),
        paid: labels.map((k) => Number((buckets[k].paid || 0).toFixed(2))),
        due: labels.map((k) => Number((buckets[k].due || 0).toFixed(2))),
        bucketMode,
      });
    } catch (e) {
      setToast(e?.message || "Couldn’t load overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // ---- Gauge (Collections) ----
  const gaugeOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          radius: "95%",
          pointer: { show: false },
          progress: { show: true, roundCap: true, width: 14 },
          axisLine: {
            lineStyle: { width: 14, color: [[1, "rgba(255,255,255,.08)"]] },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            formatter: (v) => `${Number(v).toFixed(1)}%`,
            color: "rgba(255,255,255,.92)",
            fontSize: 22,
            fontWeight: 900,
            offsetCenter: [0, "12%"],
          },
          title: { show: false },
          data: [{ value: collectionPct }],
        },
      ],
    };
  }, [collectionPct]);

  // ---- Trend (Bar) ----
  const trendOption = useMemo(() => {
  const labels = trendBuckets.labels || [];
  const seriesMap = {
    issued: trendBuckets.issued || [],
    paid: trendBuckets.paid || [],
    due: trendBuckets.due || [],
  };

  const niceName =
    trendMetric === "issued" ? "Issued" :
    trendMetric === "paid" ? "Paid" :
    "Outstanding";

  const compactR = (v) => {
    const n = Number(v || 0);
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}m`;
    if (abs >= 1_000) return `R ${(n / 1_000).toFixed(1)}k`;
    return `R ${n.toFixed(0)}`;
  };

  return {
    backgroundColor: "transparent",
    animationDuration: 450,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(10,12,20,.92)",
      borderColor: "rgba(255,255,255,.14)",
      borderWidth: 1,
      textStyle: { color: "rgba(255,255,255,.92)" },
      formatter: (items) => {
        const it = items?.[0];
        const val = it?.value ?? 0;
        return `
          <div style="font-weight:900;margin-bottom:6px">${niceName}</div>
          <div style="opacity:.8;margin-bottom:6px">${it?.axisValue ?? ""}</div>
          <div style="font-weight:900">${money(val)}</div>
        `;
      },
    },
    grid: { left: 10, right: 10, top: 18, bottom: 10, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "rgba(255,255,255,.10)" } },
      axisLabel: {
        color: "rgba(255,255,255,.75)",
        fontSize: 11,
        interval: 0,
        rotate: labels.length > 8 ? 25 : 0,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "rgba(255,255,255,.65)",
        fontSize: 11,
        formatter: (v) => compactR(v),
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,.08)" } },
    },
    series: [
      {
        name: niceName,
        type: "bar",
        data: seriesMap[trendMetric],
        barMaxWidth: 28,
        barCategoryGap: "40%",
        itemStyle: {
          borderRadius: [10, 10, 6, 6],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(47,107,255,.95)" },
              { offset: 1, color: "rgba(58,162,255,.20)" },
            ],
          },
        },
        emphasis: { focus: "series" },
      },
    ],
  };
}, [trendBuckets, trendMetric]);
  // chart click drilldown
  const trendEvents = useMemo(() => {
    return {
      click: (params) => {
        const key = trendBuckets.labels?.[params?.dataIndex];
        if (!key) return;
        if (setContext) {
          setContext({
            billing_focus: trendMetric,
            billing_bucket: trendBuckets.bucketMode,
            billing_bucket_key: key,
            range_from: from,
            range_to: to,
          });
        }
        if (setView) setView("billing");
      },
    };
  }, [trendBuckets, trendMetric, from, to, setContext, setView]);

  // ---- Quick drilldowns from KPI cards ----
  function go(viewName, extraContext) {
    if (setContext && extraContext) setContext(extraContext);
    if (setView) setView(viewName);
  }

  // ✅ UPDATED HEADER: removed week/month/range UI completely
  const headerRight = (
    <>
      <div style={{ minWidth: 160 }}>
        <div className="kpiLabel">From</div>
        <input
          className="input"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div style={{ minWidth: 160 }}>
        <div className="kpiLabel">To</div>
        <input
          className="input"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <button className="btn btnPrimary" type="button" onClick={load} disabled={loading}>
        Check updates
      </button>
    </>
  );

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Overview</div>
          <div className="pageSub">
            {from} → {to}
          </div>
        </div>
        <div className="pageActions">{headerRight}</div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      {/* KPI Strip (clickable drilldowns) */}
      <div className="grid grid4">
        <button className="card cardGlow" style={{ textAlign: "left" }} type="button" onClick={() => go("customers")}>
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Customers</div>
              <div className="kpiValue">{kpis.customers}</div>
            </div>
            <div className="kpiIcon">
              <Icon kind="users" />
            </div>
          </div>
        </button>

        <button className="card cardGlow" style={{ textAlign: "left" }} type="button" onClick={() => go("routes")}>
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Routes</div>
              <div className="kpiValue">{kpis.routes}</div>
            </div>
            <div className="kpiIcon">
              <Icon kind="route" />
            </div>
          </div>
        </button>

        <button className="card cardGlow" style={{ textAlign: "left" }} type="button" onClick={() => go("subscriptions")}>
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Active Subscriptions</div>
              <div className="kpiValue">{kpis.activeSubs}</div>
            </div>
            <div className="kpiIcon">
              <Icon kind="subs" />
            </div>
          </div>
        </button>

        <button
          className="card cardGlow"
          style={{ textAlign: "left" }}
          type="button"
          onClick={() => go("subscriptions", { range_from: from, range_to: to })}
        >
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Expected</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {money(kpis.expected)}
              </div>
            </div>
            <div className="kpiIcon">
              <Icon kind="target" />
            </div>
          </div>
        </button>

        <button
          className="card"
          style={{ textAlign: "left" }}
          type="button"
          onClick={() => go("billing", { billing_focus: "issued", range_from: from, range_to: to })}
        >
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
        </button>

        <button
          className="card"
          style={{ textAlign: "left" }}
          type="button"
          onClick={() => go("billing", { billing_focus: "paid", range_from: from, range_to: to })}
        >
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
        </button>

        <button
          className="card"
          style={{ textAlign: "left" }}
          type="button"
          onClick={() => go("billing", { billing_focus: "due", range_from: from, range_to: to })}
        >
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
        </button>

        <button
          className="card"
          style={{ textAlign: "left" }}
          type="button"
          onClick={() => go("customers", { focus: "credit" })}
        >
          <div className="kpiRow">
            <div>
              <div className="kpiLabel">Credit</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {money(kpis.credit)}
              </div>
            </div>
            <div className="kpiIcon">
              <Icon kind="credit" />
            </div>
          </div>
        </button>
      </div>

      <div style={{ height: 14 }} />

      {/* Visuals */}
      <div className="grid grid2">
        <Card
          title="Collections"
          action={<span className="chip">{collectionPct.toFixed(1)}% collected</span>}
        >
          <div className="grid grid2">
            <div style={{ height: 220 }}>
              <ReactECharts option={gaugeOption} style={{ height: "100%", width: "100%" }} />
            </div>

            <div>
              <div className="kpiLabel">Pending sends</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {pendingSend.count}
              </div>
              <div className="divider" />
              <div className="kpiLabel">Pending value</div>
              <div className="kpiValue" style={{ fontSize: 22 }}>
                {money(pendingSend.total)}
              </div>

              <div style={{ height: 10 }} />
              <button className="btn btnGhost" type="button" onClick={() => go("billing")}>
                Open billing
              </button>
            </div>
          </div>
        </Card>

        <Card
          title="Trend"
          action={
            <div className="seg">
              <button
                className={`segBtn ${trendMetric === "issued" ? "on" : ""}`}
                type="button"
                onClick={() => setTrendMetric("issued")}
              >
                Issued
              </button>
              <button
                className={`segBtn ${trendMetric === "paid" ? "on" : ""}`}
                type="button"
                onClick={() => setTrendMetric("paid")}
              >
                Paid
              </button>
              <button
                className={`segBtn ${trendMetric === "due" ? "on" : ""}`}
                type="button"
                onClick={() => setTrendMetric("due")}
              >
                Due
              </button>
            </div>
          }
        >
          <div style={{ height: 240 }}>
            <ReactECharts
              option={trendOption}
              style={{ height: "100%", width: "100%" }}
              onEvents={trendEvents}
            />
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      {/* Action tables */}
      <div className="grid grid2">
        <Card
          title="Outstanding invoices"
          action={
            <button
              className="btn btnGhost"
              type="button"
              onClick={() =>
                go("billing", { billing_focus: "due", range_from: from, range_to: to })
              }
            >
              View all
            </button>
          }
        >
          <Table
            columns={[
              { key: "invoice_number", label: "Invoice" },
              { key: "customer_name", label: "Customer" },
              { key: "period", label: "Period" },
              { key: "balance", label: "Outstanding" },
            ]}
            rows={dueRows}
            onRowClick={(row) => {
              if (setContext) setContext({ invoice_id: row.invoice_id });
              if (setView) setView("invoice");
            }}
          />
        </Card>

        <Card
          title="Credit available"
          action={
            <button className="btn btnGhost" type="button" onClick={() => go("customers")}>
              Open customers
            </button>
          }
        >
          <Table
            columns={[
              { key: "display_name", label: "Customer" },
              { key: "email", label: "Email" },
              { key: "credit", label: "Credit" },
            ]}
            rows={creditRows}
            onRowClick={(row) => {
              if (setContext) setContext({ customer_id: row.customer_id });
              if (setView) setView("customerDetail");
            }}
          />
        </Card>
      </div>
    </div>
  );
}