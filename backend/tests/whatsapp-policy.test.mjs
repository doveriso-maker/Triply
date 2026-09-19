import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentReady,followupBlock,languageOf,transcriptLanguage,mergeControls} from '../functions/whatsapp-policy.mjs';

const ready={app_interest:true,destination:'Rome',start_date:'2026-10-01',end_date:'2026-10-05'};
test('payment requires consent, destination and actual valid dates',()=>{
  assert.equal(paymentReady(ready),true);
  for(const update of [{app_interest:false},{destination:''},{start_date:''},{end_date:'2026-09-30'},{start_date:'2026-02-30'},{start_date:'October'},{start_date:null,trip_days:5}])assert.equal(paymentReady({...ready,...update}),false);
});
test('same day trip and questionnaire date fallback remain supported',()=>{
  assert.equal(paymentReady({...ready,end_date:ready.start_date}),true);
  assert.equal(paymentReady({app_interest:true,questionnaire:ready}),true);
});
test('every cancellation state blocks follow-up independently of scheduling',()=>{
  const row={profile:{language:'he'},payment_status:'not_started',status:'collecting'};
  assert.equal(followupBlock(row),null);
  for(const key of ['followup_opt_out','human_handoff','safety_hold','non_customer','payment_claimed'])assert.ok(followupBlock({...row,profile:{[key]:true}}));
  for(const payment_status of ['verified','pending_verification','refunded'])assert.ok(followupBlock({...row,payment_status}));
  assert.ok(followupBlock({...row,profile:{ai_enabled:false}}));
  assert.ok(followupBlock({...row,status:'closed'}));
});
test('flags are sticky across incomplete or default-false webhook extraction',()=>{
  assert.equal(mergeControls({human_handoff:true},{},{human_handoff:false}).human_handoff,true);
  assert.equal(mergeControls({}, {transcript:[{role:'system',content:'AI auto-replies paused — human agent replied'}]},{}).human_handoff,true);
  assert.equal(mergeControls({}, {},{followup_opt_out:'true'}).followup_opt_out,true);
});
test('unknown language never silently selects Hebrew',()=>{
  assert.equal(languageOf({}),null);
  assert.equal(languageOf({language:'',campaign_language:'ar'}),'ar');
  assert.equal(languageOf({language:'ru-RU'}),'ru');
  assert.equal(transcriptLanguage([{role:'user',content:'https://tiktok.com/hi'},{role:'assistant',content:'שלום'}]),null);
  assert.equal(transcriptLanguage([{role:'user',content:'مرحبا'}]),'ar');
  assert.equal(transcriptLanguage([{role:'user',content:'Здравствуйте'}]),'ru');
});
test('human handling blocks payment reminders even with complete dates',()=>{
  assert.equal(paymentReady({...ready,human_handoff:true}),false);
});
