import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { FleetOwnerModal } from "../components/modals/FleetOwnerModal";

function StatusBadge({ status }) {
  const s = { approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30", rejected: "bg-red-500/15 text-red-400 border border-red-500/30", suspended: "bg-rose-500/15 text-rose-400 border border-rose-500/30" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${s[status] || s.pending}`}>{status}</span>;
}

export default function FleetOwners({ setView, setContext }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const { data } = await supabase.from("fleet_owners").select("*").order("created_at", { ascending: false }); setItems(data || []); setLoading(false); }
  async function updateStatus(id, status) { const up = { status }; if (status === "approved") up.approved_at = new Date().toISOString(); await supabase.from("fleet_owners").update(up).eq("id", id); load(); }
  function goTo(id) { setContext({ fleetOwnerId: id }); setView("fleet_owner_detail"); }

  const filtered = useMemo(() => items.filter(f => { if (statusFilter !== "all" && f.status !== statusFilter) return false; const q = search.toLowerCase(); return !q || (f.company_name || "").toLowerCase().includes(q) || (f.registration_number || "").toLowerCase().includes(q); }), [items, search, statusFilter]);
  const counts = useMemo(() => { const c = { all: items.length, approved: 0, active: 0, pending: 0, rejected: 0, suspended: 0 }; items.forEach(f => { if (c[f.status] !== undefined) c[f.status]++; }); return c; }, [items]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-4"><div><h1 className="text-2xl font-bold text-white">Fleet Owners</h1><p className="text-sm text-slate-400">Manage fleet operators and approvals</p></div><button onClick={() => setModalOpen(true)} className="bg-gradient-to-r from-cyan-500 to-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Fleet Owner</button></div>
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-1 mb-4"><div className="flex gap-1 flex-wrap">{["all","approved","active","pending","rejected","suspended"].map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${statusFilter === s ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`}>{s.replace("_", " ")} <span className="ml-1 text-slate-500">{counts[s] || 0}</span></button>))}</div></div>
      <input type="text" placeholder="Search by company, registration..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-4" />
      {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> : filtered.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center"><p className="text-slate-400">No fleet owners found</p></div>
      ) : (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-700/50"><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Company</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Registration</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Contact</th><th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Status</th><th className="text-right text-xs font-semibold text-slate-400 uppercase px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-700/30">
          {filtered.map(f => (<tr key={f.id} className="hover:bg-slate-700/20 transition"><td className="px-4 py-3 cursor-pointer" onClick={() => goTo(f.id)}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-sm text-cyan-400 font-bold">{f.company_name?.charAt(0)}</div><div><p className="text-sm font-medium text-white">{f.company_name}</p></div></div></td><td className="px-4 py-3 text-sm text-slate-300">{f.registration_number || "—"}</td><td className="px-4 py-3 text-sm text-slate-300">{f.phone || "—"}</td><td className="px-4 py-3"><StatusBadge status={f.status} /></td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2">{f.status === "pending" && (<><button onClick={() => updateStatus(f.id, "approved")} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Approve</button><button onClick={() => updateStatus(f.id, "rejected")} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Reject</button></>)}<button onClick={() => goTo(f.id)} className="text-slate-500 hover:text-white transition text-xs">View</button></div></td></tr>))}
        </tbody></table></div></div>
      )}
      {modalOpen && <FleetOwnerModal onClose={() => setModalOpen(false)} onSaved={load} />}
    </div>
  );
}
