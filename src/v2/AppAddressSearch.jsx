import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Loader2, MapPin, Search, XCircle } from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const safeCoordinates = c => Array.isArray(c) && c.length >= 2 && c.every((v,i)=>i>1||Number.isFinite(v))
  && c[0]>=-180 && c[0]<=180 && c[1]>=-90 && c[1]<=90;

/**
 * Geocoded address control. Do NOT accept free text as a validated trip location.
 * All Mapbox requests are aborted on edit/unmount and never persist to browser storage.
 */
export default function AppAddressSearch({
  label, placeholder="Search a street, place or landmark", value, onChange,
  icon: Icon=MapPin, required=false, allowManual=false, id
}) {
  const inputId = useId();
  const listId = useId();
  const wrap = useRef(null);
  const timer = useRef(null);
  const controller = useRef(null);
  const requestId = useRef(0);
  const [results,setResults] = useState([]);
  const [loading,setLoading] = useState(false);
  const [open,setOpen] = useState(false);
  const [active,setActive] = useState(-1);
  const [queried,setQueried] = useState(false);
  const [error,setError] = useState("");
  const val=value?.address||"";
  useEffect(()=>{
    function outside(ev){if(wrap.current && !wrap.current.contains(ev.target))setOpen(false)}
    document.addEventListener("pointerdown",outside);
    return()=>{document.removeEventListener("pointerdown",outside);clearTimeout(timer.current);controller.current?.abort()};
  },[]);
  async function search(term){
    controller.current?.abort();
    const seq=++requestId.current;
    if(!MAPBOX_TOKEN||term.trim().length<2)return;
    const ctl=new AbortController();controller.current=ctl;
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams({access_token:MAPBOX_TOKEN,country:"za",proximity:"18.4241,-33.9249",types:"address,poi,place,locality,neighborhood",limit:"6",language:"en",autocomplete:"true"});
      const res=await fetch("https://api.mapbox.com/geocoding/v5/mapbox.places/"+encodeURIComponent(term.trim())+".json?"+params,{signal:ctl.signal});
      if(!res.ok)throw Error("Location suggestions temporarily unavailable");
      const json=await res.json();
      if(seq!==requestId.current)return;
      const available=(json.features||[]).filter(x=>x?.place_name && safeCoordinates(x.geometry?.coordinates));
      setResults(available);setOpen(true);setQueried(true);setActive(-1);
    }catch(e){
      if(ctl.signal.aborted||seq!==requestId.current)return;
      setResults([]);setOpen(true);setQueried(true);setError("Map search is unavailable. Try again.");
    }finally{if(seq===requestId.current)setLoading(false)}
  }
  function update(text){
    clearTimeout(timer.current);controller.current?.abort();requestId.current++;
    onChange({address:text,lat:null,lng:null,verified:false});
    setResults([]);setQueried(false);setError("");setActive(-1);setLoading(false);
    setOpen(Boolean(MAPBOX_TOKEN && text.trim().length>=2));
    if(MAPBOX_TOKEN&&text.trim().length>=2)timer.current=setTimeout(()=>search(text),300);
  }
  function pick(x){
    const [lng,lat]=x.geometry.coordinates;
    clearTimeout(timer.current);controller.current?.abort();requestId.current++;
    onChange({address:x.place_name,lat,lng,verified:true,placeId:x.id||null});
    setResults([]);setOpen(false);setLoading(false);setActive(-1);setError("");
  }
  function keyDown(e){
    if(e.key==="Escape"){setOpen(false);return}
    if(!open||!results.length)return;
    if(e.key==="ArrowDown"){e.preventDefault();setActive(i=>(i+1)%results.length)}
    if(e.key==="ArrowUp"){e.preventDefault();setActive(i=>(i<=0?results.length-1:i-1))}
    if(e.key==="Enter"&&active>=0){e.preventDefault();pick(results[active])}
  }
  return <div ref={wrap} className="ta2-address" id={id}>
    {label&&<label className="ta2-address-label" htmlFor={inputId}>{label}{required?" *":""}</label>}
    <div className={"ta2-address-control "+(value?.verified?"is-verified":"")}>
      <Icon size={19} aria-hidden="true"/>
      <input id={inputId} type="search" value={val} placeholder={placeholder} onChange={e=>update(e.target.value)} onFocus={()=>{if(results.length)setOpen(true)}} onKeyDown={keyDown}
        role="combobox" aria-autocomplete="list" aria-expanded={open&&results.length>0} aria-controls={listId} aria-activedescendant={active>=0&&open?listId+"-item-"+active:undefined} autoComplete="off"/>
      {loading?<Loader2 className="ta2-address-spin" size={17}/>:value?.verified?<MapPin size={17} color="#34745b"/>:<Search size={17}/>}
    </div>
    {open&&MAPBOX_TOKEN&&<div id={listId} className="ta2-address-results" role="listbox" aria-label={(label||"Address")+" suggestions"}>
      {results.map((item,i)=><button type="button" key={item.id||i} role="option" aria-selected={i===active} id={listId+"-item-"+i} className={active===i?"selected":""} onMouseEnter={()=>setActive(i)} onClick={()=>pick(item)}>
        <MapPin size={17}/><span>{item.place_name}</span></button>)}
      {loading&&<p role="status">Finding locations…</p>}
      {!loading&&queried&&!results.length&&<p role="status">{error||"No matching location. Try another street, suburb or landmark."}</p>}
      <small>Location suggestions powered by Mapbox</small>
    </div>}
    {value?.verified&&<div className="ta2-address-selected"><MapPin size={13}/> Pin selected · <a target="_blank" rel="noopener noreferrer" href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(value.lat+","+value.lng)}>View on map <ArrowUpRight size={12}/></a></div>}
    {!MAPBOX_TOKEN&&val.trim().length>=2&&<p className="ta2-address-warning">Map search is not configured on this environment. Please use the public TrustArc website until search is enabled here.</p>}
    {!allowManual&&val.trim().length>=2&&!value?.verified&&MAPBOX_TOKEN&&!open&&<p className="ta2-address-warning">Select a suggested location to confirm the map pin.</p>}
  </div>;
}
