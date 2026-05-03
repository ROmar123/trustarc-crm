import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function SB({ s }) { const st = { active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", maintenance: "bg-amber-500/15 text-amber-400 border border-amber-500/30", pending: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30", retired: "bg-slate-500/15 text-slate-400 border border-slate-500/30" }; return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${st[s] || st.pending}`}>{s}</span>; }

export default function VehicleDetail({ setView, setContext, context }) {
  const id = context?.vehicleId;
  const [vehicle, setVehicle] = useState(null);
  const [fleetOwner, setFleetOwner] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) load(); }, [id]);
  async function load() { setLoading(true); const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).single(); setVehicle(v); if (v?.fleet_owner_id) { const { data: fo } = await supabase.from("fleet_owners").select("company_name").eq("id", v.fleet_owner_id).single(); setFleetOwner(fo); } const { data: d } = await supabase.from("documents").select("*").eq("owner_type", "vehicle").eq("owner_id", id).order("created_at", { ascending: false }); setDocs(d || []); setLoading(false); }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
  if (!vehicle) return <div className="text-center py-12 text-slate-400">Not found</div>;
  const inspectionDays = vehicle.next_inspection_due ? Math.ceil((new Date(vehicle.next_inspection_due) - new Date()) / 86400000) : null;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6"><button onClick={() => setView("vehicles")} className="p-2 hover:bg-slate-700/50 rounded-lg transition text-slate-400">&larr;</button><div className="flex-1"><h1 className="text-2xl font-bold text-white">{vehicle.registration_number}</h1><p className="text-sm text-slate-400">{vehicle.make} {vehicle.model} {vehicle.year}</p></div><SB s={vehicle.status} /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Info</h3><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Class</span><span className="text-white capitalize">{vehicle.vehicle_class}</span></div><div className="flex justify-between"><span className="text-slate-500">Seats</span><span className="text-white">{vehicle.seat_capacity}</span></div><div className="flex justify-between"><span className="text-slate-500">Mileage</span><span className="text-white">{vehicle.mileage?.toLocaleString()} km</span></div><div className="flex justify-between"><span className="text-slate-500">Fleet</span><span className="text-cyan-400 cursor-pointer hover:underline" onClick={() => { setContext({ fleetOwnerId: vehicle.fleet_owner_id }); setView("fleet_owner_detail"); }}>{fleetOwner?.company_name || "—"}</span></div></div></div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Inspection</h3><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Last</span><span className="text-white">{vehicle.last_inspection_date ? new Date(vehicle.last_inspection_date).toLocaleDateString() : "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Next Due</span><span className={inspectionDays < 60 ? "text-red-400" : "text-white"}>{vehicle.next_inspection_due ? `${new Date(vehicle.next_inspection_due).toLocaleDateString()} (${inspectionDays}d)` : "—"}</span></div></div></div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5"><h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Documents ({docs.length})</h3>{docs.length === 0 ? <p className="text-sm text-slate-500">None</p> : <div className="space-y-2">{docs.map(doc => (<div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30"><span className="text-sm text-white">{doc.document_name}</span><SB s={doc.status} /></div>))}</div>}</div>
      </div>
    </div>
  );
}
