const fs = require('node:fs');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const source = fs.readFileSync(require('node:path').join(__dirname,'../preview/boot.js'),'utf8');
const SERVER_EPOCH = Date.UTC(2026,8,24,12);
const date = ms => new Date(SERVER_EPOCH+ms).toISOString();
function response(body,status=200){return {ok:status>=200&&status<300,status,headers:{get:()=>null},json:async()=>body};}
function allowed(now,ttl){return response({ok:true,language:'ar',server_now:date(now),expires_at:date(now+ttl),trip:{title:'SYNTHETIC ONLY'}});}
function denied(error='preview_not_found',status=401){return response({ok:false,error,language:'ar',server_now:date(0)},status);}
const flush = async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
async function harness({path='/p/TEST2345',fetcher,scriptDelay=0}={}){
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="previewGate"><div id="previewGateMsg"></div></div><div id="app" hidden inert><section id="live" class="view active"><header></header><main id="main"></main></section></div></body></html>',{url:'https://www.navigam.com'+path,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;let now=0,sequence=0;const timers=new Map(),calls=[],scripts=[];let adapted=0,renders=0,documentHidden=false;
  Object.defineProperty(w.document,'hidden',{get:()=>documentHidden,configurable:true});
  const set=(fn,delay=0)=>{const id=++sequence;timers.set(id,{id,at:now+Math.max(0,Number(delay)||0),fn});return id;};
  w.setTimeout=set;w.clearTimeout=id=>timers.delete(id);
  Object.defineProperty(w.performance,'now',{value:()=>now});
  Object.defineProperty(w.navigator,'language',{value:'en-US'});
  w.AbortController=global.AbortController;
  w.fetch=(url,options)=>{calls.push({url,options,at:now});return fetcher(calls.length,{url,options,now,window:w});};
  w.adaptPreview=(data,code)=>{adapted++;return {code,data};};
  w.updateChrome=()=>{w.document.documentElement.lang=w.NAVIGAM_CONFIG.data.language;};w.render=()=>{renders++;w.document.getElementById('main').textContent='SYNTHETIC AUTHORIZED CONTENT';};
  w.stopMap=()=>{};w.stopVoice=()=>{};
  const nativeAppend=w.document.head.append.bind(w.document.head);
  w.document.head.append=(node)=>{nativeAppend(node);if(node.tagName==='SCRIPT'){scripts.push(node.src);if(scriptDelay!==null)set(()=>node.onload?.(),scriptDelay);}};
  const promise=w.eval(source);await flush();
  async function advance(ms){const target=now+ms;let count=0;while(true){await flush();const next=[...timers.values()].filter(timer=>timer.at<=target).sort((a,b)=>a.at-b.at||a.id-b.id)[0];if(!next)break;if(++count>1000)throw Error('timer loop');timers.delete(next.id);now=next.at;next.fn();}now=target;await flush();}
  const visible=()=>!w.document.getElementById('app').hidden&&!w.document.getElementById('app').inert&&w.NAVIGAM_AUTHORIZED===true;
  const closed=()=>{assert.equal(visible(),false);assert.equal(w.document.getElementById('app').hidden,true);assert.equal(w.document.getElementById('app').inert,true);assert.equal(w.NAVIGAM_AUTHORIZED,false);assert.notEqual(w.document.getElementById('previewGate').style.display,'none');};
  return {dom,w,calls,scripts,promise,advance,visible,closed,get now(){return now},get adapted(){return adapted},get renders(){return renders},setHidden(value){documentHidden=value;w.document.dispatchEvent(new w.Event('visibilitychange'));}};
}
function hangUntilAbort({options}){return new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(Object.assign(Error('Synthetic AbortError'),{name:'AbortError'})),{once:true});});}
const reports=[];
(async()=>{
  // Previously content remained visible from t=70s expiry until t=75s fetch timeout.
  const hard=await harness({fetcher:(index,request)=>index===1?Promise.resolve(allowed(0,70000)):hangUntilAbort(request)});
  await hard.advance(0);assert.equal(hard.visible(),true);assert.equal(hard.adapted,1);assert.equal(hard.scripts.length,3);
  await hard.advance(60000);assert.equal(hard.calls.length,2);assert.equal(hard.visible(),true);
  await hard.advance(9999);assert.equal(hard.visible(),true);
  await hard.advance(1);hard.closed();assert.equal(hard.now,70000);assert.equal(hard.calls.length,2,'hard timer must not duplicate an in-flight request');
  await hard.advance(5000);hard.closed();assert.match(hard.w.document.getElementById('previewGateMsg').textContent,/تعذر فتح المعاينة/);
  reports.push('PASS hard deadline hides at exactly t=70s while t=60s refresh remains hung until t=75s.');

  const failure=await harness({fetcher:()=>Promise.reject(Error('Synthetic NetworkError'))});await failure.advance(0);failure.closed();assert.equal(failure.adapted,0);assert.equal(failure.scripts.length,0);assert.equal(failure.renders,0);
  reports.push('PASS initial network failure never adapts customer JSON, loads scripts, renders content or authorizes.');

  for(const path of ['/preview/','/p/INVALID0']){const invalid=await harness({path,fetcher:()=>{throw Error('must not fetch')}});await invalid.advance(1000);invalid.closed();assert.equal(invalid.calls.length,0);assert.equal(invalid.adapted,0);assert.equal(invalid.scripts.length,0);}
  reports.push('PASS missing/malformed short codes make no API requests and never load customer payload/scripts.');

  const unknown=await harness({fetcher:()=>Promise.resolve(denied())});await unknown.advance(0);unknown.closed();assert.equal(unknown.calls.length,1);assert.equal(unknown.adapted,0);assert.equal(unknown.scripts.length,0);
  unknown.w.dispatchEvent(new unknown.w.Event('offline'));unknown.w.dispatchEvent(new unknown.w.Event('online'));await unknown.advance(120000);unknown.closed();assert.equal(unknown.calls.length,1);
  reports.push('PASS well-formed unknown short code remains terminal; offline/online cannot restart or unlock it.');

  const expired=await harness({fetcher:()=>Promise.resolve(denied('preview_expired'))});await expired.advance(0);expired.closed();const expiryMessage=expired.w.document.getElementById('previewGateMsg').textContent;assert.match(expiryMessage,/انتهت صلاحية المعاينة/);expired.w.dispatchEvent(new expired.w.Event('offline'));await expired.advance(0);assert.equal(expired.w.document.getElementById('previewGateMsg').textContent,expiryMessage);
  reports.push('PASS expired response uses Arabic premium gate and later offline event cannot replace expiry state.');

  const slow=await harness({scriptDelay:2000,fetcher:index=>Promise.resolve(index===1?allowed(0,5000):denied('preview_expired'))});await slow.advance(4999);slow.closed();await slow.advance(1001);slow.closed();assert.equal(slow.calls.length,2);assert.equal(slow.scripts.length,3);assert.match(slow.w.document.getElementById('previewGateMsg').textContent,/انتهت صلاحية المعاينة/);
  reports.push('PASS shell loading crosses 5s expiry; completed scripts at 6s never reveal content and server is rechecked.');

  const stalled=await harness({scriptDelay:null,fetcher:()=>Promise.resolve(allowed(0,70000))});await stalled.advance(15000);stalled.closed();assert.equal(stalled.scripts.length,1);assert.equal(stalled.w.document.querySelectorAll('script').length,0);assert.match(stalled.w.document.getElementById('previewGateMsg').textContent,/تعذر فتح المعاينة/);assert.equal(stalled.renders,0);
  reports.push('PASS stalled shell script times out at 15s, is removed, and content stays gated.');

  for(const call of hard.calls){assert.equal(call.options.cache,'no-store');assert.equal(call.options.credentials,'omit');assert.ok(new URL(call.url).searchParams.get('request'));}
  reports.push('PASS API requests use no-store, omit credentials and a per-request nonce.');

  // An already authorized foreground session may continue without creating a grant.
  const continuity=await harness({fetcher:index=>index===1?Promise.resolve(allowed(0,120000)):Promise.reject(new TypeError('Synthetic network failure'))});
  await continuity.advance(0);await continuity.advance(1000);continuity.w.dispatchEvent(new continuity.w.Event('offline'));assert.equal(continuity.visible(),true);
  let banner=continuity.w.document.getElementById('previewOfflineStatus');assert.ok(banner);assert.equal(banner.nextElementSibling.id,'main');assert.equal(banner.getAttribute('role'),'status');assert.equal(banner.lang,'ar');assert.doesNotMatch(banner.textContent,/[\u0590-\u05ff]/);
  for(const [locale,phrase] of [['en','Connection interrupted'],['he','החיבור נותק'],['ru','Связь прервана'],['ar','انقطع الاتصال']]){continuity.w.document.documentElement.lang=locale;await flush();assert.equal(banner.lang,locale);assert.match(banner.textContent,new RegExp(phrase));}
  await continuity.advance(59000);assert.equal(continuity.calls.length,2);assert.equal(continuity.visible(),true);assert.ok(continuity.w.document.getElementById('previewOfflineStatus'));
  await continuity.advance(59999);assert.equal(continuity.visible(),true);await continuity.advance(1);continuity.closed();assert.equal(continuity.now,120000);assert.equal(continuity.w.document.getElementById('previewOfflineStatus'),null);assert.equal(continuity.adapted,1);
  reports.push('PASS offline foreground session retains its existing grant through transport retries, shows status in all four languages, and gates exactly at unchanged t=120s deadline.');

  const refreshFailure=await harness({fetcher:index=>index===1?Promise.resolve(allowed(0,120000)):Promise.reject(new TypeError('Synthetic network failure'))});await refreshFailure.advance(60000);assert.equal(refreshFailure.visible(),true);assert.ok(refreshFailure.w.document.getElementById('previewOfflineStatus'));
  reports.push('PASS a fetch transport failure without an offline event also preserves only the existing visible session.');

  const recovery=await harness({fetcher:(index,request)=>Promise.resolve(allowed(request.now,120000-request.now))});await recovery.advance(0);recovery.w.dispatchEvent(new recovery.w.Event('offline'));assert.ok(recovery.w.document.getElementById('previewOfflineStatus'));recovery.w.dispatchEvent(new recovery.w.Event('online'));await recovery.advance(0);assert.equal(recovery.visible(),true);assert.equal(recovery.w.document.getElementById('previewOfflineStatus'),null);assert.equal(recovery.calls.length,2);
  reports.push('PASS fresh successful server authorization removes the offline status.');

  for(const status of [401,403,404,500]){
    const refusal=await harness({fetcher:index=>Promise.resolve(index===1?allowed(0,120000):denied('preview_not_found',status))});await refusal.advance(0);refusal.w.dispatchEvent(new refusal.w.Event('offline'));assert.equal(refusal.visible(),true);await refusal.advance(60000);refusal.closed();assert.equal(refusal.w.document.getElementById('previewOfflineStatus'),null);
  }
  const malformed=await harness({fetcher:index=>Promise.resolve(index===1?allowed(0,120000):{ok:true,status:200,headers:{get:()=>null},json:async()=>{throw new SyntaxError('Synthetic bad JSON')}})});await malformed.advance(60000);malformed.closed();assert.equal(malformed.w.document.getElementById('previewOfflineStatus'),null);
  const appError=await harness({fetcher:()=>Promise.resolve(allowed(0,120000))});await appError.advance(0);appError.w.crypto.randomUUID=()=>{throw new TypeError('Synthetic application bug')};await appError.advance(60000);appError.closed();assert.equal(appError.w.document.getElementById('previewOfflineStatus'),null);
  reports.push('PASS all server denials, malformed JSON and application TypeErrors fail closed; none can use offline continuity.');

  let restoredOnline=false;
  const restore=await harness({fetcher:(index,request)=>index===1||restoredOnline?Promise.resolve(allowed(request.now,120000-request.now)):Promise.reject(new TypeError('Synthetic network failure'))});await restore.advance(0);restore.w.dispatchEvent(new restore.w.Event('offline'));assert.equal(restore.visible(),true);restore.setHidden(true);restore.setHidden(false);await restore.advance(0);restore.closed();assert.equal(restore.w.document.getElementById('previewOfflineStatus'),null);assert.equal(restore.calls.length,2);restoredOnline=true;restore.w.dispatchEvent(new restore.w.Event('online'));await restore.advance(0);assert.equal(restore.visible(),true);assert.equal(restore.calls.length,3);
  const cachedReturn=await harness({fetcher:index=>index===1?Promise.resolve(allowed(0,120000)):Promise.reject(new TypeError('Synthetic network failure'))});await cachedReturn.advance(0);const restoredPage=new cachedReturn.w.Event('pageshow');Object.defineProperty(restoredPage,'persisted',{value:true});cachedReturn.w.dispatchEvent(restoredPage);await cachedReturn.advance(0);cachedReturn.closed();assert.equal(cachedReturn.calls.length,2);
  reports.push('PASS tab visibility return and BFCache restore gate first, require fresh server authorization, and cannot reopen offline.');

  const hiddenOffline=await harness({fetcher:()=>Promise.resolve(allowed(0,120000))});await hiddenOffline.advance(0);hiddenOffline.setHidden(true);hiddenOffline.w.dispatchEvent(new hiddenOffline.w.Event('offline'));hiddenOffline.closed();assert.equal(hiddenOffline.w.document.getElementById('previewOfflineStatus'),null);
  reports.push('PASS a hidden document cannot acquire offline session continuity.');

  const abortedRefresh=await harness({fetcher:(index,request)=>index===1?Promise.resolve(allowed(0,180000)):hangUntilAbort(request)});await abortedRefresh.advance(75000);assert.equal(abortedRefresh.visible(),true);assert.ok(abortedRefresh.w.document.getElementById('previewOfflineStatus'));await abortedRefresh.advance(105000);abortedRefresh.closed();
  const genericFetchError=await harness({fetcher:index=>index===1?Promise.resolve(allowed(0,120000)):Promise.reject(Error('Synthetic generic fetch error'))});await genericFetchError.advance(60000);genericFetchError.closed();genericFetchError.w.dispatchEvent(new genericFetchError.w.Event('offline'));await genericFetchError.advance(0);genericFetchError.closed();assert.equal(genericFetchError.w.document.getElementById('previewOfflineStatus'),null);
  reports.push('PASS AbortError before expiry retains the existing grant, generic Error fails closed, and offline after a gate cannot reveal content.');
  console.log(reports.join('\n'));
})().catch(error=>{console.error(error);process.exitCode=1});
