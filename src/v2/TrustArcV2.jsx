import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, Bell, BusFront, CalendarDays, Check, ChevronDown,
  CircleAlert, Clock3, CreditCard, Database, FileCheck2, LayoutDashboard,
  MapPin, Menu, Navigation, Plus, RadioTower, Route, Search, Settings2, ShieldCheck,
  Sparkles, Ticket, Users, Wallet, X
} from "lucide-react";
import TrustArcLogo from "./TrustArcLogo.jsx";
import { TRACKING_PROVIDERS } from "./tracking.js";
import "./TrustArcV2.css";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "WORKSPACE" },
  { id: "marketplace", label: "Marketplace", icon: Sparkles, group: "WORKSPACE" },
  { id: "routes", label: "Routes & Trips", icon: Route, group: "OPERATIONS" },
  { id: "fleet", label: "Fleet Registry", icon: BusFront, group: "OPERATIONS" },
  { id: "tracking", label: "Live Tracking", icon: RadioTower, group: "OPERATIONS" },
  { id: "people", label: "People & Access", icon: Users, group: "MANAGEMENT" },
  { id: "finance", label: "Finance & Wallets", icon: Wallet, group: "MANAGEMENT" },
  { id: "security", label: "Security & Privacy", icon: ShieldCheck, group: "MANAGEMENT" },
];
const DEMO_ROUTES = [
  { id: "R-01", name: "Southern Suburbs → Cape Town CBD", type: "Recurring commute", days: "Weekdays", status: "Example listing" },
  { id: "R-02", name: "Southern Suburbs → Stellenbosch", type: "Recurring commute", days: "Weekdays", status: "Example listing" },
  { id: "R-03", name: "Airport → Cape Town", type: "Once-off / transfer", days: "On demand", status: "Example listing" },
];
const INITIAL_VEHICLES = [
  { id: "EX-001", name: "Example commuter shuttle", seats: 14, provider: "cartrack", status: "Unconnected" },
  { id: "EX-002", name: "Example partner vehicle", seats: 8, provider: "netstar", status: "Unconnected" },
];
const ROLES = [
  { value: "operations", label: "Operations" },
  { value: "customer", label: "Customer" },
  { value: "driver", label: "Driver" },
  { value: "fleetowner", label: "Fleet owner" },
];
function Badge({ children, tone = "neutral" }) { return <span className={"v2-badge v2-badge-"+tone}>{children}</span>; }
function Action({ children, onClick, secondary = false, disabled = false, submit = false }) {
  return <button type={submit ? "submit" : "button"} disabled={disabled} onClick={onClick} className={"v2-button "+(secondary?"v2-button-secondary":"")}>{children}</button>;
}
function SectionTitle({ eyebrow, title, subtitle, children }) {
  return <div className="v2-section-heading"><div><p className="v2-eyebrow">{eyebrow}</p><h2>{title}</h2><p className="v2-subtitle">{subtitle}</p></div>{children}</div>;
}
function Panel({ children, className = "" }) { return <section className={"v2-panel "+className}>{children}</section>; }
function EmptyMetric({ label, note, icon: Icon }) {
  return <Panel className="v2-metric"><span className="v2-metric-icon"><Icon size={18}/></span><span className="v2-small">{label}</span><strong>—</strong><span className="v2-hint">{note}</span></Panel>;
}
function Overview({ setView }) {
  return <>
    <div className="v2-hero">
      <div className="v2-hero-copy"><Badge tone="light">TRUSTARC 2.0 / BUILD 0</Badge>
        <h2>One business.<br/><span>One intelligent system.</span></h2>
        <p>A unified foundation for marketplace, transport operations, finance and fleet oversight. We build the controls first, then safely connect real data.</p>
        <div className="v2-hero-actions"><Action onClick={()=>setView("fleet")}>Open fleet workspace <ArrowRight size={16}/></Action><Action secondary onClick={()=>setView("tracking")}>Tracking readiness <RadioTower size={16}/></Action></div>
      </div>
      <div className="v2-hero-graphic"><div className="v2-orbit orbit-1"/><div className="v2-orbit orbit-2"/><div className="v2-center-mark"><TrustArcLogo className="v2-hero-logo"/></div><span className="v2-orbit-label l1">Fleet</span><span className="v2-orbit-label l2">Routes</span><span className="v2-orbit-label l3">Customers</span></div>
    </div>
    <SectionTitle eyebrow="OPERATIONAL PULSE" title="Your command centre" subtitle="Live metrics stay blank until authenticated backend access and data contracts are verified."/>
    <div className="v2-stats">
      <EmptyMetric icon={BusFront} label="Active vehicles" note="Fleet registry connection pending"/>
      <EmptyMetric icon={Route} label="Running trips" note="Trip assignments pending"/>
      <EmptyMetric icon={Users} label="Confirmed passengers" note="Booking engine pending"/>
      <EmptyMetric icon={Activity} label="Tracking coverage" note="Provider feeds not connected"/>
    </div>
    <div className="v2-tiles">
      <Panel><div className="v2-panel-top"><span className="v2-iconbox"><Database size={20}/></span><Badge>BUILD 0</Badge></div><h3>Shared infrastructure</h3><p>Use one vehicle identity, one route definition, and one operational event model across all TrustArc experiences.</p><Action secondary onClick={()=>setView("security")}>Privacy controls <ArrowRight size={15}/></Action></Panel>
      <Panel><div className="v2-panel-top"><span className="v2-iconbox"><RadioTower size={20}/></span><Badge>BUILD 1–2</Badge></div><h3>Fleet & live location</h3><p>Onboard Cartrack and Netstar vehicles behind a provider-neutral tracking contract, ready for future partners.</p><Action secondary onClick={()=>setView("tracking")}>Explore tracking <ArrowRight size={15}/></Action></Panel>
      <Panel><div className="v2-panel-top"><span className="v2-iconbox"><Ticket size={20}/></span><Badge>BUILD 4–5</Badge></div><h3>Connected marketplace</h3><p>Customer demand, approved routes, daily seats, recurring subscriptions and fleet-owner capacity in one system.</p><Action secondary onClick={()=>setView("marketplace")}>See marketplace <ArrowRight size={15}/></Action></Panel>
    </div>
  </>;
}
function Marketplace({ setView }) {
  const [filter,setFilter]=useState("");
  const routes=DEMO_ROUTES.filter(x=>x.name.toLowerCase().includes(filter.toLowerCase())||x.type.toLowerCase().includes(filter.toLowerCase()));
  return <>
    <SectionTitle eyebrow="CUSTOMER EXPERIENCE" title="Transport marketplace" subtitle="Hybrid discovery: search approved routes, explore offerings and create demand. Example cards only.">
      <Action onClick={()=>setView("routes")}>Route operations <ArrowRight size={15}/></Action>
    </SectionTitle>
    <Panel className="v2-search-panel"><div className="v2-search"><Search size={19}/><input aria-label="Search example marketplace routes" placeholder="Search origins, destinations or services" value={filter} onChange={e=>setFilter(e.target.value)}/></div><Badge tone="light">Demo catalogue</Badge></Panel>
    <div className="v2-card-grid">{routes.map(r=><Panel className="v2-listing" key={r.id}><div className="v2-panel-top"><span className="v2-iconbox"><Route size={19}/></span><Badge>{r.status}</Badge></div><p className="v2-eyebrow">{r.type}</p><h3>{r.name}</h3><div className="v2-info-row"><CalendarDays size={16}/>{r.days}</div><div className="v2-listing-bottom"><span>Fare and capacity: not connected</span><Action secondary onClick={()=>setView("routes")}>View architecture <ArrowRight size={15}/></Action></div></Panel>)}</div>
    {routes.length===0&&<Panel><p>No example listing matches this search. Live marketplace matching will be connected in a later build.</p></Panel>}
  </>;
}
function Routes({ setView }) {
  return <>
    <SectionTitle eyebrow="SERVICE DESIGN" title="Routes & trips" subtitle="Routes are reusable service definitions. Trip instances are scheduled departures, with separate capacity and assignments."/>
    <div className="v2-tiles">
      <Panel><span className="v2-iconbox"><MapPin/></span><h3>Route definitions</h3><p>Versioned stops, geocodes, directions, operating schedules and conditional pickup proposals.</p><Badge>Schema planned</Badge></Panel>
      <Panel><span className="v2-iconbox"><CalendarDays/></span><h3>Scheduled trip instances</h3><p>Each occurrence has a date, assigned vehicle, driver, manifested passengers and live operational status.</p><Badge>Schema planned</Badge></Panel>
      <Panel><span className="v2-iconbox"><Ticket/></span><h3>Seat inventory</h3><p>Protect recurring commitments, safely release eligible daily seats and prevent overselling at database level.</p><Badge>Rules planned</Badge></Panel>
    </div>
    <Panel className="v2-callout"><div><h3>Everything starts with an eligible vehicle</h3><p>Build the unified registry and tracking identity first so route and trip allocation has a reliable foundation.</p></div><Action onClick={()=>setView("fleet")}>Go to fleet registry <ArrowRight size={16}/></Action></Panel>
  </>;
}
function Fleet({ setView }) {
  const [vehicles,setVehicles]=useState(INITIAL_VEHICLES);
  const [query,setQuery]=useState("");
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  const [seats,setSeats]=useState("8");
  const [provider,setProvider]=useState("cartrack");
  const filtered=useMemo(()=>vehicles.filter(v=>(v.name+" "+v.provider+" "+v.id).toLowerCase().includes(query.toLowerCase())),[vehicles,query]);
  function addVehicle(e) {
    e.preventDefault();
    const n=Number(seats);
    if(!name.trim()||!Number.isInteger(n)||n<1||n>80)return;
    setVehicles(old=>[...old,{id:"DRAFT-"+String(old.length+1).padStart(3,"0"),name:name.trim(),seats:n,provider,status:"Draft only"}]);
    setName("");setSeats("8");setOpen(false);
  }
  return <>
    <SectionTitle eyebrow="BUILD 1 · FLEET MANAGEMENT" title="Unified fleet registry" subtitle="One vehicle record, regardless of whether it uses Cartrack, Netstar or a future partner provider.">
      <Action onClick={()=>setOpen(x=>!x)}>{open?<X size={16}/>:<Plus size={16}/>} {open?"Close":"Add demo vehicle"}</Action>
    </SectionTitle>
    <div className="v2-notice"><ShieldCheck size={19}/><span>Sandbox data only. Drafts are local to this page and are not saved, published or linked to tracking providers.</span></div>
    {open&&<Panel><h3>Create a vehicle draft</h3><form className="v2-form" onSubmit={addVehicle}><label>Vehicle label<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Shuttle 01" required/></label><label>Passenger seat capacity<input type="number" min="1" max="80" value={seats} onChange={e=>setSeats(e.target.value)} required/></label><label>Tracking provider<select value={provider} onChange={e=>setProvider(e.target.value)}>{TRACKING_PROVIDERS.map(s=><option value={s} key={s}>{s.replaceAll("_"," ")}</option>)}</select></label><Action submit>Save draft <Check size={16}/></Action></form></Panel>}
    <Panel className="v2-search-panel"><div className="v2-search"><Search size={19}/><input placeholder="Filter vehicles or provider..." aria-label="Filter vehicles" value={query} onChange={e=>setQuery(e.target.value)}/></div><Badge>{filtered.length} demo records</Badge></Panel>
    <Panel className="v2-table-panel"><div className="v2-table-scroll"><table><thead><tr><th>Vehicle</th><th>Seats</th><th>Tracking</th><th>Location health</th><th>Status</th></tr></thead><tbody>{filtered.map(v=><tr key={v.id}><td><strong>{v.name}</strong><small>{v.id}</small></td><td>{v.seats}</td><td><Badge tone="light">{v.provider}</Badge></td><td>Not available</td><td><Badge>{v.status}</Badge></td></tr>)}</tbody></table></div>{filtered.length===0&&<p className="v2-pad">No matching demo vehicles.</p>}</Panel>
    <Panel className="v2-callout"><div><h3>Next: provider adapters</h3><p>Each verified tracking account will map a provider-specific device ID to a single TrustArc vehicle identity through a secure backend.</p></div><Action onClick={()=>setView("tracking")}>Tracking readiness <ArrowRight size={16}/></Action></Panel>
  </>;
}
function Tracking({ setView }) {
  return <>
    <SectionTitle eyebrow="BUILD 2 · TELEMATICS" title="Live tracking" subtitle="One location service for every vehicle and role, independent of the hardware provider."/>
    <div className="v2-tracking-layout">
      <Panel className="v2-map-placeholder"><div className="v2-map-art"><div className="v2-map-grid"/><div className="v2-map-bubble"><RadioTower size={27}/><strong>Map awaits authorised GPS feeds</strong><span>No coordinates are being retrieved or displayed</span></div></div><div className="v2-map-bottom"><span><span className="v2-dot v2-dot-neutral"/> No live telemetry connected</span><Badge>Safe placeholder</Badge></div></Panel>
      <div className="v2-provider-stack">
        {[["Cartrack","Fleet API adapter"],["Netstar","Telematics adapter"],["Partner tracking","Future provider interface"]].map(([name,desc])=><Panel key={name}><div className="v2-panel-top"><span className="v2-iconbox"><RadioTower size={18}/></span><Badge>Not connected</Badge></div><h3>{name}</h3><p>{desc}</p><div className="v2-separator"/><span className="v2-hint">Credentials stay on the server, never inside this application.</span></Panel>)}
      </div>
    </div>
    <Panel className="v2-callout"><div><h3>Trip-based location access</h3><p>Customers see only their assigned vehicle during an authorised journey window. A stale GPS fix must never be represented as live.</p></div><Action secondary onClick={()=>setView("security")}>View privacy rules <ShieldCheck size={16}/></Action></Panel>
  </>;
}
function People() {
  return <><SectionTitle eyebrow="IDENTITY" title="People & access" subtitle="One account can hold multiple verified roles; actual permissions must be enforced in the backend, not by a frontend toggle."/><div className="v2-tiles">{[["Customer","Transport requests, bookings, journey locations"],["Driver","Assigned trips, readiness and permitted manifests"],["Fleet owner","Own fleet, offers, earnings and approved operations"]].map(([name,desc])=><Panel key={name}><span className="v2-iconbox"><Users size={20}/></span><h3>{name}</h3><p>{desc}</p><Badge>Access policies pending</Badge></Panel>)}</div></>;
}
function Finance() {
  return <><SectionTitle eyebrow="COMMERCIAL" title="Finance & wallets" subtitle="Invoices, collections, fare rules and customer travel credits belong to one auditable financial model."/><div className="v2-tiles">{[["Invoices & subscriptions",CreditCard,"Advance billing, prorating and reconciliation"],["Travel wallet",Wallet,"Separate travel credits from any regulated stored funds"],["Provider settlement",ArrowDownRight,"Verified trips and contractual payout rules"]].map(([name,I,desc])=><Panel key={name}><span className="v2-iconbox"><I/></span><h3>{name}</h3><p>{desc}</p><Badge>Architecture stage</Badge></Panel>)}</div></>;
}
function Privacy() {
  return <><SectionTitle eyebrow="TRUST BY DESIGN" title="Security & privacy" subtitle="POPIA requirements are part of our architecture and acceptance tests before real data is activated."/><div className="v2-tiles">{[["Protected identity",ShieldCheck,"Role + organisation authorisation, server-side access checks, RLS."],["Geolocation",MapPin,"Trip-scoped access, data minimisation and defined retention."],["Financial protection",CreditCard,"Tokenised payments and auditable credits; no raw card data."],["Operational audit",FileCheck2,"Record approvals, sensitive access, changes and exceptions."]].map(([name,I,desc])=><Panel key={name}><span className="v2-iconbox"><I/></span><h3>{name}</h3><p>{desc}</p><Badge>Implementation gate</Badge></Panel>)}</div><div className="v2-notice"><CircleAlert size={19}/><span>This branch is a non-production interface foundation, not a certification of POPIA compliance. No real customer data or GPS credentials have been connected.</span></div></>;
}
export default function TrustArcV2() {
  const [view,setView]=useState("overview");
  const [role,setRole]=useState("operations");
  const [mobileOpen,setMobileOpen]=useState(false);
  const active=NAV.find(n=>n.id===view)||NAV[0];
  const Body={overview:Overview,marketplace:Marketplace,routes:Routes,fleet:Fleet,tracking:Tracking,people:People,finance:Finance,security:Privacy}[view]||Overview;
  function navigate(v){setView(v);setMobileOpen(false);window.scrollTo({top:0,behavior:"smooth"});}
  return <div className="v2-app">
    <aside className={"v2-sidebar "+(mobileOpen?"v2-sidebar-open":"")} aria-label="Main navigation">
      <div className="v2-brand"><TrustArcLogo className="v2-brand-logo"/><div><strong>TRUSTARC<span>.</span></strong><small>THE OPERATING SYSTEM</small></div><button className="v2-mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X size={19}/></button></div>
      <div className="v2-workspace-selector"><span className="v2-selector-icon"><Sparkles size={18}/></span><div><strong>TrustArc 2.0</strong><small>Replacement build · Preview</small></div><ChevronDown size={14}/></div>
      <nav>{NAV.map((n,i)=><div key={n.id}>{(i===0||NAV[i-1].group!==n.group)&&<p className="v2-nav-group">{n.group}</p>}<button className={"v2-nav-link "+(view===n.id?"selected":"")} onClick={()=>navigate(n.id)}><n.icon size={18}/><span>{n.label}</span>{view===n.id&&<span className="v2-nav-dot"/>}</button></div>)}</nav>
      <div className="v2-side-bottom"><div className="v2-side-safe"><ShieldCheck size={17}/><span>Privacy-first build<br/><small>No live data connected</small></span></div><p>TRUSTARC · FOUNDATION V0.1</p></div>
    </aside>
    {mobileOpen&&<button className="v2-overlay" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}
    <div className="v2-main">
      <header className="v2-topbar">
        <div className="v2-top-left"><button className="v2-menu" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><span className="v2-breadcrumb">TrustArc 2.0 <span>/</span> <strong>{active.label}</strong></span></div>
        <div className="v2-top-right"><Badge tone="notice">Preview environment</Badge><button className="v2-icon-button" title="Notifications will be connected in a later build" disabled><Bell size={18}/></button><div className="v2-avatar">T</div></div>
      </header>
      <main className="v2-content">
        <div className="v2-headline"><div><p className="v2-eyebrow">WELCOME TO THE NEW TRUSTARC</p><h1>{active.label}</h1></div><div className="v2-role-preview"><label htmlFor="v2-role">Preview experience</label><select id="v2-role" value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(r=><option value={r.value} key={r.value}>{r.label}</option>)}</select><small>Visual preview only; not account permissions.</small></div></div>
        {role!=="operations"&&<div className="v2-notice"><CircleAlert size={18}/><span>{ROLES.find(r=>r.value===role)?.label} experience selected for design preview. Authentication and role-specific permissions are not yet enabled.</span></div>}
        <Body setView={navigate}/>
      </main>
      <footer className="v2-footer"><span>© TrustArc 2.0 · Integrated transport operating system</span><span>BUILD 0 · DESIGN + CODE FOUNDATION</span></footer>
    </div>
  </div>;
}
