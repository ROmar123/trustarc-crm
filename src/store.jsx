import { createContext, useContext, useEffect, useReducer } from "react";

const KEY = "trustarc-crm-v1";
export const COLLECTIONS = ["customers", "routes", "subscriptions", "invoices", "payments", "owners", "drivers", "vehicles", "trips"];
export const uid = () => Math.random().toString(36).slice(2, 10);

// Which collections reference an id, so deleting a used record can be refused.
const REFS = {
  customers: [["subscriptions", "customerId"], ["invoices", "customerId"], ["payments", "customerId"]],
  routes: [["subscriptions", "routeId"], ["trips", "routeId"]],
  subscriptions: [["invoices", "subscriptionId"]],
  invoices: [["payments", "invoiceId"]],
  owners: [["vehicles", "ownerId"], ["drivers", "ownerId"]],
  vehicles: [["trips", "vehicleId"]],
  drivers: [["trips", "driverId"]],
};

export function usage(state, kind, id) {
  for (const [other, key] of REFS[kind] || []) {
    const n = state[other].filter((x) => x[key] === id).length;
    if (n) return `${n} ${other} still refer to it`;
  }
  return "";
}

const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return iso(x); };
export const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

function seed() {
  const customers = [
    { id: "cu1", type: "individual", name: "Thandi Mokoena", email: "thandi@example.com", phone: "082 555 0101", status: "active", notes: "" },
    { id: "cu2", type: "company", name: "Bluegum Logistics", email: "accounts@bluegum.example", phone: "011 555 0102", status: "active", notes: "Staff shuttle, 6 seats" },
    { id: "cu3", type: "individual", name: "Pieter van Wyk", email: "pieter@example.com", phone: "083 555 0103", status: "active", notes: "" },
  ];
  const routes = [
    { id: "r1", name: "Sandton ⇄ Pretoria CBD", origin: "Sandton City", destination: "Church Square", weeklyPrice: 750, monthlyPrice: 2800, active: true },
    { id: "r2", name: "Soweto ⇄ Johannesburg CBD", origin: "Maponya Mall", destination: "Park Station", weeklyPrice: 480, monthlyPrice: 1800, active: true },
  ];
  const owners = [{ id: "o1", name: "Khumalo Fleet Services", contact: "S. Khumalo", phone: "082 555 0199", email: "fleet@khumalo.example" }];
  const vehicles = [
    { id: "v1", reg: "CA 123-456", make: "Toyota", model: "Quantum", seats: 14, ownerId: "o1", status: "active" },
    { id: "v2", reg: "GP 98 XY ZN", make: "Mercedes", model: "Sprinter", seats: 18, ownerId: "o1", status: "active" },
  ];
  const drivers = [
    { id: "dr1", name: "Sipho Dlamini", phone: "071 555 0111", licenceExpiry: d(200), ownerId: "o1", status: "active" },
    { id: "dr2", name: "Lerato Nkosi", phone: "072 555 0112", licenceExpiry: d(20), ownerId: "o1", status: "active" },
  ];
  const subscriptions = [
    { id: "s1", customerId: "cu1", routeId: "r1", seats: 1, period: "monthly", status: "active", startDate: d(-60), nextPeriodStart: d(-1), priceOverride: "", notes: "" },
    { id: "s2", customerId: "cu2", routeId: "r2", seats: 6, period: "weekly", status: "active", startDate: d(-30), nextPeriodStart: d(2), priceOverride: 2600, notes: "Negotiated rate" },
    { id: "s3", customerId: "cu3", routeId: "r1", seats: 2, period: "monthly", status: "paused", startDate: d(-90), nextPeriodStart: d(10), priceOverride: "", notes: "" },
  ];
  const invoices = [
    { id: "i1", number: "INV-0001", customerId: "cu1", subscriptionId: "s1", periodStart: d(-61), periodEnd: d(-2), issued: d(-61), due: d(-54), status: "issued", lines: [{ description: "Sandton ⇄ Pretoria CBD — monthly × 1 seat", qty: 1, unit: 2800 }] },
    { id: "i2", number: "INV-0002", customerId: "cu2", subscriptionId: "s2", periodStart: d(-5), periodEnd: d(1), issued: d(-5), due: d(2), status: "issued", lines: [{ description: "Soweto ⇄ Johannesburg CBD — weekly × 6 seats", qty: 1, unit: 2600 }] },
  ];
  const payments = [{ id: "p1", customerId: "cu1", invoiceId: "i1", amount: 2800, date: d(-58), method: "EFT", reference: "THANDI JUL" }];
  const trips = [
    { id: "t1", date: d(0), routeId: "r1", driverId: "dr1", vehicleId: "v1", passengers: 3, status: "scheduled", notes: "" },
    { id: "t2", date: d(-1), routeId: "r2", driverId: "dr2", vehicleId: "v2", passengers: 6, status: "completed", notes: "" },
  ];
  return { customers, routes, subscriptions, invoices, payments, owners, drivers, vehicles, trips };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && COLLECTIONS.every((k) => Array.isArray(raw[k]))) return raw;
  } catch { /* fall back to seed data */ }
  return seed();
}

function reducer(state, a) {
  switch (a.type) {
    case "save": {
      const list = state[a.kind];
      const has = list.some((x) => x.id === a.item.id);
      return { ...state, [a.kind]: has ? list.map((x) => (x.id === a.item.id ? a.item : x)) : [a.item, ...list] };
    }
    case "remove":
      return { ...state, [a.kind]: state[a.kind].filter((x) => x.id !== a.id) };
    case "replace":
      return a.state;
    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);
  const api = {
    state,
    save: (kind, item) => {
      const saved = { ...item, id: item.id || uid() };
      dispatch({ type: "save", kind, item: saved });
      return saved;
    },
    // Returns "" on success, or the reason the record can't be deleted.
    remove: (kind, id) => {
      const why = usage(state, kind, id);
      if (!why) dispatch({ type: "remove", kind, id });
      return why;
    },
    replace: (s) => dispatch({ type: "replace", state: s }),
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

// ---- derived helpers -------------------------------------------------------

export const money = (n) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(n) || 0);

export const invoiceTotal = (inv) => inv.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unit) || 0), 0);
export const invoicePaid = (state, inv) => state.payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
export const invoiceBalance = (state, inv) => (inv.status === "void" ? 0 : invoiceTotal(inv) - invoicePaid(state, inv));

export function invoiceState(state, inv, today = iso(new Date())) {
  if (inv.status === "void") return "void";
  const bal = invoiceBalance(state, inv);
  if (bal <= 0) return "paid";
  if (inv.due && inv.due < today) return "overdue";
  return invoicePaid(state, inv) > 0 ? "partial" : "unpaid";
}

export const customerBalance = (state, id) =>
  state.invoices.filter((i) => i.customerId === id).reduce((s, i) => s + invoiceBalance(state, i), 0);

// Payments not tied to an invoice are customer credit.
export const customerCredit = (state, id) =>
  state.payments.filter((p) => p.customerId === id && !p.invoiceId).reduce((s, p) => s + (Number(p.amount) || 0), 0);

export function subscriptionPrice(state, sub) {
  if (sub.priceOverride !== "" && sub.priceOverride != null) return Number(sub.priceOverride);
  const r = state.routes.find((x) => x.id === sub.routeId);
  if (!r) return 0;
  return (sub.period === "weekly" ? Number(r.weeklyPrice) : Number(r.monthlyPrice)) * (Number(sub.seats) || 1);
}

const parse = (s) => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd); };
export function addPeriod(dateStr, period) {
  const x = parse(dateStr);
  if (period === "weekly") x.setDate(x.getDate() + 7);
  else {
    const day = x.getDate();
    x.setDate(1);
    x.setMonth(x.getMonth() + 1);
    const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(day, last));
  }
  return iso(x);
}
export function addDays(dateStr, n) { const x = parse(dateStr); x.setDate(x.getDate() + n); return iso(x); }

export function nextInvoiceNumber(state) {
  const max = state.invoices.reduce((m, i) => Math.max(m, Number(String(i.number).replace(/\D/g, "")) || 0), 0);
  return "INV-" + String(max + 1).padStart(4, "0");
}
