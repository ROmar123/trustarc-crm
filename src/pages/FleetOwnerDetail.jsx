import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function SB({ s }) {
  const st = { approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30", rejected: "bg-red-500/15 text-red-400 border border-red-500/30", suspended: "bg-rose-500/15 text-rose-400 border border-rose-500/30" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${st[s] || st.pending}`}>{s}</span>;
}

export default function FleetOwnerDetail({ setView, setContext, context }) {
  const id = context?.fleetOwnerId;
  const [fo, setFo] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) load(); }, [id]);
  async function load() { setLoading(true); const [{ data: f }, { data: v }, { data: d }] = await Promise.all([supabase.from("fleet_owners").select("*").eq("id", id).single(), supabase.from("vehicles").select("*").eq("fleet_owner_id", id), supabase.from("drivers").select("*").eq("fleet_owner_id", id)]); setFo(f); setVehicles(v || []); setDrivers(d || []); setLoading(false); }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
  if (!fo) return <div className="text-center py-12 text-slate-400">Not found</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView("fleet-owners")} className="p-2 hover:bg-slate-700/50 rounded-lg transition text-slate-400">&larr;</button>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">{fo.company_name}</h1></div>
        <SB s={fo.status} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Details</h3><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Reg</span><span className="text-white">{fo.registration_number || "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="text-white">{fo.phone || "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-white">{fo.email || "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">City</span><span className="text-white">{fo.city || "—"}</span></div></div></div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Vehicles ({vehicles.length})</h3>{vehicles.length === 0 ? <p className="text-sm text-slate-500">None</p> : <div className="space-y-2">{vehicles.map(v => (<div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition" onClick={() => { setContext({ vehicleId: v.id }); setView("vehicle_detail"); }}><span className="text-sm text-white">{v.registration_number}</span><SB s={v.status} /></div>))}</div>}</div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Drivers ({drivers.length})</h3>{drivers.length === 0 ? <p className="text-sm text-slate-500">None</p> : <div className="space-y-2">{drivers.map(d => (<div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition" onClick={() => { setContext({ driverId: d.id }); setView("driver_detail"); }}><span className="text-sm text-white">{d.full_name}</span><SB s={d.status} /></div>))}</div>}</div>
      </div>
    </div>
  );
}
