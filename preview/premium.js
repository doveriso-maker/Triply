
const CONFIG=window.NAVIGAM_CONFIG;
// Independent client configuration; shared UI and behavior.
const LOCALES=['he','en','ru','ar'];
let LOCALE=CONFIG.client.language;
const storageKey=k=>'navigam:'+CONFIG.id+':'+k;
try{const raw=localStorage.getItem(storageKey('language'));let saved;try{saved=JSON.parse(raw)}catch{saved=raw}if(LOCALES.includes(saved))LOCALE=saved}catch(e){}
function loc(v){if(v&&typeof v==='object'&&!Array.isArray(v))return v[LOCALE]??v[CONFIG.client.language]??v.en??'';return v??''}
function t(k){return I18N[LOCALE][k]??I18N.en[k]??k}
function message(s){const m=MESSAGES[s];return m?m[LOCALES.indexOf(LOCALE)]:s}
function localizeData(value,key=''){if(Array.isArray(value))return value.map(x=>localizeData(x));if(value&&typeof value==='object'){if(LOCALES.some(l=>l in value))return loc(value);return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,localizeData(v,k)]))}if(typeof value==='string'&&!['id','q','type','time','date','dates'].includes(key))return message(value);return value}
function dateRange(){const fmt=new Intl.DateTimeFormat(LOCALE,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});return fmt.format(new Date(CONFIG.trip.startDate+'T12:00:00Z'))+' – '+fmt.format(new Date(CONFIG.trip.endDate+'T12:00:00Z'))}
function typeLabel(type){return t(({'הכל':'all','מסעדה':'restaurant','יקב':'winery','טבע':'nature','חיי לילה':'nightlife','קניות':'shopping'})[type]||type)}
function emptyCard(text){return `<div class="card empty-state"><span>◇</span><p>${escapeHtml(text)}</p></div>`}
function languageSelect(id){return `<select class="language-select" id="${id}" aria-label="${t('language')}" onchange="setLocale(this.value)">${LOCALES.map(l=>`<option value="${l}" ${l===LOCALE?'selected':''}>${({he:'עברית',en:'English',ru:'Русский',ar:'العربية'})[l]}</option>`).join('')}</select>`}
function updateChrome(){document.querySelectorAll('.start-arrow').forEach(n=>{n.textContent=['he','ar'].includes(LOCALE)?'←':'→'});document.documentElement.lang=LOCALE;document.documentElement.dir=['he','ar'].includes(LOCALE)?'rtl':'ltr';document.title='NAVIGAM · '+loc(CONFIG.trip.title);document.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=t(n.dataset.i18n)});document.getElementById('welcomeTrip').textContent=loc(CONFIG.trip.title);document.getElementById('welcomeLanguage').innerHTML=languageSelect('entryLanguage');document.querySelectorAll('.appbar .side')[0].setAttribute('aria-label',t('profile'));document.querySelectorAll('.appbar .side')[1].setAttribute('aria-label',t('home'));document.querySelector('.bottom').setAttribute('aria-label',t('navigate'))}
function setLocale(locale){if(!LOCALES.includes(locale))return;closeSheet();LOCALE=locale;DATA=localizeData(CONFIG.data);S.transSrc=locale;S.transDst=CONFIG.destination.language===locale?'en':CONFIG.destination.language;translationLanguage=S.transDst;translationDraft='';translationOutput='';translationValid=false;chatHistory.length=0;saveValue('language',locale);updateChrome();render()}
const PHRASES={he:'שלום, יש לנו הזמנה לשניים. אפשר בבקשה עזרה?',en:'Hello, we have a reservation for two. Could you please help us?',ru:'Здравствуйте, у нас бронь на двоих. Не могли бы вы помочь?',ar:'مرحباً، لدينا حجز لشخصين. هل يمكنك مساعدتنا من فضلك؟',sq:'Përshëndetje, kemi një rezervim për dy persona. A mund të na ndihmoni, ju lutem?',el:'Γεια σας, έχουμε κράτηση για δύο άτομα. Μπορείτε να μας βοηθήσετε;',it:'Buongiorno, abbiamo una prenotazione per due. Può aiutarci, per favore?',fr:'Bonjour, nous avons une réservation pour deux. Pouvez-vous nous aider ?',es:'Hola, tenemos una reserva para dos. ¿Puede ayudarnos, por favor?'};

let sessionExchange=null;

const tripStorage={getItem:k=>localStorage.getItem(storageKey(k)),setItem:(k,v)=>localStorage.setItem(storageKey(k),v)};

/* WORK NEXT: incremental QA fixes; original trip data retained. */
function readSaved(key,fallback,valid){try{const raw=tripStorage.getItem(key);if(raw===null)return fallback;const value=JSON.parse(raw);return valid(value)?value:fallback}catch(e){return fallback}}
function saveValue(key,value){try{tripStorage.setItem(key,JSON.stringify(value));return true}catch(e){toast('השינוי נשמר להפעלה זו בלבד; אחסון הדפדפן אינו זמין.');return false}}
let DATA=localizeData(CONFIG.data);
const HERO=CONFIG.images.hero;
const IMG=CONFIG.images;
const S={route:'home',day:readSaved('selected_day',0,x=>Number.isInteger(x)&&x>=0&&x<DATA.tripDays.length),placeFilter:'all',favorites:new Set(readSaved('nav_favs',[],Array.isArray)),check:readSaved('nav_check',{},x=>x && typeof x==='object' && !Array.isArray(x)),offline:false,transSrc:LOCALE,transDst:CONFIG.destination.language===LOCALE?'en':CONFIG.destination.language,live:false};
const langNames={he:'עברית',sq:'אלבנית',el:'יוונית',en:'אנגלית',ar:'ערבית',ru:'רוסית',it:'איטלקית'};
const speechLocale={he:'he-IL',sq:'sq-AL',el:'el-GR',en:'en-US',ar:'ar-SA',ru:'ru-RU',it:'it-IT',fr:'fr-FR',es:'es-ES'};
function enterApp(){document.getElementById('splash').classList.remove('active');document.getElementById('live').classList.add('active');render();if(typeof memoryMaybeAutoReel==='function')setTimeout(memoryMaybeAutoReel,350)}
function goSplash(){document.getElementById('live').classList.remove('active');document.getElementById('splash').classList.add('active')}
function route(r){S.route=r;document.querySelectorAll('.nav[data-route]').forEach(n=>n.classList.toggle('active',n.dataset.route===r));render()}
function render(){if(!window.NAVIGAM_CONFIG)return;stopMap();if(DATA.tripDays[S.day]?.locked)S.day=0;let m=document.getElementById('main');m.scrollTop=0;({home:renderHome,itinerary:renderItinerary,map:renderMap,favorites:renderFavorites,places:renderPlaces,trending:renderTrending,hotels:renderHotels,memories:renderMemories,info:renderInfo,weather:renderWeather,currency:renderCurrency,checklist:renderChecklist,offline:renderOffline,profile:renderProfile,support:renderSupport}[S.route]||renderHome)(m)}
function renderHome(m){const d=DATA.tripDays[S.day],first=d.items[0];m.innerHTML=`<div class="home-hero premium"><img src="${escapeHtml(HERO)}" onerror="imageFailed(this)" alt="${escapeHtml(loc(CONFIG.destination.name))}"><div class="home-copy"><div class="eyebrow">NAVIGAM · ${escapeHtml(loc(CONFIG.destination.name))}</div><h1>${escapeHtml(loc(CONFIG.trip.title))}</h1><p>${dateRange()} · ${DATA.tripDays.length} ${t('days')} · ${escapeHtml(loc(CONFIG.client.party))}</p></div></div><div class="card next-card"><div class="section-head"><h2>${t('selectedDay')}</h2><span>${t('day')} ${S.day+1} · ${d.date}</span></div><div class="next-row"><div class="timebox">${escapeHtml(first.time)}</div><div><strong>${escapeHtml(first.title)}</strong><small>${escapeHtml(first.sub)}</small></div><button class="btn ghost compact" onclick="route('itinerary')">${t('viewDay')}</button></div></div><div class="quick premium-quick">${(CONFIG.preview?.mode==='full'?(DATA.trends?.length?[['itinerary','🗓'],['map','⌖'],['places','♧'],['trending','🔥'],['hotels','⌂'],['memories','📸']]:[['itinerary','🗓'],['map','⌖'],['places','♧'],['hotels','⌂'],['memories','📸'],['offline','↓']]):(DATA.trends?.length?[['itinerary','🗓'],['map','⌖'],['places','♧'],['trending','🔥'],['hotels','⌂'],['offline','↓']]:[['itinerary','🗓'],['map','⌖'],['places','♧'],['hotels','⌂'],['nightlife','♫'],['offline','↓']])).map(([r,icon],i)=>`<button class="qbtn q${i+1}" onclick="${r==='nightlife'?'openNightlife()':`route('${r}')`}"><i>${icon}</i><span>${t(r)}</span></button>`).join('')}</div><div class="card translate-card premium-card"><div class="translate-icon">◎</div><div><h3>${t('translate')}</h3><p>${escapeHtml(translationLanguageName(LOCALE))} ⇄ ${escapeHtml(translationLanguageName(CONFIG.destination.language))}</p></div><button class="btn primary compact" onclick="openAvia('translate')">${t('openTranslate')}</button></div>`}
function renderItinerary(m){const d=DATA.tripDays[S.day];m.innerHTML=`<div class="screen-title">${t('itinerary')}</div><div class="trip-head"><div class="topline"><div><h2>${escapeHtml(loc(CONFIG.destination.name))}</h2><p>${dateRange()}</p></div><span class="tag">${S.day+1} / ${DATA.tripDays.length}</span></div><div class="trip-cover"><img src="${escapeHtml(IMG.itinerary)}" onerror="imageFailed(this)" alt="${escapeHtml(loc(CONFIG.destination.name))}"></div></div>${dayTabs(false)}<div class="day-heading"><h3>${escapeHtml(d.title)}</h3><span>${d.date}</span></div>${d.summary?`<p class="route-note">${escapeHtml(d.summary)}</p>`:''}<div class="timeline">${d.items.map((e,i)=>`<div class="event"><div class="event-time">${e.time}</div><div class="dot"></div><div class="event-body"><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.sub)}</small>${memoryButton({source_type:'itinerary',source_key:e.id,source_label:e.title,place_id:e.placeId,trip_day_id:d.id,day_number:S.day+1,query:e.q,latitude:e.latitude,longitude:e.longitude},true)}</div><div class="stop-nav">${e.navigationResolved?`<button class="navmini" aria-label="Google Maps ${i+1}" onclick="maps('${jsq(e.q)}')">G</button><button class="navmini" aria-label="Waze ${i+1}" onclick="waze('${jsq(e.q)}')">W</button>`:`<span class="route-note">${t('locationPending')}</span>`}</div></div>`).join('')}</div>`}
function placeHtml(p){const saved=S.favorites.has(p.id),url=IMG.places[p.id];return `<div class="card place" data-place-id="${escapeHtml(p.id)}"><div class="place-thumb">${url?`<img src="${escapeHtml(url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="imageFailed(this)">`:`<div class="image-placeholder" role="img" aria-label="${escapeHtml(p.name)}"><span>◇</span><small>${escapeHtml(p.name)}</small></div>`}</div><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.area)} · ${typeLabel(p.type)}</p><p>${escapeHtml(p.tag)}</p>${photoNote(CONFIG.imagePresentation?.places?.[p.id])}${navButtons(p.q)}${memoryButton({source_type:'place',source_key:p.id,source_label:p.name,place_id:p.id,trip_day_id:DATA.tripDays[S.day]?.id,day_number:S.day+1,query:p.q,latitude:p.latitude,longitude:p.longitude})}</div><button class="heart ${saved?'saved':''}" aria-label="${t('savePlace')}" aria-pressed="${saved}" onclick="toggleFav('${jsq(p.id)}')">${saved?'♥':'♡'}</button></div>`}

function openNightlife(){S.placeFilter='nightlife';route('places')}
function renderPlaces(m){
  const useful=DATA.places.filter(p=>!['transport','hotel','rest'].includes(p.type));
  const order=['restaurant','shopping','attractions','culture','nature','wellness','family','nightlife'];
  const types=['all',...order.filter(type=>useful.some(p=>p.type===type||(type==='family'&&p.familyFriendly)))];
  if(!types.includes(S.placeFilter))S.placeFilter='all';
  const list=useful.filter(p=>S.placeFilter==='all'||p.type===S.placeFilter||(S.placeFilter==='family'&&p.familyFriendly));
  m.innerHTML=`<div class="screen-title">${t('places')}</div><div class="tabs">${types.map(v=>`<button class="tab ${v===S.placeFilter?'active':''}" onclick="S.placeFilter='${v}';render()">${typeLabel(v)}</button>`).join('')}</div><div class="cards">${list.map(placeHtml).join('')||emptyCard(t('noPlaces'))}</div>`;
}
function platformName(p){return ({tiktok:'TikTok',instagram:'Instagram',facebook:'Facebook'})[p]||p}
function trendCard(item){
  const badges=(item.platforms||[]).map(p=>`<span class="trend-badge ${escapeHtml(p)}">${escapeHtml(platformName(p))}</span>`).join('');
  const sources=(item.socialSources||[]).map(s=>`<a class="trend-source" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(platformName(s.platform))}</a>`).join('');
  return `<article class="card trend-card"><div class="trend-head"><div><span class="trend-kicker">🔥 ${t('trendingNow')}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.area||item.category)}</p></div><div class="trend-badges">${badges}</div></div><p class="trend-desc">${escapeHtml(item.description)}</p><div class="trend-why"><strong>${t('whyTrending')}</strong><p>${escapeHtml(item.whyTrending)}</p></div><div class="trend-why match"><strong>${t('whyForYou')}</strong><p>${escapeHtml(item.whyMatch)}</p></div><div class="trend-footer"><div class="trend-sources"><span>${t('socialSignals')}</span>${sources}</div>${navButtons(item.q)}${memoryButton({source_type:'trend',source_key:item.id,source_label:item.name,trip_day_id:DATA.tripDays[S.day]?.id,day_number:S.day+1,query:item.q})}</div></article>`;
}
function renderTrending(m){
  const list=Array.isArray(DATA.trends)?DATA.trends:[];
  m.innerHTML=`<div class="screen-title">${t('trending')}</div><p class="screen-sub trend-intro">${t('trendingIntro')}</p><div class="cards trend-list">${list.map(trendCard).join('')||emptyCard(t('noTrending'))}</div><p class="trend-disclaimer">${t('trendDisclaimer')}</p>`;
}



function renderFavorites(m){const list=DATA.places.filter(p=>S.favorites.has(p.id));m.innerHTML=`<div class="screen-title">${t('favorites')}</div><div class="cards">${list.map(p=>`<div class="card saved-place"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.area)} · ${typeLabel(p.type)}</p>${navButtons(p.q)}</div><button class="heart saved" aria-label="${t('savePlace')}" onclick="toggleFav('${jsq(p.id)}')">♥</button></div>`).join('')||emptyCard(t('savedEmpty'))}</div>`}
function renderHotels(m){m.innerHTML=`<div class="screen-title">${t('hotels')}</div><p class="screen-sub">${dateRange()}</p><div class="cards two">${DATA.hotels.map((h,i)=>`<article class="card hotel-card"><div class="hotel-img"><img src="${escapeHtml(IMG.hotels[h.id])}" onerror="imageFailed(this)" alt="${escapeHtml(h.name)}"></div><div class="hotel-body"><span class="tag">${escapeHtml(h.dates)}</span><h3>${escapeHtml(h.name)}</h3><p>${escapeHtml(h.city)} · ${escapeHtml(h.note)}</p>${photoNote(CONFIG.imagePresentation?.hotels?.[h.id])}${navButtons(h.q)}</div></article>`).join('')||emptyCard(t('noHotels'))}</div>`}
function renderInfo(m){m.innerHTML=`<div class="screen-title">${t('info')}</div><div class="card info-list">${([['weather','☀'],['currency','€'],['map','⌖'],...(CONFIG.preview?.mode==='full'?[['memories','📸']]:[]),...(DATA.trends?.length?[['trending','🔥']]:[]),['offline','↓'],['checklist','☑'],['support','?']]).map(([r,icon])=>`<button class="info-row row-button" onclick="route('${r}')"><span class="info-ico">${icon}</span><strong>${t(r)}</strong><span class="chev">›</span></button>`).join('')}<button class="info-row row-button" onclick="openAvia('translate')"><span class="info-ico">◎</span><strong>${t('translate')}</strong><span class="chev">›</span></button></div>`}
function infoAction(i){if(i===0)return route('weather');if(i===1)return route('currency');if(i===5)return openAvia('translate');toast(DATA.info[i][1])}
function renderProfile(m){m.innerHTML=`<div class="screen-title">${t('profile')}</div><div class="profile-head"><div class="avatar">◎</div><div><h2>${escapeHtml(loc(CONFIG.client.name))}</h2><p>${escapeHtml(loc(CONFIG.trip.title))}</p></div></div><div class="card">${([['itinerary','myTrips'],['favorites','favorites'],...(CONFIG.preview?.mode==='full'?[['memories','memories']]:[]),...(DATA.trends?.length?[['trending','trending']]:[]),['info','info'],['checklist','checklist'],['offline','offline'],['support','support']]).map(([r,label])=>`<button class="setting row-button" onclick="route('${r}')"><span>${t(label)}</span><span>›</span></button>`).join('')}<div class="setting language-setting"><label for="profileLanguage">${t('language')}</label>${languageSelect('profileLanguage')}</div></div>`}
function openProfile(){route('profile')}
function toggleFav(id){S.favorites.has(id)?S.favorites.delete(id):S.favorites.add(id);saveValue('nav_favs',[...S.favorites]);toast(S.favorites.has(id)?'נשמר במועדפים':'הוסר מהמועדפים');render()}
function jsq(s){return escapeHtml(JSON.stringify(String(s)).slice(1,-1).replace(/'/g,"\\'"))}

let leafletPromise=null;
function openSheet(html){if(!document.getElementById('sheetback').classList.contains('show'))sheetFocus=document.activeElement;document.getElementById('sheet').innerHTML=html;document.getElementById('sheetback').classList.add('show');document.getElementById('live').inert=true;document.querySelector('#sheet button')?.focus()}
function closeSheet(){captureTranslation();stopVoice();translationRequest++;document.getElementById('sheetback').classList.remove('show');document.getElementById('live').inert=false;sheetFocus?.focus()}
function openAvia(tab='chat'){captureTranslation();stopVoice();translationRequest++;openSheet(`<div class="sheethead"><div><h2>${t('avia')}</h2><small>${t('aviaTag')}</small></div><button aria-label="${t('close')}" onclick="closeSheet()">✕</button></div><div class="tabs"><button class="tab ${tab==='chat'?'active':''}" onclick="openAvia('chat')">${t('chat')}</button><button class="tab ${tab==='translate'?'active':''}" onclick="openAvia('translate')">${t('translate')}</button></div>${tab==='chat'?aviaChat():aviaTranslate()}`);if(tab==='translate'){const input=document.getElementById('trIn'),output=document.getElementById('trOut');if(input)input.value=translationDraft;if(output)output.textContent=translationOutput||t('output')}}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(msg){let t=document.getElementById('toast');t.textContent=message(msg);t.classList.add('show');clearTimeout(window.__to);window.__to=setTimeout(()=>t.classList.remove('show'),2500)}
let mapGeneration=0,activeMap=null,sheetFocus=null,translationRequest=0,translationDraft='',translationOutput='',translationLanguage=CONFIG.destination.language,translationValid=false,recognition=null,voiceGeneration=0,voiceTimer=null;
const roadCache=new Map(),chatHistory=[];
function stopMap(){mapGeneration++;if(activeMap){activeMap.remove();activeMap=null}}
async function fetchJSON(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);return await response.json()}finally{clearTimeout(timer)}}
function openNavigation(q){openSheet(`<div class="sheethead"><h2>${t('navigate')}</h2><button aria-label="${t('close')}" onclick="closeSheet()">✕</button></div><p dir="auto">${escapeHtml(q)}</p>${navButtons(q)}`)}
function captureTranslation(){const input=document.getElementById('trIn');if(input)translationDraft=input.value}
function updateLiveToggle(){const button=document.getElementById('liveToggle');if(button){button.classList.toggle('on',S.live);button.setAttribute('aria-checked',String(S.live))}}
function stopVoice(){voiceGeneration++;clearTimeout(voiceTimer);S.live=false;if(recognition){const old=recognition;recognition=null;old.abort()}if('speechSynthesis'in window)speechSynthesis.cancel();updateLiveToggle()}
function toggleLive(){if(S.live){stopVoice();return}S.live=true;updateLiveToggle();recognize('src')}
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeSheet();return}if((event.key==='Enter'||event.key===' ')&&event.target.matches?.('[role="button"][tabindex]')){event.preventDefault();event.target.click()}if(event.key==='Tab'&&document.getElementById('sheetback').classList.contains('show')){const controls=[...document.getElementById('sheet').querySelectorAll('button,input,textarea,select,a[href]')].filter(x=>!x.disabled),first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVoice()});

function dayTabs(map){return `<div class="${map?'map-daytabs':'daytabs'}">${DATA.tripDays.map((d,i)=>`<button class="${map?'map-daytab':'daytab'} ${i===S.day?'active':''}" aria-pressed="${i===S.day}" onclick="selectDay(${i})">${d.locked?'🔒 ':''}${t('day')} ${i+1}</button>`).join('')}</div>`}
function navButtons(q){return `<div class="place-actions"><button class="btn ghost" onclick="maps('${jsq(q)}')">Google Maps</button><button class="btn soft" onclick="waze('${jsq(q)}')">Waze</button></div>`}
function renderSupport(m){m.innerHTML=`<div class="screen-title">${t('support')}</div><div class="card support-card"><span class="support-icon">◉</span><h2>${t('helpTitle')}</h2><p>${t('helpText')}</p><button class="btn primary full" onclick="openAvia('chat')">${t('ask')}</button>${CONFIG.support?.email?`<a class="btn ghost full" href="mailto:${escapeHtml(CONFIG.support.email)}">${t('email')}</a>`:''}</div>`}
function answerAvia(intent){appendChat(t(intent),aviaAnswer(intent))}
function appendChat(q,a){chatHistory.push({me:true,text:q},{me:false,text:a});const c=document.getElementById('chat');c.insertAdjacentHTML('beforeend',`<div class="bubble me">${escapeHtml(q)}</div><div class="bubble">${escapeHtml(a).replace(/\n/g,'<br>')}</div>`);c.scrollTop=c.scrollHeight}
function selectDay(day){if(!Number.isInteger(day)||day<0||day>=DATA.tripDays.length)return;if(DATA.tripDays[day].locked){openLockedDay(day);return;}S.day=day;saveValue('selected_day',day);render()}
function translationInputChanged(){translationRequest++;stopVoice();translationDraft=document.getElementById('trIn')?.value||'';translationOutput='';translationValid=false;const out=document.getElementById('trOut');if(out)out.textContent=t('output')}
function photoNote(meta){return meta?.kind==='atmosphere'?`<p class="photo-note">${t('photoAtmosphere')}</p>`:''}


function openLockedDay(day){openSheet(`<div class="sheethead"><h2>🔒 ${t('day')} ${day+1}</h2><button onclick="closeSheet()" aria-label="${t('close')}">✕</button></div><div class="card support-card"><h2>${t('lockedTitle')}</h2><p>${t('lockedBody')}</p><p>${t('pricing')}</p><button class="btn primary full" onclick="openAvia('chat')">${t('ask')}</button></div>`)}
function imageFailed(img){const box=img.parentElement;img.remove();box.classList.add('image-unavailable');const placeholder=document.createElement('span');placeholder.className='image-placeholder';placeholder.textContent=img.alt||t('photos');box.prepend(placeholder);}


/* NAVIGAM Memories v1 — private trip photos + on-device branded reel */
const NAVIGAM_MEMORIES_API='https://asnnvwoersrhrgdantll.supabase.co/functions/v1/triply-memories';
const MEMORY_STATE={loaded:false,loading:false,memories:[],reels:[],context:null,generating:false,progress:0};
function memoriesAvailable(){return CONFIG.preview?.mode==='full'}
function memoryButton(meta,compact=false){
  if(!memoriesAvailable())return '';
  const encoded=encodeURIComponent(JSON.stringify(meta||{}));
  return `<button class="memory-btn ${compact?'compact':''}" type="button" onclick="openMemoryCapture('${escapeHtml(encoded)}')"><span>📸</span>${t('addMoment')}</button>`;
}
function openMemoryCapture(encoded){
  if(!memoriesAvailable()){toast(t('memoryFullOnly'));return}
  let meta={source_type:'general',source_label:loc(CONFIG.destination.name),trip_day_id:DATA.tripDays[S.day]?.id,day_number:S.day+1};
  try{if(encoded)meta={...meta,...JSON.parse(decodeURIComponent(encoded))}}catch(e){}
  MEMORY_STATE.context=meta;
  openSheet(`<div class="sheethead"><div><h2>${t('addMoment')}</h2><small>${escapeHtml(meta.source_label||loc(CONFIG.destination.name))}</small></div><button aria-label="${t('close')}" onclick="closeSheet()">✕</button></div>
    <div class="memory-capture">
      <div class="memory-capture-icon">📸</div>
      <p>${t('memoryCaptureText')}</p>
      <div class="memory-capture-actions">
        <button class="btn primary full" onclick="document.getElementById('memoryCamera').click()">${t('memoryCamera')}</button>
        <button class="btn ghost full" onclick="document.getElementById('memoryGallery').click()">${t('memoryGallery')}</button>
      </div>
      <input hidden id="memoryCamera" type="file" accept="image/*" capture="environment" onchange="handleMemoryFiles(this.files)">
      <input hidden id="memoryGallery" type="file" accept="image/*" multiple onchange="handleMemoryFiles(this.files)">
      <small class="memory-privacy">🔒 ${t('memoryPrivacy')}</small>
    </div>`);
}
function openGeneralMemory(){openMemoryCapture(encodeURIComponent(JSON.stringify({source_type:'general',source_label:loc(CONFIG.destination.name),trip_day_id:DATA.tripDays[S.day]?.id,day_number:S.day+1})))}
async function memoryPosition(){
  if(!navigator.geolocation)return null;
  return await new Promise(resolve=>{
    const timer=setTimeout(()=>resolve(null),4500);
    navigator.geolocation.getCurrentPosition(p=>{clearTimeout(timer);resolve({latitude:p.coords.latitude,longitude:p.coords.longitude})},()=>{clearTimeout(timer);resolve(null)},{enableHighAccuracy:true,timeout:4000,maximumAge:60000});
  });
}
async function imageBitmapFromFile(file){
  if(window.createImageBitmap)return await createImageBitmap(file);
  return await new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=e=>{URL.revokeObjectURL(url);reject(e)};img.src=url});
}
async function prepareMemoryImage(file){
  if(!/^image\/(jpeg|png|webp)$/i.test(file.type))throw Error('unsupported_type');
  const bmp=await imageBitmapFromFile(file);
  const sw=bmp.width||bmp.naturalWidth,sh=bmp.height||bmp.naturalHeight;
  const max=1800,scale=Math.min(1,max/Math.max(sw,sh)),w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(bmp,0,0,w,h);
  bmp.close?.();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.86));
  if(!blob)throw Error('compress_failed');
  return {blob,width:w,height:h};
}
async function handleMemoryFiles(fileList){
  const files=[...(fileList||[])].slice(0,12);
  if(!files.length)return;
  const meta=MEMORY_STATE.context||{};
  const pos=await memoryPosition();
  const box=document.querySelector('.memory-capture');
  if(box)box.innerHTML=`<div class="memory-uploading"><div class="memory-spinner"></div><strong>${t('memoryUploading')}</strong><small id="memoryUploadProgress">0 / ${files.length}</small></div>`;
  let done=0;
  try{
    for(const file of files){
      const prepared=await prepareMemoryImage(file);
      const form=new FormData();
      form.append('code',CONFIG.code);form.append('kind','photo');form.append('file',prepared.blob,'memory.jpg');
      for(const key of ['source_type','source_key','source_label','place_id','trip_day_id','day_number','query'])if(meta[key]!==null&&meta[key]!==undefined&&meta[key]!=='')form.append(key,String(meta[key]));
      if(pos){form.append('latitude',String(pos.latitude));form.append('longitude',String(pos.longitude))}
      form.append('width',String(prepared.width));form.append('height',String(prepared.height));
      form.append('captured_at',new Date(file.lastModified||Date.now()).toISOString());
      form.append('original_last_modified',String(file.lastModified||Date.now()));
      const response=await fetch(NAVIGAM_MEMORIES_API,{method:'POST',body:form,credentials:'omit'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.ok!==true)throw Error(data.error||'upload_failed');
      done++;const p=document.getElementById('memoryUploadProgress');if(p)p.textContent=`${done} / ${files.length}`;
    }
    MEMORY_STATE.loaded=false;
    closeSheet();toast(t('memorySaved'));
    if(S.route==='memories')render();
  }catch(e){
    console.error('memories upload',e);
    toast(t('memoryUploadFailed'));
    closeSheet();
  }
}
async function loadMemories(force=false){
  if(!memoriesAvailable())return;
  if(MEMORY_STATE.loading)return;
  if(MEMORY_STATE.loaded&&!force)return;
  MEMORY_STATE.loading=true;
  try{
    const response=await fetch(NAVIGAM_MEMORIES_API+'?code='+encodeURIComponent(CONFIG.code),{cache:'no-store',credentials:'omit'});
    const data=await response.json();
    if(!response.ok||data.ok!==true)throw Error(data.error||'load_failed');
    MEMORY_STATE.memories=Array.isArray(data.memories)?data.memories:[];
    MEMORY_STATE.reels=Array.isArray(data.reels)?data.reels:[];
    MEMORY_STATE.loaded=true;
  }catch(e){console.error('memories load',e)}
  finally{MEMORY_STATE.loading=false}
}
function memoryDateLabel(m){
  try{return new Intl.DateTimeFormat(LOCALE,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(m.captured_at||m.created_at))}catch{return ''}
}
function renderMemories(m){
  if(!memoriesAvailable()){
    m.innerHTML=`<div class="screen-title">${t('memories')}</div><div class="card memory-locked"><div class="memory-capture-icon">📸</div><h2>${t('memories')}</h2><p>${t('memoryFullOnly')}</p></div>`;return;
  }
  m.innerHTML=`<div class="screen-title">${t('memories')}</div><div class="card memory-loading"><div class="memory-spinner"></div><p>${t('memoryLoading')}</p></div>`;
  loadMemories().then(()=>{if(S.route==='memories')renderMemoriesLoaded(m)});
}
function renderMemoriesLoaded(m){
  const list=MEMORY_STATE.memories||[],reels=MEMORY_STATE.reels||[];
  const places=new Set(list.map(x=>x.source_label).filter(Boolean)).size;
  const reel=reels[0]||null;
  m.innerHTML=`<div class="screen-title">${t('memories')}</div>
    <section class="memory-hero">
      <div class="memory-hero-brand">NAVIGAM Memories</div>
      <h2>${t('memoryHeroTitle')}</h2>
      <p>${t('memoryHeroText')}</p>
      <div class="memory-stats"><span><b>${list.length}</b>${t('memoryPhotos')}</span><span><b>${places}</b>${t('memoryPlaces')}</span></div>
      <button class="btn primary" onclick="openGeneralMemory()">📸 ${t('addMoment')}</button>
    </section>
    ${list.length?`<div class="memory-grid">${list.map(x=>`<figure class="memory-tile"><img src="${escapeHtml(x.url||'')}" alt="${escapeHtml(x.source_label||t('memories'))}" loading="lazy"><figcaption><strong>${escapeHtml(x.source_label||loc(CONFIG.destination.name))}</strong><small>${escapeHtml(memoryDateLabel(x))}</small></figcaption><button class="memory-delete" aria-label="${t('memoryDelete')}" onclick="deleteMemory('${jsq(x.id)}')">×</button></figure>`).join('')}</div>`:`<div class="card memory-empty"><div class="memory-capture-icon">📸</div><h3>${t('memoryEmptyTitle')}</h3><p>${t('memoryEmpty')}</p><button class="btn primary" onclick="openGeneralMemory()">${t('addMoment')}</button></div>`}
    <section class="card memory-reel-panel">
      <div class="memory-reel-icon">▶</div><div><h2>${t('memoryReel')}</h2><p>${t('memoryReelHint')}</p></div>
      ${list.length>=2?`<button class="btn primary full" onclick="openReelOptions()">${t('memoryReelCreate')}</button>`:`<button class="btn soft full" disabled>${t('memoryNeedTwo')}</button>`}
      ${reel?`<div class="memory-existing-reel"><video controls playsinline preload="metadata" src="${escapeHtml(reel.url||'')}"></video><div class="memory-reel-actions"><button class="btn primary" onclick="shareStoredReel('${jsq(reel.url||'')}','${jsq(reel.mime_type||'video/webm')}')">${t('memoryShare')}</button><a class="btn ghost" href="${escapeHtml(reel.url||'')}" download="NAVIGAM-Memories">${t('memoryDownload')}</a></div></div>`:''}
    </section>
    <p class="memory-privacy-note">🔒 ${t('memoryPrivacy')}</p>`;
}
async function deleteMemory(id){
  if(!confirm(t('memoryDeleteConfirm')))return;
  try{
    const r=await fetch(NAVIGAM_MEMORIES_API+'?code='+encodeURIComponent(CONFIG.code)+'&kind=photo&id='+encodeURIComponent(id),{method:'DELETE',credentials:'omit'});
    const d=await r.json();if(!r.ok||d.ok!==true)throw Error();
    MEMORY_STATE.loaded=false;await loadMemories(true);if(S.route==='memories')render();
  }catch{toast(t('memoryDeleteFailed'))}
}
function openReelOptions(){
  openSheet(`<div class="sheethead"><div><h2>${t('memoryReel')}</h2><small>${t('memoryReelHint')}</small></div><button aria-label="${t('close')}" onclick="closeSheet()">✕</button></div>
    <div class="memory-reel-options"><div class="memory-reel-preview">NAVIGAM<br><span>${escapeHtml(loc(CONFIG.destination.name))}</span></div>
    <button class="btn primary full" onclick="closeSheet();generateMemoryReel(true)">♫ ${t('memoryMusicAmbient')}</button>
    <button class="btn ghost full" onclick="closeSheet();generateMemoryReel(false)">${t('memoryNoMusic')}</button>
    <small>${t('memoryMusicNote')}</small></div>`);
}
function pickReelMime(){
  const types=['video/mp4;codecs=h264,aac','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return types.find(x=>window.MediaRecorder?.isTypeSupported?.(x))||'';
}
function selectReelMoments(list,max=30){
  if(list.length<=max)return list;
  const out=[];for(let i=0;i<max;i++)out.push(list[Math.round(i*(list.length-1)/(max-1))]);return out;
}
async function bitmapFromUrl(url){
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('image_fetch');
  const blob=await r.blob();return await imageBitmapFromFile(blob);
}
function drawCover(ctx,img,w,h,zoom=1,pan=0){
  const iw=img.width||img.naturalWidth,ih=img.height||img.naturalHeight;
  const scale=Math.max(w/iw,h/ih)*zoom,dw=iw*scale,dh=ih*scale;
  const x=(w-dw)/2+pan*(dw-w)*.18,y=(h-dh)/2;
  ctx.drawImage(img,x,y,dw,dh);
}
function roundRect(ctx,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath()}
function drawMemoryFrame(ctx,img,logo,item,progress,w,h){
  ctx.fillStyle='#071f37';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.globalAlpha=.35;ctx.filter='blur(24px)';drawCover(ctx,img,w,h,1.14,0);ctx.restore();ctx.filter='none';
  const zoom=1+.055*progress,pan=(progress-.5)*2;drawCover(ctx,img,w,h,zoom,pan);
  const g=ctx.createLinearGradient(0,h*.62,0,h);g.addColorStop(0,'rgba(5,20,32,0)');g.addColorStop(1,'rgba(5,20,32,.78)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(logo){const lw=150,lh=logo.height/Math.max(1,logo.width)*lw;ctx.save();ctx.globalAlpha=.9;ctx.drawImage(logo,(w-lw)/2,34,lw,lh);ctx.restore()}
  const label=item.source_label||loc(CONFIG.destination.name);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='700 28px Arial';ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=8;ctx.fillText(label.slice(0,40),w/2,h-104);ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,.82)';ctx.font='500 17px Arial';ctx.fillText(memoryDateLabel(item),w/2,h-70);
}
function drawEndCard(ctx,logo,w,h){
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#071f37');g.addColorStop(.58,'#0b7180');g.addColorStop(1,'#10b8c2');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(logo){const lw=420,lh=logo.height/Math.max(1,logo.width)*lw;ctx.drawImage(logo,(w-lw)/2,h*.22,lw,lh)}
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='700 38px Arial';ctx.fillText(t('memoryEnd1'),w/2,h*.60);
  ctx.font='600 31px Arial';ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillText(t('memoryEnd2'),w/2,h*.65);
  ctx.font='600 18px Arial';ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillText('Your trip. Personally navigated.',w/2,h*.72);
}
function scheduleAmbient(audioCtx,dest,total){
  const master=audioCtx.createGain();master.gain.value=.055;master.connect(dest);
  const seq=[261.63,329.63,392.00,493.88,440.00,392.00,329.63,293.66];
  for(let t=0,i=0;t<total;t+=1.6,i++){
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=seq[i%seq.length]/2;g.gain.setValueAtTime(0,audioCtx.currentTime+t);g.gain.linearRampToValueAtTime(.9,audioCtx.currentTime+t+.35);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+t+1.5);o.connect(g);g.connect(master);o.start(audioCtx.currentTime+t);o.stop(audioCtx.currentTime+t+1.55);
  }
}
async function generateMemoryReel(withMusic){
  if(MEMORY_STATE.generating)return;
  await loadMemories(true);
  const moments=selectReelMoments(MEMORY_STATE.memories.filter(x=>x.url),30);
  if(moments.length<2){toast(t('memoryNeedTwo'));return}
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){toast(t('memoryVideoUnsupported'));return}
  MEMORY_STATE.generating=true;MEMORY_STATE.progress=0;route('memories');
  const m=document.getElementById('main');m.innerHTML=`<div class="screen-title">${t('memoryReel')}</div><section class="memory-rendering"><div class="memory-reel-icon big">✦</div><h2>${t('memoryGenerating')}</h2><p>${t('memoryGeneratingHint')}</p><div class="memory-progress"><span id="memoryProgressBar"></span></div><strong id="memoryProgressText">0%</strong></section>`;
  let bitmaps=[],logo=null,audioCtx=null;
  try{
    const loaded=[];
    for(let i=0;i<moments.length;i++){try{loaded.push({item:moments[i],img:await bitmapFromUrl(moments[i].url)})}catch{}}
    bitmaps=loaded;if(bitmaps.length<2)throw Error('images_unavailable');
    try{logo=await bitmapFromUrl('/preview/assets/header-logo.png')}catch{}
    const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;const ctx=canvas.getContext('2d');
    const videoStream=canvas.captureStream(24),tracks=[...videoStream.getVideoTracks()];
    let audioDest=null;
    if(withMusic&&window.AudioContext){
      audioCtx=new AudioContext();await audioCtx.resume();audioDest=audioCtx.createMediaStreamDestination();tracks.push(...audioDest.stream.getAudioTracks());
    }
    const total=Math.min(30,Math.max(10,bitmaps.length*1.1+2.8)),endDur=2.8,photoDur=(total-endDur)/bitmaps.length;
    if(audioDest)scheduleAmbient(audioCtx,audioDest,total);
    const stream=new MediaStream(tracks),mime=pickReelMime(),chunks=[];
    const rec=mime?new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4500000}):new MediaRecorder(stream,{videoBitsPerSecond:4500000});
    rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    const stopped=new Promise((resolve,reject)=>{rec.onstop=resolve;rec.onerror=reject});
    rec.start(1000);
    const started=performance.now();
    await new Promise(resolve=>{
      function frame(now){
        const elapsed=(now-started)/1000,pct=Math.min(1,elapsed/total);
        const bar=document.getElementById('memoryProgressBar'),txt=document.getElementById('memoryProgressText');if(bar)bar.style.width=Math.round(pct*100)+'%';if(txt)txt.textContent=Math.round(pct*100)+'%';
        if(elapsed<total-endDur){
          const idx=Math.min(bitmaps.length-1,Math.floor(elapsed/photoDur)),local=(elapsed-idx*photoDur)/photoDur;
          drawMemoryFrame(ctx,bitmaps[idx].img,logo,bitmaps[idx].item,local,canvas.width,canvas.height);
        }else drawEndCard(ctx,logo,canvas.width,canvas.height);
        if(elapsed>=total){resolve();return}requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame);
    });
    rec.stop();await stopped;stream.getTracks().forEach(x=>x.stop());await audioCtx?.close();
    const type=rec.mimeType||mime||'video/webm',blob=new Blob(chunks,{type});
    if(!blob.size)throw Error('empty_reel');
    const ext=type.includes('mp4')?'mp4':'webm',file=new File([blob],'NAVIGAM-Memories.'+ext,{type});
    const form=new FormData();form.append('code',CONFIG.code);form.append('kind','reel');form.append('file',file);form.append('duration_seconds',String(total));form.append('photo_count',String(bitmaps.length));form.append('music_style',withMusic?'ambient':'none');
    const upload=await fetch(NAVIGAM_MEMORIES_API,{method:'POST',body:form,credentials:'omit'}),data=await upload.json().catch(()=>({}));
    if(!upload.ok||data.ok!==true)throw Error(data.error||'reel_upload_failed');
    MEMORY_STATE.loaded=false;await loadMemories(true);MEMORY_STATE.generating=false;toast(t('memoryReelReady'));render();
  }catch(e){
    console.error('reel generation',e);MEMORY_STATE.generating=false;try{await audioCtx?.close()}catch{};toast(t('memoryReelFailed'));render();
  }finally{for(const x of bitmaps)x.img?.close?.();logo?.close?.()}
}
async function shareStoredReel(url,mime){
  try{
    const r=await fetch(url),blob=await r.blob(),ext=(mime||blob.type).includes('mp4')?'mp4':'webm',file=new File([blob],'NAVIGAM-Memories.'+ext,{type:mime||blob.type});
    if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'NAVIGAM Memories',text:t('memoryShareText')});return}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  }catch{toast(t('memoryShareFailed'))}
}
