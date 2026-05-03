const tabs = [
  { id: "overview", label: "Overview" },
  { id: "customers", label: "Customers" },
  { id: "routes", label: "Routes" },
  { id: "subscriptions", label: "Subs" },
  { id: "billing", label: "Billing" },
];

export default function MobileNav({ view, setView }) {
  return (
    <div className="mobileNav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={view === t.id ? "mobileBtn active" : "mobileBtn"}
          onClick={() => setView(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}