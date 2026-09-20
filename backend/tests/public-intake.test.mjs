import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
async function intake({duplicate=false,status='queued',jobError=false}={}){
 let handler;const upserts=[];let outgoing=0;
 function from(table){const q={select(){return q},eq(){return q},gte(){return q},maybeSingle(){return q},insert(){return q},upsert(value){upserts.push({table,value});return q},then(resolve,reject){return Promise.resolve(table==='triply_autopilot_jobs'?{data:status?{status}:null,error:jobError?{message:'fixture'}:null}:{data:[],count:0,error:null}).then(resolve,reject)}};return q}
 const source=readFileSync(new URL('../functions/triply-intake/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 runInNewContext(stripTypeScriptTypes(source),{createClient:()=>({from,rpc:async()=>({data:{trip_id:'fixture',trip_code:'TEST',duplicate},error:null})}),Deno:{env:{get:()=>''},serve:fn=>handler=fn},crypto:webcrypto,TextEncoder,Request,Response,fetch:async()=>{outgoing++;return Response.json({})},console:{error(){}}});
 const response=await handler(new Request('https://example.invalid',{method:'POST',body:JSON.stringify({submission_id:'fixture-submission',customer:{customer_name:'Fixture'},trip:{destination:'Fixture',start_date:'2026-10-01',end_date:'2026-10-05',preferences:{hotel_search_permission:'כן',flight_search_permission:'כן'}}})}));
 return{body:await response.json(),upserts,outgoing};
}
test('public intake reports the database queue and leaves dispatch to the scheduler',async()=>{const r=await intake();assert.equal(r.body.autopilot_queued,true);assert.equal(r.body.autopilot_status,'queued');assert.equal(r.outgoing,0);assert.equal(r.upserts.length,2)});
test('replayed questionnaire does not overwrite hotel and flight request state',async()=>{const r=await intake({duplicate:true,status:'ready_for_review'});assert.equal(r.upserts.length,0);assert.equal(r.body.duplicate,true);assert.equal(r.body.autopilot_queued,false);assert.equal(r.body.autopilot_status,'ready_for_review')});
test('missing or unreadable job never claims successful queueing',async()=>{for(const options of [{status:null},{jobError:true}]){const r=await intake(options);assert.equal(r.body.autopilot_queued,false);assert.equal(r.outgoing,0)}});
