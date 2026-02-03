import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

// -------------------- Supabase client --------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Vite env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -------------------- Helpers --------------------
const money = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "ZAR" }).format(Number(n || 0));

const fmtDate = (d) => {
  if (!d) return "";
  // d might already be yyyy-mm-dd
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toISOString().slice(0, 10);
};

const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

// -------------------- App --------------------
export default function App() {
  const [view, setView] = useState("overview"); // overview | customers | customer | routes | route | billing
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // {type, msg}
  const toastTimer = useRef(null);

  // Global filters (simple MVP)
  const [period, setPeriod] = useState("month"); // month | week (week can come later)
  const [periodDate, setPeriodDate] = useState(fmtDate(new Date()));

  // Data
  const [customers, setCustomers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Detail selection
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Customer detail tabs
  const [custTab, setCustTab] = useState("subscriptions"); // subscriptions | invoices | credit
  const [customerSubscriptions, setCustomerSubscriptions] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerCredit, setCustomerCredit] = useState(null);

  // Route detail tabs
  const [routeTab, setRouteTab] = useState("pricing"); // pricing | subscribers | overview
  const [routePricing, setRoutePricing] = useState([]);
  const [routeSubscribers, setRouteSubscribers] = useState([]);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);

  // Overview KPIs (derived from fetched data)
  const overview = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.status === "active").length;
    const activeRoutes = routes.filter((r) => r.is_active === true).length;
    const activeSubscriptions = customerSubscriptions.length; // will be replaced with real total later (optional)
    const totalInvoices = invoices.length;

    // For MVP: totals from invoices list we have loaded for the selected period
    const totalIssued = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);

    // Paid amount / balance based on allocations is not in the invoice table directly.
    // We can approximate with:
    // - paid invoices: status === 'paid'
    // - due invoices: status in ('issued','partially_paid','overdue') AND total_amount > 0
    // True balance should come from your views later (accounts_receivable), but we keep schema unchanged.
    const paidAmount = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + Number(i.total_amount || 0), 0);

    const dueAmount = invoices
      .filter((i) => i.status !== "paid" && i.status !== "void")
      .reduce((s, i) => s + Number(i.total_amount || 0), 0);

    const acpu = activeCustomers > 0 ? totalIssued / activeCustomers : 0;

    return {
      activeCustomers,
      activeRoutes,
      activeSubscriptions,
      totalInvoices,
      totalIssued,
      paidAmount,
      dueAmount,
      acpu,
    };
  }, [customers, routes, invoices, customerSubscriptions.length]);

  // -------------------- Toast --------------------
  const notify = (type, msg) => {
    setToast({ type, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  // -------------------- Data loaders --------------------
  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setCustomers(data || []);
  };

  const loadRoutes = async () => {
    const { data, error } = await supabase.from("routes").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    setRoutes(data || []);
  };

  const loadInvoicesForPeriod = async () => {
    // Month filter: period_start between month start/end
    const d = new Date(periodDate);
    const start = fmtDate(startOfMonth(d));
    const end = fmtDate(endOfMonth(d));

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .gte("period_start", start)
      .lte("period_start", end)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setInvoices(data || []);
  };

  const bootstrap = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCustomers(), loadRoutes(), loadInvoicesForPeriod()]);
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // reload invoices when period changes
    (async () => {
      try {
        await loadInvoicesForPeriod();
      } catch (e) {
        console.error(e);
        notify("error", e?.message || "Failed to load invoices");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, periodDate]);

  // -------------------- Customer detail loaders --------------------
  const openCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setView("customer");
    setCustTab("subscriptions");
    setLoading(true);
    try {
      // subscriptions
      const { data: subs, error: subsErr } = await supabase
        .from("subscriptions")
        .select("*, routes(route_name)")
        .eq("customer_id", customer.customer_id)
        .order("created_at", { ascending: false });
      if (subsErr) throw subsErr;
      setCustomerSubscriptions(subs || []);

      // invoices
      const { data: invs, error: invErr } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customer.customer_id)
        .order("created_at", { ascending: false });
      if (invErr) throw invErr;
      setCustomerInvoices(invs || []);

      // credit view (optional, but you created it)
      const { data: credit, error: creditErr } = await supabase
        .from("customer_credit")
        .select("*")
        .eq("customer_id", customer.customer_id)
        .maybeSingle();
      if (creditErr) throw creditErr;
      setCustomerCredit(credit || null);
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Route detail loaders --------------------
  const openRoute = async (route) => {
    setSelectedRoute(route);
    setView("route");
    setRouteTab("pricing");
    setLoading(true);
    try {
      // pricing
      const { data: pricing, error: pErr } = await supabase
        .from("route_pricing")
        .select("*")
        .eq("route_id", route.route_id)
        .order("effective_from", { ascending: false });
      if (pErr) throw pErr;
      setRoutePricing(pricing || []);

      // subscribers
      const { data: subs, error: sErr } = await supabase
        .from("subscriptions")
        .select("*, customers(display_name,email)")
        .eq("route_id", route.route_id)
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;
      setRouteSubscribers(subs || []);
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to load route details");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- CRUD: Customers --------------------
  const saveCustomer = async (payload) => {
    setLoading(true);
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("customer_id", editingCustomer.customer_id);
        if (error) throw error;
        notify("success", "Customer updated");
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
        notify("success", "Customer added");
      }
      setShowCustomerModal(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  const deactivateCustomer = async (customer) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({ status: "inactive" })
        .eq("customer_id", customer.customer_id);
      if (error) throw error;
      notify("success", "Customer deactivated");
      await loadCustomers();
      if (selectedCustomer?.customer_id === customer.customer_id) {
        setSelectedCustomer(null);
        setView("customers");
      }
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to deactivate customer");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- CRUD: Routes --------------------
  const saveRoute = async (payload) => {
    setLoading(true);
    try {
      if (editingRoute) {
        const { error } = await supabase.from("routes").update(payload).eq("route_id", editingRoute.route_id);
        if (error) throw error;
        notify("success", "Route updated");
      } else {
        const { error } = await supabase.from("routes").insert(payload);
        if (error) throw error;
        notify("success", "Route added");
      }
      setShowRouteModal(false);
      setEditingRoute(null);
      await loadRoutes();
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to save route");
    } finally {
      setLoading(false);
    }
  };

  const toggleRouteActive = async (route) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("routes")
        .update({ is_active: !route.is_active })
        .eq("route_id", route.route_id);
      if (error) throw error;
      notify("success", route.is_active ? "Route deactivated" : "Route activated");
      await loadRoutes();
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to update route");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- CRUD: Pricing --------------------
  const savePricing = async (payload) => {
    if (!selectedRoute?.route_id) return;
    setLoading(true);
    try {
      const row = {
        route_id: selectedRoute.route_id,
        weekly_price: Number(payload.weekly_price || 0),
        monthly_price: Number(payload.monthly_price || 0),
        effective_from: payload.effective_from,
        effective_to: payload.effective_to || null,
      };

      if (editingPricing) {
        const { error } = await supabase
          .from("route_pricing")
          .update(row)
          .eq("pricing_id", editingPricing.pricing_id);
        if (error) throw error;
        notify("success", "Pricing updated");
      } else {
        const { error } = await supabase.from("route_pricing").insert(row);
        if (error) throw error;
        notify("success", "Pricing added");
      }

      setShowPricingModal(false);
      setEditingPricing(null);

      // refresh
      await openRoute(selectedRoute);
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to save pricing");
    } finally {
      setLoading(false);
    }
  };

  const deletePricing = async (pricing) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("route_pricing").delete().eq("pricing_id", pricing.pricing_id);
      if (error) throw error;
      notify("success", "Pricing removed");
      await openRoute(selectedRoute);
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to remove pricing");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Billing actions --------------------
  const generateDueInvoices = async () => {
    setLoading(true);
    try {
      // Your function signature: generate_due_invoices(p_run_date date default current_date, p_mode text default 'scheduled')
      const { data, error } = await supabase.rpc("generate_due_invoices", {
        p_run_date: fmtDate(new Date()),
        p_mode: "manual",
      });
      if (error) throw error;

      // reload invoices
      await loadInvoicesForPeriod();
      notify("success", `Invoice run complete`);
      console.log("generate_due_invoices result:", data);
    } catch (e) {
      console.error(e);
      notify("error", e?.message || "Failed to generate invoices");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- UI --------------------
  const Header = () => (
    <header className="ta-header">
      <div className="ta-brand" onClick={() => setView("overview")} role="button" tabIndex={0}>
        <div className="ta-logo">TA</div>
        <div>
          <div className="ta-title">TrustArc CRM</div>
          <div className="ta-subtitle">Ops + Billing Console</div>
        </div>
      </div>

      <nav className="ta-nav">
        <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>Overview</button>
        <button className={view === "customers" ? "active" : ""} onClick={() => setView("customers")}>Customers</button>
        <button className={view === "routes" ? "active" : ""} onClick={() => setView("routes")}>Routes</button>
        <button className={view === "billing" ? "active" : ""} onClick={() => setView("billing")}>Billing</button>
      </nav>

      <div className="ta-actions">
        <div className="ta-pill">
          <span className="muted">Period</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">Month</option>
            <option value="week" disabled>Week (next)</option>
          </select>
          <input
            type="date"
            value={periodDate}
            onChange={(e) => setPeriodDate(e.target.value)}
            aria-label="Period date"
          />
        </div>
        <div className={"ta-status " + (loading ? "loading" : "")}>{loading ? "Working…" : "Ready"}</div>
      </div>
    </header>
  );

  const MobileNav = () => (
    <nav className="ta-mobile-nav">
      <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}>Overview</button>
      <button className={view === "customers" || view === "customer" ? "active" : ""} onClick={() => setView("customers")}>Customers</button>
      <button className={view === "routes" || view === "route" ? "active" : ""} onClick={() => setView("routes")}>Routes</button>
      <button className={view === "billing" ? "active" : ""} onClick={() => setView("billing")}>Billing</button>
    </nav>
  );

  // -------------------- Screens --------------------
  const OverviewScreen = () => (
    <div className="ta-grid">
      <section className="ta-card">
        <div className="ta-card-title">Snapshot</div>
        <div className="ta-kpis">
          <Kpi label="Total Customers" value={overview.activeCustomers} />
          <Kpi label="Total Routes" value={overview.activeRoutes} />
          <Kpi label="Total Invoices (Period)" value={overview.totalInvoices} />
          <Kpi label="ACPU (Issued)" value={money(overview.acpu)} />
        </div>
      </section>

      <section className="ta-card">
        <div className="ta-card-title">Money (Period)</div>
        <div className="ta-kpis">
          <Kpi label="Invoiced" value={money(overview.totalIssued)} />
          <Kpi label="Paid (est.)" value={money(overview.paidAmount)} />
          <Kpi label="Due (est.)" value={money(overview.dueAmount)} />
          <Kpi label="Routes priced" value={"OK"} />
        </div>
      </section>

      <section className="ta-card">
        <div className="ta-card-title">Actions</div>
        <div className="ta-row">
          <button className="ta-btn primary" onClick={generateDueInvoices}>Generate Due Invoices</button>
          <button className="ta-btn" onClick={bootstrap}>Refresh Data</button>
        </div>
        <div className="muted" style={{ marginTop: 10 }}>
          Next: PDF generation + storage + “Send invoice” (email).
        </div>
      </section>
    </div>
  );

  const CustomersScreen = () => (
    <div className="ta-grid">
      <section className="ta-card">
        <div className="ta-card-head">
          <div>
            <div className="ta-card-title">Customers</div>
            <div className="muted">{customers.length} total</div>
          </div>
          <button
            className="ta-btn primary"
            onClick={() => {
              setEditingCustomer(null);
              setShowCustomerModal(true);
            }}
          >
            Add Customer
          </button>
        </div>

        <div className="ta-table">
          <div className="ta-table-row ta-table-header">
            <div>Name</div>
            <div>Email</div>
            <div>Status</div>
            <div className="right">Actions</div>
          </div>

          {customers.map((c) => (
            <div key={c.customer_id} className="ta-table-row">
              <div className="ta-link" onClick={() => openCustomer(c)} role="button" tabIndex={0}>
                {c.display_name}
              </div>
              <div className="muted">{c.email}</div>
              <div><StatusChip status={c.status} /></div>
              <div className="right ta-actions-inline">
                <button
                  className="ta-btn small"
                  onClick={() => {
                    setEditingCustomer(c);
                    setShowCustomerModal(true);
                  }}
                >
                  Edit
                </button>
                <button className="ta-btn small danger" onClick={() => deactivateCustomer(c)}>
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const CustomerDetailScreen = () => {
    if (!selectedCustomer) return null;

    const c = selectedCustomer;

    return (
      <div className="ta-grid">
        <section className="ta-card">
          <div className="ta-card-head">
            <div>
              <div className="ta-card-title">{c.display_name}</div>
              <div className="muted">{c.email} • {c.phone || "no phone"} • <StatusChip status={c.status} /></div>
            </div>
            <div className="ta-row">
              <button className="ta-btn" onClick={() => setView("customers")}>Back</button>
              <button
                className="ta-btn primary"
                onClick={() => {
                  setEditingCustomer(c);
                  setShowCustomerModal(true);
                }}
              >
                Edit
              </button>
            </div>
          </div>

          <div className="ta-kpis" style={{ marginTop: 12 }}>
            <Kpi label="Credit Balance" value={money(customerCredit?.credit_balance || 0)} />
            <Kpi label="Subscriptions" value={customerSubscriptions.length} />
            <Kpi label="Invoices" value={customerInvoices.length} />
            <Kpi label="Created" value={fmtDate(c.created_at)} />
          </div>

          <div className="ta-tabs">
            <button className={custTab === "subscriptions" ? "active" : ""} onClick={() => setCustTab("subscriptions")}>Subscriptions</button>
            <button className={custTab === "invoices" ? "active" : ""} onClick={() => setCustTab("invoices")}>Invoices</button>
            <button className={custTab === "credit" ? "active" : ""} onClick={() => setCustTab("credit")}>Payments & Credit</button>
          </div>

          {custTab === "subscriptions" && (
            <div className="ta-table">
              <div className="ta-table-row ta-table-header">
                <div>Route</div>
                <div>Billing</div>
                <div className="right">Seats</div>
                <div>Start</div>
                <div>Next Period</div>
                <div>Status</div>
              </div>
              {customerSubscriptions.map((s) => (
                <div key={s.subscription_id} className="ta-table-row">
                  <div className="muted">{s.routes?.route_name || s.route_id}</div>
                  <div>{s.billing_period}</div>
                  <div className="right">{s.seats}</div>
                  <div>{fmtDate(s.start_date)}</div>
                  <div>{fmtDate(s.next_period_start)}</div>
                  <div><StatusChip status={s.status} /></div>
                </div>
              ))}
            </div>
          )}

          {custTab === "invoices" && (
            <div className="ta-table">
              <div className="ta-table-row ta-table-header">
                <div>Invoice</div>
                <div>Period</div>
                <div className="right">Total</div>
                <div>Status</div>
                <div>Email</div>
              </div>
              {customerInvoices.map((i) => (
                <div key={i.invoice_id} className="ta-table-row">
                  <div className="muted">{i.invoice_number}</div>
                  <div>{fmtDate(i.period_start)} → {fmtDate(i.period_end)}</div>
                  <div className="right">{money(i.total_amount)}</div>
                  <div><StatusChip status={i.status} /></div>
                  <div><StatusChip status={i.email_status} /></div>
                </div>
              ))}
            </div>
          )}

          {custTab === "credit" && (
            <div className="ta-grid">
              <div className="ta-card soft">
                <div className="ta-card-title">Credit Balance</div>
                <div className="ta-big">{money(customerCredit?.credit_balance || 0)}</div>
                <div className="muted">This uses your existing `customer_credit` view.</div>
              </div>
              <div className="ta-card soft">
                <div className="ta-card-title">Next</div>
                <div className="muted">
                  Payments list + “Record payment” can be added here next, using your existing `payments` table.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  };

  const RoutesScreen = () => (
    <div className="ta-grid">
      <section className="ta-card">
        <div className="ta-card-head">
          <div>
            <div className="ta-card-title">Routes</div>
            <div className="muted">{routes.length} total</div>
          </div>
          <button
            className="ta-btn primary"
            onClick={() => {
              setEditingRoute(null);
              setShowRouteModal(true);
            }}
          >
            Add Route
          </button>
        </div>

        <div className="ta-table">
          <div className="ta-table-row ta-table-header">
            <div>Route</div>
            <div>Origin</div>
            <div>Destination</div>
            <div>Status</div>
            <div className="right">Actions</div>
          </div>

          {routes.map((r) => (
            <div key={r.route_id} className="ta-table-row">
              <div className="ta-link" onClick={() => openRoute(r)} role="button" tabIndex={0}>
                {r.route_name}
              </div>
              <div className="muted">{r.origin_label || "-"}</div>
              <div className="muted">{r.destination_label || "-"}</div>
              <div><StatusChip status={r.is_active ? "active" : "inactive"} /></div>
              <div className="right ta-actions-inline">
                <button className="ta-btn small" onClick={() => { setEditingRoute(r); setShowRouteModal(true); }}>Edit</button>
                <button className="ta-btn small" onClick={() => toggleRouteActive(r)}>{r.is_active ? "Deactivate" : "Activate"}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const RouteDetailScreen = () => {
    if (!selectedRoute) return null;
    const r = selectedRoute;

    return (
      <div className="ta-grid">
        <section className="ta-card">
          <div className="ta-card-head">
            <div>
              <div className="ta-card-title">{r.route_name}</div>
              <div className="muted">{r.origin_label || "-"} → {r.destination_label || "-"} • <StatusChip status={r.is_active ? "active" : "inactive"} /></div>
            </div>
            <div className="ta-row">
              <button className="ta-btn" onClick={() => setView("routes")}>Back</button>
              <button className="ta-btn primary" onClick={() => { setEditingRoute(r); setShowRouteModal(true); }}>Edit</button>
            </div>
          </div>

          <div className="ta-tabs">
            <button className={routeTab === "pricing" ? "active" : ""} onClick={() => setRouteTab("pricing")}>Pricing</button>
            <button className={routeTab === "subscribers" ? "active" : ""} onClick={() => setRouteTab("subscribers")}>Subscribers</button>
            <button className={routeTab === "overview" ? "active" : ""} onClick={() => setRouteTab("overview")}>Overview</button>
          </div>

          {routeTab === "pricing" && (
            <>
              <div className="ta-row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                <div className="muted">Pricing is versioned (effective dates) exactly as in your DB.</div>
                <button className="ta-btn primary" onClick={() => { setEditingPricing(null); setShowPricingModal(true); }}>
                  Add Pricing
                </button>
              </div>

              <div className="ta-table">
                <div className="ta-table-row ta-table-header">
                  <div>Effective From</div>
                  <div>Effective To</div>
                  <div className="right">Weekly</div>
                  <div className="right">Monthly</div>
                  <div className="right">Actions</div>
                </div>

                {routePricing.map((p) => (
                  <div key={p.pricing_id} className="ta-table-row">
                    <div>{fmtDate(p.effective_from)}</div>
                    <div>{p.effective_to ? fmtDate(p.effective_to) : <span className="muted">open</span>}</div>
                    <div className="right">{money(p.weekly_price)}</div>
                    <div className="right">{money(p.monthly_price)}</div>
                    <div className="right ta-actions-inline">
                      <button className="ta-btn small" onClick={() => { setEditingPricing(p); setShowPricingModal(true); }}>Edit</button>
                      <button className="ta-btn small danger" onClick={() => deletePricing(p)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {routeTab === "subscribers" && (
            <div className="ta-table">
              <div className="ta-table-row ta-table-header">
                <div>Customer</div>
                <div>Email</div>
                <div>Billing</div>
                <div className="right">Seats</div>
                <div>Next Period</div>
                <div>Status</div>
              </div>
              {routeSubscribers.map((s) => (
                <div key={s.subscription_id} className="ta-table-row">
                  <div className="muted">{s.customers?.display_name || s.customer_id}</div>
                  <div className="muted">{s.customers?.email || "-"}</div>
                  <div>{s.billing_period}</div>
                  <div className="right">{s.seats}</div>
                  <div>{fmtDate(s.next_period_start)}</div>
                  <div><StatusChip status={s.status} /></div>
                </div>
              ))}
            </div>
          )}

          {routeTab === "overview" && (
            <div className="ta-grid">
              <div className="ta-card soft">
                <div className="ta-card-title">Active subscribers</div>
                <div className="ta-big">{routeSubscribers.filter((s) => s.status === "active").length}</div>
              </div>
              <div className="ta-card soft">
                <div className="ta-card-title">Pricing rows</div>
                <div className="ta-big">{routePricing.length}</div>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  };

  const BillingScreen = () => (
    <div className="ta-grid">
      <section className="ta-card">
        <div className="ta-card-head">
          <div>
            <div className="ta-card-title">Billing</div>
            <div className="muted">Invoices for selected month</div>
          </div>
          <div className="ta-row">
            <button className="ta-btn primary" onClick={generateDueInvoices}>Generate Due Invoices</button>
            <button className="ta-btn" onClick={loadInvoicesForPeriod}>Refresh</button>
          </div>
        </div>

        <div className="ta-kpis" style={{ marginTop: 10 }}>
          <Kpi label="Invoices" value={invoices.length} />
          <Kpi label="Issued" value={money(overview.totalIssued)} />
          <Kpi label="Paid (est.)" value={money(overview.paidAmount)} />
          <Kpi label="Due (est.)" value={money(overview.dueAmount)} />
        </div>

        <div className="ta-table" style={{ marginTop: 10 }}>
          <div className="ta-table-row ta-table-header">
            <div>Invoice</div>
            <div>Customer</div>
            <div>Period</div>
            <div className="right">Total</div>
            <div>Status</div>
            <div>Email</div>
          </div>

          {invoices.map((i) => (
            <div key={i.invoice_id} className="ta-table-row">
              <div className="muted">{i.invoice_number}</div>
              <div className="muted">{i.customer_id}</div>
              <div>{fmtDate(i.period_start)} → {fmtDate(i.period_end)}</div>
              <div className="right">{money(i.total_amount)}</div>
              <div><StatusChip status={i.status} /></div>
              <div><StatusChip status={i.email_status} /></div>
            </div>
          ))}
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          Next: “View invoice” (loads invoice_lines) + “Generate PDF / Download PDF”.
        </div>
      </section>
    </div>
  );

  // -------------------- Components --------------------
  function Kpi({ label, value }) {
    return (
      <div className="ta-kpi">
        <div className="ta-kpi-label">{label}</div>
        <div className="ta-kpi-value">{value}</div>
      </div>
    );
  }

  function StatusChip({ status }) {
    const s = String(status || "").toLowerCase();
    let cls = "chip";
    if (["paid", "sent", "active", "succeeded", "approved"].includes(s)) cls += " ok";
    else if (["pending", "issued", "partially_paid"].includes(s)) cls += " warn";
    else if (["failed", "overdue", "inactive", "void", "cancelled", "rejected"].includes(s)) cls += " bad";
    else cls += " neutral";
    return <span className={cls}>{status ?? "-"}</span>;
  }

  // -------------------- Modals --------------------
  const CustomerModal = () => {
    const isEdit = !!editingCustomer;
    const [form, setForm] = useState(() => ({
      customer_type: editingCustomer?.customer_type || "individual",
      display_name: editingCustomer?.display_name || "",
      email: editingCustomer?.email || "",
      phone: editingCustomer?.phone || "",
      status: editingCustomer?.status || "active",
      notes: editingCustomer?.notes || "",
    }));

    return (
      <div className="ta-modal-backdrop" onMouseDown={() => setShowCustomerModal(false)}>
        <div className="ta-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="ta-modal-head">
            <div className="ta-card-title">{isEdit ? "Edit customer" : "Add customer"}</div>
            <button className="ta-btn small" onClick={() => setShowCustomerModal(false)}>Close</button>
          </div>

          <div className="ta-form">
            <label>
              Type
              <select value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
                <option value="individual">individual</option>
                <option value="business">business</option>
              </select>
            </label>

            <label>
              Display name
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </label>

            <label>
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>

            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>

            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>

            <label className="full">
              Notes
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </label>
          </div>

          <div className="ta-row" style={{ justifyContent: "flex-end" }}>
            <button className="ta-btn" onClick={() => setShowCustomerModal(false)}>Cancel</button>
            <button
              className="ta-btn primary"
              onClick={() => saveCustomer(form)}
              disabled={!form.display_name || !form.email}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RouteModal = () => {
    const isEdit = !!editingRoute;
    const [form, setForm] = useState(() => ({
      route_name: editingRoute?.route_name || "",
      origin_label: editingRoute?.origin_label || "",
      destination_label: editingRoute?.destination_label || "",
      is_active: editingRoute?.is_active ?? true,
    }));

    return (
      <div className="ta-modal-backdrop" onMouseDown={() => setShowRouteModal(false)}>
        <div className="ta-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="ta-modal-head">
            <div className="ta-card-title">{isEdit ? "Edit route" : "Add route"}</div>
            <button className="ta-btn small" onClick={() => setShowRouteModal(false)}>Close</button>
          </div>

          <div className="ta-form">
            <label className="full">
              Route name
              <input value={form.route_name} onChange={(e) => setForm({ ...form, route_name: e.target.value })} />
            </label>
            <label>
              Origin label
              <input value={form.origin_label} onChange={(e) => setForm({ ...form, origin_label: e.target.value })} />
            </label>
            <label>
              Destination label
              <input value={form.destination_label} onChange={(e) => setForm({ ...form, destination_label: e.target.value })} />
            </label>
            <label>
              Active
              <select value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
          </div>

          <div className="ta-row" style={{ justifyContent: "flex-end" }}>
            <button className="ta-btn" onClick={() => setShowRouteModal(false)}>Cancel</button>
            <button className="ta-btn primary" onClick={() => saveRoute(form)} disabled={!form.route_name}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PricingModal = () => {
    const isEdit = !!editingPricing;
    const [form, setForm] = useState(() => ({
      effective_from: editingPricing?.effective_from || fmtDate(new Date()),
      effective_to: editingPricing?.effective_to || "",
      weekly_price: editingPricing?.weekly_price ?? 0,
      monthly_price: editingPricing?.monthly_price ?? 0,
    }));

    return (
      <div className="ta-modal-backdrop" onMouseDown={() => setShowPricingModal(false)}>
        <div className="ta-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div className="ta-modal-head">
            <div className="ta-card-title">{isEdit ? "Edit pricing" : "Add pricing"}</div>
            <button className="ta-btn small" onClick={() => setShowPricingModal(false)}>Close</button>
          </div>

          <div className="ta-form">
            <label>
              Effective from
              <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
            </label>
            <label>
              Effective to (optional)
              <input type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} />
            </label>
            <label>
              Weekly price
              <input type="number" value={form.weekly_price} onChange={(e) => setForm({ ...form, weekly_price: e.target.value })} />
            </label>
            <label>
              Monthly price
              <input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} />
            </label>
          </div>

          <div className="ta-row" style={{ justifyContent: "flex-end" }}>
            <button className="ta-btn" onClick={() => setShowPricingModal(false)}>Cancel</button>
            <button className="ta-btn primary" onClick={() => savePricing(form)} disabled={!form.effective_from}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------- Render --------------------
  return (
    <div className="ta-app">
      <Header />

      <main className="ta-main">
        {view === "overview" && <OverviewScreen />}
        {view === "customers" && <CustomersScreen />}
        {view === "customer" && <CustomerDetailScreen />}
        {view === "routes" && <RoutesScreen />}
        {view === "route" && <RouteDetailScreen />}
        {view === "billing" && <BillingScreen />}
      </main>

      <MobileNav />

      {toast && (
        <div className={"ta-toast " + toast.type}>
          {toast.msg}
        </div>
      )}

      {showCustomerModal && <CustomerModal />}
      {showRouteModal && <RouteModal />}
      {showPricingModal && <PricingModal />}
    </div>
  );
}