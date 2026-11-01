/**
 * Public make/model reference proxy. This endpoint never receives licence plates,
 * VINs, account identifiers, driver names or other customer information.
 * vPIC is US-centric, and its data are suggestions only.
 */
const CACHE_SECONDS=60*60*24;
export default async function handler(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed"});}
  const make=typeof req.query.make==="string"?req.query.make.trim():"";
  if(!/^[a-zA-Z0-9 -]{2,40}$/.test(make))return res.status(400).json({error:"Invalid make"});
  res.setHeader("Cache-Control","public, max-age="+CACHE_SECONDS+", s-maxage="+CACHE_SECONDS);
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),4800);
    let response;
    try{response=await fetch("https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/"+encodeURIComponent(make)+"?format=json",{signal:controller.signal,headers:{"Accept":"application/json"}})}
    finally{clearTimeout(timeout)}
    if(!response.ok)throw new Error("Catalogue request failed");
    const data=await response.json();
    const models=[...new Set((Array.isArray(data.Results)?data.Results:[])
      .map(x=>typeof x.Model_Name==="string"?x.Model_Name.trim():"")
      .filter(x=>x.length>1 && x.length<=80))].slice(0,250).sort((a,b)=>a.localeCompare(b));
    return res.status(200).json({make,models,reference:"NHTSA vPIC; US-referenced models, not verified South African specifications"});
  }catch{
    return res.status(503).json({make,models:[],error:"Remote catalogue unavailable; use local suggestions or enter model manually"});
  }
}
