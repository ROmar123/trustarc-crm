import DataPage from "../DataPage.jsx";
import { Pill, fmtDate, today, opts } from "../ui.jsx";

const name = (list, id, k = "name") => list.find((x) => x.id === id)?.[k] || "—";

const config = {
  kind: "trips",
  noun: "trip",
  blank: { date: today(), routeId: "", driverId: "", vehicleId: "", passengers: 0, status: "scheduled", notes: "" },
  match: (t, q, s) => [name(s.routes, t.routeId), name(s.drivers, t.driverId), name(s.vehicles, t.vehicleId, "reg")].some((x) => x.toLowerCase().includes(q)),
  prepare: (v) => ({ ...v, passengers: Number(v.passengers) || 0 }),
  columns: [
    { h: "Date", r: (t) => fmtDate(t.date) },
    { h: "Route", r: (t, s) => <strong>{name(s.routes, t.routeId)}</strong> },
    { h: "Driver", r: (t, s) => name(s.drivers, t.driverId) },
    { h: "Vehicle", r: (t, s) => name(s.vehicles, t.vehicleId, "reg") },
    { h: "Passengers", num: true, r: (t, s) => { const cap = s.vehicles.find((v) => v.id === t.vehicleId)?.seats; return <span className={cap && t.passengers > cap ? "late" : ""}>{t.passengers}{cap ? ` / ${cap}` : ""}</span>; } },
    { h: "Status", r: (t) => <Pill v={t.status} /> },
  ],
  fields: (s) => [
    { key: "date", label: "Date", type: "date", required: true },
    { key: "routeId", label: "Route", required: true, options: opts(s.routes, (r) => r.name) },
    { key: "driverId", label: "Driver", options: opts(s.drivers.filter((d) => d.status === "active"), (d) => d.name) },
    { key: "vehicleId", label: "Vehicle", options: opts(s.vehicles.filter((v) => v.status === "active"), (v) => `${v.reg} (${v.seats} seats)`) },
    { key: "passengers", label: "Passengers", type: "number" },
    { key: "status", label: "Status", noBlank: true, options: ["scheduled", "completed", "cancelled"].map((v) => ({ value: v, label: v })) },
    { key: "notes", label: "Notes", full: true },
  ],
};

export default function Trips({ search }) {
  return <DataPage config={config} search={search} />;
}
