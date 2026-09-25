
/* NAVIGAM Memories v1 — private trip photos + branded on-device reel */
const MEMORY_API='https://asnnvwoersrhrgdantll.supabase.co/functions/v1/triply-memories';
const MEMORY_TX={
  he:{memories:'הזיכרונות שלי',addMoment:'הוסף רגע',addPhotos:'הוספת תמונות',yourMoments:'הרגעים שלכם',empty:'עוד אין כאן רגעים. הוסיפו תמונה מהמסלול, מהמלצה או ממקום טרנדי.',collected:'רגעים נשמרו מהטיול',createReel:'צרו את סרטון הטיול',reelReady:'סרטון הטיול שלכם מוכן ליצירה ✨',withMusic:'עם מנגינת NAVIGAM',withoutMusic:'ללא מוזיקה',uploading:'שומר את הרגע…',uploaded:'הרגע נשמר ב-NAVIGAM Memories ✨',uploadFailed:'לא הצלחנו לשמור את התמונה כרגע.',processing:'יוצר את סרטון הטיול…',rendering:'מרכיב את הרגעים שלכם',reelDone:'הסרטון שלכם מוכן ❤️',needPhotos:'צריך לפחות 3 תמונות כדי ליצור סרטון.',delete:'מחיקה',deleteAsk:'למחוק את הרגע הזה?',share:'שיתוף',downloadReel:'שמירת הסרטון',privacy:'התמונות נשמרות באופן פרטי בתוך הטיול שלכם.',end1:'שמחנו להיות חלק מהטיול שלכם ❤️',end2:'ניפגש בטיול הבא.',momentAt:'רגע ב-',general:'רגע מהטיול',unsupported:'המכשיר הזה לא תומך כרגע ביצירת Reel ישירות. התמונות נשמרו ויישארו זמינות ב-Memories.',photoLimit:'אפשר להעלות עד 10 תמונות בכל פעם.',close:'סגירה'},
  en:{memories:'My Memories',addMoment:'Add a moment',addPhotos:'Add photos',yourMoments:'Your moments',empty:'No moments yet. Add a photo from the itinerary, a recommendation or a trending place.',collected:'moments saved from your trip',createReel:'Create your trip reel',reelReady:'Your trip reel is ready to create ✨',withMusic:'With NAVIGAM melody',withoutMusic:'Without music',uploading:'Saving your moment…',uploaded:'Moment saved to NAVIGAM Memories ✨',uploadFailed:'We could not save this photo right now.',processing:'Creating your trip reel…',rendering:'Putting your moments together',reelDone:'Your reel is ready ❤️',needPhotos:'Add at least 3 photos to create a reel.',delete:'Delete',deleteAsk:'Delete this moment?',share:'Share',downloadReel:'Save video',privacy:'Photos are stored privately inside your trip.',end1:'We loved being part of your trip ❤️',end2:'See you on the next journey.',momentAt:'Moment at ',general:'Trip moment',unsupported:'This device cannot create a reel directly yet. Your photos are safely stored in Memories.',photoLimit:'You can upload up to 10 photos at a time.',close:'Close'},
  ru:{memories:'Мои воспоминания',addMoment:'Добавить момент',addPhotos:'Добавить фото',yourMoments:'Ваши моменты',empty:'Здесь пока нет моментов. Добавьте фото из маршрута, рекомендации или трендового места.',collected:'моментов сохранено',createReel:'Создать видео поездки',reelReady:'Ваше видео поездки готово к созданию ✨',withMusic:'С мелодией NAVIGAM',withoutMusic:'Без музыки',uploading:'Сохраняем момент…',uploaded:'Момент сохранён в NAVIGAM Memories ✨',uploadFailed:'Не удалось сохранить фото.',processing:'Создаём видео поездки…',rendering:'Собираем ваши моменты',reelDone:'Ваше видео готово ❤️',needPhotos:'Нужно минимум 3 фото.',delete:'Удалить',deleteAsk:'Удалить этот момент?',share:'Поделиться',downloadReel:'Сохранить видео',privacy:'Фотографии хранятся приватно внутри вашей поездки.',end1:'Спасибо, что позволили нам быть частью вашего путешествия ❤️',end2:'До встречи в следующей поездке.',momentAt:'Момент в ',general:'Момент поездки',unsupported:'Это устройство пока не поддерживает создание Reel напрямую. Фото сохранены в Memories.',photoLimit:'За раз можно загрузить до 10 фото.',close:'Закрыть'},
  ar:{memories:'ذكرياتي',addMoment:'أضف لحظة',addPhotos:'إضافة صور',yourMoments:'لحظاتكم',empty:'لا توجد لحظات بعد. أضيفوا صورة من المسار أو التوصيات أو الأماكن الرائجة.',collected:'لحظات محفوظة من الرحلة',createReel:'أنشئ فيديو الرحلة',reelReady:'فيديو رحلتكم جاهز للإنشاء ✨',withMusic:'مع موسيقى NAVIGAM',withoutMusic:'بدون موسيقى',uploading:'نحفظ اللحظة…',uploaded:'تم حفظ اللحظة في NAVIGAM Memories ✨',uploadFailed:'تعذر حفظ الصورة الآن.',processing:'ننشئ فيديو الرحلة…',rendering:'نجمع لحظاتكم',reelDone:'الفيديو جاهز ❤️',needPhotos:'نحتاج إلى 3 صور على الأقل.',delete:'حذف',deleteAsk:'حذف هذه اللحظة؟',share:'مشاركة',downloadReel:'حفظ الفيديو',privacy:'الصور محفوظة بشكل خاص داخل رحلتكم.',end1:'سعدنا بأن نكون جزءاً من رحلتكم ❤️',end2:'نلتقي في الرحلة القادمة.',momentAt:'لحظة في ',general:'لحظة من الرحلة',unsupported:'هذا الجهاز لا يدعم إنشاء Reel مباشرة حالياً. صوركم محفوظة في Memories.',photoLimit:'يمكن رفع حتى 10 صور في كل مرة.',close:'إغلاق'}
};
function mt(k){return (MEMORY_TX[LOCALE]||MEMORY_TX.en)[k]||MEMORY_TX.en[k]||k}
function memoryEnabled(){return CONFIG?.features?.memories===true && CONFIG?.preview?.mode==='full'}
const memoryState={loaded:false,loading:false,at:0,items:[],reels:[],objectUrl:null,rendering:false,progress:0};

function memoryContextBase(){
  const d=DATA.tripDays[S.day]||DATA.tripDays[0];
  return {sourceType:'general',sourceKey:'general',sourceLabel:mt('general'),tripDayId:d?.id||'',dayNumber:d?.day||S.day+1,query:''};
}
function memoryContextItinerary(e,d){
  return {sourceType:'itinerary',sourceKey:e.id,sourceLabel:e.title,tripDayId:d.id,dayNumber:d.day,itineraryItemId:e.id,placeId:e.placeId||'',query:e.q||''};
}
function memoryContextPlace(p){
  const d=DATA.tripDays[S.day]||DATA.tripDays[0];
  return {sourceType:'place',sourceKey:p.id,sourceLabel:p.name,tripDayId:d?.id||'',dayNumber:d?.day||S.day+1,placeId:p.id||'',query:p.q||''};
}
function memoryContextTrend(item){
  const d=DATA.tripDays[S.day]||DATA.tripDays[0];
  return {sourceType:'trend',sourceKey:item.id,sourceLabel:item.name,tripDayId:d?.id||'',dayNumber:d?.day||S.day+1,query:item.q||item.name||''};
}
function memoryEncodeContext(ctx){return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(ctx)))))}
function memoryDecodeContext(raw){
  try{return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw)))))}catch{return memoryContextBase()}
}
function memoryMiniButton(ctx,compact=true){
  if(!memoryEnabled())return '';
  const c=memoryEncodeContext(ctx||memoryContextBase());
  return '<button class="memory-add '+(compact?'compact':'')+'" type="button" onclick="memoryPick(\''+c+'\')" aria-label="'+escapeHtml(mt('addMoment'))+'"><span>📸</span><b>'+escapeHtml(mt('addMoment'))+'</b></button>';
}
function memoryHomeCard(){
  if(!memoryEnabled())return '';
  const count=memoryState.items.length;
  const ended=Date.now()>Date.parse(CONFIG.trip.endDate+'T23:59:59');
  return '<button class="card memory-home-card row-button" onclick="route(\'memories\')">'+
    '<span class="memory-home-icon">✦</span><span><strong>NAVIGAM Memories</strong><small>'+
    (count?(ended?escapeHtml(mt('reelReady')):count+' '+escapeHtml(mt('collected'))):escapeHtml(mt('addPhotos')))+
    '</small></span><span class="chev">›</span></button>';
}

async function memoryLoad(force=false){
  if(!memoryEnabled())return;
  if(memoryState.loading)return;
  if(!force&&memoryState.loaded&&Date.now()-memoryState.at<5*60*1000)return;
  memoryState.loading=true;
  try{
    const res=await fetch(MEMORY_API+'?code='+encodeURIComponent(CONFIG.code),{cache:'no-store',credentials:'omit'});
    const data=await res.json();
    if(!res.ok||!data.ok)throw Error(data.error||'load_failed');
    memoryState.items=Array.isArray(data.memories)?data.memories:[];
    memoryState.reels=Array.isArray(data.reels)?data.reels:[];
    memoryState.loaded=true;memoryState.at=Date.now();
  }catch(e){/* Keep the trip usable even if Memories is offline. */}
  finally{memoryState.loading=false;}
}
async function memoryPosition(){
  if(!navigator.geolocation)return null;
  return await new Promise(resolve=>{
    const timer=setTimeout(()=>resolve(null),3500);
    navigator.geolocation.getCurrentPosition(
      p=>{clearTimeout(timer);resolve({latitude:p.coords.latitude,longitude:p.coords.longitude})},
      ()=>{clearTimeout(timer);resolve(null)},
      {enableHighAccuracy:false,timeout:3000,maximumAge:10*60*1000}
    );
  });
}
async function memoryDecodeImage(file){
  let bitmap=null;
  try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'})}catch{try{bitmap=await createImageBitmap(file)}catch{}}
  if(bitmap)return {source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close?.()};
  const url=URL.createObjectURL(file);
  const img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});
  return {source:img,width:img.naturalWidth,height:img.naturalHeight,close:()=>URL.revokeObjectURL(url)};
}
async function memoryCompress(file){
  const decoded=await memoryDecodeImage(file);
  const max=1800,scale=Math.min(1,max/decoded.width,max/decoded.height);
  const width=Math.max(1,Math.round(decoded.width*scale)),height=Math.max(1,Math.round(decoded.height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(decoded.source,0,0,width,height);decoded.close();
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('encode_failed')),'image/jpeg',.87));
  return {blob,width,height};
}
function memoryPick(encoded){
  if(!memoryEnabled())return;
  const ctx=memoryDecodeContext(encoded);
  const input=document.createElement('input');
  input.type='file';input.accept='image/jpeg,image/png,image/webp';input.multiple=true;
  input.onchange=()=>memoryUploadFiles([...(input.files||[])],ctx);
  input.click();
}
async function memoryUploadFiles(files,ctx){
  if(!files.length)return;
  if(files.length>10){files=files.slice(0,10);toast(mt('photoLimit'))}
  const geo=ctx.sourceType==='general'?await memoryPosition():null;
  for(const file of files){
    try{
      toast(mt('uploading'));
      const image=await memoryCompress(file);
      const fd=new FormData();
      fd.append('code',CONFIG.code);fd.append('kind','photo');fd.append('file',image.blob,'navigam-memory.jpg');
      fd.append('source_type',ctx.sourceType||'general');fd.append('source_key',ctx.sourceKey||'');
      fd.append('source_label',ctx.sourceLabel||mt('general'));fd.append('trip_day_id',ctx.tripDayId||'');
      fd.append('day_number',String(ctx.dayNumber||S.day+1));fd.append('place_id',ctx.placeId||'');
      fd.append('query',ctx.query||'');fd.append('width',String(image.width));fd.append('height',String(image.height));
      fd.append('captured_at',new Date(file.lastModified||Date.now()).toISOString());
      fd.append('original_last_modified',String(file.lastModified||Date.now()));
      if(geo){fd.append('latitude',String(geo.latitude));fd.append('longitude',String(geo.longitude))}
      const res=await fetch(MEMORY_API,{method:'POST',body:fd,credentials:'omit'});
      const data=await res.json();
      if(!res.ok||!data.ok)throw Error(data.error||'upload_failed');
      memoryState.items.push(data.memory);memoryState.loaded=true;memoryState.at=Date.now();
      toast(mt('uploaded'));
    }catch(e){toast(mt('uploadFailed'))}
  }
  if(S.route==='memories')render();
}
function memoryLabel(m){return m.source_label||m.classification?.place_name||mt('general')}
function memoryDay(m){return Number(m.metadata?.day_number)||null}
function memoryPhotoCard(m){
  return '<article class="memory-photo">'+
    '<button class="memory-photo-main" onclick="memoryPreview(\''+jsq(m.id)+'\')" aria-label="'+escapeHtml(memoryLabel(m))+'">'+
    '<img src="'+escapeHtml(m.url||'')+'" alt="'+escapeHtml(memoryLabel(m))+'" loading="lazy"></button>'+
    '<div class="memory-photo-meta"><strong>'+escapeHtml(memoryLabel(m))+'</strong><span>'+
    (memoryDay(m)?escapeHtml(t('day'))+' '+memoryDay(m)+' · ':'')+
    new Date(m.captured_at||m.created_at).toLocaleDateString(LOCALE,{day:'numeric',month:'short'})+
    '</span></div>'+
    '<button class="memory-delete" onclick="memoryDelete(\''+jsq(m.id)+'\')" aria-label="'+escapeHtml(mt('delete'))+'">×</button>'+
    '</article>';
}
function renderMemories(m){
  if(!memoryEnabled()){m.innerHTML=emptyCard('NAVIGAM Memories');return}
  memoryLoad().then(()=>{if(S.route==='memories'&&!memoryState.loading)renderMemories(document.getElementById('main'))});
  const items=memoryState.items;
  const reel=memoryState.reels[0];
  m.innerHTML='<div class="screen-title">NAVIGAM Memories</div>'+
    '<div class="memory-hero card"><div class="memory-spark">✦</div><div><h2>'+escapeHtml(mt('yourMoments'))+'</h2><p>'+
    escapeHtml(mt('privacy'))+'</p></div><button class="btn primary compact" onclick="memoryPick(\''+memoryEncodeContext(memoryContextBase())+'\')">📸 '+escapeHtml(mt('addPhotos'))+'</button></div>'+
    (items.length?'<div class="memory-count">'+items.length+' '+escapeHtml(mt('collected'))+'</div><div class="memory-grid">'+items.map(memoryPhotoCard).join('')+'</div>':emptyCard(mt('empty')))+
    '<section class="card memory-reel-card"><div class="memory-reel-mark">▶</div><div><h2>NAVIGAM Trip Reel</h2><p>'+escapeHtml(Date.now()>Date.parse(CONFIG.trip.endDate+'T23:59:59')?mt('reelReady'):mt('createReel'))+'</p></div>'+
    (reel&&reel.url?'<button class="btn ghost" onclick="memoryOpenReel(\''+jsq(reel.url)+'\')">▶ '+escapeHtml(mt('reelDone'))+'</button>':
    '<div class="memory-reel-actions"><button class="btn primary" '+(items.length<3?'disabled':'')+' onclick="memoryCreateReel(true)">♫ '+escapeHtml(mt('withMusic'))+'</button><button class="btn soft" '+(items.length<3?'disabled':'')+' onclick="memoryCreateReel(false)">◌ '+escapeHtml(mt('withoutMusic'))+'</button></div>')+
    '</section>';
}
function memoryPreview(id){
  const m=memoryState.items.find(x=>x.id===id);if(!m)return;
  openSheet('<div class="sheethead"><div><h2>'+escapeHtml(memoryLabel(m))+'</h2><small>NAVIGAM Memories</small></div><button onclick="closeSheet()">✕</button></div><img class="memory-preview-img" src="'+escapeHtml(m.url)+'" alt="'+escapeHtml(memoryLabel(m))+'"><button class="btn warn full" onclick="memoryDelete(\''+jsq(id)+'\')">'+escapeHtml(mt('delete'))+'</button>');
}
async function memoryDelete(id){
  if(!confirm(mt('deleteAsk')))return;
  try{
    const res=await fetch(MEMORY_API+'?code='+encodeURIComponent(CONFIG.code)+'&id='+encodeURIComponent(id)+'&kind=photo',{method:'DELETE',credentials:'omit'});
    const data=await res.json();if(!res.ok||!data.ok)throw Error();
    memoryState.items=memoryState.items.filter(x=>x.id!==id);closeSheet();render();
  }catch{toast(mt('uploadFailed'))}
}
function memoryDiverse(items,max=12){
  const groups=new Map();
  for(const m of items){
    const key=(memoryDay(m)||'x')+'|'+memoryLabel(m);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(m);
  }
  const arr=[...groups.values()],out=[];
  while(out.length<max&&arr.some(g=>g.length)){
    for(const g of arr){if(g.length&&out.length<max)out.push(g.shift())}
  }
  return out;
}
async function memoryLoadCanvasImage(url){
  const res=await fetch(url,{credentials:'omit'});if(!res.ok)throw Error('image');
  const blob=await res.blob();
  const object=URL.createObjectURL(blob);
  const img=new Image();img.decoding='async';
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=object});
  return {img,object};
}
function memoryCover(ctx,img,w,h,zoom=1){
  const iw=img.naturalWidth,ih=img.naturalHeight,base=Math.max(w/iw,h/ih)*zoom;
  const dw=iw*base,dh=ih*base;
  ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);
}
function memoryRounded(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
function memoryWrap(ctx,text,maxWidth){
  const words=String(text||'').split(/\s+/),lines=[];let line='';
  for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}
  if(line)lines.push(line);return lines.slice(0,3);
}
function memoryMime(){
  if(typeof MediaRecorder==='undefined')return '';
  const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  return types.find(x=>MediaRecorder.isTypeSupported(x))||'';
}
function memoryAmbient(duration){
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;
  const ac=new Ctx(),dest=ac.createMediaStreamDestination(),master=ac.createGain();master.gain.value=.045;master.connect(dest);
  const freqs=[[261.63,329.63],[220,329.63],[196,293.66],[174.61,261.63]];
  for(let voice=0;voice<2;voice++){
    const osc=ac.createOscillator(),gain=ac.createGain();osc.type=voice?'triangle':'sine';gain.gain.value=voice?.32:.55;osc.connect(gain);gain.connect(master);
    freqs.forEach((ch,i)=>osc.frequency.setValueAtTime(ch[voice],ac.currentTime+i*(duration/freqs.length)));
    for(let t=duration;t<30;t+=duration){/* no-op */}
    osc.start();osc.stop(ac.currentTime+duration+.2);
  }
  return {ac,dest};
}
async function memoryCreateReel(withMusic){
  if(memoryState.rendering)return;
  if(memoryState.items.length<3){toast(mt('needPhotos'));return}
  const mime=memoryMime();if(!mime){toast(mt('unsupported'));return}
  memoryState.rendering=true;memoryState.progress=0;
  openSheet('<div class="sheethead"><div><h2>'+escapeHtml(mt('processing'))+'</h2><small>NAVIGAM Trip Reel</small></div><button onclick="closeSheet()">✕</button></div><div class="memory-render"><div class="memory-render-logo">✦</div><strong>'+escapeHtml(mt('rendering'))+'</strong><div class="memory-progress"><i id="memoryProgress"></i></div><span id="memoryProgressText">0%</span></div>');
  let loaded=[],logo=null,audio=null;
  try{
    const selected=memoryDiverse(memoryState.items,12);
    for(const m of selected){loaded.push({...await memoryLoadCanvasImage(m.url),memory:m})}
    logo=await memoryLoadCanvasImage('/preview/assets/header-logo.png');
    const W=720,H=1280,fps=15,outro=3,total=Math.min(30,Math.max(18,selected.length*2.1+outro)),content=total-outro,seg=content/selected.length;
    const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
    const canvasStream=canvas.captureStream(fps);
    let tracks=[...canvasStream.getVideoTracks()];
    if(withMusic){audio=memoryAmbient(total);if(audio){await audio.ac.resume();tracks.push(...audio.dest.stream.getAudioTracks())}}
    const stream=new MediaStream(tracks),chunks=[];
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1400000,audioBitsPerSecond:96000});
    recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
    const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.start(1000);
    const start=performance.now();
    await new Promise(resolve=>{
      function frame(now){
        const tsec=(now-start)/1000;
        memoryState.progress=Math.min(1,tsec/total);
        const bar=document.getElementById('memoryProgress'),txt=document.getElementById('memoryProgressText');
        if(bar)bar.style.width=Math.round(memoryState.progress*100)+'%';if(txt)txt.textContent=Math.round(memoryState.progress*100)+'%';
        ctx.fillStyle='#062f45';ctx.fillRect(0,0,W,H);
        if(tsec<content){
          const idx=Math.min(loaded.length-1,Math.floor(tsec/seg)),local=(tsec-idx*seg)/seg,current=loaded[idx];
          memoryCover(ctx,current.img,W,H,1+.055*local);
          const grad=ctx.createLinearGradient(0,H*.55,0,H);grad.addColorStop(0,'rgba(0,20,34,0)');grad.addColorStop(1,'rgba(0,25,40,.76)');ctx.fillStyle=grad;ctx.fillRect(0,H*.5,W,H*.5);
          ctx.fillStyle='#fff';ctx.font='700 36px Heebo, Arial';ctx.textAlign='center';ctx.direction=['he','ar'].includes(LOCALE)?'rtl':'ltr';
          const label=memoryLabel(current.memory),lines=memoryWrap(ctx,label,W-90);
          lines.forEach((line,i)=>ctx.fillText(line,W/2,H-105+(i-lines.length+1)*42));
        }else{
          const k=(tsec-content)/outro;
          const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#062f45');g.addColorStop(1,'#07889d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
          const lw=330,lh=logo.img.naturalHeight*(lw/logo.img.naturalWidth);ctx.globalAlpha=Math.min(1,k*3);ctx.drawImage(logo.img,(W-lw)/2,H*.23,lw,lh);ctx.globalAlpha=1;
          ctx.fillStyle='#fff';ctx.textAlign='center';ctx.direction=['he','ar'].includes(LOCALE)?'rtl':'ltr';ctx.font='700 39px Heebo, Arial';ctx.fillText(mt('end1'),W/2,H*.63);ctx.font='500 31px Heebo, Arial';ctx.fillText(mt('end2'),W/2,H*.69);
        }
        // Permanent small NAVIGAM mark.
        if(tsec<content){
          ctx.save();ctx.globalAlpha=.9;memoryRounded(ctx,W/2-88,24,176,78,22);ctx.fillStyle='rgba(255,255,255,.88)';ctx.fill();const lw=128,lh=logo.img.naturalHeight*(lw/logo.img.naturalWidth);ctx.drawImage(logo.img,W/2-lw/2,34,lw,lh);ctx.restore();
        }
        if(tsec>=total){resolve();return}requestAnimationFrame(frame);
      }requestAnimationFrame(frame);
    });
    recorder.stop();await stopped;audio?.ac?.close?.();tracks.forEach(t=>t.stop());
    const baseType=mime.split(';')[0],blob=new Blob(chunks,{type:baseType});
    const fd=new FormData();fd.append('code',CONFIG.code);fd.append('kind','reel');
    fd.append('file',blob,baseType.includes('mp4')?'navigam-trip-reel.mp4':'navigam-trip-reel.webm');
    fd.append('duration_seconds',String(total));fd.append('photo_count',String(selected.length));fd.append('music_style',withMusic?'navigam_ambient':'silent');
    const res=await fetch(MEMORY_API,{method:'POST',body:fd,credentials:'omit'});const data=await res.json();
    if(!res.ok||!data.ok)throw Error(data.error||'reel_upload_failed');
    memoryState.reels.unshift(data.reel);
    memoryState.objectUrl&&URL.revokeObjectURL(memoryState.objectUrl);memoryState.objectUrl=URL.createObjectURL(blob);
    memoryShowReel(memoryState.objectUrl,blob,baseType);
  }catch(e){closeSheet();toast(mt('uploadFailed'))}
  finally{for(const l of loaded)URL.revokeObjectURL(l.object);if(logo)URL.revokeObjectURL(logo.object);memoryState.rendering=false}
}
function memoryShowReel(url,blob,type){
  const ext=type.includes('mp4')?'mp4':'webm';
  openSheet('<div class="sheethead"><div><h2>'+escapeHtml(mt('reelDone'))+'</h2><small>NAVIGAM Trip Reel</small></div><button onclick="closeSheet()">✕</button></div><video class="memory-reel-video" controls playsinline src="'+escapeHtml(url)+'"></video><div class="memory-share-actions"><button class="btn primary" onclick="memoryShareCurrent(\''+ext+'\')">'+escapeHtml(mt('share'))+'</button><a class="btn soft" href="'+escapeHtml(url)+'" download="NAVIGAM-Trip-Reel.'+ext+'">'+escapeHtml(mt('downloadReel'))+'</a></div>');
  window.__memoryShare={blob,type,ext};
}
function memoryOpenReel(url){
  openSheet('<div class="sheethead"><div><h2>NAVIGAM Trip Reel</h2><small>'+escapeHtml(mt('reelDone'))+'</small></div><button onclick="closeSheet()">✕</button></div><video class="memory-reel-video" controls playsinline src="'+escapeHtml(url)+'"></video><a class="btn primary full" href="'+escapeHtml(url)+'" target="_blank" rel="noopener">'+escapeHtml(mt('downloadReel'))+'</a>');
}
async function memoryShareCurrent(ext){
  const s=window.__memoryShare;if(!s?.blob)return;
  const file=new File([s.blob],'NAVIGAM-Trip-Reel.'+ext,{type:s.type});
  try{if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'NAVIGAM Trip Reel'});return}}catch{}
  const a=document.createElement('a');a.href=URL.createObjectURL(s.blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}
memoryLoad();
