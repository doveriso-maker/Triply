/* Premium V2 data boundary. No customer or destination is embedded in the shell. */
function adaptPreview(payload, code) {
  if (!payload || payload.ok !== true || !payload.trip) throw new Error('invalid_preview');
  const languages = ['he', 'en', 'ru', 'ar'];
  const language = languages.includes(payload.language) ? payload.language : 'en';
  const trip = payload.trip;
  const destination = payload.destination || trip.destination_meta || {};
  const title = trip.title || destination.name || trip.destination;
  const startDate = trip.start_date || trip.dates?.start;
  const endDate = trip.end_date || trip.dates?.end;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDate || '')) throw new Error('invalid_dates');
  const dayCount = Math.max(1, Math.min(90, Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000) + 1));
  const rawDays = Array.isArray(payload.days) ? payload.days : [{...payload.day, day:1, items:payload.items || []}];
  const allowed = new Set((payload.preview?.open_days || [1]).filter(n => Number.isInteger(n) && n === 1));
  const safeUrl = value => {
    if (typeof value !== 'string') return '';
    try { const u = new URL(value, 'https://www.navigam.com'); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
  };
  const queryOf = p => {
    try { const u = new URL(p.google_maps_url); return u.searchParams.get('query') || p.q || p.name || ''; }
    catch { return p.q || p.name || ''; }
  };
  const coords = p => {
    const latitude = p.latitude ?? p.coordinates?.latitude ?? p.coordinates?.lat;
    const longitude = p.longitude ?? p.coordinates?.longitude ?? p.coordinates?.lng;
    return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? {latitude, longitude} : {latitude:null, longitude:null};
  };
  const category = p => {
    const raw = p.category_key || p.type || p.category || '';
    const known = { 'מסעדה':'restaurant', 'קניות':'shopping', 'טבע':'nature', 'חיי לילה':'nightlife', 'יקב':'winery', attraction:'attractions', family_friendly:'family' };
    if (known[raw]) return known[raw];
    if (/مطعم|حلويات|cafe|restaurant|dessert/i.test(raw)) return 'restaurant';
    if (/سوق|تسوق|shopping|market/i.test(raw)) return 'shopping';
    if (/حديقة|park|nature/i.test(raw)) return 'nature';
    if (/مسائية|evening|nightlife/i.test(raw)) return 'nightlife';
    return ['restaurant','shopping','nature','nightlife','family','winery'].includes(raw) ? raw : 'attractions';
  };
  const places = new Map();
  const images = {hero:safeUrl(payload.images?.hero || payload.images?.destinationHero || trip.hero_image_url), itinerary:safeUrl(payload.images?.itineraryDayHero || payload.images?.itinerary || trip.hero_image_url), places:{}, hotels:{}};
  const imagePresentation = {places:{}, hotels:{}};
  function addPlace(p) {
    if (!p?.id) return;
    const id = String(p.id);
    const original = places.get(id) || {};
    places.set(id, {...original, id, name:p.name || original.name || '', type:category(p), area:p.area || p.city || original.area || '', tag:p.description || p.tag || p.metadata?.description || original.tag || '', q:queryOf(p), ...coords(p), familyFriendly:p.family_friendly === true || p.familyFriendly === true || p.categories?.includes('family'), google_maps_url:safeUrl(p.google_maps_url), waze_url:safeUrl(p.waze_url)});
    const entry = payload.images?.places?.[id];
    const src = safeUrl(typeof entry === 'string' ? entry : entry?.url || p.image_url || p.preview_image_url || p.image?.url);
    if (src) images.places[id] = src;
    imagePresentation.places[id] = {kind:entry?.kind || p.image_kind || p.image?.kind || 'place'};
  }
  (payload.places || []).forEach(addPlace);
  const days = Array.from({length:dayCount}, (_, i) => {
    const day = i + 1;
    const date = new Date(Date.parse(startDate) + i * 86400000).toISOString().slice(0,10);
    const source = rawDays.find(d => (d.day ?? d.day_number) === day);
    const locked = !allowed.has(day) || !source || source.locked === true;
    const items = locked ? [] : (source.items || (day === 1 ? payload.items : []) || []).map((item, index) => {
      const place = item.place || (payload.places || []).find(p => p.id === item.place_id) || null;
      if (place) addPlace(place);
      const point = coords({...place, ...item, latitude:item.latitude ?? place?.latitude, longitude:item.longitude ?? place?.longitude});
      const resolved = point.latitude !== null || !!(place && typeof queryOf(place) === 'string' && queryOf(place).trim());
      return {id:String(item.id || `${source.id}:${index}`), placeId:item.place_id || place?.id || null, title:item.title || place?.name || '', sub:item.description || item.sub || '', time:String(item.start_time || item.time || '').slice(0,5), q:resolved ? (place?queryOf(place):`${point.latitude},${point.longitude}`) : '', ...point, navigationResolved:resolved, google_maps_url:safeUrl(place?.google_maps_url), waze_url:safeUrl(place?.waze_url), itemType:item.item_type};
    });
    return {id:source?.id || `locked-${day}`, day, date:date.slice(8,10)+'.'+date.slice(5,7), isoDate:date, title:locked?'':source.title || '', summary:locked?'':source.summary || '', locked, items};
  });
  if (!days[0]?.items.length) throw new Error('empty_preview');
  // Deduplicate equivalent places by stable ID, then normalized navigation query.
  const seen = new Set();
  const placeList = [...places.values()].filter(p => {const key=String(p.q).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim(); if(key&&seen.has(key))return false;if(key)seen.add(key);return true;});
  const party = payload.party || payload.customer?.party || trip.party || {};
  const adults = Number.isInteger(party.adults) ? party.adults : null;
  const infants = Number.isInteger(party.infants) ? party.infants : null;
  const children = Number.isInteger(party.children) ? party.children : 0;
  const partyText = adults === null ? {he:'הטיול האישי שלכם',en:'Your personal trip',ru:'Ваше путешествие',ar:'رحلتكم الشخصية'} : {
    he:`${adults} מבוגרים${children?` · ${children} ילדים`:''}${infants?` · ${infants} תינוק`:''}`,
    en:`${adults} adults${children?` · ${children} children`:''}${infants?` · ${infants} infant`:''}`,
    ru:`${adults} взрослых${children?` · ${children} детей`:''}${infants?` · ${infants} младенец`:''}`,
    ar:`${adults} بالغين${children?` · ${children} أطفال`:''}${infants?` · ${infants} طفل رضيع`:''}`
  };
  const check = {
    he:['דרכונים','כרטיסי טיסה','ביטוח נסיעות','eSIM / אינטרנט','מטענים','תרופות אישיות','ציוד לתינוק','ביגוד מתאים'],
    en:['Passports','Flight tickets','Travel insurance','eSIM / internet','Chargers','Personal medication','Baby supplies','Suitable clothing'],
    ru:['Паспорта','Авиабилеты','Страховка','eSIM / интернет','Зарядные устройства','Личные лекарства','Вещи для ребёнка','Подходящая одежда'],
    ar:['جوازات السفر','تذاكر الطيران','تأمين السفر','eSIM / إنترنت','شواحن','أدوية شخصية','مستلزمات الطفل','ملابس مناسبة']
  };
  const checklist = check.en.map((_,i) => Object.fromEntries(languages.map(l=>[l,check[l][i]])));
  const hotels = (payload.hotels || []).filter(h=>h.id).map(h => { const entry=payload.images?.hotels?.[h.id];images.hotels[h.id]=safeUrl(h.image_url || (typeof entry==='string'?entry:entry?.url));imagePresentation.hotels[h.id]={kind:entry?.kind||'place'};return {...h, q:queryOf(h)}; });
  return {schemaVersion:2, engineVersion:'PREMIUM_V2_NEXT', code, id:`preview-${code}`, client:{language,name:payload.customer?.display_name || {he:'אורח NAVIGAM',en:'NAVIGAM Guest',ru:'Гость NAVIGAM',ar:'ضيف NAVIGAM'}, party:partyText}, destination:{...destination,name:destination.name || trip.destination,language:destination.language || payload.translate?.destination_language || null}, trip:{title, startDate, endDate,dayCount}, preview:{open_days:[1],locked_days:days.filter(d=>d.locked).map(d=>d.day)}, data:{tripDays:days,places:placeList,hotels,checklist,info:[]},images,imagePresentation,exchange:{from:'ILS',to:destination.currency || payload.currency || null,rate:null,isExample:false},support:payload.support || {},features:payload.features || {},expires_at:payload.expires_at,server_now:payload.server_now};
}
