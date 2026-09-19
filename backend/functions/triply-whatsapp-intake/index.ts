import { createClient } from 'npm:@supabase/supabase-js@2';
import { paymentReady as canRequestPayment, mergeControls, transcriptLanguage } from '../whatsapp-policy.mjs';

const PAYMENT_LINK='https://links.payboxapp.com/qyXZggZFXUb';
const QUESTIONNAIRE_VERSION='V9_HOTELS_END_TO_END';
const MODULES=['core','party','ratings','pace','access','drive','food','shopping','nightlife','budget','hotels','flights','documents','dna'];
const REQUIRED=['trip_name','customer_name','destination','travelers','start_date','end_date','party_type','pace','walking','car','budget_style','hotel_status','flight_status','must_have','never'];
const RATINGS=['rate_food','rate_romance','rate_beaches','rate_nature','rate_nightlife','rate_shopping','rate_culture','rate_history','rate_spa','rate_adventure','rate_markets','rate_photo'];

const ATTRIBUTION_MAP:Record<string,{platform:string,channel:string,campaign_language:'ar'|'he'|'ru',locale:string}>={
  'TT-AR':{platform:'tiktok',channel:'paid_social',campaign_language:'ar',locale:'ar-IL'},
  'TT-HE':{platform:'tiktok',channel:'paid_social',campaign_language:'he',locale:'he-IL'},
  'TT-RU':{platform:'tiktok',channel:'paid_social',campaign_language:'ru',locale:'ru-RU'},
  'META-AR':{platform:'meta',channel:'paid_social',campaign_language:'ar',locale:'ar-IL'},
  'META-HE':{platform:'meta',channel:'paid_social',campaign_language:'he',locale:'he-IL'},
  'META-RU':{platform:'meta',channel:'paid_social',campaign_language:'ru',locale:'ru-RU'}
};

function adminKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{const p=JSON.parse(modern);if(p?.default)return p.default}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''}
const supabase=createClient(Deno.env.get('SUPABASE_URL')??'',adminKey(),{auth:{persistSession:false,autoRefreshToken:false}});
function cleanString(v:unknown){if(typeof v!=='string')return null;const s=v.trim();return s?s:null}
function normalizePhone(v:unknown){const s=cleanString(v);if(!s)return null;const plus=s.startsWith('+')?'+':'';const digits=s.replace(/\D/g,'');return digits?plus+digits:null}
function normalizeLanguage(v:unknown){const s=cleanString(v)?.toLowerCase();if(!s)return null;if(['ru','ru-ru','russian','русский','рус'].includes(s))return 'ru';if(['he','he-il','hebrew','עברית'].includes(s))return 'he';if(['ar','ar-il','arabic','العربية','عربي'].includes(s))return 'ar';return null}
function localeForLanguage(lang:string|null){if(lang==='ru')return 'ru-RU';if(lang==='ar')return 'ar-IL';if(lang==='he')return 'he-IL';return null}
function normalizeCampaignCode(v:unknown){const s=cleanString(v)?.toUpperCase();if(!s)return null;const compact=s.replace(/[\[\](){}]/g,' ').replace(/_/g,'-');const m=compact.match(/\b(TT|META)\s*-?\s*(AR|HE|RU)\b/);if(!m)return null;const code=`${m[1]}-${m[2]}`;return ATTRIBUTION_MAP[code]?code:null}
function detectAttribution(payload:any,extracted:any){const direct=[payload?.campaign_code,payload?.campaign,payload?.utm_campaign,payload?.source_code,extracted?.campaign_code,extracted?.campaign,extracted?.utm_campaign,extracted?.source_code];for(const v of direct){const code=normalizeCampaignCode(v);if(code)return {code,...ATTRIBUTION_MAP[code]}}const transcript=Array.isArray(payload?.transcript)?payload.transcript:[];for(const item of transcript){if(item?.role!=='user')continue;const code=normalizeCampaignCode(item?.content);if(code)return {code,...ATTRIBUTION_MAP[code]}}const textCandidates=[payload?.message,payload?.text,payload?.customer_message,payload?.initial_message,payload?.body];for(const v of textCandidates){const code=normalizeCampaignCode(v);if(code)return {code,...ATTRIBUTION_MAP[code]}}return null}
function asBool(v:unknown){return v===true||v==='true'||v===1||v==='1'}
function parseObject(v:unknown){if(v&&typeof v==='object'&&!Array.isArray(v))return v as Record<string,unknown>;if(typeof v==='string'&&v.trim()){try{const x=JSON.parse(v);if(x&&typeof x==='object'&&!Array.isArray(x))return x as Record<string,unknown>}catch{}}return null}
function mergeQuestionnaire(oldQ:any,newQ:any){const a=(oldQ&&typeof oldQ==='object'&&!Array.isArray(oldQ))?oldQ:{};const b=(newQ&&typeof newQ==='object'&&!Array.isArray(newQ))?newQ:{};return {...a,...b,modules:{...(a.modules||{}),...(b.modules||{})}}}
function questionnaireReady(profile:any){if(!profile||profile.questionnaire_version!==QUESTIONNAIRE_VERSION||profile.questionnaire_complete!==true)return false;const q=profile.questionnaire;if(!q||typeof q!=='object'||Array.isArray(q))return false;const modules=q.modules;if(!modules||typeof modules!=='object'||Array.isArray(modules))return false;for(const m of MODULES)if(modules[m]!==true)return false;for(const k of REQUIRED){const v=q[k];if(v===undefined||v===null||String(v).trim()==='')return false}for(const k of RATINGS){const n=Number(q[k]);if(!Number.isInteger(n)||n<1||n>5)return false}return true}
async function sha256(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function authorized(req:Request){const provided=new URL(req.url).searchParams.get('token')||'';if(provided.length<24)return false;const {data,error}=await supabase.from('integration_secrets').select('secret_hash').eq('name','triply_whatsapp_webhook').maybeSingle();if(error||!data?.secret_hash)return false;return await sha256(provided)===data.secret_hash}
const PROFILE_KEYS=['customer_name','customer_email','trip_name','destination','start_date','end_date','trip_days','travelers','party_type','occasion','kids_ages','travel_style','budget','interests','food_notes','hotel_status','transport','walking','nightlife','shopping','app_interest','payment_claimed','language','locale'];

Deno.serve(async(req:Request)=>{try{
 if(req.method!=='POST')return Response.json({ok:false,error:'method_not_allowed'},{status:405});
 if(!(await authorized(req)))return Response.json({ok:false,error:'unauthorized'},{status:401});
 const payload=await req.json();
 const extracted=(payload?.extracted_variables&&typeof payload.extracted_variables==='object')?payload.extracted_variables:{};
 const attribution=detectAttribution(payload,extracted);
 const explicitLanguage=normalizeLanguage(payload?.language??extracted?.language??payload?.locale??extracted?.locale);
 const transcript=Array.isArray(payload?.transcript)?payload.transcript:[];
 const requestedLanguage=normalizeLanguage(extracted?.preferred_language);
 const routingLanguage=requestedLanguage??attribution?.campaign_language??transcriptLanguage(transcript)??(transcript.length===0?explicitLanguage:null);
 const routingLocale=localeForLanguage(routingLanguage);
 const phone=normalizePhone(payload?.customer_phone??payload?.phone??payload?.customer?.phone);if(!phone)return Response.json({ok:false,error:'customer_phone_required'},{status:400});
 const customerName=cleanString(extracted?.customer_name);
 const customerEmail=cleanString(payload?.customer_email??payload?.customer?.email??extracted?.customer_email);
 let customerId:string|null=null;
 const {data:existingCustomer}=await supabase.from('customers').select('id,full_name,email,locale').eq('phone',phone).order('updated_at',{ascending:false}).limit(1).maybeSingle();
 if(existingCustomer?.id){customerId=existingCustomer.id;const updates:any={updated_at:new Date().toISOString()};let changed=false;if(customerName&&customerName!==existingCustomer.full_name){updates.full_name=customerName;changed=true}if(customerEmail&&customerEmail!==existingCustomer.email){updates.email=customerEmail;changed=true}if(explicitLanguage&&routingLocale&&routingLocale!==existingCustomer.locale){updates.locale=routingLocale;changed=true}if(changed)await supabase.from('customers').update(updates).eq('id',customerId)}
 else{const {data:c,error:e}=await supabase.from('customers').insert({full_name:customerName??phone,phone,email:customerEmail,locale:routingLocale??'he-IL',notes:null}).select('id').single();if(e)throw e;customerId=c.id}

 const {data:existingLead}=await supabase.from('triply_whatsapp_leads').select('*').eq('customer_phone',phone).maybeSingle();
 const merged:any={...(existingLead?.profile??{})};
 for(const key of PROFILE_KEYS){const val=payload?.[key]??extracted?.[key];if(val!==undefined&&val!==null&&val!=='')merged[key]=val}
 if(customerName)merged.customer_name=customerName;if(customerEmail)merged.customer_email=customerEmail;
 Object.assign(merged,mergeControls(existingLead?.profile,payload,extracted));
 if(routingLanguage){merged.language=routingLanguage;merged.locale=routingLocale}
 else if(transcript.length>0&&!existingLead){delete merged.language;delete merged.locale;delete merged.routing_language;}
 if(routingLanguage)merged.routing_language=routingLanguage;
 if(attribution){const detectedAt=new Date().toISOString();const touch={platform:attribution.platform,channel:attribution.channel,campaign_code:attribution.code,campaign_language:attribution.campaign_language,locale:attribution.locale,detected_at:detectedAt};const oldAttr=(merged.marketing_attribution&&typeof merged.marketing_attribution==='object'&&!Array.isArray(merged.marketing_attribution))?merged.marketing_attribution:{};merged.marketing_attribution={...oldAttr,first_touch:oldAttr.first_touch??touch,last_touch:touch};merged.campaign_code=attribution.code;merged.campaign_source=attribution.platform;merged.campaign_language=attribution.campaign_language}

 const incomingQ=parseObject(payload?.q_profile??extracted?.q_profile??payload?.questionnaire);
 const qVersion=cleanString(payload?.q_version??extracted?.q_version??payload?.questionnaire_version);
 const qProgress=cleanString(payload?.q_progress??extracted?.q_progress??payload?.questionnaire_progress);
 const rawQComplete=payload?.q_complete??extracted?.q_complete??payload?.questionnaire_complete;
 const hasQComplete=rawQComplete!==undefined&&rawQComplete!==null;
 if(incomingQ){const q=mergeQuestionnaire(merged.questionnaire,incomingQ);q.customer_phone=q.customer_phone||phone;if(customerName)q.customer_name=customerName;if(customerEmail)q.customer_email=customerEmail;merged.questionnaire=q}
 if(qVersion)merged.questionnaire_version=qVersion;
 if(qProgress)merged.questionnaire_progress=qProgress;
 if(hasQComplete)merged.questionnaire_complete=asBool(rawQComplete)&&merged.questionnaire_version===QUESTIONNAIRE_VERSION;else if(merged.questionnaire_version!==QUESTIONNAIRE_VERSION)merged.questionnaire_complete=false;

 const appInterest=asBool(payload?.app_interest??extracted?.app_interest??merged.app_interest);
 const paymentClaimed=asBool(existingLead?.profile?.payment_claimed)||asBool(payload?.payment_claimed??extracted?.payment_claimed??merged.payment_claimed);
 merged.app_interest=appInterest;merged.payment_claimed=paymentClaimed;
 if(!paymentClaimed&&merged.questionnaire_complete===true)merged.questionnaire_complete=false;
 const isQuestionnaireReady=paymentClaimed&&questionnaireReady(merged);
 if(hasQComplete&&asBool(rawQComplete)&&!isQuestionnaireReady)merged.questionnaire_complete=false;
 const paymentReady=canRequestPayment(merged);

 let status=existingLead?.status??'collecting';
 if(appInterest&&!paymentClaimed)status='app_interested';
 else if(appInterest&&paymentClaimed&&!isQuestionnaireReady)status='app_details_needed';
 else if(appInterest&&paymentClaimed&&isQuestionnaireReady)status='app_intake_complete';

 let paymentStatus=existingLead?.payment_status??'not_started',paymentClaimedAt=existingLead?.payment_claimed_at??null;
 if(['not_started','link_available','pending_verification'].includes(paymentStatus)){
   if(!paymentClaimed)paymentStatus=paymentReady?'link_available':'not_started';
   if(paymentClaimed){paymentClaimedAt=paymentClaimedAt??new Date().toISOString();paymentStatus='pending_verification'}
 }
 if(['converted','closed'].includes(existingLead?.status))status=existingLead.status;

 const now=new Date().toISOString();
 const userMessages=transcript.filter((m:any)=>m?.role==='user').map((m:any)=>m.content);
 const fingerprint=userMessages.length?await sha256(JSON.stringify(userMessages)):null;
 const syncedAt=fingerprint&&fingerprint===existingLead?.profile?.last_user_fingerprint?existingLead.last_synced_at:now;
 if(fingerprint)merged.last_user_fingerprint=fingerprint;
 const row={customer_id:customerId,customer_phone:phone,customer_name:customerName??existingLead?.customer_name??null,latest_conversation_id:cleanString(payload?.conversation_id)??existingLead?.latest_conversation_id??null,status,app_interest:appInterest,profile:merged,summary:null,payment_status:paymentStatus,payment_claimed_at:paymentClaimedAt,payment_link:paymentReady?PAYMENT_LINK:null,last_transcript:[],last_payload:{},last_synced_at:syncedAt,updated_at:now};
 const {data:saved,error:se}=await supabase.from('triply_whatsapp_leads').upsert(row,{onConflict:'customer_phone'}).select('id,status,payment_status,profile,trip_id').single();if(se)throw se;

 let tripId=saved.trip_id??null,tripCode:string|null=null,tripPrepared=false,tripPrepareError:string|null=null;
 if(appInterest&&paymentClaimed&&isQuestionnaireReady){const {data:m,error:me}=await supabase.rpc('triply_whatsapp_materialize_trip',{p_lead_id:saved.id});if(me)tripPrepareError=me.message??String(me);else if(m){tripId=m.trip_id??tripId;tripCode=m.trip_code??null;tripPrepared=true}}

 await supabase.from('security_audit_events').insert({event_type:'whatsapp_structured_profile_synced',trip_id:tripId,target_type:'whatsapp_lead',target_id:saved.id,metadata:{raw_payload_retained:false,transcript_retained:false,language:routingLanguage??merged.language??null,language_source:explicitLanguage?'explicit':(attribution?'campaign':null),campaign_code:attribution?.code??merged.campaign_code??null,campaign_source:attribution?.platform??merged.campaign_source??null,campaign_language:attribution?.campaign_language??merged.campaign_language??null,questionnaire_version:merged.questionnaire_version??null,questionnaire_ready:isQuestionnaireReady,payment_ready:paymentReady,payment_claimed:paymentClaimed}});
 return Response.json({ok:true,lead_id:saved.id,status,payment_status:paymentStatus,questionnaire_version:merged.questionnaire_version??null,questionnaire_progress:merged.questionnaire_progress??null,questionnaire_ready:isQuestionnaireReady,payment_ready:paymentReady,profile_saved:true,raw_payload_retained:false,trip_prepared:tripPrepared,trip_id:tripId,trip_code:tripCode,trip_prepare_error:tripPrepareError,language:routingLanguage??merged.language??null,locale:routingLocale??merged.locale??null,campaign_code:attribution?.code??merged.campaign_code??null,campaign_source:attribution?.platform??merged.campaign_source??null,campaign_language:attribution?.campaign_language??merged.campaign_language??null});
}catch(err){console.error('triply-whatsapp-intake',err);return Response.json({ok:false,error:'internal_error'},{status:500})}});
