import {useState} from "react";
import {ArrowRight, Check, ClipboardCheck, FileCheck2, Plus, ShieldCheck, UserRound, Users, BusFront, Search, X} from "lucide-react";

const TYPES=[
  {id:"customer",name:"Customer",icon:UserRound,description:"Create an intake record, select a route and then verify their subscription and billing."},
  {id:"driver",name:"Driver",icon:Users,description:"Start driver onboarding, verify PDP/licence, and approve before assignments."},
  {id:"fleet",name:"Fleet owner",icon:BusFront,description:"Register an operator, verify vehicle documents and confirm their commercial agreement."}
];
const STAGES=["Intake received","Identity & documents","TrustArc review","Account approved","Service assigned"];
export default function PeopleOnboarding(){
  const [type,setType]=useState("customer");
  const [add,setAdd]=useState(false);
  const [search,setSearch]=useState("");
  const [drafts,setDrafts]=useState([]);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [notes,setNotes]=useState("");
  const visible=drafts.filter(d=>(d.name+" "+d.type).toLowerCase().includes(search.toLowerCase()));
  function submit(e){
    e.preventDefault();
    if(name.trim().length<2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || !/^(0[1-9]\d{8}|\+27[1-9]\d{8})$/.test(phone.replace(/\s|-/g,""))) return;
    setDrafts(ds=>[{id:Date.now(),name:name.trim(),type:TYPES.find(t=>t.id===type)?.name||type,stage:"Local draft · Not saved"},...ds]);
    setName("");setEmail("");setPhone("");setNotes("");setAdd(false);
    // Never persist PII to localStorage, browser caches, URL parameters or telemetry.
  }
  return <div className="ta2-people">
    <div className="ta2-heading"><div><p className="ta2-eyebrow">OPERATIONS / PEOPLE</p><h2>People & onboarding</h2><p>Add customers, register drivers and onboard fleet owners through one controlled workflow.</p></div><button className="ta2-btn" onClick={()=>setAdd(x=>!x)}>{add?<X size={16}/>:<Plus size={16}/>} {add?"Close":"Add person"}</button></div>
    <div className="ta2-privacy-note"><ShieldCheck size={19}/><span>This preview does not create real accounts or save customer details. Use sample data only. For actual submissions, open the secure TrustArc management portal.</span></div>
    <div className="ta2-onboarding-grid">{TYPES.map(t=><button key={t.id} className={"ta2-onboard-type "+(type===t.id?"chosen":"")} onClick={()=>{setType(t.id);setAdd(true)}}><t.icon size={23}/><strong>Add {t.name.toLowerCase()}</strong><small>{t.description}</small><ArrowRight size={16}/></button>)}</div>
    {add&&<section className="ta2-panel ta2-onboard-form"><div className="ta2-sheet-head"><div><p className="ta2-eyebrow">NEW INTAKE / PREVIEW</p><h3>Add {TYPES.find(t=>t.id===type)?.name}</h3></div><button onClick={()=>setAdd(false)} aria-label="Close form"><X size={18}/></button></div>
      <form onSubmit={submit} className="ta2-draft-form">
        <label>Full name <input required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Example Person"/></label>
        <label>Email <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="sample@example.com"/></label>
        <label>South African mobile number <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="082 000 0000"/></label>
        <label className="ta2-onboard-notes">Service notes <input maxLength={180} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Example: route or operating requirements"/></label>
        <button type="submit" className="ta2-btn">Add preview draft <Check size={16}/></button>
      </form>
      <p className="ta2-disclaimer">Real creation must require a verified staff account, duplicate checking, required documents, TrustArc approval and secure storage.</p>
    </section>}
    <div className="ta2-heading"><div><p className="ta2-eyebrow">ONBOARDING PIPELINE</p><h2>From intake to service</h2><p>Every account follows the same controlled milestones, with role-specific checks.</p></div></div>
    <div className="ta2-stages">{STAGES.map((s,i)=><div key={s} className="ta2-stage"><span>{String(i+1).padStart(2,"0")}</span><strong>{s}</strong></div>)}</div>
    <div className="ta2-heading"><div><h2>People registry</h2><p>Live records will appear after secure backend integration.</p></div></div>
    <div className="ta2-searchbar"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search preview drafts" aria-label="Search local drafts"/></div>
    {visible.length?visible.map(d=><div key={d.id} className="ta2-panel ta2-person-row"><div className="ta2-account-avatar"><UserRound size={20}/></div><div><strong>{d.name}</strong><small>{d.type} · {d.stage}</small></div><button onClick={()=>setDrafts(x=>x.filter(y=>y.id!==d.id))} aria-label={"Discard draft for "+d.name}><X size={17}/></button></div>):<div className="ta2-panel ta2-empty"><ClipboardCheck size={25}/><h3>No active accounts connected</h3><p>Use Add person to explore the workflow. Existing real applications remain in the secure website admin portal.</p></div>}
    <div className="ta2-inline-cta ta2-panel"><div><h3>Manage real submissions</h3><p>Use the authenticated TrustArc admin area for incoming customer enquiries, driver applications and fleet-owner registrations.</p></div><a className="ta2-btn" href="https://www.trustarc.co.za/admin" target="_blank" rel="noopener noreferrer">Open admin portal <ArrowRight size={16}/></a></div>
  </div>;
}
