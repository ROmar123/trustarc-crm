import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Users, Building2, Handshake, CheckSquare, Search, Download, Upload } from "lucide-react";
import { useStore } from "./store.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Contacts from "./views/Contacts.jsx";
import Companies from "./views/Companies.jsx";
import Deals from "./views/Deals.jsx";
import Tasks from "./views/Tasks.jsx";

const NAV = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["deals", "Deals", Handshake],
  ["contacts", "Contacts", Users],
  ["companies", "Companies", Building2],
  ["tasks", "Tasks", CheckSquare],
];

const initialView = () => {
  const h = window.location.hash.slice(1);
  return NAV.some((n) => n[0] === h) ? h : "dashboard";
};

export default function App() {
  const { state, replace } = useStore();
  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState("");
  const file = useRef(null);

  const go = (v) => { setSearch(""); window.location.assign("#" + v); };
  useEffect(() => {
    const h = () => { setView(initialView()); setSearch(""); };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `crm-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const keys = ["companies", "contacts", "deals", "tasks", "activities"];
      if (!keys.every((k) => Array.isArray(data[k]))) throw new Error("bad shape");
      if (confirm("Replace all current data with this file?")) replace(Object.fromEntries(keys.map((k) => [k, data[k]])));
    } catch {
      alert("That file isn't a valid CRM export.");
    }
  }

  const View = { dashboard: Dashboard, deals: Deals, contacts: Contacts, companies: Companies, tasks: Tasks }[view];

  return (
    <div className="app">
      <aside>
        <div className="brand">Pipeline<span>CRM</span></div>
        <nav>
          {NAV.map(([id, label, Icon]) => (
            <button key={id} className={view === id ? "on" : ""} onClick={() => go(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="foot">
          <button onClick={exportData}><Download size={16} /> Export</button>
          <button onClick={() => file.current.click()}><Upload size={16} /> Import</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={importData} />
        </div>
      </aside>
      <main>
        <div className="top">
          <h1>{NAV.find((n) => n[0] === view)[1]}</h1>
          {view !== "dashboard" && (
            <label className="search">
              <Search size={16} />
              <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
          )}
        </div>
        <View search={search} go={go} />
      </main>
    </div>
  );
}
