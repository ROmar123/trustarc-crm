import {CheckCircle2, CircleDashed, ClipboardCheck, Compass, CreditCard, Database, Info, LocateFixed, Radio, ShieldCheck, Smartphone, UserRound, Wallet, BusFront, ArrowLeft, Ticket, Mail, Route} from "lucide-react";
import "./FeatureStatus.css";
const FEATURES=[
 {name:"Branded app & bottom navigation",icon:Smartphone,state:"preview",detail:"Works: role-specific navigation and responsive app interface. Roles are only visual previews."},
 {name:"Searchable pickup & destination",icon:LocateFixed,state:"preview",detail:"Works when the configured Mapbox service responds; selectable coordinates feed exact journey drafts."},
 {name:"Exact journey quote",icon:Ticket,state:"preview",detail:"Works: date, time, passengers, return leg and contact validation; email or copy handoff. Not an in-app submission."},
 {name:"Suggested services",icon:Compass,state:"preview",detail:"Shows illustrative transport listings, not verified route-to-pin matching, live prices or seat availability."},
 {name:"Vehicle make/model search",icon:BusFront,state:"preview",detail:"Works: SA local suggestions and manual entry; the free NHTSA lookup depends on external service availability."},
 {name:"People, fleet & route drafts",icon:UserRound,state:"preview",detail:"Local demo workflows only; drafts disappear on reload and do not create verified records."},
 {name:"Customer and driver login",icon:ShieldCheck,state:"pending",detail:"Real authentication, document approval, identity and database-level role access still require S1."},
 {name:"Live Cartrack / Netstar",icon:Radio,state:"pending",detail:"No real device data, vehicle map or customer ETA connected."},
 {name:"Book, pay and subscribe",icon:CreditCard,state:"pending",detail:"No seat confirmation, payment processing or automatic subscription billing."},
 {name:"Stored wallet balances",icon:Wallet,state:"pending",detail:"No stored-value wallet or credited balance. Payments and wallet compliance require later implementation."},
];
export default function FeatureStatus({onBack}){
 const ready=FEATURES.filter(f=>f.state==="preview");
 const waiting=FEATURES.filter(f=>f.state==="pending");
 return <div className="ta2-feature-status">
  <button className="ta2-quote-back" onClick={onBack}><ArrowLeft size={17}/> Back</button>
  <div className="ta2-heading"><div><p className="ta2-eyebrow">TRUSTARC 2.0 · BUILD STATUS</p><h2>What works right now?</h2><p>A clear, testable view of working previews versus real infrastructure still waiting to be connected.</p></div></div>
  <div className="ta2-status-summary"><div><span className="ta2-status-circle"><CheckCircle2 size={22}/></span><strong>{ready.length}</strong><small>Interactive preview experiences</small></div><div><span className="ta2-status-circle pending"><CircleDashed size={22}/></span><strong>{waiting.length}</strong><small>Live integrations to complete</small></div></div>
  <div className="ta2-status-section"><h3><CheckCircle2 size={19}/> Usable in the preview</h3><div className="ta2-status-rows">{ready.map(f=><div key={f.name} className="ta2-status-row"><f.icon size={19}/><div><strong>{f.name}</strong><p>{f.detail}</p></div><span className="ta2-status-chip">Preview</span></div>)}</div></div>
  <div className="ta2-status-section"><h3><CircleDashed size={19}/> Not live yet</h3><div className="ta2-status-rows">{waiting.map(f=><div key={f.name} className="ta2-status-row"><f.icon size={19}/><div><strong>{f.name}</strong><p>{f.detail}</p></div><span className="ta2-status-chip pending">Pending</span></div>)}</div></div>
  <div className="ta2-privacy-note"><ShieldCheck size={18}/> Preview role switching is not an authentication control. Don't enter real passenger, driver or payment data until secure access and storage are connected and tested.</div>
  <div className="ta2-next-release"><span>THE NEXT PRODUCTION FOUNDATION</span><h3>S1 · Verified identities and protected database access</h3><p>Authentication, organisation/role authorisation, database contracts, row-level access policies and real quote submission into a controlled operations review queue.</p></div>
 </div>;
}
