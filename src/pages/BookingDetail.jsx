import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function SB({ s }) {
  const st = { draft: "bg-slate-500/15 text-slate-400 border border-slate-500/30", hold: "bg-amber-500/15 text-amber-400 border border-amber-500/30", confirmed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", checked_in: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30", completed: "bg-blue-500/15 text-blue-400 border border-blue-500/30", cancelled: "bg-red-500/15 text-red-400 border border-red-500/30" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${st[s] || st.draft}`}>{s?.replace("_", " ")}</span>;
}

export default function BookingDetail({ setView, context }) {
  const id = context?.bookingId;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) load(); }, [id]);
  async function load() {
    const { data } = await supabase.from("bookings").select("*, customers(display_name, email, phone), trips(trip_date, departure_time, routes(route_name))").eq("id", id).single();
    setBooking(data);
    setLoading(false);
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
  if (!booking) return <div className="text-center py-12 text-slate-400">Not found</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView("bookings")} className="p-2 hover:bg-slate-700/50 rounded-lg transition text-slate-400">&larr;</button>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">{booking.booking_number}</h1></div>
        <SB s={booking.status} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="text-white">{booking.customers?.display_name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="text-white capitalize">{booking.booking_type}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Route</span><span className="text-white">{booking.trips?.routes?.route_name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="text-white">{booking.trips?.trip_date ? new Date(booking.trips.trip_date).toLocaleDateString() : "—"}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Seats</span><span className="text-white">{booking.seats_booked}</span></div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Payment</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="text-white">R{booking.total_amount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-white">R{booking.discount_amount || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Final</span><span className="text-white font-semibold">R{booking.final_amount}</span></div>
            {booking.special_requests && <div className="pt-2 border-t border-slate-700/50"><span className="text-slate-500">Requests: </span><span className="text-white">{booking.special_requests}</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
