export default function NavBar({ view, setView }) {
  const tabs = [
    { key: "overview", label: "Overview", icon: IconGrid },
    { key: "customers", label: "Customers", icon: IconUsers },
    { key: "fleet-owners", label: "Fleet", icon: IconTruck },
    { key: "drivers", label: "Drivers", icon: IconDriver },
    { key: "vehicles", label: "Vehicles", icon: IconCar },
    { key: "routes", label: "Routes", icon: IconRoute },
    { key: "trips", label: "Trips", icon: IconCalendar },
    { key: "bookings", label: "Bookings", icon: IconTicket },
    { key: "subscriptions", label: "Subscriptions", icon: IconLayers },
    { key: "billing", label: "Billing", icon: IconInvoice },
    { key: "documents", label: "Documents", icon: IconFileCheck },
    { key: "work-items", label: "Tasks", icon: IconClipboard },
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
function IconTruck() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="15" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 11h2a1 1 0 011 1v4a1 1 0 01-1 1h-2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="17.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function IconDriver() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}
function IconCar() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M5 10l2-5h10l2 5v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconTicket() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M3 10v4a1 1 0 001 1h1.5a2 2 0 010 4H4a1 1 0 01-1-1v-8" stroke="currentColor" strokeWidth="2"/>
      <path d="M21 10v8a1 1 0 01-1 1h-1.5a2 2 0 010-4H20a1 1 0 001-1v-4" stroke="currentColor" strokeWidth="2"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="10" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"/>
    </svg>
  );
}
function IconFileCheck() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 15l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none">
      <path d="M9 5h6M9 5a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2" stroke="currentColor" strokeWidth="2"/>
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
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