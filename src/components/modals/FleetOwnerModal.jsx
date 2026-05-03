import { useState } from "react";
import { supabase } from "../../lib/supabase";

export function FleetOwnerModal({ fleetOwner, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: fleetOwner?.company_name || "",
    registration_number: fleetOwner?.registration_number || "",
    tax_id: fleetOwner?.tax_id || "",
    phone: fleetOwner?.phone || "",
    email: fleetOwner?.email || "",
    address: fleetOwner?.address || "",
    city: fleetOwner?.city || "",
    notes: fleetOwner?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    if (fleetOwner?.fleet_owner_id) {
      await supabase.from("fleet_owners").update(form).eq("fleet_owner_id", fleetOwner.fleet_owner_id);
    } else {
      await supabase.from("fleet_owners").insert({ ...form, status: "pending" });
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">{fleetOwner ? "Edit" : "Add"} Fleet Owner</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Company Name *</label><input type="text" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Registration #</label><input type="text" value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" /></div>
            <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Tax ID</label><input type="text" value={form.tax_id} onChange={e => setForm({...form, tax_id: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Phone</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" /></div>
            <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" /></div>
          </div>
          <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">City</label><input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" /></div>
          <div><label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700/50 text-slate-300 py-2.5 rounded-lg hover:bg-slate-700 transition text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-cyan-500 to-sky-500 text-white py-2.5 rounded-lg hover:from-cyan-400 hover:to-sky-400 transition text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : fleetOwner ? "Update" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
