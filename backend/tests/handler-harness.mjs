import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import * as policy from '../functions/whatsapp-policy.mjs';

const token='synthetic-audit-token-not-a-real-credential';
export function harness(slug,lead=null,options={}) {
  const state={tables:{integration_secrets:[{name:'triply_whatsapp_webhook',secret_hash:createHash('sha256').update(token).digest('hex')},{name:'triply_followup_dispatch',secret_hash:createHash('sha256').update(token).digest('hex')}],internal_runtime_secrets:[{name:'triply_followup_automation_url',secret:'https://example.invalid/audit'}],customers:[],triply_whatsapp_leads:lead?[structuredClone(lead)]:[],security_audit_events:[]},requests:[],rpc:[]};
  function from(table) {
    let action='select',patch,filters=[],single=false;
    const query={
      select(){return query;},order(){return query;},limit(){return query;},
      eq(k,v){filters.push(r=>r[k]===v);return query;},
      lte(k,v){filters.push(r=>r[k]<=v);return query;},
      maybeSingle(){single=true;return query;},single(){single=true;return query;},
      insert(v){action='insert';patch=v;return query;},
      upsert(v){action='upsert';patch=v;return query;},
      update(v){action='update';patch=v;return query;},
      then(resolve,reject){try{
        options.beforeQuery?.({table,action,patch,state});
        const rows=state.tables[table]??=[];
        let matched=rows.filter(r=>filters.every(f=>f(r)));
        if(action==='insert'){const row={id:'fixture-'+rows.length,...structuredClone(patch)};rows.push(row);matched=[row];}
        if(action==='upsert'){let row=rows.find(r=>r.customer_phone===patch.customer_phone);if(row)Object.assign(row,structuredClone(patch));else{row={id:'fixture-'+rows.length,...structuredClone(patch)};rows.push(row);}matched=[row];}
        if(action==='update')matched.forEach(r=>Object.assign(r,structuredClone(patch)));
        options.afterQuery?.({table,action,patch,state});
        return Promise.resolve({data:structuredClone(single?matched[0]??null:matched),error:null}).then(resolve,reject);
      }catch(error){return Promise.reject(error).then(resolve,reject);}}
    };return query;
  }
  let handler;
  const source=readFileSync(new URL('../functions/'+slug+'/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  runInNewContext(stripTypeScriptTypes(source),{...policy,canRequestPayment:policy.paymentReady,createClient:()=>({from,rpc:async(name,args)=>{state.rpc.push({name,args});return {data:{trip_id:'fixture-trip'},error:null};}}),Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},crypto:webcrypto,TextEncoder,Request,Response,URL,AbortSignal,console:{error(){}},fetch:async(url,init)=>{state.requests.push(JSON.parse(init.body));if(options.failSend)throw Error('simulated ambiguous timeout');return Response.json({ok:true});}});
  return {state,async run(payload={}){const response=await handler(new Request('https://example.invalid/?token='+token,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}));return {status:response.status,body:await response.json()};}};
}
