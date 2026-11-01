// This catalogue offers typing assistance, not proof of local registration or seat capacity.
// NHTSA vPIC is US-referenced; maintain local/manual overrides for South African fleet models.
export const COMMON_SA_MAKES=["Toyota","Volkswagen","Suzuki","Renault","Hyundai","Nissan","Mercedes-Benz","Ford","Kia","Iveco","Foton","Isuzu","Peugeot","Fiat","Mitsubishi","Mahindra","JAC","GWM","BAIC","Other"];
export const LOCAL_MODELS=Object.freeze({
  Renault:["Triber","Kwid","Kiger","Duster","Kangoo","Master","Trafic"],
  Suzuki:["Ertiga","XL6","APV","Celerio","Swift","Dzire","Jimny"],
  Volkswagen:["Kombi","Transporter","Caravelle","Crafter","Caddy","T-Cross","Polo"],
  Toyota:["Quantum","Hiace","Coaster","Avanza","Rumion","Innova","Corolla Cross","Hilux"],
  Hyundai:["H-1","Staria","Staria Load","Grand i10","Creta"],
  Nissan:["NV350","Urvan","Navara","Magnite"],
  "Mercedes-Benz":["Sprinter","Vito","V-Class","Citan"],
  Ford:["Tourneo","Transit","Everest","Ranger"],
  Iveco:["Daily"],
  Foton:["View","Toano"],
  Mahindra:["Bolero","Scorpio"],
});
export function combineModels(make,remote=[]){
  const unique=new Map();
  for(const m of [...(LOCAL_MODELS[make]||[]),...remote]){
    if(typeof m!=="string")continue;
    const v=m.trim();
    if(v.length<2||v.length>80)continue;
    unique.set(v.toLowerCase(),v);
  }
  return [...unique.values()].sort((a,b)=>a.localeCompare(b));
}
