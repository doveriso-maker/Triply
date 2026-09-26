(function(){
  var ENDPOINT='https://asnnvwoersrhrgdantll.supabase.co/functions/v1/triply-web-chat';
  var chat=document.getElementById('avia');
  var messages=document.getElementById('aviaMessages');
  var form=document.getElementById('aviaForm');
  var input=document.getElementById('aviaInput');
  var status=document.getElementById('aviaStatus');
  var minBtn=chat&&chat.querySelector('.avia-min');
  var navBtn=document.querySelector('.hamb');
  var nav=document.querySelector('.nav-links');
  var conversationId=null;
  var starting=null;

  try{conversationId=sessionStorage.getItem('navigam_web_chat_v1')||null}catch(e){}

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
  }
  function addMessage(role,text){
    if(!messages||!text)return;
    var el=document.createElement('div');
    el.className='message '+(role==='user'?'user-msg':'avia-msg');
    el.innerHTML=escapeHtml(text).replace(/\n/g,'<br>');
    messages.appendChild(el);
    messages.scrollTop=messages.scrollHeight;
  }
  function setStatus(text){if(status)status.textContent=text||''}
  async function api(payload){
    var r=await fetch(ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      credentials:'omit'
    });
    var data=await r.json().catch(function(){return {}});
    if(!r.ok||!data.ok)throw new Error(data.error||'request_failed');
    return data;
  }
  async function ensureConversation(){
    if(conversationId)return conversationId;
    if(starting)return starting;
    starting=api({action:'start',language:document.documentElement.lang||'he',page_path:location.pathname})
      .then(function(data){
        conversationId=data.conversation_id;
        try{sessionStorage.setItem('navigam_web_chat_v1',conversationId)}catch(e){}
        if(Array.isArray(data.history)){
          data.history.forEach(function(m){
            var t=String(m&&m.content||'').trim();
            if(t)addMessage(m.role==='user'?'user':'assistant',t);
          });
        }
        return conversationId;
      })
      .finally(function(){starting=null});
    return starting;
  }
  async function send(text){
    text=String(text||'').trim();
    if(!text)return;
    addMessage('user',text);
    if(input){input.value='';input.disabled=true}
    setStatus('אביה חושבת...');
    try{
      var id=await ensureConversation();
      var data=await api({action:'message',conversation_id:id,message:text});
      addMessage('assistant',data.message||'אני כאן. ספרו לי עוד קצת על הטיול שאתם רוצים.');
      setStatus('');
    }catch(e){
      setStatus('לא הצלחתי להתחבר כרגע. נסו שוב בעוד רגע.');
    }finally{
      if(input){input.disabled=false;input.focus()}
    }
  }
  function openChat(){
    if(!chat)return;
    chat.classList.remove('minimized');
    if(window.matchMedia('(max-width:560px)').matches){
      chat.classList.add('mobile-overlay');
      document.body.classList.add('chat-focus');
    }else{
      chat.classList.remove('mobile-overlay');
      chat.scrollIntoView({behavior:'smooth',block:'center'});
    }
    setTimeout(function(){if(input)input.focus()},350);
    ensureConversation().catch(function(){});
  }
  function closeOrMinimize(){
    if(!chat)return;
    if(chat.classList.contains('mobile-overlay')){
      chat.classList.remove('mobile-overlay');
      document.body.classList.remove('chat-focus');
      return;
    }
    chat.classList.toggle('minimized');
  }

  document.querySelectorAll('[data-open-avia]').forEach(function(b){b.addEventListener('click',openChat)});
  document.querySelectorAll('[data-quick]').forEach(function(b){b.addEventListener('click',function(){send(b.getAttribute('data-quick'))})});
  if(form)form.addEventListener('submit',function(e){e.preventDefault();send(input&&input.value)});
  if(minBtn)minBtn.addEventListener('click',closeOrMinimize);

  if(navBtn&&nav){
    navBtn.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      navBtn.setAttribute('aria-expanded',open?'true':'false');
    });
    nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');navBtn.setAttribute('aria-expanded','false')})});
  }

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&chat&&chat.classList.contains('mobile-overlay'))closeOrMinimize();
  });
})();