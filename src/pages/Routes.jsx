import DataPage from "../DataPage.jsx";
import { Pill } from "../ui.jsx";
import { money } from "../store.jsx";

const config = {
  kind: "routes",
  noun: "route",
  blank: { name: "", origin: "", destination: "", weeklyPrice: "", monthlyPrice: "", active: true },
  match: (r, q) => [r.name, r.origin, r.destination].some((x) => (x || "").toLowerCase().includes(q)),
  prepare: (v) => ({ ...v, weeklyPrice: Number(v.weeklyPrice) || 0, monthlyPrice: Number(v.monthlyPrice) || 0 }),
  columns: [
    { h: "Route", r: (r) => <><strong>{r.name}</strong><small>{r.origin} → {r.destination}</small></> },
    { h: "Weekly / seat", num: true, r: (r) => money(r.weeklyPrice) },
    { h: "Monthly / seat", num: true, r: (r) => money(r.monthlyPrice) },
    { h: "Seats sold", num: true, r: (r, s) => s.subscriptions.filter((x) => x.routeId === r.id && x.status === "active").reduce((t, x) => t + (Number(x.seats) || 0), 0) },
    { h: "Status", r: (r) => <Pill v={r.active ? "active" : "inactive"} /> },
  ],
  fields: () => [
    { key: "name", label: "Route name", required: true, full: true },
    { key: "origin", label: "Origin" },
    { key: "destination", label: "Destination" },
    { key: "weeklyPrice", label: "Weekly price per seat (R)", type: "number" },
    { key: "monthlyPrice", label: "Monthly price per seat (R)", type: "number" },
    { key: "active", label: "Active", type: "checkbox" },
  ],
};

export default function Routes({ search }) {
  return <DataPage config={config} search={search} />;
}
