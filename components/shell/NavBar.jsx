const tabs = [
  { id: "overview", label: "Overview" },
  { id: "customers", label: "Customers" },
  { id: "routes", label: "Routes" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "billing", label: "Billing" },
];

export default function NavBar({ view, setView }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">TA</div>
        <div>
          <div className="brandTitle">TrustArc CRM</div>
          <div className="brandSub">Ops + Billing Console</div>
        </div>
      </div>

      <nav className="nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={view === t.id ? "navItem active" : "navItem"}
            onClick={() => setView(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="rightSlot">
        <span className="pill">Ready</span>
      </div>
    </header>
  );
}