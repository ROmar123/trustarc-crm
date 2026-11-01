import {Activity, ArrowRight, BadgeCheck, BusFront, CheckCircle2, Circle, Clock3, Compass, CreditCard, Database, FileClock, LocateFixed, MapPin, Navigation, Radio, Route, ShieldCheck, Sparkles, Users, Wallet} from "lucide-react";
import "./VisualInsights.css";

const STEPS=[
 {title:"Locate",detail:"Verified map pins",icon:MapPin},
 {title:"Plan",detail:"Dates and travel needs",icon:Clock3},
 {title:"Review",detail:"Quote and capacity check",icon:FileClock},
 {title:"Confirm",detail:"Approval and payment",icon:BadgeCheck},
];
const WORK=[
 {name:"App & navigation",detail:"Built · Preview",level:"ready",icon:Compass},
 {name:"Quote preparation",detail:"Built · Email handoff",level:"ready",icon:Route},
 {name:"Vehicle lookup",detail:"Built · Reference only",level:"ready",icon:BusFront},
 {name:"Identity & database",detail:"Not connected",level:"waiting",icon:ShieldCheck},
 {name:"Live GPS & ETA",detail:"Not connected",level:"waiting",icon:Radio},
 {name:"Booking & wallet",detail:"Not connected",level:"waiting",icon:Wallet},
];
const SVG_NETWORK=[
 {x:65,y:53,name:"Pickup",kind:"origin"},
 {x:178,y:84,name:"Route",kind:"route"},
 {x:308,y:33,name:"Stop",kind:"stop"},
 {x:420,y:111,name:"Destination",kind:"destination"}
];
export function ConnectionMap({compact=false,caption="Illustrative transport network · not live route geometry"}){
 return <div className={"ta2-network "+(compact?"ta2-network-compact":"")}>
   <div className="ta2-network-label"><span className="ta2-network-live"/> TRUSTARC CONNECTED JOURNEYS <small>DESIGN VISUAL</small></div>
   <svg viewBox="0 0 500 169" role="img" aria-label="Conceptual route joining a pickup, transit stop and destination; not actual GPS or travel time">
    <defs>
     <linearGradient id="ta2NetworkLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#b79ac9"/><stop offset="55%" stopColor="#73449f"/><stop offset="100%" stopColor="#d1b9dd"/></linearGradient>
     <radialGradient id="ta2NetworkGlow"><stop offset="0%" stopColor="#b993d3" stopOpacity=".38"/><stop offset="100%" stopColor="#b993d3" stopOpacity="0"/></radialGradient>
    </defs>
    <path d="M2 122 Q80 90 118 122 T245 136 T385 78 T505 42" fill="none" stroke="#dfd2e8" strokeWidth="1.1" strokeDasharray="4 9"/>
    <path d="M18 38 Q93 8 136 56 S254 156 318 95 S442 111 478 66" fill="none" stroke="url(#ta2NetworkLine)" strokeWidth="4" strokeLinecap="round"/>
    <path d="M18 38 Q93 8 136 56 S254 156 318 95 S442 111 478 66" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="5 9"/>
    <circle cx="18" cy="38" r="15" fill="url(#ta2NetworkGlow)"/>
    <circle cx="478" cy="66" r="20" fill="url(#ta2NetworkGlow)"/>
    <circle cx="18" cy="38" r="8" fill="#fff" stroke="#8653a6" strokeWidth="3"/>
    <circle cx="136" cy="56" r="5.5" fill="#c7acd6" stroke="#fff" strokeWidth="2"/>
    <circle cx="318" cy="95" r="7.5" fill="#8155a1" stroke="#fff" strokeWidth="3"/>
    <circle cx="478" cy="66" r="9" fill="#73449f" stroke="#fff" strokeWidth="3"/>
    <g fontSize="12" fontFamily="Inter,sans-serif" fill="#554360" fontWeight="600">
     <text x="18" y="65" textAnchor="middle">Pickup</text>
     <text x="136" y="30" textAnchor="middle">Route</text>
     <text x="318" y="120" textAnchor="middle">Stop</text>
     <text x="478" y="92" textAnchor="end">Destination</text>
    </g>
    <g transform="translate(216 83)"><rect width="39" height="27" rx="9" fill="#fff" stroke="#e0cbe8"/><rect x="9" y="6" width="21" height="13" rx="4" fill="#76479f"/><circle cx="13" cy="20" r="3" fill="#76479f"/><circle cx="26" cy="20" r="3" fill="#76479f"/></g>
   </svg>
   <small className="ta2-network-disclaimer">{caption}</small>
 </div>;
}
export function JourneyProgress({active=1}){
 return <div className="ta2-journey-progress">
  <div className="ta2-viz-heading"><span>THE JOURNEY FROM SEARCH TO TRANSPORT</span><small>WORKFLOW / PREVIEW</small></div>
  <div className="ta2-journey-steps">{STEPS.map((step,i)=><div className={"ta2-journey-step "+(i===active?"active":i<active?"done":"")} key={step.title}>
   <div className="ta2-journey-step-node"><step.icon size={18}/></div>
   <strong>{step.title}</strong><span>{step.detail}</span></div>)}</div>
  <p className="ta2-viz-note">This describes the intended workflow. Confirmed bookings and payments are not enabled in the preview.</p>
 </div>;
}
export function BuildPulse({onSelect}){
 const live=WORK.filter(x=>x.level==="ready").length, total=WORK.length;
 return <section className="ta2-viz-panel ta2-pulse">
  <div className="ta2-viz-heading"><span>PLATFORM DEVELOPMENT PULSE</span><small>FEATURE READINESS · NOT BUSINESS PERFORMANCE</small></div>
  <div className="ta2-pulse-layout">
   <div className="ta2-pulse-ring" aria-label={live+" of "+total+" preview modules built"}>
     <svg viewBox="0 0 150 150" role="img" aria-hidden="true">
      <circle cx="75" cy="75" r="55" stroke="#ede2ef" strokeWidth="15" fill="none"/>
      <circle cx="75" cy="75" r="55" stroke="#73449f" strokeWidth="15" fill="none" strokeLinecap="round" strokeDasharray={(2*Math.PI*55*live/total)+" "+(2*Math.PI*55)} transform="rotate(-90 75 75)"/>
     </svg>
     <div><strong>{live}<span>/{total}</span></strong><small>Preview capabilities</small></div>
   </div>
   <div className="ta2-pulse-list">{WORK.map(row=><div key={row.name} className="ta2-pulse-item">
     <span className={"ta2-pulse-icon "+row.level}><row.icon size={15}/></span>
     <div><strong>{row.name}</strong><small>{row.detail}</small></div>
     <span className={"ta2-pulse-indicator "+row.level}>{row.level==="ready"?"Preview":"Pending"}</span>
    </div>)}</div>
  </div>
  <div className="ta2-pulse-footer"><ShieldCheck size={16}/><span>Connected service status will replace development indicators after verified authentication and data integration.</span></div>
 </section>;
}
export function OperationsInfographic(){
 return <section className="ta2-viz-panel ta2-systems">
  <div className="ta2-viz-heading"><span>HOW TRUSTARC CONNECTS YOUR OPERATION</span><small>FUTURE DATA FLOW / DESIGN</small></div>
  <div className="ta2-systems-row">
   <div className="ta2-system-node"><span><Users size={22}/></span><strong>Customers</strong><small>Requests & quotes</small></div>
   <ArrowRight className="ta2-system-arrow" size={21}/>
   <div className="ta2-system-node ta2-system-central"><span><Route size={22}/></span><strong>Matching engine</strong><small>Routes, capacity & rules</small></div>
   <ArrowRight className="ta2-system-arrow" size={21}/>
   <div className="ta2-system-node"><span><BusFront size={22}/></span><strong>Vehicles</strong><small>Drivers & dispatch</small></div>
  </div>
  <div className="ta2-system-links"><span><Radio size={15}/> Cartrack / Netstar</span><span><CreditCard size={15}/> Billing & wallet</span><span><Activity size={15}/> Service events</span></div>
  <p className="ta2-viz-note">Architecture only. Matching, dispatch, telemetry and billing are not yet operational in this preview.</p>
 </section>;
}
export function TrackingReadiness(){
 return <section className="ta2-viz-panel ta2-tracking-readiness">
  <div className="ta2-viz-heading"><span>TRACKING INTEGRATION MAP</span><small>CONNECTIONS NOT YET ACTIVE</small></div>
  <div className="ta2-tracking-connections">
    <div className="ta2-source"><Radio size={20}/><strong>Cartrack</strong><span>Adapter planned</span></div>
    <div className="ta2-source"><Radio size={20}/><strong>Netstar</strong><span>Adapter planned</span></div>
    <div className="ta2-source"><BusFront size={20}/><strong>Partners</strong><span>Expandable source</span></div>
  </div>
  <div className="ta2-tracking-bridge"><span/><span/><span/></div>
  <div className="ta2-tracking-hub"><LocateFixed size={22}/><div><strong>TrustArc vehicle position engine</strong><small>Normalised coordinates · source timestamp · GPS health · trip permissions</small></div></div>
  <div className="ta2-tracking-final"><Navigation size={16}/> ETA to your approved pickup pin</div>
  <p className="ta2-viz-note">No live GPS positions are currently displayed; this is the planned data path.</p>
 </section>;
}
