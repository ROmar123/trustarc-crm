import assert from "node:assert/strict";
import test from "node:test";
import {validateQuote,quoteSummary} from "./quoteRules.js";
const origin={address:"Lansdowne, Cape Town",lat:-33.993,lng:18.496,verified:true};
const destination={address:"Cape Town CBD",lat:-33.924,lng:18.423,verified:true};
const request=()=>({origin,destination,frequency:"once",passengers:1,startDate:"2026-11-05",pickupTime:"07:30",returnTrip:false,days:[],contactType:"email",contact:"test@example.com",acknowledge:true});
test("valid exact request passes validation",()=>assert.deepEqual(validateQuote(request()),[]));
test("unverified and identical pins are refused",()=>{
 assert.match(validateQuote({...request(),origin:{...origin,verified:false}}).join(" "),"verified pickup");
 assert.match(validateQuote({...request(),destination:origin}).join(" "),"different");
});
test("recurring requests require days and return legs need timing",()=>{
 assert.match(validateQuote({...request(),frequency:"recurring"}).join(" "),"recurring travel day");
 assert.match(validateQuote({...request(),returnTrip:true}).join(" "),"return pickup");
});
test("customer can give just one contact method",()=>{
 assert.deepEqual(validateQuote({...request(),contactType:"phone",contact:"082 123 4567"}),[]);
 assert.match(validateQuote({...request(),contact:"not-an-email"}).join(" "),"valid email");
});
test("summary preserves exact chosen request and does not claim submission",()=>{
 const s=quoteSummary(request());
 assert.ok(s.includes(origin.address)&&s.includes(destination.address));
 assert.ok(s.includes("NOT submitted"));
});
