/* Run with jsdom available in NODE_PATH. No live services or customer writes. */
const {JSDOM}=require('jsdom');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../preview');
const fixture=JSON.parse(fs.readFileSync(process.argv[2]||path.resolve(__dirname,'../../audit/live-preview-v14.json'),'utf8'));
function create(data=fixture){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]*src=[^>]+><\/script>/g,'');
 const dom=new JSDOM(html,{url:'https://www.navigam.com/p/H7K9M4P6Q8',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
 w.TextEncoder=TextEncoder;w.AbortController=AbortController;w.fetch=()=>Promise.reject(Error('offline test'));w.open=()=>{};
 w.__fixture=data;w.NAVIGAM_AUTHORIZED=true;
 const before=['i18n.js','adapter.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
 const code=['premium.js','features.js','map.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
 w.eval(before+"\nwindow.NAVIGAM_CONFIG=adaptPreview(window.__fixture,'H7K9M4P6Q8');\n"+code+'\nupdateChrome();render();');
 return dom;
}
const dom=create(),w=dom.window,d=w.document;
assert.equal(d.documentElement.lang,'ar');assert.equal(d.documentElement.dir,'rtl');
assert.equal(w.NAVIGAM_CONFIG.data.tripDays.length,9);assert.equal(w.NAVIGAM_CONFIG.data.tripDays[0].items.length,7);
assert.equal(w.NAVIGAM_CONFIG.data.tripDays[0].items.filter(p=>p.latitude!==null).length,6);
assert.equal(w.NAVIGAM_CONFIG.data.places.length,15);assert(w.NAVIGAM_CONFIG.data.places.some(p=>p.familyFriendly));
assert.equal(new Set(Object.values(w.NAVIGAM_CONFIG.images.places)).size,15);
w.enterApp();assert(d.querySelector('#live').classList.contains('active'));assert(d.querySelector('#main').textContent.includes('التركية'));
w.route('itinerary');assert.equal(d.querySelectorAll('.event').length,7);assert.equal(d.querySelectorAll('.daytab').length,9);assert.equal(d.querySelectorAll('.event .navmini').length,12);
w.selectDay(1);assert(d.querySelector('#sheet').textContent.includes('169'));assert.equal(d.querySelectorAll('.event').length,7);w.closeSheet();
w.route('places');const first=d.querySelector('[data-place-id]').dataset.placeId;w.toggleFav(first);w.route('favorites');assert(d.querySelector('.saved-place'));assert.deepEqual(JSON.parse(w.localStorage.getItem('navigam:preview-H7K9M4P6Q8:nav_favs')),[first]);
w.route('checklist');const cb=d.querySelector('input');cb.checked=true;cb.dispatchEvent(new w.Event('change')); // outside-only jsdom does not execute inline handler.
w.saveValue('nav_check',{0:true});assert.deepEqual(JSON.parse(w.localStorage.getItem('navigam:preview-H7K9M4P6Q8:nav_check')),{0:true});
w.openAvia('translate');assert(d.querySelector('#trIn'));assert(d.querySelector('.translatepair').textContent.includes('التركية'));w.closeSheet();
for(const locale of ['he','en','ru','ar']){w.setLocale(locale);w.route('info');assert.equal(d.documentElement.dir,['he','ar'].includes(locale)?'rtl':'ltr');assert(!d.querySelector('#main').textContent.includes('undefined'));}
w.setLocale('ar');for(const route of ['home','itinerary','places','favorites','hotels','info','profile','offline','support','checklist']){w.route(route);assert(!/[\u0590-\u05ff]/.test(d.querySelector('#main').textContent.replace('עברית','')),'Hebrew in '+route);assert(!/Albania|TRIPLY|Tirana/.test(d.querySelector('#main').textContent));}
const unknown=structuredClone(fixture);unknown.destination={name:{en:'Test destination'},language:null,currency:null,latitude:null,longitude:null};unknown.features.translate=false;const dom2=create(unknown);dom2.window.openAvia('translate');assert(!dom2.window.document.querySelector('#trIn'));dom2.window.close();
const shuffled=structuredClone(fixture);shuffled.days[0].items=[...shuffled.days[0].items].reverse();const normalized=w.adaptPreview(shuffled,'H7K9M4P6Q8');assert.equal(normalized.data.tripDays[0].items[0].id,shuffled.days[0].items[0].id);assert.equal(normalized.data.tripDays[0].items[0].placeId,shuffled.days[0].items[0].place_id);
dom.window.close();console.log('PASS: canonical shell/data adapter, seven stops, eight locked days, six located pins, image IDs, local preferences, locale UI, Translate unavailable state');
