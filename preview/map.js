/* NAVIGAM Premium V2 map module. Locations come from stable itinerary records,
   never an array-index match with destination coordinates. */
const MAP_I18N = {
  he: {
    mapUnavailable:'המפה החיה אינה זמינה כרגע.', mapRetry:'נסו שוב',
    mapTileOffline:'רקע המפה לא נטען. רשימת העצירות והקישורים לניווט זמינים למטה.',
    mapOrderNote:'הקו המקווקו מציג את סדר הביקורים בלבד — אינו מסלול הליכה או נהיגה.',
    mapMissingPoint:'המיקום המדויק טרם נקבע. העצירה אינה מסומנת על המפה.',
    mapMissingSummary:'עצירות שמיקומן טרם נקבע מופיעות ברשימה בלבד.',
    mapNoLocations:'עדיין אין מיקומים מדויקים להצגה במפה.',
    mapMobileSegments:'מסלול במקטעים לדפדפן נייד', mapSegment:'מקטע',
    mapNavGoogle:'פתיחה ב־Google Maps', mapNavWaze:'ניווט ב־Waze',
    mapNoNavigation:'המיקום של העצירה עדיין לא נקבע.',
    mapTilePartial:'חלק מרקע המפה אינו זמין. אפשר להשתמש בקישורי הניווט למטה.',
    mapLiveRequiresInternet:'מפה חיה וקישורי ניווט דורשים חיבור לאינטרנט.',
    mapZoomIn:'הגדלה', mapZoomOut:'הקטנה', mapForecastSearch:'מזג אוויר'
  },
  en: {
    mapUnavailable:'The live map is unavailable right now.', mapRetry:'Try again',
    mapTileOffline:'The map background could not load. Stops and navigation links are available below.',
    mapOrderNote:'The dashed line shows visit order only — it is not a walking or driving route.',
    mapMissingPoint:'The exact location has not been set. This stop is not pinned on the map.',
    mapMissingSummary:'Stops without an exact location appear in the list only.',
    mapNoLocations:'There are no exact locations to show on the map yet.',
    mapMobileSegments:'Route sections for mobile browsers', mapSegment:'Section',
    mapNavGoogle:'Open in Google Maps', mapNavWaze:'Navigate with Waze',
    mapNoNavigation:'This stop does not have a location yet.',
    mapTilePartial:'Some map tiles are unavailable. Navigation links are available below.',
    mapLiveRequiresInternet:'The live map and navigation links require an internet connection.',
    mapZoomIn:'Zoom in', mapZoomOut:'Zoom out', mapForecastSearch:'weather'
  },
  ru: {
    mapUnavailable:'Живая карта сейчас недоступна.', mapRetry:'Повторить',
    mapTileOffline:'Фон карты не загрузился. Список остановок и ссылки для навигации доступны ниже.',
    mapOrderNote:'Пунктир показывает только порядок посещения — это не пеший или автомобильный маршрут.',
    mapMissingPoint:'Точное место ещё не определено. Эта остановка не отмечена на карте.',
    mapMissingSummary:'Остановки без точного места показаны только в списке.',
    mapNoLocations:'Точных мест для отображения на карте пока нет.',
    mapMobileSegments:'Участки маршрута для мобильного браузера', mapSegment:'Участок',
    mapNavGoogle:'Открыть в Google Maps', mapNavWaze:'Навигация в Waze',
    mapNoNavigation:'Место этой остановки ещё не определено.',
    mapTilePartial:'Часть карты недоступна. Ссылки для навигации находятся ниже.',
    mapLiveRequiresInternet:'Для живой карты и ссылок навигации нужен интернет.',
    mapZoomIn:'Увеличить', mapZoomOut:'Уменьшить', mapForecastSearch:'погода'
  },
  ar: {
    mapUnavailable:'الخريطة المباشرة غير متاحة حالياً.', mapRetry:'إعادة المحاولة',
    mapTileOffline:'تعذّر تحميل خلفية الخريطة. قائمة المحطات وروابط الملاحة متاحة أدناه.',
    mapOrderNote:'يوضح الخط المتقطع ترتيب الزيارات فقط، وليس مساراً للمشي أو القيادة.',
    mapMissingPoint:'لم يُحدد الموقع الدقيق بعد. هذه المحطة غير مثبتة على الخريطة.',
    mapMissingSummary:'المحطات التي لم يُحدد موقعها الدقيق تظهر في القائمة فقط.',
    mapNoLocations:'لا توجد مواقع دقيقة لعرضها على الخريطة بعد.',
    mapMobileSegments:'أجزاء المسار للمتصفح على الهاتف', mapSegment:'الجزء',
    mapNavGoogle:'فتح في خرائط Google', mapNavWaze:'الملاحة عبر Waze',
    mapNoNavigation:'لم يُحدد موقع هذه المحطة بعد.',
    mapTilePartial:'بعض أجزاء خلفية الخريطة غير متاحة. يمكن استخدام روابط الملاحة أدناه.',
    mapLiveRequiresInternet:'تتطلب الخريطة المباشرة وروابط الملاحة اتصالاً بالإنترنت.',
    mapZoomIn:'تكبير', mapZoomOut:'تصغير', mapForecastSearch:'الطقس'
  }
};
Object.entries(MAP_I18N).forEach(([locale, labels]) => Object.assign(I18N[locale], labels));

function mapLocation(item) {
  if (!item || item.navigationResolved === false || item.latitude == null || item.longitude == null || item.latitude === '' || item.longitude === '') return null;
  const latitude = Number(item.latitude), longitude = Number(item.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? [latitude, longitude] : null;
}
function mapStopKey(item) { return String(item.id || item.placeId || item.q || ''); }
function mapEntries(day) {
  return (DATA.tripDays[day]?.items || []).map((item, index) => ({ item, index, key:mapStopKey(item), location:mapLocation(item) }));
}
function mapTarget(item) {
  if (!item || item.navigationResolved === false) return '';
  const location = mapLocation(item);
  return location ? location.join(',') : typeof item.q === 'string' ? item.q.trim() : '';
}
function mapNavigationEntries(day) { return mapEntries(day).filter(entry => mapTarget(entry.item)); }
function openMapStop(day, key, service) {
  const entry = mapEntries(day).find(stop => stop.key === key);
  if (!entry || !mapTarget(entry.item)) { toast(t('mapNoNavigation')); return; }
  if (service === 'waze') waze(entry.item); else maps(entry.item);
}
function mapActionButtons(entry, day) {
  if (!mapTarget(entry.item)) return '';
  const key = jsq(entry.key);
  return `<div class="point-buttons"><button class="g" onclick="openMapStop(${day},'${key}','google')" aria-label="${escapeHtml(t('mapNavGoogle'))} · ${entry.index+1}">G</button><button class="w" onclick="openMapStop(${day},'${key}','waze')" aria-label="${escapeHtml(t('mapNavWaze'))} · ${entry.index+1}">W</button></div>`;
}
function renderMap(m) {
  const day = S.day, d = DATA.tripDays[day], entries = mapEntries(day), nav = mapNavigationEntries(day);
  const first = nav[0], segments = daySegments(day);
  m.innerHTML = `<div class="screen-title">${t('map')}</div>${dayTabs(true)}<div class="card day-route-card"><h3>${escapeHtml(d.title || '')}</h3><p>${escapeHtml(d.date || '')} · ${entries.length} ${t('stops')}</p>${nav.length ? `<div class="day-route-actions">${nav.length <= 11 ? `<button class="all-google" onclick="openDayGoogleMaps(${day})">${t('allDay')}</button>` : ''}<button class="first-waze" onclick="openMapStop(${day},'${jsq(first.key)}','waze')">${t('startWaze')}</button></div>` : ''}</div><div id="mapbox" class="mapbox map-compact" role="region" aria-label="${escapeHtml(t('map'))}"><div class="mapfallback" role="status">${t('loadingMap')}</div></div><p id="mapNote" class="route-note" role="status">${t('mapLiveRequiresInternet')}</p>${segments.length > 1 ? `<div class="route-segments"><span class="route-note">${t('mapMobileSegments')}</span>${segments.map((segment,index) => `<button class="btn ghost" onclick="openDaySegment(${day},${index})">${t('mapSegment')} ${index+1} · ${segment.start+1}–${segment.end+1}</button>`).join('')}</div>` : ''}<div class="point-list">${entries.map(entry => `<div class="point-row" data-map-stop-id="${escapeHtml(entry.key)}"><div class="point-time">${escapeHtml(entry.item.time || '')}</div><div><strong>${entry.index+1}. ${escapeHtml(entry.item.title || '')}</strong><small>${escapeHtml(entry.item.sub || '')}</small>${!entry.location ? `<small class="map-location-note">${t('mapMissingPoint')}</small>` : ''}</div>${mapActionButtons(entry,day)}</div>`).join('')}</div>`;
  initMap();
}
function maps(value) {
  const target = typeof value === 'string' ? value.trim() : mapTarget(value);
  if (!target) { toast(t('mapNoNavigation')); return; }
  window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(target), '_blank', 'noopener,noreferrer');
}
function waze(value) {
  const location = typeof value === 'object' ? mapLocation(value) : null;
  const target = typeof value === 'string' ? value.trim() : mapTarget(value);
  if (!target) { toast(t('mapNoNavigation')); return; }
  const params = new URLSearchParams(location ? {ll:location.join(','),navigate:'yes'} : {q:target,navigate:'yes'});
  window.open('https://waze.com/ul?'+params, '_blank', 'noopener,noreferrer');
}
function openGoogleRoute(entries) {
  if (!entries.length) return;
  if (entries.length === 1) { maps(entries[0].item); return; }
  const params = new URLSearchParams({api:'1',origin:mapTarget(entries[0].item),destination:mapTarget(entries[entries.length-1].item),travelmode:'walking'});
  if (entries.length > 2) params.set('waypoints',entries.slice(1,-1).map(entry => mapTarget(entry.item)).join('|'));
  window.open('https://www.google.com/maps/dir/?'+params, '_blank', 'noopener,noreferrer');
}
function openDayGoogleMaps(day) {
  const entries = mapNavigationEntries(day);
  if (entries.length > 11) { openDaySegment(day,0); return; }
  openGoogleRoute(entries);
}
function daySegments(day) {
  const entries = mapNavigationEntries(day), segments = [];
  // Five stops = three intermediate waypoints, supported by mobile Maps URLs.
  for (let offset=0; offset<entries.length-1; offset+=4) {
    const section = entries.slice(offset,offset+5);
    segments.push({start:section[0].index,end:section[section.length-1].index,entries:section});
  }
  return segments;
}
function openDaySegment(day,index) {
  const segment = daySegments(day)[index];
  if (segment) openGoogleRoute(segment.entries);
}
function loadLeaflet() {
  if (window.L && document.getElementById('navigam-leaflet-css')?.sheet) return Promise.resolve(true);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise(resolve => {
    let done=false, scriptReady=!!window.L, styleReady=false;
    let style=document.getElementById('navigam-leaflet-css');
    if (!style) { style=document.createElement('link'); style.id='navigam-leaflet-css'; style.rel='stylesheet'; style.href='/preview/vendor/leaflet/leaflet.css'; }
    const script=scriptReady ? null : document.createElement('script');
    const finish=ok => {
      if (done) return;
      done=true; clearTimeout(timer);
      if (!ok) { script?.remove(); if (!styleReady) style.remove(); leafletPromise=null; }
      resolve(ok);
    };
    const check=() => { if (scriptReady && styleReady) finish(true); };
    const timer=setTimeout(() => finish(false),8000);
    style.onload=() => { styleReady=true; check(); };
    style.onerror=() => finish(false);
    if (!style.isConnected) document.head.appendChild(style);
    if (style.sheet) styleReady=true;
    if (script) {
      script.src='/preview/vendor/leaflet/leaflet.js';
      script.onload=() => { scriptReady=!!window.L; if (scriptReady) check(); else finish(false); };
      script.onerror=() => finish(false);
      document.body.appendChild(script);
    }
    check();
  });
  return leafletPromise;
}
async function initMap() {
  const el=document.getElementById('mapbox'), note=document.getElementById('mapNote'), day=S.day, token=++mapGeneration;
  if (!el || !note) return;
  const entries=mapEntries(day), points=entries.filter(entry => entry.location), missing=entries.length-points.length;
  let map=null, tiles=null, timer=null, removed=false, loaded=0, errors=0;
  const current=() => token===mapGeneration && el.isConnected && document.getElementById('mapbox')===el && S.route==='map' && S.day===day;
  const clearTimer=() => { if (timer) clearTimeout(timer); timer=null; };
  const fallback=(key,retry=true) => {
    if (!current()) return;
    clearTimer();
    if (map && !removed) { map.remove(); removed=true; if (activeMap===map) activeMap=null; }
    el.classList.add('map-compact');
    el.innerHTML=`<div class="mapfallback" role="status"><strong>${t('mapUnavailable')}</strong><span>${t(key)}</span>${retry ? `<button class="btn ghost" onclick="render()">${t('mapRetry')}</button>` : ''}</div>`;
    note.textContent=t('mapLiveRequiresInternet');
  };
  if (!points.length) { fallback('mapNoLocations',false); return; }
  const ok=await loadLeaflet();
  if (!current()) return;
  if (!ok || !window.L) { fallback('mapTileOffline'); return; }
  try {
    el.innerHTML='';
    map=L.map(el,{zoomControl:false}); activeMap=map;
    map.on('unload',() => { removed=true; clearTimer(); });
    L.control.zoom({zoomInTitle:t('mapZoomIn'),zoomOutTitle:t('mapZoomOut')}).addTo(map);
    const bounds=points.map(entry => entry.location);
    const orderNote=() => t('mapOrderNote')+(missing ? ' '+t('mapMissingSummary') : '');
    const showMap=() => {
      if (!current() || removed) return;
      clearTimer();
      const wasCompact=el.classList.contains('map-compact');
      el.classList.remove('map-compact');
      if (wasCompact) { map.invalidateSize(); if (bounds.length===1) map.setView(bounds[0],15); else map.fitBounds(bounds,{padding:[32,32],maxZoom:16}); }
      note.textContent=orderNote()+(errors ? ' '+t('mapTilePartial') : '');
    };
    const armTimer=() => { clearTimer(); timer=setTimeout(() => { if (loaded) showMap(); else fallback('mapTileOffline'); },9000); };
    tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'});
    tiles.on('loading',() => { if (!current() || removed) return; loaded=0; errors=0; armTimer(); });
    tiles.on('tileload',() => { if (!current() || removed) return; loaded++; showMap(); });
    tiles.on('tileerror',() => { if (!current() || removed) return; errors++; if (loaded) note.textContent=orderNote()+' '+t('mapTilePartial'); });
    tiles.on('load',() => { if (!current() || removed) return; if (loaded) showMap(); else fallback('mapTileOffline'); });
    tiles.addTo(map);
    if (bounds.length>1) L.polyline(bounds,{color:'#0a9bbb',weight:3,opacity:.85,dashArray:'7 8',interactive:false}).addTo(map);
    points.forEach(entry => {
      const icon=L.divIcon({className:'day-pin',html:`<div class="pin-wrap"><span>${entry.index+1}</span></div>`,iconSize:[30,36],iconAnchor:[13,34]});
      const popup=`<b>${entry.index+1}. ${escapeHtml(entry.item.title || '')}</b><div class="place-actions"><button class="btn ghost" onclick="openMapStop(${day},'${jsq(entry.key)}','google')">${t('mapNavGoogle')}</button><button class="btn soft" onclick="openMapStop(${day},'${jsq(entry.key)}','waze')">${t('mapNavWaze')}</button></div>`;
      L.marker(entry.location,{icon,title:`${entry.index+1}. ${entry.item.title || ''}`,alt:`${entry.index+1}. ${entry.item.title || ''}`}).addTo(map).bindPopup(popup);
    });
    armTimer();
    if (bounds.length===1) map.setView(bounds[0],15); else map.fitBounds(bounds,{padding:[32,32],maxZoom:16});
    note.textContent=orderNote();
  } catch (_) { fallback('mapTileOffline'); }
}
function openWeatherSearch() {
  const destination=loc(CONFIG.destination.name);
  window.open('https://www.google.com/search?q='+encodeURIComponent(t('mapForecastSearch')+' '+destination),'_blank','noopener,noreferrer');
}
