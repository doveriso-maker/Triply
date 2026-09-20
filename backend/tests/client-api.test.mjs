import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
import {webcrypto,createHash} from 'node:crypto';
function api(options={}){
 const token='synthetic-client-token-for-isolated-audit';
 const tables={trip_app_links:[{id:'link',trip_id:'trip',token_hash:createHash('sha256').update(token).digest('hex'),status:options.status||'active',expires_at:options.expires||'2099-01-01'}],trips:[{id:'trip',trip_code:'TEST',preferences:{language:options.language||'ru'}}],trip_days:[{id:'day',trip_id:'trip'}],trip_assets:[],live_items:[],itinerary_items:[{id:'item',trip_day_id:'day',place_id:'place'}],places:[{id:'place',name:'Fixture place',metadata:{}}]};
 const queries=[];let handler;
 function from(table){queries.push(table);let filters=[],single=false,patch;const q={select(){return q},order(){return q},eq(k,v){filters.push(r=>(k==='metadata->>trip_code'?r.metadata?.trip_code:r[k])===v);return q},in(k,v){filters.push(r=>v.includes(r[k]));return q},single(){single=true;return q},maybeSingle(){single=true;return q},update(p){patch=p;return q},then(resolve,reject){const rows=tables[table].filter(r=>filters.every(f=>f(r)));if(patch)rows.forEach(r=>Object.assign(r,patch));return Promise.resolve({data:structuredClone(single?rows[0]??null:rows),error:null}).then(resolve,reject)}};return q}
 const source=readFileSync(new URL('../functions/triply-client-app/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 runInNewContext(stripTypeScriptTypes(source),{createClient:()=>({from}),Deno:{env:{get:()=>''},serve:fn=>handler=fn},crypto:webcrypto,TextEncoder,URL,Request,Response,console:{error(){}}});
 return{queries,async run(value=token){const r=await handler(new Request('https://example.invalid/?token='+value));return{status:r.status,body:await r.json()}}};
}
test('client API includes itinerary-linked places without a trip metadata tag',async()=>{const r=await api().run();assert.equal(r.status,200);assert.equal(r.body.places[0]?.id,'place')});
test('client API normalizes regional language codes consistently',async()=>{const r=await api({language:'RU_ru'}).run();assert.equal(r.body.language,'ru');assert.equal(r.body.i18n.language,'ru');assert.equal(r.body.direction,'ltr')});
test('revoked and expired links cannot read trip data',async()=>{for(const opt of [{status:'revoked'},{expires:'2020-01-01'}]){const h=api(opt);assert.equal((await h.run()).status,401);assert.ok(!h.queries.includes('trips'))}});
test('malformed tokens never query the database',async()=>{const h=api();assert.equal((await h.run('bad')).status,401);assert.equal(h.queries.length,0)});
