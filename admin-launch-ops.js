import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORE_URL='https://asnnvwoersrhrgdantll.supabase.co';
const CORE_KEY='sb_publishable_dZFP2IUafSBsNpsnc4e4Mw_rU0FQFJh';
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
      <div><h2 style="margin:0;font-size:18px">💳 תשלומים וייצור</h2><div style="font-size:10px;color:#738a91;margin-top:4px">אימות PayBox רק לאחר השלמת שאלון TRIPLY המלא</div></div>
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
      ? `<button class="btn green" data-confirm-payment="${esc(r.id)}">✓ אשר תשלום והתחל ייצור</button>`
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
  if(!confirm('יש לאשר רק לאחר שווידאת בפועל שהתשלום התקבל ב-PayBox. המערכת תאשר רק אם שאלון TRIPLY המלא הושלם. להמשיך?')) return;
  const leadId=btn.dataset.confirmPayment;
  btn.disabled=true;btn.textContent='מאמת שאלון ותשלום…';
  const {data,error}=await supabase.rpc('triply_admin_confirm_whatsapp_payment',{p_lead_id:leadId});
  if(error){alert('לא ניתן לאשר תשלום: '+error.message);btn.disabled=false;btn.textContent='✓ אשר תשלום והתחל ייצור';return;}
  alert(`התשלום אושר ✅\nשאלון TRIPLY אומת. Trip ${data?.trip_code||''} נכנס לייצור אוטומטי.`);
  await loadPayments();
  setTimeout(()=>location.reload(),400);
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

const observer=new MutationObserver(()=>{installPaymentsPanel();rewriteTripActions();});
observer.observe(document.documentElement,{subtree:true,childList:true});

(async()=>{
  if(await adminSession()){
    installPaymentsPanel();
    rewriteTripActions();
  }
})();
