import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";
import Stat from "../components/ui/Stat.jsx";
import Card from "../components/ui/Card.jsx";
import Table from "../components/ui/Table.jsx";

function startOfWeek(d) {
  // Monday start
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
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
function toISODate(d) {
  // yyyy-mm-dd
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function money(n) {
  const v = Number(n || 0);
  return `R ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Overview() {
  const [period, setPeriod] = useState("week"); // week | month
  const [anchor, setAnchor] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const range = useMemo(() => {
    const s = period === "week" ? startOfWeek(anchor) : startOfMonth(anchor);
    const e = period === "week" ? endOfWeek(anchor) : endOfMonth(anchor);
    return { start: s, end: e, startISO: toISODate(s), endISO: toISODate(e) };
  }, [period, anchor]);

  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    totalRoutes: 0,
    activeSubs: 0,
    invoiced: 0,
    paid: 0,
    due: 0,
  });

  const [topDue, setTopDue] = useState([]);
  const [creditRows, setCreditRows] = useState([]);

  async function load() {
    setLoading(true);
    setToast("");

    try {
      // 1) Counts
      const [cust, routes, subs] = await Promise.all([
        supabase.from("customers").select("customer_id", { count: "exact", head: true }),
        supabase.from("routes").select("route_id", { count: "exact", head: true }),
        supabase
          .from("subscriptions")
          .select("subscription_id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      // 2) Period invoiced totals (from invoices)
      const invRes = await supabase
        .from("invoices")
        .select("total_amount, period_start, status")
        .neq("status", "void")
        .gte("period_start", range.startISO)
        .lte("period_start", range.endISO);

      // 3) Period “due” list (accounts_receivable view = only invoices with balance > 0)
      const arRes = await supabase
        .from("accounts_receivable")
        .select("invoice_number, customer_name, period_start, period_end, total_amount, paid_amount, balance_amount, created_at")
        .gte("period_start", range.startISO)
        .lte("period_start", range.endISO)
        .order("balance_amount", { ascending: false })
        .limit(8);

      // 4) Credit leaderboard (customer_credit view)
      const creditRes = await supabase
        .from("customer_credit")
        .select("display_name, email, credit_balance")
        .gt("credit_balance", 0)
        .order("credit_balance", { ascending: false })
        .limit(8);

      // 5) Paid in period (derived from allocations on invoices in period)
      // We take accounts_receivable + invoices in period to infer paid:
      // paid = sum(invoice_paid_amount) for invoices in range
      // easiest in client: fetch invoice ids + use invoices.total_amount minus balance when available
      // We'll compute:
      const arRows = arRes.data || [];
      const invRows = invRes.data || [];

      const invoicedTotal = invRows.reduce((a, r) => a + Number(r.total_amount || 0), 0);

      // paidTotal = (for AR rows we know paid_amount), but AR excludes fully paid invoices.
      // So we estimate paidTotal as:
      //   paidTotal = sum(paid_amount for AR rows) + sum(total_amount for paid invoices in range)
      const paidInvoicesTotal = invRows
        .filter((r) => r.status === "paid")
        .reduce((a, r) => a + Number(r.total_amount || 0), 0);

      const paidFromAR = arRows.reduce((a, r) => a + Number(r.paid_amount || 0), 0);
      const paidTotal = paidInvoicesTotal + paidFromAR;

      const dueTotal = arRows.reduce((a, r) => a + Number(r.balance_amount || 0), 0);

      setKpis({
        totalCustomers: cust.count || 0,
        totalRoutes: routes.count || 0,
        activeSubs: subs.count || 0,
        invoiced: invoicedTotal,
        paid: paidTotal,
        due: dueTotal,
      });

      setTopDue(
        arRows.map((r) => ({
          invoice_number: r.invoice_number,
          customer_name: r.customer_name,
          period: `${r.period_start} → ${r.period_end}`,
          balance: money(r.balance_amount),
        }))
      );

      setCreditRows(
        (creditRes.data || []).map((r) => ({
          display_name: r.display_name,
          email: r.email,
          credit_balance: money(r.credit_balance),
        }))
      );
    } catch (e) {
      setToast(e?.message || "Failed to load overview.");
    } finally {
      setLoading(false);
    }
  }

  async function generateInvoices() {
    setLoading(true);
    setToast("");
    try {
      const todayISO = toISODate(new Date());
      const { data, error } = await supabase.rpc("generate_due_invoices", {
        p_run_date: todayISO,
        p_mode: "manual",
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      const created = row?.created_count ?? 0;
      const skipped = row?.skipped_count ?? 0;

      setToast(`Generated invoices: ${created} • Skipped (already exists): ${skipped}`);
      await load();
    } catch (e) {
      setToast(e?.message || "Invoice generation failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, range.startISO, range.endISO]);

  const collectionPct = useMemo(() => {
    const denom = Number(kpis.invoiced || 0);
    if (denom <= 0) return 0;
    return Math.max(0, Math.min(100, (Number(kpis.paid || 0) / denom) * 100));
  }, [kpis]);

  return (
    <div>
      <div className="pageHead">
        <div>
          <div className="pageTitle">Overview</div>
          <div className="pageSub">
            {period === "week" ? "Week" : "Month"} • {range.startISO} to {range.endISO}
          </div>
        </div>

        <div className="pageActions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button className="btn btnGhost" type="button" onClick={load} disabled={loading}>
            Refresh
          </button>
          <button className="btn btnPrimary" type="button" onClick={generateInvoices} disabled={loading}>
            Generate Due Invoices
          </button>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}

      {/* KPI Row */}
      <div className="grid grid4">
        <Stat label="Total Customers" value={kpis.totalCustomers} />
        <Stat label="Total Routes" value={kpis.totalRoutes} />
        <Stat label="Active Subscriptions" value={kpis.activeSubs} />
        <Stat label="Invoiced This Period" value={money(kpis.invoiced)} />
      </div>

      <div style={{ height: 14 }} />

      {/* Collections + Signals */}
      <div className="grid grid2">
        <Card
          title="Collections Progress"
          action={<span className="muted">{money(kpis.paid)} paid • {money(kpis.due)} due</span>}
        >
          <div className="progressWrap">
            <div className="progressBar" style={{ width: `${collectionPct}%` }} />
          </div>
          <div className="progressMeta">
            <div className="muted">Collection Rate</div>
            <div className="kpiValue" style={{ fontSize: 22 }}>{collectionPct.toFixed(1)}%</div>
          </div>
        </Card>

        <Card
          title="Focus"
          action={<span className="muted">{period === "week" ? "Weekly window" : "Monthly window"}</span>}
        >
          <div className="focusList">
            <div className="focusItem">
              <div className="dotBlue" />
              <div>
                <div className="focusTitle">Invoice coverage</div>
                <div className="muted">
                  Use “Generate Due Invoices” inside your billing window rules (DB enforced).
                </div>
              </div>
            </div>

            <div className="focusItem">
              <div className="dotBlue" />
              <div>
                <div className="focusTitle">Collections</div>
                <div className="muted">
                  Top due invoices and credit balances are pulled directly from your DB views.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      {/* Tables */}
      <div className="grid grid2">
        <Card title="Top Due Invoices" action={<span className="muted">From accounts_receivable view</span>}>
          <Table
            columns={[
              { key: "invoice_number", label: "Invoice" },
              { key: "customer_name", label: "Customer" },
              { key: "period", label: "Period" },
              { key: "balance", label: "Balance" },
            ]}
            rows={topDue}
          />
        </Card>

        <Card title="Customer Credit" action={<span className="muted">From customer_credit view</span>}>
          <Table
            columns={[
              { key: "display_name", label: "Customer" },
              { key: "email", label: "Email" },
              { key: "credit_balance", label: "Credit" },
            ]}
            rows={creditRows}
          />
        </Card>
      </div>
    </div>
  );
}