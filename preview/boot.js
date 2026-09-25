/* Public preview authorization is always obtained from the server. */
(async function bootPreview() {
  const API = 'https://asnnvwoersrhrgdantll.supabase.co/functions/v1/triply-preview-app';
  const code = (location.pathname.match(/^\/p\/([^/]+)\/?$/)?.[1] || new URLSearchParams(location.search).get('code') || '').toUpperCase();
  const gate = document.getElementById('previewGate');
  const message = document.getElementById('previewGateMsg');
  const app = document.getElementById('app');
  const copy = {
    he:{loading:'פותחים את הטיול שלכם…',expired:'תוקף התצוגה המקדימה הסתיים',expiryNote:'התצוגה המקדימה זמינה ל־24 שעות. פנו לאביה להמשך הטיול.',failed:'לא ניתן לפתוח את התצוגה כרגע',network:'נדרש חיבור לאינטרנט כדי לאמת גישה לתצוגה המקדימה.',retry:'נסו שוב',invalid:'קישור התצוגה אינו זמין'},
    en:{loading:'Opening your trip…',expired:'Your preview has expired',expiryNote:'Previews are available for 24 hours. Contact Avia to continue your trip.',failed:'Your preview cannot open right now',network:'An internet connection is needed to authorize access to your preview.',retry:'Try again',invalid:'This preview link is unavailable'},
    ru:{loading:'Открываем вашу поездку…',expired:'Срок просмотра истёк',expiryNote:'Предпросмотр доступен 24 часа. Свяжитесь с Авией, чтобы продолжить.',failed:'Не удалось открыть предпросмотр',network:'Для проверки доступа к предпросмотру нужен интернет.',retry:'Повторить',invalid:'Ссылка на предпросмотр недоступна'},
    ar:{loading:'جارٍ فتح رحلتكم…',expired:'انتهت صلاحية المعاينة',expiryNote:'المعاينة متاحة لمدة 24 ساعة. تواصلوا مع أڤيا لمتابعة الرحلة.',failed:'تعذر فتح المعاينة الآن',network:'يلزم الاتصال بالإنترنت للتحقق من صلاحية الوصول إلى المعاينة.',retry:'إعادة المحاولة',invalid:'رابط المعاينة غير متاح'}
  };
  const offlineCopy = {
    he:'החיבור נותק. הטיול שכבר נפתח נשאר זמין; שירותים חיים דורשים אינטרנט.',
    en:'Connection interrupted. Your open trip remains available; live features need internet.',
    ru:'Связь прервана. Открытая поездка остаётся доступной; онлайн-функциям нужен интернет.',
    ar:'انقطع الاتصال. تبقى الرحلة المفتوحة متاحة؛ وتتطلب الخدمات المباشرة الإنترنت.'
  };
  let language = ['he','en','ru','ar'].includes(navigator.language?.slice(0,2)) ? navigator.language.slice(0,2) : 'en';
  const scriptsLoaded = new Set();
  let timer, hardTimer, deadline = 0, loaded = false, checking = null, terminal = false, expiresIn = 0, unlimited = false, offlineNotice = null;
  window.NAVIGAM_PREVIEW_URL = 'https://www.navigam.com/p/' + encodeURIComponent(code);
  window.NAVIGAM_AUTHORIZED = false;
  function clearOfflineStatus() { offlineNotice?.remove(); offlineNotice=null; }
  function updateOfflineStatus() {
    if(!offlineNotice)return;
    const locale=copy[document.documentElement.lang]?document.documentElement.lang:language;
    offlineNotice.textContent=offlineCopy[locale];
    offlineNotice.lang=locale;offlineNotice.dir=['he','ar'].includes(locale)?'rtl':'ltr';
  }
  function retainOpenSession() {
    // Continue only a visible grant already obtained from the server. Neither
    // this branch nor a failed refresh may create, renew or extend that grant.
    if(!loaded || terminal || !window.NAVIGAM_AUTHORIZED || document.hidden || app.hidden || app.inert || !gate.hidden || gate.style.display!=='none' || performance.now()>=deadline)return false;
    if(!offlineNotice){
      offlineNotice=document.createElement('div');offlineNotice.id='previewOfflineStatus';
      offlineNotice.setAttribute('role','status');offlineNotice.setAttribute('aria-live','polite');
      offlineNotice.style.cssText='flex-shrink:0;margin:0;padding:8px 14px;border-bottom:1px solid #cfeef3;background:#eaf8fc;color:#073752;font-size:12px;line-height:1.45';
      document.getElementById('main').before(offlineNotice);
    }
    updateOfflineStatus();return true;
  }
  new MutationObserver(updateOfflineStatus).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  function showGate(state, responseLanguage) {
    if(terminal && state!=='expired' && state!=='invalid')return;
    if(terminal){clearTimeout(timer);clearTimeout(hardTimer);}
    clearOfflineStatus();
    if (responseLanguage && copy[responseLanguage]) language = responseLanguage;
    else if (typeof LOCALE !== 'undefined' && copy[LOCALE]) language = LOCALE;
    const words = copy[language];
    document.documentElement.lang = language;
    document.documentElement.dir = ['he','ar'].includes(language) ? 'rtl' : 'ltr';
    app.hidden = true; app.inert = true; gate.hidden = false; gate.style.display = 'flex';
    window.NAVIGAM_AUTHORIZED = false;
    if (typeof stopMap === 'function') stopMap();
    if (typeof stopVoice === 'function') stopVoice();
    message.replaceChildren();
    const heading = document.createElement('h1'); heading.textContent = words[state] || words.failed;
    message.append(heading);
    if (state !== 'loading') {
      const note = document.createElement('p'); note.textContent = state === 'expired' ? words.expiryNote : words.network; message.append(note);
      if (!terminal) {const retry=document.createElement('button');retry.className='btn primary full';retry.textContent=words.retry;retry.addEventListener('click',()=>location.reload());message.append(retry);}
    }
  }
  showGate('loading');
  if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6,16}$/.test(code)) { terminal=true;showGate('invalid');return; }
  // Legacy root workers cached every request, including access decisions. Remove
  // only workers controlling this preview and purge their gated response entries.
  async function removeLegacyPreviewCache() {
    if (!('serviceWorker' in navigator)) return false;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const matching = registrations.filter(reg => location.href.startsWith(reg.scope));
    for (const registration of matching) await registration.unregister();
    if ('caches' in window) {
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const req of await cache.keys()) {
          const url = new URL(req.url);
          if (/^\/(p|preview)(\/|$)/.test(url.pathname) || url.pathname.includes('/triply-preview-app')) await cache.delete(req);
        }
      }
    }
    if (navigator.serviceWorker.controller) {
      const key='navigam-preview-worker-reset';
      if (sessionStorage.getItem(key)==='1') throw Error('legacy_worker');
      sessionStorage.setItem(key,'1');location.reload();return true;
    }
    sessionStorage.removeItem('navigam-preview-worker-reset');return false;
  }
  async function loadScript(name) {
    if(scriptsLoaded.has(name))return;
    return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/preview/'+name;const limit=setTimeout(()=>{script.remove();reject(Error('shell_timeout'));},15000);script.onload=()=>{clearTimeout(limit);scriptsLoaded.add(name);resolve();};script.onerror=()=>{clearTimeout(limit);reject(Error('shell_load'));};document.head.append(script);});
  }
  async function authorize() {
    if (checking || terminal) return checking;
    clearTimeout(timer);
    checking = (async () => {
      const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),15000), started=performance.now();
      let transportFailure=false;
      try {
        const requestUrl=API+'?code='+encodeURIComponent(code)+'&request='+crypto.randomUUID();
        let response;
        try {
          response=await fetch(requestUrl,{cache:'no-store',credentials:'omit',signal:controller.signal});
        } catch(error) {
          transportFailure=error?.name==='TypeError' || error?.name==='AbortError';
          throw error;
        }
        const data = await response.json();
        if (!response.ok || data.ok !== true) {
          terminal = response.status===401 || response.status===403 || response.status===404;
          showGate(data.error==='preview_expired'?'expired':'invalid',data.language);
          return;
        }
        language = copy[data.language] ? data.language : 'en';
        // Full/unlimited trips intentionally have no expires_at. Preview links still use server expiry.
        unlimited = data.authorization?.unlimited === true || data.preview?.mode === 'full';
        const serverNow = Date.parse(data.server_now || response.headers.get('date'));
        if (unlimited) {
          expiresIn = Number.POSITIVE_INFINITY;
          deadline = Number.POSITIVE_INFINITY;
          clearTimeout(hardTimer);
        } else {
          const expiry = Date.parse(data.expires_at);
          expiresIn = expiry - serverNow - (performance.now()-started);
          if (!Number.isFinite(expiresIn) || expiresIn<=0) {terminal=true;showGate('expired',language);return;}
          deadline=performance.now()+expiresIn;
          clearTimeout(hardTimer);
          hardTimer=setTimeout(()=>{showGate('loading');authorize();},Math.max(1,expiresIn));
        }
        if (!loaded) {
          window.NAVIGAM_CONFIG=adaptPreview(data,code);
          for (const file of ['premium.js','memories.js','features.js','map.js']) await loadScript(file);
          loaded=true;
          updateChrome();render();
        }
        if(performance.now()>=deadline){showGate('loading');timer=setTimeout(authorize,0);return;}
        if(loaded && gate.style.display !== 'none'){const main=document.getElementById('main'),scroll=main.scrollTop;render();main.scrollTop=scroll;}
        clearOfflineStatus();
        app.hidden=false;app.inert=false;gate.style.display='none';gate.hidden=true;
        window.NAVIGAM_AUTHORIZED=true;
        clearTimeout(timer);
        timer=setTimeout(()=>{if(!unlimited && expiresIn<=60000)showGate('loading');authorize();},unlimited ? 60000 : Math.min(60000,Math.max(250,deadline-performance.now())));
      } catch {
        if(!transportFailure || !retainOpenSession())showGate('failed',language);
        clearTimeout(timer);timer=setTimeout(authorize,30000);
      }
      finally {clearTimeout(timeout);checking=null;}
    })();
    return checking;
  }
  try {if(await removeLegacyPreviewCache())return;}catch{showGate('failed');return;}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(!unlimited)showGate('loading');authorize();}});
  window.addEventListener('pageshow',event=>{if(event.persisted){if(!unlimited)showGate('loading');authorize();}});
  window.addEventListener('online',authorize);
  window.addEventListener('offline',()=>{if(!retainOpenSession())showGate('failed');});
  await authorize();
})();
