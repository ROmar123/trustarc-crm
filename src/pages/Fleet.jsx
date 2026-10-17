import { useState } from "react";
import DataPage from "../DataPage.jsx";
import { Pill, fmtDate, today, opts } from "../ui.jsx";
import { addDays } from "../store.jsx";

const has = (...xs) => (q) => xs.some((x) => (x || "").toLowerCase().includes(q));
const ownerName = (s, id) => s.owners.find((o) => o.id === id)?.name || "—";
const statusOpts = ["active", "inactive"].map((v) => ({ value: v, label: v }));

const CONFIGS = {
  owners: {
    kind: "owners", noun: "fleet owner",
    blank: { name: "", contact: "", phone: "", email: "" },
    match: (o, q) => has(o.name, o.contact, o.phone, o.email)(q),
    columns: [
      { h: "Owner", r: (o) => <strong>{o.name}</strong> }, { h: "Contact", r: (o) => o.contact },
      { h: "Phone", r: (o) => o.phone }, { h: "Email", r: (o) => o.email },
      { h: "Vehicles", num: true, r: (o, s) => s.vehicles.filter((v) => v.ownerId === o.id).length },
    ],
    fields: () => [
      { key: "name", label: "Company / owner", required: true, full: true }, { key: "contact", label: "Contact person" },
      { key: "phone", label: "Phone" }, { key: "email", label: "Email", type: "email", full: true },
    ],
  },
  vehicles: {
    kind: "vehicles", noun: "vehicle",
    blank: { reg: "", make: "", model: "", seats: 14, ownerId: "", status: "active" },
    match: (v, q, s) => has(v.reg, v.make, v.model, ownerName(s, v.ownerId))(q),
    prepare: (v) => ({ ...v, seats: Number(v.seats) || 0 }),
    columns: [
      { h: "Registration", r: (v) => <strong>{v.reg}</strong> }, { h: "Vehicle", r: (v) => `${v.make} ${v.model}` },
      { h: "Seats", num: true, r: (v) => v.seats }, { h: "Owner", r: (v, s) => ownerName(s, v.ownerId) },
      { h: "Status", r: (v) => <Pill v={v.status} /> },
    ],
    fields: (s) => [
      { key: "reg", label: "Registration", required: true }, { key: "seats", label: "Seats", type: "number", required: true },
      { key: "make", label: "Make" }, { key: "model", label: "Model" },
      { key: "ownerId", label: "Owner", options: opts(s.owners, (o) => o.name) },
      { key: "status", label: "Status", noBlank: true, options: statusOpts },
    ],
  },
  drivers: {
    kind: "drivers", noun: "driver",
    blank: { name: "", phone: "", licenceExpiry: "", ownerId: "", status: "active" },
    match: (d, q, s) => has(d.name, d.phone, ownerName(s, d.ownerId))(q),
    columns: [
      { h: "Driver", r: (d) => <strong>{d.name}</strong> }, { h: "Phone", r: (d) => d.phone },
      { h: "Employer", r: (d, s) => ownerName(s, d.ownerId) },
      { h: "Licence expires", r: (d) => { const soon = d.licenceExpiry && d.licenceExpiry <= addDays(today(), 30); return <span className={soon ? "late" : ""}>{fmtDate(d.licenceExpiry)}{soon ? " ⚠" : ""}</span>; } },
      { h: "Status", r: (d) => <Pill v={d.status} /> },
    ],
    fields: (s) => [
      { key: "name", label: "Name", required: true, full: true }, { key: "phone", label: "Phone" },
      { key: "licenceExpiry", label: "Licence expiry", type: "date" },
      { key: "ownerId", label: "Employer (fleet owner)", options: opts(s.owners, (o) => o.name) },
      { key: "status", label: "Status", noBlank: true, options: statusOpts },
    ],
  },
};

export default function Fleet({ search }) {
  const [tab, setTab] = useState("vehicles");
  const cfg = { ...CONFIGS[tab], filters: (
    <>{Object.keys(CONFIGS).map((t) => <button key={t} className={"chip" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>)}</>
  ) };
  return <DataPage key={tab} config={cfg} search={search} />;
}
