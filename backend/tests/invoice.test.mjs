import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';

function invoiceHarness(options={}) {
 const tables={admin_users:[{user_id:'admin',role:options.role||'owner'}],triply_whatsapp_leads:[{id:'lead',trip_id:'trip',payment_status:options.legacy?'verified':'pending_verification',profile:{customer_email:'audit@example.invalid'}}],trips:[{id:'trip',trip_code:'TEST',start_date:'2026-10-01',end_date:'2026-10-05'}],triply_accounting_documents:[{id:'ledger',lead_id:'lead',document_type:'invoice_and_receipt',status:'pending',attempts:0,updated_at:'2026-01-01T00:00:00Z'}],security_audit_events:[]};
 let calls=0,handler,finalizations=0;
 function from(table){let action='select',patch,filters=[],single=false;const q={select(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},in(k,v){filters.push(r=>v.includes(r[k]));return q},maybeSingle(){single=true;return q},single(){single=true;return q},update(p){action='update';patch=p;return q},insert(p){action='insert';patch=p;return q},then(resolve,reject){try{let rows=tables[table].filter(r=>filters.every(f=>f(r)));if(action==='update')rows.forEach(r=>Object.assign(r,patch));if(action==='insert'){rows=[{...patch}];tables[table].push(...rows)}return Promise.resolve({data:structuredClone(single?rows[0]??null:rows),error:null}).then(resolve,reject)}catch(e){return Promise.reject(e).then(resolve,reject)}}};return q}
 const source=readFileSync(new URL('../functions/'+(options.legacy?'triply-sumit-accounting':'triply-sumit-invoice')+'/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 runInNewContext(stripTypeScriptTypes(source),{createClient:()=>({from,auth:{getUser:async()=>({data:{user:{id:'admin'}},error:null})},rpc:async name=>{if(name==='triply_admin_confirm_whatsapp_payment')finalizations++;return{data:name==='triply_questionnaire_ready'?true:{ok:true},error:null}}}),Deno:{env:{get:k=>k==='SUMIT_COMPANY_ID'?'123':'synthetic-credential-for-tests-only'},serve:fn=>handler=fn},Request,Response,AbortSignal,AbortController,setTimeout,clearTimeout,console:{error(){}},fetch:async()=>{calls++;await new Promise(r=>setImmediate(r));return options.response?options.response():Response.json({Data:{DocumentID:123}})}});
 return {tables,get calls(){return calls},get finalizations(){return finalizations},async run(){const r=await handler(new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer synthetic'},body:JSON.stringify({lead_id:'lead',action:options.legacy?'issue_for_lead':'issue_and_confirm'})}));return{status:r.status,body:await r.json()}}};
}
test('concurrent invoice requests send at most one provider request',async()=>{
 const h=invoiceHarness();await Promise.all([h.run(),h.run()]);assert.equal(h.calls,1);assert.equal(h.finalizations,1);
});
test('ambiguous provider response cannot be retried as a fresh invoice',async()=>{
 const h=invoiceHarness({response:()=>new Response('unreadable',{status:502})});await h.run();await h.run();assert.equal(h.calls,1);assert.equal(h.tables.triply_accounting_documents[0].status,'uncertain');assert.equal(h.finalizations,0);
});
test('read-only admin cannot issue an invoice',async()=>{
 const h=invoiceHarness({role:'viewer'});const r=await h.run();assert.equal(r.status,401);assert.equal(h.calls,0);
});

for(const legacy of [true]) {
 test('legacy invoice route shares the same atomic claim',async()=>{const h=invoiceHarness({legacy});await Promise.all([h.run(),h.run()]);assert.equal(h.calls,1)});
 test('legacy invoice route does not retry ambiguous results',async()=>{const h=invoiceHarness({legacy,response:()=>new Response('unreadable',{status:502})});await h.run();await h.run();assert.equal(h.calls,1);assert.equal(h.tables.triply_accounting_documents[0].status,'uncertain')});
 test('legacy invoice route rejects viewer permissions',async()=>{const h=invoiceHarness({legacy,role:'viewer'});assert.equal((await h.run()).status,401);assert.equal(h.calls,0)});
}
