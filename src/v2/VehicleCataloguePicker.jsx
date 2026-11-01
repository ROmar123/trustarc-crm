import {useEffect,useMemo,useState} from "react";
import {CarFront,Search,ShieldCheck,Info} from "lucide-react";
import {COMMON_SA_MAKES,combineModels} from "./vehicleCatalog.js";

export default function VehicleCataloguePicker({onChange}){
 const [make,setMake]=useState("");
 const [model,setModel]=useState("");
 const [year,setYear]=useState(String(new Date().getFullYear()));
 const [seats,setSeats]=useState("8");
 const [provider,setProvider]=useState("not_selected");
 const [remote,setRemote]=useState([]);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState("");
 const [otherMake,setOtherMake]=useState("");
 const actualMake=make==="Other"?otherMake.trim():make;
 useEffect(()=>{
  setRemote([]);setMessage("");setLoading(false);
  if(!actualMake||actualMake.length<2)return;
  const controller=new AbortController();
  const id=setTimeout(async()=>{
    setLoading(true);
    try{
      const response=await fetch("/api/vehicle-models?make="+encodeURIComponent(actualMake),{signal:controller.signal});
      if(!response.ok)throw new Error("API unavailable");
      const body=await response.json();
      setRemote(Array.isArray(body.models)?body.models:[]);
    }catch{if(!controller.signal.aborted)setMessage("Local suggestions only; you can enter any model manually.")}
    finally{if(!controller.signal.aborted)setLoading(false)}
  },250);
  return()=>{controller.abort();clearTimeout(id)};
 },[actualMake]);
 const models=useMemo(()=>combineModels(actualMake,remote),[actualMake,remote]);
 useEffect(()=>{onChange?.({make:actualMake,model:model.trim(),year:Number(year),seats:Number(seats),provider});},[actualMake,model,year,seats,provider,onChange]);
 return <div className="ta2-vehicle-lookup">
  <div className="ta2-vehicle-lookup-head"><CarFront size={19}/><div><strong>Vehicle search</strong><span>Make and model suggestions, plus manual entry for local vehicles</span></div></div>
  <div className="ta2-quote-fields">
   <label>Manufacturer <div className="ta2-field-with-icon"><Search size={17}/><select value={make} onChange={e=>{setMake(e.target.value);setModel("")}}><option value="">Choose make</option>{COMMON_SA_MAKES.map(m=><option key={m} value={m}>{m}</option>)}</select></div></label>
   {make==="Other"&&<label>Other manufacturer <input value={otherMake} maxLength={40} onChange={e=>{setOtherMake(e.target.value);setModel("")}} placeholder="Enter make"/></label>}
   <label>Model <input list="ta2-vehicle-models" value={model} maxLength={80} onChange={e=>setModel(e.target.value)} placeholder={make?"Choose or type model":"Select a make first"} disabled={!actualMake}/><datalist id="ta2-vehicle-models">{models.map(m=><option key={m} value={m}/>)}</datalist></label>
   <label>Model year <input type="number" min="1980" max={new Date().getFullYear()+1} value={year} onChange={e=>setYear(e.target.value)}/></label>
   <label>Passenger seats (excluding driver) <input type="number" min="1" max="80" value={seats} onChange={e=>setSeats(e.target.value)}/></label>
   <label>GPS provider <select value={provider} onChange={e=>setProvider(e.target.value)}><option value="not_selected">Select later</option><option value="cartrack">Cartrack</option><option value="netstar">Netstar</option><option value="partner">Another provider</option><option value="driver_device">Driver phone (temporary)</option></select></label>
  </div>
  {loading&&<p className="ta2-quote-help" role="status">Checking free vehicle reference catalogue…</p>}
  {message&&<p className="ta2-quote-help">{message}</p>}
  <p className="ta2-quote-help"><ShieldCheck size={16}/> Suggestions are for data entry, not proof of a registered vehicle or legal seating capacity. TrustArc must validate registration, configuration, insurance and operating eligibility before approval. Free reference: NHTSA vPIC (US-focused) with South African local overrides.</p>
 </div>;
}
