export const EMPTY_PIN = Object.freeze({address:"",lat:null,lng:null,verified:false});
export const DAYS = Object.freeze(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]);
export const QUOTE_MODES = Object.freeze(["once","recurring","flexible"]);
export function validPin(pin){
  return Boolean(pin && pin.verified===true && typeof pin.address==="string" && pin.address.trim().length>=3
    && typeof pin.lat==="number" && Number.isFinite(pin.lat) && pin.lat>=-90 && pin.lat<=90
    && typeof pin.lng==="number" && Number.isFinite(pin.lng) && pin.lng>=-180 && pin.lng<=180);
}
export function validateQuote(q){
  const errors=[];
  if(!validPin(q?.origin))errors.push("Select a verified pickup location.");
  if(!validPin(q?.destination))errors.push("Select a verified destination.");
  if(validPin(q?.origin)&&validPin(q?.destination) && Math.abs(q.origin.lat-q.destination.lat)<.00001 && Math.abs(q.origin.lng-q.destination.lng)<.00001)errors.push("Pickup and destination must be different.");
  if(!QUOTE_MODES.includes(q?.frequency))errors.push("Choose how often you need transport.");
  if(!Number.isInteger(q?.passengers)||q.passengers<1||q.passengers>80)errors.push("Enter a passenger count between 1 and 80.");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(q?.startDate||"") || Number.isNaN(Date.parse(q.startDate+"T12:00:00Z")))errors.push("Choose the first required travel date.");
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(q?.pickupTime||""))errors.push("Choose your preferred pickup time.");
  if(q?.frequency==="recurring" && !(Array.isArray(q.days)&&q.days.some(d=>DAYS.includes(d))))errors.push("Choose at least one recurring travel day.");
  if(q?.returnTrip && !/^([01]\d|2[0-3]):[0-5]\d$/.test(q?.returnTime||""))errors.push("Choose the return pickup time.");
  const contact=(q?.contact||"").trim();
  if(!["email","phone"].includes(q?.contactType))errors.push("Choose your preferred contact method.");
  if(q?.contactType==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))errors.push("Enter a valid email for the quote reply.");
  if(q?.contactType==="phone"&&!/^(0[1-9]\d{8}|\+27[1-9]\d{8})$/.test(contact.replace(/[\s()-]/g,"")))errors.push("Enter a valid South African mobile number.");
  if(q?.acknowledge!==true)errors.push("Confirm that you understand this is a quotation enquiry.");
  return errors;
}
export function quoteSummary(q){
  const lines=[
    "TrustArc — EXACT JOURNEY QUOTE REQUEST",
    "Status: Prepared by requester; NOT submitted or confirmed",
    "Pickup: "+(q.origin?.address||""),
    "Destination: "+(q.destination?.address||""),
    "Journey type: "+q.frequency,
    "First travel date: "+(q.startDate||""),
    "Preferred pickup: "+(q.pickupTime||""),
    "Passengers: "+q.passengers,
    "Return trip: "+(q.returnTrip? "Yes, preferred pickup "+q.returnTime : "No"),
    ...(q.frequency==="recurring"?["Recurring days: "+(q.days||[]).join(", ")]:[]),
    "Notes: "+(q.notes?.trim()||"None"),
    "Reply via "+q.contactType+": "+(q.contact||""),
    "Quotation pending route, capacity and commercial review."
  ];
  return lines.join("\n");
}
