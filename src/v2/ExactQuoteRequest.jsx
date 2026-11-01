import {useMemo,useState} from "react";
import {ArrowLeft, ArrowRight, CalendarDays, Check, Clipboard, Mail, MapPin, Navigation, ShieldCheck, Users, Clock3, Info} from "lucide-react";
import AppAddressSearch from "./AppAddressSearch.jsx";
import {DAYS,validateQuote,quoteSummary} from "./quoteRules.js";

const today=new Date().toLocaleDateString("en-CA");
export default function ExactQuoteRequest({initialRequest,onBack}){
  const [origin,setOrigin]=useState(initialRequest?.origin||{address:"",lat:null,lng:null,verified:false});
  const [destination,setDestination]=useState(initialRequest?.destination||{address:"",lat:null,lng:null,verified:false});
  const [frequency,setFrequency]=useState(initialRequest?.frequency||"once");
  const [startDate,setStartDate]=useState("");
  const [pickupTime,setPickupTime]=useState("");
  const [passengers,setPassengers]=useState(1);
  const [returnTrip,setReturnTrip]=useState(false);
  const [returnTime,setReturnTime]=useState("");
  const [days,setDays]=useState(["Mon","Tue","Wed","Thu","Fri"]);
  const [notes,setNotes]=useState("");
  const [contactType,setContactType]=useState("email");
  const [contact,setContact]=useState("");
  const [acknowledge,setAcknowledge]=useState(false);
  const [prepared,setPrepared]=useState(false);
  const [error,setError]=useState([]);
  const [copied,setCopied]=useState(false);
  const record=useMemo(()=>({origin,destination,frequency,startDate,pickupTime,passengers:Number(passengers),returnTrip,returnTime,days,notes,contactType,contact,acknowledge}),[origin,destination,frequency,startDate,pickupTime,passengers,returnTrip,returnTime,days,notes,contactType,contact,acknowledge]);
  const summary=quoteSummary(record);
  const update=fn=>v=>{fn(v);setPrepared(false);setError([])};
  function prepare(e){e.preventDefault();const problems=validateQuote(record);if(startDate && startDate<today)problems.push("The first travel date must not be in the past.");if(problems.length){setError(problems);setPrepared(false);return}setError([]);setPrepared(true);document.getElementById("ta2-quote-outcome")?.scrollIntoView({behavior:"smooth",block:"nearest"});}
  async function copy(){try{await navigator.clipboard.writeText(summary);setCopied(true)}catch{setCopied(false);setError(["Copy is unavailable in this browser. Select the request text below and copy it manually."])}}
  function email(){const subject=encodeURIComponent("TrustArc quote request: "+origin.address+" to "+destination.address);const body=encodeURIComponent(summary);window.location.href="mailto:admin@trustarc.co.za?subject="+subject+"&body="+body;}
  return <div className="ta2-exact-quote">
    <button className="ta2-quote-back" type="button" onClick={onBack}><ArrowLeft size={18}/> Back to search results</button>
    <div className="ta2-heading"><div><p className="ta2-eyebrow">YOUR EXACT JOURNEY</p><h2>Request a tailored quote.</h2><p>Your original journey stays intact. Suggested routes are alternatives, not a replacement for what you searched for.</p></div></div>
    <section className="ta2-quote-explainer"><div><MapPin size={21}/><strong>Exact pickup and destination</strong><span>Never replaced by an approximate route</span></div><div><CalendarDays size={21}/><strong>Your travel schedule</strong><span>Dates, times, passengers and return leg</span></div><div><ShieldCheck size={21}/><strong>Commercial review</strong><span>No invented fares or seat guarantees</span></div></section>
    <form className="ta2-panel ta2-quote-form" onSubmit={prepare}>
      <h3>1. Journey locations</h3>
      <div className="ta2-quote-two"><AppAddressSearch label="Exact pickup address" icon={MapPin} placeholder="Find pickup address" value={origin} onChange={update(setOrigin)} required/><AppAddressSearch label="Exact destination" icon={Navigation} placeholder="Find destination" value={destination} onChange={update(setDestination)} required/></div>
      <p className="ta2-quote-help">Both points must be selected from search suggestions. Coordinates are used only for this draft until an authorised request is sent.</p>
      <h3>2. Transport needed</h3>
      <div className="ta2-frequency ta2-quote-frequency">{[["once","Once-off"],["recurring","Regular commute"],["flexible","Flexible"]].map(([v,label])=><button type="button" key={v} className={frequency===v?"chosen":""} onClick={()=>{setFrequency(v);setPrepared(false)}}>{label}</button>)}</div>
      <div className="ta2-quote-fields">
        <label>First travel date <input type="date" min={today} value={startDate} onChange={e=>update(setStartDate)(e.target.value)} required/></label>
        <label>Preferred pickup time <input type="time" value={pickupTime} onChange={e=>update(setPickupTime)(e.target.value)} required/></label>
        <label>Passengers <input type="number" min="1" max="80" value={passengers} onChange={e=>update(setPassengers)(Number(e.target.value))} required/></label>
        <label className="ta2-quote-check"><input type="checkbox" checked={returnTrip} onChange={e=>update(setReturnTrip)(e.target.checked)}/> Return journey required</label>
        {returnTrip&&<label>Return pickup time <input type="time" value={returnTime} onChange={e=>update(setReturnTime)(e.target.value)} required/></label>}
      </div>
      {frequency==="recurring"&&<div className="ta2-quote-days"><span>Which days will you travel?</span><div>{DAYS.map(d=><button type="button" className={days.includes(d)?"chosen":""} onClick={()=>{setDays(s=>s.includes(d)?s.filter(x=>x!==d):[...s,d]);setPrepared(false)}} key={d}>{d}</button>)}</div></div>}
      <label className="ta2-quote-notes">Important journey details <textarea maxLength={350} rows={3} value={notes} onChange={e=>update(setNotes)(e.target.value)} placeholder="Optional: luggage, shift time, accessibility arrangements or intermediate pickup needs. Avoid sensitive personal information."/></label>
      <h3>3. How should TrustArc reply?</h3>
      <div className="ta2-quote-contact"><label>Contact method<select value={contactType} onChange={e=>{setContactType(e.target.value);setContact("");setPrepared(false)}}><option value="email">Email</option><option value="phone">Phone / WhatsApp</option></select></label><label>{contactType==="email"?"Email address":"South African mobile number"}<input type={contactType==="email"?"email":"tel"} autoComplete={contactType==="email"?"email":"tel"} value={contact} onChange={e=>update(setContact)(e.target.value)} placeholder={contactType==="email"?"you@example.com":"082 000 0000"} required/></label></div>
      <label className="ta2-quote-confirm"><input type="checkbox" checked={acknowledge} onChange={e=>update(setAcknowledge)(e.target.checked)}/><span>I understand this prepares an enquiry for quotation. Pricing, route suitability and availability must be reviewed. No journey is booked or payment taken.</span></label>
      {error.length>0&&<div className="ta2-quote-errors" role="alert">{error.map((x,i)=><p key={i}>{x}</p>)}</div>}
      <button type="submit" className="ta2-btn ta2-quote-prepare">Prepare my exact quote request <ArrowRight size={17}/></button>
    </form>
    {prepared&&<section id="ta2-quote-outcome" className="ta2-panel ta2-quote-outcome">
      <div className="ta2-quote-outcome-title"><Check size={23}/><div><h3>Exact journey request prepared</h3><p>Not sent or priced yet. Choose how to send it to TrustArc.</p></div></div>
      <textarea aria-label="Prepared quote request" readOnly rows={13} value={summary} />
      <div className="ta2-quote-actions"><button type="button" className="ta2-btn" onClick={email}><Mail size={17}/> Open email to TrustArc</button><button type="button" className="ta2-btn ta2-btn-outline" onClick={copy}><Clipboard size={17}/>{copied?"Copied":"Copy request"}</button></div>
      <p className="ta2-quote-help"><Info size={14}/> The email button opens a draft in your email app. It does not send automatically or store a request in TrustArc. You must press Send. This is an interim handoff until secure customer authentication and quote storage are connected.</p>
    </section>}
  </div>;
}
