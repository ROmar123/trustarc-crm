import { createContext, useContext, useEffect, useReducer } from "react";

const KEY = "pipeline-crm-v1";
export const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
export const uid = () => Math.random().toString(36).slice(2, 10);
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

function seed() {
  const companies = [
    { id: "co1", name: "Acme Corp", industry: "Manufacturing", website: "acme.example" },
    { id: "co2", name: "Globex", industry: "Software", website: "globex.example" },
    { id: "co3", name: "Initech", industry: "Finance", website: "initech.example" },
  ];
  const contacts = [
    { id: "c1", name: "Dana Whitfield", email: "dana@acme.example", phone: "555-0101", title: "COO", companyId: "co1", status: "Customer" },
    { id: "c2", name: "Ravi Patel", email: "ravi@globex.example", phone: "555-0102", title: "CTO", companyId: "co2", status: "Lead" },
    { id: "c3", name: "Mia Chen", email: "mia@initech.example", phone: "555-0103", title: "Head of Ops", companyId: "co3", status: "Lead" },
  ];
  const deals = [
    { id: "d1", title: "Annual platform licence", value: 48000, stage: "Negotiation", contactId: "c1", companyId: "co1", closeDate: day(14) },
    { id: "d2", title: "Pilot project", value: 12000, stage: "Qualified", contactId: "c2", companyId: "co2", closeDate: day(30) },
    { id: "d3", title: "Support retainer", value: 9000, stage: "Lead", contactId: "c3", companyId: "co3", closeDate: day(45) },
    { id: "d4", title: "Onboarding package", value: 6500, stage: "Won", contactId: "c1", companyId: "co1", closeDate: day(-5) },
  ];
  const tasks = [
    { id: "t1", title: "Send revised proposal", due: day(1), done: false, contactId: "c1", dealId: "d1" },
    { id: "t2", title: "Book discovery call", due: day(-1), done: false, contactId: "c2", dealId: "d2" },
    { id: "t3", title: "Intro email", due: day(3), done: true, contactId: "c3", dealId: "d3" },
  ];
  const activities = [
    { id: "a1", type: "call", text: "Discussed pricing, wants a 10% multi-year discount.", contactId: "c1", dealId: "d1", at: new Date(Date.now() - 864e5).toISOString() },
    { id: "a2", type: "email", text: "Sent case studies.", contactId: "c2", dealId: "d2", at: new Date(Date.now() - 2 * 864e5).toISOString() },
  ];
  return { companies, contacts, deals, tasks, activities };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to seed data */ }
  return seed();
}

const CASCADE = {
  contacts: (s, id) => ({
    ...s,
    deals: s.deals.map((d) => (d.contactId === id ? { ...d, contactId: "" } : d)),
    tasks: s.tasks.filter((t) => t.contactId !== id),
    activities: s.activities.filter((a) => a.contactId !== id),
  }),
  companies: (s, id) => ({
    ...s,
    contacts: s.contacts.map((c) => (c.companyId === id ? { ...c, companyId: "" } : c)),
    deals: s.deals.map((d) => (d.companyId === id ? { ...d, companyId: "" } : d)),
  }),
  deals: (s, id) => ({
    ...s,
    tasks: s.tasks.map((t) => (t.dealId === id ? { ...t, dealId: "" } : t)),
    activities: s.activities.filter((a) => a.dealId !== id),
  }),
};

function reducer(state, a) {
  switch (a.type) {
    case "save": {
      const list = state[a.kind];
      const exists = list.some((x) => x.id === a.item.id);
      return { ...state, [a.kind]: exists ? list.map((x) => (x.id === a.item.id ? a.item : x)) : [a.item, ...list] };
    }
    case "remove": {
      const next = { ...state, [a.kind]: state[a.kind].filter((x) => x.id !== a.id) };
      return CASCADE[a.kind] ? CASCADE[a.kind](next, a.id) : next;
    }
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
    save: (kind, item) => dispatch({ type: "save", kind, item: { ...item, id: item.id || uid() } }),
    remove: (kind, id) => dispatch({ type: "remove", kind, id }),
    replace: (s) => dispatch({ type: "replace", state: s }),
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

export const money = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n) || 0);
