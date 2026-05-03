import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function SB({ s }) { const st = { approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30", rejected: "bg-red-500/15 text-red-400 border border-red-500/30", on_leave: "bg-purple-500/15 text-purple-400 border border-purple-500/30" }; return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${st[s] || st.pending}`}>{s?.replace("_", " ")}</span>; }

export default function DriverDetail({ setView, setContext, context }) {
  const id = context?.driverId;
  const [driver, setDriver] = useState(null);
  const [fleetOwner, setFleetOwner] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) load(); }, [id]);
  async function load() { setLoading(true); const { data: d } = await supabase.from("drivers").select("*").eq("id", id).single(); setDriver(d); if (d?.fleet_owner_id) { const { data: fo } = await supabase.from("fleet_owners").select("company_name").eq("id", d.fleet_owner_id).single(); setFleetOwner(fo); } const { data: docs } = await supabase.from("documents").select("*").eq("owner_type", "driver").eq("owner_id", id).order("created_at", { ascending: false }); setDocs(docs || []); setLoading(false); }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
  if (!driver) return <div className="text-center py-12 text-slate-400">Not found</div>;
  const now = new Date();
  const licenseDays = driver.license_expiry ? Math.ceil((new Date(driver.license_expiry) - now) / 86400000) : null;
  const medicalDays = driver.medical_expiry ? Math.ceil((new Date(driver.medical_expiry) - now) / 86400000) : null;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6"><button onClick={() => setView("drivers")} className="p-2 hover:bg-slate-700/50 rounded-lg transition text-slate-400">&larr;</button><div className="flex-1"><h1 className="text-2xl font-bold text-white">{driver.full_name}</h1><p className="text-sm text-slate-400">{driver.email}</p></div><SB s={driver.status} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Details</h3><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">License</span><span className="text-white">{driver.license_number || "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">License Expiry</span><span className={licenseDays < 60 ? "text-red-400" : "text-white"}>{driver.license_expiry ? `${new Date(driver.license_expiry).toLocaleDateString()} (${licenseDays}d)` : "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Medical Expiry</span><span className={medicalDays < 60 ? "text-red-400" : "text-white"}>{driver.medical_expiry ? `${new Date(driver.medical_expiry).toLocaleDateString()} (${medicalDays}d)` : "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-white">{driver.phone || "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Fleet</span><span className="text-cyan-400 cursor-pointer hover:underline" onClick={() => { setContext({ fleetOwnerId: driver.fleet_owner_id }); setView("fleet_owner_detail"); }}>{fleetOwner?.company_name || "—"}</span></div></div></div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 lg:col-span-2"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Documents ({docs.length})</h3>{docs.length === 0 ? <p className="text-sm text-slate-500">None</p> : <div className="space-y-2">{docs.map(doc => (<div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-400">D</div><div><p className="text-sm text-white font-medium">{doc.document_name}</p><p className="text-xs text-slate-500">{doc.document_type} {doc.expiry_date ? `· Expires ${new Date(doc.expiry_date).toLocaleDateString()}` : ""}</p></div></div><SB s={doc.status} /></div>))}</div>}</div>
      </div>
    </div>
  );
}
