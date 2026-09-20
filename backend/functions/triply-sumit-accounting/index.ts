import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')??'';
function serviceKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const x=JSON.parse(modern);if(x?.default)return x.default}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''}
const admin=createClient(SUPABASE_URL,serviceKey(),{auth:{persistSession:false,autoRefreshToken:false}});
const SUMIT_COMPANY_ID=(Deno.env.get('SUMIT_COMPANY_ID')??'').trim();
const SUMIT_PRIVATE_KEY=(Deno.env.get('SUMIT_PRIVATE_KEY')??'').trim();
const SUMIT_PUBLIC_KEY=(Deno.env.get('SUMIT_PUBLIC_KEY')??'').trim();
const SUMIT_CREATE_URL='https://api.sumit.co.il/accounting/documents/create/';

function j(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, private','x-content-type-options':'nosniff','referrer-policy':'no-referrer'}})}
function s(v:unknown){return typeof v==='string'&&v.trim()?v.trim():null}
function validEmail(v:unknown){const x=s(v);return !!x&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)}
function daysInclusive(a:string,b:string){const x=new Date(a+'T00:00:00Z').getTime(),y=new Date(b+'T00:00:00Z').getTime();if(!Number.isFinite(x)||!Number.isFinite(y)||y<x)return null;return Math.floor((y-x)/86400000)+1}
function launchPrice(days:number){return 169+Math.max(0,days-5)*25}
async function authorize(req:Request){
  const internal=req.headers.get('x-triply-internal');
  if(internal){const {data,error}=await admin.rpc('triply_autopilot_validate_internal',{p_token:internal});if(!error&&data===true)return {kind:'internal' as const,userId:null}}
  const auth=req.headers.get('authorization')||'';if(!auth.toLowerCase().startsWith('bearer '))return null;
  const token=auth.slice(7);const {data:{user},error}=await admin.auth.getUser(token);if(error||!user)return null;
  const {data:a}=await admin.from('admin_users').select('user_id,role').eq('user_id',user.id).in('role',['owner','editor']).maybeSingle();if(!a)return null;
  return {kind:'admin' as const,userId:user.id};
}
function config(){const companyId=Number(SUMIT_COMPANY_ID);return {company_id:SUMIT_COMPANY_ID.length>0&&Number.isInteger(companyId)&&companyId>0,private_key:SUMIT_PRIVATE_KEY.length>10,public_key:SUMIT_PUBLIC_KEY.length>5,ready:SUMIT_COMPANY_ID.length>0&&Number.isInteger(companyId)&&companyId>0&&SUMIT_PRIVATE_KEY.length>10}}
function responseInfo(body:any){const data=(body&&typeof body==='object'&&body.Data&&typeof body.Data==='object')?body.Data:body||{};const doc=(data?.Document&&typeof data.Document==='object')?data.Document:{};const numstr=(v:any)=>typeof v==='number'?String(v):s(v);return {status:s(body?.Status??data?.Status),user_error:s(body?.UserErrorMessage??data?.UserErrorMessage),technical_error:s(body?.TechnicalErrorDetails??data?.TechnicalErrorDetails),document_id:numstr(body?.DocumentID??data?.DocumentID??doc?.ID),document_number:numstr(body?.DocumentNumber??data?.DocumentNumber??doc?.Number),download_url:s(body?.DocumentDownloadURL??data?.DocumentDownloadURL??doc?.DownloadURL)} }
async function createDocument(payload:any){const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),15000);try{const r=await fetch(SUMIT_CREATE_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ac.signal});const text=await r.text();let body:any={};try{body=JSON.parse(text)}catch{body={raw:text.slice(0,1200)}}return {http_status:r.status,ok:r.ok,body,info:responseInfo(body)}}finally{clearTimeout(timer)}}
function credentials(){return {CompanyID:Number(SUMIT_COMPANY_ID),APIKey:SUMIT_PRIVATE_KEY}}
function zeroPayload(ref:string){return {Credentials:credentials(),Details:{Type:'InvoiceAndReceipt',IsDraft:true,Customer:{SearchMode:0,Name:'TRIPLY API TEST 0 ILS'},Currency:'ILS',Description:'TRIPLY SUMIT integration test — 0 ILS — DRAFT',ExternalReference:ref},Items:[{Quantity:1,UnitPrice:0,TotalPrice:0,Item:{Name:'TRIPLY API TEST',Description:'Integration test only',SearchMode:0}}],Payments:[{Amount:0,DocumentCurrency_Amount:0,Type:'Digital',Details_Digital:{DigitalWalletType:'PayBox',AdditionalData:{source:'TRIPLY',test:true}}}],VATIncluded:true};}
function livePayload(args:{name:string,email:string,phone:string|null,tripCode:string,amount:number,language:string}){const lang=args.language==='ar'?2:args.language==='he'?0:1;const ref=`TRIPLY-${args.tripCode}-PAYBOX`;return {Credentials:credentials(),Details:{Type:'InvoiceAndReceipt',IsDraft:false,Date:new Date().toISOString(),Customer:{SearchMode:2,Name:args.name,EmailAddress:args.email,Phone:args.phone||undefined,ExternalIdentifier:`triply-${args.tripCode}`},Currency:'ILS',Language:lang,Description:`TRIPLY Premium · Trip ${args.tripCode}`,ExternalReference:ref,SendByEmail:{EmailAddress:args.email,Original:true,SendAsPaymentRequest:false}},Items:[{Quantity:1,UnitPrice:args.amount,TotalPrice:args.amount,Item:{Name:'TRIPLY Premium',Description:`Personalized trip app · ${args.tripCode}`,SearchMode:0}}],Payments:[{Amount:args.amount,DocumentCurrency_Amount:args.amount,Type:'Digital',Details_Digital:{DigitalWalletType:'PayBox',AdditionalData:{source:'TRIPLY',trip_code:args.tripCode}}}],VATIncluded:true,ResponseLanguage:lang};}

Deno.serve(async(req:Request)=>{try{
  if(req.method!=='POST')return j({ok:false,error:'method_not_allowed'},405);
  const actor=await authorize(req);if(!actor)return j({ok:false,error:'unauthorized'},401);
  let body:any={};try{body=await req.json()}catch{return j({ok:false,error:'bad_json'},400)}
  const action=s(body?.action)||'config_check';const cfg=config();
  if(action==='config_check')return j({ok:true,service:'triply-sumit-accounting',configured:cfg});
  if(!cfg.ready)return j({ok:false,error:'sumit_not_configured',configured:cfg},503);
  if(action==='zero_test'){
    const ref=`TRIPLY-ZERO-TEST-${Date.now()}`;
    try{const out=await createDocument(zeroPayload(ref));const info=out.info;await admin.from('security_audit_events').insert({event_type:'sumit_zero_test',target_type:'accounting',metadata:{external_reference:ref,http_status:out.http_status,ok:out.ok,document_id:info.document_id,document_number:info.document_number,user_error:info.user_error,technical_error:info.technical_error}});return j({ok:out.ok&&!!info.document_id,http_status:out.http_status,external_reference:ref,draft:true,amount:0,document:info,provider_ok:out.ok},out.ok?200:422)}catch(e){const msg=e instanceof Error?e.name+': '+e.message:String(e);await admin.from('security_audit_events').insert({event_type:'sumit_zero_test_uncertain',target_type:'accounting',metadata:{external_reference:ref,error:msg}});return j({ok:false,error:'sumit_request_uncertain_no_retry',detail:msg,external_reference:ref},502)}
  }
  if(action==='issue_for_lead'){
    const leadId=s(body?.lead_id);if(!leadId)return j({ok:false,error:'lead_id_required'},400);
    const {data:lead,error:le}=await admin.from('triply_whatsapp_leads').select('*').eq('id',leadId).maybeSingle();if(le||!lead)return j({ok:false,error:'lead_not_found'},404);
    if(lead.payment_status!=='verified')return j({ok:false,error:'payment_not_verified'},409);
    if(!lead.trip_id)return j({ok:false,error:'trip_not_materialized'},409);
    const email=s(lead.profile?.customer_email);if(!validEmail(email))return j({ok:false,error:'customer_email_missing'},409);
    const {data:trip,error:te}=await admin.from('trips').select('id,trip_code,start_date,end_date,preferences').eq('id',lead.trip_id).maybeSingle();if(te||!trip)return j({ok:false,error:'trip_not_found'},404);
    const d=daysInclusive(String(trip.start_date),String(trip.end_date));if(!d)return j({ok:false,error:'invalid_trip_dates'},409);const amount=launchPrice(d);const ext=`TRIPLY-${trip.trip_code}-PAYBOX`;
    const {data:existing}=await admin.from('triply_accounting_documents').select('*').eq('lead_id',leadId).eq('document_type','invoice_and_receipt').maybeSingle();
    if(existing&&['issued','emailed'].includes(existing.status))return j({ok:true,duplicate_prevented:true,document:{id:existing.provider_document_id,number:existing.provider_document_number,download_url:existing.provider_download_url},amount:Number(existing.amount)});
    if(existing&&['issuing','submitting','uncertain'].includes(existing.status))return j({ok:false,error:'accounting_request_already_in_flight_or_uncertain',accounting_id:existing.id},409);
    let accounting=existing;if(!accounting){const {data:a,error:ae}=await admin.from('triply_accounting_documents').insert({lead_id:lead.id,trip_id:trip.id,provider:'sumit',document_type:'invoice_and_receipt',status:'pending',amount,currency:'ILS',customer_name:s(lead.customer_name)||s(lead.profile?.customer_name),customer_email:email,external_reference:ext}).select('*').single();if(ae)throw ae;accounting=a}
    const claim=await admin.from('triply_accounting_documents').update({status:'issuing',attempts:(accounting.attempts||0)+1,updated_at:new Date().toISOString()}).eq('id',accounting.id).in('status',['pending','failed']).eq('updated_at',accounting.updated_at).select('id').maybeSingle();
    if(claim.error||!claim.data)return j({ok:false,error:'accounting_request_already_in_flight_or_uncertain'},409);
    const rawLang=String(lead.profile?.language||trip.preferences?.language||'he').toLowerCase();const language=rawLang.startsWith('ar')?'ar':rawLang.startsWith('ru')?'ru':'he';
    try{const out=await createDocument(livePayload({name:s(lead.customer_name)||s(lead.profile?.customer_name)||'TRIPLY Customer',email:email!,phone:s(lead.customer_phone),tripCode:trip.trip_code,amount,language}));const info=out.info;if(out.ok&&info.document_id){const saved=await admin.from('triply_accounting_documents').update({status:'issued',provider_document_id:info.document_id,provider_document_number:info.document_number,provider_download_url:info.download_url,issued_at:new Date().toISOString(),email_requested_at:new Date().toISOString(),updated_at:new Date().toISOString(),last_error:null}).eq('id',accounting.id).eq('status','issuing').select('id').maybeSingle();if(saved.error||!saved.data)return j({ok:false,error:'invoice_issued_ledger_save_failed',document_id:info.document_id},500);return j({ok:true,amount,document:info})}const err=[info.user_error,info.technical_error,`HTTP ${out.http_status}`].filter(Boolean).join(' · ');await admin.from('triply_accounting_documents').update({status:'uncertain',last_error:err.slice(0,1500),updated_at:new Date().toISOString()}).eq('id',accounting.id);return j({ok:false,error:'sumit_rejected_document',detail:err,http_status:out.http_status},422)}catch(e){const msg=e instanceof Error?e.name+': '+e.message:String(e);await admin.from('triply_accounting_documents').update({status:'uncertain',last_error:msg.slice(0,1500),updated_at:new Date().toISOString()}).eq('id',accounting.id);return j({ok:false,error:'sumit_request_uncertain_no_retry',detail:msg},502)}
  }
  return j({ok:false,error:'unknown_action'},400);
}catch(e){console.error('triply-sumit-accounting',e);return j({ok:false,error:'internal_error'},500)}});

