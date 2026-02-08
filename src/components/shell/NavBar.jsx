export default function NavBar({ view, setView }) {
  const tabs = [
    { key: "overview", label: "Overview", icon: IconGrid },
    { key: "customers", label: "Customers", icon: IconUsers },
    { key: "routes", label: "Routes", icon: IconRoute },
    { key: "subscriptions", label: "Subscriptions", icon: IconLayers },
    { key: "billing", label: "Billing", icon: IconInvoice },
  ];

  return (
    <div className="navWrap">
      <div className="brand">
        <div className="brandMark" aria-hidden="true">
          <IconMark />
        </div>
        <div className="brandName">TrustArc</div>
      </div>

      <div className="navTabs" role="navigation" aria-label="Primary">
        {tabs.map((t) => {
          const active = view === t.key;
          const Ico = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              className={`navBtn ${active ? "active" : ""}`}
              onClick={() => setView(t.key)}
            >
              <Ico />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* keep empty for now — later: period filter / search / user menu */}
      <div className="navRight" />
    </div>
  );
}

/* ---------- Brand mark ---------- */
function IconMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <path
        d="M4 13c0-5 4-9 9.5-9H20l-4 4h-2.8a4 4 0 0 0 0 8H20l-4 4h-2.5C8 20 4 17 4 13Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Icons ---------- */
function IconGrid() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconRoute() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M6 6h3a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function IconLayers() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 3.5 8 12 13l8.5-5L12 3Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M3.5 12 12 17l8.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3.5 16 12 21l8.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconInvoice() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 8h6M9 12h6M9 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}