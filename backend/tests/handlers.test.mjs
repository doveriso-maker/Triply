import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './handler-harness.mjs';

const lead={id:'fixture-lead',latest_conversation_id:'fixture-conversation',customer_phone:'+15555550100',status:'collecting',app_interest:false,profile:{language:'ar'},payment_status:'not_started',followup_status:'scheduled',followup_due_at:'2026-01-01T00:00:00Z',followup_attempts:0,last_synced_at:'2026-01-01T00:00:00Z'};
const payload={customer_phone:lead.customer_phone,conversation_id:'fixture-chat',transcript:[{role:'user',content:'مرحبا'}],extracted_variables:{language:'ar'}};

test('intake: display name cannot populate a verified customer profile',async()=>{
 const h=harness('triply-whatsapp-intake');await h.run({...payload,customer_name:'Unverified Display Name'});
 assert.equal(h.state.tables.triply_whatsapp_leads[0].profile.customer_name,undefined);
});
test('intake: repeated generic CTA preserves known Arabic over inferred Hebrew',async()=>{
 const h=harness('triply-whatsapp-intake',lead);await h.run({...payload,transcript:[{role:'user',content:'Learn more'}],extracted_variables:{language:'he'}});
 assert.equal(h.state.tables.triply_whatsapp_leads[0].profile.language,'ar');
});
test('intake: verified payment remains verified and no link without dates',async()=>{
 const h=harness('triply-whatsapp-intake',{...lead,status:'converted',payment_status:'verified'});
 const r=await h.run({...payload,extracted_variables:{app_interest:true,payment_claimed:false,trip_days:5,destination:'Rome'}});
 assert.equal(r.status,200);assert.equal(r.body.payment_status,'verified');assert.equal(r.body.payment_ready,false);assert.equal(h.state.tables.triply_whatsapp_leads[0].payment_link,null);
});
test('intake: replayed customer messages do not advance the inactivity timestamp',async()=>{
 const h=harness('triply-whatsapp-intake');await h.run(payload);const first=h.state.tables.triply_whatsapp_leads[0].last_synced_at;
 await h.run({...payload,transcript:[...payload.transcript,{role:'assistant',content:'متابعة'}]});
 assert.equal(h.state.tables.triply_whatsapp_leads[0].last_synced_at,first);
});
test('dispatcher: human handoff appearing after claim prevents network send',async()=>{
 const h=harness('triply-whatsapp-followup-dispatch',lead,{afterQuery({table,action,patch,state}){if(table==='triply_whatsapp_leads'&&action==='update'&&patch.followup_status==='sending')state.tables[table][0].profile.human_handoff=true;}});
 const r=await h.run();assert.equal(r.body.sent,0);assert.equal(h.state.requests.length,0);
});
test('dispatcher: Arabic unpaid lead receives generic Arabic rather than premature questionnaire',async()=>{
 const h=harness('triply-whatsapp-followup-dispatch',{...lead,app_interest:true});const r=await h.run();
 assert.equal(r.body.sent,1);assert.match(h.state.requests[0].message,/مرحبًا/);assert.doesNotMatch(h.state.requests[0].message,/PayBox|היי/);
});
test('dispatcher: ambiguous timeout does not create an automatic retry',async()=>{
 const h=harness('triply-whatsapp-followup-dispatch',lead,{failSend:true});await h.run();await h.run();
 assert.equal(h.state.requests.length,1);assert.equal(h.state.tables.triply_whatsapp_leads[0].followup_status,'failed');
});
test('dispatcher: live provider pause blocks send even with a stale eligible profile',async()=>{
 const h=harness('triply-whatsapp-followup-dispatch',lead,{liveAiEnabled:false});const result=await h.run();
 assert.equal(result.body.sent,0);assert.equal(h.state.requests.length,0);
 assert.equal(h.state.tables.triply_whatsapp_leads[0].followup_last_error,'ai_paused_or_unknown');
});
test('dispatcher: failed state read schedules only a read retry, never a message',async()=>{
 const h=harness('triply-whatsapp-followup-dispatch',lead,{failStateCheck:true});await h.run();
 assert.equal(h.state.requests.length,0);assert.equal(h.state.tables.triply_whatsapp_leads[0].followup_status,'scheduled');
 assert.equal(h.state.tables.triply_whatsapp_leads[0].followup_last_error,'state_check_failed');
});
