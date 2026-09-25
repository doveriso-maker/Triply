
(function(){
  var b=document.querySelector('.hamb'), n=document.querySelector('.nav-links');
  if(b&&n)b.addEventListener('click',function(){n.classList.toggle('open');b.setAttribute('aria-expanded',n.classList.contains('open'));});
  document.querySelectorAll('.nav-links a').forEach(function(a){a.addEventListener('click',function(){if(n)n.classList.remove('open')})});
  try{
    !function(w,d,t){w.TiktokAnalyticsObject=t;var q=w[t]=w[t]||[];q.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],q.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<q.methods.length;i++)q.setAndDefer(q,q.methods[i]);q.instance=function(t){for(var e=q._i[t]||[],n=0;n<q.methods.length;n++)q.setAndDefer(e,q.methods[n]);return e},q.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";q._i=q._i||{},q._i[e]=[],q._i[e]._u=r,q._t=q._t||{},q._t[e]=+new Date,q._o=q._o||{},q._o[e]=n||{};var s=d.createElement("script");s.type="text/javascript";s.async=!0;s.src=r+"?sdkid="+e+"&lib="+t;var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x)};q.load("DAIGL6RC77UC8FLK30DG");q.page()}(window,document,"ttq");
  }catch(e){}
})();


/* NAVIGAM first-party anonymous web analytics */
(function(){
  var ENDPOINT='https://asnnvwoersrhrgdantll.supabase.co/functions/v1/triply-web-analytics';
  if(location.hostname!=='www.navigam.com'&&location.hostname!=='navigam.com'&&location.hostname!=='mytriply.co.il'&&location.hostname!=='www.mytriply.co.il')return;
  if(navigator.webdriver)return;

  function uid(){
    try{return crypto.randomUUID()}catch(e){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)})}
  }
  function store(storage,key){
    try{var v=storage.getItem(key);if(!v){v=uid();storage.setItem(key,v)}return v}catch(e){return uid()}
  }
  var visitorId=store(localStorage,'nav_analytics_visitor_v1');
  var sessionId=store(sessionStorage,'nav_analytics_session_v1');
  var entryPath=location.pathname;
  var started=performance.now(),lastTick=started,activeMs=0;
  var q=new URLSearchParams(location.search);
  var refHost='';
  try{refHost=document.referrer?new URL(document.referrer).hostname.toLowerCase():''}catch(e){}

  function source(){
    var s=(q.get('utm_source')||'').toLowerCase();
    if(s)return s.slice(0,100);
    if(q.get('ttclid'))return 'tiktok';
    if(q.get('gclid'))return 'google';
    if(q.get('fbclid'))return 'meta';
    if(/(^|\.)instagram\.com$/.test(refHost)||refHost==='l.instagram.com')return 'instagram';
    if(/(^|\.)facebook\.com$/.test(refHost)||refHost==='l.facebook.com'||refHost==='lm.facebook.com')return 'facebook';
    if(/(^|\.)tiktok\.com$/.test(refHost))return 'tiktok';
    if(/(^|\.)google\./.test(refHost))return 'google';
    if(/(^|\.)bing\.com$/.test(refHost))return 'bing';
    if(/(^|\.)youtube\.com$/.test(refHost)||refHost==='youtu.be')return 'youtube';
    return refHost?refHost.replace(/^www\./,''):'direct';
  }
  function device(){
    var ua=navigator.userAgent||'';
    if(/iPad|Tablet|PlayBook|Silk/i.test(ua)||(/Android/i.test(ua)&&!/Mobile/i.test(ua)))return 'tablet';
    if(/Mobi|Android|iPhone|iPod/i.test(ua))return 'mobile';
    return 'desktop';
  }
  function browser(){
    var ua=navigator.userAgent||'';
    if(/SamsungBrowser/i.test(ua))return 'Samsung Internet';
    if(/Edg\//i.test(ua))return 'Edge';
    if(/OPR\//i.test(ua))return 'Opera';
    if(/Firefox\//i.test(ua))return 'Firefox';
    if(/CriOS|Chrome\//i.test(ua))return 'Chrome';
    if(/Safari\//i.test(ua))return 'Safari';
    return 'Other';
  }
  function os(){
    var ua=navigator.userAgent||'';
    if(/iPhone|iPad|iPod/i.test(ua))return 'iOS';
    if(/Android/i.test(ua))return 'Android';
    if(/Windows/i.test(ua))return 'Windows';
    if(/Mac OS X|Macintosh/i.test(ua))return 'macOS';
    if(/Linux/i.test(ua))return 'Linux';
    return 'Other';
  }
  function tick(){
    var now=performance.now();
    if(!document.hidden)activeMs+=Math.max(0,Math.min(now-lastTick,30000));
    lastTick=now;
  }
  function payload(type,target){
    tick();
    return {
      visitor_id:visitorId,session_id:sessionId,event_type:type,
      path:location.pathname,page_title:document.title,language:(document.documentElement.lang||navigator.language||'').slice(0,16),
      referrer_host:refHost,traffic_source:source(),traffic_medium:(q.get('utm_medium')||'').slice(0,100),
      utm_campaign:(q.get('utm_campaign')||'').slice(0,255),utm_content:(q.get('utm_content')||'').slice(0,255),utm_term:(q.get('utm_term')||'').slice(0,255),
      device_type:device(),browser:browser(),os:os(),viewport_width:innerWidth,viewport_height:innerHeight,
      screen_width:screen.width,screen_height:screen.height,active_ms:Math.round(activeMs),entry_path:entryPath,
      visible:!document.hidden,target:target||null
    };
  }
  function send(type,target,beacon){
    var body=JSON.stringify(payload(type,target));
    if(beacon&&navigator.sendBeacon){
      try{return navigator.sendBeacon(ENDPOINT,new Blob([body],{type:'text/plain;charset=UTF-8'}))}catch(e){}
    }
    try{fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:body,keepalive:true,mode:'cors',credentials:'omit'}).catch(function(){})}catch(e){}
  }

  send('page_view');
  var heartbeat=setInterval(function(){if(!document.hidden)send('heartbeat')},15000);
  document.addEventListener('visibilitychange',function(){tick();if(!document.hidden)send('heartbeat')});
  window.addEventListener('pagehide',function(){clearInterval(heartbeat);send('page_exit',null,true)},{once:true});

  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
    if(!a)return;
    var href=a.getAttribute('href')||'';
    if(/(?:wa\.me|api\.whatsapp\.com)/i.test(href)){
      var label=(a.dataset.analyticsLabel||a.textContent||'whatsapp').replace(/\s+/g,' ').trim().slice(0,64);
      send('whatsapp_click',label,true);
      try{if(window.ttq&&ttq.track)ttq.track('Contact',{content_name:'WhatsApp CTA'})}catch(err){}
    }
  },true);
})();
