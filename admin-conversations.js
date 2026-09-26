import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORE_URL='https://asnnvwoersrhrgdantll.supabase.co';
const CORE_KEY='sb_publishable_dZFP2IUafSBsNpsnc4e4Mw_rU0FQFJh';
const API=CORE_URL+'/functions/v1/navigam-admin-conversations';
const sb=createClient(CORE_URL,CORE_KEY,{auth:{detectSessionInUrl:false,persistSession:true,autoRefreshToken:true}});

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let rows=[], filter='all', search='', refreshTimer=null;

function injectStyles(){
  const style=document.createElement('style');
  style.textContent=`
  .conv-nav-btn{background:#eaf7f9!important;color:#0b7183!important}
  .conv-panel{display:none;margin-top:16px}
  .conv-panel.show{display:block}
  .conv-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:6px 0 14px}
  .conv-head h2{margin:0;font-size:20px}
  .conv-head p{margin:3px 0 0;font-size:10px;color:var(--muted)}
  .conv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
  .conv-stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:13px}
  .conv-stat strong{display:block;font-size:22px}.conv-stat span{font-size:9px;color:var(--muted)}
  .conv-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}
  .conv-tools input{flex:1;min-width:220px;border:1px solid #cfe0e4;border-radius:12px;padding:10px 12px;background:#fff;outline:none}
  .conv-filter{border:1px solid #d9e8eb;background:#fff;color:#55717a;border-radius:999px;padding:8px 11px;font-weight:800;font-size:10px}
  .conv-filter.active{background:#0b7c90;color:#fff;border-color:#0b7c90}
  .conv-list{display:grid;gap:10px}
  .conv-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;box-shadow:0 8px 24px rgba(17,74,88,.05)}
  .conv-title{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:5px}
  .conv-title b{font-size:14px}
  .source-badge,.heat-badge,.stage-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:8px;font-weight:900}
  .source-badge.web{background:#eaf5ff;color:#2a6995}.source-badge.wa{background:#e9f8f1;color:#18825f}
  .heat-badge.hot{background:#ffe8e4;color:#bb4939}.heat-badge.warm{background:#fff3d9;color:#9a6a12}.heat-badge.new{background:#eef4f6;color:#617780}
  .stage-badge{background:#f1ecff;color:#6c4b9a}
  .conv-meta{font-size:10px;line-height:1.65;color:var(--muted)}
  .conv-actions{display:flex;gap:6px;flex-wrap:wrap}
  .conv-modal{position:fixed;inset:0;background:rgba(8,32,40,.5);display:none;align-items:flex-end;justify-content:center;padding:12px;z-index:80}
  .conv-modal.show{display:flex}
  .conv-sheet{width:min(720px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:24px;padding:18px;box-shadow:0 30px 80px rgba(0,0,0,.25)}
  .conv-sheethead{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:-18px;background:#fff;padding:10px 0 12px;z-index:2}
  .conv-sheethead h3{margin:0;font-size:18px}
  .conv-transcript{display:grid;gap:9px;margin-top:10px}
  .conv-msg{max-width:86%;border-radius:15px;padding:10px 12px;font-size:12px;line-height:1.55;white-space:pre-wrap}
  .conv-msg.user{justify-self:start;background:#0b7c90;color:#fff;border-top-left-radius:4px}
  .conv-msg.assistant{justify-self:end;background:#eef7f9;color:#244b59;border-top-right-radius:4px}
  .conv-empty{text-align:center;padding:28px;border:1px dashed #cbdde1;border-radius:16px;color:var(--muted);font-size:11px}
  @media(max-width:700px){.conv-stats{grid-template-columns:1fr 1fr}.conv-card{grid-template-columns:1fr}.conv-actions{justify-content:flex-start}.conv-tools input{min-width:100%}}
  `;
  document.head.appendChild(style);
}

function ensureUI(){
  if($('#customerConversations'))return;
  injectStyles();
  const actions=$('.top .actions');
  if(actions){
    const btn=document.createElement('button');
    btn.className='btn soft conv-nav-btn';
    btn.id='openConversations';
    btn.textContent='💬 שיחות לקוחות';
    actions.insertBefore(btn,actions.firstChild);
  }

  const app=$('#app');
  const panel=document.createElement('section');
  panel.id='customerConversations';
  panel.className='conv-panel';
  panel.innerHTML=`
    <div class="conv-head">
      <div><h2>שיחות לקוחות</h2><p>אתר + WhatsApp במקום אחד · מתעדכן אוטומטית</p></div>
      <div class="actions"><button class="btn soft" id="convRefresh">↻ רענון</button><button class="btn soft" id="backToTrips">← חזרה לטיולים</button></div>
    </div>
    <div class="conv-stats">
      <div class="conv-stat"><strong id="convStatAll">0</strong><span>כל השיחות</span></div>
      <div class="conv-stat"><strong id="convStatWeb">0</strong><span>שיחות מהאתר</span></div>
      <div class="conv-stat"><strong id="convStatWa">0</strong><span>WhatsApp</span></div>
      <div class="conv-stat"><strong id="convStatHot">0</strong><span>לידים חמים</span></div>
    </div>
    <div class="conv-tools">
      <button class="conv-filter active" data-conv-filter="all">הכול</button>
      <button class="conv-filter" data-conv-filter="website">אתר</button>
      <button class="conv-filter" data-conv-filter="whatsapp">WhatsApp</button>
      <input id="convSearch" placeholder="חיפוש לפי שם, טלפון או יעד">
    </div>
    <div id="convList" class="conv-list"><div class="conv-empty">פתח את המסך כדי לטעון שיחות.</div></div>
  `;
  app.appendChild(panel);

  const modal=document.createElement('div');
  modal.id='convModal';
  modal.className='conv-modal';
  modal.innerHTML=`<div class="conv-sheet">
    <div class="conv-sheethead"><div><h3 id="convModalTitle">שיחה</h3><div id="convModalMeta" class="conv-meta"></div></div><button class="btn soft" id="convClose">✕</button></div>
    <div id="convTranscript" class="conv-transcript"><div class="conv-empty">טוען…</div></div>
  </div>`;
  document.body.appendChild(modal);

  $('#openConversations')?.addEventListener('click',showConversations);
  $('#backToTrips')?.addEventListener('click',showTrips);
  $('#convRefresh')?.addEventListener('click',loadConversations);
  $('#convSearch')?.addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();render()});
  document.querySelectorAll('[data-conv-filter]').forEach(b=>b.addEventListener('click',()=>{
    filter=b.dataset.convFilter||'all';
    document.querySelectorAll('[data-conv-filter]').forEach(x=>x.classList.toggle('active',x===b));
    render();
  }));
  $('#convClose')?.addEventListener('click',()=>$('#convModal').classList.remove('show'));
  $('#convModal')?.addEventListener('click',e=>{if(e.target.id==='convModal')$('#convModal').classList.remove('show')});
}

function tripsElements(){
  const grid=$('#app > .grid');
  const toolbar=$('#app > .toolbar');
  const trips=$('#trips');
  return [grid,toolbar,trips].filter(Boolean);
}
function showConversations(){
  ensureUI();
  tripsElements().forEach(el=>el.style.display='none');
  $('#customerConversations').classList.add('show');
  loadConversations();
  clearInterval(refreshTimer);
  refreshTimer=setInterval(()=>{if($('#customerConversations')?.classList.contains('show'))loadConversations(true)},30000);
}
function showTrips(){
  clearInterval(refreshTimer);refreshTimer=null;
  $('#customerConversations')?.classList.remove('show');
  tripsElements().forEach(el=>el.style.display='');
}

async function callApi(payload){
  const {data:{session}}=await sb.auth.getSession();
  if(!session?.access_token)throw new Error('not_authenticated');
  const r=await fetch(API,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
    body:JSON.stringify(payload)
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.ok)throw new Error(data.error||'api_failed');
  return data;
}

function fmtDate(v){
  if(!v)return '';
  const d=new Date(String(v).replace(' ','T')+'Z');
  if(Number.isNaN(d.getTime()))return String(v);
  return d.toLocaleString('he-IL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function displayName(r){
  if(r.customer_name)return r.customer_name;
  if(r.customer_phone)return r.customer_phone;
  return r.source==='website'?'מבקר באתר':'לקוח';
}
function heatLabel(h){return h==='hot'?'חם':h==='warm'?'מתקדם':'חדש'}

async function loadConversations(silent=false){
  const list=$('#convList');
  if(!silent&&list)list.innerHTML='<div class="conv-empty">טוען שיחות…</div>';
  try{
    const data=await callApi({action:'list',per_page:80});
    rows=data.data||[];
    $('#convStatAll').textContent=data.stats?.total||0;
    $('#convStatWeb').textContent=data.stats?.website||0;
    $('#convStatWa').textContent=data.stats?.whatsapp||0;
    $('#convStatHot').textContent=data.stats?.hot||0;
    render();
  }catch(e){
    if(list)list.innerHTML='<div class="conv-empty">לא ניתן לטעון כרגע את השיחות.</div>';
  }
}
function render(){
  const list=$('#convList');if(!list)return;
  const filtered=rows.filter(r=>{
    if(filter!=='all'&&r.source!==filter)return false;
    if(!search)return true;
    const hay=[r.customer_name,r.customer_phone,r.destination,r.stage?.label,r.source_label].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(search);
  });
  if(!filtered.length){list.innerHTML='<div class="conv-empty">אין שיחות שמתאימות לסינון.</div>';return}
  list.innerHTML=filtered.map(r=>`
    <article class="conv-card">
      <div>
        <div class="conv-title">
          <b>${esc(displayName(r))}</b>
          <span class="source-badge ${r.source==='website'?'web':'wa'}">${esc(r.source_label)}</span>
          <span class="heat-badge ${esc(r.stage?.heat||'new')}">${esc(heatLabel(r.stage?.heat))}</span>
          <span class="stage-badge">${esc(r.stage?.label||'חדש')}</span>
        </div>
        <div class="conv-meta">
          ${r.customer_phone?esc(r.customer_phone)+' · ':''}${r.destination?'יעד: '+esc(r.destination)+' · ':''}${r.page_path?'עמוד: '+esc(r.page_path)+' · ':''}
          ${esc(r.message_count)} הודעות · פעילות אחרונה ${esc(fmtDate(r.updated_at))}
          ${r.preview_sent?' · Preview נשלח':''}${r.order_ready?' · הזמנה מוכנה':''}${r.human_handoff?' · ביקש נציג':''}
        </div>
      </div>
      <div class="conv-actions">
        <button class="btn primary" data-open-conv="${esc(r.id)}">פתח תמלול</button>
      </div>
    </article>`).join('');
  document.querySelectorAll('[data-open-conv]').forEach(b=>b.addEventListener('click',()=>openConversation(b.dataset.openConv)));
}
async function openConversation(id){
  const row=rows.find(r=>r.id===id);
  $('#convModalTitle').textContent=displayName(row||{});
  $('#convModalMeta').textContent=(row?.source_label||'')+(row?.customer_phone?' · '+row.customer_phone:'')+(row?.destination?' · '+row.destination:'');
  $('#convTranscript').innerHTML='<div class="conv-empty">טוען תמלול…</div>';
  $('#convModal').classList.add('show');
  try{
    const data=await callApi({action:'get',conversation_id:id});
    const h=data.history||[];
    $('#convTranscript').innerHTML=h.length?h.map(m=>`<div class="conv-msg ${m.role==='user'?'user':'assistant'}">${esc(m.content)}</div>`).join(''):'<div class="conv-empty">אין הודעות בשיחה.</div>';
  }catch(e){
    $('#convTranscript').innerHTML='<div class="conv-empty">לא ניתן לטעון את התמלול.</div>';
  }
}

ensureUI();
