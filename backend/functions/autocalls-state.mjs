// Prepared for the send-time check; not wired into the live dispatcher yet.
// API contract: https://docs.autocalls.ai/api-reference/conversations/list-conversations
export async function checkConversationState({apiKey,phone,conversationId,assistantId,fetcher=fetch}) {
  if(!apiKey||!phone||!conversationId||!assistantId)return {allowed:false,reason:'state_check_not_configured'};
  const url=new URL('https://app.autocalls.ai/api/user/conversations');
  url.searchParams.set('customer_phone',phone);
  url.searchParams.set('type','whatsapp');
  url.searchParams.set('per_page','100');
  try{
    const response=await fetcher(url,{headers:{Authorization:'Bearer '+apiKey},signal:AbortSignal.timeout(5000)});
    if(!response.ok)return {allowed:false,reason:'state_check_failed'};
    const body=await response.json();
    if(!Array.isArray(body.data))return {allowed:false,reason:'state_check_invalid_response'};
    const row=body.data.find(c=>c.id===conversationId);
    if(!row||String(row.assistant_id)!==String(assistantId)||row.type!=='whatsapp')return {allowed:false,reason:'conversation_not_verified'};
    if(row.ai_enabled!==true)return {allowed:false,reason:'ai_paused_or_unknown'};
    return {allowed:true,reason:null};
  }catch{return {allowed:false,reason:'state_check_failed'};}
}
