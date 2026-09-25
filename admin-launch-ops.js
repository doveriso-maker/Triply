import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORE_URL='https://asnnvwoersrhrgdantll.supabase.co';
const CORE_KEY='sb_publishable_dZFP2IUafSBsNpsnc4e4Mw_rU0FQFJh';
const SUMIT_INVOICE_URL=`${CORE_URL}/functions/v1/triply-sumit-invoice`;
const supabase=createClient(CORE_URL,CORE_KEY,{auth:{detectSessionInUrl:false,persistSession:true,autoRefreshToken:true}});

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

async function adminSession(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.user) return null;
  const {data}=await supabase.from('admin_users').select('role').eq('user_id',session.user.id).maybeSingle();
  return data?session:null;
}

function installPaymentsPanel(){
  if(document.querySelector('#launchPayments')) return;
  const grid=document.querySelector('#app .grid');
  if(!grid) return;
  const wrap=document.createElement('section');
  wrap.id='launchPayments';
  wrap.className='card';
  wrap.style.marginTop='14px';
  wrap.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
      <div><h2 style="margin:0;font-size:18px">💳 תשלומים, חשבוניות וייצור</h2><div style="font-size:10px;color:#738a91;margin-top:4px">אימות PayBox → חשבונית מס/קבלה ב-SUMIT → תחילת ייצור</div></div>
      <button class="btn soft" id="refreshPayments">רענן</button>
    </div>
    <div id="paymentQueue" style="margin-top:10px"><div class="empty">טוען תשלומים…</div></div>`;
  grid.insertAdjacentElement('afterend',wrap);
  document.querySelector('#refreshPayments')?.addEventListener('click',loadPayments);
  loadPayments();
}

async function loadPayments(){
  const box=document.querySelector('#paymentQueue');
  if(!box) return;
  box.innerHTML='<div class="empty">טוען תשלומים…</div>';
  const {data,error}=await supabase.rpc('triply_admin_pending_whatsapp_payments');
  if(error){box.innerHTML=`<div class="empty">לא ניתן לטעון תשלומים: ${esc(error.message)}</div>`;return;}
  const rows=Array.isArray(data)?data:[];
  if(!rows.length){box.innerHTML='<div class="empty">אין כרגע תשלומים שממתינים לאישור ✅</div>';return;}
  box.innerHTML=rows.map(r=>{
    const ready=r.questionnaireReady===true;
    const qBadge=ready
      ? '<span style="display:inline-block;margin-top:7px;padding:5px 8px;border-radius:999px;background:#eaf8f1;color:#18845f;font-size:9px;font-weight:900">✓ שאלון מלא · Travel DNA מוכן</span>'
      : `<span style="display:inline-block;margin-top:7px;padding:5px 8px;border-radius:999px;background:#fff4df;color:#a86e2d;font-size:9px;font-weight:900">⏳ שאלון ${esc(r.questionnaireProgress||'חלקי')} · הייצור חסום</span>`;
    const action=ready
      ? `<button class="btn green" data-confirm-payment="${esc(r.id)}">✓ אשר תשלום + חשבונית + ייצור</button>`
      : '<button class="btn soft" disabled title="יש להשלים את שאלון TRIPLY לפני תחילת ייצור">ממתין להשלמת שאלון</button>';
    return `<article style="border:1px solid #dce9ec;border-radius:16px;padding:13px;margin-top:9px;background:#fff">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <strong>${esc(r.customerName||'לקוח')}</strong>
          <div style="font-size:10px;color:#738a91;line-height:1.7;margin-top:3px">${esc(r.customerPhone||'')} · ${esc(r.destination||'יעד לא צוין')}<br>${esc(r.tripName||'')} ${r.startDate?`· ${esc(r.startDate)}–${esc(r.endDate||'')}`:''} ${r.travelers?`· ${esc(r.travelers)}`:''}</div>
          ${qBadge}
        </div>
        ${action}
      </div>
    </article>`;
  }).join('');
  box.querySelectorAll('[data-confirm-payment]').forEach(btn=>btn.addEventListener('click',()=>confirmPayment(btn)));
}

async function confirmPayment(btn){
  if(!confirm('יש לאשר רק לאחר שווידאת בפועל שהתשלום התקבל ב-PayBox.\n\nבלחיצה יופקו חשבונית מס/קבלה ב-SUMIT, היא תישלח למייל הלקוח, ורק לאחר הצלחה יתחיל ייצור האפליקציה. להמשיך?')) return;
  const leadId=btn.dataset.confirmPayment;
  btn.disabled=true;btn.textContent='מפיק חשבונית ב-SUMIT…';
  try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token) throw new Error('אין סשן מנהל פעיל');
    const res=await fetch(SUMIT_INVOICE_URL,{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${session.access_token}`,
        'apikey':CORE_KEY,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({lead_id:leadId,action:'issue_and_confirm'})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok||!data?.ok){
      const messages={
        sumit_not_configured:'SUMIT עדיין לא מוגדרת במלואה. בדוק Company ID ומפתח פרטי ב-Supabase Secrets.',
        missing_customer_email:'חסר אימייל תקין ללקוח. יש להשלים אימייל לפני הפקת החשבונית.',
        questionnaire_incomplete:'שאלון TRIPLY עדיין לא הושלם.',
        payment_not_pending_verification:'התשלום אינו ממתין לאימות.',
        manual_sumit_reconciliation_required:'מצב החשבונית אינו ודאי. יש לבדוק ב-SUMIT לפני ניסיון נוסף.',
        sumit_result_uncertain:'לא התקבלה תשובה ודאית מ-SUMIT. אין לנסות שוב לפני שבודקים אם המסמך נוצר.',
        invoice_issue_in_progress:'הפקת החשבונית כבר בתהליך.',
        sumit_document_failed:'SUMIT דחתה את יצירת המסמך.'
      };
      throw new Error(messages[data?.error]||data?.detail||data?.error||`שגיאת SUMIT (${res.status})`);
    }
    const doc=data.document_number?`\nחשבונית מס/קבלה: ${data.document_number}`:'';
    const dup=data.duplicate_prevented?'\n(לא נוצר מסמך כפול)':'';
    alert(`בוצע בהצלחה ✅${doc}\nהמסמך נשלח למייל הלקוח.\nהתשלום אומת והטיול נכנס לייצור.${dup}`);
    await loadPayments();
    setTimeout(()=>location.reload(),500);
  }catch(err){
    alert('לא בוצע אישור תשלום.\n'+(err?.message||String(err)));
    btn.disabled=false;btn.textContent='✓ אשר תשלום + חשבונית + ייצור';
  }
}

async function createClientLink(tripCode){
  const {data:trip,error:tripError}=await supabase.from('trips').select('id,trip_code,title,status').eq('trip_code',tripCode).maybeSingle();
  if(tripError||!trip){alert('לא נמצא הטיול '+tripCode);return;}
  if(!confirm('יצירת קישור חדש תבטל קישור לקוח קודם לאותו טיול, אם קיים. להמשיך?')) return;
  const {data,error}=await supabase.rpc('triply_admin_create_client_link',{p_trip_id:trip.id,p_expiry_days:90});
  if(error||!data?.app_url){alert('לא ניתן ליצור קישור לקוח: '+(error?.message||'שגיאה לא ידועה'));return;}
  let copied=false;
  try{await navigator.clipboard.writeText(data.app_url);copied=true}catch{}
  window.prompt(copied?'קישור הלקוח נוצר והועתק ללוח ✅':'קישור הלקוח נוצר — העתק ושלח ללקוח:',data.app_url);
  location.reload();
}

function rewriteTripActions(){
  document.querySelectorAll('#trips a.btn.soft').forEach(a=>{
    const href=a.getAttribute('href')||'';
    const m=href.match(/^\/trip\/([^/?#]+)/);
    if(m){
      a.dataset.clientTripCode=decodeURIComponent(m[1]);
      a.href='#';
      a.textContent='🔗 צור קישור לקוח';
      a.title='יוצר קישור אישי מאובטח. קישור קודם יבוטל.';
    }
  });
  document.querySelectorAll('#trips [data-status][data-next="published"]').forEach(b=>{
    b.textContent='פרסם ללקוח + צור קישור';
    b.title='מסמן כפורסם ויוצר קישור אישי מאובטח';
  });
}

document.addEventListener('click',async e=>{
  const link=e.target.closest('[data-client-trip-code]');
  if(link){e.preventDefault();e.stopImmediatePropagation();await createClientLink(link.dataset.clientTripCode);return;}
  const publish=e.target.closest('[data-status][data-next="published"]');
  if(publish){e.preventDefault();e.stopImmediatePropagation();await createClientLink(publish.dataset.status);}
},true);

const observer=new MutationObserver(()=>{installPaymentsPanel();installAnalyticsPanel();rewriteTripActions();});
observer.observe(document.documentElement,{subtree:true,childList:true});

(async()=>{
  if(await adminSession()){
    installPaymentsPanel();
    installAnalyticsPanel();
    rewriteTripActions();
  }
})();


/* NAVIGAM Web Analytics dashboard */
let analyticsRangeDays=7;
let analyticsTimer=null;

function fmtNum(v){return new Intl.NumberFormat('he-IL',{maximumFractionDigits:2}).format(Number(v)||0)}
function fmtPct(v){return fmtNum(v)+'%'}
function fmtDuration(seconds){
  const s=Math.max(0,Math.round(Number(seconds)||0));
  if(s<60)return s+' שנ׳';
  const m=Math.floor(s/60),r=s%60;
  return m+' דק׳'+(r?' '+r+' שנ׳':'');
}
function analyticsRows(rows,labelKey,valueKey){
  const list=Array.isArray(rows)?rows:[];
  if(!list.length)return '<div class="empty">אין עדיין נתונים.</div>';
  const max=Math.max(...list.map(x=>Number(x[valueKey])||0),1);
  return '<div style="display:grid;gap:9px">'+list.slice(0,12).map(x=>{
    const val=Number(x[valueKey])||0,p=Math.max(3,Math.round(val/max*100));
    return '<div><div style="display:flex;justify-content:space-between;gap:10px;font-size:10px"><strong>'+esc(x[labelKey]||'—')+'</strong><span>'+fmtNum(val)+'</span></div><div style="height:7px;background:#eef5f7;border-radius:999px;overflow:hidden;margin-top:5px"><div style="height:100%;width:'+p+'%;background:linear-gradient(90deg,#0b7c90,#00cfdf);border-radius:999px"></div></div></div>';
  }).join('')+'</div>';
}
function liveRows(rows){
  const list=Array.isArray(rows)?rows:[];
  if(!list.length)return '<div class="empty">אין כרגע צופים פעילים.</div>';
  return '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr><th style="text-align:right;padding:8px">עמוד</th><th style="text-align:right;padding:8px">מקור</th><th style="text-align:right;padding:8px">מכשיר</th><th style="text-align:right;padding:8px">שפה</th><th style="text-align:right;padding:8px">זמן פעיל</th></tr></thead><tbody>'+list.map(x=>'<tr style="border-top:1px solid #e8f0f2"><td style="padding:8px">'+esc(x.path||'/')+'</td><td style="padding:8px">'+esc(x.source||'direct')+'</td><td style="padding:8px">'+esc(x.device||'—')+'</td><td style="padding:8px">'+esc(x.language||'—')+'</td><td style="padding:8px">'+esc(fmtDuration(x.activeSeconds))+'</td></tr>').join('')+'</tbody></table></div>';
}
function pageRows(rows){
  const list=Array.isArray(rows)?rows:[];
  if(!list.length)return '<div class="empty">אין עדיין נתוני עמודים.</div>';
  return '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr><th style="text-align:right;padding:8px">עמוד</th><th style="padding:8px">צפיות</th><th style="padding:8px">ביקורים</th><th style="padding:8px">WhatsApp</th></tr></thead><tbody>'+list.slice(0,15).map(x=>'<tr style="border-top:1px solid #e8f0f2"><td style="padding:8px">'+esc(x.path||'/')+'</td><td style="padding:8px;text-align:center">'+fmtNum(x.pageviews)+'</td><td style="padding:8px;text-align:center">'+fmtNum(x.sessions)+'</td><td style="padding:8px;text-align:center">'+fmtNum(x.whatsappClicks)+'</td></tr>').join('')+'</tbody></table></div>';
}
function dailyRows(rows){
  const list=Array.isArray(rows)?rows:[];
  if(!list.length)return '<div class="empty">אין עדיין היסטוריה.</div>';
  const max=Math.max(...list.map(x=>Number(x.sessions)||0),1);
  return '<div style="display:flex;align-items:flex-end;gap:5px;height:120px;padding-top:10px;overflow:auto">'+list.map(x=>{
    const h=Math.max(4,Math.round((Number(x.sessions)||0)/max*92));
    const d=String(x.day||'').slice(5);
    return '<div title="'+esc(d)+' · '+fmtNum(x.sessions)+' ביקורים" style="min-width:20px;flex:1;max-width:42px;text-align:center"><div style="height:'+h+'px;background:linear-gradient(180deg,#00cfdf,#0b7c90);border-radius:7px 7px 3px 3px"></div><small style="font-size:7px;color:#738a91">'+esc(d)+'</small></div>';
  }).join('')+'</div>';
}

function installAnalyticsPanel(){
  if(document.querySelector('#webAnalytics'))return;
  const payments=document.querySelector('#launchPayments');
  const tripsToolbar=document.querySelector('#app .toolbar');
  const anchor=payments||tripsToolbar;
  if(!anchor)return;
  const wrap=document.createElement('section');
  wrap.id='webAnalytics';
  wrap.className='card';
  wrap.style.marginTop='14px';
  wrap.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><h2 style="margin:0;font-size:18px">📊 NAVIGAM Analytics</h2><div style="font-size:10px;color:#738a91;margin-top:4px">תנועה באתר, זמן שהייה, מקורות והמרה ל-WhatsApp · נתונים אנונימיים</div></div>
      <div style="display:flex;gap:7px;align-items:center">
        <select id="analyticsRange" style="border:1px solid #cfe0e4;border-radius:10px;padding:8px;background:#fff">
          <option value="1">24 שעות</option><option value="7" selected>7 ימים</option><option value="30">30 ימים</option><option value="90">90 ימים</option>
        </select>
        <button class="btn soft" id="refreshAnalytics">רענן</button>
      </div>
    </div>
    <div id="analyticsBody" style="margin-top:12px"><div class="empty">טוען Analytics…</div></div>`;
  if(payments)payments.insertAdjacentElement('afterend',wrap); else anchor.insertAdjacentElement('beforebegin',wrap);
  document.querySelector('#analyticsRange')?.addEventListener('change',e=>{analyticsRangeDays=Number(e.target.value)||7;loadAnalytics()});
  document.querySelector('#refreshAnalytics')?.addEventListener('click',loadAnalytics);
  loadAnalytics();
  clearInterval(analyticsTimer);
  analyticsTimer=setInterval(()=>{if(!document.hidden&&document.querySelector('#webAnalytics'))loadAnalytics(true)},15000);
}

async function loadAnalytics(silent=false){
  const box=document.querySelector('#analyticsBody');
  if(!box)return;
  if(!silent)box.innerHTML='<div class="empty">טוען Analytics…</div>';
  const {data,error}=await supabase.rpc('triply_admin_web_analytics',{p_days:analyticsRangeDays});
  if(error||!data){box.innerHTML='<div class="empty">לא ניתן לטעון Analytics: '+esc(error?.message||'שגיאה')+'</div>';return}
  const live=data.live||{},today=data.today||{},p=data.period||{};
  box.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px" class="analytics-kpis">
      <div class="stat" style="border:2px solid #bfecef;background:#f1fcfd"><strong style="color:#087d8b">${fmtNum(live.activeNow)}</strong><span>צופים עכשיו</span></div>
      <div class="stat"><strong>${fmtNum(today.visitors)}</strong><span>מבקרים היום</span></div>
      <div class="stat"><strong>${fmtNum(today.sessions)}</strong><span>ביקורים היום</span></div>
      <div class="stat"><strong>${fmtNum(today.pageviews)}</strong><span>צפיות היום</span></div>
      <div class="stat"><strong>${fmtNum(today.whatsappClicks)}</strong><span>לחיצות WhatsApp היום</span></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px" class="analytics-kpis">
      <div class="stat"><strong>${fmtDuration(p.avgSessionSeconds)}</strong><span>זמן ממוצע באתר</span></div>
      <div class="stat"><strong>${fmtPct(p.whatsappCTR)}</strong><span>ביקורים שלחצו WhatsApp</span></div>
      <div class="stat"><strong>${fmtNum(p.avgPagesPerSession)}</strong><span>עמודים לביקור</span></div>
      <div class="stat"><strong>${fmtPct(p.bounceRate)}</strong><span>יציאה מהירה</span></div>
    </div>
    <div style="font-size:9px;color:#738a91;margin:10px 2px">בטווח: ${fmtNum(p.visitors)} מבקרים ייחודיים · ${fmtNum(p.sessions)} ביקורים · ${fmtNum(p.pageviews)} צפיות · ${fmtNum(p.whatsappClicks)} לחיצות WhatsApp</div>

    <div style="display:grid;grid-template-columns:1.15fr .85fr;gap:10px;margin-top:10px" class="analytics-two">
      <div class="match-card"><h3>👀 צופים פעילים עכשיו</h3>${liveRows(live.viewers)}</div>
      <div class="match-card"><h3>📈 ביקורים לפי יום</h3>${dailyRows(data.daily)}</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" class="analytics-three">
      <div class="match-card"><h3>🔗 מאיפה הגיעו</h3>${analyticsRows(data.sources,'source','sessions')}</div>
      <div class="match-card"><h3>📱 מכשירים</h3>${analyticsRows(data.devices,'device','sessions')}</div>
      <div class="match-card"><h3>🌐 שפות</h3>${analyticsRows(data.languages,'language','sessions')}</div>
      <div class="match-card"><h3>🧭 דפדפנים</h3>${analyticsRows(data.browsers,'browser','sessions')}</div>
      <div class="match-card"><h3>💻 מערכות הפעלה</h3>${analyticsRows(data.os,'os','sessions')}</div>
      <div class="match-card"><h3>🎯 מקורות שהביאו WhatsApp</h3>${analyticsRows((data.sources||[]).filter(x=>Number(x.whatsappClicks)>0),'source','whatsappClicks')}</div>
    </div>
    <div class="match-card"><h3>📄 עמודים מובילים</h3>${pageRows(data.pages)}</div>
    <div class="notice">מקור תנועה מזוהה לפי UTM, referrer או מזהי קמפיין זמינים (למשל fbclid/ttclid/gclid). כאשר אפליקציה או דפדפן מסתירים את המקור, הביקור מסומן Direct — המערכת לא מנחשת.</div>
  `;
  if(!document.querySelector('#analyticsResponsive')){
    const style=document.createElement('style');style.id='analyticsResponsive';
    style.textContent='@media(max-width:760px){.analytics-kpis{grid-template-columns:1fr 1fr!important}.analytics-two,.analytics-three{grid-template-columns:1fr!important}}';
    document.head.append(style);
  }
}
