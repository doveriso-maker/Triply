import test from 'node:test';
import assert from 'node:assert/strict';
import {checkConversationState} from '../functions/autocalls-state.mjs';
const input={apiKey:'synthetic-key',phone:'+15555550100',conversationId:'fixture-conversation',assistantId:19965};
const row={id:input.conversationId,assistant_id:19965,type:'whatsapp',ai_enabled:true};
test('prepared API check verifies identity and explicit AI enablement',async()=>{
 for(const [update,allowed] of [[{},true],[{ai_enabled:false},false],[{ai_enabled:null},false],[{assistant_id:1},false],[{type:'test'},false],[{id:'other-conversation'},false]]){
  const result=await checkConversationState({...input,fetcher:async()=>Response.json({data:[{...row,...update}]})});assert.equal(result.allowed,allowed);
 }
});
test('prepared API check fails closed on missing credentials and API failure',async()=>{
 assert.equal((await checkConversationState({...input,apiKey:''})).allowed,false);
 assert.equal((await checkConversationState({...input,fetcher:async()=>{throw Error('timeout');}})).allowed,false);
 assert.equal((await checkConversationState({...input,fetcher:async()=>Response.json({}, {status:401})})).allowed,false);
});
