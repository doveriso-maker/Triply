/* Feature language packs extend the canonical Premium V2 UI without customer data. */
const FEATURE_COPY = {
  tr:['טורקית','Turkish','Турецкий','التركية'],
  weatherLoading:['טוענים את מזג האוויר…','Loading weather…','Загружаем погоду…','جارٍ تحميل الطقس…'],
  weatherService:['נתונים עדכניים מ-Open-Meteo.','Current data from Open-Meteo.','Актуальные данные Open-Meteo.','بيانات حديثة من Open-Meteo.'],
  currentConditions:['מזג האוויר כעת','Current conditions','Погода сейчас','الطقس الآن'],
  feelsLike:['מרגיש כמו','Feels like','Ощущается как','المحسوسة'],
  wind:['רוח','Wind','Ветер','الرياح'],
  kmh:['קמ״ש','km/h','км/ч','كم/س'],
  tripForecast:['תחזית לימי הטיול','Trip forecast','Прогноз на дни поездки','توقعات أيام الرحلة'],
  forecastFuture:['תחזית הטיול תופיע אוטומטית כשהתאריכים ייכנסו לטווח של 7 ימים. התנאים המוצגים כעת אינם תחזית למועד הטיול.','Your trip forecast will appear automatically when your dates enter the next 7 days. Current conditions are not a forecast for your travel dates.','Прогноз поездки появится автоматически, когда до её дат останется не более 7 дней. Текущая погода не является прогнозом на поездку.','ستظهر توقعات الرحلة تلقائياً عندما تدخل التواريخ ضمن الأيام السبعة القادمة. الطقس الحالي ليس توقعاً لموعد رحلتك.'],
  forecastPartial:['מוצגים רק ימי הטיול שבטווח 7 הימים הקרובים.','Only trip dates within the next 7 days are shown.','Показаны только даты поездки в пределах ближайших 7 дней.','تظهر فقط أيام الرحلة الواقعة ضمن الأيام السبعة القادمة.'],
  forecastPast:['מועד הטיול חלף. כאן מוצג מזג האוויר הנוכחי ביעד.','Your travel dates have passed. Current destination conditions are shown here.','Даты поездки прошли. Здесь показана текущая погода в пункте назначения.','انتهت تواريخ الرحلة. المعروض هنا هو الطقس الحالي في الوجهة.'],
  weatherUnavailable:['לא ניתן לעדכן כעת את מזג האוויר','Weather is unavailable right now','Сейчас не удалось обновить погоду','تعذر تحديث الطقس حالياً'],
  connectionRetry:['בדקו את חיבור האינטרנט ונסו שוב.','Check your internet connection and try again.','Проверьте подключение к интернету и повторите попытку.','تحقق من اتصال الإنترنت وحاول مجدداً.'],
  retry:['נסו שוב','Try again','Повторить','إعادة المحاولة'],
  updated:['עודכן','Updated','Обновлено','آخر تحديث'],
  weatherClear:['בהיר','Clear','Ясно','صحو'],
  weatherMostlyClear:['בהיר בעיקר','Mostly clear','Преимущественно ясно','صحو غالباً'],
  weatherPartCloud:['מעונן חלקית','Partly cloudy','Переменная облачность','غائم جزئياً'],
  weatherCloud:['מעונן','Overcast','Пасмурно','غائم'],
  weatherFog:['ערפל','Fog','Туман','ضباب'],
  weatherDrizzle:['טפטוף','Drizzle','Морось','رذاذ'],
  weatherRain:['גשם','Rain','Дождь','مطر'],
  weatherSnow:['שלג','Snow','Снег','ثلج'],
  weatherShowers:['ממטרים','Rain showers','Ливни','زخات مطر'],
  weatherStorm:['סופת רעמים','Thunderstorm','Гроза','عاصفة رعدية'],
  weatherVariable:['מזג אוויר משתנה','Variable weather','Переменчивая погода','طقس متغير'],
  rateWaiting:['שער עדכני עדיין לא נטען.','An updated rate has not loaded yet.','Обновлённый курс ещё не загружен.','لم يتم تحميل سعر صرف محدّث بعد.'],
  rateFailed:['לא ניתן לעדכן כעת. שער קודם, אם מוצג, מסומן בתאריך שלו.','Update unavailable. Any previously loaded rate is labeled with its date.','Обновление недоступно. У ранее загруженного курса указана его дата.','التحديث غير متاح. أي سعر سابق معروض يحمل تاريخ تحديثه.'],
  offlineTitle:['הגישה לטיול והמידע השמור','Trip access and saved preferences','Доступ к поездке и сохранённые настройки','الوصول للرحلة والتفضيلات المحفوظة'],
  offlineExplain:['בתצוגה המקדימה נדרש אינטרנט בכל פתיחה כדי לאמת את תוקף הגישה בשרת. המועדפים והצ׳ק ליסט נשמרים בדפדפן זה.','This preview needs internet each time it opens so the server can verify access. Favorites and checklist choices are saved in this browser.','Для каждой загрузки предпросмотра нужен интернет: сервер проверяет доступ. Избранное и отметки списка сохраняются в этом браузере.','تحتاج المعاينة إلى الإنترنت عند كل فتح كي يتحقق الخادم من صلاحية الوصول. تُحفظ المفضلة وعلامات قائمة التجهيزات في هذا المتصفح.'],
  offlineOnlineOnly:['המפה החיה, מזג האוויר, התרגום והעזרה המקוונת דורשים אינטרנט. קיצור הדרך פותח את אותה תצוגה מקדימה ואינו מאריך את תוקפה.','Live maps, weather, translation and online assistance need internet. The shortcut opens this preview and does not extend its validity.','Онлайн-карты, погода, перевод и помощь требуют интернета. Ярлык открывает этот предпросмотр и не продлевает срок доступа.','تحتاج الخرائط الحية والطقس والترجمة والمساعدة عبر الإنترنت إلى اتصال. يفتح الاختصار هذه المعاينة ولا يمدد صلاحيتها.'],
  shortcutDownload:['הורדת קיצור דרך לטיול','Download trip shortcut','Скачать ярлык поездки','تنزيل اختصار الرحلة'],
  shortcutOpen:['פתיחת NAVIGAM','Open NAVIGAM','Открыть NAVIGAM','فتح NAVIGAM'],
  shortcutReady:['קיצור הדרך מוכן להורדה. נדרש אינטרנט לפתיחת הטיול.','Your shortcut is ready. Internet is required to open the trip.','Ярлык готов. Для открытия поездки нужен интернет.','الاختصار جاهز. يلزم الإنترنت لفتح الرحلة.'],
  shortcutFailed:['לא ניתן להוריד קיצור דרך. שמרו את קישור הטיול בסימניות.','Unable to download a shortcut. Bookmark your trip link instead.','Не удалось скачать ярлык. Добавьте ссылку на поездку в закладки.','تعذر تنزيل الاختصار. احفظ رابط الرحلة في المفضلة.'],
  aviaHello:['היי, אני אביה. בתצוגה המקדימה הזו אפשר להכיר את המסלול וההמלצות מתוך נתוני הטיול, או לפתוח תרגום חי.','Hi, I’m Avia. In this preview, explore your itinerary and recommendations from the trip data, or open live translation.','Привет, я Авия. В предпросмотре можно узнать маршрут и рекомендации из данных поездки или открыть онлайн-перевод.','مرحباً، أنا أڤيا. في هذه المعاينة يمكنك استكشاف المسار والتوصيات من بيانات رحلتك، أو فتح الترجمة المباشرة.'],
  aviaDemo:['הדגמה המבוססת על נתוני הטיול. אין כאן צ׳אט חי.','A demonstration using your trip data. This is not a live chat.','Демонстрация на основе данных поездки. Это не живой чат.','عرض تجريبي يعتمد على بيانات الرحلة. هذه ليست محادثة مباشرة.'],
  restaurants:['מסעדות','Restaurants','Рестораны','المطاعم'],
  changes:['שינויים במסלול','Itinerary changes','Изменения маршрута','تعديلات المسار'],
  aviaChanges:['אפשר להתאים את קצב היום, להחליף עצירה או לבחור מסעדה אחרת. בתצוגה המקדימה השינויים אינם נשלחים ולא נשמרים במסלול. ליווי אביה במהלך הטיול זמין כתוספת של 10 ₪ ליום.','You can request a gentler pace, a different stop or another restaurant. Preview changes are not submitted or saved to the itinerary. Avia accompaniment during the trip is available for an additional ILS 10 per day.','Можно запросить более спокойный темп, заменить остановку или ресторан. В предпросмотре изменения не отправляются и не сохраняются в маршруте. Сопровождение Авии во время поездки доступно за дополнительные 10 ₪ в день.','يمكن طلب وتيرة أهدأ أو تغيير محطة أو اختيار مطعم آخر. لا تُرسل التعديلات ولا تُحفظ في المسار ضمن المعاينة. تتوفر مرافقة أڤيا خلال الرحلة مقابل 10 شواكل إضافية في اليوم.'],
  aviaHelp:['בחרו מסלול, מסעדות, מקומות, מלונות או מועדפים. התשובות כאן מדגימות את השירות באמצעות המידע שכבר קיים בטיול. לשינויים וסיוע במהלך הטיול אפשר להוסיף ליווי אביה.','Choose itinerary, restaurants, places, hotels or favorites. These answers demonstrate the service using information already in your trip. Avia accompaniment can be added for changes and help during the trip.','Выберите маршрут, рестораны, места, отели или избранное. Ответы демонстрируют сервис на основе готовых данных поездки. Для изменений и помощи в поездке можно добавить сопровождение Авии.','اختر المسار أو المطاعم أو الأماكن أو الفنادق أو المفضلة. تعرض الإجابات الخدمة باستخدام المعلومات الموجودة في رحلتك. يمكن إضافة مرافقة أڤيا للمساعدة والتعديلات أثناء الرحلة.'],
  aviaRecommendations:['המלצות באזור הטיול מתוך הנתונים הקיימים. הן אינן ממוינות לפי המיקום החי שלכם.','Recommendations around your trip area from the available data. They are not ranked by your live location.','Рекомендации в районе поездки из доступных данных. Они не отсортированы по вашему текущему местоположению.','توصيات في منطقة رحلتك من البيانات المتاحة. ليست مرتبة حسب موقعك الحالي.'],
  aviaLocked:['היום הזה ייפתח במסלול המלא. אפשר לעיין ביום הראשון ובהמלצות הזמינות בתצוגה המקדימה.','This day unlocks with the full itinerary. Explore day 1 and the available preview recommendations.','Этот день откроется в полном маршруте. Посмотрите первый день и рекомендации предпросмотра.','يُفتح هذا اليوم مع المسار الكامل. يمكنك استكشاف اليوم الأول والتوصيات المتاحة في المعاينة.'],
  translateUnavailable:['שפת היעד עדיין לא הוגדרה. התרגום יהיה זמין לאחר עדכון פרטי היעד.','The destination language is not configured yet. Translation will be available when the destination details are updated.','Язык пункта назначения ещё не настроен. Перевод станет доступен после обновления данных направления.','لم تُحدَّد لغة الوجهة بعد. ستتوفر الترجمة بعد تحديث تفاصيل الوجهة.'],
  sourceLanguage:['שפת מקור','Source language','Исходный язык','اللغة المصدر'],
  targetLanguage:['שפת תרגום','Target language','Язык перевода','اللغة الهدف'],
  continuous:['מצב שיחה — הקשיבו ואז בחרו את שפת הדובר הבא','Conversation mode — listen, then choose the next speaker’s language','Режим разговора — прослушайте и выберите язык следующего говорящего','وضع المحادثة — استمع ثم اختر لغة المتحدث التالي'],
  translationPrivacy:['תרגום חי דורש אינטרנט. הטקסט נשלח ל-MyMemory. דיבור דורש הרשאת מיקרופון ותמיכת דפדפן; זיהוי קול עשוי להתבצע בענן. בחרו את שפת הדובר בכל תור.','Live translation needs internet. Text is sent to MyMemory. Speech needs microphone permission and browser support; recognition may run in the cloud. Choose the speaker’s language for each turn.','Для онлайн-перевода нужен интернет. Текст отправляется в MyMemory. Для речи нужны разрешение на микрофон и поддержка браузера; распознавание может выполняться в облаке. Выбирайте язык говорящего для каждой реплики.','تحتاج الترجمة المباشرة إلى الإنترنت. يُرسل النص إلى MyMemory. يتطلب الكلام إذن الميكروفون ودعم المتصفح؛ وقد يُعالج الصوت سحابياً. اختر لغة المتحدث في كل دور.']
};
for (const [key,values] of Object.entries(FEATURE_COPY)) LOCALES.forEach((locale,i)=>I18N[locale][key]=values[i]);
PHRASES.tr='Merhaba, iki kişilik rezervasyonumuz var. Bize yardımcı olabilir misiniz?';
speechLocale.tr='tr-TR';

function weatherCodeText(code){
  const keys={0:'weatherClear',1:'weatherMostlyClear',2:'weatherPartCloud',3:'weatherCloud',45:'weatherFog',48:'weatherFog',51:'weatherDrizzle',53:'weatherDrizzle',55:'weatherDrizzle',56:'weatherDrizzle',57:'weatherDrizzle',61:'weatherRain',63:'weatherRain',65:'weatherRain',66:'weatherRain',67:'weatherRain',71:'weatherSnow',73:'weatherSnow',75:'weatherSnow',77:'weatherSnow',80:'weatherShowers',81:'weatherShowers',82:'weatherShowers',85:'weatherSnow',86:'weatherSnow',95:'weatherStorm',96:'weatherStorm',99:'weatherStorm'};
  return t(keys[code]||'weatherVariable');
}
let weatherGeneration=0;
async function renderWeather(m){
  const generation=++weatherGeneration,locale=LOCALE,destination=escapeHtml(String(loc(CONFIG.destination.name)));
  m.innerHTML=`<div class="screen-title">${t('weather')}</div><div class="weather-empty card"><span>☀</span><h2>${destination}</h2><h3>${t('weatherLoading')}</h3><p>${t('weatherService')}</p></div>`;
  const current=()=>generation===weatherGeneration&&S.route==='weather'&&LOCALE===locale&&m.isConnected;
  try{
    const {latitude,longitude,timezone}=CONFIG.destination;
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw Error('coordinates');
    const params=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',daily:'weather_code,temperature_2m_max,temperature_2m_min',timezone:timezone||'auto',forecast_days:'7'});
    const w=await fetchJSON('https://api.open-meteo.com/v1/forecast?'+params);
    if(!current())return;
    if(!w.current||!Number.isFinite(w.current.temperature_2m)||!Array.isArray(w.daily?.time))throw Error('weather');
    const number=value=>Number.isFinite(value)?new Intl.NumberFormat(locale,{maximumFractionDigits:0}).format(value):'—';
    const forecast=w.daily.time.map((date,i)=>({date,high:w.daily.temperature_2m_max?.[i],low:w.daily.temperature_2m_min?.[i],code:w.daily.weather_code?.[i]})).filter(day=>day.date>=CONFIG.trip.startDate&&day.date<=CONFIG.trip.endDate&&Number.isFinite(day.high)&&Number.isFinite(day.low));
    const today=String(w.current.time||w.daily.time[0]||'').slice(0,10);
    const note=CONFIG.trip.endDate<today?'forecastPast':forecast.length?'forecastPartial':'forecastFuture';
    const forecastHtml=forecast.map(day=>`<div style="min-width:110px;background:#f3fbfd;border-radius:16px;padding:12px;text-align:center"><b>${escapeHtml(new Date(day.date+'T12:00:00Z').toLocaleDateString(locale,{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}))}</b><div style="font-size:24px;margin:8px 0">${number(day.high)}°</div><small>${number(day.low)}° · ${weatherCodeText(day.code)}</small></div>`).join('');
    m.innerHTML=`<div class="screen-title">${t('weather')}</div><div class="card" style="overflow:hidden"><div style="padding:24px;background:linear-gradient(135deg,#0b7898,#20cde0);color:white"><div style="font-size:14px">${destination} · ${t('currentConditions')}</div><div style="font-size:58px;font-weight:900">${number(w.current.temperature_2m)}°</div><h2 style="margin:0">${weatherCodeText(w.current.weather_code)}</h2><p>${t('feelsLike')} ${number(w.current.apparent_temperature)}° · ${t('wind')} ${number(w.current.wind_speed_10m)} ${t('kmh')}</p><small>${t('updated')}: ${escapeHtml(String(w.current.time||'').replace('T',' '))} · Open-Meteo</small></div><div style="padding:18px 16px 0"><h3>${t('tripForecast')}</h3><p class="route-note">${t(note)}</p></div>${forecast.length?`<div style="display:flex;gap:10px;overflow:auto;padding:14px">${forecastHtml}</div>`:''}<div style="padding:0 16px 16px"><button class="btn ghost full" onclick="render()">${t('retry')}</button></div></div>`;
  }catch(error){
    if(current())m.innerHTML=`<div class="screen-title">${t('weather')}</div><div class="weather-empty card"><span>☀</span><h2>${destination}</h2><h3>${t('weatherUnavailable')}</h3><p>${t('connectionRetry')}</p><button class="btn primary full" onclick="render()">${t('retry')}</button></div>`;
  }
}

function currentExchange(){
  const base=CONFIG.exchange;
  if(!base||!/^[A-Z]{3}$/.test(base.from)||!/^[A-Z]{3}$/.test(base.to))return null;
  const valid=x=>x&&x.from===base.from&&x.to===base.to&&Number.isFinite(x.rate)&&x.rate>0&&!x.isExample&&/^\d{4}-\d{2}-\d{2}$/.test(x.asOf);
  const saved=readSaved('exchange_cache',null,valid);
  return (valid(sessionExchange)&&sessionExchange)||saved||(valid(base)&&base)||{from:base.from,to:base.to,rate:null,asOf:null,isExample:false};
}
function renderCurrency(m,autoRefresh=true){
  const x=currentExchange();
  if(!x){m.innerHTML=`<div class="screen-title">${t('currency')}</div>${emptyCard(t('noRate'))}`;return}
  const hasRate=Number.isFinite(x.rate)&&x.rate>0;
  m.innerHTML=`<div class="screen-title">${t('currency')}</div><div class="card currency-card"><label for="currAmt">${t('amount')}</label><input id="currAmt" class="input" type="number" inputmode="decimal" min="0" step="any" value="100"><div class="currency-row"><div class="money">${x.from}</div><span>⇄</span><div class="money">${x.to}</div></div><div id="currRes" class="result" aria-live="polite" dir="auto"></div><button class="btn primary full" onclick="convertCurrency()">${t('convert')}</button><button id="rateRefresh" class="btn ghost full" onclick="refreshExchange()">${t('refreshRate')}</button><p id="rateStatus" role="status"></p><p class="route-note">${hasRate?`${t('rateAsOf')}: ${escapeHtml(x.asOf)} · 1 ${x.from} = ${x.rate} ${x.to}`:t('rateWaiting')}</p><p class="route-note">${t('rateReference')}${x.source?' · '+escapeHtml(x.source):''}</p></div>`;
  convertCurrency();
  if(autoRefresh&&!hasRate)refreshExchange();
}
function convertCurrency(){
  const input=document.getElementById('currAmt'),out=document.getElementById('currRes');if(!input||!out)return;
  const raw=input.value.trim(),amount=Number(raw),x=currentExchange();
  if(!raw||!Number.isFinite(amount)||amount<0){out.textContent=message('הזינו סכום תקין שאינו שלילי.');return}
  if(!x||!Number.isFinite(x.rate)||x.rate<=0){out.textContent=t('rateWaiting');return}
  if(!Number.isFinite(amount*x.rate)){out.textContent=message('הזינו סכום תקין שאינו שלילי.');return}
  out.dir='ltr';out.textContent=`${new Intl.NumberFormat(LOCALE,{maximumFractionDigits:2}).format(amount)} ${x.from} = ${new Intl.NumberFormat(LOCALE,{minimumFractionDigits:2,maximumFractionDigits:2}).format(amount*x.rate)} ${x.to}`;
}
async function refreshExchange(){
  const x=currentExchange();if(!x)return;
  const button=document.getElementById('rateRefresh'),status=document.getElementById('rateStatus');
  if(!button||!status||button.disabled)return;button.disabled=true;status.textContent=t('rateLoading');
  try{
    const response=await fetchJSON('https://api.frankfurter.dev/v2/rate/'+x.from.toLowerCase()+'/'+x.to.toLowerCase());
    if(!Number.isFinite(response.rate)||response.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(response.date)||response.base?.toUpperCase()!==x.from||response.quote?.toUpperCase()!==x.to)throw Error('rate');
    const value={from:x.from,to:x.to,rate:response.rate,asOf:response.date,isExample:false,source:'Frankfurter'};
    sessionExchange=value;saveValue('exchange_cache',value);
    if(S.route==='currency'&&button.isConnected){const amount=document.getElementById('currAmt').value;renderCurrency(document.getElementById('main'),false);document.getElementById('currAmt').value=amount;convertCurrency()}
  }catch(error){if(status.isConnected)status.textContent=t('rateFailed')}
  finally{if(button.isConnected)button.disabled=false}
}

function renderChecklist(m){m.innerHTML=`<div class="screen-title">${t('checklist')}</div><div class="card checklist">${DATA.checklist.map((value,i)=>`<label class="check"><input type="checkbox" ${S.check[i]?'checked':''} onchange="S.check[${i}]=this.checked;saveValue('nav_check',S.check)"><span>${escapeHtml(value)}</span></label>`).join('')}</div>`}
function renderOffline(m){m.innerHTML=`<div class="screen-title">${t('offline')}</div><div class="offline-card"><div class="offline-symbol">↓</div><h2>${t('offlineTitle')}</h2><p>${t('offlineExplain')}</p>${['favorites','checklist'].map(key=>`<div class="offline-row"><span>${t(key)}</span><span class="checkmark">✓</span></div>`).join('')}<p>${t('offlineOnlineOnly')}</p><button class="btn primary full" onclick="toggleOffline()">${t('shortcutDownload')}</button></div>`}
function toggleOffline(){
  try{
    const candidate=window.NAVIGAM_PREVIEW_URL||('https://www.navigam.com/p/'+encodeURIComponent(CONFIG.code||''));
    const previewUrl=new URL(candidate);
    if(previewUrl.origin!=='https://www.navigam.com'||!/^\/p\/[A-Za-z0-9_-]+$/.test(previewUrl.pathname))throw Error('preview link');
    /* A shortcut contains a URL only. Customer JSON never leaves the server-authorized app. */
    const html=`<!doctype html><html lang="${LOCALE}" dir="${['he','ar'].includes(LOCALE)?'rtl':'ltr'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#073752"><title>NAVIGAM</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#eff8fb;color:#073752;font:18px/1.7 Arial,sans-serif}main{max-width:440px;margin:24px;padding:32px;border-radius:28px;background:white;text-align:center}h1{letter-spacing:4px}a{display:block;background:#073752;color:white;padding:16px;border-radius:18px;text-decoration:none}p{font-size:15px}</style><main><h1>NAVIGAM</h1><p>${escapeHtml(t('offlineExplain'))}</p><a href="${escapeHtml(previewUrl.href)}">${escapeHtml(t('shortcutOpen'))}</a><p>${escapeHtml(t('offlineOnlineOnly'))}</p></main></html>`;
    const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='NAVIGAM_SHORTCUT.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast(t('shortcutReady'));
  }catch(error){toast(t('shortcutFailed'))}
}

function aviaChat(){return `<div class="chat" id="chat" aria-live="polite"><div class="bubble">${t('aviaHello')}</div>${chatHistory.map(item=>`<div class="bubble ${item.me?'me':''}">${escapeHtml(item.text).replace(/\n/g,'<br>')}</div>`).join('')}</div><p class="route-note">${t('aviaDemo')}</p><div class="chat-shortcuts">${['itinerary','restaurants','places','changes','hotels','favorites'].map(key=>`<button class="btn ghost" onclick="answerAvia('${key}')">${t(key)}</button>`).join('')}<button class="btn primary" onclick="openAvia('translate')">${t('translate')}</button></div><div class="chatinput"><input id="askAvia" class="input" aria-label="${t('ask')}" placeholder="${t('ask')}" onkeydown="if(event.key==='Enter')askAvia()"><button onclick="askAvia()">${t('send')}</button></div>`}
function askAvia(){
  const input=document.getElementById('askAvia');if(!input)return;const q=input.value.trim();if(!q)return;
  let intent='help';
  if(/שינ|להחליף|לשנות|change|replace|slower|измен|замен|تعديل|تغيير|أبطأ/i.test(q))intent='changes';
  else if(/מסעד|אוכל|restaurant|food|eat|ресторан|поесть|مطعم|مطاعم|طعام|أكل/i.test(q))intent='restaurants';
  else if(/קרוב|מקומות|nearby|places|рядом|места|قريب|قريبة|أماكن/i.test(q))intent='places';
  else if(/היום|מסלול|today|itinerary|сегодня|маршрут|اليوم|مسار/i.test(q))intent='itinerary';
  else if(/מלון|מלונות|hotel|отел|فندق|فنادق/i.test(q))intent='hotels';
  else if(/מועדפ|שמור|saved|favorite|избран|محفوظ/i.test(q))intent='favorites';
  else if(/תרג|translat|перев|ترجم/i.test(q))intent='translate';
  appendChat(q,aviaAnswer(intent));input.value='';
}
function aviaAnswer(intent){
  const day=DATA.tripDays[S.day];
  if(intent==='itinerary'){
    if(!day||day.locked||!day.items?.length)return t('aviaLocked');
    return `${t('day')} ${S.day+1} · ${day.date} · ${day.title}\n`+day.items.map(item=>`${item.time||''} — ${item.title}`).join('\n');
  }
  if(intent==='hotels')return DATA.hotels.map(hotel=>`${hotel.name} · ${hotel.dates} · ${hotel.city}`).join('\n')||t('noHotels');
  if(intent==='favorites')return DATA.places.filter(place=>S.favorites.has(place.id)).map(place=>place.name).join('\n')||t('savedEmpty');
  if(intent==='changes')return t('aviaChanges');
  if(intent==='places'||intent==='restaurants'){
    const places=DATA.places.filter(place=>intent==='places'||['restaurant','restaurants','cafe','מסעדה','مطعم'].includes(String(place.type||place.category).toLowerCase()));
    return places.length?t('aviaRecommendations')+'\n'+places.slice(0,6).map(place=>`${place.name}${place.area?' · '+place.area:''}${place.tag?' — '+place.tag:''}`).join('\n'):t('noPlaces');
  }
  return t(intent==='translate'?'aviaTranslate':'aviaHelp');
}

function translationLanguageName(code){
  if(!code)return t('unknownLanguage');
  if(I18N[LOCALE][code])return I18N[LOCALE][code];
  try{return new Intl.DisplayNames([LOCALE],{type:'language'}).of(code)||String(code)}catch(error){return String(code)}
}
function speechRecognitionLocale(code){
  if(code===CONFIG.destination.language&&CONFIG.destination.speech_locale)return CONFIG.destination.speech_locale;
  return speechLocale[code]||code;
}
function translationPairAvailable(){
  const valid=code=>typeof code==='string'&&/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code);
  return CONFIG.features?.translate!==false&&valid(S.transSrc)&&valid(S.transDst)&&S.transSrc!==S.transDst;
}
function aviaTranslate(){if(!translationPairAvailable())return `<div class="translatehero"><div class="translatehero-icon">◎</div><div><h3>NAVIGAM Translate</h3></div></div>${emptyCard(t('translateUnavailable'))}`;return `<div class="translatehero"><div class="translatehero-icon">◎</div><div><h3>NAVIGAM Translate</h3><p>${t('translateDesc')}</p></div></div><div class="translatepair"><div class="lang"><small>${t('sourceLanguage')}</small><br>${escapeHtml(translationLanguageName(S.transSrc))}</div><button class="swap" aria-label="${t('swap')}" onclick="swapLang();openAvia('translate')">⇄</button><div class="lang"><small>${t('targetLanguage')}</small><br>${escapeHtml(translationLanguageName(S.transDst))}</div></div><textarea id="trIn" oninput="translationInputChanged()" class="input" dir="auto" aria-label="${t('inputText')}" placeholder="${t('inputText')}"></textarea><div class="twobtn"><button class="btn ghost" onclick="recognize('src')">🎙 ${escapeHtml(translationLanguageName(S.transSrc))}</button><button class="btn ghost" onclick="recognize('dst')">🎙 ${escapeHtml(translationLanguageName(S.transDst))}</button></div><button class="btn primary full" onclick="translateNow()">${t('translateNow')}</button><div id="trOut" class="result" dir="auto" aria-live="polite">${t('output')}</div><div class="twobtn"><button class="btn ghost" onclick="speakOut()">${t('listen')}</button><button class="btn soft" onclick="quickPhrase()">${t('phrase')}</button></div><div class="setting"><span>${t('continuous')}</span><button id="liveToggle" class="toggle ${S.live?'on':''}" role="switch" aria-label="${t('continuous')}" aria-checked="${S.live}" onclick="toggleLive()"></button></div><p class="route-note">${t('translationPrivacy')}</p>`}
function swapLang(){
  captureTranslation();const translated=translationValid?translationOutput:null;
  stopVoice();translationRequest++;[S.transSrc,S.transDst]=[S.transDst,S.transSrc];
  if(translated){translationDraft=translated;const input=document.getElementById('trIn');if(input)input.value=translated}
  translationOutput='';translationValid=false;translationLanguage=S.transDst;
  const out=document.getElementById('trOut');if(out)out.textContent=t('output');
}
function quickPhrase(){const input=document.getElementById('trIn');if(input){input.value=PHRASES[S.transSrc]||PHRASES.en;translationInputChanged()}}
async function translateNow(){
  const input=document.getElementById('trIn'),output=document.getElementById('trOut');if(!input||!output)return false;
  const q=input.value.trim();if(!q){toast('כתבו או דברו משפט');return false}
  if(new TextEncoder().encode(q).length>500){toast('הטקסט ארוך מדי. נסו משפט קצר יותר.');return false}
  const token=++translationRequest,src=S.transSrc,dst=S.transDst;
  if(!translationPairAvailable()){output.textContent=t('translateUnavailable');return false}
  translationDraft=q;translationValid=false;translationOutput='';output.textContent=message('מתרגם…');
  try{
    const response=await fetchJSON('https://api.mymemory.translated.net/get?'+new URLSearchParams({q,langpair:src+'|'+dst}));
    if(Number(response.responseStatus)!==200||response.quotaFinished||!response.responseData?.translatedText)throw Error('translation');
    if(token!==translationRequest||!output.isConnected)return false;
    /* Decode text entities without treating service output as HTML. */
    const text=document.createElement('textarea');text.innerHTML=String(response.responseData.translatedText).replace(/</g,'&lt;');
    translationOutput=text.value;translationLanguage=dst;translationValid=true;output.textContent=translationOutput;return true;
  }catch(error){if(token===translationRequest&&output.isConnected)output.textContent=message('התרגום לא זמין כרגע. בדקו חיבור או נסו שוב מאוחר יותר.');return false}
}
function speakOut(onDone){
  const done=()=>{if(typeof onDone==='function')onDone()};
  if(!translationValid){toast('תרגמו משפט לפני ההשמעה');done();return}
  if(!('speechSynthesis'in window)){toast('הדפדפן לא תומך בהקראה');done();return}
  const synthesis=window.speechSynthesis,voices=synthesis.getVoices(),language=String(translationLanguage).toLowerCase(),voice=voices.find(v=>v.lang.toLowerCase()===language)||voices.find(v=>v.lang.toLowerCase().split('-')[0]===language.split('-')[0]);
  if(voices.length&&!voice){toast('אין קול מותקן לשפה זו במכשיר. התרגום זמין בטקסט.');done();return}
  synthesis.cancel();const utterance=new SpeechSynthesisUtterance(translationOutput);
  utterance.lang=speechRecognitionLocale(translationLanguage);if(voice)utterance.voice=voice;
  utterance.onend=done;utterance.onerror=()=>{toast('לא ניתן להשמיע כרגע');stopVoice()};synthesis.speak(utterance);
}
function recognize(side){
  if(!translationPairAvailable()){toast(t('translateUnavailable'));return}
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){stopVoice();toast('זיהוי דיבור אינו נתמך בדפדפן זה; אפשר להקליד.');return}
  const conversation=S.live;stopVoice();S.live=conversation;
  if(side==='dst'){
    captureTranslation();translationRequest++;[S.transSrc,S.transDst]=[S.transDst,S.transSrc];translationOutput='';translationValid=false;translationLanguage=S.transDst;
    openAvia('translate');S.live=conversation;
  }
  updateLiveToggle();
  const generation=++voiceGeneration,r=new Recognition();recognition=r;r.lang=speechRecognitionLocale(S.transSrc);r.interimResults=false;r.continuous=false;
  let hadResult=false,failed=false;
  r.onstart=()=>toast('🎙 '+translationLanguageName(S.transSrc)+'…');
  r.onerror=event=>{failed=true;if(generation!==voiceGeneration)return;stopVoice();toast(event.error==='not-allowed'?'אין הרשאת מיקרופון. אפשר להקליד או לאשר בדפדפן.':'זיהוי הדיבור נעצר. אפשר לנסות שוב.')};
  r.onresult=async event=>{
    if(generation!==voiceGeneration)return;hadResult=true;
    const input=document.getElementById('trIn');if(!input)return;
    input.value=event.results[0][0].transcript;
    const ok=await translateNow();if(generation!==voiceGeneration)return;
    if(!ok){stopVoice();return}
    /* Conversation is turn-based: each speaker explicitly selects a microphone. */
    if(S.live)speakOut();
  };
  r.onend=()=>{if(generation!==voiceGeneration)return;recognition=null;if(!hadResult&&!failed&&S.live){stopVoice();toast('לא נקלט דיבור. לחצו שוב כדי להתחיל.')}};
  try{r.start()}catch(error){stopVoice();toast('לא ניתן להפעיל מיקרופון כרגע. פתחו בדפדפן תומך או הקלידו.')}
}
