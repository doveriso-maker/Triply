import { createClient } from 'npm:@supabase/supabase-js@2';
import { followupBlock, languageOf, paymentReady } from '../whatsapp-policy.mjs';
import { checkConversationState } from '../autocalls-state.mjs';

const PAYMENT_LINK='https://links.payboxapp.com/qyXZggZFXUb';
function adminKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const p=JSON.parse(modern);if(p?.default)return p.default}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''}
const supabase=createClient(Deno.env.get('SUPABASE_URL')??'',adminKey(),{auth:{persistSession:false,autoRefreshToken:false}});
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function authorized(req:Request){const provided=new URL(req.url).searchParams.get('token')||'';if(provided.length<24)return false;const {data,error}=await supabase.from('integration_secrets').select('secret_hash').eq('name','triply_followup_dispatch').maybeSingle();if(error||!data?.secret_hash)return false;return await sha256(provided)===data.secret_hash}
const langOf=languageOf;
function messageFor(row:any){const lang=langOf(row.profile);const paymentDue=row.payment_status==='link_available'&&paymentReady(row.profile);const app=false;if(lang==='ru'){if(paymentDue)return `Привет 😊 Хотите продолжить? Осталось завершить оплату, после чего начнём короткий опрос и соберём ваш персональный маршрут TRIPLY. PayBox: ${PAYMENT_LINK}`;if(app)return 'Привет 😊 Хотите продолжить с того места, где остановились, и закончить короткие вопросы для вашего маршрута?';return 'Привет 😊 Хотите продолжить с того места, где остановились, и продолжить планирование поездки?'}if(lang==='ar'){if(paymentDue)return `مرحبًا 😊 هل تريد المتابعة؟ بقي فقط إكمال الدفع، وبعدها نبدأ الأسئلة القصيرة ونبني مسارك الشخصي في TRIPLY. PayBox: ${PAYMENT_LINK}`;if(app)return 'مرحبًا 😊 هل تريد المتابعة من حيث توقفنا وإكمال الأسئلة القصيرة لمسارك؟';return 'مرحبًا 😊 هل تريد المتابعة من حيث توقفنا ومواصلة تخطيط رحلتك؟'}if(paymentDue)return `היי 😊 רוצה להמשיך? נשאר רק להשלים את התשלום, ואז נתחיל בכמה שאלות קצרות ואבנה לך את המסלול האישי ב-TRIPLY. PayBox: ${PAYMENT_LINK}`;if(app)return 'היי 😊 רוצה להמשיך מאיפה שעצרנו ולהשלים את השאלות הקצרות למסלול שלך?';return 'היי 😊 רוצה להמשיך מאיפה שעצרנו בתכנון החופשה שלך?'}

Deno.serve(async(req:Request)=>{
 try {
  if(req.method!=='POST')return Response.json({ok:false,error:'method_not_allowed'},{status:405});
  if(!(await authorized(req)))return Response.json({ok:false,error:'unauthorized'},{status:401});
  const {data:destination,error:destinationError}=await supabase.from('internal_runtime_secrets').select('secret').eq('name','triply_followup_automation_url').maybeSingle();
  if(destinationError||!destination?.secret)throw new Error('followup_destination_not_configured');
  const AUTOCALLS_WEBHOOK=destination.secret;
  const {data:credential,error:credentialError}=await supabase.from('internal_runtime_secrets').select('secret').eq('name','triply_autocalls_api_key').maybeSingle();
  if(credentialError||!credential?.secret)throw new Error('conversation_state_check_not_configured');
  const fields='id,customer_phone,latest_conversation_id,status,app_interest,profile,payment_status,followup_due_at,followup_attempts,last_synced_at';
  const {data:rows,error}=await supabase.from('triply_whatsapp_leads').select(fields).eq('followup_status','scheduled').lte('followup_due_at',new Date().toISOString()).order('followup_due_at',{ascending:true}).limit(20);
  if(error)throw error;
  let sent=0,skipped=0,failed=0;
  for(const row of rows??[]){
   const block=followupBlock(row)||(!langOf(row.profile)?'language_unknown':null);
   if(block){
    await supabase.from('triply_whatsapp_leads').update({followup_status:'complete',followup_due_at:null,followup_last_error:block}).eq('id',row.id).eq('followup_status','scheduled').eq('last_synced_at',row.last_synced_at);
    skipped++;continue;
   }
   const nextAttempts=Number(row.followup_attempts??0)+1;
   const {data:claim,error:ce}=await supabase.from('triply_whatsapp_leads').update({followup_status:'sending',followup_attempts:nextAttempts,followup_last_error:null}).eq('id',row.id).eq('followup_status','scheduled').eq('followup_due_at',row.followup_due_at).eq('last_synced_at',row.last_synced_at).select('id').maybeSingle();
   if(ce||!claim){skipped++;continue;}
   const liveState=await checkConversationState({apiKey:credential.secret,phone:row.customer_phone,conversationId:row.latest_conversation_id,assistantId:'10b4d3cd-00d3-4fda-a615-a85bf41f911e'});
   if(!liveState.allowed){
    // Retrying a failed read is safe: the outgoing request has not been made.
    const readFailed=['state_check_failed','state_check_invalid_response'].includes(liveState.reason);
    const retry=readFailed&&nextAttempts<3;
    await supabase.from('triply_whatsapp_leads').update({followup_status:retry?'scheduled':readFailed?'failed':'complete',followup_due_at:retry?new Date(Date.now()+10*60*1000).toISOString():null,followup_last_error:liveState.reason}).eq('id',row.id).eq('followup_status','sending').eq('last_synced_at',row.last_synced_at);
    skipped++;continue;
   }
   // Recheck current profile after claiming. Completion writes must not overwrite a new reply.
   const {data:fresh,error:fe}=await supabase.from('triply_whatsapp_leads').select(fields+',followup_status').eq('id',row.id).maybeSingle();
   if(fe||!fresh||fresh.followup_status!=='sending'||fresh.last_synced_at!==row.last_synced_at||followupBlock(fresh)||!langOf(fresh.profile)){
    await supabase.from('triply_whatsapp_leads').update({followup_status:'complete',followup_due_at:null,followup_last_error:'eligibility_changed'}).eq('id',row.id).eq('followup_status','sending').eq('last_synced_at',row.last_synced_at);
    skipped++;continue;
   }
   try{
    const r=await fetch(AUTOCALLS_WEBHOOK,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({send:true,phone:fresh.customer_phone,message:messageFor(fresh)}),signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw new Error('autocalls_'+r.status);
    const {error:saveError}=await supabase.from('triply_whatsapp_leads').update({followup_status:'sent',followup_sent_at:new Date().toISOString(),followup_due_at:null,followup_last_error:null}).eq('id',row.id).eq('followup_status','sending').eq('last_synced_at',row.last_synced_at);
    if(saveError)throw saveError;
    sent++;
   }catch(e){
    // An ambiguous network result may already have sent a message; never resend blindly.
    failed++;
    await supabase.from('triply_whatsapp_leads').update({followup_status:'failed',followup_due_at:null,followup_last_error:'delivery_uncertain:'+String(e).slice(0,150)}).eq('id',row.id).eq('followup_status','sending').eq('last_synced_at',row.last_synced_at);
   }
  }
  return Response.json({ok:true,checked:(rows??[]).length,sent,skipped,failed});
 }catch(e){console.error('triply-whatsapp-followup-dispatch',e);return Response.json({ok:false,error:'internal_error'},{status:500});}
});
