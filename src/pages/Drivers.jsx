import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function SB({ s }) {
  const st = { approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30", rejected: "bg-red-500/15 text-red-400 border border-red-500/30", suspended: "bg-rose-500/15 text-rose-400 border border-rose-500/30", on_leave: "bg-purple-500/15 text-purple-400 border border-purple-500/30" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${st[s] || st.pending}`}>{s?.replace("_", " ")}</span>;
}

function CD({ d }) { if (!d) return <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />; const days = Math.ceil((new Date(d) - new Date()) / 86400000); const c = days < 30 ? "bg-red-500" : days < 90 ? "bg-amber-500" : "bg-emerald-500"; return <span className={`w-2 h-2 rounded-full ${c} inline-block`} title={`${days} days`} />; }

export default function Drivers({ setView, setContext }) {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all");
  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const { data } = await supabase.from("drivers").select("*, fleet_owners(company_name)").order("created_at", { ascending: false }); setItems(data || []); setLoading(false); }
  async function updateStatus(id, status) { const up = { status }; if (status === "approved") up.approved_at = new Date().toISOString(); await supabase.from("drivers").update(up).eq("id", id); load(); }
  function goTo(id) { setContext({ driverId: id }); setView("driver_detail"); }
  const filtered = useMemo(() => items.filter(d => { if (filter !== "all" && d.status !== filter) return false; const q = search.toLowerCase(); return !q || (d.full_name || "").toLowerCase().includes(q) || (d.license_number || "").toLowerCase().includes(q); }), [items, search, filter]);
  const counts = useMemo(() => { const c = { all: items.length, approved: 0, active: 0, pending: 0, rejected: 0, on_leave: 0 }; items.forEach(d => { if (c[d.status] !== undefined) c[d.status]++; }); return c; }, [items]);

  return (
    <div className="max-w-6xl">
      <div className="mb-4"><h1 className="text-2xl font-bold text-white">Drivers</h1><p className="text-sm text-slate-400">Manage drivers and compliance</p></div>
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-1 mb-4"><div className="flex gap-1 flex-wrap">{["all","approved","active","pending","rejected","on_leave"].map(s => (<button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${filter === s ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`}>{s.replace("_", " ")} <span className="ml-1 text-slate-500">{counts[s] || 0}</span></button>))}</div></div>
      <input type="text" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-4" />
      {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> : filtered.length === 0 ? <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center"><p className="text-slate-400">No drivers</p></div> : (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-700/50"><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Driver</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">License</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Expiry</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Medical</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Fleet</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Status</th><th className="text-right text-xs font-semibold text-slate-400 uppercase px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-700/30">
          {filtered.map(d => (<tr key={d.id} className="hover:bg-slate-700/20 transition"><td className="px-4 py-3 cursor-pointer" onClick={() => goTo(d.id)}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs text-amber-400 font-bold">{d.full_name?.charAt(0)}</div><div><p className="text-sm font-medium text-white">{d.full_name}</p></div></div></td><td className="px-4 py-3 text-sm text-slate-300">{d.license_number || "—"}</td><td className="px-4 py-3 text-sm text-slate-300"><CD d={d.license_expiry} /> {d.license_expiry ? new Date(d.license_expiry).toLocaleDateString() : "—"}</td><td className="px-4 py-3 text-sm text-slate-300"><CD d={d.medical_expiry} /> {d.medical_expiry ? new Date(d.medical_expiry).toLocaleDateString() : "—"}</td><td className="px-4 py-3 text-sm text-slate-300">{d.fleet_owners?.company_name || "—"}</td><td className="px-4 py-3"><SB s={d.status} /></td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">{d.status === "pending" && (<><button onClick={() => updateStatus(d.id, "approved")} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Approve</button><button onClick={() => updateStatus(d.id, "rejected")} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Reject</button></>)}<button onClick={() => goTo(d.id)} className="text-slate-500 hover:text-white text-xs">View</button></div></td></tr>))}
        </tbody></table></div></div>
      )}
    </div>
  );
}
