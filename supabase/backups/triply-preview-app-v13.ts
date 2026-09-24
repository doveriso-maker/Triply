import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});

function cors(req:Request){
  const origin=req.headers.get("origin")||"";
  const allowed=new Set(["https://mytriply.co.il","https://www.mytriply.co.il","https://navigam.com","https://www.navigam.com","http://localhost","https://localhost","capacitor://localhost","null"]);
  return {
    "Access-Control-Allow-Origin":allowed.has(origin)?origin:"https://mytriply.co.il",
    "Access-Control-Allow-Headers":"content-type",
    "Access-Control-Allow-Methods":"GET,OPTIONS",
    "Vary":"Origin"
  };
}
function json(req:Request,b:any,s=200){return new Response(JSON.stringify(b),{status:s,headers:{...cors(req),"content-type":"application/json; charset=utf-8","cache-control":"no-store, private","x-content-type-options":"nosniff"}})}
async function sha256(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function langOf(trip:any){const raw=String(trip?.preferences?.language||trip?.preferences?.locale||"he").toLowerCase();return raw.startsWith("ru")?"ru":raw.startsWith("ar")?"ar":"he"}
const imageCache=new Map<string,any[]>();
function normText(v:string){return String(v||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim()}
function words(v:string){return normText(v).split(/\s+/).filter(w=>w.length>=3)}
function mapAlias(url:string){try{const u=new URL(String(url||""));return String(u.searchParams.get("query")||"").trim()}catch{return ""}}
function parenAliases(name:string){const a=[name];for(const m of String(name||"").matchAll(/\(([^)]+)\)/g))if(m[1]?.trim())a.push(m[1].trim());return a}
function relevantTitle(title:string,alias:string,context:string){const t=normText(title),q=normText(alias);if(!t||!q)return false;if(t===q||t.includes(q)||q.includes(t))return true;const ctx=new Set(words(context));const ws=words(alias).filter(w=>!ctx.has(w));if(!ws.length)return false;const matched=ws.filter(w=>t.includes(w)).length;return matched>=Math.max(1,Math.ceil(ws.length*0.67))}
async function wikiImages(aliases:string[],context:string,lang:string){
 const clean=[...new Set(aliases.map(x=>String(x||"").trim()).filter(Boolean))];const key=lang+"|"+clean.join("|").toLowerCase()+"|"+context.toLowerCase();if(imageCache.has(key))return imageCache.get(key)||[];
 const localized=lang==="ru"?"ru.wikipedia.org":lang==="ar"?"ar.wikipedia.org":lang==="he"?"he.wikipedia.org":"en.wikipedia.org";const hosts=[...new Set([localized,"en.wikipedia.org","tr.wikipedia.org"])];const out:any[]=[];const seen=new Set<string>();
 for(const alias of clean)for(const host of hosts)try{const u=new URL("https://"+host+"/w/api.php");u.searchParams.set("action","query");u.searchParams.set("generator","search");u.searchParams.set("gsrsearch",'"'+alias+'"');u.searchParams.set("gsrlimit","8");u.searchParams.set("prop","pageimages");u.searchParams.set("piprop","thumbnail");u.searchParams.set("pithumbsize","1200");u.searchParams.set("format","json");u.searchParams.set("origin","*");const r=await fetch(u.toString(),{signal:AbortSignal.timeout(3500),headers:{"user-agent":"NAVIGAM-Preview/1.1"}});if(!r.ok)continue;const b=await r.json().catch(()=>null);const pages=Object.values(b?.query?.pages||{}) as any[];for(const p of pages){const src=String(p?.thumbnail?.source||""),title=String(p?.title||"");if(!src||!clean.some(a=>relevantTitle(title,a,context))||seen.has(src))continue;seen.add(src);out.push({url:src,title,host})}}catch{}
 imageCache.set(key,out);return out
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors(req)});
  if(req.method!=="GET")return json(req,{error:"method_not_allowed"},405);
  try{
    const u=new URL(req.url);
    const token=(u.searchParams.get("token")||"").trim();
    const code=(u.searchParams.get("code")||"").trim().toUpperCase();
    let link:any=null,le:any=null;
    if(token){
      if(token.length<32||token.length>256)return json(req,{error:"invalid_token"},401);
      const hash=await sha256(token);
      const r=await supabase.from("trip_app_links").select("id,trip_id,status,expires_at,metadata").eq("token_hash",hash).maybeSingle();
      link=r.data;le=r.error;
    }else if(code){
      if(!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,16}$/.test(code))return json(req,{error:"invalid_code"},401);
      const r=await supabase.from("trip_app_links").select("id,trip_id,status,expires_at,metadata").contains("metadata",{short_code:code}).maybeSingle();
      link=r.data;le=r.error;
    }else return json(req,{error:"missing_link"},401);
    if(le)throw le;
    if(!link||link.status!=="active"||link?.metadata?.preview!==true)return json(req,{error:"preview_not_found"},401);
    const pendingReview=link?.metadata?.review_status==="pending_owner_review"&&link?.metadata?.customer_sent!==true;
    if(!pendingReview&&(!link.expires_at||new Date(link.expires_at).getTime()<=Date.now()))return json(req,{error:"preview_expired"},401);
    const {data:trip,error:te}=await supabase.from("trips").select("id,trip_code,title,destination,start_date,end_date,preferences").eq("id",link.trip_id).single();
    if(te||!trip)return json(req,{error:"trip_not_found"},404);
    const {data:day,error:de}=await supabase.from("trip_days").select("id,day_number,trip_date,title,summary").eq("trip_id",trip.id).eq("day_number",1).maybeSingle();
    if(de||!day)return json(req,{error:"preview_day_not_found"},404);
    const {data:items,error:ie}=await supabase.from("itinerary_items").select("id,trip_day_id,place_id,start_time,end_time,title,item_type,description,status,sort_order,metadata").eq("trip_day_id",day.id).order("sort_order",{ascending:true});
    if(ie)throw ie;
    const pids=[...new Set((items||[]).map((x:any)=>x.place_id).filter(Boolean))];
    let places:any[]=[];
    if(pids.length){const {data,error}=await supabase.from("places").select("id,name,category,city,country,address,website,google_maps_url,booking_url,metadata").in("id",pids);if(error)throw error;places=data||[]}
    const pmap=new Map(places.map((p:any)=>[p.id,p]));
    const language=langOf(trip);
    const joined=(items||[]).map((x:any)=>({...x,place:x.place_id?pmap.get(x.place_id)||null:null}));
    const usedImages=new Set<string>();
    const uniqueImage=(url:string|null|undefined)=>{const v=String(url||"").trim();if(!v)return null;let id=v;try{const u=new URL(v);let p=decodeURIComponent(u.pathname);if(p.includes("/thumb/")){p=p.replace("/thumb/","/");p=p.substring(0,p.lastIndexOf("/"));}id=(u.hostname+p).toLowerCase()}catch{id=v.toLowerCase().split("?")[0].split("#")[0]}if(usedImages.has(id))return null;usedImages.add(id);return v};
    const hero=String(trip?.preferences?.preview_hero_image_url||'').trim()||null; const splash=String(trip?.preferences?.preview_splash_image_url||'').trim()||hero;
    const enriched=[];
    for(const x of joined){
      if(!x.place){enriched.push(x);continue}
      const placeName=String(x.place.name||"").trim();
      const context=[x.place.city,x.place.country].filter(Boolean).join(" ");
      let image_url:string|null=null;
      // Only use an explicitly stored image when it belongs to this place.
      const preferred=String(x.place?.metadata?.preview_image_url||"").trim();
      const preferredFor=String(x.place?.metadata?.preview_image_place_name||"").trim();
      if(preferred&&preferredFor&&normText(preferredFor)===normText(placeName)) image_url=uniqueImage(preferred);
      // Otherwise search several candidates for the exact place and take the first unused relevant one.
      if(!image_url&&placeName){
        const aliases=[...parenAliases(placeName),mapAlias(x.place.google_maps_url),String(x.title||"")].filter(Boolean);
        const candidates=await wikiImages(aliases,context,language);
        for(const candidate of candidates){const u=uniqueImage(candidate?.url);if(u){image_url=u;break}}
      }
      // HARD RULE: no generic city/category fallback. If no reliable unique place image exists, return null.
      enriched.push({...x,place:{...x.place,preview_image_url:image_url||null}});
    }
    await supabase.from("trip_app_links").update({last_used_at:new Date().toISOString()}).eq("id",link.id);
    return json(req,{ok:true,language,trip:{id:trip.id,title:trip.title,destination:trip.destination,start_date:trip.start_date,end_date:trip.end_date,hero_image_url:hero||null,splash_image_url:splash||null},day,items:enriched,expires_at:link.expires_at||null,review_status:link?.metadata?.review_status||null,customer_sent:link?.metadata?.customer_sent===true});
  }catch(e){console.error("triply-preview-app",e);return json(req,{error:"internal_error"},500)}
});
