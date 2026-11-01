import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BusFront, CalendarDays, Check,
  CheckCircle2, ChevronDown, Clock3, CreditCard, Home, LocateFixed, MapPin, Menu,
  Navigation, Plus, Radio, Repeat2, Route, Search, Settings2, ShieldCheck,
  Sparkles, Ticket, UserRound, Users, Wallet, X, Compass, CarFront, ListChecks, Heart,
  Info, Smartphone, SlidersHorizontal, Layers3, FileText, CircleAlert, Send, CalendarCheck, History
} from "lucide-react";
import TrustArcLogo from "./TrustArcLogo.jsx";
import AppAddressSearch from "./AppAddressSearch.jsx";
import PeopleOnboarding from "./PeopleOnboarding.jsx";
import ExactQuoteRequest from "./ExactQuoteRequest.jsx";
import VehicleCataloguePicker from "./VehicleCataloguePicker.jsx";
import {ConnectionMap,BuildPulse,OperationsInfographic,TrackingReadiness} from "./VisualInsights.jsx";
import { TRACKING_PROVIDERS } from "./tracking.js";
import "./TrustArcApp.css";

const ROLE_TABS = {
  customer: [
    { id:"home",label:"Home",icon:Home },
    { id:"explore",label:"Explore",icon:Compass },
    { id:"journeys",label:"Journeys",icon:Ticket },
    { id:"wallet",label:"Wallet",icon:Wallet },
    { id:"profile",label:"Profile",icon:UserRound }
  ],
  driver: [
    { id:"home",label:"Home",icon:Home },
    { id:"journeys",label:"Trips",icon:CalendarDays },
    { id:"tracking",label:"Navigate",icon:Navigation },
    { id:"wallet",label:"Earnings",icon:Wallet },
    { id:"profile",label:"Profile",icon:UserRound }
  ],
  fleet: [
    { id:"home",label:"Home",icon:Home },
    { id:"routes",label:"Routes",icon:Route },
    { id:"vehicles",label:"Fleet",icon:BusFront },
    { id:"wallet",label:"Earnings",icon:Wallet },
    { id:"profile",label:"Profile",icon:UserRound }
  ],
  operations: [
    { id:"home",label:"Home",icon:Home },
    { id:"routes",label:"Routes",icon:Route },
    { id:"vehicles",label:"Fleet",icon:BusFront },
    { id:"people",label:"People",icon:Users },
    { id:"profile",label:"More",icon:Layers3 }
  ]
};
const ROLES = [
  {id:"customer",name:"Customer",subtitle:"Travel marketplace"},
  {id:"driver",name:"Driver",subtitle:"Driver workspace"},
  {id:"fleet",name:"Fleet owner",subtitle:"Supply marketplace"},
  {id:"operations",name:"TrustArc team",subtitle:"Control centre"}
];
const ROUTES = [
  {id:"southern-cbd",start:"Southern Suburbs",end:"Cape Town CBD",period:"Weekday commuter route",price:"R2,800",unit:"/ month",type:"Monthly",label:"Popular commute"},
  {id:"southern-stellenbosch",start:"Southern Suburbs",end:"Stellenbosch",period:"Weekday commuter route",price:"R4,200",unit:"/ month",type:"Monthly",label:"Recurring route"},
  {id:"airport",start:"Cape Town Airport",end:"Your destination",period:"Airport & private transfers",price:"Request quote",unit:"",type:"Once-off",label:"On demand"}
];
const CARDS = [
  {title:"Find my route",description:"Explore a daily commute or one-off trip.",icon:Compass,tab:"explore"},
  {title:"My journeys",description:"Upcoming trips and subscriptions.",icon:CalendarCheck,tab:"journeys"},
  {title:"Travel wallet",description:"Payments and travel credits.",icon:Wallet,tab:"wallet"}
];
const moneyFormat = n => Number.isFinite(Number(n)) ? Number(n).toLocaleString("en-ZA") : "—";
function Pill({children,kind="soft"}) {return <span className={"ta2-pill ta2-pill-"+kind}>{children}</span>}
function Button({children,onClick,secondary=false,disabled=false,type="button"}) {return <button type={type} onClick={onClick} disabled={disabled} className={"ta2-btn "+(secondary?"ta2-btn-outline":"")}>{children}</button>}
function Panel({children,className=""}) {return <section className={"ta2-panel "+className}>{children}</section>}
function Heading({eyebrow,title,description,action}) {return <div className="ta2-heading"><div><p className="ta2-eyebrow">{eyebrow}</p><h2>{title}</h2>{description&&<p>{description}</p>}</div>{action}</div>}
function UnderConstruction({title,description}) {return <Panel className="ta2-empty"><div className="ta2-empty-icon"><Sparkles size={23}/></div><h3>{title}</h3><p>{description}</p><Pill>Preview · No live data</Pill></Panel>}
function Metric({label,icon:Icon,foot}) {return <div className="ta2-metric"><Icon size={18}/><span>{label}</span><strong>—</strong><small>{foot}</small></div>}
function RouteCard({item,onSelect}) {return <article className="ta2-route-card">
  <div className="ta2-route-card-top"><Pill kind="soft">{item.label}</Pill><Heart size={18} aria-hidden="true"/></div>
  <div className="ta2-route-graphic"><div className="ta2-route-line"><span/><i/><b/></div><div className="ta2-route-ends"><strong>{item.start}</strong><strong>{item.end}</strong></div></div>
  <p className="ta2-route-meta"><CalendarDays size={15}/>{item.period}</p>
  <div className="ta2-route-price"><div><small>{item.type==="Once-off"?"PRIVATE JOURNEY":"FROM"}</small><strong>{item.price} <em>{item.unit}</em></strong></div><button onClick={()=>onSelect(item)} aria-label={"Explore "+item.start+" to "+item.end}><ArrowUpRight size={21}/></button></div>
  <small className="ta2-disclaimer">Example offering · Check availability before booking</small>
</article>}
function InstallInfo({close,installPrompt}) {return <div className="ta2-sheet-backdrop" onClick={close}><div role="dialog" aria-modal="true" aria-label="Install TrustArc" className="ta2-sheet" onClick={e=>e.stopPropagation()}>
  <div className="ta2-sheet-handle"/><div className="ta2-sheet-head"><h3>Add TrustArc to your phone</h3><button aria-label="Close" onClick={close}><X size={19}/></button></div>
  <div className="ta2-install-brand"><TrustArcLogo className="ta2-install-logo"/><div><strong>TRUSTARC.</strong><small>Your transport marketplace, always close.</small></div></div>
  <p>Install the app-style experience from your browser. No app-store account is required for the PWA.</p>
  <div className="ta2-install-step"><span>Android</span><p>Tap the browser's <strong>Install app</strong> option, or use the install action below when available.</p></div>
  <div className="ta2-install-step"><span>iPhone</span><p>Open this page in Safari, select <strong>Share → Add to Home Screen → Add</strong>.</p></div>
  {installPrompt?<Button onClick={installPrompt}>Install TrustArc <ArrowRight size={17}/></Button>:<Button secondary onClick={close}>Got it <Check size={17}/></Button>}
</div></div>}
function RouteDetail({route,close,onQuote}) {
  const [plan,setPlan]=useState("monthly");
  const [pickup,setPickup]=useState("approved");
  const [proposedPoint,setProposedPoint]=useState({address:"",lat:null,lng:null,verified:false});
  return <div className="ta2-sheet-backdrop" onClick={close}><div role="dialog" aria-modal="true" aria-label="Route details" className="ta2-sheet ta2-sheet-large" onClick={e=>e.stopPropagation()}>
    <div className="ta2-sheet-handle"/><div className="ta2-sheet-head"><span className="ta2-eyebrow">SERVICE DETAILS · CONCEPT</span><button onClick={close} aria-label="Close"><X size={19}/></button></div>
    <h2 className="ta2-detail-title">{route.start}<span> to </span>{route.end}</h2>
    <p className="ta2-muted">{route.period}</p>
    <div className="ta2-detail-grid"><div><CalendarDays size={17}/><span>Schedule</span><strong>{route.type==="Monthly"?"Weekdays":"On demand"}</strong></div><div><Users size={17}/><span>Available seats</span><strong>Check dates</strong></div></div>
    <h3>Pickup arrangement</h3>
    <div className="ta2-choice-group">
      <button className={pickup==="approved"?"active":""} onClick={()=>setPickup("approved")}><MapPin size={17}/><span>Choose an approved stop</span><CheckCircle2 size={17}/></button>
      <button className={pickup==="proposed"?"active":""} onClick={()=>setPickup("proposed")}><Plus size={17}/><span>Propose a new stop</span><ArrowRight size={17}/></button>
    </div>
    <p className="ta2-inline-note">{pickup==="approved"?"Available stops will load after route and geocoding integration.":"A new stop requires route, safety and timetable feasibility checks before booking."}</p>
    {pickup==="proposed"&&<div className="ta2-location-proposal"><AppAddressSearch label="Proposed pickup address" value={proposedPoint} onChange={setProposedPoint} placeholder="Search and select a proposed stop"/><small>A suggested map pin is a proposal, never an approved stop.</small></div>}
    <h3>How would you like to travel?</h3>
    <div className="ta2-choice-group"><button className={plan==="monthly"?"active":""} onClick={()=>setPlan("monthly")}><Repeat2 size={18}/><span>Recurring subscription</span><CheckCircle2 size={17}/></button><button className={plan==="daily"?"active":""} onClick={()=>setPlan("daily")}><Ticket size={18}/><span>Buy selected travel days</span><CheckCircle2 size={17}/></button></div>
    <div className="ta2-detail-footer"><div><small>Price</small><strong>{route.price}</strong></div><Button onClick={onQuote}>Request exact journey quote <ArrowRight size={15}/></Button></div>
    <p className="ta2-disclaimer">No bookings, charges, seats or tracking data are created in this preview.</p>
  </div></div>
}
function CustomerHome({go,setSelectedRoute,onFind}) {
  const [origin,setOrigin]=useState({address:"",lat:null,lng:null,verified:false});
  const [destination,setDestination]=useState({address:"",lat:null,lng:null,verified:false});
  const [frequency,setFrequency]=useState("recurring");
  const [searchMessage,setSearchMessage]=useState("");
  function find(){if(!origin.verified||!destination.verified){setSearchMessage("Select both pickup and destination from the map suggestions to confirm their coordinates.");return}setSearchMessage("");onFind({origin,destination,frequency});}
  return <>
    <div className="ta2-hero">
      <div className="ta2-hero-copy"><span className="ta2-hero-label"><i/> CAPE TOWN & BEYOND</span><h1>Every journey,<br/><em>beautifully connected.</em></h1><p>Find your regular commute, explore the marketplace, or plan a journey that's entirely yours.</p></div>
      <div className="ta2-hero-decoration"><div className="ta2-glow"/><div className="ta2-hero-orbit"><TrustArcLogo/></div></div>
    </div>
    <Panel className="ta2-find-panel"><div className="ta2-find-head"><h2>Where are we taking you?</h2><span><LocateFixed size={16}/> Search transport</span></div>
      <div className="ta2-input-stack ta2-geocode-stack"><AppAddressSearch label="Pickup" value={origin} onChange={v=>{setOrigin(v);setSearchMessage("")}} placeholder="Search your pickup street or area" icon={MapPin} required/><div className="ta2-input-divider"/><AppAddressSearch label="Destination" value={destination} onChange={v=>{setDestination(v);setSearchMessage("")}} placeholder="Search your destination or workplace" icon={Navigation} required/></div>
      <div className="ta2-frequency">{[["recurring","Everyday commute"],["once","Once-off"],["flexible","Flexible"]].map(([id,label])=><button key={id} className={frequency===id?"chosen":""} onClick={()=>setFrequency(id)}>{label}</button>)}</div>
      <Button onClick={find}>Find my transport <ArrowRight size={18}/></Button>{searchMessage&&<p className="ta2-search-error" role="status">{searchMessage}</p>}<small>Location pins use Mapbox. Results are illustrative until live route matching is connected.</small>
    </Panel>
    <ConnectionMap compact caption="Illustrative TrustArc route network · not GPS data or a live service"/>
    <Heading eyebrow="THE MARKETPLACE" title="Explore your next journey" description="Discover routes and transport options available through TrustArc." action={<button className="ta2-text-link" onClick={()=>go("explore")}>See all <ArrowRight size={16}/></button>}/>
    <div className="ta2-route-grid">{ROUTES.slice(0,2).map(item=><RouteCard key={item.id} item={item} onSelect={setSelectedRoute}/>)}</div>
    <Heading eyebrow="MADE FOR EVERY JOURNEY" title="Everything in one place"/>
    <div className="ta2-action-grid">{CARDS.map(({title,description,icon:Icon,tab})=><button className="ta2-action-card" key={tab} onClick={()=>go(tab)}><Icon size={22}/><strong>{title}</strong><span>{description}</span><ArrowUpRight className="ta2-action-arrow" size={17}/></button>)}</div>
  </>;
}
function Explore({setSelectedRoute,journeySearch,onExactQuote}) {
  const [q,setQ]=useState("");const [filter,setFilter]=useState("all");
  const rows=ROUTES.filter(r=>(filter==="all"||r.type===(filter==="recurring"?"Monthly":"Once-off"))&&(r.start+" "+r.end+" "+r.period).toLowerCase().includes(q.toLowerCase()));
  return <>
    <Heading eyebrow="TRUSTARC MARKETPLACE" title="Explore transport" description="Search recurring routes, private transfers and emerging transport opportunities."/>
    {journeySearch&&<div className="ta2-exact-journey-card"><div className="ta2-exact-journey-copy"><p className="ta2-eyebrow">YOUR EXACT REQUEST</p><h3>Quote the journey you actually searched for</h3><p>Your original pickup and destination are preserved. We can prepare a precise quotation enquiry without requiring you to select an unrelated service.</p></div><button className="ta2-btn" onClick={onExactQuote}>Quote this exact trip <ArrowRight size={17}/></button></div>}
    <div className="ta2-quote-discovery"><button className="ta2-btn ta2-btn-outline" onClick={onExactQuote}>Request a custom journey quote <ArrowRight size={17}/></button></div>
    {journeySearch&&<div className="ta2-search-summary"><div><MapPin size={18}/><span><strong>Pickup</strong>{journeySearch.origin.address}</span></div><ArrowRight size={17}/><div><Navigation size={18}/><span><strong>Destination</strong>{journeySearch.destination.address}</span></div><small>Geocoded locations selected · Live route matching pending</small></div>}
    <div className="ta2-searchbar"><Search size={19}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search a route or destination" aria-label="Search routes"/></div>
    <div className="ta2-filters">{[["all","All journeys"],["recurring","Commuter routes"],["once","Once-off"]].map(([value,label])=><button className={filter===value?"active":""} onClick={()=>setFilter(value)} key={value}>{label}</button>)}</div>
    <div className="ta2-heading"><div><p className="ta2-eyebrow">ALTERNATIVES, NOT VERIFIED MATCHES</p><h2>Other TrustArc services</h2><p>These are examples of existing offerings; they are not yet ranked by your exact pins or guaranteed available.</p></div></div>
    <ConnectionMap compact caption="Conceptual service network · alternatives are not confirmed journey matches"/>
    <div className="ta2-route-grid">{rows.map(r=><RouteCard key={r.id} item={r} onSelect={setSelectedRoute}/>)}</div>
    {!rows.length&&<UnderConstruction title="No example matches" description="Try another destination. In the live marketplace, you will be able to request a route and gather interest."/>}
    <Panel className="ta2-inline-cta"><div><h3>Can't find the right route?</h3><p>Prepare a request for your precise journey. The live matching engine can later use it to identify route and fleet-owner opportunities.</p></div><button onClick={onExactQuote} className="ta2-btn">Quote my own route <ArrowRight size={16}/></button></Panel>
  </>;
}
function JourneyScreen({role}) {return <>
  <Heading eyebrow={role==="driver"?"DRIVER WORKSPACE":"YOUR TRANSPORT"} title={role==="driver"?"Assigned trips":"My journeys"} description="One place for schedules, trip information and operational updates."/>
  <UnderConstruction title="No live trips connected yet" description="Real trips will appear only after secure account access, trip assignment and customer booking data have been connected."/>
  <div className="ta2-info-grid"><Panel><CalendarDays size={22}/><h3>Upcoming</h3><p>Scheduled transport and departure details.</p></Panel><Panel><Navigation size={22}/><h3>Journey tracking</h3><p>Vehicle location and pickup ETA, when an active trip is assigned.</p></Panel></div>
</>}
function WalletScreen({role}) {return <>
  <Heading eyebrow="FINANCIAL EXPERIENCE" title={role==="customer"?"My wallet":"Earnings & settlement"} description={role==="customer"?"See payment history, invoices and eligible travel credits.":"View verified service activity and approved payment statements."}/>
  <div className="ta2-wallet-card"><span>{role==="customer"?"AVAILABLE TRAVEL CREDITS":"AVAILABLE EARNINGS"}</span><strong>—</strong><small>Not connected to a financial account</small><div className="ta2-wallet-brand"><TrustArcLogo/></div></div>
  <div className="ta2-info-grid"><Panel><CreditCard size={22}/><h3>{role==="customer"?"Payments":"Statements"}</h3><p>Verified transactions and history.</p></Panel><Panel><History size={22}/><h3>Activity</h3><p>Auditable records of account movements.</p></Panel></div>
  <div className="ta2-privacy-note"><ShieldCheck size={17}/> Prepaid funds and refunds will only become available after payment and regulatory controls are approved.</div>
</>}
function FleetScreen() {
  const [drafts,setDrafts]=useState([]);
  const [show,setShow]=useState(false);
  const [vehicle,setVehicle]=useState({make:"",model:"",year:new Date().getFullYear(),seats:8,provider:"not_selected"});
  const [error,setError]=useState("");
  function add(e){
    e.preventDefault();
    if(!vehicle.make.trim()||!vehicle.model.trim()||!Number.isInteger(vehicle.seats)||vehicle.seats<1||vehicle.seats>80||!Number.isInteger(vehicle.year)||vehicle.year<1980||vehicle.year>new Date().getFullYear()+1){setError("Enter make, model, valid year and actual passenger seats.");return;}
    setDrafts(ds=>[...ds,{id:ds.length+1,...vehicle,label:vehicle.make+" "+vehicle.model,status:"Local draft · Unverified"}]);
    setError("");setShow(false);
  }
  return <>
    <Heading eyebrow="FLEET OPERATIONS" title="My fleet" description="Search common vehicle makes and models, or enter a South African model manually. Verified registration and compliance are separate steps." action={<Button onClick={()=>setShow(s=>!s)}>{show?<X size={16}/>:<Plus size={16}/>} {show?"Close":"Add vehicle"}</Button>}/>
    {show&&<Panel><h3>New vehicle draft</h3><form onSubmit={add}><VehicleCataloguePicker onChange={setVehicle}/>{error&&<p className="ta2-search-error" role="alert">{error}</p>}<Button type="submit">Add vehicle draft <Check size={16}/></Button></form><small className="ta2-disclaimer">Only a local preview record. No registration, insurance or GPS account is verified or saved to a live database.</small></Panel>}
    <div className="ta2-fleet-list">{[...drafts,{label:"Your verified fleet",seats:"—",provider:"Cartrack / Netstar",status:"Secure registry pending"}].map((v,i)=><Panel className="ta2-fleet-item" key={i}><span className="ta2-fleet-icon"><BusFront size={23}/></span><div><strong>{v.label}</strong><small>{v.year||""} · {v.seats} passenger seats · {v.provider}</small></div><Pill>{v.status}</Pill></Panel>)}</div>
    <div className="ta2-privacy-note"><Info size={17}/> The catalogue helps fill make/model information. TrustArc approves actual usable capacity only after registration, insurance, roadworthy and relevant service compliance are checked.</div>
  </>;
}

function RouteOperations() {
  const [open,setOpen]=useState(false);const [origin,setOrigin]=useState("");const [end,setEnd]=useState("");const [submitted,setSubmitted]=useState([]);
  function submit(e){e.preventDefault();if(!origin.trim()||!end.trim())return;setSubmitted(x=>[{origin,end},...x]);setOrigin("");setEnd("");setOpen(false);}
  return <>
    <Heading eyebrow="MARKETPLACE SUPPLY" title="Routes & services" description="Define reusable routes, schedules, capacity and the offerings customers can discover." action={<Button onClick={()=>setOpen(x=>!x)}>{open?<X size={16}/>:<Plus size={16}/>} Create proposal</Button>}/>
    {open&&<Panel><h3>New route proposal</h3><form className="ta2-draft-form" onSubmit={submit}><label>Starting area<input placeholder="Origin" value={origin} onChange={e=>setOrigin(e.target.value)} required/></label><label>Destination<input placeholder="Destination" value={end} onChange={e=>setEnd(e.target.value)} required/></label><Button type="submit">Create demo proposal <ArrowRight size={16}/></Button></form><small className="ta2-disclaimer">A real route will require approved stops, timetable, eligibility, commercial and capacity validation.</small></Panel>}
    <div className="ta2-service-list">{submitted.map((v,i)=><Panel className="ta2-service-item" key={i}><Route size={23}/><div><strong>{v.origin} → {v.end}</strong><small>Unsubmitted draft · not visible to customers</small></div><Pill>Draft</Pill></Panel>)}
    {ROUTES.map(r=><Panel className="ta2-service-item" key={r.id}><Route size={23}/><div><strong>{r.start} → {r.end}</strong><small>{r.period}</small></div><Pill>Example</Pill></Panel>)}</div>
  </>;
}
function Tracking() {return <>
  <Heading eyebrow="REAL-TIME OPERATIONS" title="Live tracking" description="Cartrack, Netstar and approved partner vehicles feed a single secure vehicle-position service."/>
  <div className="ta2-map-placeholder"><span className="ta2-map-mesh"/><div className="ta2-map-message"><Radio size={28}/><h3>Live map not connected</h3><p>We'll display authorised vehicles here after the fleet registry and telematics integrations are verified.</p><Pill>GPS feed · Not connected</Pill></div></div>
  <TrackingReadiness/>
  <div className="ta2-info-grid"><Panel><Radio size={22}/><h3>Cartrack & Netstar</h3><p>Both providers will be normalised to one vehicle position format.</p></Panel><Panel><Clock3 size={22}/><h3>Reliable ETA</h3><p>Predicted arrival from the assigned vehicle, approved stops, traffic and trip sequence.</p></Panel></div>
</>}
function Profile({role,go,openInstall}) {
  return <>
    <Heading eyebrow="TRUSTARC ACCOUNT" title={role==="operations"?"Management tools":"Your account"} description="Privacy, role verification and account controls are being implemented before live data is connected."/>
    <Panel className="ta2-account-card"><div className="ta2-account-avatar"><UserRound size={24}/></div><div><strong>{ROLES.find(r=>r.id===role)?.name} preview</strong><small>Demonstration mode · not signed in</small></div><Pill>Preview</Pill></Panel>
    <div className="ta2-menu-list">
      <button onClick={openInstall}><Smartphone size={20}/><span>Install TrustArc on this device</span><ArrowRight size={16}/></button>
      {role==="operations"&&<><button onClick={()=>go("explore")}><Compass size={20}/><span>Marketplace review</span><ArrowRight size={16}/></button><button onClick={()=>go("wallet")}><Wallet size={20}/><span>Finance & wallet architecture</span><ArrowRight size={16}/></button><button onClick={()=>go("journeys")}><Users size={20}/><span>Bookings & trip views</span><ArrowRight size={16}/></button><button onClick={()=>go("people")}><Plus size={20}/><span>Add customers, drivers and fleet owners</span><ArrowRight size={16}/></button><button onClick={()=>go("tracking")}><Radio size={20}/><span>Live fleet tracking</span><ArrowRight size={16}/></button></>}
      <button onClick={()=>go("privacy")}><ShieldCheck size={20}/><span>Privacy and POPIA controls</span><ArrowRight size={16}/></button>
    </div>
  </>;
}
function Privacy(){return <>
  <Heading eyebrow="PRIVACY BY DESIGN" title="Trust & security" description="Customer data, driver locations, fleet records and wallet transactions need verified authorisation before production use."/>
  <div className="ta2-info-grid"><Panel><ShieldCheck size={22}/><h3>Role-scoped access</h3><p>Customers only see assigned trips; fleet owners see their authorised organisation records.</p></Panel><Panel><MapPin size={22}/><h3>Location privacy</h3><p>Tracking is limited to an operational purpose and permitted journey window.</p></Panel><Panel><CreditCard size={22}/><h3>Payment security</h3><p>Gateway tokens, audited entries and no raw card storage in app data.</p></Panel><Panel><ListChecks size={22}/><h3>Audit and retention</h3><p>Keep approval decisions, access logs and controlled retention policies.</p></Panel></div>
</>}
function OperationsHome({go}){return <>
  <div className="ta2-hero ta2-hero-operations"><div className="ta2-hero-copy"><span className="ta2-hero-label"><i/> TRUSTARC CONTROL</span><h1>The whole operation.<br/><em>One clear view.</em></h1><p>Fleet, routes, journeys and customer demand—managed together, not across disconnected screens.</p><Button onClick={()=>go("tracking")}>Open live operations <ArrowRight size={17}/></Button></div><div className="ta2-hero-decoration"><div className="ta2-glow"/><div className="ta2-hero-orbit"><TrustArcLogo/></div></div></div>
  <Heading eyebrow="OPERATIONAL PULSE" title="At a glance" description="Metrics activate after secure integration with the verified live database."/>
  <div className="ta2-metric-grid"><Metric label="Active trips" icon={Navigation} foot="Trip feed pending"/><Metric label="Fleet connected" icon={BusFront} foot="Provider access pending"/><Metric label="Requests" icon={Users} foot="CRM connection pending"/><Metric label="Outstanding" icon={Wallet} foot="Finance link pending"/></div>
  <div className="ta2-dash-viz-grid"><BuildPulse/><OperationsInfographic/></div>
  <Heading eyebrow="YOUR WORKSPACE" title="Run TrustArc"/>
  <div className="ta2-action-grid">{[{title:"Route operations",description:"Create and manage services",icon:Route,tab:"routes"},{title:"Vehicle registry",description:"Fleet supply and tracking",icon:BusFront,tab:"vehicles"},{title:"People & onboarding",description:"Add customers, drivers and fleet owners",icon:Users,tab:"people"},{title:"Live command",description:"Locations, ETAs and alerts",icon:Radio,tab:"tracking"}].map(x=><button className="ta2-action-card" key={x.tab} onClick={()=>go(x.tab)}><x.icon size={22}/><strong>{x.title}</strong><span>{x.description}</span><ArrowUpRight className="ta2-action-arrow" size={17}/></button>)}</div>
</>}
function FleetHome({go}){return <><div className="ta2-hero"><div className="ta2-hero-copy"><span className="ta2-hero-label"><i/> FLEET OWNER WORKSPACE</span><h1>Your fleet.<br/><em>More opportunity.</em></h1><p>Publish route proposals, offer capacity and follow your authorised transport activity.</p><Button onClick={()=>go("routes")}>Create supply <ArrowRight size={17}/></Button></div></div><Heading eyebrow="MY SUPPLY" title="Fleet operations"/><div className="ta2-action-grid">{[{title:"Routes",description:"Create recurring transport supply",icon:Route,tab:"routes"},{title:"Vehicles",description:"Manage registered capacity",icon:BusFront,tab:"vehicles"},{title:"Earnings",description:"View payouts and statements",icon:Wallet,tab:"wallet"}].map(x=><button className="ta2-action-card" key={x.tab} onClick={()=>go(x.tab)}><x.icon size={22}/><strong>{x.title}</strong><span>{x.description}</span><ArrowUpRight className="ta2-action-arrow" size={17}/></button>)}</div></>}
function DriverHome({go}){return <><div className="ta2-hero"><div className="ta2-hero-copy"><span className="ta2-hero-label"><i/> DRIVER WORKSPACE</span><h1>Every trip.<br/><em>In your hands.</em></h1><p>View assignments, check in and manage your upcoming journeys from one app.</p><Button onClick={()=>go("journeys")}>View assigned trips <ArrowRight size={17}/></Button></div></div><Heading eyebrow="DRIVER READINESS" title="Your next trip"/><UnderConstruction title="No active assignment" description="Readiness check-in becomes available only when a verified driver account is assigned to a real trip."/><Panel className="ta2-inline-cta"><div><h3>Background GPS</h3><p>Vehicle tracking uses approved Cartrack or Netstar data where available; mobile device tracking needs additional native controls.</p></div><Pill>Protected design</Pill></Panel></>}
export default function TrustArcApp() {
  const [role,setRole]=useState("customer");
  const [tab,setTab]=useState("home");
  const [selectedRoute,setSelectedRoute]=useState(null);
  const [journeySearch,setJourneySearch]=useState(null);
  const [quoteRequest,setQuoteRequest]=useState(null);
  const [installVisible,setInstallVisible]=useState(false);
  const [installEvent,setInstallEvent]=useState(null);
  const [roleOpen,setRoleOpen]=useState(false);
  const tabs=ROLE_TABS[role];
  const active=tabs.find(t=>t.id===tab);
  useEffect(()=>{
    const handler=e=>{e.preventDefault();setInstallEvent(e)};
    window.addEventListener("beforeinstallprompt",handler);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);
  useEffect(()=>{
    if("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/trustarc-sw.js").catch(()=>{});
    }
  },[]);
  function go(next){setTab(next);window.scrollTo({top:0,behavior:"instant"});}
  function switchRole(next){setRole(next);setTab("home");setRoleOpen(false);window.scrollTo({top:0,behavior:"instant"});}
  async function install(){if(!installEvent)return;await installEvent.prompt();setInstallEvent(null);setInstallVisible(false);}
  return <div className="ta2-app">
    <header className="ta2-header"><div className="ta2-header-inner">
      <button className="ta2-wordmark" aria-label="TrustArc home" onClick={()=>go("home")}><TrustArcLogo/><span>TRUSTARC<span className="ta2-period">.</span></span></button>
      <div className="ta2-header-actions"><span className="ta2-preview-chip">APP PREVIEW</span><button onClick={()=>setInstallVisible(true)} className="ta2-header-icon" aria-label="Install TrustArc"><Smartphone size={19}/></button><div className="ta2-role-wrapper"><button className="ta2-role-button" onClick={()=>setRoleOpen(x=>!x)} aria-label="Switch role" aria-expanded={roleOpen}><span className="ta2-role-avatar"><UserRound size={17}/></span><span className="ta2-role-text">{ROLES.find(x=>x.id===role)?.name}</span><ChevronDown size={15}/></button>
      {roleOpen&&<div className="ta2-role-menu">{ROLES.map(r=><button key={r.id} onClick={()=>switchRole(r.id)}><span><strong>{r.name}</strong><small>{r.subtitle}</small></span>{role===r.id&&<Check size={17}/>}</button>)}<p>Role preview only. Real access will require verified permissions.</p></div>}</div></div>
    </div></header>
    <div className="ta2-announcement"><div><ShieldCheck size={15}/><span>TrustArc 2.0 development preview · No live bookings, payments or GPS connected</span></div></div>
    <main className="ta2-main">
      {tab==="home"&&role==="customer"&&<CustomerHome go={go} setSelectedRoute={setSelectedRoute} onFind={search=>{setJourneySearch(search);go("explore")}}/>}
      {tab==="home"&&role==="operations"&&<OperationsHome go={go}/>}
      {tab==="home"&&role==="fleet"&&<FleetHome go={go}/>}
      {tab==="home"&&role==="driver"&&<DriverHome go={go}/>}
      {tab==="explore"&&<Explore setSelectedRoute={setSelectedRoute} journeySearch={journeySearch} onExactQuote={()=>{setQuoteRequest(journeySearch);go("quote")}}/>}
      {tab==="quote"&&role==="customer"&&<ExactQuoteRequest key={quoteRequest?.origin?.address||"new"} initialRequest={quoteRequest} onBack={()=>go("explore")}/>} 
      {tab==="journeys"&&<JourneyScreen role={role}/>}
      {tab==="wallet"&&<WalletScreen role={role}/>}
      {tab==="routes"&&<RouteOperations/>}
      {tab==="vehicles"&&<FleetScreen/>}
      {tab==="tracking"&&<Tracking/>}
      {tab==="people"&&role==="operations"&&<PeopleOnboarding/>}
      {tab==="profile"&&<Profile role={role} go={go} openInstall={()=>setInstallVisible(true)}/>}
      {tab==="privacy"&&<Privacy/>}
      <footer className="ta2-footer"><strong>TRUSTARC.</strong><span>Seamless journeys. Everywhere.</span><small>BUILD 0.2 · PWA EXPERIENCE PREVIEW</small></footer>
    </main>
    <nav className="ta2-bottom-nav" aria-label="Primary app navigation"><div className="ta2-tab-row">{tabs.map(({id,label,icon:Icon})=><button key={id} className={"ta2-tab "+(tab===id?"active":"")} onClick={()=>go(id)} aria-current={tab===id?"page":undefined}><span className="ta2-tab-icon"><Icon size={21} strokeWidth={tab===id?2.5:1.8}/></span><span>{label}</span></button>)}</div></nav>
    {selectedRoute&&<RouteDetail key={selectedRoute.id} route={selectedRoute} close={()=>setSelectedRoute(null)} onQuote={()=>{setSelectedRoute(null);setQuoteRequest(journeySearch);go("quote")}}/>}
    {installVisible&&<InstallInfo close={()=>setInstallVisible(false)} installPrompt={installEvent?install:null}/>}
  </div>;
}
