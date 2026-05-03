import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

function SB({ s }) {
  const st = { scheduled: "bg-blue-500/15 text-blue-400 border border-blue-500/30", boarding: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30", in_progress: "bg-amber-500/15 text-amber-400 border border-amber-500/30", completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", cancelled: "bg-red-500/15 text-red-400 border border-red-500/30", delayed: "bg-orange-500/15 text-orange-400 border border-orange-500/30" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${st[s] || st.scheduled}`}>{s?.replace("_", " ")}</span>;
}

export default function Trips() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const [filter, setFilter] = useState("all");
  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const { data } = await supabase.from("trips").select("*, routes(route_name), vehicles(registration_number), drivers(full_name)").order("trip_date", { ascending: true }); setItems(data || []); setLoading(false); }
  async function updateStatus(id, status) { const up = { status }; if (status === "in_progress") up.actual_departure = new Date().toISOString(); if (status === "completed") up.actual_arrival = new Date().toISOString(); await supabase.from("trips").update(up).eq("id", id); load(); }
  const filtered = useMemo(() => items.filter(t => { if (filter !== "all" && t.status !== filter) return false; const q = search.toLowerCase(); return !q || (t.routes?.route_name || "").toLowerCase().includes(q) || (t.vehicles?.registration_number || "").toLowerCase().includes(q); }), [items, search, filter]);
  const counts = useMemo(() => { const c = { all: items.length, scheduled: 0, boarding: 0, in_progress: 0, completed: 0, cancelled: 0, delayed: 0 }; items.forEach(t => { if (c[t.status] !== undefined) c[t.status]++; }); return c; }, [items]);
  const occ = (o, a) => a > 0 ? Math.round((o / a) * 100) : 0;

  return (
    <div className="max-w-6xl">
      <div className="mb-4"><h1 className="text-2xl font-bold text-white">Trips</h1><p className="text-sm text-slate-400">Manage trip schedules and manifests</p></div>
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-1 mb-4"><div className="flex gap-1 flex-wrap">{["all","scheduled","boarding","in_progress","completed","cancelled","delayed"].map(s => (<button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${filter === s ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`}>{s.replace("_", " ")} <span className="ml-1 text-slate-500">{counts[s] || 0}</span></button>))}</div></div>
      <input type="text" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-4" />
      {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> : filtered.length === 0 ? <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center"><p className="text-slate-400">No trips</p></div> : (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-700/50"><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Route</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Date</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Occupancy</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Vehicle</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Driver</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Status</th><th className="text-right text-xs font-semibold text-slate-400 uppercase px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-700/30">
          {filtered.map(t => (<tr key={t.id} className="hover:bg-slate-700/20 transition"><td className="px-4 py-3"><p className="text-sm text-white font-medium">{t.routes?.route_name || "—"}</p></td><td className="px-4 py-3 text-sm text-slate-300">{new Date(t.trip_date).toLocaleDateString()}</td><td className="px-4 py-3 text-sm text-slate-300"><div className="flex items-center gap-2"><span>{t.seats_occupied}/{t.seats_available}</span><div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{width: `${occ(t.seats_occupied, t.seats_available)}%`}} /></div></div></td><td className="px-4 py-3 text-sm text-slate-300">{t.vehicles?.registration_number || "—"}</td><td className="px-4 py-3 text-sm text-slate-300">{t.drivers?.full_name || "—"}</td><td className="px-4 py-3"><SB s={t.status} /></td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">{t.status === "scheduled" && <button onClick={() => updateStatus(t.id, "boarding")} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">Board</button>}{t.status === "boarding" && <button onClick={() => updateStatus(t.id, "in_progress")} className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">Depart</button>}{t.status === "in_progress" && <button onClick={() => updateStatus(t.id, "completed")} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Arrive</button>}</div></td></tr>))}
        </tbody></table></div></div>
      )}
    </div>
  );
}
